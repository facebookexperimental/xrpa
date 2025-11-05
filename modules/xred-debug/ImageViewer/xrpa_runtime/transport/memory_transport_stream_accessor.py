# Copyright (c) Meta Platforms, Inc. and affiliates.
# @generated
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


from xrpa_runtime.utils.memory_accessor import MemoryAccessor, MemoryOffset
from xrpa_runtime.utils.placed_ring_buffer import PlacedRingBuffer
from xrpa_runtime.utils.time_utils import TimeUtils
from xrpa_runtime.utils.xrpa_types import HashValue, TransportConfig


class MemoryTransportStreamAccessor:
    DS_SIZE = 56
    TRANSPORT_VERSION = 9  # conorwdickinson: heartbeat and expiration

    def __init__(self, source: MemoryAccessor):
        self._mem_source = source
        self._mem_accessor = source.slice(0, MemoryTransportStreamAccessor.DS_SIZE)

    @property
    def transport_version(self) -> int:
        return self._mem_accessor.read_int(MemoryOffset(0))

    @transport_version.setter
    def transport_version(self, value: int):
        self._mem_accessor.write_int(value, MemoryOffset(0))

    @property
    def total_bytes(self) -> int:
        return self._mem_accessor.read_int(MemoryOffset(4))

    @total_bytes.setter
    def total_bytes(self, value: int):
        self._mem_accessor.write_int(value, MemoryOffset(4))

    @property
    def schema_hash(self) -> HashValue:
        return HashValue.read_value(self._mem_accessor, MemoryOffset(8))

    @schema_hash.setter
    def schema_hash(self, value: HashValue):
        HashValue.write_value(value, self._mem_accessor, MemoryOffset(8))

    @property
    def base_timestamp(self) -> int:
        return self._mem_accessor.read_ulong(MemoryOffset(40))

    @base_timestamp.setter
    def base_timestamp(self, value: int):
        self._mem_accessor.write_ulong(value, MemoryOffset(40))

    @property
    def last_changelog_id(self) -> int:
        return self._mem_accessor.read_int(MemoryOffset(48))

    @last_changelog_id.setter
    def last_changelog_id(self, value: int):
        self._mem_accessor.write_int(value, MemoryOffset(48))

    def get_last_update_age_microseconds(self) -> int:
        offset = MemoryOffset(52)
        return (
            TimeUtils.get_current_clock_time_microseconds()
            - self.base_timestamp
            - self._mem_accessor.read_uint(offset)
        )

    def set_last_update_timestamp(self):
        offset = MemoryOffset(52)
        self._mem_accessor.write_uint(
            TimeUtils.get_current_clock_time_microseconds() - self.base_timestamp,
            offset,
        )

    def get_changelog(self) -> PlacedRingBuffer:
        return PlacedRingBuffer(self._mem_source, MemoryTransportStreamAccessor.DS_SIZE)

    @staticmethod
    def get_mem_size(config: TransportConfig) -> int:
        return MemoryTransportStreamAccessor.DS_SIZE + PlacedRingBuffer.get_mem_size(
            config.changelog_byte_count
        )

    def initialize(self, config: TransportConfig):
        # initialize baseTimestamp to 0 first, to let lock-free readers know the data is invalid
        # (note there is still sort of a race condition there... but a reader always has to acquire
        # the lock before actually doing anything anyway)
        self.base_timestamp = 0

        self.last_changelog_id = -1
        self.transport_version = MemoryTransportStreamAccessor.TRANSPORT_VERSION
        self.total_bytes = MemoryTransportStreamAccessor.get_mem_size(config)
        self.schema_hash = config.schema_hash
        self.get_changelog().init(config.changelog_byte_count)

        # set this last as it tells anyone accessing the header
        # without a mutex lock that the header is not yet initialized
        self.base_timestamp = TimeUtils.get_current_clock_time_microseconds()
        self.set_last_update_timestamp()

    def version_check(self, config: TransportConfig) -> bool:
        return (
            self.base_timestamp != 0
            and self.transport_version
            == MemoryTransportStreamAccessor.TRANSPORT_VERSION
            and self.schema_hash == config.schema_hash
        )
