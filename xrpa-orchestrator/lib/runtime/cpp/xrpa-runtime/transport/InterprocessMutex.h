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

#include <functional>
#include <string>

namespace Xrpa {

/**
 * Abstract base class for interprocess mutex implementations.
 * Provides platform-independent interface for interprocess synchronization.
 */
class InterprocessMutex {
 public:
  virtual ~InterprocessMutex() = default;

  virtual void unlock() = 0;

  virtual void dispose() = 0;

  // Execute a callback while holding the mutex lock, with appropriate exception handling
  virtual bool lockAndExecute(int timeoutMS, std::function<void()> lockCallback) = 0;
};

#ifdef WIN32

class WindowsInterprocessMutex : public InterprocessMutex {
 public:
  explicit WindowsInterprocessMutex(const std::string& name);
  ~WindowsInterprocessMutex() override;

  void unlock() override;
  void dispose() override;

  // Execute a callback while holding the mutex lock, with SEH exception handling
  bool lockAndExecute(int timeoutMS, std::function<void()> lockCallback) override;

 private:
  std::string mutexName_;
  void* mutexHandle_ = nullptr;
  bool hasLoggedError_ = false;
};
#endif // _WIN32

#ifdef __APPLE__

class MacInterprocessMutex : public InterprocessMutex {
 public:
  explicit MacInterprocessMutex(const std::string& name);
  ~MacInterprocessMutex() override;

  void unlock() override;
  void dispose() override;

  // Execute a callback while holding the mutex lock, with standard exception handling
  bool lockAndExecute(int timeoutMS, std::function<void()> lockCallback) override;

 private:
  std::string lockFilePath_;
  int fileDescriptor_ = -1;
  bool isLocked_ = false;
};
#endif // __APPLE__

} // namespace Xrpa
