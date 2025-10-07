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

#include <lib/OcrTestModule.h>
#include <lib/OcrTestProgram.h>
#include <algorithm>
#include <cctype>
#include <iostream>

void EntryPoint(OcrTestModule* moduleData) {
  std::cout << "[OcrTest] Starting Smart Speaker OCR Test program..." << std::endl;
  auto ocrTestProgram = std::make_shared<XrpaDataflowPrograms::OcrTestProgram>(
      moduleData->audioInputDataStore,
      moduleData->audioTranscriptionDataStore,
      moduleData->cameraDataStore,
      moduleData->imageViewerDataStore,
      moduleData->opticalCharacterRecognitionDataStore);

  std::cout << "[OcrTest] Program created successfully" << std::endl;

  ocrTestProgram->onOcrResult([](uint64_t timestamp,
                                 const std::string& text,
                                 std::chrono::nanoseconds ocrTimestamp,
                                 bool success,
                                 const std::string& errorMessage) {
    try {
      std::cout << "[OCR] Timestamp: " << timestamp << ", Text: \"" << text << "\""
                << ", Success: " << (success ? "true" : "false")
                << ", OCR Timestamp: " << ocrTimestamp.count();

      if (!success && !errorMessage.empty()) {
        std::cout << ", Error: " << errorMessage;
      }
      std::cout << std::endl;
    } catch (const std::exception& e) {
      std::cout << "[OCR] Error processing OCR result: " << e.what() << std::endl;
    } catch (...) {
      std::cout << "[OCR] Unknown error processing OCR result" << std::endl;
    }
  });

  ocrTestProgram->onSpeechCommand([&ocrTestProgram](
                                      uint64_t timestamp,
                                      const std::string& text,
                                      std::chrono::nanoseconds ocrTimestamp,
                                      bool success,
                                      const std::string&) {
    std::cout << "[SpeechToText] Timestamp: " << timestamp << ", Command: \"" << text << "\""
              << ", Success: " << (success ? "true" : "false") << std::endl;

    std::string lowerText = text;
    std::transform(lowerText.begin(), lowerText.end(), lowerText.begin(), ::tolower);

    if (lowerText.find("transcribe") != std::string::npos ||
        lowerText.find("read this") != std::string::npos ||
        lowerText.find("ocr") != std::string::npos) {
      std::cout << "[OcrTest] Transcription command detected! Triggering OCR processing..."
                << std::endl;

      int ocrTriggerId = ocrTestProgram->getOcrTriggerId() + 1;
      std::cout << "[OcrTest] Triggering OCR processing " << ocrTriggerId << std::endl;
      ocrTestProgram->setOcrTriggerId(ocrTriggerId);
    }
  });

  std::cout << "[OcrTest] Event handlers set up" << std::endl;
  std::cout << "[OcrTest] Smart Speaker OCR workflow ready:" << std::endl;
  std::cout << "[OcrTest]   1. Camera is recording continuously" << std::endl;
  std::cout << "[OcrTest]   2. Say: 'Hey, help me transcribe this'" << std::endl;
  std::cout << "[OcrTest]   3. Hold up document/handwritten note to camera" << std::endl;
  std::cout << "[OcrTest]   4. OCR processes the image" << std::endl;
  std::cout << "[OcrTest]   5. Transcribed text appears in console" << std::endl;
  std::cout << "[OcrTest] Starting main loop..." << std::endl;

  moduleData->run(100, [&]() {});
}
