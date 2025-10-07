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


import threading
import time
from abc import ABC, abstractmethod
from typing import Callable


class XrpaModule(ABC):
    def __init__(self):
        self._transact_lock = threading.Lock()
        self._stop_event = threading.Event()

        self._start_time_ns = 0
        self._frame_time_us = 0

    def is_running(self) -> bool:
        return not self._stop_event.is_set()

    def run(self, target_frames_per_sec: int, process_callback: Callable[[], None]):
        target_update_ms = 1000 // target_frames_per_sec

        self._start_time_ns = time.perf_counter_ns()
        last_frame_start_time_ns = self._start_time_ns

        while self.is_running():
            frame_start_time_ns = time.perf_counter_ns()
            self._frame_time_us = (
                frame_start_time_ns - last_frame_start_time_ns
            ) // 1000
            last_frame_start_time_ns = frame_start_time_ns

            self.transact(process_callback)

            frame_delta_ms = (time.perf_counter_ns() - frame_start_time_ns) // 1000000

            if frame_delta_ms < target_update_ms:
                time.sleep((target_update_ms - frame_delta_ms) / 1000)

        self._shutdown()

    def stop(self):
        self._stop_event.set()

    def transact(self, transact_callback: Callable[[], None]):
        with self._transact_lock:
            self._tick_inputs()
            transact_callback()
            self._tick_outputs()

    def check_for_updates(self):
        self._tick_inputs()

    def get_running_time_microseconds(self) -> int:
        return (time.perf_counter_ns() - self._start_time_ns) // 1000

    def get_frame_time_microseconds(self) -> int:
        return self._frame_time_us

    @abstractmethod
    def _shutdown(self):
        pass

    def shutdown(self):
        self._shutdown()

    @abstractmethod
    def _tick_inputs(self):
        pass

    @abstractmethod
    def _tick_outputs(self):
        pass

    def _background_tick_thread(self):
        self.run(10, lambda: None)
