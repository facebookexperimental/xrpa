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

#include "SerialPortUart.h"

#include <SerialPort.h>
#include <iostream>

#if defined(WIN32)
#include <Windows.h>
#elif defined(__APPLE__)
#include <unistd.h>
#include <cerrno>
#endif

class SerialPortUartImpl : public SerialPortUart {
 public:
  SerialPortUartImpl(const SerialPortInfo& portInfo, HandleContainer&& portHandle)
      : SerialPortUart(portInfo.devicePath_), portHandle_(std::move(portHandle)) {}

  bool write(const std::vector<uint8_t>& data) override {
#if defined(WIN32)
    DWORD written;
    if (!WriteFile(*portHandle_, data.data(), data.size(), &written, NULL)) {
      DWORD dwError = GetLastError();
      std::cerr << "WriteFile failed with error " << dwError << std::endl;
      return false;
    }
    return true;
#elif defined(__APPLE__)
    ssize_t bytesWritten = ::write(*portHandle_, data.data(), data.size());
    if (bytesWritten < 0) {
      std::cerr << "write() failed with error: " << strerror(errno) << std::endl;
      return false;
    }
    if (static_cast<size_t>(bytesWritten) != data.size()) {
      std::cerr << "write() incomplete: wrote " << bytesWritten << " of " << data.size() << " bytes"
                << std::endl;
      return false;
    }
    return true;
#else
    // Non-Windows/Mac implementation needed
    std::cerr << "write() not implemented for this platform" << std::endl;
    return false;
#endif
  }

  bool read(std::vector<uint8_t>& data) override {
#if defined(WIN32)
    data.resize(1000);
    DWORD bytesRead = 0;
    if (ReadFile(*portHandle_, data.data(), data.size(), &bytesRead, NULL) && bytesRead > 0) {
      data.resize(bytesRead);
      return true;
    }
    data.resize(0);
    return false;
#elif defined(__APPLE__)
    data.resize(1000);
    ssize_t bytesRead = ::read(*portHandle_, data.data(), data.size());
    if (bytesRead < 0) {
      if (errno != EAGAIN && errno != EWOULDBLOCK) {
        std::cerr << "read() failed with error: " << strerror(errno) << std::endl;
      }
      data.resize(0);
      return false;
    }
    if (bytesRead == 0) {
      data.resize(0);
      return false;
    }
    data.resize(bytesRead);
    return true;
#else
    // Non-Windows/Mac implementation needed
    std::cerr << "read() not implemented for this platform" << std::endl;
    data.resize(0);
    return false;
#endif
  }

 private:
  HandleContainer portHandle_;
};

///////////////////////////////////////////////////////////////////////////////

std::shared_ptr<SerialPortUart> SerialPortUart::create(
    const SerialPortInfo& portInfo,
    int baudRate) {
  auto handle = openSerialPort(portInfo, baudRate);
  if (!handle.isValid()) {
    return nullptr;
  }

  return std::shared_ptr<SerialPortUart>(new SerialPortUartImpl(portInfo, std::move(handle)));
}
