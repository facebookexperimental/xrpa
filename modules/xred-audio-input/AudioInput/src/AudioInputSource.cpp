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

#include "AudioInputSource.h"

#include "SignalInputDevice.h"
#include "TcpStreamInputDevice.h"

void AudioInputSource::handleXrpaFieldsChanged(uint64_t fieldsChanged) {
  if (checkDeviceNameChanged(fieldsChanged)) {
    deviceNameFilter_ = getDeviceName();
  }

  auto numChannels = getNumChannels();
  auto frameRate = getFrameRate();

  auto oldDevice = inputDevice_.lock();

  auto binding = getBindTo();
  switch (binding) {
    case AudioInputDataStore::DeviceBindingType::Device: {
      auto device = datastore_->AudioInputDevice->getObject(getDevice());
      inputDevice_ = std::dynamic_pointer_cast<SignalInputDevice>(device);
      tcpStreamInputDevice_.reset();
      break;
    }

    case AudioInputDataStore::DeviceBindingType::SystemAudio: {
      bool found = false;
      for (auto& device : *datastore_->AudioInputDevice) {
        if (device->getIsSystemAudioInput()) {
          inputDevice_ = std::dynamic_pointer_cast<SignalInputDevice>(device);
          found = true;
          break;
        }
      }
      if (!found) {
        inputDevice_.reset();
      }
      tcpStreamInputDevice_.reset();
      break;
    }

    case AudioInputDataStore::DeviceBindingType::DeviceByName: {
      bool found = false;
      for (auto& device : *datastore_->AudioInputDevice) {
        if (deviceNameFilter_.match(device->getDeviceName())) {
          inputDevice_ = std::dynamic_pointer_cast<SignalInputDevice>(device);
          found = true;
          break;
        }
      }
      if (!found) {
        inputDevice_.reset();
      }
      tcpStreamInputDevice_.reset();
      break;
    }

    case AudioInputDataStore::DeviceBindingType::TcpStream: {
      const auto& hostname = getHostname();
      const auto port = getPort();
      if (!tcpStreamInputDevice_ || tcpStreamInputDevice_->getHost() != hostname ||
          tcpStreamInputDevice_->getPort() != port) {
        tcpStreamInputDevice_ = TcpStreamInputDevice::getOrCreate(hostname, port, frameRate);
        inputDevice_ = tcpStreamInputDevice_;
      }
      break;
    }
  }

  auto newDevice = inputDevice_.lock();
  if (oldDevice != newDevice || checkNumChannelsChanged(fieldsChanged) ||
      checkFrameRateChanged(fieldsChanged)) {
    if (newDevice) {
      stream_ = newDevice->openStream(numChannels, frameRate);
      const auto& err = stream_->getErrorMessage();
      setErrorMessage(err);
      setIsActive(err.empty());
    } else {
      stream_ = nullptr;
      setErrorMessage("");
      setIsActive(false);
    }
  }
}

void AudioInputSource::tick() {
  if (!stream_) {
    return;
  }

  auto framesAvailable = stream_->getReadFramesAvailable();
  if (framesAvailable == 0) {
    return;
  }

  auto packet =
      sendAudioSignal<float>(framesAvailable, stream_->getNumChannels(), stream_->getFrameRate());
  stream_->fillSignalPacket(packet);
}
