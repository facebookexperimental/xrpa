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

import struct
from typing import Optional


class MemoryAccessor:
    def __init__(
        self, data_source: Optional[memoryview] = None, offset: int = 0, size: int = 0
    ):
        self._data_source = data_source
        self._mem_offset = offset
        self._size = size

    @property
    def mem_offset(self) -> int:
        return self._mem_offset

    @property
    def data_source(self) -> Optional[memoryview]:
        return self._data_source

    @property
    def size(self) -> int:
        return self._size

    def slice(self, offset, size=-1) -> "MemoryAccessor":
        if size < 0 or size > self._size - offset:
            size = self._size - offset
        if size < 0:
            size = 0
        assert 0 <= offset <= self._size
        assert 0 <= size <= self._size - offset
        return MemoryAccessor(self._data_source, self._mem_offset + offset, size)

    def is_null(self) -> bool:
        return self._data_source is None or self._size == 0

    def write_zeros(self):
        pos = 0
        while pos < self._size:
            if self._size - pos >= 8:
                self.write_ulong(0, pos)
                pos += 8
            elif self._size - pos >= 4:
                self.write_int(0, pos)
                pos += 4
            else:
                self.write_byte(0, pos)
                pos += 1

    def copy_from(self, other: "MemoryAccessor"):
        if other.is_null():
            return
        size = min(other.size, self._size)
        pos = 0
        while pos < size:
            if size - pos >= 8:
                self.write_ulong(other.read_ulong(pos), pos)
                pos += 8
            elif size - pos >= 4:
                self.write_int(other.read_int(pos), pos)
                pos += 4
            else:
                self.write_byte(other.read_byte(pos), pos)
                pos += 1

    def read_byte(self, offset: int) -> int:
        assert 0 <= offset < self._size
        return self._data_source[self._mem_offset + offset]

    def write_byte(self, val: int, offset: int):
        assert 0 <= offset < self._size
        self._data_source[self._mem_offset + offset] = val

    def read_int(self, offset: int) -> int:
        assert 0 <= offset <= self._size - 4
        return struct.unpack(
            "<i",
            self._data_source[
                self._mem_offset + offset : self._mem_offset + offset + 4
            ],
        )[0]

    def write_int(self, val: int, offset: int):
        assert 0 <= offset <= self._size - 4
        self._data_source[self._mem_offset + offset : self._mem_offset + offset + 4] = (
            struct.pack("<i", val)
        )

    def read_uint(self, offset: int) -> int:
        assert 0 <= offset <= self._size - 4
        return struct.unpack(
            "<I",
            self._data_source[
                self._mem_offset + offset : self._mem_offset + offset + 4
            ],
        )[0]

    def write_uint(self, val: int, offset: int):
        assert 0 <= offset <= self._size - 4
        self._data_source[self._mem_offset + offset : self._mem_offset + offset + 4] = (
            struct.pack("<I", val)
        )

    def read_float(self, offset: int) -> float:
        assert 0 <= offset <= self._size - 4
        return struct.unpack(
            "<f",
            self._data_source[
                self._mem_offset + offset : self._mem_offset + offset + 4
            ],
        )[0]

    def write_float(self, val: float, offset: int):
        assert 0 <= offset <= self._size - 4
        self._data_source[self._mem_offset + offset : self._mem_offset + offset + 4] = (
            struct.pack("<f", val)
        )

    def read_ulong(self, offset: int):
        assert 0 <= offset <= self._size - 8
        return struct.unpack(
            "<Q",
            self._data_source[
                self._mem_offset + offset : self._mem_offset + offset + 8
            ],
        )[0]

    def write_ulong(self, val: int, offset: int):
        assert 0 <= offset <= self._size - 8
        self._data_source[self._mem_offset + offset : self._mem_offset + offset + 8] = (
            struct.pack("<Q", val)
        )

    def read_string(self, offset: int, max_bytes: int) -> str:
        str_max_bytes = max_bytes - 4
        byte_count = self.read_int(offset)
        assert 0 <= byte_count <= str_max_bytes
        offset += 4

        assert 0 <= offset <= self._size - str_max_bytes
        return (
            self._data_source[
                self._mem_offset + offset : self._mem_offset + offset + byte_count
            ]
            .tobytes()
            .decode("utf-8")
        )

    def write_string(self, val: str, offset: int, max_bytes: int):
        raw_bytes = val.encode("utf-8")
        byte_count = len(raw_bytes)
        str_max_bytes = max_bytes - 4

        # truncate the string to fit in the buffer
        byte_count = min(byte_count, str_max_bytes)
        self.write_int(byte_count, offset)
        offset += 4

        assert 0 <= offset <= self._size - str_max_bytes
        self._data_source[
            self._mem_offset + offset : self._mem_offset + offset + byte_count
        ] = raw_bytes[:byte_count]
