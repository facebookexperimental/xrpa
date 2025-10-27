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

#include "BleInterface.h"

#include <codecvt>
#include <locale>

std::string wstringConvert(const std::wstring& wstr) {
  std::wstring_convert<std::codecvt_utf8_utf16<wchar_t>> converter;
  return converter.to_bytes(wstr.c_str());
}

#if defined(WIN32)
#include <Windows.h>

#include <SetupAPI.h>
#include <bluetoothleapis.h>
#include <devguid.h>

#include <HandleContainer.h>
#include <iostream>
#include <memory>
#include <stdexcept>

#pragma comment(lib, "SetupAPI.lib")
#pragma comment(lib, "BluetoothAPIs.lib")

// {781aee18-7733-4ce4-add0-91f41c67b592}
static const GUID BLUETOOTHLE_DEVICE_INTERFACE_UUID = {
    0x781aee18,
    0x7733,
    0x4ce4,
    {0xad, 0xd0, 0x91, 0xf4, 0x1c, 0x67, 0xb5, 0x92}};

static std::wstring
safeSetupDiGetDeviceRegistryProperty(HDEVINFO hDI, SP_DEVINFO_DATA did, int property) {
  std::wstring text;
  DWORD bufferSize = 0;

  while (!SetupDiGetDeviceRegistryProperty(
      hDI, &did, property, nullptr, (PBYTE)&text[0], bufferSize, &bufferSize)) {
    if (GetLastError() != ERROR_INSUFFICIENT_BUFFER) {
      return L"";
    }
    text.resize(bufferSize);
  }

  return text;
}

static std::wstring safeSetupDiGetDeviceInstanceId(HDEVINFO hDI, SP_DEVINFO_DATA did) {
  std::wstring text;
  DWORD bufferSize = 0;

  while (!SetupDiGetDeviceInstanceId(hDI, &did, &text[0], bufferSize, &bufferSize)) {
    if (GetLastError() != ERROR_INSUFFICIENT_BUFFER) {
      return L"";
    }
    text.resize(bufferSize);
  }

  return text;
}

static void gatherBleDeviceInfos(
    std::unordered_map<std::wstring, BleDeviceInfo>& devices,
    const std::wstring& deviceName,
    const std::wstring& hardwareId,
    const std::wstring& deviceInstanceId) {
  HDEVINFO hDI = SetupDiGetClassDevs(
      &BLUETOOTHLE_DEVICE_INTERFACE_UUID,
      deviceInstanceId.c_str(),
      nullptr,
      DIGCF_DEVICEINTERFACE | DIGCF_PRESENT);

  if (hDI == INVALID_HANDLE_VALUE) {
    std::wcout << L"Unable to get handle to device information elements for device instance: "
               << deviceInstanceId << std::endl;
    return;
  }

  SP_DEVICE_INTERFACE_DATA did{};
  did.cbSize = sizeof(SP_DEVICE_INTERFACE_DATA);

  SP_DEVINFO_DATA dd{};
  dd.cbSize = sizeof(SP_DEVINFO_DATA);

  DWORD i = 0;
  for (i = 0;
       SetupDiEnumDeviceInterfaces(hDI, nullptr, &BLUETOOTHLE_DEVICE_INTERFACE_UUID, i, &did);
       ++i) {
    DWORD size = 0;
    if (!SetupDiGetDeviceInterfaceDetail(hDI, &did, nullptr, 0, &size, nullptr)) {
      if (GetLastError() == ERROR_NO_MORE_ITEMS) {
        break;
      }

      auto interfaceDetailData = (PSP_DEVICE_INTERFACE_DETAIL_DATA)GlobalAlloc(GPTR, size);
      if (interfaceDetailData == nullptr) {
        std::cout << "Unable to allocate memory for device interface detail data." << std::endl;
        continue;
      }

      interfaceDetailData->cbSize = sizeof(SP_DEVICE_INTERFACE_DETAIL_DATA);

      if (SetupDiGetDeviceInterfaceDetail(hDI, &did, interfaceDetailData, size, &size, &dd)) {
        std::wstring devicePath = interfaceDetailData->DevicePath;
        devices.try_emplace(
            devicePath, BleDeviceInfo(deviceName, hardwareId, deviceInstanceId, devicePath));
      }

      GlobalFree(interfaceDetailData);
    }
  }

  SetupDiDestroyDeviceInfoList(hDI);
}

std::unordered_map<std::wstring, BleDeviceInfo> scanBleDevicesWin32() {
  HDEVINFO hDI = SetupDiGetClassDevs(
      &BLUETOOTHLE_DEVICE_INTERFACE_UUID, nullptr, nullptr, DIGCF_DEVICEINTERFACE | DIGCF_PRESENT);

  if (hDI == INVALID_HANDLE_VALUE) {
    throw std::runtime_error("Unable to get handle to device information elements.");
  }

  SP_DEVINFO_DATA did{};
  did.cbSize = sizeof(SP_DEVINFO_DATA);

  std::unordered_map<std::wstring, BleDeviceInfo> devices;

  try {
    for (DWORD i = 0; SetupDiEnumDeviceInfo(hDI, i, &did); ++i) {
      std::wstring deviceName = safeSetupDiGetDeviceRegistryProperty(hDI, did, SPDRP_FRIENDLYNAME);
      std::wstring hardwareId = safeSetupDiGetDeviceRegistryProperty(hDI, did, SPDRP_HARDWAREID);
      std::wstring deviceInstanceId = safeSetupDiGetDeviceInstanceId(hDI, did);

      if (deviceName.size() == 0) {
        continue;
      }

      gatherBleDeviceInfos(devices, deviceName, hardwareId, deviceInstanceId);
    }
  } catch (const std::exception&) {
  }

  SetupDiDestroyDeviceInfoList(hDI);
  return devices;
}

static std::vector<BTH_LE_GATT_SERVICE> getBleServices(HANDLE deviceHandle) {
  USHORT serviceCount = 0;
  HRESULT hr =
      BluetoothGATTGetServices(deviceHandle, 0, nullptr, &serviceCount, BLUETOOTH_GATT_FLAG_NONE);

  if (hr != HRESULT_FROM_WIN32(ERROR_MORE_DATA)) {
    return {};
  }

  std::vector<BTH_LE_GATT_SERVICE> services(serviceCount);
  hr = BluetoothGATTGetServices(
      deviceHandle, services.size(), services.data(), &serviceCount, BLUETOOTH_GATT_FLAG_NONE);

  if (hr != S_OK) {
    return {};
  }

  if (serviceCount < services.size()) {
    services.resize(serviceCount);
  }

  return services;
}

static std::vector<BTH_LE_GATT_CHARACTERISTIC> getGattCharacteristics(
    HANDLE deviceHandle,
    BTH_LE_GATT_SERVICE& service) {
  USHORT characteristicCount = 0;
  HRESULT hr = BluetoothGATTGetCharacteristics(
      deviceHandle, &service, 0, nullptr, &characteristicCount, BLUETOOTH_GATT_FLAG_NONE);

  if (hr != HRESULT_FROM_WIN32(ERROR_MORE_DATA) || characteristicCount == 0) {
    return {};
  }

  std::vector<BTH_LE_GATT_CHARACTERISTIC> characteristics(characteristicCount);

  hr = BluetoothGATTGetCharacteristics(
      deviceHandle,
      &service,
      characteristics.size(),
      characteristics.data(),
      &characteristicCount,
      BLUETOOTH_GATT_FLAG_NONE);

  if (hr != S_OK) {
    return {};
  }

  if (characteristicCount < characteristics.size()) {
    characteristics.resize(characteristicCount);
  }

  return characteristics;
}

static std::vector<BTH_LE_GATT_DESCRIPTOR> getGattDescriptors(
    HANDLE serviceHandle,
    BTH_LE_GATT_CHARACTERISTIC& characteristic) {
  USHORT descriptorCount;
  HRESULT hr = BluetoothGATTGetDescriptors(
      serviceHandle, &characteristic, 0, NULL, &descriptorCount, BLUETOOTH_GATT_FLAG_NONE);

  if (hr != HRESULT_FROM_WIN32(ERROR_MORE_DATA) || descriptorCount == 0) {
    return {};
  }

  std::vector<BTH_LE_GATT_DESCRIPTOR> descriptors(descriptorCount);
  hr = BluetoothGATTGetDescriptors(
      serviceHandle,
      &characteristic,
      descriptors.size(),
      descriptors.data(),
      &descriptorCount,
      BLUETOOTH_GATT_FLAG_NONE);

  if (hr != S_OK) {
    return {};
  }

  if (descriptorCount < descriptors.size()) {
    descriptors.resize(descriptorCount);
  }

  return descriptors;
}

static void setGattDescriptorNotifiable(HANDLE serviceHandle, BTH_LE_GATT_DESCRIPTOR& descriptor) {
  BTH_LE_GATT_DESCRIPTOR_VALUE newValue;
  memset(&newValue, 0, sizeof(newValue));

  newValue.DescriptorType = ClientCharacteristicConfiguration;
  newValue.ClientCharacteristicConfiguration.IsSubscribeToNotification = TRUE;

  BluetoothGATTSetDescriptorValue(serviceHandle, &descriptor, &newValue, BLUETOOTH_GATT_FLAG_NONE);
}

static GUID serviceUuidToGuid(const BTH_LE_UUID& serviceUUID) {
  if (serviceUUID.IsShortUuid) {
    return {
        serviceUUID.Value.ShortUuid,
        0x0000,
        0x1000,
        {0x80, 0x00, 0x00, 0x80, 0x5F, 0x9B, 0x34, 0xFB}};
  } else {
    return serviceUUID.Value.LongUuid;
  }
}

static HandleContainer openBleService(const BTH_LE_UUID& serviceUUID) {
  auto interfaceUUID = serviceUuidToGuid(serviceUUID);

  HDEVINFO hDI =
      SetupDiGetClassDevs(&interfaceUUID, nullptr, nullptr, DIGCF_DEVICEINTERFACE | DIGCF_PRESENT);

  if (hDI == INVALID_HANDLE_VALUE) {
    std::wcout << L"Unable to get handle to device information elements for device interface: "
               << interfaceUUID.Data1 << "-" << interfaceUUID.Data2 << "-" << interfaceUUID.Data3
               << "-" << interfaceUUID.Data4 << std::endl;
    return HandleContainer(INVALID_HANDLE_VALUE);
  }

  SP_DEVICE_INTERFACE_DATA did{};
  did.cbSize = sizeof(SP_DEVICE_INTERFACE_DATA);

  SP_DEVINFO_DATA dd{};
  dd.cbSize = sizeof(SP_DEVINFO_DATA);

  HandleContainer handle{INVALID_HANDLE_VALUE};

  DWORD i = 0;
  for (i = 0; SetupDiEnumDeviceInterfaces(hDI, nullptr, &interfaceUUID, i, &did); ++i) {
    DWORD size = 0;
    if (!SetupDiGetDeviceInterfaceDetail(hDI, &did, nullptr, 0, &size, nullptr)) {
      if (GetLastError() == ERROR_NO_MORE_ITEMS) {
        break;
      }

      auto interfaceDetailData = (PSP_DEVICE_INTERFACE_DETAIL_DATA)GlobalAlloc(GPTR, size);
      if (interfaceDetailData == nullptr) {
        std::cout << "Unable to allocate memory for device interface detail data." << std::endl;
        continue;
      }

      interfaceDetailData->cbSize = sizeof(SP_DEVICE_INTERFACE_DETAIL_DATA);

      if (SetupDiGetDeviceInterfaceDetail(hDI, &did, interfaceDetailData, size, &size, &dd)) {
        handle = HandleContainer(CreateFile(
            interfaceDetailData->DevicePath,
            GENERIC_WRITE | GENERIC_READ,
            FILE_SHARE_READ | FILE_SHARE_WRITE,
            nullptr,
            OPEN_EXISTING,
            0,
            nullptr));
      }

      GlobalFree(interfaceDetailData);
    }
  }

  SetupDiDestroyDeviceInfoList(hDI);

  return handle;
}

class BleGattEventHandlerWin32 : public BleGattEventHandler {
 public:
  static VOID WINAPI NotificationCallback(BTH_LE_GATT_EVENT_TYPE, PVOID eventData, PVOID context) {
    auto handler = static_cast<BleGattEventHandlerWin32*>(context);
    auto eventDataTyped = static_cast<BLUETOOTH_GATT_VALUE_CHANGED_EVENT*>(eventData);
    handler->notify(eventDataTyped);
  }

  BleGattEventHandlerWin32(
      std::shared_ptr<class BleGattNotifyCharacteristicWin32> notifyCharacteristic,
      std::function<void(std::vector<uint8_t>&&)> onEvent);

  virtual ~BleGattEventHandlerWin32();

  void notify(BLUETOOTH_GATT_VALUE_CHANGED_EVENT* eventData);

 private:
  std::shared_ptr<class BleGattNotifyCharacteristicWin32> notifyCharacteristic_;
  std::function<void(std::vector<uint8_t>&&)> onEvent_;
  BLUETOOTH_GATT_EVENT_HANDLE notificationEventHandle_;
};

class BleGattWriteCharacteristicWin32 : public BleGattWriteCharacteristic {
 public:
  BleGattWriteCharacteristicWin32(
      std::shared_ptr<class BleServiceWin32> service,
      const BTH_LE_GATT_CHARACTERISTIC& characteristicDesc)
      : service_(service), characteristicDesc_(characteristicDesc) {}

  virtual ~BleGattWriteCharacteristicWin32() = default;

  virtual bool write(const std::vector<uint8_t>& data) override;

 private:
  std::shared_ptr<class BleServiceWin32> service_;
  BTH_LE_GATT_CHARACTERISTIC characteristicDesc_;
  std::vector<uint8_t> writeBuffer_;
};

class BleGattNotifyCharacteristicWin32 : public BleGattNotifyCharacteristic {
 public:
  BleGattNotifyCharacteristicWin32(
      std::shared_ptr<class BleServiceWin32> service,
      const BTH_LE_GATT_CHARACTERISTIC& characteristicDesc)
      : service_(service), characteristicDesc_(characteristicDesc) {}

  virtual ~BleGattNotifyCharacteristicWin32() = default;

  virtual std::unique_ptr<BleGattEventHandler> handleEvent(
      std::function<void(std::vector<uint8_t>&&)>) override;

  HANDLE getServiceHandle();

  BTH_LE_GATT_CHARACTERISTIC getCharacteristicDesc() {
    return characteristicDesc_;
  }

  USHORT getAttributeHandle() {
    return characteristicDesc_.AttributeHandle;
  }

 private:
  std::shared_ptr<class BleServiceWin32> service_;
  BTH_LE_GATT_CHARACTERISTIC characteristicDesc_;
};

class BleServiceWin32 : public BleService {
 public:
  BleServiceWin32(
      std::shared_ptr<class BleDeviceWin32> device,
      HandleContainer&& serviceHandle,
      const BTH_LE_GATT_SERVICE& serviceDesc)
      : device_(device), serviceHandle_(std::move(serviceHandle)), serviceDesc_(serviceDesc) {}

  virtual ~BleServiceWin32() = default;

  HANDLE getHandle() {
    return *serviceHandle_;
  }

  virtual std::shared_ptr<BleGattWriteCharacteristic> findWriteCharacteristic(
      GUID characteristicGuid) override;

  virtual std::shared_ptr<BleGattNotifyCharacteristic> findNotifyCharacteristic(
      GUID characteristicGuid) override;

 private:
  std::shared_ptr<class BleDeviceWin32> device_;
  HandleContainer serviceHandle_;
  BTH_LE_GATT_SERVICE serviceDesc_;
};

class BleDeviceWin32 : public BleDevice {
 public:
  BleDeviceWin32(const BleDeviceInfo& deviceInfo, HandleContainer&& deviceHandle)
      : deviceHandle_(std::move(deviceHandle)) {}

  virtual ~BleDeviceWin32() = default;

  HANDLE getHandle() {
    return *deviceHandle_;
  }

  virtual std::shared_ptr<BleService> findService(GUID serviceGuid) override {
    // Get the list of services for the device
    auto services = getBleServices(*deviceHandle_);

    // Search for the target guid
    auto targetService = std::find_if(
        services.begin(), services.end(), [serviceGuid](const BTH_LE_GATT_SERVICE& service) {
          return serviceUuidToGuid(service.ServiceUuid) == serviceGuid;
        });

    if (targetService == services.end()) {
      std::cout << "Failed to find service" << std::endl;
      return nullptr;
    }

    // Open the service
    auto serviceHandle = openBleService(targetService->ServiceUuid);
    if (!serviceHandle.isValid()) {
      std::cout << "Failed to open service" << std::endl;
      return nullptr;
    }

    return std::make_shared<BleServiceWin32>(
        std::static_pointer_cast<BleDeviceWin32>(shared_from_this()),
        std::move(serviceHandle),
        *targetService);
  }

 private:
  HandleContainer deviceHandle_;
};

std::unordered_map<std::wstring, BleDeviceInfo> BleDeviceInfo::scanBleDevices() {
  return scanBleDevicesWin32();
}

std::shared_ptr<BleDevice> BleDeviceInfo::openDevice() const {
  auto deviceHandle = HandleContainer(CreateFile(
      devicePath_.c_str(),
      GENERIC_WRITE | GENERIC_READ,
      FILE_SHARE_READ | FILE_SHARE_WRITE,
      nullptr,
      OPEN_EXISTING,
      0,
      nullptr));

  if (!deviceHandle.isValid()) {
    std::cout << "Failed to open BLE device" << std::endl;
    return nullptr;
  }

  return std::make_shared<BleDeviceWin32>(*this, std::move(deviceHandle));
}

std::shared_ptr<BleGattWriteCharacteristic> BleServiceWin32::findWriteCharacteristic(
    GUID characteristicGuid) {
  auto characteristics = getGattCharacteristics(device_->getHandle(), serviceDesc_);

  auto txCharacteristic = std::find_if(
      characteristics.begin(),
      characteristics.end(),
      [characteristicGuid](const BTH_LE_GATT_CHARACTERISTIC& c) {
        return serviceUuidToGuid(c.CharacteristicUuid) == characteristicGuid && c.IsWritable;
      });

  if (txCharacteristic == characteristics.end()) {
    std::cout << "Failed to find TX characteristic" << std::endl;
    return nullptr;
  }

  return std::make_shared<BleGattWriteCharacteristicWin32>(
      std::static_pointer_cast<BleServiceWin32>(shared_from_this()), *txCharacteristic);
}

std::shared_ptr<BleGattNotifyCharacteristic> BleServiceWin32::findNotifyCharacteristic(
    GUID characteristicGuid) {
  auto characteristics = getGattCharacteristics(device_->getHandle(), serviceDesc_);

  auto rxCharacteristic = std::find_if(
      characteristics.begin(),
      characteristics.end(),
      [characteristicGuid](const BTH_LE_GATT_CHARACTERISTIC& c) {
        return serviceUuidToGuid(c.CharacteristicUuid) == characteristicGuid && c.IsNotifiable;
      });

  if (rxCharacteristic == characteristics.end()) {
    std::cout << "Failed to find RX characteristic" << std::endl;
    return nullptr;
  }

  return std::make_shared<BleGattNotifyCharacteristicWin32>(
      std::static_pointer_cast<BleServiceWin32>(shared_from_this()), *rxCharacteristic);
}

std::unique_ptr<BleGattEventHandler> BleGattNotifyCharacteristicWin32::handleEvent(
    std::function<void(std::vector<uint8_t>&&)> handler) {
  return std::make_unique<BleGattEventHandlerWin32>(
      std::static_pointer_cast<BleGattNotifyCharacteristicWin32>(shared_from_this()), handler);
}

HANDLE BleGattNotifyCharacteristicWin32::getServiceHandle() {
  return service_->getHandle();
}

bool BleGattWriteCharacteristicWin32::write(const std::vector<uint8_t>& data) {
  writeBuffer_.resize(sizeof(BTH_LE_GATT_CHARACTERISTIC_VALUE) + data.size());

  auto gattValue =
      static_cast<PBTH_LE_GATT_CHARACTERISTIC_VALUE>(static_cast<void*>(writeBuffer_.data()));

  gattValue->DataSize = data.size();
  std::copy(data.begin(), data.end(), gattValue->Data);

  HRESULT hr = BluetoothGATTSetCharacteristicValue(
      service_->getHandle(),
      &characteristicDesc_,
      gattValue,
      NULL,
      BLUETOOTH_GATT_FLAG_WRITE_WITHOUT_RESPONSE);

  return hr == HRESULT_FROM_WIN32(S_OK);
}

BleGattEventHandlerWin32::BleGattEventHandlerWin32(
    std::shared_ptr<class BleGattNotifyCharacteristicWin32> notifyCharacteristic,
    std::function<void(std::vector<uint8_t>&&)> onEvent)
    : notifyCharacteristic_(notifyCharacteristic), onEvent_(onEvent) {
  auto serviceHandle = notifyCharacteristic_->getServiceHandle();
  auto characteristicDesc = notifyCharacteristic_->getCharacteristicDesc();

  // Enable notifications
  auto descriptors = getGattDescriptors(serviceHandle, characteristicDesc);
  for (auto& descriptor : descriptors) {
    if (descriptor.AttributeHandle < 255) {
      setGattDescriptorNotifiable(serviceHandle, descriptor);
    }
  }

  // Register handler for notifications
  BLUETOOTH_GATT_VALUE_CHANGED_EVENT_REGISTRATION eventParam{};
  eventParam.NumCharacteristics = 1;
  eventParam.Characteristics[0] = characteristicDesc;

  HRESULT hr = BluetoothGATTRegisterEvent(
      serviceHandle,
      CharacteristicValueChangedEvent,
      &eventParam,
      &NotificationCallback,
      this,
      &notificationEventHandle_,
      BLUETOOTH_GATT_FLAG_NONE);

  if (hr != HRESULT_FROM_WIN32(S_OK)) {
    std::cout << "Failed to register notification handler: " << hr << std::endl;
    notificationEventHandle_ = INVALID_HANDLE_VALUE;
  }
}

BleGattEventHandlerWin32::~BleGattEventHandlerWin32() {
  if (notificationEventHandle_ != INVALID_HANDLE_VALUE) {
    BluetoothGATTUnregisterEvent(notificationEventHandle_, BLUETOOTH_GATT_FLAG_NONE);
  }
}

void BleGattEventHandlerWin32::notify(BLUETOOTH_GATT_VALUE_CHANGED_EVENT* eventData) {
  if (eventData->ChangedAttributeHandle != notifyCharacteristic_->getAttributeHandle()) {
    return;
  }
  if (eventData->CharacteristicValue->DataSize == 0) {
    return;
  }
  onEvent_(
      std::vector<uint8_t>(
          eventData->CharacteristicValue->Data,
          eventData->CharacteristicValue->Data + eventData->CharacteristicValue->DataSize));
}

#endif
