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

#include "TcpStreamInputDevice.h"

#include <TcpSocketUart.h>
#include <xrpa-runtime/external_utils/UuidGen.h>
#include <xrpa-runtime/utils/TimeUtils.h>

#include <atomic>
#include <thread>

// Initialize static members
std::map<TcpStreamInputDevice::DeviceKey, std::weak_ptr<TcpStreamInputDevice>>
    TcpStreamInputDevice::s_devices;

class TcpStreamInputDeviceStream : public SignalInputDeviceStream {
 public:
  TcpStreamInputDeviceStream(
      const std::string& name,
      const std::string& host,
      int port,
      int numChannels,
      int frameRate);
  ~TcpStreamInputDeviceStream() override;

 private:
  std::string name_;
  std::shared_ptr<TcpSocketUart> socket_;

  std::atomic<bool> isRunning_;
  std::thread readThread_;

  std::vector<float> tempFloatBuffer_;
  std::vector<uint8_t> tempByteBuffer_;

  void readThreadFunc();
};

TcpStreamInputDevice::TcpStreamInputDevice(const std::string& host, int port, int frameRate)
    : SignalInputDevice(Xrpa::generateUuid()), host_(host), port_(port), frameRate_(frameRate) {
  setDeviceName(host + ":" + std::to_string(port));
  setNumChannels(1);
  setFrameRate(frameRate);
  setIsSystemAudioInput(false);
}

std::shared_ptr<TcpStreamInputDevice>
TcpStreamInputDevice::getOrCreate(const std::string& host, int port, int frameRate) {
  DeviceKey key{host, port, frameRate};

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
  auto device =
      std::shared_ptr<TcpStreamInputDevice>(new TcpStreamInputDevice(host, port, frameRate));
  s_devices[key] = device;
  return device;
}

std::shared_ptr<SignalInputDeviceStream> TcpStreamInputDevice::openStream(
    int numChannels,
    int frameRate) {
  return std::make_shared<TcpStreamInputDeviceStream>(
      getDeviceName(), host_, port_, numChannels, frameRate);
}

TcpStreamInputDeviceStream::TcpStreamInputDeviceStream(
    const std::string& name,
    const std::string& host,
    int port,
    int numChannels,
    int frameRate)
    : SignalInputDeviceStream(numChannels, frameRate), name_(name) {
  std::cout << "Creating TCP stream output device: " << name_ << std::endl;
  socket_ = TcpSocketUart::create(host, port);
  if (socket_) {
    std::cout << "Successfully created TCP stream output device: " << name_ << std::endl;
    isRunning_.store(true);
    readThread_ = std::thread(&TcpStreamInputDeviceStream::readThreadFunc, this);
  } else {
    errorMessage_ = "Failed to create TCP stream output device: " + name_;
    std::cout << errorMessage_ << std::endl;
  }
}

TcpStreamInputDeviceStream::~TcpStreamInputDeviceStream() {
  isRunning_.store(false);
  if (readThread_.joinable()) {
    readThread_.join();
  }
}

void TcpStreamInputDeviceStream::readThreadFunc() {
  if (!socket_) {
    return;
  }

  while (isRunning_.load()) {
    // read data
    if (!socket_->read(tempByteBuffer_)) {
      Xrpa::sleepFor(std::chrono::microseconds(30000));
      continue;
    }
    tempFloatBuffer_.resize(tempByteBuffer_.size() / sizeof(int16_t));

    // convert int16s to floats
    int16_t* int16Buffer = reinterpret_cast<int16_t*>(tempByteBuffer_.data());
    for (int i = 0; i < tempFloatBuffer_.size(); ++i) {
      tempFloatBuffer_[i] = static_cast<float>(int16Buffer[i]) / 32767.0f;
    }

    // send data
    writeInterleavedData(tempFloatBuffer_.data(), tempFloatBuffer_.size());
  }
}
