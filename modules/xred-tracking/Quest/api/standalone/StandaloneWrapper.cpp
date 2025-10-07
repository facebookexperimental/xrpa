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

#include <lib/QuestModule.h>
#include <lib/TrackingTypes.h>
#include <memory>
#include <thread>
#include <xrpa-runtime/transport/SharedMemoryTransportStream.h>
#include <xrpa-runtime/transport/TransportStream.h>

void EntryPoint(QuestModule* moduleData);

int RunStandalone(int argc, char** argv) {
  std::shared_ptr<Xrpa::TransportStream> TrackingInboundTransport;
  std::shared_ptr<Xrpa::TransportStream> TrackingOutboundTransport;
  {
    auto localTrackingInboundTransport = std::make_shared<Xrpa::SharedMemoryTransportStream>("TrackingInput", TrackingDataStore::GenTransportConfig());
    TrackingInboundTransport = localTrackingInboundTransport;

    auto localTrackingOutboundTransport = std::make_shared<Xrpa::SharedMemoryTransportStream>("TrackingOutput", TrackingDataStore::GenTransportConfig());
    TrackingOutboundTransport = localTrackingOutboundTransport;
  }
  auto moduleData = std::make_unique<QuestModule>(TrackingInboundTransport, TrackingOutboundTransport);

  std::thread dataThread(EntryPoint, moduleData.get());
  std::getchar();
  moduleData->stop();
  dataThread.join();
  return 0;
}
