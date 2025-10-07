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

#include "TcpStreamOutputDevice.h"

#include <xrpa-runtime/external_utils/UuidGen.h>

// Initialize static members
std::map<TcpStreamOutputDevice::DeviceKey, std::weak_ptr<TcpStreamOutputDevice>>
    TcpStreamOutputDevice::s_devices;

TcpStreamOutputDevice::TcpStreamOutputDevice(const std::string& host, int port)
    : host_(host), port_(port) {
  setName(host + ":" + std::to_string(port));
  setDeviceType(SignalOutputDataStore::SignalOutputDeviceType::Audio);
  setNumChannels(1);
  setFrameRate(16000);
  setIsSystemAudioOutput(false);

  std::cout << "Creating TCP stream output device: " << getName() << std::endl;
  socket_ = TcpSocketUart::create(host, port, 256);
  if (socket_) {
    std::cout << "Successfully created TCP stream output device: " << getName() << std::endl;
  } else {
    std::cout << "Failed to create TCP stream output device: " << getName() << std::endl;
  }
}

std::shared_ptr<TcpStreamOutputDevice> TcpStreamOutputDevice::getOrCreate(
    const std::string& host,
    int port) {
  DeviceKey key{host, port};

  // Check if we already have a device for this host:port
  auto it = s_devices.find(key);
  if (it != s_devices.end()) {
    // Try to get a shared_ptr from the weak_ptr
    if (auto existingDevice = it->second.lock()) {
      // Device exists and is still valid
      return existingDevice;
    }
    // Weak pointer expired, remove it from the map
    s_devices.erase(it);
  }

  // Create a new device
  auto device = std::shared_ptr<TcpStreamOutputDevice>(new TcpStreamOutputDevice(host, port));
  s_devices[key] = device;
  return device;
}

void TcpStreamOutputDevice::tick() {
  int framesAvailable = getReadFramesAvailable();
  if (!framesAvailable || !socket_) {
    return;
  }

  tempFloatBuffer_.resize(framesAvailable);
  readInterleavedData(tempFloatBuffer_.data(), framesAvailable);

  // convert floats to int16s
  tempByteBuffer_.resize(framesAvailable * sizeof(int16_t));
  int16_t* int16Buffer = reinterpret_cast<int16_t*>(tempByteBuffer_.data());
  for (int i = 0; i < framesAvailable; ++i) {
    int16Buffer[i] = static_cast<int16_t>(tempFloatBuffer_[i] * 32767.0f);
  }

  // send data
  std::cout << "Sending " << framesAvailable << " frames to " << getName() << std::endl;
  socket_->write(tempByteBuffer_);
}
