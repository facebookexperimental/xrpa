/*
// @generated
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

#include <xrpa-runtime/signals/SignalRingBuffer.h>
#include <xrpa-runtime/signals/SignalShared.h>
#include <xrpa-runtime/utils/MemoryAccessor.h>
#include <vector>

namespace Xrpa {

class InboundSignalDataInterface {
 public:
  virtual ~InboundSignalDataInterface() = default;

  virtual void onSignalData(uint64_t timestamp, const MemoryAccessor& memAccessor) = 0;
};

template <typename SampleType>
class InboundSignalData : public InboundSignalDataInterface {
 public:
  InboundSignalData(int32_t numChannels, int32_t framesPerSecond, float warmupTimeInSeconds = 0.f)
      : sampleType_(SignalTypeInference::inferSampleType<SampleType>()),
        framesPerSecond_(framesPerSecond),
        numChannels_(numChannels) {
    int warmupFrames = warmupTimeInSeconds * framesPerSecond_;
    int maxFramesInBuffer = std::max(warmupFrames * 2, framesPerSecond_);
    ringBuffer_.initialize(maxFramesInBuffer, warmupFrames, numChannels_);
  }

  void onSignalData(uint64_t /*timestamp*/, const MemoryAccessor& memAccessor) final {
    auto packet = SignalPacket{memAccessor};
    auto sampleType = packet.getSampleType();
    auto framesPerSecond = packet.getFrameRate();
    auto channelDataIn = packet.accessChannelData<SampleType>();

    if (sampleType != sampleType_ || framesPerSecond != framesPerSecond_) {
      // TODO T180973550 convert the data
      return;
    }

    // make sure not to overflow the ring buffer (discard extra samples)
    auto frameCount = std::min(ringBuffer_.getWriteFramesAvailable(), packet.getFrameCount());

    // read and interleave the data into a temp buffer
    tempData_.resize(frameCount * numChannels_);
    for (int i = 0; i < numChannels_; i++) {
      channelDataIn.readChannelData(i, tempData_.data() + i, frameCount, numChannels_);
    }

    // write the interleaved data into the ring buffer
    ringBuffer_.writeInterleavedData(tempData_.data(), frameCount);
  }

  int getReadFramesAvailable() {
    return ringBuffer_.getReadFramesAvailable();
  }

  bool readInterleavedData(SampleType* outputBuffer, int framesNeeded) {
    return ringBuffer_.readInterleavedData(outputBuffer, framesNeeded);
  }

  bool readDeinterleavedData(SampleType* outputBuffer, int framesNeeded, int outputStride) {
    return ringBuffer_.readDeinterleavedData(outputBuffer, framesNeeded, outputStride);
  }

 private:
  Xrpa::SignalRingBuffer<SampleType> ringBuffer_;
  std::vector<SampleType> tempData_;
  int32_t sampleType_;
  int32_t framesPerSecond_;
  int32_t numChannels_;
};

} // namespace Xrpa
