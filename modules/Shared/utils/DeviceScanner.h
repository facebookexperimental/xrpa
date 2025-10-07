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

#include <atomic>
#include <chrono>
#include <functional>
#include <mutex>
#include <optional>
#include <thread>
#include <unordered_map>
#include <unordered_set>

template <typename KEY, typename VALUE>
class DeviceScanner {
 public:
  DeviceScanner(
      std::function<std::unordered_map<KEY, VALUE>(void)> scanFunc,
      std::chrono::milliseconds scanInterval) {
    isRunning_ = true;
    hasChanges_ = false;
    scanThread_ = std::thread([this, scanFunc, scanInterval]() {
      auto lastScan = std::chrono::system_clock::now() - scanInterval;
      while (isRunning_) {
        auto now = std::chrono::system_clock::now();
        if (now - lastScan >= scanInterval) {
          updateDevices(scanFunc());
          lastScan = now;
        }
        if (isRunning_) {
          std::this_thread::sleep_for(std::chrono::milliseconds(100));
        }
      }
    });
  }

  virtual ~DeviceScanner() {
    isRunning_ = false;
    scanThread_.join();
  }

  bool hasChanges() {
    return hasChanges_;
  }

  std::unordered_map<KEY, std::optional<VALUE>> getChangedDevices() {
    std::lock_guard<std::mutex> lock(deviceMutex_);

    std::unordered_map<KEY, std::optional<VALUE>> ret;

    for (auto& key : devicesChanged_) {
      auto it = deviceMap_.find(key);
      if (it != deviceMap_.end()) {
        ret.emplace(key, it->second);
      } else {
        ret.emplace(key, std::nullopt);
      }
    }

    devicesChanged_.clear();
    hasChanges_ = false;

    return ret;
  }

 private:
  std::atomic<bool> isRunning_;
  std::thread scanThread_;

  std::mutex deviceMutex_;
  std::unordered_map<KEY, VALUE> deviceMap_;

  std::atomic<bool> hasChanges_;
  std::unordered_set<KEY> devicesChanged_;

  void updateDevices(const std::unordered_map<KEY, VALUE>& devices) {
    bool changed = false;

    {
      std::lock_guard<std::mutex> lock(deviceMutex_);

      std::unordered_set<KEY> validDeviceKeys;

      // update the device map
      for (auto newDevice = devices.begin(); newDevice != devices.end(); newDevice++) {
        validDeviceKeys.insert(newDevice->first);

        auto existingDevice = deviceMap_.find(newDevice->first);
        if (existingDevice == deviceMap_.end()) {
          deviceMap_.emplace(newDevice->first, newDevice->second);
          devicesChanged_.insert(newDevice->first);
          changed = true;
        } else {
          existingDevice->second = newDevice->second;
        }
      }

      // remove any devices that are no longer present
      for (auto it = deviceMap_.begin(); it != deviceMap_.end();) {
        if (validDeviceKeys.find(it->first) == validDeviceKeys.end()) {
          devicesChanged_.insert(it->first);
          changed = true;
          it = deviceMap_.erase(it);
        } else {
          ++it;
        }
      }
    }

    if (changed) {
      hasChanges_ = true;
    }
  }
};
