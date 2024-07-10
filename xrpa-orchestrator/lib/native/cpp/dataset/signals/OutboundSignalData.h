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

#include <dataset/core/DatasetTypes.h>
#include <dataset/signals/SignalShared.h>
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
      int32_t framesPerCallback) {
    // wrapper lambda for the type cast, =(
    signalSource_ = [source, this](SignalPacket& packet) {
      source(packet.accessChannelData<T>(), framesPerSecond_, curReadPos_);
    };

    sampleType_ = inferSampleType<T>();
    sampleSize_ = sizeof(T);
    numChannels_ = numChannels;
    framesPerSecond_ = framesPerSecond;
    framesPerCallback_ = framesPerCallback;

    prevFrameStartTime_ = std::chrono::high_resolution_clock::now();
  }

  // caller is responsible for filling in the channel data
  template <typename MessageSender, typename SampleType>
  SignalChannelData<SampleType> sendSignalData(
      const DSIdentifier& id,
      int32_t messageType,
      MessageSender* messageSender,
      int32_t frameCount) {
    auto packet = sendSignalPacket(id, messageType, messageSender, frameCount);
    return packet.template accessChannelData<SampleType>();
  }

  template <typename MessageSender>
  void tick(const DSIdentifier& id, int32_t messageType, MessageSender* messageSender) {
    auto endTime = std::chrono::high_resolution_clock::now();
    for (auto frameCount = getNextFrameCount(endTime); frameCount > 0;
         frameCount = getNextFrameCount(endTime)) {
      if (signalSource_) {
        auto packet = sendSignalPacket(id, messageType, messageSender, frameCount);
        signalSource_(packet);
      }

      curReadPos_ += frameCount;
    }
  }

 private:
  std::function<void(SignalPacket& packet)> signalSource_ = nullptr;
  int32_t sampleType_ = 0;
  int32_t sampleSize_ = 4;
  int32_t numChannels_ = 1;
  int32_t framesPerSecond_ = 10;
  int32_t framesPerCallback_ = 1024;

  // internal state management
  uint64_t curReadPos_ = 0;
  std::chrono::high_resolution_clock::time_point prevFrameStartTime_;

  int getNextFrameCount(std::chrono::high_resolution_clock::time_point endTime) {
    if (!framesPerSecond_) {
      return 0;
    }

    auto deltaTime =
        std::chrono::duration_cast<std::chrono::microseconds>(endTime - prevFrameStartTime_);

    // generate signal in fixed-size packets of data
    auto frameCount = deltaTime.count() < 0 ? 0 : framesPerCallback_;

    // do NOT set to now(), as that will lead to accumulation of error
    prevFrameStartTime_ += std::chrono::microseconds(frameCount * 1000000 / framesPerSecond_);

    return frameCount;
  }

  // caller is responsible for filling in the channel data
  template <typename MessageSender>
  SignalPacket sendSignalPacket(
      const DSIdentifier& id,
      int32_t messageType,
      MessageSender* messageSender,
      int32_t frameCount) {
    auto packet = SignalPacket(messageSender->sendMessage(
        id, messageType, SignalPacket::calcPacketSize(numChannels_, sampleSize_, frameCount)));
    packet.setFrameCount(frameCount);
    packet.setSampleType(sampleType_);
    packet.setNumChannels(numChannels_);
    packet.setFrameRate(framesPerSecond_);
    return packet;
  }
};

} // namespace Xrpa
