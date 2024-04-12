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

#include <dataset/utils/MemoryAccessor.h>
#include <stdint.h>
#include <type_traits>
#include <utility>

namespace Xrpa {

template <typename...>
constexpr bool always_false = false;

template <typename T>
constexpr void unsupportedSampleType() {
  static_assert(always_false<T>, "Unsupported sample type");
}

template <typename T>
constexpr int32_t inferSampleType() {
  if constexpr (std::is_same_v<T, float>) {
    return 0;
  } else if constexpr (std::is_same_v<T, int32_t>) {
    return 1;
  } else if constexpr (std::is_same_v<T, int16_t>) {
    return 2;
  } else if constexpr (std::is_same_v<T, int8_t>) {
    return 3;
  } else if constexpr (std::is_same_v<T, uint32_t>) {
    return 4;
  } else if constexpr (std::is_same_v<T, uint16_t>) {
    return 5;
  } else if constexpr (std::is_same_v<T, uint8_t>) {
    return 6;
  } else {
    unsupportedSampleType<T>();
  }
}

template <typename SampleType>
class SignalChannelData {
 public:
  SignalChannelData(MemoryAccessor memAccessor, int32_t sampleCount, int32_t numChannels)
      : memAccessor_(std::move(memAccessor)),
        sampleCount_(sampleCount),
        numChannels_(numChannels) {}

  int32_t getNumChannels() {
    return numChannels_;
  }

  int32_t getNumSamplesPerChannel() {
    return sampleCount_;
  }

  int32_t getChannelBufferSize() {
    return sizeof(SampleType) * sampleCount_;
  }

  void readChannelData(int32_t channelIdx, SampleType* dst, int32_t dstCount) {
    auto* src = accessChannelBuffer(channelIdx);
    if (src) {
      copySampleData(src, sampleCount_, dst, dstCount);
    } else {
      std::fill(dst, dst + dstCount, 0);
    }
  }

  void writeChannelData(int32_t channelIdx, const SampleType* src, int32_t srcCount) {
    auto* dst = accessChannelBuffer(channelIdx);
    if (dst) {
      copySampleData(src, srcCount, dst, sampleCount_);
    }
  }

  void clearUnusedChannels(int32_t startChannelIdx, int32_t usedChannelCount) {
    for (int i = 0; i < startChannelIdx; ++i) {
      auto* dst = accessChannelBuffer(i);
      std::fill(dst, dst + sampleCount_, 0);
    }
    for (int i = startChannelIdx + usedChannelCount; i < numChannels_; ++i) {
      auto* dst = accessChannelBuffer(i);
      std::fill(dst, dst + sampleCount_, 0);
    }
  }

  SampleType* accessChannelBuffer(int32_t channelIdx) {
    if (channelIdx < 0 || channelIdx >= getNumChannels()) {
      return nullptr;
    }
    int channelBufferSize = getChannelBufferSize();
    return static_cast<SampleType*>(
        memAccessor_.getRawPointer(channelIdx * channelBufferSize, channelBufferSize));
  }

 private:
  MemoryAccessor memAccessor_;
  int32_t sampleCount_;
  int32_t numChannels_;

  void copySampleData(const SampleType* src, int32_t srcCount, SampleType* dst, int32_t dstCount) {
    std::copy(src, src + std::min(srcCount, dstCount), dst);
    if (srcCount < dstCount) {
      std::fill(dst + srcCount, dst + dstCount, 0);
    }
  }
};

class SignalPacket {
 public:
  explicit SignalPacket(MemoryAccessor memAccessor) : memAccessor_(std::move(memAccessor)) {}

  int32_t getSampleCount() {
    return memAccessor_.readValue<int32_t>(0);
  }

  void setSampleCount(int32_t sampleCount) {
    memAccessor_.writeValue<int32_t>(sampleCount, 0);
  }

  int32_t getSampleType() {
    return memAccessor_.readValue<int32_t>(4);
  }

  void setSampleType(int32_t sampleType) {
    memAccessor_.writeValue<int32_t>(sampleType, 4);
  }

  int32_t getNumChannels() {
    return memAccessor_.readValue<int32_t>(8);
  }

  void setNumChannels(int32_t numChannels) {
    memAccessor_.writeValue<int32_t>(numChannels, 8);
  }

  int32_t getSampleRate() {
    return memAccessor_.readValue<int32_t>(12);
  }

  void setSampleRate(int32_t sampleRate) {
    memAccessor_.writeValue<int32_t>(sampleRate, 12);
  }

  template <typename SampleType>
  SignalChannelData<SampleType> accessChannelData() {
    return SignalChannelData<SampleType>(
        memAccessor_.slice(kHeaderSize), getSampleCount(), getNumChannels());
  }

  static int32_t calcPacketSize(int32_t numChannels, int32_t sampleSize, int32_t sampleCount) {
    return kHeaderSize + (numChannels * sampleSize * sampleCount);
  }

 private:
  static constexpr int32_t kHeaderSize = 16;
  MemoryAccessor memAccessor_;
};

} // namespace Xrpa
