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

#include "AriaDataStore.h"
#include "ImageSelectorDataStore.h"
#include "ImageViewerDataStore.h"
#include "LlmHubDataStore.h"
#include "ObjectRecognitionDataStore.h"
#include "SignalProcessingDataStore.h"
#include <memory>
#include <string>
#include <xrpa-runtime/transport/TransportStream.h>
#include <xrpa-runtime/utils/XrpaModule.h>

class AriaDebugModule : public Xrpa::XrpaModule {
 public:
  AriaDebugModule(std::shared_ptr<Xrpa::TransportStream> AriaInboundTransport, std::shared_ptr<Xrpa::TransportStream> AriaOutboundTransport, std::shared_ptr<Xrpa::TransportStream> ImageSelectorInboundTransport, std::shared_ptr<Xrpa::TransportStream> ImageSelectorOutboundTransport, std::shared_ptr<Xrpa::TransportStream> ObjectRecognitionInboundTransport, std::shared_ptr<Xrpa::TransportStream> ObjectRecognitionOutboundTransport, std::shared_ptr<Xrpa::TransportStream> LlmHubInboundTransport, std::shared_ptr<Xrpa::TransportStream> LlmHubOutboundTransport, std::shared_ptr<Xrpa::TransportStream> ImageViewerInboundTransport, std::shared_ptr<Xrpa::TransportStream> ImageViewerOutboundTransport, std::shared_ptr<Xrpa::TransportStream> SignalProcessingInboundTransport, std::shared_ptr<Xrpa::TransportStream> SignalProcessingOutboundTransport) {
    ariaDataStore = std::make_shared<AriaDataStore::AriaDataStore>(AriaInboundTransport, AriaOutboundTransport);
    imageSelectorDataStore = std::make_shared<ImageSelectorDataStore::ImageSelectorDataStore>(ImageSelectorInboundTransport, ImageSelectorOutboundTransport);
    objectRecognitionDataStore = std::make_shared<ObjectRecognitionDataStore::ObjectRecognitionDataStore>(ObjectRecognitionInboundTransport, ObjectRecognitionOutboundTransport);
    llmHubDataStore = std::make_shared<LlmHubDataStore::LlmHubDataStore>(LlmHubInboundTransport, LlmHubOutboundTransport);
    imageViewerDataStore = std::make_shared<ImageViewerDataStore::ImageViewerDataStore>(ImageViewerInboundTransport, ImageViewerOutboundTransport);
    signalProcessingDataStore = std::make_shared<SignalProcessingDataStore::SignalProcessingDataStore>(SignalProcessingInboundTransport, SignalProcessingOutboundTransport);
  }

  virtual ~AriaDebugModule() override {
    shutdown();
  }

  std::shared_ptr<AriaDataStore::AriaDataStore> ariaDataStore;
  std::shared_ptr<ImageSelectorDataStore::ImageSelectorDataStore> imageSelectorDataStore;
  std::shared_ptr<ObjectRecognitionDataStore::ObjectRecognitionDataStore> objectRecognitionDataStore;
  std::shared_ptr<LlmHubDataStore::LlmHubDataStore> llmHubDataStore;
  std::shared_ptr<ImageViewerDataStore::ImageViewerDataStore> imageViewerDataStore;
  std::shared_ptr<SignalProcessingDataStore::SignalProcessingDataStore> signalProcessingDataStore;

  class AriaDebugSettings {
   public:

    // IP address of the Aria glasses, or empty to use USB
    std::string ipAddress;
  };
  AriaDebugSettings settings{""};

  virtual void shutdown() override {
    ariaDataStore->shutdown();
    imageSelectorDataStore->shutdown();
    objectRecognitionDataStore->shutdown();
    llmHubDataStore->shutdown();
    imageViewerDataStore->shutdown();
    signalProcessingDataStore->shutdown();
  }

 protected:
  virtual void tickInputs() override {
    ariaDataStore->tickInbound();
    imageSelectorDataStore->tickInbound();
    objectRecognitionDataStore->tickInbound();
    llmHubDataStore->tickInbound();
    imageViewerDataStore->tickInbound();
    signalProcessingDataStore->tickInbound();
  }

  virtual void tickOutputs() override {
    ariaDataStore->tickOutbound();
    imageSelectorDataStore->tickOutbound();
    objectRecognitionDataStore->tickOutbound();
    llmHubDataStore->tickOutbound();
    imageViewerDataStore->tickOutbound();
    signalProcessingDataStore->tickOutbound();
  }
};
