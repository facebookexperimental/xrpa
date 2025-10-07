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

#ifdef WIN32

#include "SerialPort.h"

#include <array>
#include <iostream>
#include <string>
#include "SerialPortInfo.h"

// clang-format off
#include <Windows.h>
#include <CommCtrl.h>
#include <SetupAPI.h>
#include <USBTools/USBTools.h>
#include <mmsystem.h>
// clang-format on

#pragma comment(lib, "comctl32.lib")
#pragma comment(lib, "winmm.lib")
#pragma comment(lib, "SetupAPI.lib")

HandleContainer openSerialPort(const SerialPortInfo& portInfo, int baudRate) {
  HandleContainer hCom{INVALID_HANDLE_VALUE};

  hCom = HandleContainer(CreateFileA(
      portInfo.devicePath_.c_str(), GENERIC_WRITE | GENERIC_READ, 0, NULL, OPEN_EXISTING, 0, NULL));
  if (!hCom.isValid()) {
    std::cout << "Failed to open " << portInfo.devicePath_ << std::endl;
    return HandleContainer{INVALID_HANDLE_VALUE};
  }

  // Configure COM port
  DCB dcb = {0};
  dcb.DCBlength = sizeof(DCB);
  if (!GetCommState(*hCom, &dcb)) {
    std::cout << "Failed to get state for " << portInfo.devicePath_ << std::endl;
    return HandleContainer{INVALID_HANDLE_VALUE};
  }

  dcb.BaudRate = baudRate;
  dcb.ByteSize = 8;
  dcb.Parity = NOPARITY;
  dcb.StopBits = ONESTOPBIT;
  dcb.fDtrControl = DTR_CONTROL_ENABLE;
  dcb.fRtsControl = RTS_CONTROL_HANDSHAKE;
  if (!SetCommState(*hCom, &dcb)) {
    std::cout << "Failed to set state for" << portInfo.devicePath_ << std::endl;
    return HandleContainer{INVALID_HANDLE_VALUE};
  }

  COMMTIMEOUTS timeouts = {0};
  timeouts.ReadIntervalTimeout = MAXDWORD;
  timeouts.ReadTotalTimeoutConstant = 0;
  timeouts.ReadTotalTimeoutMultiplier = MAXDWORD;
  timeouts.WriteTotalTimeoutConstant = 50;
  timeouts.WriteTotalTimeoutMultiplier = 10;
  SetCommTimeouts(*hCom, &timeouts);

  return hCom;
}

std::unordered_map<std::string, SerialPortInfo> scanSerialPorts() {
  std::unordered_map<std::string, SerialPortInfo> ports;

  auto serialPorts = frl::GetSerialPorts();
  for (auto& port : serialPorts) {
    if (port.second.has_value()) {
      auto& value = port.second.value();
      ports.emplace(
          port.first,
          SerialPortInfo(
              "\\\\.\\" + port.first,
              value.id.vendor,
              value.id.product,
              value.description,
              value.manufacturer,
              value.interfaceNum.has_value() ? value.interfaceNum.value() : -1));
    }
  }

  return ports;
}

#endif // WIN32
