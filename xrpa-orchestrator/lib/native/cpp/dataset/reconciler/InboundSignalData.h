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

#include <dataset/reconciler/SignalShared.h>
#include <dataset/utils/MemoryAccessor.h>
#include <chrono>
#include <functional>

namespace Xrpa {

class InboundSignalDataInterface {
 public:
  virtual ~InboundSignalDataInterface() = default;

  virtual void onSignalData(int32_t timestamp, MemoryAccessor memAccessor) = 0;
  virtual void onDataReady(std::function<void()> callback) = 0;
};

template <typename SampleType>
class InboundSignalData : public InboundSignalDataInterface {
 public:
  InboundSignalData(int32_t numChannels, int32_t sampleRate)
      : sampleType_(inferSampleType<SampleType>()), sampleRate_(sampleRate) {
    channelsData_.resize(numChannels);
    readPositions_.resize(numChannels);
    for (int i = 0; i < numChannels; i++) {
      channelsData_[i].reserve(sampleRate_ / 100);
      readPositions_[i] = 0;
    }

    // TODO add a warmup buffer (adds latency but reduces the chance of starving the reader)
  }

  virtual void onSignalData(int32_t /*timestamp*/, MemoryAccessor memAccessor) override final {
    auto packet = SignalPacket(memAccessor);
    auto sampleCount = packet.getSampleCount();
    auto sampleType = packet.getSampleType();
    auto sampleRate = packet.getSampleRate();
    auto channelDataIn = packet.accessChannelData<SampleType>();

    if (sampleType != sampleType_ || sampleRate != sampleRate_) {
      // TODO T180973550 convert the data
      return;
    }

    for (int i = 0; i < channelsData_.size(); i++) {
      if (readPositions_[i] == channelsData_[i].size()) {
        channelsData_[i].resize(0);
        readPositions_[i] = 0;
      }

      auto dstOffset = channelsData_[i].size();
      channelsData_[i].resize(dstOffset + sampleCount);
      channelDataIn.readChannelData(i, channelsData_[i].data() + dstOffset, sampleCount);
    }

    if (dataReadyCB_) {
      dataReadyCB_();
    }
  }

  virtual void onDataReady(std::function<void()> callback) override final {
    dataReadyCB_ = callback;
  }

  SampleType* readChannelData(int channelIdx, int& sampleCountOut) {
    if (channelIdx < 0 || channelIdx >= channelsData_.size()) {
      sampleCountOut = 0;
      return nullptr;
    }

    int readPos = readPositions_[channelIdx];
    readPositions_[channelIdx] = channelsData_[channelIdx].size();
    sampleCountOut = channelsData_[channelIdx].size() - readPos;
    return channelsData_[channelIdx].data() + readPos;
  }

 private:
  std::function<void()> dataReadyCB_ = nullptr;
  std::vector<std::vector<SampleType>> channelsData_;
  std::vector<int> readPositions_;
  int32_t sampleType_;
  int32_t sampleRate_;
};

} // namespace Xrpa
