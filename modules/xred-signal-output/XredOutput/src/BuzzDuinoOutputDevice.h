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

#include <stdint.h>
#include <memory>
#include <vector>

#include "GenericUart.h"
#include "SignalOutputDevice.h"

class XredDeviceComms;

class BuzzDuinoOutputDevice : public SignalOutputDevice {
 public:
  static std::shared_ptr<BuzzDuinoOutputDevice> create(const std::shared_ptr<GenericUart>& uart);

  virtual void tick() override;

 private:
  BuzzDuinoOutputDevice(
      std::unique_ptr<XredDeviceComms>&& hdkComms,
      int numChannels,
      int sampleRate);

  std::unique_ptr<XredDeviceComms> hdkComms_;

  std::vector<float> interleavedBuffer_;

  std::vector<uint8_t> supportedCommands_;
  bool supportsInterleaved_ = false;

  uint8_t capTouchState_ = 0;

  bool transmitData();
  void receiveData();
};
