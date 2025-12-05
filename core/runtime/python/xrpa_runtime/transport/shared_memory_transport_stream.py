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


import mmap
import os
import platform
import sys
from multiprocessing.shared_memory import SharedMemory
from typing import Callable

from xrpa_runtime.transport.memory_transport_stream import MemoryTransportStream
from xrpa_runtime.transport.memory_transport_stream_accessor import (
    MemoryTransportStreamAccessor,
)
from xrpa_runtime.utils.memory_accessor import MemoryAccessor
from xrpa_runtime.utils.xrpa_types import TransportConfig


def _format_shared_memory_name(base_name: str, config: TransportConfig) -> str:
    hash_prefix = config.schema_hash.Value0 & 0xFFFFFFFF

    version_hex = f"{MemoryTransportStreamAccessor.TRANSPORT_VERSION:x}"
    hash_hex = f"{hash_prefix:08x}"

    return f"{base_name}_v{version_hex}_{hash_hex}"


class SharedMemoryTransportStream(MemoryTransportStream):
    def __init__(self, name: str, config: TransportConfig) -> None:
        MemoryTransportStream.__init__(
            self, _format_shared_memory_name(name, config), config
        )

        did_create = False
        self._shared_memory = None

        if sys.platform == "win32":
            try:
                self._shared_memory = SharedMemory(self._name, True, self._mem_size)
                did_create = True
                print(
                    f"Created shared memory file {self._name} with size {self._mem_size}"
                )
            except FileExistsError:
                try:
                    self._shared_memory = SharedMemory(self._name)
                    print(
                        f"Opened existing shared memory file {self._name} with size {self._mem_size}"
                    )
                except FileNotFoundError:
                    print(f"Failed to open shared memory file {self._name}")
            except FileNotFoundError:
                try:
                    self._shared_memory = SharedMemory(self._name)
                    print(
                        f"Opened existing shared memory file {self._name} with size {self._mem_size}"
                    )
                except FileNotFoundError:
                    print(f"Failed to create or open shared memory file {self._name}")
        elif platform.system() == "Darwin":
            self._fd = None
            temp_path = "/tmp/xrpa/"
            os.makedirs(temp_path, exist_ok=True)
            file_path = f"{temp_path}{self._name}"

            try:
                # Try to open existing file first
                self._fd = os.open(file_path, os.O_RDWR)
                file_size = os.fstat(self._fd).st_size

                if file_size == 0:
                    os.ftruncate(self._fd, self._mem_size)
                    did_create = True
                    print(
                        f"Created shared memory file {file_path} with size {self._mem_size}"
                    )
                else:
                    print(
                        f"Opened existing shared memory file {file_path} with size {file_size}"
                    )
                    self._shared_memory = mmap.mmap(self._fd, self._mem_size)

            except FileNotFoundError:
                try:
                    self._fd = os.open(file_path, os.O_CREAT | os.O_RDWR, 0o666)
                    os.ftruncate(self._fd, self._mem_size)

                    if platform.system() == "Darwin":
                        self._shared_memory = mmap.mmap(self._fd, self._mem_size)
                    did_create = True
                    print(
                        f"Created shared memory file {file_path} with size {self._mem_size}"
                    )
                except Exception as e:
                    print(f"Failed to create shared memory file {file_path}: {e}")

            if self._shared_memory is None:
                try:
                    self._fd = os.open(file_path, os.O_RDWR)

                    if platform.system() == "Darwin":
                        self._shared_memory = mmap.mmap(self._fd, self._mem_size)
                    print(
                        f"Opened existing shared memory file {file_path} with size {self._mem_size}"
                    )
                except Exception as e:
                    print(f"Failed to open shared memory file {file_path}: {e}")

        if self._shared_memory is not None:
            if not self._initialize_memory(did_create):
                self._shutdown()

    def __del__(self) -> None:
        self._shutdown()

    def _shutdown(self) -> None:
        if self._shared_memory is not None:
            self._shared_memory.close()
            self._shared_memory = None

        if hasattr(self, "_fd") and self._fd is not None:
            os.close(self._fd)
            self._fd = None

    def _unsafe_access_memory(
        self, access_func: Callable[[MemoryAccessor], None]
    ) -> bool:
        if self._shared_memory is None:
            return False

        if sys.platform == "win32":
            mem_accessor = MemoryAccessor(self._shared_memory.buf, 0, self._mem_size)
        elif sys.platform == "darwin":
            mem_accessor = MemoryAccessor(
                memoryview(self._shared_memory), 0, self._mem_size
            )

        access_func(mem_accessor)

        # DEBUG: Force memory synchronization to ensure writes are visible to other processes
        if sys.platform == "win32":
            try:
                import ctypes
                import ctypes.wintypes

                # Call FlushViewOfFile to flush writes on Windows
                kernel32 = ctypes.windll.kernel32
                # Get the buffer address from SharedMemory
                buf_addr = ctypes.addressof(
                    ctypes.c_char.from_buffer(self._shared_memory.buf)
                )
                result = kernel32.FlushViewOfFile(buf_addr, self._mem_size)
                if result == 0:
                    error_code = kernel32.GetLastError()
                    print(
                        f"[XRPA_DEBUG_MSYNC] FlushViewOfFile failed with error: {error_code}"
                    )
            except Exception as e:
                print(f"[XRPA_DEBUG_MSYNC] Error calling FlushViewOfFile: {e}")
        elif sys.platform == "darwin":
            try:
                # Use mmap's built-in flush() which internally calls msync with the correct address
                self._shared_memory.flush()
            except Exception as e:
                print(f"[XRPA_DEBUG_MSYNC] Error calling mmap.flush(): {e}")

        return True
