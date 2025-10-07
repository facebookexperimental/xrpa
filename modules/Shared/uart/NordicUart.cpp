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

#include "NordicUart.h"

#include "BleInterface.h"

#include <queue>
#include <vector>

#ifdef WIN32
// {6e400001-b5a3-f393-e0a9-e50e24dcca9e}
static const GUID NUS_SERVICE_UUID = {
    0x6e400001,
    0xb5a3,
    0xf393,
    {0xe0, 0xa9, 0xe5, 0x0e, 0x24, 0xdc, 0xca, 0x9e}};

// {6e400003-b5a3-f393-e0a9-e50e24dcca9e}
static const GUID NUS_RX_CHARACTERISTIC = {
    0x6e400003,
    0xb5a3,
    0xf393,
    {0xe0, 0xa9, 0xe5, 0x0e, 0x24, 0xdc, 0xca, 0x9e}};

// {6e400002-b5a3-f393-e0a9-e50e24dcca9e}
static const GUID NUS_TX_CHARACTERISTIC = {
    0x6e400002,
    0xb5a3,
    0xf393,
    {0xe0, 0xa9, 0xe5, 0x0e, 0x24, 0xdc, 0xca, 0x9e}};
#else
// Define alternative UUID representation for non-Windows platforms
// Nordic UART Service UUID
#endif

///////////////////////////////////////////////////////////////////////////////

class NordicUartImpl : public NordicUart {
 public:
  NordicUartImpl(
      const BleDeviceInfo& deviceInfo,
      std::shared_ptr<BleGattWriteCharacteristic> txCharacteristic,
      std::shared_ptr<BleGattNotifyCharacteristic> rxCharacteristic)
      : NordicUart(wstringConvert(deviceInfo.instanceId_)),
        txCharacteristic_(txCharacteristic),
        rxCharacteristic_(rxCharacteristic) {
    eventHandler_ = rxCharacteristic->handleEvent(
        [this](const std::vector<uint8_t>& data) { readQueue_.push(data); });
  }

  virtual bool write(const std::vector<uint8_t>& data) override {
    return txCharacteristic_->write(data);
  }

  virtual bool read(std::vector<uint8_t>& data) override {
    if (readQueue_.empty()) {
      return false;
    }

    auto dataIn = readQueue_.front();
    data.resize(dataIn.size());
    std::copy(dataIn.begin(), dataIn.end(), data.data());
    readQueue_.pop();

    return true;
  }

 private:
  std::shared_ptr<BleGattWriteCharacteristic> txCharacteristic_;
  std::shared_ptr<BleGattNotifyCharacteristic> rxCharacteristic_;

  std::unique_ptr<BleGattEventHandler> eventHandler_;
  std::queue<std::vector<uint8_t>> readQueue_;
};

///////////////////////////////////////////////////////////////////////////////

std::shared_ptr<NordicUart> NordicUart::create(const BleDeviceInfo& deviceInfo) {
#ifdef WIN32
  auto device = deviceInfo.openDevice();
  if (!device) {
    return nullptr;
  }

  auto nusService = device->findService(NUS_SERVICE_UUID);
  if (!nusService) {
    return nullptr;
  }

  auto rxCharacteristic = nusService->findNotifyCharacteristic(NUS_RX_CHARACTERISTIC);
  auto txCharacteristic = nusService->findWriteCharacteristic(NUS_TX_CHARACTERISTIC);
  if (!rxCharacteristic || !txCharacteristic) {
    return nullptr;
  }

  return std::shared_ptr<NordicUart>(
      new NordicUartImpl(deviceInfo, txCharacteristic, rxCharacteristic));
#elif defined(__APPLE__)
  std::cout << "Nordic UART functionality is only supported on Windows platforms" << std::endl;
  return nullptr;
#else
  std::cout << "Nordic UART functionality is only supported on Windows platforms" << std::endl;
  return nullptr;
#endif
}
