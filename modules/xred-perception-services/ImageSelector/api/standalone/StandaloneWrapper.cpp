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

#include <lib/ImageSelectorModule.h>
#include <lib/ImageSelectorTypes.h>
#include <memory>
#include <thread>
#include <xrpa-runtime/transport/SharedMemoryTransportStream.h>
#include <xrpa-runtime/transport/TransportStream.h>

void EntryPoint(ImageSelectorModule* moduleData);

int RunStandalone(int argc, char** argv) {
  std::shared_ptr<Xrpa::TransportStream> ImageSelectorInboundTransport;
  std::shared_ptr<Xrpa::TransportStream> ImageSelectorOutboundTransport;
  {
    auto localImageSelectorInboundTransport = std::make_shared<Xrpa::SharedMemoryTransportStream>("ImageSelectorInput", ImageSelectorDataStore::GenTransportConfig());
    ImageSelectorInboundTransport = localImageSelectorInboundTransport;

    auto localImageSelectorOutboundTransport = std::make_shared<Xrpa::SharedMemoryTransportStream>("ImageSelectorOutput", ImageSelectorDataStore::GenTransportConfig());
    ImageSelectorOutboundTransport = localImageSelectorOutboundTransport;
  }
  auto moduleData = std::make_unique<ImageSelectorModule>(ImageSelectorInboundTransport, ImageSelectorOutboundTransport);

  std::thread dataThread(EntryPoint, moduleData.get());
  std::getchar();
  moduleData->stop();
  dataThread.join();
  return 0;
}
