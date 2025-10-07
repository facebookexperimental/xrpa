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


import unittest

from xrpa_runtime.utils.memory_accessor import MemoryAccessor, MemoryOffset
from xrpa_runtime.utils.placed_ring_buffer import (
    PlacedRingBuffer,
    PlacedRingBufferIterator,
)


def assert_ring_buffer_equals(ring_buffer: "PlacedRingBuffer", start: int, end: int):
    mul = -1 if end < start else 1
    assert ring_buffer.count == 1 + mul * (end - start)

    for i in range(ring_buffer.count):
        assert ring_buffer.get_at(i).read_int(MemoryOffset(0)) == start + i * mul


class PlacedRingBufferTest(unittest.TestCase):
    INT_COUNT = 100
    BUFFER_SIZE = 100 * (PlacedRingBuffer.ELEMENT_HEADER_SIZE + 4)

    def setUp(self):
        mem_size = PlacedRingBuffer.get_mem_size(self.BUFFER_SIZE)
        self._bytes = bytearray(mem_size)
        self._mem = MemoryAccessor(self._bytes, 0, mem_size)
        assert not self._mem.is_null()

        self._test_ring_buffer = PlacedRingBuffer(self._mem, 0)
        self._test_ring_buffer.init(self.BUFFER_SIZE)

        self._test_ring_buffer2 = PlacedRingBuffer(self._mem, 0)

        assert self._test_ring_buffer.pool_size == self.BUFFER_SIZE
        assert self._test_ring_buffer.count == 0
        assert self._test_ring_buffer.start_id == 0
        assert self._test_ring_buffer.start_offset == 0
        assert self._test_ring_buffer.prewrap_offset == self.BUFFER_SIZE

        assert self._test_ring_buffer2.pool_size == self.BUFFER_SIZE
        assert self._test_ring_buffer2.count == 0
        assert self._test_ring_buffer2.start_id == 0
        assert self._test_ring_buffer2.start_offset == 0
        assert self._test_ring_buffer2.prewrap_offset == self.BUFFER_SIZE

    def tearDown(self):
        self._mem = None
        self._bytes = None
        self._test_ring_buffer = None
        self._test_ring_buffer2 = None

    def test_BasicOperations(self):
        # fill the buffer
        for i in range(self.INT_COUNT):
            (mem, id) = self._test_ring_buffer.push(4)

            assert not mem.is_null()
            assert id == i
            assert self._test_ring_buffer.count == i + 1

            mem.write_int(i, MemoryOffset(0))

            assert not self._test_ring_buffer.get_at(i).is_null()
            assert i == self._test_ring_buffer.get_at(i).read_int(MemoryOffset(0))
            assert i == self._test_ring_buffer2.get_at(i).read_int(MemoryOffset(0))

        assert self._test_ring_buffer.count == self.INT_COUNT
        assert self._test_ring_buffer2.count == self.INT_COUNT
        assert_ring_buffer_equals(self._test_ring_buffer, 0, self.INT_COUNT - 1)
        assert_ring_buffer_equals(self._test_ring_buffer2, 0, self.INT_COUNT - 1)
        assert self._test_ring_buffer.get_index_for_id(0) == 0
        assert self._test_ring_buffer2.get_index_for_id(0) == 0
        assert self._test_ring_buffer.get_index_for_id(1) == 1
        assert self._test_ring_buffer2.get_index_for_id(1) == 1
        assert self._test_ring_buffer.get_index_for_id(2) == 2
        assert self._test_ring_buffer2.get_index_for_id(2) == 2
        assert self._test_ring_buffer.get_index_for_id(3) == 3
        assert self._test_ring_buffer2.get_index_for_id(3) == 3

        # additional push should wrap
        (mem, id) = self._test_ring_buffer.push(4)
        mem.write_int(self.INT_COUNT, MemoryOffset(0))
        assert self._test_ring_buffer.count == self.INT_COUNT
        assert self._test_ring_buffer2.count == self.INT_COUNT
        assert_ring_buffer_equals(self._test_ring_buffer, 1, self.INT_COUNT)
        assert_ring_buffer_equals(self._test_ring_buffer2, 1, self.INT_COUNT)

        # shift oldest one out
        assert self._test_ring_buffer.shift().read_int(MemoryOffset(0)) == 1
        assert self._test_ring_buffer.count == self.INT_COUNT - 1
        assert self._test_ring_buffer2.count == self.INT_COUNT - 1
        assert_ring_buffer_equals(self._test_ring_buffer, 2, self.INT_COUNT)
        assert_ring_buffer_equals(self._test_ring_buffer2, 2, self.INT_COUNT)

        # verify that the index returned for IDs that have been removed/overwritten is 0,
        # and that the index for IDs in the buffer is correct
        assert self._test_ring_buffer.get_index_for_id(0) == 0
        assert self._test_ring_buffer2.get_index_for_id(0) == 0
        assert self._test_ring_buffer.get_index_for_id(1) == 0
        assert self._test_ring_buffer2.get_index_for_id(1) == 0
        assert self._test_ring_buffer.get_index_for_id(2) == 0
        assert self._test_ring_buffer2.get_index_for_id(2) == 0
        assert self._test_ring_buffer.get_index_for_id(3) == 1
        assert self._test_ring_buffer2.get_index_for_id(3) == 1

        assert (
            self._test_ring_buffer.get_at(
                self._test_ring_buffer.get_index_for_id(3)
            ).read_int(MemoryOffset(0))
            == 3
        )
        assert (
            self._test_ring_buffer2.get_at(
                self._test_ring_buffer2.get_index_for_id(3)
            ).read_int(MemoryOffset(0))
            == 3
        )

        # additional push should not wrap now that there is room
        (mem, id) = self._test_ring_buffer.push(4)
        mem.write_int(self.INT_COUNT + 1, MemoryOffset(0))

        assert self._test_ring_buffer.count == self.INT_COUNT
        assert self._test_ring_buffer2.count == self.INT_COUNT
        assert_ring_buffer_equals(self._test_ring_buffer, 2, self.INT_COUNT + 1)
        assert_ring_buffer_equals(self._test_ring_buffer2, 2, self.INT_COUNT + 1)

        # now shift everything out
        for i in range(self.INT_COUNT):
            assert self._test_ring_buffer.count == self.INT_COUNT - i
            assert self._test_ring_buffer2.count == self.INT_COUNT - i
            assert_ring_buffer_equals(self._test_ring_buffer, 2 + i, self.INT_COUNT + 1)
            assert_ring_buffer_equals(
                self._test_ring_buffer2, 2 + i, self.INT_COUNT + 1
            )

            assert self._test_ring_buffer.shift().read_int(MemoryOffset(0)) == 2 + i

        assert self._test_ring_buffer.count == 0
        assert self._test_ring_buffer2.count == 0

        # additional shift should return null
        assert self._test_ring_buffer.shift().is_null()
        assert self._test_ring_buffer2.shift().is_null()
        assert self._test_ring_buffer.count == 0
        assert self._test_ring_buffer2.count == 0

    def test_MixedSizes(self):
        (mem, id) = self._test_ring_buffer.push(396)
        mem.write_int(0, MemoryOffset(0))
        assert self._test_ring_buffer.count == 1
        assert self._test_ring_buffer.start_id == 0
        assert self._test_ring_buffer.prewrap_offset == 800

        (mem, id) = self._test_ring_buffer.push(196)
        mem.write_int(0, MemoryOffset(0))
        assert self._test_ring_buffer.count == 2
        assert self._test_ring_buffer.start_id == 0
        assert self._test_ring_buffer.prewrap_offset == 800

        (mem, id) = self._test_ring_buffer.push(396)
        mem.write_int(0, MemoryOffset(0))
        assert self._test_ring_buffer.count == 2
        assert self._test_ring_buffer.start_id == 1
        assert self._test_ring_buffer.prewrap_offset == 600

    def test_Iterator(self):
        iter = PlacedRingBufferIterator()
        iter.set_to_end(self._test_ring_buffer)
        assert iter.has_missed_entries(self._test_ring_buffer) is False
        assert iter.has_next(self._test_ring_buffer) is False

        # push a value in
        (mem, id) = self._test_ring_buffer.push(396)
        mem.write_int(10, MemoryOffset(0))
        assert self._test_ring_buffer.count == 1
        assert self._test_ring_buffer.start_id == 0
        assert self._test_ring_buffer.prewrap_offset == 800
        assert iter.has_missed_entries(self._test_ring_buffer) is False
        assert iter.has_next(self._test_ring_buffer) is True

        # get the value using the iterator
        mem = iter.next(self._test_ring_buffer)
        assert mem.is_null() is False
        assert mem.read_int(MemoryOffset(0)) == 10
        assert iter.has_missed_entries(self._test_ring_buffer) is False
        assert iter.has_next(self._test_ring_buffer) is False

        # push another value in
        (mem, id) = self._test_ring_buffer.push(196)
        mem.write_int(20, MemoryOffset(0))
        assert self._test_ring_buffer.count == 2
        assert self._test_ring_buffer.start_id == 0
        assert self._test_ring_buffer.prewrap_offset == 800
        assert iter.has_missed_entries(self._test_ring_buffer) is False
        assert iter.has_next(self._test_ring_buffer) is True

        # get the value using the iterator
        mem = iter.next(self._test_ring_buffer)
        assert mem.is_null() is False
        assert mem.read_int(MemoryOffset(0)) == 20
        assert iter.has_missed_entries(self._test_ring_buffer) is False
        assert iter.has_next(self._test_ring_buffer) is False

        # overflow the iterator
        for _i in range(self.INT_COUNT):
            (mem, id) = self._test_ring_buffer.push(20)
            mem.write_int(0, MemoryOffset(0))

        assert iter.has_missed_entries(self._test_ring_buffer) is True
        assert iter.has_next(self._test_ring_buffer) is True
        iter.set_to_end(self._test_ring_buffer)
        assert iter.has_missed_entries(self._test_ring_buffer) is False
        assert iter.has_next(self._test_ring_buffer) is False

        # shift everything out of the ring buffer
        while self._test_ring_buffer.count > 0:
            self._test_ring_buffer.shift()
        assert iter.has_missed_entries(self._test_ring_buffer) is False
        assert iter.has_next(self._test_ring_buffer) is False

        # push a value into the ring buffer and remove it
        (mem, id) = self._test_ring_buffer.push(396)
        mem.write_int(60, MemoryOffset(0))
        self._test_ring_buffer.shift()
        assert iter.has_missed_entries(self._test_ring_buffer) is True
        assert iter.has_next(self._test_ring_buffer) is True

        # reset the iterator so it is valid again
        iter.set_to_end(self._test_ring_buffer)
        assert iter.has_missed_entries(self._test_ring_buffer) is False
        assert iter.has_next(self._test_ring_buffer) is False

        # insert another item into the ring buffer
        (mem, id) = self._test_ring_buffer.push(396)
        mem.write_int(30, MemoryOffset(0))
        assert self._test_ring_buffer.count == 1
        assert self._test_ring_buffer.start_id == 103
        assert self._test_ring_buffer.prewrap_offset == 800
        assert iter.has_missed_entries(self._test_ring_buffer) is False
        assert iter.has_next(self._test_ring_buffer) is True

        # get the value using the iterator
        mem = iter.next(self._test_ring_buffer)
        assert mem.is_null() is False
        assert mem.read_int(MemoryOffset(0)) == 30
        assert iter.has_missed_entries(self._test_ring_buffer) is False
        assert iter.has_next(self._test_ring_buffer) is False
