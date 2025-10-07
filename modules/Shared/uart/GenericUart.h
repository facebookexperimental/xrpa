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

#include <stdint.h>
#include <string>
#include <vector>

class GenericUart {
 public:
  virtual ~GenericUart() = default;

  virtual bool write(const std::vector<uint8_t>& data) = 0;
  virtual bool read(std::vector<uint8_t>& data) = 0;

  std::string getID() {
    return id_;
  }

 protected:
  explicit GenericUart(const std::string& id) : id_(id) {}
  std::string id_;
};
