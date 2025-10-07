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

#include "AudioInputDataStore.h"
#include <memory>
#include <xrpa-runtime/transport/TransportStream.h>
#include <xrpa-runtime/utils/XrpaModule.h>

class AudioInputModule : public Xrpa::XrpaModule {
 public:
  AudioInputModule(std::shared_ptr<Xrpa::TransportStream> AudioInputInboundTransport, std::shared_ptr<Xrpa::TransportStream> AudioInputOutboundTransport) {
    audioInputDataStore = std::make_shared<AudioInputDataStore::AudioInputDataStore>(AudioInputInboundTransport, AudioInputOutboundTransport);
  }

  virtual ~AudioInputModule() override {
    shutdown();
  }

  std::shared_ptr<AudioInputDataStore::AudioInputDataStore> audioInputDataStore;

  virtual void shutdown() override {
    audioInputDataStore->shutdown();
  }

 protected:
  virtual void tickInputs() override {
    audioInputDataStore->tickInbound();
  }

  virtual void tickOutputs() override {
    audioInputDataStore->tickOutbound();
  }
};
