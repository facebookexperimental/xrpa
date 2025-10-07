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

#include "KnobControl.h"
#include "LightControl.h"

#include <XredDeviceComms.h>

#include <chrono>
#include <memory>
#include <string>
#include <vector>

class SmartControllerDevice {
 public:
  SmartControllerDevice(const std::string& ipAddress);
  ~SmartControllerDevice();

  std::string getIpAddress() const {
    return ipAddress_;
  }

  void addKnobControl(KnobControl* knobControl) {
    knobControls_.push_back(knobControl);
    if (deviceComms_) {
      knobControl->setIsConnected(true);
    }
  }

  void removeKnobControl(KnobControl* knobControl) {
    knobControls_.erase(
        std::remove(knobControls_.begin(), knobControls_.end(), knobControl), knobControls_.end());
  }

  void addLightControl(LightControl* lightControl) {
    lightControls_.push_back(lightControl);
    if (deviceComms_) {
      lightControl->setIsConnected(true);
    }
  }

  void removeLightControl(LightControl* lightControl) {
    lightControls_.erase(
        std::remove(lightControls_.begin(), lightControls_.end(), lightControl),
        lightControls_.end());
  }

  void tick();

 private:
  void sendKnobOutputData();
  void sendLightOutputData();
  void recvInputData();

  // connection
  std::string ipAddress_;
  std::unique_ptr<XredDeviceComms> deviceComms_;
  std::chrono::steady_clock::time_point nextConnectRetry_;
  std::chrono::steady_clock::time_point ignoreInputUntil_;

  // controls
  std::vector<KnobControl*> knobControls_;
  std::vector<LightControl*> lightControls_;

  // output state
  SmartControllerDataStore::KnobControlMode knobOutControlMode_ =
      SmartControllerDataStore::KnobControlMode::Disabled;
  int32_t knobOutDetentCount_ = 0;
  int32_t knobOutPosition_ = 0;
  std::vector<uint8_t> ledColors_;

  // input state
  int32_t knobInAbsolutePosition_ = 0;
  int16_t knobInPosition_ = 0;
  int16_t knobInDetentPosition_ = 0;
  uint16_t inputsState_ = 0;
};
