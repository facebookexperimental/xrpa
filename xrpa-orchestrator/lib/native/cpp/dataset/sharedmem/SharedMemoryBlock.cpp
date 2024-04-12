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

#include <dataset/sharedmem/SharedMemoryBlock.h>

#ifdef TEXT
#undef TEXT // undefine UE4 macro, if defined
#endif

#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#include <Windows.h>

namespace Xrpa {

SharedMemoryBlock::SharedMemoryBlock() {}

SharedMemoryBlock::SharedMemoryBlock(const std::string& name, size_t size) {
  openMemory(name, size);
}

SharedMemoryBlock::~SharedMemoryBlock() {
  closeMemory();
}

// copy assignment
SharedMemoryBlock& SharedMemoryBlock::operator=(const SharedMemoryBlock& other) {
  if (this != &other) {
    closeMemory();
    openMemory(other.memName, other.memSize);
  }
  return *this;
}

// move constructor
SharedMemoryBlock::SharedMemoryBlock(SharedMemoryBlock&& other) noexcept
    : memName(other.memName),
      memSize(other.memSize),
      memHandle(other.memHandle),
      memBuffer(other.memBuffer),
      mutex(other.mutex) {
  other.memHandle = 0;
  other.memBuffer = nullptr;
  other.mutex = nullptr;
}

// move assignment
SharedMemoryBlock& SharedMemoryBlock::operator=(SharedMemoryBlock&& other) noexcept {
  if (this != &other) {
    closeMemory();

    memName = other.memName;
    memSize = other.memSize;
    memHandle = other.memHandle;
    memBuffer = other.memBuffer;
    mutex = other.mutex;

    other.memHandle = 0;
    other.memBuffer = nullptr;
    other.mutex = nullptr;
  }
  return *this;
}

bool SharedMemoryBlock::openMemory(const std::string& name, size_t size) {
  bool didCreate = false;

  closeMemory();

  if (&name != &memName) {
    memName = name;
  }
  memSize = size;

  // open the shared memory file if it already exists
  memHandle = OpenFileMappingA(FILE_MAP_ALL_ACCESS, FALSE, memName.c_str());

  // create the shared memory file if it does not exist
  if (memHandle == 0) {
    memHandle =
        CreateFileMappingA(INVALID_HANDLE_VALUE, NULL, PAGE_READWRITE, 0, memSize, memName.c_str());
    if (memHandle != 0) {
      didCreate = true;
    }
  }

  // if the create failed then it is possible we hit a race condition, so try opening it again
  if (memHandle == 0) {
    memHandle = OpenFileMappingA(FILE_MAP_ALL_ACCESS, FALSE, memName.c_str());
  }

  // map the shared memory file to memory
  memBuffer = (unsigned char*)MapViewOfFile(memHandle, FILE_MAP_ALL_ACCESS, 0, 0, memSize);

  mutex = new InterprocessMutex("Global\\" + memName + "Mutex");

  return didCreate;
}

void SharedMemoryBlock::closeMemory() {
  if (memBuffer != nullptr) {
    UnmapViewOfFile(memBuffer);
    memBuffer = nullptr;
  }

  if (memHandle != 0) {
    CloseHandle(memHandle);
    memHandle = 0;
  }

  if (mutex != nullptr) {
    delete mutex;
    mutex = nullptr;
  }
}

} // namespace Xrpa
