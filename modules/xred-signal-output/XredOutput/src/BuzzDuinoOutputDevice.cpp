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

#include "BuzzDuinoOutputDevice.h"

#include <algorithm>
#include <iostream>
#include <string>

#include "XredDeviceComms.h"
#include "XredProtocol.h"

constexpr int kMaxSamplesPerPacket = sizeof(xr_protocol_packet_t::data) - 2;
constexpr int kMinSamplesPerPacket = kMaxSamplesPerPacket / 4;

std::shared_ptr<BuzzDuinoOutputDevice> BuzzDuinoOutputDevice::create(
    const std::shared_ptr<GenericUart>& uart) {
  auto hdkComms = std::make_unique<XredDeviceComms>(uart);
  int numChannels = 0;
  int sampleRate = 2000;

  // query the device for its capabilities
  auto pkt = hdkComms->requestDeviceInfo(XR_DATA_ID_DEVINFO);
  if (pkt) {
    numChannels = pkt->data[5];
    sampleRate = *reinterpret_cast<int*>(&pkt->data[6]);
  } else {
    // not an HDK device
    return nullptr;
  }

  return std::shared_ptr<BuzzDuinoOutputDevice>(
      new BuzzDuinoOutputDevice(std::move(hdkComms), numChannels, sampleRate));
}

BuzzDuinoOutputDevice::BuzzDuinoOutputDevice(
    std::unique_ptr<XredDeviceComms>&& hdkComms,
    int numChannels,
    int sampleRate)
    : hdkComms_(std::move(hdkComms)) {
  std::string deviceName = "Unknown";
  auto pkt = hdkComms_->requestDeviceInfo(XR_DATA_ID_DEV_NAME);
  if (pkt) {
    // pkt->data_len has the string length (no 0-terminator)
    deviceName = std::string(reinterpret_cast<const char*>(pkt->data), pkt->data_len);
  }

  pkt = hdkComms_->requestDeviceInfo(XR_DATA_ID_COMMAND_LIST);
  if (pkt) {
    supportedCommands_.resize(pkt->data_len);
    memcpy(supportedCommands_.data(), pkt->data, pkt->data_len);
    supportsInterleaved_ = std::find(
                               supportedCommands_.begin(),
                               supportedCommands_.end(),
                               XR_DATA_ID_PWM_INTERLEAVED_SAMPLES) != supportedCommands_.end();
  }

  if (deviceName == "BUZZDUINO") {
    // use a friendlier name
    deviceName = "BuzzDuino";
  }
  setName(deviceName + std::string(" ") + hdkComms_->getID());
  setDeviceType(SignalOutputDataStore::SignalOutputDeviceType::Haptics);
  setNumChannels(numChannels);
  setFrameRate(sampleRate);
}

void BuzzDuinoOutputDevice::tick() {
  // TODO could put this into a thread
  while (transmitData()) {
  }
  receiveData();
}

bool BuzzDuinoOutputDevice::transmitData() {
  const auto numChannels = getNumChannels();
  int framesToWrite = getReadFramesAvailable();

  const int minFramesToWrite = kMinSamplesPerPacket / numChannels;
  if (framesToWrite < minFramesToWrite) {
    // continue buffering
    return false;
  }

  const int maxFramesToWrite = kMaxSamplesPerPacket / numChannels;
  framesToWrite = std::min(framesToWrite, maxFramesToWrite);

  // read the interleaved data
  interleavedBuffer_.resize(numChannels * framesToWrite);
  readInterleavedData(interleavedBuffer_.data(), framesToWrite);

  // initialize the packet
  hdkComms_->beginPacket(
      supportsInterleaved_ ? XR_DATA_ID_PWM_INTERLEAVED_SAMPLES : XR_DATA_ID_PWM_SAMPLES);
  hdkComms_->writeValue((uint8_t)numChannels);
  hdkComms_->writeValue((uint8_t)framesToWrite);

  // convert float data to int8
  float* inPtr = interleavedBuffer_.data();
  if (supportsInterleaved_) {
    int count = framesToWrite * numChannels;
    for (int i = 0; i < count; ++i) {
      float f = std::clamp(inPtr[i], -1.0f, 1.0f);
      hdkComms_->writeValue((int8_t)(f * 127));
    }
  } else {
    // deinterleave
    for (int channelIdx = 0; channelIdx < numChannels; ++channelIdx) {
      for (int frameIdx = 0; frameIdx < framesToWrite; ++frameIdx) {
        float f = inPtr[frameIdx * numChannels + channelIdx];
        if (f < -1.0f) {
          f = -1.0f;
        } else if (f > 1.0f) {
          f = 1.0f;
        }
        hdkComms_->writeValue((int8_t)(f * 127));
      }
    }
  }

  // send the packet to the device
  hdkComms_->sendPacket();

  return true;
}

void BuzzDuinoOutputDevice::receiveData() {
  xr_protocol_packet_t* pkt;
  while ((pkt = hdkComms_->readPacket())) {
    if (pkt->data_id != XR_DATA_ID_CAPTOUCH) {
      continue;
    }

    uint8_t capTouchState = pkt->data[0];
    for (int i = 0; i < 8; ++i) {
      uint8_t bitMask = 1 << i;
      uint8_t oldState = capTouchState_ & bitMask;
      uint8_t newState = capTouchState & bitMask;
      if (newState != oldState) {
        auto type = newState ? SignalOutputDataStore::InputEventType::Press
                             : SignalOutputDataStore::InputEventType::Release;
        sendInputEvent(type, i);
        std::cout << "Cap touch " << i << " " << (newState ? "pressed" : "released") << std::endl;
      }
    }

    capTouchState_ = capTouchState;
  }
}
