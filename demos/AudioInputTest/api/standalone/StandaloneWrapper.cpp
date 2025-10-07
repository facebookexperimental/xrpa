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

#include <lib/AudioInputTestModule.h>
#include <lib/AudioInputTypes.h>
#include <lib/SignalProcessingTypes.h>
#include <memory>
#include <thread>
#include <xrpa-runtime/transport/SharedMemoryTransportStream.h>
#include <xrpa-runtime/transport/TransportStream.h>

void EntryPoint(AudioInputTestModule* moduleData);

int RunStandalone(int argc, char** argv) {
  std::shared_ptr<Xrpa::TransportStream> AudioInputInboundTransport;
  std::shared_ptr<Xrpa::TransportStream> AudioInputOutboundTransport;
  std::shared_ptr<Xrpa::TransportStream> SignalProcessingInboundTransport;
  std::shared_ptr<Xrpa::TransportStream> SignalProcessingOutboundTransport;
  {
    auto localAudioInputInboundTransport = std::make_shared<Xrpa::SharedMemoryTransportStream>("AudioInputOutput", AudioInputDataStore::GenTransportConfig());
    AudioInputInboundTransport = localAudioInputInboundTransport;

    auto localAudioInputOutboundTransport = std::make_shared<Xrpa::SharedMemoryTransportStream>("AudioInputInput", AudioInputDataStore::GenTransportConfig());
    AudioInputOutboundTransport = localAudioInputOutboundTransport;
  }
  {
    auto localSignalProcessingInboundTransport = std::make_shared<Xrpa::SharedMemoryTransportStream>("SignalProcessingOutput", SignalProcessingDataStore::GenTransportConfig());
    SignalProcessingInboundTransport = localSignalProcessingInboundTransport;

    auto localSignalProcessingOutboundTransport = std::make_shared<Xrpa::SharedMemoryTransportStream>("SignalProcessingInput", SignalProcessingDataStore::GenTransportConfig());
    SignalProcessingOutboundTransport = localSignalProcessingOutboundTransport;
  }
  auto moduleData = std::make_unique<AudioInputTestModule>(AudioInputInboundTransport, AudioInputOutboundTransport, SignalProcessingInboundTransport, SignalProcessingOutboundTransport);

  std::thread dataThread(EntryPoint, moduleData.get());
  std::getchar();
  moduleData->stop();
  dataThread.join();
  return 0;
}
