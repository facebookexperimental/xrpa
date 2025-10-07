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

#include <lib/CameraModule.h>
#include <lib/CameraTypes.h>
#include <memory>
#include <thread>
#include <xrpa-runtime/transport/SharedMemoryTransportStream.h>
#include <xrpa-runtime/transport/TransportStream.h>

void EntryPoint(CameraModule* moduleData);

int RunStandalone(int argc, char** argv) {
  std::shared_ptr<Xrpa::TransportStream> CameraInboundTransport;
  std::shared_ptr<Xrpa::TransportStream> CameraOutboundTransport;
  {
    auto localCameraInboundTransport = std::make_shared<Xrpa::SharedMemoryTransportStream>("CameraInput", CameraDataStore::GenTransportConfig());
    CameraInboundTransport = localCameraInboundTransport;

    auto localCameraOutboundTransport = std::make_shared<Xrpa::SharedMemoryTransportStream>("CameraOutput", CameraDataStore::GenTransportConfig());
    CameraOutboundTransport = localCameraOutboundTransport;
  }
  auto moduleData = std::make_unique<CameraModule>(CameraInboundTransport, CameraOutboundTransport);

  std::thread dataThread(EntryPoint, moduleData.get());
  std::getchar();
  moduleData->stop();
  dataThread.join();
  return 0;
}
