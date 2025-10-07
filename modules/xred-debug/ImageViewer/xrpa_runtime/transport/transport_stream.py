# @generated
# (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.


from abc import ABC, abstractmethod
from typing import Callable

from xrpa_runtime.transport.transport_stream_accessor import TransportStreamAccessor
from xrpa_runtime.utils.memory_accessor import MemoryAccessor


class TransportStreamIterator(ABC):
    @abstractmethod
    def needs_processing(self) -> bool:
        pass

    @abstractmethod
    def has_missed_entries(self, accessor: TransportStreamAccessor) -> bool:
        pass

    @abstractmethod
    def get_next_entry(self, accessor: TransportStreamAccessor) -> MemoryAccessor:
        pass


class TransportStream(ABC):
    @abstractmethod
    def transact(
        self, timeoutMS: int, transact_func: Callable[[TransportStreamAccessor], None]
    ):
        pass

    @abstractmethod
    def create_iterator(self) -> TransportStreamIterator:
        pass
