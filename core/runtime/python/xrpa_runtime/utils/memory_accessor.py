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
from typing import Any, Generic, Optional, TypeVar

from xrpa_runtime.utils.xrpa_utils import xrpa_debug_bounds_assert

T = TypeVar("T")


class MemoryUtils:
    @staticmethod
    def get_type_size(type_name: str) -> int:
        type_sizes = {
            "float": 4,
            "int": 4,
            "short": 2,
            "sbyte": 1,
            "uint": 4,
            "ushort": 2,
            "byte": 1,
        }
        if type_name not in type_sizes:
            raise ValueError(f"Unsupported type: {type_name}")
        return type_sizes[type_name]


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
        xrpa_debug_bounds_assert(offset, 0, self._size)
        xrpa_debug_bounds_assert(offset, size, self._size)
        return MemoryAccessor(self._data_source, self._mem_offset + offset, size)

    def is_null(self) -> bool:
        return self._data_source is None or self._size == 0

    def copy_from(self, src: "MemoryAccessor"):
        if src.is_null():
            return
        size = min(src.size, self._size)
        if size <= 0:
            return
        src_start = src._mem_offset
        dst_start = self._mem_offset
        self._data_source[dst_start : dst_start + size] = src._data_source[
            src_start : src_start + size
        ]

    def get_array(self, type_name: str) -> "MemoryArray":
        return MemoryArray(self, type_name)

    def read_at_offset(self, offset: int, type_name: str) -> Any:
        offset_obj = MemoryOffset(offset)
        if type_name == "float":
            return self.read_float(offset_obj)
        elif type_name == "int":
            return self.read_int(offset_obj)
        elif type_name == "uint":
            return self.read_uint(offset_obj)
        elif type_name == "short":
            return self.read_short(offset_obj)
        elif type_name == "ushort":
            return self.read_ushort(offset_obj)
        elif type_name == "byte":
            return self.read_byte(offset_obj)
        elif type_name == "sbyte":
            return self.read_sbyte(offset_obj)
        else:
            raise ValueError(f"Unsupported type: {type_name}")

    def write_at_offset(self, offset: int, type_name: str, value: Any):
        offset_obj = MemoryOffset(offset)
        if type_name == "float":
            self.write_float(value, offset_obj)
        elif type_name == "int":
            self.write_int(value, offset_obj)
        elif type_name == "uint":
            self.write_uint(value, offset_obj)
        elif type_name == "short":
            self.write_short(value, offset_obj)
        elif type_name == "ushort":
            self.write_ushort(value, offset_obj)
        elif type_name == "byte":
            self.write_byte(value, offset_obj)
        elif type_name == "sbyte":
            self.write_sbyte(value, offset_obj)
        else:
            raise ValueError(f"Unsupported type: {type_name}")

    def read_byte(self, offset: MemoryOffset) -> int:
        xrpa_debug_bounds_assert(offset._offset, 0, self._size)
        return self._data_source[self._mem_offset + offset.advance(1)]

    def write_byte(self, val: int, offset: MemoryOffset):
        xrpa_debug_bounds_assert(offset._offset, 0, self._size)
        self._data_source[self._mem_offset + offset.advance(1)] = val

    def read_sbyte(self, offset: MemoryOffset) -> int:
        xrpa_debug_bounds_assert(offset._offset, 0, self._size)
        return struct.unpack(
            "<b",
            self._data_source[
                self._mem_offset + offset.advance(1) : self._mem_offset + offset._offset
            ],
        )[0]

    def write_sbyte(self, val: int, offset: MemoryOffset):
        xrpa_debug_bounds_assert(offset._offset, 0, self._size)
        self._data_source[self._mem_offset + offset.advance(1)] = struct.pack("<b", val)

    def read_short(self, offset: MemoryOffset) -> int:
        xrpa_debug_bounds_assert(offset._offset, 2, self._size)
        start = self._mem_offset + offset.advance(2)
        return struct.unpack(
            "<h",
            self._data_source[start : start + 2],
        )[0]

    def write_short(self, val: int, offset: MemoryOffset):
        xrpa_debug_bounds_assert(offset._offset, 2, self._size)
        start = self._mem_offset + offset.advance(2)
        self._data_source[start : start + 2] = struct.pack("<h", val)

    def read_ushort(self, offset: MemoryOffset) -> int:
        xrpa_debug_bounds_assert(offset._offset, 2, self._size)
        start = self._mem_offset + offset.advance(2)
        return struct.unpack(
            "<H",
            self._data_source[start : start + 2],
        )[0]

    def write_ushort(self, val: int, offset: MemoryOffset):
        xrpa_debug_bounds_assert(offset._offset, 2, self._size)
        start = self._mem_offset + offset.advance(2)
        self._data_source[start : start + 2] = struct.pack("<H", val)

    def read_int(self, offset: MemoryOffset) -> int:
        xrpa_debug_bounds_assert(offset._offset, 4, self._size)
        start = self._mem_offset + offset.advance(4)
        return struct.unpack(
            "<i",
            self._data_source[start : start + 4],
        )[0]

    def write_int(self, val: int, offset: MemoryOffset):
        xrpa_debug_bounds_assert(offset._offset, 4, self._size)
        start = self._mem_offset + offset.advance(4)
        self._data_source[start : start + 4] = struct.pack("<i", val)

    def read_uint(self, offset: MemoryOffset) -> int:
        xrpa_debug_bounds_assert(offset._offset, 4, self._size)
        start = self._mem_offset + offset.advance(4)
        return struct.unpack(
            "<I",
            self._data_source[start : start + 4],
        )[0]

    def write_uint(self, val: int, offset: MemoryOffset):
        xrpa_debug_bounds_assert(offset._offset, 4, self._size)
        start = self._mem_offset + offset.advance(4)
        self._data_source[start : start + 4] = struct.pack("<I", val)

    def read_float(self, offset: MemoryOffset) -> float:
        xrpa_debug_bounds_assert(offset._offset, 4, self._size)
        start = self._mem_offset + offset.advance(4)
        return struct.unpack(
            "<f",
            self._data_source[start : start + 4],
        )[0]

    def write_float(self, val: float, offset: MemoryOffset):
        xrpa_debug_bounds_assert(offset._offset, 4, self._size)
        start = self._mem_offset + offset.advance(4)
        self._data_source[start : start + 4] = struct.pack("<f", val)

    def read_ulong(self, offset: MemoryOffset):
        xrpa_debug_bounds_assert(offset._offset, 8, self._size)
        start = self._mem_offset + offset.advance(8)
        return struct.unpack(
            "<Q",
            self._data_source[start : start + 8],
        )[0]

    def write_ulong(self, val: int, offset: MemoryOffset):
        xrpa_debug_bounds_assert(offset._offset, 8, self._size)
        start = self._mem_offset + offset.advance(8)
        self._data_source[start : start + 8] = struct.pack("<Q", val)

    def read_str(self, offset: MemoryOffset) -> str:
        return self.read_bytearray(offset).decode("utf-8")

    def write_str(self, val: str, offset: MemoryOffset):
        self.write_bytearray(val.encode("utf-8"), offset)

    @staticmethod
    def dyn_size_of_str(val: str) -> int:
        return len(val.encode("utf-8"))

    def read_bytearray(self, offset: MemoryOffset) -> bytearray:
        byte_count = self.read_int(offset)

        xrpa_debug_bounds_assert(offset._offset, byte_count, self._size)
        start = self._mem_offset + offset.advance(byte_count)
        return self._data_source[start : start + byte_count].tobytes()

    def write_bytearray(self, val: bytearray, offset: MemoryOffset):
        if val is None:
            self.write_int(0, offset)
            return

        byte_count = len(val)
        self.write_int(byte_count, offset)

        xrpa_debug_bounds_assert(offset._offset, byte_count, self._size)
        start = self._mem_offset + offset.advance(byte_count)
        self._data_source[start : start + byte_count] = val

    @staticmethod
    def dyn_size_of_bytearray(val: bytearray) -> int:
        return len(val) if val is not None else 0


class MemoryArray(Generic[T]):
    def __init__(self, mem_accessor: MemoryAccessor, type_name: str):
        self._mem_accessor = mem_accessor
        self._type_name = type_name
        self._value_size = MemoryUtils.get_type_size(type_name)

    def is_null(self) -> bool:
        return self._mem_accessor.is_null()

    def __getitem__(self, idx: int) -> Any:
        offset = idx * self._value_size
        return self._mem_accessor.read_at_offset(offset, self._type_name)

    def __setitem__(self, idx: int, value: Any):
        offset = idx * self._value_size
        self._mem_accessor.write_at_offset(offset, self._type_name, value)

    def copy_from(
        self, self_offset: int, src: "MemoryArray", src_offset: int, count: int
    ):
        if count <= 0:
            return
        byte_count = count * self._value_size
        src_byte_offset = src_offset * src._value_size
        dst_byte_offset = self_offset * self._value_size
        src_start = src._mem_accessor._mem_offset + src_byte_offset
        dst_start = self._mem_accessor._mem_offset + dst_byte_offset
        self._mem_accessor._data_source[dst_start : dst_start + byte_count] = (
            src._mem_accessor._data_source[src_start : src_start + byte_count]
        )

    def slice(self, offset_idx: int) -> "MemoryArray[T]":
        return MemoryArray(
            self._mem_accessor.slice(offset_idx * self._value_size), self._type_name
        )
