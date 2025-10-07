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

#include "SignalOutputDataStore.h"
#include <memory>
#include <string>
#include <xrpa-runtime/transport/TransportStream.h>
#include <xrpa-runtime/utils/XrpaModule.h>

class XredOutputModule : public Xrpa::XrpaModule {
 public:
  XredOutputModule(std::shared_ptr<Xrpa::TransportStream> SignalOutputInboundTransport, std::shared_ptr<Xrpa::TransportStream> SignalOutputOutboundTransport) {
    signalOutputDataStore = std::make_shared<SignalOutputDataStore::SignalOutputDataStore>(SignalOutputInboundTransport, SignalOutputOutboundTransport);
  }

  virtual ~XredOutputModule() override {
    shutdown();
  }

  std::shared_ptr<SignalOutputDataStore::SignalOutputDataStore> signalOutputDataStore;

  class XredOutputSettings {
   public:

    // creates a dummy output device with the given name
    std::string dummyDevice;
  };
  XredOutputSettings settings{""};

  virtual void shutdown() override {
    signalOutputDataStore->shutdown();
  }

 protected:
  virtual void tickInputs() override {
    signalOutputDataStore->tickInbound();
  }

  virtual void tickOutputs() override {
    signalOutputDataStore->tickOutbound();
  }
};
