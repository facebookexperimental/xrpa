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
