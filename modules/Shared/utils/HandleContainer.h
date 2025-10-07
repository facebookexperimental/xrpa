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

class HandleContainer {
 public:
#ifdef WIN32
  explicit HandleContainer(void* handle) : handle_(handle) {}

  void* operator*() {
    return handle_;
  }
#else
  explicit HandleContainer(int handle) : handle_(handle) {}

  int operator*() {
    return handle_;
  }
#endif

  ~HandleContainer();

  // allow move
  HandleContainer(HandleContainer&& other) noexcept;
  HandleContainer& operator=(HandleContainer&& other) noexcept;

  // disallow copy
  HandleContainer(const HandleContainer&) = delete;
  HandleContainer& operator=(const HandleContainer&) = delete;

  [[nodiscard]] bool isValid() const;

 private:
#ifdef WIN32
  void* handle_;
#else
  int handle_;
#endif
};
