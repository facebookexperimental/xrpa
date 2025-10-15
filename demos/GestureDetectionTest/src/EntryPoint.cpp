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

#include <lib/GestureDetectionTestProgram.h>
#include <lib/GestureDetectionTestProgramModule.h>
#include <iostream>

void EntryPoint(GestureDetectionTestProgramModule* moduleData) {
  std::cout << "[GestureDetectionTest] Starting GestureDetectionTest program..." << std::endl;
  auto testProgram = std::make_shared<XrpaDataflowPrograms::GestureDetectionTestProgram>(
      moduleData->cameraDataStore,
      moduleData->gestureDetectionDataStore,
      moduleData->imageViewerDataStore);

  std::cout << "[GestureDetectionTest] Program created successfully" << std::endl;

  // Set up gesture result logging
  testProgram->onGestureResult([](uint64_t timestamp,
                                  std::chrono::nanoseconds imgTimestamp,
                                  GestureDetectionDataStore::GestureType gesture,
                                  float confidence,
                                  bool handDetected,
                                  const std::string& errorMessage) {
    std::cout << "[GestureDetection] Timestamp: " << timestamp
              << ", Gesture: " << static_cast<int>(gesture)
              << ", Hand Detected: " << (handDetected ? "true" : "false")
              << ", Confidence: " << confidence;
    if (!errorMessage.empty()) {
      std::cout << ", Error: " << errorMessage;
    }
    std::cout << std::endl;
  });

  std::cout << "[GestureDetectionTest] Gesture result handler set up" << std::endl;
  std::cout << "[GestureDetectionTest] Starting main loop..." << std::endl;

  moduleData->run(100, [&]() {});
}
