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

#include <xrpa-runtime/utils/MemoryAccessor.h>
#include <cstdint>
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
  SignalChannelData(MemoryAccessor memAccessor, int32_t frameCount, int32_t numChannels)
      : memAccessor_(std::move(memAccessor)), frameCount_(frameCount), numChannels_(numChannels) {}

  int32_t getNumChannels() {
    return numChannels_;
  }

  int32_t getFrameCount() {
    return frameCount_;
  }

  int32_t getChannelBufferSize() {
    return sizeof(SampleType) * frameCount_;
  }

  void
  readChannelData(int32_t channelIdx, SampleType* dst, int32_t dstCount, int32_t dstStride = 1) {
    auto* src = accessChannelBuffer(channelIdx);
    if (dstStride == 1) {
      if (src) {
        copySampleData(src, frameCount_, dst, dstCount);
      } else {
        std::fill(dst, dst + dstCount, 0);
      }
    } else {
      const int fillCount = src ? std::min(frameCount_, dstCount) : 0;
      for (int i = 0; i < fillCount; ++i) {
        dst[i * dstStride] = src[i];
      }
      for (int i = fillCount; i < dstCount; ++i) {
        dst[i * dstStride] = 0;
      }
    }
  }

  void writeChannelData(int32_t channelIdx, const SampleType* src, int32_t srcCount) {
    auto* dst = accessChannelBuffer(channelIdx);
    if (dst) {
      copySampleData(src, srcCount, dst, frameCount_);
    }
  }

  void clearUnusedChannels(int32_t startChannelIdx, int32_t usedChannelCount) {
    for (int i = 0; i < startChannelIdx; ++i) {
      auto* dst = accessChannelBuffer(i);
      std::fill(dst, dst + frameCount_, 0);
    }
    for (int i = startChannelIdx + usedChannelCount; i < numChannels_; ++i) {
      auto* dst = accessChannelBuffer(i);
      std::fill(dst, dst + frameCount_, 0);
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
  int32_t frameCount_;
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

  int32_t getFrameCount() {
    return memAccessor_.readValue<int32_t>(0);
  }

  void setFrameCount(int32_t frameCount) {
    memAccessor_.writeValue<int32_t>(frameCount, 0);
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

  int32_t getFrameRate() {
    return memAccessor_.readValue<int32_t>(12);
  }

  void setFrameRate(int32_t framesPerSecond) {
    memAccessor_.writeValue<int32_t>(framesPerSecond, 12);
  }

  template <typename SampleType>
  SignalChannelData<SampleType> accessChannelData() {
    return SignalChannelData<SampleType>(
        memAccessor_.slice(kHeaderSize), getFrameCount(), getNumChannels());
  }

  static int32_t calcPacketSize(int32_t numChannels, int32_t sampleSize, int32_t frameCount) {
    return kHeaderSize + (numChannels * sampleSize * frameCount);
  }

 private:
  static constexpr int32_t kHeaderSize = 16;
  MemoryAccessor memAccessor_;
};

} // namespace Xrpa
