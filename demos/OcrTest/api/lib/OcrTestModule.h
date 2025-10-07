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
#include "AudioTranscriptionDataStore.h"
#include "CameraDataStore.h"
#include "ImageViewerDataStore.h"
#include "OpticalCharacterRecognitionDataStore.h"
#include <memory>
#include <xrpa-runtime/transport/TransportStream.h>
#include <xrpa-runtime/utils/XrpaModule.h>

class OcrTestModule : public Xrpa::XrpaModule {
 public:
  OcrTestModule(std::shared_ptr<Xrpa::TransportStream> CameraInboundTransport, std::shared_ptr<Xrpa::TransportStream> CameraOutboundTransport, std::shared_ptr<Xrpa::TransportStream> ImageViewerInboundTransport, std::shared_ptr<Xrpa::TransportStream> ImageViewerOutboundTransport, std::shared_ptr<Xrpa::TransportStream> AudioInputInboundTransport, std::shared_ptr<Xrpa::TransportStream> AudioInputOutboundTransport, std::shared_ptr<Xrpa::TransportStream> AudioTranscriptionInboundTransport, std::shared_ptr<Xrpa::TransportStream> AudioTranscriptionOutboundTransport, std::shared_ptr<Xrpa::TransportStream> OpticalCharacterRecognitionInboundTransport, std::shared_ptr<Xrpa::TransportStream> OpticalCharacterRecognitionOutboundTransport) {
    cameraDataStore = std::make_shared<CameraDataStore::CameraDataStore>(CameraInboundTransport, CameraOutboundTransport);
    imageViewerDataStore = std::make_shared<ImageViewerDataStore::ImageViewerDataStore>(ImageViewerInboundTransport, ImageViewerOutboundTransport);
    audioInputDataStore = std::make_shared<AudioInputDataStore::AudioInputDataStore>(AudioInputInboundTransport, AudioInputOutboundTransport);
    audioTranscriptionDataStore = std::make_shared<AudioTranscriptionDataStore::AudioTranscriptionDataStore>(AudioTranscriptionInboundTransport, AudioTranscriptionOutboundTransport);
    opticalCharacterRecognitionDataStore = std::make_shared<OpticalCharacterRecognitionDataStore::OpticalCharacterRecognitionDataStore>(OpticalCharacterRecognitionInboundTransport, OpticalCharacterRecognitionOutboundTransport);
  }

  virtual ~OcrTestModule() override {
    shutdown();
  }

  std::shared_ptr<CameraDataStore::CameraDataStore> cameraDataStore;
  std::shared_ptr<ImageViewerDataStore::ImageViewerDataStore> imageViewerDataStore;
  std::shared_ptr<AudioInputDataStore::AudioInputDataStore> audioInputDataStore;
  std::shared_ptr<AudioTranscriptionDataStore::AudioTranscriptionDataStore> audioTranscriptionDataStore;
  std::shared_ptr<OpticalCharacterRecognitionDataStore::OpticalCharacterRecognitionDataStore> opticalCharacterRecognitionDataStore;

  virtual void shutdown() override {
    cameraDataStore->shutdown();
    imageViewerDataStore->shutdown();
    audioInputDataStore->shutdown();
    audioTranscriptionDataStore->shutdown();
    opticalCharacterRecognitionDataStore->shutdown();
  }

 protected:
  virtual void tickInputs() override {
    cameraDataStore->tickInbound();
    imageViewerDataStore->tickInbound();
    audioInputDataStore->tickInbound();
    audioTranscriptionDataStore->tickInbound();
    opticalCharacterRecognitionDataStore->tickInbound();
  }

  virtual void tickOutputs() override {
    cameraDataStore->tickOutbound();
    imageViewerDataStore->tickOutbound();
    audioInputDataStore->tickOutbound();
    audioTranscriptionDataStore->tickOutbound();
    opticalCharacterRecognitionDataStore->tickOutbound();
  }
};
