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

#include "SignalOutputDevice.h"

#include <xrpa-runtime/external_utils/UuidGen.h>

#include "XredSignalOutputSource.h"

SignalOutputDevice::SignalOutputDevice()
    : SignalOutputDataStore::OutboundSignalOutputDevice(Xrpa::generateUuid()) {}

void SignalOutputDevice::readInterleavedData(float* outputBuffer, int outputFrames) {
  int inputFrames = std::min(outputFrames, getReadFramesAvailable());
  int inputSamples = inputFrames * getNumChannels();
  int outputSamples = outputFrames * getNumChannels();

  // sum all sources
  int count = 0;
  for (auto& signal : signals_) {
    if (auto source = signal.lock()) {
      if (count == 0) {
        source->readInterleavedData(outputBuffer, inputFrames);
      } else {
        if (count == 1) {
          // only allocate the readBuffer if there are multiple sources
          tempReadBuffer_.resize(inputSamples);
        }
        source->readInterleavedData(tempReadBuffer_.data(), inputFrames);
        for (int i = 0; i < inputSamples; ++i) {
          outputBuffer[i] += tempReadBuffer_[i];
        }
      }
      ++count;
    }
  }

  if (inputSamples < outputSamples) {
    std::fill(outputBuffer + inputSamples, outputBuffer + outputSamples, 0.0f);
  }
}
