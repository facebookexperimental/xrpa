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

#include <iostream>
#include <memory>
#include <string>

#include <lib/AudioTranscriptionTestModule.h>
#include <lib/AudioTranscriptionTestProgram.h>

void EntryPoint(AudioTranscriptionTestModule* moduleData) {
  std::cout << "[AudioTranscriptionTest] Starting AudioTranscriptionTest program..." << std::endl;

  auto testProgram = std::make_shared<XrpaDataflowPrograms::AudioTranscriptionTestProgram>(
      moduleData->audioInputDataStore, moduleData->audioTranscriptionDataStore);

  std::cout << "[AudioTranscriptionTest] Program created successfully" << std::endl;

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

  testProgram->onTranscriptionResult([](uint64_t timestamp,
                                        const std::string& text,
                                        std::chrono::nanoseconds imageTimestamp,
                                        bool success,
                                        const std::string& errorMessage) {
    if (success) {
      std::cout << "\n[TRANSCRIPTION] " << text << std::endl;
    } else {
      std::cerr << "\n[TRANSCRIPTION ERROR] " << errorMessage << std::endl;
    }
  });

  std::cout << "[AudioTranscriptionTest] Callbacks set up successfully" << std::endl;
  std::cout << "[AudioTranscriptionTest] Starting main loop..." << std::endl;
  std::cout << "[AudioTranscriptionTest] Listening for audio from microphone..." << std::endl;
  std::cout << "[AudioTranscriptionTest] Press Ctrl+C to exit." << std::endl;

  try {
    moduleData->run(100, [&]() {});
  } catch (const std::exception& e) {
    std::cerr << "[AudioTranscriptionTest] EXCEPTION: " << e.what() << std::endl;
  } catch (...) {
    std::cerr << "[AudioTranscriptionTest] UNKNOWN EXCEPTION CAUGHT" << std::endl;
  }
}
