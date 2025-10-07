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

#include "HandleContainer.h"

#ifdef WIN32
#include <Windows.h>

HandleContainer::~HandleContainer() {
  if (handle_ != INVALID_HANDLE_VALUE) {
    CloseHandle(handle_);
  }
}

HandleContainer::HandleContainer(HandleContainer&& other) noexcept : handle_(other.handle_) {
  other.handle_ = INVALID_HANDLE_VALUE;
}

HandleContainer& HandleContainer::operator=(HandleContainer&& other) noexcept {
  if (this != &other) {
    handle_ = other.handle_;
    other.handle_ = INVALID_HANDLE_VALUE;
  }
  return *this;
}

bool HandleContainer::isValid() const {
  return handle_ != INVALID_HANDLE_VALUE;
}
#else
// Non-Windows implementation
#include <unistd.h>

HandleContainer::~HandleContainer() {
  // For Mac/Unix, close file descriptors
  if (handle_ >= 0) {
    close(handle_);
  }
}

HandleContainer::HandleContainer(HandleContainer&& other) noexcept : handle_(other.handle_) {
  other.handle_ = -1;
}

HandleContainer& HandleContainer::operator=(HandleContainer&& other) noexcept {
  if (this != &other) {
    // Close current handle if valid
    if (handle_ >= 0) {
      close(handle_);
    }
    handle_ = other.handle_;
    other.handle_ = -1;
  }
  return *this;
}

bool HandleContainer::isValid() const {
  return handle_ >= 0;
}
#endif
