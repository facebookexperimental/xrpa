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

namespace Xrpa {

class MutexLockedPointer {
 public:
  explicit MutexLockedPointer(void* ptr) : memPtr(ptr) {}
  virtual ~MutexLockedPointer() {
    memPtr = nullptr;
  }

  MutexLockedPointer(const MutexLockedPointer& other) = delete;
  MutexLockedPointer& operator=(const MutexLockedPointer& other) = delete;
  MutexLockedPointer(MutexLockedPointer&& other) = delete;
  MutexLockedPointer& operator=(MutexLockedPointer&& other) = delete;

  template <typename OutT = void>
  OutT* get(int byteOffset = 0) {
    if (memPtr == nullptr) {
      return nullptr;
    }
    return reinterpret_cast<OutT*>(reinterpret_cast<unsigned char*>(memPtr) + byteOffset);
  }

 protected:
  void* memPtr;
};

template <typename MutexType>
class MutexLockedPointerImpl : public MutexLockedPointer {
 public:
  MutexLockedPointerImpl(void* ptr, MutexType* mutex) : MutexLockedPointer(ptr), mutexPtr(mutex) {}

  virtual ~MutexLockedPointerImpl() override {
    if (mutexPtr != nullptr) {
      mutexPtr->unlock();
      mutexPtr = nullptr;
    }
  }

  MutexLockedPointerImpl(const MutexLockedPointerImpl& other) = delete;
  MutexLockedPointerImpl& operator=(const MutexLockedPointerImpl& other) = delete;
  MutexLockedPointerImpl(MutexLockedPointerImpl&& other) = delete;
  MutexLockedPointerImpl& operator=(MutexLockedPointerImpl&& other) = delete;

 private:
  MutexType* mutexPtr;
};

} // namespace Xrpa
