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

from multiprocessing.shared_memory import SharedMemory
from typing import Callable

from xrpa_runtime.transport.memory_transport_stream import MemoryTransportStream
from xrpa_runtime.utils.memory_accessor import MemoryAccessor
from xrpa_runtime.utils.xrpa_types import TransportConfig


class SharedMemoryTransportStream(MemoryTransportStream):
    def __init__(self, name: str, config: TransportConfig) -> None:
        MemoryTransportStream.__init__(self, name, config)

        did_create = False
        self._shared_memory = None

        # open the shared memory file if it already exists
        try:
            self._shared_memory = SharedMemory(name)
            print(
                f"Opened existing shared memory file {name} with size {self._mem_size}"
            )
        except FileNotFoundError:
            pass

        if self._shared_memory is None:
            # create the shared memory file if it does not exist
            try:
                self._shared_memory = SharedMemory(name, True, self._mem_size)
                did_create = True
                print(f"Created shared memory file {name} with size {self._mem_size}")
            except FileNotFoundError:
                pass

        # if the create failed then it is possible we hit a race condition, so try opening it again
        if self._shared_memory is None:
            try:
                self._shared_memory = SharedMemory(name)
                print(
                    f"Opened existing shared memory file {name} with size {self._mem_size}"
                )
            except FileNotFoundError:
                print(f"Failed to create shared memory file {name}")

        if self._shared_memory is not None:
            self._initialize_memory(did_create)

    def __del__(self) -> None:
        if self._shared_memory is not None:
            self._shared_memory.close()
            self._shared_memory = None

    def _unsafe_access_memory(self, access_func: Callable[[], MemoryAccessor]) -> bool:
        if self._shared_memory is None:
            return False

        mem_accessor = MemoryAccessor(self._shared_memory.buf, 0, self._mem_size)
        access_func(mem_accessor)
        return True
