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


class MemoryOffset:
    def __init__(self, offset: int = 0):
        self._offset = offset

    def advance(self, size: int) -> int:
        offset = self._offset
        self._offset += size
        return offset


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
        write_offset = MemoryOffset()
        while write_offset._offset < self._size:
            if self._size - write_offset._offset >= 8:
                self.write_ulong(0, write_offset)
            elif self._size - write_offset._offset >= 4:
                self.write_int(0, write_offset)
            else:
                self.write_byte(0, write_offset)

    def copy_from(self, other: "MemoryAccessor"):
        if other.is_null():
            return
        size = min(other.size, self._size)
        read_offset = MemoryOffset()
        write_offset = MemoryOffset()
        while read_offset._offset < size:
            if size - read_offset._offset >= 8:
                self.write_ulong(other.read_ulong(read_offset), write_offset)
            elif size - read_offset._offset >= 4:
                self.write_int(other.read_int(read_offset), write_offset)
            else:
                self.write_byte(other.read_byte(read_offset), write_offset)

    def read_byte(self, offset: MemoryOffset) -> int:
        assert 0 <= offset._offset < self._size
        return self._data_source[self._mem_offset + offset.advance(1)]

    def write_byte(self, val: int, offset: MemoryOffset):
        assert 0 <= offset._offset < self._size
        self._data_source[self._mem_offset + offset.advance(1)] = val

    def read_int(self, offset: MemoryOffset) -> int:
        assert 0 <= offset._offset <= self._size - 4
        start = self._mem_offset + offset.advance(4)
        return struct.unpack(
            "<i",
            self._data_source[start : start + 4],
        )[0]

    def write_int(self, val: int, offset: MemoryOffset):
        assert 0 <= offset._offset <= self._size - 4
        start = self._mem_offset + offset.advance(4)
        self._data_source[start : start + 4] = struct.pack("<i", val)

    def read_uint(self, offset: MemoryOffset) -> int:
        assert 0 <= offset._offset <= self._size - 4
        start = self._mem_offset + offset.advance(4)
        return struct.unpack(
            "<I",
            self._data_source[start : start + 4],
        )[0]

    def write_uint(self, val: int, offset: MemoryOffset):
        assert 0 <= offset._offset <= self._size - 4
        start = self._mem_offset + offset.advance(4)
        self._data_source[start : start + 4] = struct.pack("<I", val)

    def read_float(self, offset: MemoryOffset) -> float:
        assert 0 <= offset._offset <= self._size - 4
        start = self._mem_offset + offset.advance(4)
        return struct.unpack(
            "<f",
            self._data_source[start : start + 4],
        )[0]

    def write_float(self, val: float, offset: MemoryOffset):
        assert 0 <= offset._offset <= self._size - 4
        start = self._mem_offset + offset.advance(4)
        self._data_source[start : start + 4] = struct.pack("<f", val)

    def read_ulong(self, offset: MemoryOffset):
        assert 0 <= offset._offset <= self._size - 8
        start = self._mem_offset + offset.advance(8)
        return struct.unpack(
            "<Q",
            self._data_source[start : start + 8],
        )[0]

    def write_ulong(self, val: int, offset: MemoryOffset):
        assert 0 <= offset._offset <= self._size - 8
        start = self._mem_offset + offset.advance(8)
        self._data_source[start : start + 8] = struct.pack("<Q", val)

    def read_str(self, offset: MemoryOffset) -> str:
        self.read_bytearray(offset).decode("utf-8")

    def write_str(self, val: str, offset: MemoryOffset):
        self.write_bytearray(val.encode("utf-8"), offset)

    @staticmethod
    def dyn_size_of_str(val: str) -> int:
        return len(val.encode("utf-8"))

    def read_bytearray(self, offset: MemoryOffset) -> bytearray:
        byte_count = self.read_int(offset)

        assert 0 <= offset._offset <= self._size - byte_count
        start = self._mem_offset + offset.advance(byte_count)
        return self._data_source[start : start + byte_count].tobytes()

    def write_bytearray(self, val: bytearray, offset: MemoryOffset):
        byte_count = len(val)
        self.write_int(byte_count, offset)

        assert 0 <= offset._offset <= self._size - byte_count
        start = self._mem_offset + offset.advance(byte_count)
        self._data_source[start : start + byte_count] = val

    @staticmethod
    def dyn_size_of_bytearray(val: bytearray) -> int:
        return len(val)
