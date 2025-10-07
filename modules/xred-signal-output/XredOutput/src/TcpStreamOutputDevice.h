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

#include <TcpSocketUart.h>

#include <map>
#include <string>
#include "SignalOutputDevice.h"

class TcpStreamOutputDevice : public SignalOutputDevice {
 public:
  virtual ~TcpStreamOutputDevice() override = default;

  virtual void tick() override;

  virtual float getWarmupTimeInSeconds() override {
    return 0.01f; // 10ms
  }

  std::string& getHost() {
    return host_;
  }

  int getPort() {
    return port_;
  }

  bool isConnected() {
    return socket_ != nullptr;
  }

  static std::shared_ptr<TcpStreamOutputDevice> getOrCreate(const std::string& host, int port);

  static void tickAllDevices() {
    for (auto& [key, weakDevice] : s_devices) {
      if (auto device = weakDevice.lock()) {
        device->tick();
      }
    }
  }

 private:
  TcpStreamOutputDevice(const std::string& host, int port);

  struct DeviceKey {
    std::string host;
    int port;

    bool operator<(const DeviceKey& other) const {
      if (host != other.host) {
        return host < other.host;
      }
      return port < other.port;
    }
  };

  static std::map<DeviceKey, std::weak_ptr<TcpStreamOutputDevice>> s_devices;

  std::string host_;
  int port_;

  std::shared_ptr<TcpSocketUart> socket_;

  std::vector<float> tempFloatBuffer_;
  std::vector<uint8_t> tempByteBuffer_;
};
