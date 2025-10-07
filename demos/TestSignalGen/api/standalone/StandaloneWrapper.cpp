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

#include <lib/SignalOutputTypes.h>
#include <lib/SignalProcessingTypes.h>
#include <lib/TestSignalGenModule.h>
#include <memory>
#include <thread>
#include <xrpa-runtime/transport/SharedMemoryTransportStream.h>
#include <xrpa-runtime/transport/TransportStream.h>

void EntryPoint(TestSignalGenModule* moduleData);

int RunStandalone(int argc, char** argv) {
  std::shared_ptr<Xrpa::TransportStream> SignalProcessingInboundTransport;
  std::shared_ptr<Xrpa::TransportStream> SignalProcessingOutboundTransport;
  std::shared_ptr<Xrpa::TransportStream> SignalOutputInboundTransport;
  std::shared_ptr<Xrpa::TransportStream> SignalOutputOutboundTransport;
  {
    auto localSignalProcessingInboundTransport = std::make_shared<Xrpa::SharedMemoryTransportStream>("SignalProcessingOutput", SignalProcessingDataStore::GenTransportConfig());
    SignalProcessingInboundTransport = localSignalProcessingInboundTransport;

    auto localSignalProcessingOutboundTransport = std::make_shared<Xrpa::SharedMemoryTransportStream>("SignalProcessingInput", SignalProcessingDataStore::GenTransportConfig());
    SignalProcessingOutboundTransport = localSignalProcessingOutboundTransport;
  }
  {
    auto localSignalOutputInboundTransport = std::make_shared<Xrpa::SharedMemoryTransportStream>("SignalOutputOutput", SignalOutputDataStore::GenTransportConfig());
    SignalOutputInboundTransport = localSignalOutputInboundTransport;

    auto localSignalOutputOutboundTransport = std::make_shared<Xrpa::SharedMemoryTransportStream>("SignalOutputInput", SignalOutputDataStore::GenTransportConfig());
    SignalOutputOutboundTransport = localSignalOutputOutboundTransport;
  }
  auto moduleData = std::make_unique<TestSignalGenModule>(SignalProcessingInboundTransport, SignalProcessingOutboundTransport, SignalOutputInboundTransport, SignalOutputOutboundTransport);

  std::thread dataThread(EntryPoint, moduleData.get());
  std::getchar();
  moduleData->stop();
  dataThread.join();
  return 0;
}
