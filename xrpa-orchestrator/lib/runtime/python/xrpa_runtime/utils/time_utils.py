# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import time


class TimeUtils:
    # Static time offset in nanoseconds
    time_offset_ns = 0

    @staticmethod
    def get_current_clock_time_microseconds() -> int:
        return int((time.time_ns() + TimeUtils.time_offset_ns) // 1000)

    @staticmethod
    def get_current_clock_time_nanoseconds() -> int:
        return int(time.time_ns() + TimeUtils.time_offset_ns)
