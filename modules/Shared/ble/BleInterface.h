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

#include <functional>
#include <iostream>
#include <memory>
#include <string>
#include <unordered_map>
#include <vector>

#if defined(WIN32)
#include <Windows.h>
#endif

std::string wstringConvert(const std::wstring& wstr);

class BleGattEventHandler {
 public:
  virtual ~BleGattEventHandler() {}
};
class BleGattWriteCharacteristic : public std::enable_shared_from_this<BleGattWriteCharacteristic> {
 public:
  virtual ~BleGattWriteCharacteristic() {}

  virtual bool write(const std::vector<uint8_t>& data) = 0;
};

class BleGattNotifyCharacteristic
    : public std::enable_shared_from_this<BleGattNotifyCharacteristic> {
 public:
  virtual ~BleGattNotifyCharacteristic() {}

  virtual std::unique_ptr<BleGattEventHandler> handleEvent(
      std::function<void(std::vector<uint8_t>&&)>) = 0;
};

class BleService : public std::enable_shared_from_this<BleService> {
 public:
  virtual ~BleService() {}
#if defined(WIN32)
  virtual std::shared_ptr<BleGattWriteCharacteristic> findWriteCharacteristic(
      GUID characteristicGuid) = 0;
  virtual std::shared_ptr<BleGattNotifyCharacteristic> findNotifyCharacteristic(
      GUID characteristicGuid) = 0;
#endif
};

class BleDevice : public std::enable_shared_from_this<BleDevice> {
 public:
  virtual ~BleDevice() {}
#if defined(WIN32)
  virtual std::shared_ptr<BleService> findService(GUID serviceGuid) = 0;
#endif
};

class BleDeviceInfo {
 public:
  static std::unordered_map<std::wstring, BleDeviceInfo> scanBleDevices();

  std::shared_ptr<BleDevice> openDevice() const;

  BleDeviceInfo(
      const std::wstring& name,
      const std::wstring& hardwareId,
      const std::wstring& instanceId,
      const std::wstring& devicePath)
      : name_(name), hardwareId_(hardwareId), instanceId_(instanceId), devicePath_(devicePath) {}

  std::wstring name_;
  std::wstring hardwareId_;
  std::wstring instanceId_;
  std::wstring devicePath_;
};

#if !defined(WIN32)
// Provide implementation for non-Windows platforms
inline std::unordered_map<std::wstring, BleDeviceInfo> BleDeviceInfo::scanBleDevices() {
  std::cout << "BLE device scanning is only supported on Windows platforms" << std::endl;
  return {};
}

inline std::shared_ptr<BleDevice> BleDeviceInfo::openDevice() const {
  std::cout << "BLE device opening is only supported on Windows platforms" << std::endl;
  return nullptr;
}
#endif
