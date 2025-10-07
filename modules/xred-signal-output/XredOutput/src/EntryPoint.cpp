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

#include <lib/XredOutputModule.h>
#include <iostream>

#include "AudioOutputDevice.h"
#include "BleInterface.h"
#include "BuzzDuinoOutputDevice.h"
#include "DeviceScanner.h"
#include "DummyOutputDevice.h"
#include "NordicUart.h"
#include "SerialPort.h"
#include "SerialPortInfo.h"
#include "SerialPortUart.h"
#include "TcpStreamOutputDevice.h"
#include "XredSignalOutputSource.h"

// need to run the main loop at a fast enough rate to keep the latency of streamed in signals low
constexpr int kMainLoopPeriod = 4; // in milliseconds
constexpr int kUpdateRate = 1000 / kMainLoopPeriod;

constexpr uint16_t kUartBleVid = 0x2833;
constexpr uint16_t kUartBlePid = 0x0431;
constexpr char kUartBleDescription[] = "BLE-UART bridge";

constexpr int BAUD_RATE = 921600;

#define BLE_SCANNING 0

static void addBuzzDuinoDevice(
    XredOutputModule* moduleData,
    std::unordered_map<std::string, std::shared_ptr<BuzzDuinoOutputDevice>>& deviceList,
    std::string key,
    std::shared_ptr<GenericUart> uart) {
  auto buzzDevice = BuzzDuinoOutputDevice::create(uart);
  if (!buzzDevice) {
    return;
  }
  moduleData->signalOutputDataStore->SignalOutputDevice->addObject(buzzDevice);
  deviceList.emplace(key, buzzDevice);

  std::cout << "Added HDK compatible device: " << buzzDevice->getName() << std::endl;
}

static void removeBuzzDuinoDevice(
    XredOutputModule* moduleData,
    std::unordered_map<std::string, std::shared_ptr<BuzzDuinoOutputDevice>>& deviceList,
    std::string key) {
  auto it = deviceList.find(key);
  if (it == deviceList.end()) {
    return;
  }
  moduleData->signalOutputDataStore->SignalOutputDevice->removeObject(it->second->getXrpaId());
  deviceList.erase(it);

  std::cout << "Removed HDK compatible device: " << it->second->getName() << std::endl;
}

static bool isUartDongle(const SerialPortInfo& portInfo) {
  /*
  std::cout << portInfo.devicePath_ << std::endl;
  std::cout << "Vendor ID: " << portInfo.vendorId_ << std::endl;
  std::cout << "Product ID: " << portInfo.productId_ << std::endl;
  std::cout << "Description: " << portInfo.description_ << std::endl;
  */
  return portInfo.vendorId_ == kUartBleVid && portInfo.productId_ == kUartBlePid &&
      portInfo.description_ == kUartBleDescription;
}

void EntryPoint(XredOutputModule* moduleData) {
  AudioSystemHandle audioSystem;

  XredSignalOutputSource::registerDelegate(moduleData->signalOutputDataStore);

  std::unordered_map<std::string, std::shared_ptr<BuzzDuinoOutputDevice>> buzzDevices;

#if BLE_SCANNING
  auto bleScanner = std::make_shared<DeviceScanner<std::wstring, BleDeviceInfo>>(
      BleDeviceInfo::scanBleDevices, std::chrono::milliseconds(5000));
#endif

  auto serialPortScanner = std::make_shared<DeviceScanner<std::string, SerialPortInfo>>(
      scanSerialPorts, std::chrono::milliseconds(5000));

  auto audioDevices = AudioOutputDevice::createAudioDevices(audioSystem);
  for (auto& device : audioDevices) {
    moduleData->signalOutputDataStore->SignalOutputDevice->addObject(device);
    std::cout << "Added audio device: " << device->getName() << std::endl;
  }

  std::shared_ptr<SignalOutputDevice> dummyDevice;
  if (!moduleData->settings.dummyDevice.empty()) {
    dummyDevice = std::make_shared<DummyOutputDevice>(moduleData->settings.dummyDevice);
    moduleData->signalOutputDataStore->SignalOutputDevice->addObject(dummyDevice);
    std::cout << "Added dummy device: " << dummyDevice->getName() << std::endl;
  }

  moduleData->run(kUpdateRate, [&]() {
    for (auto& buzz : buzzDevices) {
      buzz.second->tick();
    }

    for (auto& device : audioDevices) {
      device->tick();
    }

    TcpStreamOutputDevice::tickAllDevices();

#if BLE_SCANNING
    if (bleScanner->hasChanges()) {
      auto changes = bleScanner->getChangedDevices();

      for (auto& change : changes) {
        if (change.second.has_value()) {
          auto nordicUart = NordicUart::create(change.second.value());
          if (nordicUart) {
            addBuzzDuinoDevice(moduleData, buzzDevices, wstringConvert(change.first), nordicUart);
          }
        } else {
          removeBuzzDuinoDevice(moduleData, buzzDevices, wstringConvert(change.first));
        }
      }
    }
#endif

    if (serialPortScanner->hasChanges()) {
      auto changes = serialPortScanner->getChangedDevices();

      for (auto& change : changes) {
        if (change.second.has_value() && isUartDongle(change.second.value())) {
          std::cout << "Found UART dongle: " << change.first << std::endl;
          auto serialPortUart = SerialPortUart::create(change.second.value(), BAUD_RATE);
          if (serialPortUart) {
            addBuzzDuinoDevice(moduleData, buzzDevices, serialPortUart->getID(), serialPortUart);
          }
        } else {
          removeBuzzDuinoDevice(moduleData, buzzDevices, change.first);
        }
      }
    }
  });
}
