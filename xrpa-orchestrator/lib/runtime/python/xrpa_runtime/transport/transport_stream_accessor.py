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

from abc import ABC
from typing import Callable, Type

from xrpa_runtime.utils.memory_accessor import MemoryAccessor, MemoryOffset
from xrpa_runtime.utils.time_utils import TimeUtils
from xrpa_runtime.utils.xrpa_types import ObjectAccessorInterface


class ChangeEventAccessor(ObjectAccessorInterface):
    DS_SIZE = 8

    def __init__(self, mem_accessor: MemoryAccessor = None):
        ObjectAccessorInterface.__init__(self, mem_accessor)

    def get_change_type(self) -> int:
        return self._mem_accessor.read_int(MemoryOffset(0))

    def set_change_type(self, change_type: int):
        self._mem_accessor.write_int(change_type, MemoryOffset(0))

    def get_timestamp(self) -> int:
        return self._mem_accessor.read_int(MemoryOffset(4))

    def set_timestamp(self, timestamp: int):
        self._mem_accessor.write_int(timestamp, MemoryOffset(4))


class TransportStreamIteratorData(ABC):
    pass


class TransportStreamAccessor:
    def __init__(
        self,
        base_timestamp: int,
        iterator_data: TransportStreamIteratorData,
        event_allocator: Callable[[int], MemoryAccessor],
    ):
        self._base_timestamp = base_timestamp
        self._iterator_data = iterator_data
        self._event_allocator = event_allocator

    def write_change_event(
        self,
        T: Type[ChangeEventAccessor],
        change_type: int,
        num_bytes: int = 0,
        timestamp: int = 0,
    ):
        change_event = T(self._event_allocator(T.DS_SIZE + num_bytes))
        if not change_event.is_null():
            change_event.set_change_type(change_type)
            change_event.set_timestamp(
                (timestamp - self._base_timestamp)
                if (timestamp != 0)
                else self.get_current_timestamp()
            )
        return change_event

    def get_current_timestamp(self) -> int:
        return int(
            TimeUtils.get_current_clock_time_microseconds() - self._base_timestamp
        )

    def get_iterator_data(self):
        return self._iterator_data
