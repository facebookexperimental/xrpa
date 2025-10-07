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

#include "SignalInputDevice.h"

class AudioSystemHandle {
 public:
  AudioSystemHandle();
  ~AudioSystemHandle();

  bool isInitialized() const {
    return initalized_;
  }

 private:
  bool initalized_ = false;
};

class AudioInputDevice : public SignalInputDevice {
 public:
  static std::vector<std::shared_ptr<AudioInputDevice>> createAudioDevices(
      const AudioSystemHandle& audioSystem);

  AudioInputDevice(int deviceIdx, bool isSystemDefault);
  ~AudioInputDevice() override = default;

  std::shared_ptr<SignalInputDeviceStream> openStream(int numChannels, int frameRate) override;

 private:
  int deviceIdx_;
};
