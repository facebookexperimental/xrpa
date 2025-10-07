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

#include <lib/AudioInputModule.h>
#include <iostream>

#include "AudioInputDevice.h"
#include "AudioInputSource.h"

// need to run the main loop at a fast enough rate to keep the latency of streamed in signals low
constexpr int kMainLoopPeriod = 4; // in milliseconds
constexpr int kUpdateRate = 1000 / kMainLoopPeriod;

void EntryPoint(AudioInputModule* moduleData) {
  AudioSystemHandle audioSystem;

  AudioInputSource::registerDelegate(moduleData->audioInputDataStore);

  auto audioDevices = AudioInputDevice::createAudioDevices(audioSystem);
  for (auto& device : audioDevices) {
    moduleData->audioInputDataStore->AudioInputDevice->addObject(device);
    std::cout << "Added audio device: " << device->getDeviceName() << std::endl;
  }

  moduleData->run(kUpdateRate, [&]() {
    for (auto& source : *moduleData->audioInputDataStore->AudioInputSource) {
      if (auto audioSource = std::dynamic_pointer_cast<AudioInputSource>(source)) {
        audioSource->tick();
      }
    }
  });
}
