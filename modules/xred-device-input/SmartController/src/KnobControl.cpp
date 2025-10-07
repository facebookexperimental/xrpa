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

#include "KnobControl.h"

#include "SmartControllerDevice.h"
#include "SmartControllerManager.h"

KnobControl::~KnobControl() {
  if (device_) {
    device_->removeKnobControl(this);
  }
}

void KnobControl::tick(SmartControllerManager& deviceManager) {
  const auto& ipAddress = getIpAddress();

  if (ipAddress.empty()) {
    if (device_) {
      device_->removeKnobControl(this);
      device_.reset();
    }
    if (getIsConnected()) {
      setIsConnected(false);
    }
  } else if (!device_ || device_->getIpAddress() != ipAddress) {
    if (device_) {
      device_->removeKnobControl(this);
    }
    device_ = deviceManager.getOrCreateController(ipAddress);
    device_->addKnobControl(this);
  }
}
