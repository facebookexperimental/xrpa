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
from xrpa_runtime.utils.xrpa_utils import xrpa_debug_assert


class PlacedRingBuffer:
    ELEMENT_HEADER_SIZE = 4
    PROPS_SIZE = 24

    def __init__(self, mem_source: MemoryAccessor, mem_offset: int):
        self._mem_source = mem_source
        self._props_accessor = mem_source.slice(mem_offset, self.PROPS_SIZE)
        self._pool_accessor = mem_source.slice(
            mem_offset + self.PROPS_SIZE, self._props_accessor.read_int(MemoryOffset(0))
        )

    @staticmethod
    def get_mem_size(pool_size: int) -> int:
        return PlacedRingBuffer.PROPS_SIZE + pool_size

    @property
    def pool_size(self) -> int:
        return self._props_accessor.read_int(MemoryOffset(0))

    @pool_size.setter
    def pool_size(self, value: int):
        self._props_accessor.write_int(value, MemoryOffset(0))

    @property
    def count(self) -> int:
        return self._props_accessor.read_int(MemoryOffset(4))

    @count.setter
    def count(self, value: int):
        self._props_accessor.write_int(value, MemoryOffset(4))

    @property
    def start_id(self) -> int:
        return self._props_accessor.read_int(MemoryOffset(8))

    @start_id.setter
    def start_id(self, value: int):
        self._props_accessor.write_int(value, MemoryOffset(8))

    @property
    def start_offset(self) -> int:
        return self._props_accessor.read_int(MemoryOffset(12))

    @start_offset.setter
    def start_offset(self, value: int):
        self._props_accessor.write_int(value, MemoryOffset(12))

    @property
    def last_elem_offset(self) -> int:
        return self._props_accessor.read_int(MemoryOffset(16))

    @last_elem_offset.setter
    def last_elem_offset(self, value: int):
        self._props_accessor.write_int(value, MemoryOffset(16))

    @property
    def prewrap_offset(self) -> int:
        return self._props_accessor.read_int(MemoryOffset(20))

    @prewrap_offset.setter
    def prewrap_offset(self, value: int):
        self._props_accessor.write_int(value, MemoryOffset(20))

    def init(self, pool_size: int):
        self.pool_size = pool_size
        self.count = 0
        self.start_id = 0
        self.start_offset = 0
        self.last_elem_offset = 0
        self.prewrap_offset = pool_size
        self._pool_accessor = self._mem_source.slice(
            self._props_accessor.mem_offset
            - self._mem_source.mem_offset
            + self.PROPS_SIZE,
            pool_size,
        )

    def reset(self):
        self.init(self.pool_size)

    def get_at(self, index: int) -> MemoryAccessor:
        if index >= self.count:
            return MemoryAccessor()
        offset = self._get_offset_for_index(index)
        return self.get_element_accessor(offset)

    def get_by_id(self, id: int) -> MemoryAccessor:
        if id < self.start_id or id > self.get_max_id():
            return MemoryAccessor()
        return self.get_at(self.get_index_for_id(id))

    def get_id(self, index: int) -> int:
        return self.start_id + index

    def get_index_for_id(self, id: int) -> int:
        if self.count == 0 or id < self.start_id:
            return 0
        return id - self.start_id

    def get_min_id(self) -> int:
        return self.start_id

    def get_max_id(self) -> int:
        return self.start_id + self.count - 1

    @staticmethod
    def align(x: int) -> int:
        return (x + 3) & ~3

    def push(self, num_bytes: int) -> (MemoryAccessor, int):
        """
        Allocates space in the ring buffer at the end, shifting out the oldest data if needed.
        Returns a tuple of the memory accessor and the monotonically-increasing ID of element.
        """
        num_bytes = self.align(num_bytes)
        size_needed = self.ELEMENT_HEADER_SIZE + num_bytes

        if size_needed >= self.pool_size:
            return MemoryAccessor(), -1

        offset = self._find_free_offset(size_needed)
        while offset < 0:
            self.shift()
            offset = self._find_free_offset(size_needed)

        self.count += 1
        id_out = self.start_id + self.count - 1

        # Assuming bounds check is done elsewhere
        self._set_element_size(offset, num_bytes)
        self.last_elem_offset = offset

        return self.get_element_accessor(offset), id_out

    def shift(self) -> MemoryAccessor:
        """
        Removes the oldest element from the ring buffer.
        Returns a MemoryAccessor pointing to the removed data, which can be useful for checking if the ring buffer is empty.
        """
        if self.count == 0:
            return MemoryAccessor()

        ret = self.get_at(0)

        num_bytes = self._get_element_size(self.start_offset)
        self.start_offset += self.ELEMENT_HEADER_SIZE + num_bytes
        if self.start_offset >= self.prewrap_offset:
            # shifting start past the wrap-point, so reset the offset and PrewrapOffset
            self.start_offset = 0
            self.prewrap_offset = self.pool_size

        self.start_id += 1
        self.count -= 1

        if self.count == 0:
            self.start_offset = 0
            self.last_elem_offset = 0
            self.prewrap_offset = self.pool_size

        return ret

    def _set_element_size(self, offset: int, num_bytes: int):
        xrpa_debug_assert(num_bytes > 0, "Element size must be greater than 0")
        self._pool_accessor.write_int(num_bytes, MemoryOffset(offset))

    def _get_element_size(self, offset: int) -> int:
        return self._pool_accessor.read_int(MemoryOffset(offset))

    def get_element_accessor(self, offset: int) -> MemoryAccessor:
        return self._pool_accessor.slice(
            offset + self.ELEMENT_HEADER_SIZE, self._get_element_size(offset)
        )

    def _get_offset_for_index(self, index: int) -> int:
        offset = self.start_offset
        for _i in range(index):
            offset += self.ELEMENT_HEADER_SIZE + self._get_element_size(offset)
            if offset >= self.prewrap_offset:
                offset = 0
        return offset

    def get_next_offset(self, offset: int) -> int:
        offset += self.ELEMENT_HEADER_SIZE + self._get_element_size(offset)
        if offset >= self.prewrap_offset:
            offset = 0
        return offset

    def _find_free_offset(self, size_needed: int) -> int:
        """
        Returns the offset of the first free space in the ring buffer that can fit the given size.
        Returns -1 if no space is available.
        The size_needed parameter must include the size of the element header.
        """

        start_offset = self.start_offset
        pool_size = self.pool_size

        if self.count == 0:
            xrpa_debug_assert(
                start_offset == 0, "Start offset must be 0 when count is 0"
            )
            return start_offset

        last_elem_offset = self.last_elem_offset
        offset = (
            last_elem_offset
            + self.ELEMENT_HEADER_SIZE
            + self._get_element_size(last_elem_offset)
        )

        if start_offset < offset:
            # Check if there's space between the last element and the end of the buffer
            if pool_size - offset >= size_needed:
                return offset

            # need to wrap around
            xrpa_debug_assert(offset <= pool_size, "Offset must not exceed pool size")
            self.prewrap_offset = offset
            offset = 0

        # The buffer has wrapped around, check if there's space between the last element and the first element
        if start_offset - offset >= size_needed:
            return offset

        return -1


class PlacedRingBufferIterator:
    def __init__(self):
        self._last_read_id: int = -1
        self._last_read_offset: int = 0

    def has_missed_entries(self, ring_buffer: PlacedRingBuffer) -> bool:
        return self._last_read_id < ring_buffer.start_id - 1

    def has_next(self, ring_buffer: PlacedRingBuffer) -> bool:
        return self._last_read_id < ring_buffer.get_max_id()

    def has_next_given_max_id(self, max_id: int) -> bool:
        return self._last_read_id < max_id

    def next(self, ring_buffer: PlacedRingBuffer) -> MemoryAccessor:
        if not self.has_next(ring_buffer):
            return MemoryAccessor()

        start_id = ring_buffer.start_id
        if self._last_read_id < start_id:
            self._last_read_id = start_id
            self._last_read_offset = ring_buffer.start_offset
        else:
            self._last_read_id += 1
            self._last_read_offset = ring_buffer.get_next_offset(self._last_read_offset)

        return ring_buffer.get_element_accessor(self._last_read_offset)

    def set_to_end(self, ring_buffer: PlacedRingBuffer):
        self._last_read_id = ring_buffer.get_max_id()
        self._last_read_offset = ring_buffer.last_elem_offset
