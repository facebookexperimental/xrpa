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
#include <lib/AudioTranscriptionTestModule.h>
#include <lib/AudioTranscriptionTypes.h>
#include <memory>
#include <thread>
#include <xrpa-runtime/transport/SharedMemoryTransportStream.h>
#include <xrpa-runtime/transport/TransportStream.h>

void EntryPoint(AudioTranscriptionTestModule* moduleData);

int RunStandalone(int argc, char** argv) {
  std::shared_ptr<Xrpa::TransportStream> AudioInputInboundTransport;
  std::shared_ptr<Xrpa::TransportStream> AudioInputOutboundTransport;
  std::shared_ptr<Xrpa::TransportStream> AudioTranscriptionInboundTransport;
  std::shared_ptr<Xrpa::TransportStream> AudioTranscriptionOutboundTransport;
  {
    auto localAudioInputInboundTransport = std::make_shared<Xrpa::SharedMemoryTransportStream>("AudioInputOutput", AudioInputDataStore::GenTransportConfig());
    AudioInputInboundTransport = localAudioInputInboundTransport;

    auto localAudioInputOutboundTransport = std::make_shared<Xrpa::SharedMemoryTransportStream>("AudioInputInput", AudioInputDataStore::GenTransportConfig());
    AudioInputOutboundTransport = localAudioInputOutboundTransport;
  }
  {
    auto localAudioTranscriptionInboundTransport = std::make_shared<Xrpa::SharedMemoryTransportStream>("AudioTranscriptionOutput", AudioTranscriptionDataStore::GenTransportConfig());
    AudioTranscriptionInboundTransport = localAudioTranscriptionInboundTransport;

    auto localAudioTranscriptionOutboundTransport = std::make_shared<Xrpa::SharedMemoryTransportStream>("AudioTranscriptionInput", AudioTranscriptionDataStore::GenTransportConfig());
    AudioTranscriptionOutboundTransport = localAudioTranscriptionOutboundTransport;
  }
  auto moduleData = std::make_unique<AudioTranscriptionTestModule>(AudioInputInboundTransport, AudioInputOutboundTransport, AudioTranscriptionInboundTransport, AudioTranscriptionOutboundTransport);

  std::thread dataThread(EntryPoint, moduleData.get());
  std::getchar();
  moduleData->stop();
  dataThread.join();
  return 0;
}
