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

#include "SignalProcessingDataStore.h"
#include "TextToSpeechDataStore.h"
#include <memory>
#include <xrpa-runtime/transport/TransportStream.h>
#include <xrpa-runtime/utils/XrpaModule.h>

class TextToSpeechTestModule : public Xrpa::XrpaModule {
 public:
  TextToSpeechTestModule(std::shared_ptr<Xrpa::TransportStream> TextToSpeechInboundTransport, std::shared_ptr<Xrpa::TransportStream> TextToSpeechOutboundTransport, std::shared_ptr<Xrpa::TransportStream> SignalProcessingInboundTransport, std::shared_ptr<Xrpa::TransportStream> SignalProcessingOutboundTransport) {
    textToSpeechDataStore = std::make_shared<TextToSpeechDataStore::TextToSpeechDataStore>(TextToSpeechInboundTransport, TextToSpeechOutboundTransport);
    signalProcessingDataStore = std::make_shared<SignalProcessingDataStore::SignalProcessingDataStore>(SignalProcessingInboundTransport, SignalProcessingOutboundTransport);
  }

  virtual ~TextToSpeechTestModule() override {
    shutdown();
  }

  std::shared_ptr<TextToSpeechDataStore::TextToSpeechDataStore> textToSpeechDataStore;
  std::shared_ptr<SignalProcessingDataStore::SignalProcessingDataStore> signalProcessingDataStore;

  virtual void shutdown() override {
    textToSpeechDataStore->shutdown();
    signalProcessingDataStore->shutdown();
  }

 protected:
  virtual void tickInputs() override {
    textToSpeechDataStore->tickInbound();
    signalProcessingDataStore->tickInbound();
  }

  virtual void tickOutputs() override {
    textToSpeechDataStore->tickOutbound();
    signalProcessingDataStore->tickOutbound();
  }
};
