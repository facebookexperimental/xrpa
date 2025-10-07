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

#include <lib/AudioInputTestModule.h>
#include <lib/AudioInputTestProgram.h>
#include <iostream>

void EntryPoint(AudioInputTestModule* moduleData) {
  std::cout << "[AudioInputTest] Starting AudioInput test program..." << std::endl;

  auto testProgram = std::make_shared<XrpaDataflowPrograms::AudioInputTestProgram>(
      moduleData->audioInputDataStore, moduleData->signalProcessingDataStore);

  std::cout << "[AudioInputTest] Program created successfully" << std::endl;

  testProgram->onIsActiveChanged = [](bool isActive) {
    std::cout << "[AudioInputTest] Audio capture status changed: "
              << (isActive ? "ACTIVE" : "INACTIVE") << std::endl;
  };

  testProgram->onErrorMessageChanged = [](const std::string& errorMessage) {
    if (!errorMessage.empty()) {
      std::cout << "[AudioInputTest] Error: " << errorMessage << std::endl;
    }
  };

  std::cout << "[AudioInputTest] Event handlers set up" << std::endl;
  std::cout << "[AudioInputTest] Starting main loop..." << std::endl;
  std::cout << "[AudioInputTest] You should see audio capture events if the module is working"
            << std::endl;
  std::cout
      << "[AudioInputTest] Audio signal is automatically routed to speakers via SignalProcessing"
      << std::endl;

  moduleData->run(30, [&]() {});

  std::cout << "[AudioInputTest] Test completed" << std::endl;
}
