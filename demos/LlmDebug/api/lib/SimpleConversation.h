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

// @generated

#pragma once

#include "LlmHubDataStore.h"
#include "LlmHubTypes.h"
#include <functional>
#include <string>
#include <vector>

namespace XrpaDataflowPrograms {

class SimpleConversation {
 public:
  explicit SimpleConversation(std::shared_ptr<LlmHubDataStore::LlmHubDataStore> datastoreLlmHub) : datastoreLlmHub_(datastoreLlmHub) {
    createObjects();
  }

  ~SimpleConversation() {
    destroyObjects();
  }

  const std::string& getApiKey() const {
    return paramApiKey_;
  }

  void setApiKey(const std::string& apiKey) {
    paramApiKey_ = apiKey;
    if (objLlmHubLlmConversation2_) {
      objLlmHubLlmConversation2_->setApiKey(apiKey);
    }
  }

  void sendChatMessage(const std::string& data, const std::vector<uint8_t>& jpegImageData, int id) {
    if (objLlmHubLlmConversation2_) {
      objLlmHubLlmConversation2_->sendChatMessage(data, jpegImageData, id);
    }
  }

  void onChatResponse(std::function<void(uint64_t, const std::string&, int)> handler) {
    paramChatResponse_ = handler;
  }

  void terminate() {
    destroyObjects();
  }

 private:
  void dispatchObjLlmHubLlmConversation2_ChatResponse(uint64_t msgTimestamp, LlmHubDataStore::LlmChatResponseReader msg) {
    auto data = msg.getData();
    auto id = msg.getId();
    if (paramChatResponse_) {
      paramChatResponse_(msgTimestamp, data, id);
    }
  }

  void createObjects() {
    objLlmHubMcpServerSet0_ = datastoreLlmHub_->McpServerSet->createObject();
    objLlmHubLlmConversation2_ = datastoreLlmHub_->LlmConversation->createObject();
    objLlmHubMcpServerConfig1_ = datastoreLlmHub_->McpServerConfig->createObject();
    objLlmHubLlmConversation2_->setApiKey(paramApiKey_);
    objLlmHubLlmConversation2_->setModelSize(static_cast<LlmHubDataStore::ModelSizeHint>(1));
    objLlmHubLlmConversation2_->setApiProvider(static_cast<LlmHubDataStore::ApiProvider>(1));
    objLlmHubLlmConversation2_->setSysPrompt("You are a character in an Oscar Wilde play. Respond using appropriate dialect.");
    objLlmHubLlmConversation2_->setMcpServerSet(objLlmHubMcpServerSet0_->getXrpaId());
    objLlmHubMcpServerConfig1_->setUrl("http://127.0.0.1:3120/mcp");
    objLlmHubMcpServerConfig1_->setAuthToken("");
    objLlmHubMcpServerConfig1_->setServerSet(objLlmHubMcpServerSet0_->getXrpaId());
    objLlmHubLlmConversation2_->onChatResponse([this](auto p0, auto p1) { dispatchObjLlmHubLlmConversation2_ChatResponse(p0, p1); });
  }

  void destroyObjects() {
    if (objLlmHubMcpServerConfig1_) {
      datastoreLlmHub_->McpServerConfig->removeObject(objLlmHubMcpServerConfig1_->getXrpaId());
      objLlmHubMcpServerConfig1_ = nullptr;
    }
    if (objLlmHubLlmConversation2_) {
      datastoreLlmHub_->LlmConversation->removeObject(objLlmHubLlmConversation2_->getXrpaId());
      objLlmHubLlmConversation2_ = nullptr;
    }
    if (objLlmHubMcpServerSet0_) {
      datastoreLlmHub_->McpServerSet->removeObject(objLlmHubMcpServerSet0_->getXrpaId());
      objLlmHubMcpServerSet0_ = nullptr;
    }
  }

  std::shared_ptr<LlmHubDataStore::LlmHubDataStore> datastoreLlmHub_;
  std::string paramApiKey_ = "";
  std::function<void(uint64_t, const std::string&, int)> paramChatResponse_ = nullptr;
  std::shared_ptr<LlmHubDataStore::OutboundMcpServerSet> objLlmHubMcpServerSet0_;
  std::shared_ptr<LlmHubDataStore::OutboundLlmConversation> objLlmHubLlmConversation2_;
  std::shared_ptr<LlmHubDataStore::OutboundMcpServerConfig> objLlmHubMcpServerConfig1_;
};

} // namespace XrpaDataflowPrograms
