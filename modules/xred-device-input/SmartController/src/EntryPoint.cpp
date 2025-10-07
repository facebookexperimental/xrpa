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

#include <lib/SmartControllerModule.h>

#include "KnobControl.h"
#include "LightControl.h"
#include "SmartControllerManager.h"

void EntryPoint(SmartControllerModule* moduleData) {
  KnobControl::registerDelegate(moduleData->smartControllerDataStore);
  LightControl::registerDelegate(moduleData->smartControllerDataStore);
  SmartControllerManager deviceManager;

  moduleData->run(100, [&]() {
    for (auto& device : deviceManager) {
      device.second->tick();
    }

    for (auto& control : *moduleData->smartControllerDataStore->KnobControl) {
      if (auto knobControl = reinterpret_cast<KnobControl*>(control.get())) {
        knobControl->tick(deviceManager);
      }
    }

    for (auto& control : *moduleData->smartControllerDataStore->LightControl) {
      if (auto lightControl = reinterpret_cast<LightControl*>(control.get())) {
        lightControl->tick(deviceManager);
      }
    }
  });
}
