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
#include <memory>
#include <xrpa-runtime/transport/TransportStream.h>
#include <xrpa-runtime/utils/XrpaModule.h>

class LlmDebugModule : public Xrpa::XrpaModule {
 public:
  LlmDebugModule(std::shared_ptr<Xrpa::TransportStream> LlmHubInboundTransport, std::shared_ptr<Xrpa::TransportStream> LlmHubOutboundTransport) {
    llmHubDataStore = std::make_shared<LlmHubDataStore::LlmHubDataStore>(LlmHubInboundTransport, LlmHubOutboundTransport);
  }

  virtual ~LlmDebugModule() override {
    shutdown();
  }

  std::shared_ptr<LlmHubDataStore::LlmHubDataStore> llmHubDataStore;

  virtual void shutdown() override {
    llmHubDataStore->shutdown();
  }

 protected:
  virtual void tickInputs() override {
    llmHubDataStore->tickInbound();
  }

  virtual void tickOutputs() override {
    llmHubDataStore->tickOutbound();
  }
};
