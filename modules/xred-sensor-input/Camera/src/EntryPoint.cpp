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

#include <lib/CameraModule.h>

#include "CameraFeed.h"
#include "OceanSetup.h"

#include <iostream>

void EntryPoint(CameraModule* moduleData) {
  OceanSetup oceanSetup;

  auto mediaList = oceanSetup.getMedia();
  for (const auto& media : mediaList) {
    auto cameraDevice = moduleData->cameraDataStore->CameraDevice->createObject();
    cameraDevice->setName(media.url());
    std::cout << "Camera: " << media.url() << std::endl;
  }

  CameraFeed::registerDelegate(&oceanSetup, moduleData->cameraDataStore);

  moduleData->run(120, [&]() {
    for (const auto& feed : *moduleData->cameraDataStore->CameraFeed) {
      if (auto* cameraFeed = dynamic_cast<CameraFeed*>(feed.get())) {
        cameraFeed->tick();
      }
    }
  });
}
