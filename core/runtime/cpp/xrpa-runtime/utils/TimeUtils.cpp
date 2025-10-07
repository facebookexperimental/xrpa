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

#include "TimeUtils.h"
#include <thread>

#ifdef _WIN32
#include <Windows.h>
#include <timeapi.h>
#pragma comment(lib, "Winmm.lib")
#endif // _WIN32

using namespace std::chrono_literals;

namespace Xrpa {

void sleepFor(std::chrono::microseconds duration) {
  // Sleep for a bit less than the requested duration to account for inaccuracies
  constexpr std::chrono::microseconds kSleepInaccuracyMargin = 1500us;
  auto desiredEndTime = std::chrono::high_resolution_clock::now() + duration;
  auto desiredSleepEndTime = desiredEndTime - kSleepInaccuracyMargin;

  if (std::chrono::high_resolution_clock::now() < desiredSleepEndTime) {
#ifdef _WIN32
    constexpr const UINT kWinTimerPeriod = 1;
    timeBeginPeriod(kWinTimerPeriod);
#endif

    std::this_thread::sleep_until(desiredSleepEndTime);

#ifdef _WIN32
    timeEndPeriod(kWinTimerPeriod);
#endif
  }

  // Busy wait for the remaining time
  while (std::chrono::high_resolution_clock::now() < desiredEndTime) {
    // this space intentionally left blank
  }
}

} // namespace Xrpa
