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
#include <dataset/reconciler/SignalShared.h>
#include <chrono>
#include <functional>

namespace Xrpa {

template <typename T>
using SignalProducerCallback =
    std::function<void(SignalChannelData<T> dataOut, int32_t sampleRate, uint64_t startSamplePos)>;

class OutboundSignalData {
 public:
  template <typename T>
  void setSignalSource(
      SignalProducerCallback<T> source,
      int32_t numChannels,
      int32_t sampleRate,
      int32_t samplesPerCallback) {
    // wrapper lambda for the type cast, =(
    signalSource_ = [source, this](SignalPacket& packet) {
      source(packet.accessChannelData<T>(), sampleRate_, curReadPos_);
    };

    sampleType_ = inferSampleType<T>();
    sampleSize_ = sizeof(T);
    numChannels_ = numChannels;
    sampleRate_ = sampleRate;
    samplesPerCallback_ = samplesPerCallback;

    prevFrameStartTime_ = std::chrono::high_resolution_clock::now();
  }

  // caller is responsible for filling in the channel data
  template <typename ReconcilerType, typename SampleType>
  SignalChannelData<SampleType> sendSignalData(
      const DSIdentifier& id,
      int32_t messageType,
      ReconcilerType* reconciler,
      int32_t sampleCount) {
    auto packet = sendSignalPacket(id, messageType, reconciler, sampleCount);
    return packet.template accessChannelData<SampleType>();
  }

  template <typename ReconcilerType>
  void tick(const DSIdentifier& id, int32_t messageType, ReconcilerType* reconciler) {
    auto endTime = std::chrono::high_resolution_clock::now();
    for (auto sampleCount = getNextSampleCount(endTime); sampleCount > 0;
         sampleCount = getNextSampleCount(endTime)) {
      if (signalSource_) {
        auto packet = sendSignalPacket(id, messageType, reconciler, sampleCount);
        signalSource_(packet);
      }

      curReadPos_ += sampleCount;
    }
  }

 private:
  std::function<void(SignalPacket& packet)> signalSource_ = nullptr;
  int32_t sampleType_ = 0;
  int32_t sampleSize_ = 4;
  int32_t numChannels_ = 1;
  int32_t sampleRate_ = 10;
  int32_t samplesPerCallback_ = 1024;

  // internal state management
  uint64_t curReadPos_ = 0;
  std::chrono::high_resolution_clock::time_point prevFrameStartTime_;

  int getNextSampleCount(std::chrono::high_resolution_clock::time_point endTime) {
    if (!sampleRate_) {
      return 0;
    }

    auto deltaTime =
        std::chrono::duration_cast<std::chrono::microseconds>(endTime - prevFrameStartTime_);

    // generate signal in fixed-size packets of data
    auto sampleCount = deltaTime.count() < 0 ? 0 : samplesPerCallback_;

    // do NOT set to now(), as that will lead to accumulation of error
    prevFrameStartTime_ += std::chrono::microseconds(sampleCount * 1000000 / sampleRate_);

    return sampleCount;
  }

  // caller is responsible for filling in the channel data
  template <typename ReconcilerType>
  SignalPacket sendSignalPacket(
      const DSIdentifier& id,
      int32_t messageType,
      ReconcilerType* reconciler,
      int32_t sampleCount) {
    auto packet = SignalPacket(reconciler->sendMessage(
        id, messageType, SignalPacket::calcPacketSize(numChannels_, sampleSize_, sampleCount)));
    packet.setSampleCount(sampleCount);
    packet.setSampleType(sampleType_);
    packet.setNumChannels(numChannels_);
    packet.setSampleRate(sampleRate_);
    return packet;
  }
};

} // namespace Xrpa
