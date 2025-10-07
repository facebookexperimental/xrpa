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
#include "SignalProcessingDataStore.h"
#include <memory>
#include <xrpa-runtime/transport/TransportStream.h>
#include <xrpa-runtime/utils/XrpaModule.h>

class TestSignalGenModule : public Xrpa::XrpaModule {
 public:
  TestSignalGenModule(std::shared_ptr<Xrpa::TransportStream> SignalProcessingInboundTransport, std::shared_ptr<Xrpa::TransportStream> SignalProcessingOutboundTransport, std::shared_ptr<Xrpa::TransportStream> SignalOutputInboundTransport, std::shared_ptr<Xrpa::TransportStream> SignalOutputOutboundTransport) {
    signalProcessingDataStore = std::make_shared<SignalProcessingDataStore::SignalProcessingDataStore>(SignalProcessingInboundTransport, SignalProcessingOutboundTransport);
    signalOutputDataStore = std::make_shared<SignalOutputDataStore::SignalOutputDataStore>(SignalOutputInboundTransport, SignalOutputOutboundTransport);
  }

  virtual ~TestSignalGenModule() override {
    shutdown();
  }

  std::shared_ptr<SignalProcessingDataStore::SignalProcessingDataStore> signalProcessingDataStore;
  std::shared_ptr<SignalOutputDataStore::SignalOutputDataStore> signalOutputDataStore;

  virtual void shutdown() override {
    signalProcessingDataStore->shutdown();
    signalOutputDataStore->shutdown();
  }

 protected:
  virtual void tickInputs() override {
    signalProcessingDataStore->tickInbound();
    signalOutputDataStore->tickInbound();
  }

  virtual void tickOutputs() override {
    signalProcessingDataStore->tickOutbound();
    signalOutputDataStore->tickOutbound();
  }
};
