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

#include <xrpa-runtime/transport/SharedMemoryTransportStream.h>

#ifdef TEXT
#undef TEXT // undefine UE4 macro, if defined
#endif

#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#include <Windows.h>

namespace Xrpa {

SharedMemoryTransportStream::SharedMemoryTransportStream(
    const std::string& name,
    const TransportConfig& config)
    : MemoryTransportStream(name, config) {
  bool didCreate = false;

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

  // initialize the memory
  initializeMemory(didCreate);
}

SharedMemoryTransportStream::~SharedMemoryTransportStream() {
  if (memBuffer_ != nullptr) {
    UnmapViewOfFile(memBuffer_);
    memBuffer_ = nullptr;
  }

  if (memHandle_ != 0) {
    CloseHandle(memHandle_);
    memHandle_ = 0;
  }
}

} // namespace Xrpa
