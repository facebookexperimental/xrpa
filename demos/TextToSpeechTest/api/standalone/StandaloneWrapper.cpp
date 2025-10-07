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

#include <lib/SignalProcessingTypes.h>
#include <lib/TextToSpeechTestModule.h>
#include <lib/TextToSpeechTypes.h>
#include <memory>
#include <thread>
#include <xrpa-runtime/transport/SharedMemoryTransportStream.h>
#include <xrpa-runtime/transport/TransportStream.h>

void EntryPoint(TextToSpeechTestModule* moduleData);

int RunStandalone(int argc, char** argv) {
  std::shared_ptr<Xrpa::TransportStream> TextToSpeechInboundTransport;
  std::shared_ptr<Xrpa::TransportStream> TextToSpeechOutboundTransport;
  std::shared_ptr<Xrpa::TransportStream> SignalProcessingInboundTransport;
  std::shared_ptr<Xrpa::TransportStream> SignalProcessingOutboundTransport;
  {
    auto localTextToSpeechInboundTransport = std::make_shared<Xrpa::SharedMemoryTransportStream>("TextToSpeechOutput", TextToSpeechDataStore::GenTransportConfig());
    TextToSpeechInboundTransport = localTextToSpeechInboundTransport;

    auto localTextToSpeechOutboundTransport = std::make_shared<Xrpa::SharedMemoryTransportStream>("TextToSpeechInput", TextToSpeechDataStore::GenTransportConfig());
    TextToSpeechOutboundTransport = localTextToSpeechOutboundTransport;
  }
  {
    auto localSignalProcessingInboundTransport = std::make_shared<Xrpa::SharedMemoryTransportStream>("SignalProcessingOutput", SignalProcessingDataStore::GenTransportConfig());
    SignalProcessingInboundTransport = localSignalProcessingInboundTransport;

    auto localSignalProcessingOutboundTransport = std::make_shared<Xrpa::SharedMemoryTransportStream>("SignalProcessingInput", SignalProcessingDataStore::GenTransportConfig());
    SignalProcessingOutboundTransport = localSignalProcessingOutboundTransport;
  }
  auto moduleData = std::make_unique<TextToSpeechTestModule>(TextToSpeechInboundTransport, TextToSpeechOutboundTransport, SignalProcessingInboundTransport, SignalProcessingOutboundTransport);

  std::thread dataThread(EntryPoint, moduleData.get());
  std::getchar();
  moduleData->stop();
  dataThread.join();
  return 0;
}
