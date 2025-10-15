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

#include <functional>
#include <memory>
#include <mutex>
#include <string>
#include <unordered_map>

#include "ocean/media/FrameMedium.h"

class CameraMediaManager {
 public:
  using FrameCallback = std::function<void(const Ocean::Frame&, float frameRate)>;

  static CameraMediaManager& getInstance() {
    static CameraMediaManager instance;
    return instance;
  }

  class Subscription {
   public:
    Subscription() = default;

    Subscription(CameraMediaManager* manager, const std::string& mediumName, size_t callbackId);
    ~Subscription();

    Subscription(const Subscription&) = delete;
    Subscription& operator=(const Subscription&) = delete;
    Subscription(Subscription&& other) noexcept;
    Subscription& operator=(Subscription&& other) noexcept;

    void release();

   private:
    CameraMediaManager* manager_ = nullptr;
    std::string mediumName_;
    size_t callbackId_ = 0;
    bool valid_ = false;
  };

  Subscription subscribe(const std::string& mediumName, FrameCallback callback);

  CameraMediaManager(const CameraMediaManager&) = delete;
  CameraMediaManager(CameraMediaManager&&) = delete;
  CameraMediaManager& operator=(const CameraMediaManager&) = delete;
  CameraMediaManager& operator=(CameraMediaManager&&) = delete;

 private:
  CameraMediaManager() = default;
  ~CameraMediaManager() = default;

  void unsubscribe(const std::string& mediumName, size_t callbackId);

  struct MediumState {
    Ocean::Media::FrameMediumRef medium;
    Ocean::Media::FrameMedium::FrameCallbackScopedSubscription oceanSubscription;
    std::unordered_map<size_t, FrameCallback> callbacks;
    size_t nextCallbackId = 0;
  };

  std::mutex mutex_;
  std::unordered_map<std::string, std::unique_ptr<MediumState>> media_;
};
