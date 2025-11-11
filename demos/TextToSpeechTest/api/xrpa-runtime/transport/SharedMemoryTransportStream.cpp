/*
// @generated
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

#include <xrpa-runtime/transport/SharedMemoryTransportStream.h>

#include <iomanip>
#include <sstream>

#include <xrpa-runtime/transport/MemoryTransportStreamAccessor.h>

#if defined(WIN32)
#include <Windows.h>
#ifdef TEXT
#undef TEXT // undefine UE4 macro, if defined
#endif

#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif

#elif defined(__APPLE__)
#include <fcntl.h>
#include <sys/mman.h>
#include <sys/stat.h>
#include <unistd.h>
#endif

namespace Xrpa {

std::string formatSharedMemoryName(const std::string& baseName, const TransportConfig& config) {
  auto hashPrefix = static_cast<uint32_t>(config.schemaHash.value0 & 0xFFFFFFFF);

  std::stringstream ss;
  ss << baseName << "_v" << std::hex << MemoryTransportStreamAccessor::TRANSPORT_VERSION << "_"
     << std::setfill('0') << std::setw(8) << hashPrefix;
  return ss.str();
}

SharedMemoryTransportStream::SharedMemoryTransportStream(
    const std::string& name,
    const TransportConfig& config)
    : MemoryTransportStream(formatSharedMemoryName(name, config), config) {
  bool didCreate = false;
#if defined(WIN32)
  // open the shared memory file if it already exists
  memHandle_ = OpenFileMappingA(FILE_MAP_ALL_ACCESS, FALSE, name_.c_str());

  // create the shared memory file if it does not exist
  if (memHandle_ == 0) {
    memHandle_ =
        CreateFileMappingA(INVALID_HANDLE_VALUE, NULL, PAGE_READWRITE, 0, memSize_, name_.c_str());
    if (memHandle_ != 0) {
      didCreate = true;
    }
  }

  // if the create failed then it is possible we hit a race condition, so try opening it again
  if (memHandle_ == 0) {
    memHandle_ = OpenFileMappingA(FILE_MAP_ALL_ACCESS, FALSE, name_.c_str());
  }

  // map the shared memory file to memory
  memBuffer_ = (unsigned char*)MapViewOfFile(memHandle_, FILE_MAP_ALL_ACCESS, 0, 0, memSize_);
#elif defined(__APPLE__)
  std::string filePath = "/tmp/xrpa/" + name_;
  int fd = open(filePath.c_str(), O_RDWR | O_CREAT, 0666);
  if (fd != -1) {
    struct stat st{};
    fstat(fd, &st);
    didCreate = (st.st_size == 0);
    if (didCreate) {
      ftruncate(fd, memSize_);
    }
  }

  if (fd == -1) {
    perror("Error opening shared memory");
  }

  // Set the size of the shared memory segment
  ftruncate(fd, memSize_);

  // Map the shared memory segment into our address space
  memBuffer_ = (unsigned char*)mmap(NULL, memSize_, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);
  if (memBuffer_ == MAP_FAILED) {
    perror("Error mapping shared memory");
  }

  close(fd);
#endif

  if (!initializeMemory(didCreate)) {
    shutdown();
  }
}

SharedMemoryTransportStream::~SharedMemoryTransportStream() {
  shutdown();
}

void SharedMemoryTransportStream::shutdown() {
#if defined(WIN32)
  if (memBuffer_ != nullptr) {
    UnmapViewOfFile(memBuffer_);
    memBuffer_ = nullptr;
  }

  if (memHandle_ != 0) {
    CloseHandle(memHandle_);
    memHandle_ = 0;
  }
#elif defined(__APPLE__)
  if (memBuffer_ != nullptr) {
    munmap(memBuffer_, memSize_);
    memBuffer_ = nullptr;
  }
#endif
}

} // namespace Xrpa
