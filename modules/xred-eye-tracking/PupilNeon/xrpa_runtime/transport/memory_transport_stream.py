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


import sys
from abc import abstractmethod
from typing import Callable

from xrpa_runtime.transport.interprocess_mutex import (
    MacOsInterprocessMutex,
    WindowsInterprocessMutex,
)
from xrpa_runtime.transport.memory_transport_stream_accessor import (
    MemoryTransportStreamAccessor,
)
from xrpa_runtime.transport.transport_stream import (
    TransportStream,
    TransportStreamIterator,
)
from xrpa_runtime.transport.transport_stream_accessor import (
    TransportStreamAccessor,
    TransportStreamIteratorData,
)
from xrpa_runtime.utils.memory_accessor import MemoryAccessor
from xrpa_runtime.utils.placed_ring_buffer import (
    PlacedRingBuffer,
    PlacedRingBufferIterator,
)
from xrpa_runtime.utils.xrpa_types import TransportConfig

# Transport constants
TRANSPORT_HEARTBEAT_INTERVAL = 1_000_000  # 1 second in microseconds
TRANSPORT_EXPIRE_TIME = 20_000_000  # 20 seconds in microseconds


# helper classes


class MemoryTransportStreamIteratorData(TransportStreamIteratorData):
    changelog: PlacedRingBuffer


class MemoryTransportStreamIterator(TransportStreamIterator):
    def __init__(self, transport_stream: "MemoryTransportStream"):
        self._transport_stream = transport_stream
        self._iter = PlacedRingBufferIterator()

    def needs_processing(self) -> bool:
        ret = False

        def lock_free_check(mem_accessor: MemoryAccessor):
            nonlocal ret
            stream_accessor = MemoryTransportStreamAccessor(mem_accessor)
            ret = self._iter.has_next_given_max_id(stream_accessor.last_changelog_id)

        self._transport_stream._unsafe_access_memory(lock_free_check)
        return ret

    def has_missed_entries(self, accessor: TransportStreamAccessor) -> bool:
        iter_data = accessor.get_iterator_data()
        if not isinstance(iter_data, MemoryTransportStreamIteratorData):
            return False
        changelog = iter_data.changelog
        if self._iter.has_missed_entries(changelog):
            self._iter.set_to_end(changelog)
            return True
        return False

    def get_next_entry(self, accessor: TransportStreamAccessor) -> MemoryAccessor:
        iter_data = accessor.get_iterator_data()
        if not isinstance(iter_data, MemoryTransportStreamIteratorData):
            return MemoryAccessor()
        changelog = iter_data.changelog
        return self._iter.next(changelog)


# main class
class MemoryTransportStream(TransportStream):
    def __init__(self, name: str, config: TransportConfig):
        self._name = name
        self._config = config
        self._mem_size = MemoryTransportStreamAccessor.get_mem_size(config)
        if sys.platform == "win32":
            self._mutex = WindowsInterprocessMutex(name)
        elif sys.platform == "darwin":
            self._mutex = MacOsInterprocessMutex(name)
        else:
            raise NotImplementedError(f"Unsupported platform: {sys.platform}")

    def __del__(self):
        self._mutex.close()

    def transact(
        self, timeoutMS: int, transact_func: Callable[[TransportStreamAccessor], None]
    ):
        def transact_locked(mem_accessor: MemoryAccessor):
            stream_accessor = MemoryTransportStreamAccessor(mem_accessor)
            changelog = stream_accessor.get_changelog()
            base_timestamp = stream_accessor.base_timestamp
            iter_data = MemoryTransportStreamIteratorData()
            iter_data.changelog = changelog

            def event_allocator(byte_count: int) -> MemoryAccessor:
                (event_mem, id) = changelog.push(byte_count)
                if not event_mem.is_null():
                    stream_accessor.last_changelog_id = id
                return event_mem

            transport_accessor = TransportStreamAccessor(
                base_timestamp, iter_data, event_allocator
            )
            transact_func(transport_accessor)
            stream_accessor.set_last_update_timestamp()

        self._lock(timeoutMS, transact_locked)

    def create_iterator(self) -> TransportStreamIterator:
        return MemoryTransportStreamIterator(self)

    def needs_heartbeat(self) -> bool:
        ret = False

        def lock_free_check(mem_accessor: MemoryAccessor):
            nonlocal ret
            stream_accessor = MemoryTransportStreamAccessor(mem_accessor)
            ret = (
                stream_accessor.get_last_update_age_microseconds()
                > TRANSPORT_HEARTBEAT_INTERVAL
            )

        self._unsafe_access_memory(lock_free_check)
        return ret

    def _lock(self, timeoutMS: int, lock_func: Callable[[], MemoryAccessor]) -> bool:
        if self._mutex.try_lock(timeoutMS):
            try:
                return self._unsafe_access_memory(lock_func)
            finally:
                self._mutex.release()

        return False

    @abstractmethod
    def _unsafe_access_memory(self, access_func: Callable[[], MemoryAccessor]) -> bool:
        pass

    def _initialize_memory_on_create(self) -> bool:
        def initialize_created_memory(mem_accessor: MemoryAccessor):
            stream_accessor = MemoryTransportStreamAccessor(mem_accessor)
            stream_accessor.initialize(self._config)

        return self._lock(5000, initialize_created_memory)

    def _initialize_memory(self, did_create: bool):
        if did_create:
            return self._initialize_memory_on_create()

        # lock-free version check against the transport header
        is_initialized = False

        def check_initialized(mem_accessor: MemoryAccessor):
            nonlocal is_initialized
            stream_accessor = MemoryTransportStreamAccessor(mem_accessor)
            is_initialized = stream_accessor.is_initialized()

        self._unsafe_access_memory(check_initialized)

        if not is_initialized:
            print(
                f"MemoryTransportStream({self._name})._initialize_memory: memory not available"
            )
            return False

        base_timestamp = 0

        def get_base_timestamp(mem_accessor: MemoryAccessor):
            nonlocal base_timestamp
            stream_accessor = MemoryTransportStreamAccessor(mem_accessor)
            base_timestamp = stream_accessor.base_timestamp

        self._unsafe_access_memory(get_base_timestamp)

        if base_timestamp == 0:
            # another process could be initializing the memory, so wait for it to finish
            def wait_for_init(mem_accessor: MemoryAccessor):
                pass

            self._lock(5000, wait_for_init)

            self._unsafe_access_memory(get_base_timestamp)
            if base_timestamp == 0:
                # if the memory is still not initialized after the timeout, then re-initialize it
                return self._initialize_memory_on_create()

        transport_version = 0

        def get_transport_version(mem_accessor: MemoryAccessor):
            nonlocal transport_version
            stream_accessor = MemoryTransportStreamAccessor(mem_accessor)
            transport_version = stream_accessor.transport_version

        self._unsafe_access_memory(get_transport_version)

        if transport_version < 9:
            # no heartbeat to check, so re-initialize the transport memory
            print(
                f"MemoryTransportStream({self._name})._initialize_memory: transport version too old, reinitializing"
            )
            return self._initialize_memory_on_create()

        # check if the transport memory has expired
        last_update_age_microseconds = 0

        def get_last_update_age(mem_accessor: MemoryAccessor):
            nonlocal last_update_age_microseconds
            stream_accessor = MemoryTransportStreamAccessor(mem_accessor)
            last_update_age_microseconds = (
                stream_accessor.get_last_update_age_microseconds()
            )

        self._unsafe_access_memory(get_last_update_age)

        if last_update_age_microseconds > TRANSPORT_EXPIRE_TIME:
            print(
                f"MemoryTransportStream({self._name})._initialize_memory: transport memory expired, reinitializing"
            )
            return self._initialize_memory_on_create()

        if transport_version != MemoryTransportStreamAccessor.TRANSPORT_VERSION:
            # transport version mismatch, but the memory is in use, so error out
            print(
                f"MemoryTransportStream({self._name})._initialize_memory: version check failed"
            )
            return False

        schema_hash = None

        def get_schema_hash(mem_accessor: MemoryAccessor):
            nonlocal schema_hash
            stream_accessor = MemoryTransportStreamAccessor(mem_accessor)
            schema_hash = stream_accessor.schema_hash

        self._unsafe_access_memory(get_schema_hash)

        if schema_hash != self._config.schema_hash:
            # schema hash mismatch, but the memory is in use, so error out
            print(
                f"MemoryTransportStream({self._name})._initialize_memory: schema hash mismatch"
            )
            return False

        return True
