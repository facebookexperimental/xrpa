/*
// @generated
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

#include <xrpa-runtime/utils/TimeUtils.h>
#include <atomic>
#include <chrono>

namespace Xrpa {

class XrpaModule {
 public:
  XrpaModule() : isRunning_(true) {}
  virtual ~XrpaModule() = default;

  virtual void shutdown() = 0;

  bool isRunning() {
    return isRunning_.load();
  }

  template <typename F>
  void run(int targetFramesPerSecond, F processCallback) {
    auto targetUpdateMS = std::chrono::milliseconds(int(1000.f / targetFramesPerSecond));

    startTime_ = std::chrono::high_resolution_clock::now();
    auto lastFrameStartTime = startTime_;

    while (isRunning()) {
      auto frameStartTime = std::chrono::high_resolution_clock::now();
      frameTime_ = std::chrono::duration_cast<std::chrono::microseconds>(
          lastFrameStartTime - frameStartTime);
      lastFrameStartTime = frameStartTime;

      tickInputs();
      processCallback();
      tickOutputs();

      auto frameEndTime = std::chrono::high_resolution_clock::now();
      auto deltaTime =
          std::chrono::duration_cast<std::chrono::milliseconds>(frameEndTime - frameStartTime);

      if (deltaTime < targetUpdateMS) {
        sleepFor(targetUpdateMS - deltaTime);
      }
    }

    shutdown();
  }

  // safe to call stop() from a different thread, just make sure to join the thread afterwards
  void stop() {
    isRunning_.store(false);
  }

  template <typename F>
  void transact(F transactCallback) {
    tickInputs();
    transactCallback();
    tickOutputs();
  }

  void checkForUpdates() {
    tickInputs();
  }

  std::chrono::microseconds getRunningTime() {
    return std::chrono::duration_cast<std::chrono::microseconds>(
        std::chrono::high_resolution_clock::now() - startTime_);
  }

  std::chrono::microseconds getFrameTime() {
    return frameTime_;
  }

 protected:
  virtual void tickInputs() = 0;
  virtual void tickOutputs() = 0;

 private:
  std::atomic<bool> isRunning_;
  std::chrono::high_resolution_clock::time_point startTime_;
  std::chrono::microseconds frameTime_{};
};

} // namespace Xrpa
