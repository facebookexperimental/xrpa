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

#include <lib/AudioInputModule.h>

#include <xrpa-runtime/signals/SignalRingBuffer.h>

#include <memory>

class SignalInputDeviceStream {
 public:
  SignalInputDeviceStream(int numChannels, int frameRate)
      : numChannels_(numChannels), frameRate_(frameRate) {
    ringBuffer_.initialize(frameRate / 2, 0, numChannels);
  }

  virtual ~SignalInputDeviceStream() = default;

  int getReadFramesAvailable() const {
    return ringBuffer_.getReadFramesAvailable();
  }

  void fillSignalPacket(Xrpa::SignalPacket& packet) {
    packet.accessChannelData<float>().consumeFromRingBuffer(&ringBuffer_);
  }

  int getNumChannels() const {
    return numChannels_;
  }

  int getFrameRate() const {
    return frameRate_;
  }

  // called from device-specific thread
  void writeInterleavedData(const float* buffer, int frameCount) {
    ringBuffer_.writeInterleavedData(buffer, frameCount);
  }

  const std::string& getErrorMessage() const {
    return errorMessage_;
  }

 protected:
  std::string errorMessage_;

 private:
  int numChannels_ = 0;
  int frameRate_ = 0;

  Xrpa::SignalRingBuffer<float> ringBuffer_;
};

class SignalInputDevice : public AudioInputDataStore::OutboundAudioInputDevice {
 public:
  explicit SignalInputDevice(Xrpa::ObjectUuid uuid)
      : AudioInputDataStore::OutboundAudioInputDevice(uuid) {}
  virtual std::shared_ptr<SignalInputDeviceStream> openStream(int numChannels, int frameRate) = 0;
};
