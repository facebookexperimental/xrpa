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

#include "CameraMediaManager.h"

#include <iostream>

#include "ocean/media/Manager.h"

CameraMediaManager::Subscription::Subscription(
    CameraMediaManager* manager,
    const std::string& mediumName,
    size_t callbackId)
    : manager_(manager), mediumName_(mediumName), callbackId_(callbackId), valid_(true) {}

CameraMediaManager::Subscription::~Subscription() {
  release();
}

CameraMediaManager::Subscription::Subscription(Subscription&& other) noexcept
    : manager_(other.manager_),
      mediumName_(std::move(other.mediumName_)),
      callbackId_(other.callbackId_),
      valid_(other.valid_) {
  other.valid_ = false;
}

CameraMediaManager::Subscription& CameraMediaManager::Subscription::operator=(
    Subscription&& other) noexcept {
  if (this != &other) {
    release();
    manager_ = other.manager_;
    mediumName_ = std::move(other.mediumName_);
    callbackId_ = other.callbackId_;
    valid_ = other.valid_;
    other.valid_ = false;
  }
  return *this;
}

void CameraMediaManager::Subscription::release() {
  if (valid_ && manager_) {
    manager_->unsubscribe(mediumName_, callbackId_);
    valid_ = false;
  }
}

CameraMediaManager::Subscription CameraMediaManager::subscribe(
    const std::string& mediumName,
    FrameCallback callback) {
  std::lock_guard<std::mutex> lock(mutex_);

  auto it = media_.find(mediumName);
  if (it == media_.end()) {
    auto state = std::make_unique<MediumState>();
    state->medium = Ocean::Media::Manager::get().newMedium(mediumName);

    if (!state->medium) {
      std::cerr << "CameraMediaManager: Failed to create medium " << mediumName << std::endl;
      return {};
    }

    state->oceanSubscription = state->medium->addFrameCallback(
        [this, mediumName](const Ocean::Frame& frame, const Ocean::SharedAnyCamera& /*camera*/) {
          std::vector<FrameCallback> callbacksCopy;
          float frameRate = 0.0f;

          {
            std::lock_guard<std::mutex> lock(mutex_);
            auto it = media_.find(mediumName);
            if (it != media_.end() && it->second->medium) {
              frameRate = static_cast<float>(it->second->medium->frameFrequency());
              callbacksCopy.reserve(it->second->callbacks.size());
              for (const auto& [id, cb] : it->second->callbacks) {
                callbacksCopy.push_back(cb);
              }
            }
          }

          for (const auto& cb : callbacksCopy) {
            cb(frame, frameRate);
          }
        });

    state->medium->start();
    std::cout << "CameraMediaManager: Started medium " << mediumName << std::endl;

    it = media_.emplace(mediumName, std::move(state)).first;
  }

  auto& state = it->second;
  size_t callbackId = state->nextCallbackId++;
  state->callbacks[callbackId] = std::move(callback);

  return Subscription(this, mediumName, callbackId);
}

void CameraMediaManager::unsubscribe(const std::string& mediumName, size_t callbackId) {
  std::lock_guard<std::mutex> lock(mutex_);

  auto it = media_.find(mediumName);
  if (it == media_.end()) {
    return;
  }

  auto& state = it->second;
  state->callbacks.erase(callbackId);

  if (state->callbacks.empty()) {
    std::cout << "CameraMediaManager: Stopping medium " << mediumName << std::endl;
    state->oceanSubscription.release();
    state->medium.release();
    media_.erase(it);
  }
}
