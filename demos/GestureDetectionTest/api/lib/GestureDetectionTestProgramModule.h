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

#include "CameraDataStore.h"
#include "GestureDetectionDataStore.h"
#include "ImageViewerDataStore.h"
#include <memory>
#include <xrpa-runtime/transport/TransportStream.h>
#include <xrpa-runtime/utils/XrpaModule.h>

class GestureDetectionTestProgramModule : public Xrpa::XrpaModule {
 public:
  GestureDetectionTestProgramModule(std::shared_ptr<Xrpa::TransportStream> CameraInboundTransport, std::shared_ptr<Xrpa::TransportStream> CameraOutboundTransport, std::shared_ptr<Xrpa::TransportStream> ImageViewerInboundTransport, std::shared_ptr<Xrpa::TransportStream> ImageViewerOutboundTransport, std::shared_ptr<Xrpa::TransportStream> GestureDetectionInboundTransport, std::shared_ptr<Xrpa::TransportStream> GestureDetectionOutboundTransport) {
    cameraDataStore = std::make_shared<CameraDataStore::CameraDataStore>(CameraInboundTransport, CameraOutboundTransport);
    imageViewerDataStore = std::make_shared<ImageViewerDataStore::ImageViewerDataStore>(ImageViewerInboundTransport, ImageViewerOutboundTransport);
    gestureDetectionDataStore = std::make_shared<GestureDetectionDataStore::GestureDetectionDataStore>(GestureDetectionInboundTransport, GestureDetectionOutboundTransport);
  }

  virtual ~GestureDetectionTestProgramModule() override {
    shutdown();
  }

  std::shared_ptr<CameraDataStore::CameraDataStore> cameraDataStore;
  std::shared_ptr<ImageViewerDataStore::ImageViewerDataStore> imageViewerDataStore;
  std::shared_ptr<GestureDetectionDataStore::GestureDetectionDataStore> gestureDetectionDataStore;

  virtual void shutdown() override {
    cameraDataStore->shutdown();
    imageViewerDataStore->shutdown();
    gestureDetectionDataStore->shutdown();
  }

 protected:
  virtual void tickInputs() override {
    cameraDataStore->tickInbound();
    imageViewerDataStore->tickInbound();
    gestureDetectionDataStore->tickInbound();
  }

  virtual void tickOutputs() override {
    cameraDataStore->tickOutbound();
    imageViewerDataStore->tickOutbound();
    gestureDetectionDataStore->tickOutbound();
  }
};
