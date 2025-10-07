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

#include <lib/CameraDebugModule.h>
#include <lib/CameraDebugProgram.h>
#include <iostream>

void EntryPoint(CameraDebugModule* moduleData) {
  std::cout << "[CameraDebug] Starting CameraDebug program..." << std::endl;
  auto debugProgram = std::make_shared<XrpaDataflowPrograms::CameraDebugProgram>(
      moduleData->cameraDataStore,
      moduleData->imageViewerDataStore,
      moduleData->visualEmotionDetectionDataStore);

  std::cout << "[CameraDebug] Program created successfully" << std::endl;

  // Set up emotion result logging
  debugProgram->onEmotionResult([](uint64_t timestamp,
                                   std::chrono::nanoseconds imgTimestamp,
                                   VisualEmotionDetectionDataStore::EmotionType emotion,
                                   bool faceDetected,
                                   float confidence) {
    std::cout << "[EmotionDetection] Timestamp: " << timestamp
              << ", Emotion: " << static_cast<int>(emotion)
              << ", Face Detected: " << (faceDetected ? "true" : "false")
              << ", Confidence: " << confidence << std::endl;
  });

  std::cout << "[CameraDebug] Emotion result handler set up" << std::endl;
  std::cout << "[CameraDebug] Starting main loop..." << std::endl;

  moduleData->run(100, [&]() {});
}
