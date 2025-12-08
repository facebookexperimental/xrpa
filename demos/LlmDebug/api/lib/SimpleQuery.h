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
#include <xrpa-runtime/utils/ByteVector.h>

namespace XrpaDataflowPrograms {

class SimpleQuery {
 public:
  explicit SimpleQuery(std::shared_ptr<LlmHubDataStore::LlmHubDataStore> datastoreLlmHub) : datastoreLlmHub_(datastoreLlmHub) {
    createObjects();
  }

  ~SimpleQuery() {
    destroyObjects();
  }

  const std::string& getApiKey() const {
    return paramApiKey_;
  }

  void setApiKey(const std::string& apiKey) {
    paramApiKey_ = apiKey;
    if (objLlmHubLlmQuery0_) {
      objLlmHubLlmQuery0_->setApiKey(apiKey);
    }
  }

  void sendQuery(const std::string& data, const Xrpa::ByteVector& jpegImageData, int id) {
    if (objLlmHubLlmQuery0_) {
      objLlmHubLlmQuery0_->sendQuery(data, jpegImageData, id);
    }
  }

  void onResponse(std::function<void(uint64_t, const std::string&, int)> handler) {
    paramResponse_ = handler;
  }

  void terminate() {
    destroyObjects();
  }

 private:
  void dispatchObjLlmHubLlmQuery0_Response(uint64_t msgTimestamp, LlmHubDataStore::LlmChatResponseReader msg) {
    auto data = msg.getData();
    auto id = msg.getId();
    if (paramResponse_) {
      paramResponse_(msgTimestamp, data, id);
    }
  }

  void createObjects() {
    objLlmHubLlmQuery0_ = datastoreLlmHub_->LlmQuery->createObject();
    objLlmHubLlmQuery0_->setApiKey(paramApiKey_);
    objLlmHubLlmQuery0_->setModelSize(static_cast<LlmHubDataStore::ModelSizeHint>(0));
    objLlmHubLlmQuery0_->setApiProvider(static_cast<LlmHubDataStore::ApiProvider>(1));
    objLlmHubLlmQuery0_->setSysPrompt("You are a character in an Oscar Wilde play. Respond using appropriate dialect.");
    objLlmHubLlmQuery0_->onResponse([this](auto p0, auto p1) { dispatchObjLlmHubLlmQuery0_Response(p0, p1); });
  }

  void destroyObjects() {
    if (objLlmHubLlmQuery0_) {
      datastoreLlmHub_->LlmQuery->removeObject(objLlmHubLlmQuery0_->getXrpaId());
      objLlmHubLlmQuery0_ = nullptr;
    }
  }

  std::shared_ptr<LlmHubDataStore::LlmHubDataStore> datastoreLlmHub_;
  std::string paramApiKey_ = "";
  std::function<void(uint64_t, const std::string&, int)> paramResponse_ = nullptr;
  std::shared_ptr<LlmHubDataStore::OutboundLlmQuery> objLlmHubLlmQuery0_;
};

} // namespace XrpaDataflowPrograms
