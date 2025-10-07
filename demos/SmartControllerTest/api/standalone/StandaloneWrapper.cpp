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
#include <lib/SmartControllerTestModule.h>
#include <lib/SmartControllerTypes.h>
#include <memory>
#include <thread>
#include <xrpa-runtime/external_utils/CommandLineUtils.h>
#include <xrpa-runtime/transport/SharedMemoryTransportStream.h>
#include <xrpa-runtime/transport/TransportStream.h>

void EntryPoint(SmartControllerTestModule* moduleData);

int RunStandalone(int argc, char** argv) {
  std::shared_ptr<Xrpa::TransportStream> SmartControllerInboundTransport;
  std::shared_ptr<Xrpa::TransportStream> SmartControllerOutboundTransport;
  {
    auto localSmartControllerInboundTransport = std::make_shared<Xrpa::SharedMemoryTransportStream>("SmartControllerOutput", SmartControllerDataStore::GenTransportConfig());
    SmartControllerInboundTransport = localSmartControllerInboundTransport;

    auto localSmartControllerOutboundTransport = std::make_shared<Xrpa::SharedMemoryTransportStream>("SmartControllerInput", SmartControllerDataStore::GenTransportConfig());
    SmartControllerOutboundTransport = localSmartControllerOutboundTransport;
  }
  auto moduleData = std::make_unique<SmartControllerTestModule>(SmartControllerInboundTransport, SmartControllerOutboundTransport);
  CLI::App app{"SmartControllerTest"};
  app.add_option("--ipAddress", moduleData->settings.ipAddress, "IP address of the smart controller");
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
