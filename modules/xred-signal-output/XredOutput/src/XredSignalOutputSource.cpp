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

#include "XredSignalOutputSource.h"

#include "SignalOutputDevice.h"
#include "TcpStreamOutputDevice.h"

void XredSignalOutputSource::handleXrpaFieldsChanged(uint64_t fieldsChanged) {
  if (checkDeviceNameChanged(fieldsChanged)) {
    deviceNameFilter_ = getDeviceName();
  }

  auto oldDevice = outputDevice_.lock();

  auto bindingType = getBindTo();
  switch (bindingType) {
    case SignalOutputDataStore::DeviceBindingType::Device: {
      auto device = datastore_->SignalOutputDevice->getObject(getDevice());
      outputDevice_ = std::dynamic_pointer_cast<SignalOutputDevice>(device);
      tcpStreamOutputDevice_.reset();
      setIsConnected(outputDevice_.lock() != nullptr);
      break;
    }

    case SignalOutputDataStore::DeviceBindingType::SystemAudio: {
      bool found = false;
      for (auto& device : *datastore_->SignalOutputDevice) {
        if (device->getIsSystemAudioOutput()) {
          outputDevice_ = std::dynamic_pointer_cast<SignalOutputDevice>(device);
          found = true;
          break;
        }
      }
      if (!found) {
        outputDevice_.reset();
      }
      tcpStreamOutputDevice_.reset();
      setIsConnected(found);
      break;
    }

    case SignalOutputDataStore::DeviceBindingType::DeviceByName: {
      bool found = false;
      for (auto& device : *datastore_->SignalOutputDevice) {
        if (deviceNameFilter_.match(device->getName())) {
          outputDevice_ = std::dynamic_pointer_cast<SignalOutputDevice>(device);
          found = true;
          break;
        }
      }
      if (!found) {
        outputDevice_.reset();
      }
      tcpStreamOutputDevice_.reset();
      setIsConnected(found);
      break;
    }

    case SignalOutputDataStore::DeviceBindingType::TcpStream: {
      const auto& hostname = getHostname();
      const auto port = getPort();
      if (!tcpStreamOutputDevice_ || tcpStreamOutputDevice_->getHost() != hostname ||
          tcpStreamOutputDevice_->getPort() != port) {
        tcpStreamOutputDevice_ = TcpStreamOutputDevice::getOrCreate(hostname, port);
        outputDevice_ = tcpStreamOutputDevice_;
        setIsConnected(tcpStreamOutputDevice_->isConnected());
      }
      break;
    }
  }

  auto newDevice = outputDevice_.lock();
  if (oldDevice != newDevice) {
    if (oldDevice) {
      oldDevice->removeSource(signal_);
    }
    if (newDevice) {
      auto numChannels = newDevice->getNumChannels();
      auto frameRate = newDevice->getFrameRate();
      auto warmupTimeInSeconds = newDevice->getWarmupTimeInSeconds();
      signal_ = std::make_shared<Xrpa::InboundSignalData<float>>(
          numChannels, frameRate, warmupTimeInSeconds);
      onSignal(signal_);
      newDevice->addSource(signal_);
    } else {
      signal_ = nullptr;
      onSignal(nullptr);
    }
  }
}
