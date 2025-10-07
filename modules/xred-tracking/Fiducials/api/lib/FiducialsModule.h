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

#include "TrackingDataStore.h"
#include <array>
#include <memory>
#include <xrpa-runtime/transport/TransportStream.h>
#include <xrpa-runtime/utils/XrpaModule.h>

class FiducialsModule : public Xrpa::XrpaModule {
 public:
  FiducialsModule(std::shared_ptr<Xrpa::TransportStream> TrackingInboundTransport, std::shared_ptr<Xrpa::TransportStream> TrackingOutboundTransport) {
    trackingDataStore = std::make_shared<TrackingDataStore::TrackingDataStore>(TrackingInboundTransport, TrackingOutboundTransport);
  }

  virtual ~FiducialsModule() override {
    shutdown();
  }

  std::shared_ptr<TrackingDataStore::TrackingDataStore> trackingDataStore;

  class FiducialsSettings {
   public:

    // Size of the fiducial code in centimeters, including the white border
    float codeSizeCm;

    // Set to 1 to show the video feed in a separate window
    bool showDebugWindow;

    // The translation offset of the camera from the HMD origin, in centimeters, x-right, y-up, z-forward
    std::array<float, 3> cameraTranslation;

    // The rotation offset of the camera from the HMD coordinate frame, in degrees, using Euler angles YPR
    std::array<float, 3> cameraRotationYPR;
  };
  FiducialsSettings settings{19.f, false, std::array<float, 3>{0.f, 7.6f, -2.3f}, std::array<float, 3>{0.f, -15.f, 0.f}};

  virtual void shutdown() override {
    trackingDataStore->shutdown();
  }

 protected:
  virtual void tickInputs() override {
    trackingDataStore->tickInbound();
  }

  virtual void tickOutputs() override {
    trackingDataStore->tickOutbound();
  }
};
