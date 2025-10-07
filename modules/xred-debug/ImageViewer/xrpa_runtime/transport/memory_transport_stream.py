# @generated
# (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.


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

        self._lock(timeoutMS, transact_locked)

    def create_iterator(self) -> TransportStreamIterator:
        return MemoryTransportStreamIterator(self)

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

    def _initialize_memory(self, did_create: bool):
        if did_create:

            def initialize_created_memory(mem_accessor: MemoryAccessor):
                stream_accessor = MemoryTransportStreamAccessor(mem_accessor)
                stream_accessor.initialize(self._config)

            return self._lock(5000, initialize_created_memory)

        # lock-free version check against the transport metadata
        ret = False

        def lock_free_version_check(mem_accessor: MemoryAccessor):
            nonlocal ret
            stream_accessor = MemoryTransportStreamAccessor(mem_accessor)
            ret = stream_accessor.version_check(self._config)

        self._unsafe_access_memory(lock_free_version_check)
        return ret
