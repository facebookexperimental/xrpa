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

#include "ImageSelectorDataStore.h"
#include <memory>
#include <xrpa-runtime/transport/TransportStream.h>
#include <xrpa-runtime/utils/XrpaModule.h>

class ImageSelectorModule : public Xrpa::XrpaModule {
 public:
  ImageSelectorModule(std::shared_ptr<Xrpa::TransportStream> ImageSelectorInboundTransport, std::shared_ptr<Xrpa::TransportStream> ImageSelectorOutboundTransport) {
    imageSelectorDataStore = std::make_shared<ImageSelectorDataStore::ImageSelectorDataStore>(ImageSelectorInboundTransport, ImageSelectorOutboundTransport);
  }

  virtual ~ImageSelectorModule() override {
    shutdown();
  }

  std::shared_ptr<ImageSelectorDataStore::ImageSelectorDataStore> imageSelectorDataStore;

  virtual void shutdown() override {
    imageSelectorDataStore->shutdown();
  }

 protected:
  virtual void tickInputs() override {
    imageSelectorDataStore->tickInbound();
  }

  virtual void tickOutputs() override {
    imageSelectorDataStore->tickOutbound();
  }
};
