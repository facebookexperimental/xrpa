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

namespace Xrpa {

inline uint64_t getCurrentClockTimeMicroseconds() {
  auto duration = std::chrono::system_clock::now().time_since_epoch();
  return std::chrono::duration_cast<std::chrono::microseconds>(duration).count();
}

inline uint64_t getCurrentClockTimeNanoseconds() {
  auto duration = std::chrono::system_clock::now().time_since_epoch();
  return std::chrono::duration_cast<std::chrono::nanoseconds>(duration).count();
}

void sleepFor(std::chrono::microseconds duration);

} // namespace Xrpa
