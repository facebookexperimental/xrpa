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

#include <lib/TestSignal1.h>
#include <lib/TestSignal2.h>
#include <lib/TestSignal3.h>
#include <lib/TestSignalGenModule.h>

#include <memory>

void EntryPoint(TestSignalGenModule* moduleData) {
  auto signal = std::make_shared<XrpaDataflowPrograms::TestSignal3>(
      moduleData->signalOutputDataStore, moduleData->signalProcessingDataStore);

  moduleData->run(60, [&]() {
    // gain->setGainValue(sin(moduleData->getTimeInSeconds()));
  });
}
