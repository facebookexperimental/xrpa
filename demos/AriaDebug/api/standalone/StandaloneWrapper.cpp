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
#include <lib/AriaDebugModule.h>
#include <lib/AriaTypes.h>
#include <lib/ImageSelectorTypes.h>
#include <lib/ImageViewerTypes.h>
#include <lib/LlmHubTypes.h>
#include <lib/ObjectRecognitionTypes.h>
#include <lib/SignalProcessingTypes.h>
#include <memory>
#include <thread>
#include <xrpa-runtime/external_utils/CommandLineUtils.h>
#include <xrpa-runtime/transport/SharedMemoryTransportStream.h>
#include <xrpa-runtime/transport/TransportStream.h>

void EntryPoint(AriaDebugModule* moduleData);

int RunStandalone(int argc, char** argv) {
  std::shared_ptr<Xrpa::TransportStream> AriaInboundTransport;
  std::shared_ptr<Xrpa::TransportStream> AriaOutboundTransport;
  std::shared_ptr<Xrpa::TransportStream> ImageSelectorInboundTransport;
  std::shared_ptr<Xrpa::TransportStream> ImageSelectorOutboundTransport;
  std::shared_ptr<Xrpa::TransportStream> ObjectRecognitionInboundTransport;
  std::shared_ptr<Xrpa::TransportStream> ObjectRecognitionOutboundTransport;
  std::shared_ptr<Xrpa::TransportStream> LlmHubInboundTransport;
  std::shared_ptr<Xrpa::TransportStream> LlmHubOutboundTransport;
  std::shared_ptr<Xrpa::TransportStream> ImageViewerInboundTransport;
  std::shared_ptr<Xrpa::TransportStream> ImageViewerOutboundTransport;
  std::shared_ptr<Xrpa::TransportStream> SignalProcessingInboundTransport;
  std::shared_ptr<Xrpa::TransportStream> SignalProcessingOutboundTransport;
  {
    auto localAriaInboundTransport = std::make_shared<Xrpa::SharedMemoryTransportStream>("AriaOutput", AriaDataStore::GenTransportConfig());
    AriaInboundTransport = localAriaInboundTransport;

    auto localAriaOutboundTransport = std::make_shared<Xrpa::SharedMemoryTransportStream>("AriaInput", AriaDataStore::GenTransportConfig());
    AriaOutboundTransport = localAriaOutboundTransport;
  }
  {
    auto localImageSelectorInboundTransport = std::make_shared<Xrpa::SharedMemoryTransportStream>("ImageSelectorOutput", ImageSelectorDataStore::GenTransportConfig());
    ImageSelectorInboundTransport = localImageSelectorInboundTransport;

    auto localImageSelectorOutboundTransport = std::make_shared<Xrpa::SharedMemoryTransportStream>("ImageSelectorInput", ImageSelectorDataStore::GenTransportConfig());
    ImageSelectorOutboundTransport = localImageSelectorOutboundTransport;
  }
  {
    auto localObjectRecognitionInboundTransport = std::make_shared<Xrpa::SharedMemoryTransportStream>("ObjectRecognitionOutput", ObjectRecognitionDataStore::GenTransportConfig());
    ObjectRecognitionInboundTransport = localObjectRecognitionInboundTransport;

    auto localObjectRecognitionOutboundTransport = std::make_shared<Xrpa::SharedMemoryTransportStream>("ObjectRecognitionInput", ObjectRecognitionDataStore::GenTransportConfig());
    ObjectRecognitionOutboundTransport = localObjectRecognitionOutboundTransport;
  }
  {
    auto localLlmHubInboundTransport = std::make_shared<Xrpa::SharedMemoryTransportStream>("LlmHubOutput", LlmHubDataStore::GenTransportConfig());
    LlmHubInboundTransport = localLlmHubInboundTransport;

    auto localLlmHubOutboundTransport = std::make_shared<Xrpa::SharedMemoryTransportStream>("LlmHubInput", LlmHubDataStore::GenTransportConfig());
    LlmHubOutboundTransport = localLlmHubOutboundTransport;
  }
  {
    auto localImageViewerInboundTransport = std::make_shared<Xrpa::SharedMemoryTransportStream>("ImageViewerOutput", ImageViewerDataStore::GenTransportConfig());
    ImageViewerInboundTransport = localImageViewerInboundTransport;

    auto localImageViewerOutboundTransport = std::make_shared<Xrpa::SharedMemoryTransportStream>("ImageViewerInput", ImageViewerDataStore::GenTransportConfig());
    ImageViewerOutboundTransport = localImageViewerOutboundTransport;
  }
  {
    auto localSignalProcessingInboundTransport = std::make_shared<Xrpa::SharedMemoryTransportStream>("SignalProcessingOutput", SignalProcessingDataStore::GenTransportConfig());
    SignalProcessingInboundTransport = localSignalProcessingInboundTransport;

    auto localSignalProcessingOutboundTransport = std::make_shared<Xrpa::SharedMemoryTransportStream>("SignalProcessingInput", SignalProcessingDataStore::GenTransportConfig());
    SignalProcessingOutboundTransport = localSignalProcessingOutboundTransport;
  }
  auto moduleData = std::make_unique<AriaDebugModule>(AriaInboundTransport, AriaOutboundTransport, ImageSelectorInboundTransport, ImageSelectorOutboundTransport, ObjectRecognitionInboundTransport, ObjectRecognitionOutboundTransport, LlmHubInboundTransport, LlmHubOutboundTransport, ImageViewerInboundTransport, ImageViewerOutboundTransport, SignalProcessingInboundTransport, SignalProcessingOutboundTransport);
  CLI::App app{"AriaDebug"};
  app.add_option("--ipAddress", moduleData->settings.ipAddress, "IP address of the Aria glasses, or empty to use USB");
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
