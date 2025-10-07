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

#include "Standalone.h"

#include <CLI/CLI.hpp>
#include <lib/FiducialsModule.h>
#include <lib/TrackingTypes.h>
#include <memory>
#include <thread>
#include <xrpa-runtime/external_utils/CommandLineUtils.h>
#include <xrpa-runtime/transport/SharedMemoryTransportStream.h>
#include <xrpa-runtime/transport/TransportStream.h>

void EntryPoint(FiducialsModule* moduleData);

int RunStandalone(int argc, char** argv) {
  std::shared_ptr<Xrpa::TransportStream> TrackingInboundTransport;
  std::shared_ptr<Xrpa::TransportStream> TrackingOutboundTransport;
  {
    auto localTrackingInboundTransport = std::make_shared<Xrpa::SharedMemoryTransportStream>("TrackingInput", TrackingDataStore::GenTransportConfig());
    TrackingInboundTransport = localTrackingInboundTransport;

    auto localTrackingOutboundTransport = std::make_shared<Xrpa::SharedMemoryTransportStream>("TrackingOutput", TrackingDataStore::GenTransportConfig());
    TrackingOutboundTransport = localTrackingOutboundTransport;
  }
  auto moduleData = std::make_unique<FiducialsModule>(TrackingInboundTransport, TrackingOutboundTransport);
  CLI::App app{"Fiducials"};
  app.add_option("--codeSizeCm", moduleData->settings.codeSizeCm, "Size of the fiducial code in centimeters, including the white border");
  app.add_option("--showDebugWindow", moduleData->settings.showDebugWindow, "Set to 1 to show the video feed in a separate window");
  app.add_option("--cameraTranslation", moduleData->settings.cameraTranslation, "The translation offset of the camera from the HMD origin, in centimeters, x-right, y-up, z-forward");
  app.add_option("--cameraRotationYPR", moduleData->settings.cameraRotationYPR, "The rotation offset of the camera from the HMD coordinate frame, in degrees, using Euler angles YPR");
  try {
    app.parse(Xrpa::processCommandLine(argc, argv));
  } catch(const CLI::ParseError &e) {
    app.exit(e);
  }

  std::thread dataThread(EntryPoint, moduleData.get());
  std::getchar();
  moduleData->stop();
  dataThread.join();
  return 0;
}
