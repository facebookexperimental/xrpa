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

#include <lib/XredOutputModule.h>

#include <memory>

#include "SignalOutputDevice.h"

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

class AudioOutputDevice : public SignalOutputDevice {
 public:
  static std::vector<std::shared_ptr<AudioOutputDevice>> createAudioDevices(
      const AudioSystemHandle& audioSystem);

  AudioOutputDevice(int deviceIdx, bool isSystemDefault);
  virtual ~AudioOutputDevice() override;

  virtual void tick() override;

  virtual float getWarmupTimeInSeconds() override {
    return 0.01f; // 10ms
  }

 private:
  int deviceIdx_;
  void* stream_ = nullptr;
};
