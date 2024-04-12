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

#include <dataset/sharedmem/InterprocessMutex.h>
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
  mutexHandle = CreateMutexA(NULL, FALSE, mutexName.c_str());
  if (mutexHandle != 0 && GetLastError() == ERROR_ALREADY_EXISTS) {
    std::cout << "Mutex " << mutexName << " already exists, opening it for SYNCHRONIZE"
              << std::endl;
    CloseHandle(mutexHandle);
    mutexHandle = OpenMutexA(SYNCHRONIZE, FALSE, mutexName.c_str());
  }
}

void InterprocessMutex::freeMutex() {
  if (mutexHandle != 0) {
    CloseHandle(mutexHandle);
    mutexHandle = 0;
  }
}

bool InterprocessMutex::lockInternal(int32_t timeoutMS) {
  if (mutexHandle != 0) {
    auto code = WaitForSingleObject(mutexHandle, timeoutMS);
    if (code != 0 && !hasLoggedError) {
      hasLoggedError = true;
      std::cout << "Error locking mutex " << mutexName << ": " << GetLastError() << std::endl;
    }
    return code == 0;
  }
  return false;
}

void InterprocessMutex::unlock() {
  if (mutexHandle != 0) {
    ReleaseMutex(mutexHandle);
  }
}

} // namespace Xrpa
