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

#include <xrpa-runtime/transport/InterprocessMutex.h>
#include <chrono>
#include <filesystem>
#include <iostream>
#include <system_error>
#include <thread>

#ifdef WIN32
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#include <Windows.h>
#endif

#ifdef __APPLE__
#include <fcntl.h>
#include <sys/file.h>
#include <unistd.h>
#endif

namespace Xrpa {

#ifdef WIN32

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

WindowsInterprocessMutex::WindowsInterprocessMutex(const std::string& name)
    : mutexName_(name), mutexHandle_(0), hasLoggedError_(false) {
  std::string fullMutexName = "Global\\" + name + "Mutex";
  mutexHandle_ = CreateMutexA(NULL, FALSE, fullMutexName.c_str());

  if (mutexHandle_ == 0) {
    std::cerr << "Failed to create mutex: " << GetLastError() << std::endl;
  } else if (GetLastError() == ERROR_ALREADY_EXISTS) {
    std::cout << "Mutex " << fullMutexName << " already exists, opening it for SYNCHRONIZE"
              << std::endl;
    CloseHandle(mutexHandle_);
    mutexHandle_ = OpenMutexA(SYNCHRONIZE, FALSE, fullMutexName.c_str());
  }
}

WindowsInterprocessMutex::~WindowsInterprocessMutex() {
  dispose();
}

bool WindowsInterprocessMutex::lockAndExecute(
    int32_t timeoutMS,
    std::function<void()> lockCallback) {
  if (mutexHandle_ == 0) {
    return false;
  }
  auto code = WaitForSingleObject(mutexHandle_, timeoutMS);
  if (code != WAIT_OBJECT_0 && !hasLoggedError_) {
    hasLoggedError_ = true;
    std::cout << "Error locking mutex Global\\" << mutexName_ << ": " << GetLastError()
              << std::endl;
  }
  if (code != WAIT_OBJECT_0) {
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

void WindowsInterprocessMutex::unlock() {
  if (mutexHandle_ != 0) {
    ReleaseMutex(mutexHandle_);
  }
}

void WindowsInterprocessMutex::dispose() {
  if (mutexHandle_ != 0) {
    CloseHandle(mutexHandle_);
    mutexHandle_ = 0;
  }
}

#elif defined(__APPLE__)

MacInterprocessMutex::MacInterprocessMutex(const std::string& name) : fileDescriptor_(-1) {
  const std::string tempPath = "/tmp/xrpa";
  lockFilePath_ = tempPath + "/" + name + ".lock";

  // Create the directory and touch the file to ensure it exists
  std::filesystem::create_directories(tempPath);

  // Create the lock file if it doesn't exist
  int fd = open(lockFilePath_.c_str(), O_CREAT | O_RDWR, 0666);
  if (fd == -1) {
    std::cerr << "Lock file creation failed: " << strerror(errno) << "\n" << std::flush;
    throw std::system_error(
        errno, std::system_category(), "Could not create lock file at " + lockFilePath_);
  }
  close(fd);
}

MacInterprocessMutex::~MacInterprocessMutex() {
  dispose();
}

bool MacInterprocessMutex::lock() {
  if (fileDescriptor_ != -1) {
    // Already locked
    return true;
  }

  // Open the file fresh for this lock attempt
  fileDescriptor_ = open(lockFilePath_.c_str(), O_RDWR);
  if (fileDescriptor_ == -1) {
    std::cerr << "Error opening lock file: " << strerror(errno) << "\n" << std::flush;
    return false;
  }

  int result = flock(fileDescriptor_, LOCK_EX | LOCK_NB);
  if (result == 0) {
    return true;
  } else {
    if (errno != EWOULDBLOCK) {
      std::cerr << "Error locking file: " << strerror(errno) << "\n" << std::flush;
    }
    // Close the file since we didn't get the lock
    close(fileDescriptor_);
    fileDescriptor_ = -1;
    return false;
  }
}

bool MacInterprocessMutex::lockAndExecute(int timeoutMS, std::function<void()> lockCallback) {
  if (fileDescriptor_ != -1) {
    // Already locked by this instance
    try {
      lockCallback();
      return true;
    } catch (...) {
      throw;
    }
  }

  // Try to acquire the lock with timeout
  bool lockAcquired = false;

  if (timeoutMS <= 0) {
    lockAcquired = lock();
  } else {
    auto startTime = std::chrono::steady_clock::now();
    auto endTime = startTime + std::chrono::milliseconds(timeoutMS);

    do {
      if (lock()) {
        lockAcquired = true;
        break;
      }

      // For longer timeouts, use polling with 1ms sleep to reduce CPU usage
      if (timeoutMS >= 5) {
        std::this_thread::sleep_for(std::chrono::milliseconds(1));
      }
    } while (std::chrono::steady_clock::now() < endTime);
  }

  if (!lockAcquired) {
    return false;
  }

  try {
    lockCallback();
    unlock();
    return true;
  } catch (...) {
    unlock();
    throw;
  }
}

void MacInterprocessMutex::unlock() {
  if (fileDescriptor_ == -1) {
    return;
  }

  int result = flock(fileDescriptor_, LOCK_UN);
  if (result != 0) {
    std::cerr << "Error unlocking file: " << strerror(errno) << "\n" << std::flush;
  }

  close(fileDescriptor_);
  fileDescriptor_ = -1;
}

void MacInterprocessMutex::dispose() {
  unlock();
}
#endif

} // namespace Xrpa
