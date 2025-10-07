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

#pragma once

#include <stdexcept>
#include <string>

namespace Xrpa {

inline void xrpaDebugBoundsAssert(int accessStart, int accessSize, int minRange, int maxRange) {
  int accessEnd = accessStart + accessSize;
  if (accessSize < 0 || accessStart < minRange || accessEnd > maxRange) {
    std::string msg = "Memory access violation: [" + std::to_string(accessStart) + ", " +
        std::to_string(accessEnd) + "] reaches outside of range [" + std::to_string(minRange) +
        ", " + std::to_string(maxRange) + "]";
    throw std::range_error(msg);
  }
}

inline void xrpaDebugAssert(bool condition, const char* msg = "Assertion failed") {
  if (!condition) {
    throw std::runtime_error(msg);
  }
}

} // namespace Xrpa
