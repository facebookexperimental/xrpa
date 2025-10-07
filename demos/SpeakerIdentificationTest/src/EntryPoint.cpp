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

#include <lib/SpeakerIdentificationTestModule.h>
#include <lib/SpeakerIdentificationTestProgram.h>

#include <iostream>
#include <memory>
#include <string>

void EntryPoint(SpeakerIdentificationTestModule* moduleData) {
  std::cout << "[SpeakerIdentificationTest] Starting SpeakerIdentificationTest program..."
            << std::endl;

  auto testProgram = std::make_shared<XrpaDataflowPrograms::SpeakerIdentificationTestProgram>(
      moduleData->audioInputDataStore, moduleData->speakerIdentificationDataStore);

  std::cout << "[SpeakerIdentificationTest] Program created successfully" << std::endl;
  std::cout
      << "[SpeakerIdentificationTest] This demo will compare your voice against reference speakers"
      << std::endl;
  std::cout
      << "[SpeakerIdentificationTest] Reference speakers: Reference Speaker 1, Reference Speaker 2, Reference Speaker 3, Archana"
      << std::endl;

  testProgram->onIsActiveChanged = [](bool isActive) {
    if (isActive) {
      std::cout << "[AUDIO] Microphone is active and capturing audio." << std::endl;
    } else {
      std::cout << "[AUDIO] Microphone is not active." << std::endl;
    }
  };

  testProgram->onAudioErrorMessageChanged = [](const std::string& errorMessage) {
    if (!errorMessage.empty()) {
      std::cerr << "[AUDIO ERROR] " << errorMessage << std::endl;
    }
  };

  testProgram->onIdentifiedSpeakerIdChanged = [](const std::string& speakerId) {
    if (!speakerId.empty()) {
      std::cout << "\n[SPEAKER ID] Identified Speaker ID: " << speakerId << std::endl;
    }
  };

  testProgram->onIdentifiedSpeakerNameChanged = [](const std::string& speakerName) {
    if (!speakerName.empty()) {
      std::cout << "\n[SPEAKER ID] Identified Speaker Name: " << speakerName << std::endl;
    }
  };

  testProgram->onConfidenceScoreChanged = [](int confidenceScore) {
    std::cout << "\n[SPEAKER ID] Confidence Score: " << confidenceScore << "%" << std::endl;
  };

  testProgram->onErrorMessageChanged = [](const std::string& errorMessage) {
    if (!errorMessage.empty()) {
      std::cerr << "\n[SPEAKER ID ERROR] " << errorMessage << std::endl;
    }
  };

  std::cout << "[SpeakerIdentificationTest] Callbacks set up successfully" << std::endl;
  std::cout << "[SpeakerIdentificationTest] Starting main loop..." << std::endl;
  std::cout << "[SpeakerIdentificationTest] Listening for audio from microphone..." << std::endl;
  std::cout << "[SpeakerIdentificationTest] Press Ctrl+C to exit." << std::endl;

  try {
    moduleData->run(100, [&]() {});
  } catch (const std::exception& e) {
    std::cerr << "[SpeakerIdentificationTest] EXCEPTION: " << e.what() << std::endl;
  } catch (...) {
    std::cerr << "[SpeakerIdentificationTest] UNKNOWN EXCEPTION CAUGHT" << std::endl;
  }
}
