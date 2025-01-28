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

#include <xrpa-runtime/transport/InterprocessMutex.h>
#include <iostream>

#ifdef TEXT
#undef TEXT // undefine UE4 macro, if defined
#endif

#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#include <Windows.h>

namespace Xrpa {

void InterprocessMutex::createMutex() {
  std::string mutexName = "Global\\" + mutexName_;
  mutexHandle_ = CreateMutexA(NULL, FALSE, mutexName.c_str());
  if (mutexHandle_ != 0 && GetLastError() == ERROR_ALREADY_EXISTS) {
    std::cout << "Mutex " << mutexName << " already exists, opening it for SYNCHRONIZE"
              << std::endl;
    CloseHandle(mutexHandle_);
    mutexHandle_ = OpenMutexA(SYNCHRONIZE, FALSE, mutexName.c_str());
  }
}

void InterprocessMutex::freeMutex() {
  if (mutexHandle_ != 0) {
    CloseHandle(mutexHandle_);
    mutexHandle_ = 0;
  }
}

int filterException(int code, PEXCEPTION_POINTERS ex) {
  std::cout << "Exception: " << std::hex << code << std::endl;
  return EXCEPTION_EXECUTE_HANDLER;
}

bool runLockCallback(std::function<void()>& lockCallback) {
  __try {
    lockCallback();
  } __except (filterException(GetExceptionCode(), GetExceptionInformation())) {
    return false;
  }
  return true;
}

bool InterprocessMutex::lockInternal(int32_t timeoutMS, std::function<void()> lockCallback) {
  if (mutexHandle_ == 0) {
    return false;
  }
  auto code = WaitForSingleObject(mutexHandle_, timeoutMS);
  if (code != 0 && !hasLoggedError_) {
    hasLoggedError_ = true;
    std::cout << "Error locking mutex Global\\" << mutexName_ << ": " << GetLastError()
              << std::endl;
  }
  if (code != 0) {
    return false;
  }

  if (!runLockCallback(lockCallback)) {
    // release the mutex lock on crash, but still terminate the process
    unlock();
    std::terminate();
  }
  unlock();
  return true;
}

void InterprocessMutex::unlock() {
  if (mutexHandle_ != 0) {
    ReleaseMutex(mutexHandle_);
  }
}

} // namespace Xrpa
