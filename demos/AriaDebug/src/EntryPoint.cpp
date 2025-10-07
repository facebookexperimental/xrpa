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

#include <lib/AriaDebugModule.h>
#include <lib/AriaDebugProgram.h>

#include <fstream>
#include <iostream>
#include <string>

void EntryPoint(AriaDebugModule* moduleData) {
  auto debugProgram = std::make_shared<XrpaDataflowPrograms::AriaDebugProgram>(
      moduleData->ariaDataStore,
      moduleData->imageSelectorDataStore,
      moduleData->imageViewerDataStore,
      moduleData->llmHubDataStore,
      moduleData->objectRecognitionDataStore,
      moduleData->signalProcessingDataStore);

  if (moduleData->settings.ipAddress.length() == 0) {
    std::cout << "Connecting to Aria device over USB" << std::endl;
  } else {
    std::cout << "Connecting to Aria device at " << moduleData->settings.ipAddress << std::endl;
  }
  debugProgram->setIpAddress(moduleData->settings.ipAddress);

  int poseUpdateCount = 0;
  debugProgram->onXrpaFieldsChanged([&](uint64_t fieldsChanged) {
    // log pose periodically
    if (debugProgram->checkPoseChanged(fieldsChanged)) {
      poseUpdateCount++;
      if (poseUpdateCount % 2 == 0) {
        auto pose = debugProgram->getPose();
        std::cout << "Pose: " << pose.position.x() << ", " << pose.position.y() << ", "
                  << pose.position.z() << std::endl;
        poseUpdateCount = 0;
      }
    }
    if (debugProgram->checkCoordinateFrameIdChanged(fieldsChanged)) {
      auto coordinateFrameId = debugProgram->getCoordinateFrameId();
      std::cout << "Coordinate Frame Id: " << coordinateFrameId << std::endl;
    }
  });

  debugProgram->onObjectDetection([&](int32_t, const std::string&) {
    // TODO
  });

  debugProgram->onQueryResponse([&](int32_t, const std::string& response, int id) {
    std::cout << "LlmHub response (id " << id << "): " << response << std::endl;
  });

  std::ifstream secretsFile("secrets.txt");
  if (secretsFile.is_open()) {
    std::string apiKey;
    std::getline(secretsFile, apiKey);
    secretsFile.close();
    debugProgram->setApiKey(apiKey);
  }

  int counter = 0;
  moduleData->run(100, [&]() {
    if (++counter % 2000 == 0) {
      int queryId = debugProgram->getQueryId() + 1;
      std::cout << "Triggering LLM query " << queryId << std::endl;
      debugProgram->setQueryId(queryId);
      counter = 0;
    }
  });
}
