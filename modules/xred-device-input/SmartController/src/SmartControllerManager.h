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

#include "SmartControllerDevice.h"

#include <memory>
#include <string>
#include <unordered_map>

class SmartControllerManager {
 public:
  SmartControllerManager() = default;

  std::shared_ptr<SmartControllerDevice> getOrCreateController(const std::string& ipAddress) {
    auto it = controllers_.find(ipAddress);
    if (it != controllers_.end()) {
      return it->second;
    }
    auto controller = std::make_shared<SmartControllerDevice>(ipAddress);
    controllers_[ipAddress] = controller;
    return controller;
  }

  // Iteration
  using iterator =
      std::unordered_map<std::string, std::shared_ptr<SmartControllerDevice>>::iterator;
  using const_iterator =
      std::unordered_map<std::string, std::shared_ptr<SmartControllerDevice>>::const_iterator;

  iterator begin() {
    return controllers_.begin();
  }
  iterator end() {
    return controllers_.end();
  }
  const_iterator begin() const {
    return controllers_.begin();
  }
  const_iterator end() const {
    return controllers_.end();
  }

 private:
  std::unordered_map<std::string, std::shared_ptr<SmartControllerDevice>> controllers_;
};
