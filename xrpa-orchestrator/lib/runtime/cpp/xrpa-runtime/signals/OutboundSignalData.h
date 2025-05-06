/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#pragma once

#include <xrpa-runtime/reconciler/DataStoreInterfaces.h>
#include <xrpa-runtime/signals/SignalShared.h>
#include <xrpa-runtime/utils/XrpaTypes.h>
#include <chrono>
#include <functional>

namespace Xrpa {

template <typename T>
using SignalProducerCallback =
    std::function<void(SignalChannelData<T> dataOut, int32_t framesPerSecond, uint64_t startFrame)>;

class OutboundSignalData {
 public:
  template <typename T>
  void setSignalSource(
      SignalProducerCallback<T> source,
      int32_t numChannels,
      int32_t framesPerSecond,
      int32_t framesPerPacket) {
    // wrapper lambda for the type cast, =(
    signalSource_ = [source, this](SignalPacket& packet) {
      source(packet.accessChannelData<T>(), framesPerSecond_, curReadPos_);
    };

    setSignalSourceShared<T>(numChannels, framesPerSecond, framesPerPacket);
  }

  template <typename T>
  void setSignalSource(
      SignalRingBuffer<T>* ringBuffer,
      int32_t numChannels,
      int32_t framesPerSecond,
      int32_t framesPerPacket) {
    signalSource_ = [ringBuffer](SignalPacket& packet) {
      packet.accessChannelData<T>().consumeFromRingBuffer(ringBuffer);
    };

    setSignalSourceShared<T>(numChannels, framesPerSecond, framesPerPacket);
  }

  void setRecipient(const ObjectUuid& id, IObjectCollection* collection, int32_t messageType) {
    id_ = id;
    collection_ = collection;
    messageType_ = messageType;
  }

  void tick() {
    auto endTime = std::chrono::high_resolution_clock::now();
    for (auto frameCount = getNextFrameCount(endTime); frameCount > 0;
         frameCount = getNextFrameCount(endTime)) {
      if (signalSource_ && collection_) {
        auto packet =
            sendSignalPacket(sampleSize_, frameCount, sampleType_, numChannels_, framesPerSecond_);
        signalSource_(packet);
      }

      curReadPos_ += frameCount;
    }
  }

  // caller is responsible for filling in the channel data
  [[nodiscard]] SignalPacket sendSignalPacket(
      int32_t sampleSize,
      int32_t frameCount,
      int32_t sampleType,
      int32_t numChannels,
      int32_t framesPerSecond) {
    auto packet = SignalPacket(collection_->sendMessage(
        id_, messageType_, SignalPacket::calcPacketSize(numChannels, sampleSize, frameCount)));
    packet.setFrameCount(frameCount);
    packet.setSampleType(sampleType);
    packet.setNumChannels(numChannels);
    packet.setFrameRate(framesPerSecond);
    return packet;
  }

 private:
  ObjectUuid id_;
  IObjectCollection* collection_ = nullptr;
  int32_t messageType_ = 0;

  std::function<void(SignalPacket& packet)> signalSource_ = nullptr;
  int32_t sampleType_ = 0;
  int32_t sampleSize_ = 4;
  int32_t numChannels_ = 1;
  int32_t framesPerSecond_ = 0;
  int32_t framesPerPacket_ = 1024;

  // internal state management
  uint64_t curReadPos_ = 0;
  std::chrono::high_resolution_clock::time_point prevFrameStartTime_;

  template <typename T>
  void
  setSignalSourceShared(int32_t numChannels, int32_t framesPerSecond, int32_t framesPerPacket) {
    sampleType_ = SignalTypeInference::inferSampleType<T>();
    sampleSize_ = sizeof(T);
    numChannels_ = numChannels;
    framesPerSecond_ = framesPerSecond;
    framesPerPacket_ = framesPerPacket;

    prevFrameStartTime_ = std::chrono::high_resolution_clock::now();
  }

  int getNextFrameCount(std::chrono::high_resolution_clock::time_point endTime) {
    if (!framesPerSecond_) {
      return 0;
    }

    auto deltaTime =
        std::chrono::duration_cast<std::chrono::microseconds>(endTime - prevFrameStartTime_);

    // generate signal in fixed-size packets of data
    auto frameCount = deltaTime.count() < 0 ? 0 : framesPerPacket_;

    // do NOT set to now(), as that will lead to accumulation of error
    prevFrameStartTime_ += std::chrono::microseconds(frameCount * 1000000 / framesPerSecond_);

    return frameCount;
  }
};

} // namespace Xrpa
