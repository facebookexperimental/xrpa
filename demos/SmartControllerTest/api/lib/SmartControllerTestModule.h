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

#include "SmartControllerDataStore.h"
#include <memory>
#include <string>
#include <xrpa-runtime/transport/TransportStream.h>
#include <xrpa-runtime/utils/XrpaModule.h>

class SmartControllerTestModule : public Xrpa::XrpaModule {
 public:
  SmartControllerTestModule(std::shared_ptr<Xrpa::TransportStream> SmartControllerInboundTransport, std::shared_ptr<Xrpa::TransportStream> SmartControllerOutboundTransport) {
    smartControllerDataStore = std::make_shared<SmartControllerDataStore::SmartControllerDataStore>(SmartControllerInboundTransport, SmartControllerOutboundTransport);
  }

  virtual ~SmartControllerTestModule() override {
    shutdown();
  }

  std::shared_ptr<SmartControllerDataStore::SmartControllerDataStore> smartControllerDataStore;

  class SmartControllerTestSettings {
   public:

    // IP address of the smart controller
    std::string ipAddress;
  };
  SmartControllerTestSettings settings{""};

  virtual void shutdown() override {
    smartControllerDataStore->shutdown();
  }

 protected:
  virtual void tickInputs() override {
    smartControllerDataStore->tickInbound();
  }

  virtual void tickOutputs() override {
    smartControllerDataStore->tickOutbound();
  }
};
