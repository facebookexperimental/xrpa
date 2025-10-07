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

#include <lib/AudioInputTypes.h>
#include <lib/SpeakerIdentificationTestModule.h>
#include <lib/SpeakerIdentificationTypes.h>
#include <memory>
#include <thread>
#include <xrpa-runtime/transport/SharedMemoryTransportStream.h>
#include <xrpa-runtime/transport/TransportStream.h>

void EntryPoint(SpeakerIdentificationTestModule* moduleData);

int RunStandalone(int argc, char** argv) {
  std::shared_ptr<Xrpa::TransportStream> AudioInputInboundTransport;
  std::shared_ptr<Xrpa::TransportStream> AudioInputOutboundTransport;
  std::shared_ptr<Xrpa::TransportStream> SpeakerIdentificationInboundTransport;
  std::shared_ptr<Xrpa::TransportStream> SpeakerIdentificationOutboundTransport;
  {
    auto localAudioInputInboundTransport = std::make_shared<Xrpa::SharedMemoryTransportStream>("AudioInputOutput", AudioInputDataStore::GenTransportConfig());
    AudioInputInboundTransport = localAudioInputInboundTransport;

    auto localAudioInputOutboundTransport = std::make_shared<Xrpa::SharedMemoryTransportStream>("AudioInputInput", AudioInputDataStore::GenTransportConfig());
    AudioInputOutboundTransport = localAudioInputOutboundTransport;
  }
  {
    auto localSpeakerIdentificationInboundTransport = std::make_shared<Xrpa::SharedMemoryTransportStream>("SpeakerIdentificationOutput", SpeakerIdentificationDataStore::GenTransportConfig());
    SpeakerIdentificationInboundTransport = localSpeakerIdentificationInboundTransport;

    auto localSpeakerIdentificationOutboundTransport = std::make_shared<Xrpa::SharedMemoryTransportStream>("SpeakerIdentificationInput", SpeakerIdentificationDataStore::GenTransportConfig());
    SpeakerIdentificationOutboundTransport = localSpeakerIdentificationOutboundTransport;
  }
  auto moduleData = std::make_unique<SpeakerIdentificationTestModule>(AudioInputInboundTransport, AudioInputOutboundTransport, SpeakerIdentificationInboundTransport, SpeakerIdentificationOutboundTransport);

  std::thread dataThread(EntryPoint, moduleData.get());
  std::getchar();
  moduleData->stop();
  dataThread.join();
  return 0;
}
