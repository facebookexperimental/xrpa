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

#pragma once

#include <lib/XredOutputModule.h>

#include <memory>
#include <vector>

class SignalOutputDevice : public SignalOutputDataStore::OutboundSignalOutputDevice {
 public:
  explicit SignalOutputDevice();

  virtual void tick() {}

  void addSource(std::shared_ptr<Xrpa::InboundSignalData<float>>& signal) {
    signals_.push_back(signal);
  }

  void removeSource(const std::shared_ptr<Xrpa::InboundSignalData<float>>& signal) {
    // needs special handling because signals_ is a vector of weak_ptrs
    for (auto it = signals_.begin(); it != signals_.end(); ++it) {
      if (it->lock() == signal) {
        signals_.erase(it);
        break;
      }
    }
  }

  int getReadFramesAvailable() {
    int framesToRead = -1;
    for (auto& signal : signals_) {
      if (auto source = signal.lock()) {
        int frameCount = source->getReadFramesAvailable();
        if (framesToRead < 0 || frameCount < framesToRead) {
          framesToRead = frameCount;
        }
      }
    }
    return framesToRead < 0 ? 0 : framesToRead;
  }

  void readInterleavedData(float* outputBuffer, int outputFrames);

  virtual float getWarmupTimeInSeconds() {
    return 0.f;
  }

 private:
  std::vector<std::weak_ptr<Xrpa::InboundSignalData<float>>> signals_;
  std::vector<float> tempReadBuffer_;
};
