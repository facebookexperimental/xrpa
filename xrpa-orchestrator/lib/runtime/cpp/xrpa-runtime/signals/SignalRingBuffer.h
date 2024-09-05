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

#include <cstring>
#include <mutex>
#include <utility>
#include <vector>

namespace Xrpa {

template <typename SampleType>
class SignalRingBuffer {
 public:
  void initialize(int frameCount, int warmupFrameCount, int numChannels) {
    ringBuffer_.resize(frameCount * numChannels);
    warmupFrameCount_ = warmupFrameCount;
    numChannels_ = numChannels;
    ringBufferReadPos_ = 0;
    ringBufferWritePos_ = 0;
  }

  [[nodiscard]] int getReadFramesAvailable() const {
    return getRingBufferAvailableForRead() / numChannels_;
  }

  [[nodiscard]] int getWriteFramesAvailable() const {
    return getRingBufferAvailableForWrite() / numChannels_;
  }

  // returns false if it underflowed the ring buffer
  bool readInterleavedData(SampleType* outputBuffer, int framesNeeded) {
    std::unique_lock lock(mutex_);

    const int ringBufferSize = ringBuffer_.size();
    int readFramesAvailable = getReadFramesAvailable();
    bool didUnderflow = false;

    // if we're warming up, don't return any samples until we've reached the threshold
    if (isWarmingUp_) {
      if (readFramesAvailable < warmupFrameCount_) {
        readFramesAvailable = 0;
      } else {
        isWarmingUp_ = false;
      }
    } else if (readFramesAvailable < framesNeeded) {
      isWarmingUp_ = true;
      didUnderflow = true;
    }

    // copy samples from ring buffer to output buffer, filling in 0s for any remaining samples
    const int framesFromRingBuffer = std::min(readFramesAvailable, framesNeeded);
    const int ringSamples = numChannels_ * framesFromRingBuffer;
    const int totalSamples = numChannels_ * framesNeeded;

    const int endRingPos = ringBufferReadPos_ + ringSamples;

    if (endRingPos > ringBufferSize) {
      // the range straddles the end of the ring buffer, so we need to copy in two batches
      std::memcpy(
          outputBuffer,
          &ringBuffer_[ringBufferReadPos_],
          (ringBufferSize - ringBufferReadPos_) * sizeof(SampleType));
      std::memcpy(
          outputBuffer + (ringBufferSize - ringBufferReadPos_),
          &ringBuffer_[0],
          (endRingPos - ringBufferSize) * sizeof(SampleType));
      ringBufferReadPos_ = (endRingPos - ringBufferSize) % ringBufferSize;
    } else {
      // the range is entirely within the ring buffer, so we can copy it in one go
      std::memcpy(outputBuffer, &ringBuffer_[ringBufferReadPos_], ringSamples * sizeof(SampleType));
      ringBufferReadPos_ = endRingPos % ringBufferSize;
    }

    if (ringSamples < totalSamples) {
      // fill in the remaining samples with 0s
      std::memset(outputBuffer + ringSamples, 0, (totalSamples - ringSamples) * sizeof(SampleType));
    }

    return !didUnderflow;
  }

  // returns the number of frames actually written to the ring buffer (<= framesToWrite)
  int writeInterleavedData(const SampleType* inputBuffer, int framesToWrite) {
    std::unique_lock lock(mutex_);

    const int ringBufferSize = ringBuffer_.size();
    const int writeFramesAvailable = getWriteFramesAvailable();

    const int framesToRingBuffer = std::min(framesToWrite, writeFramesAvailable);
    const int ringSamples = numChannels_ * framesToRingBuffer;

    const int endRingPos = ringBufferWritePos_ + ringSamples;

    if (endRingPos > ringBufferSize) {
      // the range straddles the end of the ring buffer, so we need to copy in two batches
      const int firstBatchSamples = ringBufferSize - ringBufferWritePos_;
      const int secondBatchSamples = endRingPos - ringBufferSize;
      std::memcpy(
          &ringBuffer_[ringBufferWritePos_], inputBuffer, firstBatchSamples * sizeof(SampleType));
      std::memcpy(
          &ringBuffer_[0],
          inputBuffer + firstBatchSamples,
          secondBatchSamples * sizeof(SampleType));
      ringBufferWritePos_ = secondBatchSamples;
    } else {
      // the range is entirely within the ring buffer, so we can copy it in one go
      std::memcpy(&ringBuffer_[ringBufferWritePos_], inputBuffer, ringSamples * sizeof(SampleType));
      ringBufferWritePos_ = endRingPos % ringBufferSize;
    }

    return framesToRingBuffer;
  }

 private:
  std::mutex mutex_;
  std::vector<SampleType> ringBuffer_;
  int ringBufferReadPos_ = 0;
  int ringBufferWritePos_ = 0;
  int numChannels_ = 1;
  int warmupFrameCount_ = 0;
  bool isWarmingUp_ = true;

  [[nodiscard]] int getRingBufferAvailableForRead() const {
    if (ringBufferWritePos_ >= ringBufferReadPos_) {
      return ringBufferWritePos_ - ringBufferReadPos_;
    } else {
      return ringBufferWritePos_ + ringBuffer_.size() - ringBufferReadPos_;
    }
  }

  [[nodiscard]] int getRingBufferAvailableForWrite() const {
    if (ringBufferWritePos_ >= ringBufferReadPos_) {
      return ringBuffer_.size() - (ringBufferWritePos_ - ringBufferReadPos_);
    } else {
      return ringBufferReadPos_ - ringBufferWritePos_;
    }
  }
};

} // namespace Xrpa
