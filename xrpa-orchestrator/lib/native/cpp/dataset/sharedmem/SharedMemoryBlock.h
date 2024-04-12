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

#include <dataset/core/MutexLockedPointer.h>
#include <dataset/sharedmem/InterprocessMutex.h>
#include <chrono>
#include <memory>
#include <string>

namespace Xrpa {

using InterprocessMutexLockedPointer = MutexLockedPointerImpl<InterprocessMutex>;

class SharedMemoryBlock {
 public:
  SharedMemoryBlock();
  SharedMemoryBlock(const std::string& name, size_t size);
  ~SharedMemoryBlock();

  // copy constructor
  SharedMemoryBlock(const SharedMemoryBlock& other)
      : SharedMemoryBlock(other.memName, other.memSize) {}

  // copy assignment
  SharedMemoryBlock& operator=(const SharedMemoryBlock& other);

  // move constructor
  SharedMemoryBlock(SharedMemoryBlock&& other) noexcept;

  // move assignment
  SharedMemoryBlock& operator=(SharedMemoryBlock&& other) noexcept;

  const std::string& getName() {
    return memName;
  }

  size_t getSize() const {
    return memSize;
  }

  template <typename R>
  std::unique_ptr<MutexLockedPointer> acquire(
      std::chrono::duration<int64_t, R> timeout,
      size_t byteOffset = 0) {
    if (memBuffer == nullptr) {
      openMemory(memName, memSize);
    }
    if (mutex == nullptr || !mutex->lock(timeout)) {
      return std::make_unique<InterprocessMutexLockedPointer>(nullptr, nullptr);
    } else {
      return std::make_unique<InterprocessMutexLockedPointer>(memBuffer + byteOffset, mutex);
    }
  }

  // returns true if it created the shared memory page, and false if another process created it
  bool openMemory(const std::string& name, size_t size);
  void closeMemory();

 private:
  friend class SharedDataset;

  std::string memName;
  size_t memSize = 0;

  void* memHandle = 0;
  unsigned char* memBuffer = nullptr;
  InterprocessMutex* mutex = nullptr;
};

} // namespace Xrpa
