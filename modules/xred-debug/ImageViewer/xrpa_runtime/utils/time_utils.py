# @generated
# (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.


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
