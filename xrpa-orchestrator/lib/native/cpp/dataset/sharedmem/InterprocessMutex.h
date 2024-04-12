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

#include <chrono>
#include <string>

namespace Xrpa {

class InterprocessMutex {
 public:
  InterprocessMutex(const std::string& name) : mutexName(name) {
    createMutex();
  }

  ~InterprocessMutex() {
    freeMutex();
  }

  // copy constructor
  InterprocessMutex(const InterprocessMutex& other) : InterprocessMutex(other.mutexName) {}

  // copy assignment
  InterprocessMutex& operator=(const InterprocessMutex& other) {
    if (this != &other) {
      freeMutex();
      this->mutexName = other.mutexName;
      createMutex();
    }
    return *this;
  }

  // move constructor
  InterprocessMutex(InterprocessMutex&& other) noexcept : mutexName(other.mutexName) {
    this->mutexHandle = other.mutexHandle;
    other.mutexHandle = 0;
  }

  // move assignment
  InterprocessMutex& operator=(InterprocessMutex&& other) noexcept {
    if (this != &other) {
      freeMutex();
      this->mutexName = other.mutexName;
      this->mutexHandle = other.mutexHandle;
      other.mutexHandle = 0;
    }
    return *this;
  }

  template <typename R>
  bool lock(std::chrono::duration<int64_t, R> timeout) {
    auto timeoutMS = std::chrono::duration_cast<std::chrono::milliseconds>(timeout).count();
    return lockInternal(timeoutMS);
  }

  void unlock();

 private:
  std::string mutexName;
  void* mutexHandle;
  bool hasLoggedError = false;

  void createMutex();
  void freeMutex();
  bool lockInternal(int32_t timeoutMS);
};

} // namespace Xrpa
