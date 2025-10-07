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

#include <lib/LlmDebugModule.h>
#include <lib/SimpleConversation.h>
#include <lib/SimpleQuery.h>

#include <fstream>
#include <iostream>
#include <string>

void EntryPoint(LlmDebugModule* moduleData) {
  std::cout << "[LlmDebug] Starting LlmDebug program..." << std::endl;
  auto conversation =
      std::make_shared<XrpaDataflowPrograms::SimpleConversation>(moduleData->llmHubDataStore);
  auto query = std::make_shared<XrpaDataflowPrograms::SimpleQuery>(moduleData->llmHubDataStore);

  std::ifstream secretsFile("secrets.txt");
  if (secretsFile.is_open()) {
    std::string apiKey;
    std::getline(secretsFile, apiKey);
    secretsFile.close();
    conversation->setApiKey(apiKey);
    query->setApiKey(apiKey);
  }

  conversation->sendChatMessage("What is the capital of France?", {}, 2);

  conversation->onChatResponse([&](uint64_t /*timestamp*/, const std::string& response, int id) {
    std::cout << "[LlmDebug] Conversation response [" << id << "]: " << response << std::endl;
    if (id == 2) {
      conversation->sendChatMessage("And what is the population of France?", {}, 51);
    }
  });

  std::vector<uint8_t> jpegImageData;
  std::ifstream jpegFile("test.jpg", std::ios::binary);
  if (jpegFile.is_open()) {
    jpegImageData = std::vector<uint8_t>(std::istreambuf_iterator<char>(jpegFile), {});
    jpegFile.close();
  }

  query->sendQuery("What is in this image?", jpegImageData, 1);

  query->onResponse([&](uint64_t /*timestamp*/, const std::string& response, int id) {
    std::cout << "[LlmDebug] Query response [" << id << "]: " << response << std::endl;
  });

  moduleData->run(100, [&]() {});
}
