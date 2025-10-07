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

#include <lib/SmartControllerProgram.h>
#include <lib/SmartControllerTestModule.h>

#include <iostream>

void EntryPoint(SmartControllerTestModule* moduleData) {
  auto debugProgram = std::make_shared<XrpaDataflowPrograms::SmartControllerProgram>(
      moduleData->smartControllerDataStore);

  std::cout << "Connecting to smart controller at " << moduleData->settings.ipAddress << std::endl;
  debugProgram->setIpAddress(moduleData->settings.ipAddress);

  std::vector<SmartControllerDataStore::ColorSRGBA> baseColors;
  for (int i = 0; i < 24; ++i) {
    baseColors.push_back({0, 128, 32, 255});
  }
  debugProgram->setBaseLightColors(baseColors);

  std::vector<SmartControllerDataStore::ColorSRGBA> overlayColors;
  for (int i = 0; i < 24; ++i) {
    uint8_t alpha = i * 10;
    overlayColors.push_back({128, 0, 128, alpha});
  }
  debugProgram->setOverlayLightColors(overlayColors);

  debugProgram->onKnobChanged(
      [&](uint64_t, int position, int absolutePosition, int detentPosition) {
        std::cout << "Detent position: " << detentPosition << std::endl;
        debugProgram->setOverlayLightRotationSpeed(M_PI * detentPosition / 100.0f);
      });

  moduleData->run(100, [&]() {
    // ticking
  });
}
