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

#include <map>
#include <string>
#include "SignalInputDevice.h"

class TcpStreamInputDevice : public SignalInputDevice {
 public:
  virtual ~TcpStreamInputDevice() override = default;

  std::string& getHost() {
    return host_;
  }

  int getPort() {
    return port_;
  }

  int getFrameRate() {
    return frameRate_;
  }

  std::shared_ptr<SignalInputDeviceStream> openStream(int numChannels, int frameRate) override;

  static std::shared_ptr<TcpStreamInputDevice>
  getOrCreate(const std::string& host, int port, int frameRate);

 private:
  TcpStreamInputDevice(const std::string& host, int port, int frameRate);

  struct DeviceKey {
    std::string host;
    int port;
    int frameRate;

    bool operator<(const DeviceKey& other) const {
      if (host != other.host) {
        return host < other.host;
      }
      if (port != other.port) {
        return port < other.port;
      }
      return frameRate < other.frameRate;
    }
  };

  static std::map<DeviceKey, std::weak_ptr<TcpStreamInputDevice>> s_devices;

  std::string host_;
  int port_;
  int frameRate_;
};
