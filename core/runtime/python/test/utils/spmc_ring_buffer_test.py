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

"""Unit tests for SPMC ring buffer."""

import unittest

from xrpa_runtime.utils.memory_accessor import MemoryAccessor, MemoryOffset
from xrpa_runtime.utils.spmc_ring_buffer import SpmcRingBuffer, SpmcRingBufferIterator


def _align(x: int) -> int:
    """Align x to 4-byte boundary."""
    return (x + 3) & ~3


class SpmcRingBufferTest(unittest.TestCase):
    BLOCK_SIZE = 32  # 28 bytes of data per block
    BLOCK_COUNT = 10
    # HEADER_SIZE (24) + (Align(32) * 10) = 24 + 320 = 344
    BUFFER_SIZE = SpmcRingBuffer.HEADER_SIZE + (_align(BLOCK_SIZE) * BLOCK_COUNT)

    def setUp(self):
        self._bytes = bytearray(self.BUFFER_SIZE)
        self._mem = MemoryAccessor(memoryview(self._bytes), 0, self.BUFFER_SIZE)

    def tearDown(self):
        self._mem = None
        self._bytes = None

    def _create_and_init_ring_buffer(self) -> SpmcRingBuffer:
        """Helper to create and initialize a ring buffer."""
        # Zero out the buffer
        for i in range(len(self._bytes)):
            self._bytes[i] = 0
        ring_buffer = SpmcRingBuffer(self._mem, 0)
        ring_buffer.init(self.BLOCK_SIZE, self.BLOCK_COUNT)
        return ring_buffer

    def test_initialization(self):
        ring_buffer = self._create_and_init_ring_buffer()

        self.assertFalse(ring_buffer.is_null())
        self.assertEqual(_align(self.BLOCK_SIZE), ring_buffer.block_size)
        self.assertEqual(self.BLOCK_COUNT, ring_buffer.block_count)
        self.assertGreater(ring_buffer.max_data_size, 0)

    def test_get_mem_size(self):
        expected_size = SpmcRingBuffer.HEADER_SIZE + (
            _align(self.BLOCK_SIZE) * self.BLOCK_COUNT
        )
        self.assertEqual(
            expected_size,
            SpmcRingBuffer.get_mem_size(self.BLOCK_SIZE, self.BLOCK_COUNT),
        )

        # Verify alignment is applied
        self.assertEqual(
            SpmcRingBuffer.HEADER_SIZE + (20 * 5),  # 17 should align to 20
            SpmcRingBuffer.get_mem_size(17, 5),
        )

    def test_single_write_read(self):
        ring_buffer = self._create_and_init_ring_buffer()
        iterator = SpmcRingBufferIterator()

        self.assertFalse(iterator.has_next(ring_buffer))
        self.assertFalse(iterator.has_missed_entries(ring_buffer))

        # Write a single value
        test_value = 12345
        write_result = ring_buffer.write(
            4,
            lambda accessor: accessor.write_int(test_value, MemoryOffset(0)),
        )
        self.assertTrue(write_result)

        # Verify iterator sees the entry
        self.assertTrue(iterator.has_next(ring_buffer))
        self.assertFalse(iterator.has_missed_entries(ring_buffer))

        # Read the value
        read_value = [0]

        def read_callback(accessor):
            read_value[0] = accessor.read_int(MemoryOffset(0))

        read_result = iterator.read_next(ring_buffer, read_callback)
        self.assertTrue(read_result)
        self.assertEqual(test_value, read_value[0])

        # No more entries
        self.assertFalse(iterator.has_next(ring_buffer))

    def test_multiple_write_read(self):
        ring_buffer = self._create_and_init_ring_buffer()
        iterator = SpmcRingBufferIterator()

        # Write multiple values
        for i in range(5):
            value = i * 100
            write_result = ring_buffer.write(
                4,
                lambda accessor, v=value: accessor.write_int(v, MemoryOffset(0)),
            )
            self.assertTrue(write_result)

        # Read all values
        for i in range(5):
            self.assertTrue(iterator.has_next(ring_buffer))

            read_value = [0]

            def read_callback(accessor, rv=read_value):
                rv[0] = accessor.read_int(MemoryOffset(0))

            read_result = iterator.read_next(ring_buffer, read_callback)
            self.assertTrue(read_result)
            self.assertEqual(i * 100, read_value[0])

        self.assertFalse(iterator.has_next(ring_buffer))

    def test_multi_block_entry(self):
        ring_buffer = self._create_and_init_ring_buffer()
        iterator = SpmcRingBufferIterator()

        # Write data that spans multiple blocks
        # Each block has BLOCK_SIZE - BLOCK_HEADER_SIZE = 28 bytes of data capacity
        # For multi-block: first block has 28 bytes, subsequent blocks have BLOCK_SIZE each
        large_data_size = 64  # Should require 2-3 blocks
        write_data = bytes([i & 0xFF for i in range(large_data_size)])

        def write_callback(accessor):
            for i, byte in enumerate(write_data):
                accessor.write_byte(byte, MemoryOffset(i))

        write_result = ring_buffer.write(large_data_size, write_callback)
        self.assertTrue(write_result)

        # Read the data back
        read_data = [0] * large_data_size

        def read_callback(accessor):
            for i in range(large_data_size):
                read_data[i] = accessor.read_byte(MemoryOffset(i))

        read_result = iterator.read_next(ring_buffer, read_callback)
        self.assertTrue(read_result)

        # Verify data matches
        for i in range(large_data_size):
            self.assertEqual(write_data[i], read_data[i], f"Mismatch at index {i}")

    def test_wraparound(self):
        ring_buffer = self._create_and_init_ring_buffer()
        iterator = SpmcRingBufferIterator()

        # Fill the buffer to near capacity, then write one more to force wrap
        data_size = 20  # Fits in one block

        # Write entries until we've wrapped
        for i in range(self.BLOCK_COUNT + 2):
            value = i
            write_result = ring_buffer.write(
                data_size,
                lambda accessor, v=value: accessor.write_int(v, MemoryOffset(0)),
            )
            self.assertTrue(write_result)

        # Iterator should detect missed entries (old data was evicted)
        self.assertTrue(iterator.has_next(ring_buffer))
        self.assertTrue(iterator.has_missed_entries(ring_buffer))

        # Read remaining entries
        read_count = 0
        while iterator.has_next(ring_buffer):
            read_value = [0]
            iterator.read_next(
                ring_buffer,
                lambda accessor, rv=read_value: rv.__setitem__(
                    0, accessor.read_int(MemoryOffset(0))
                ),
            )
            read_count += 1

        # Should have read some entries (not all original ones due to eviction)
        self.assertGreater(read_count, 0)
        self.assertLess(read_count, self.BLOCK_COUNT + 2)

    def test_eviction(self):
        ring_buffer = self._create_and_init_ring_buffer()
        iterator = SpmcRingBufferIterator()

        # Write enough entries to cause eviction
        for i in range(self.BLOCK_COUNT * 2):
            value = i
            write_result = ring_buffer.write(
                4,
                lambda accessor, v=value: accessor.write_int(v, MemoryOffset(0)),
            )
            self.assertTrue(write_result)

        # Iterator should have missed entries
        self.assertTrue(iterator.has_missed_entries(ring_buffer))

        # Read what's available - should be the more recent entries
        read_values = []
        while iterator.has_next(ring_buffer):
            read_value = [0]

            def read_callback(accessor, rv=read_value):
                rv[0] = accessor.read_int(MemoryOffset(0))

            iterator.read_next(ring_buffer, read_callback)
            read_values.append(read_value[0])

        # Verify we got the most recent entries
        self.assertTrue(len(read_values) > 0)
        # The last value should be the last written value
        self.assertEqual(self.BLOCK_COUNT * 2 - 1, read_values[-1])

    def test_missed_entries_detection(self):
        ring_buffer = self._create_and_init_ring_buffer()
        iterator = SpmcRingBufferIterator()

        # Write one entry and read it
        ring_buffer.write(4, lambda accessor: accessor.write_int(1, MemoryOffset(0)))

        iterator.read_next(ring_buffer, lambda accessor: None)
        self.assertFalse(iterator.has_missed_entries(ring_buffer))

        # Now write enough to cause eviction of the iterator's position
        for i in range(self.BLOCK_COUNT + 5):
            value = i + 100
            ring_buffer.write(
                4,
                lambda accessor, v=value: accessor.write_int(v, MemoryOffset(0)),
            )

        # Iterator should now detect missed entries
        self.assertTrue(iterator.has_missed_entries(ring_buffer))

    def test_multiple_consumers(self):
        ring_buffer = self._create_and_init_ring_buffer()
        iter1 = SpmcRingBufferIterator()
        iter2 = SpmcRingBufferIterator()

        # Write some entries
        for i in range(5):
            value = i
            ring_buffer.write(
                4,
                lambda accessor, v=value: accessor.write_int(v, MemoryOffset(0)),
            )

        # Both iterators should see all entries
        self.assertTrue(iter1.has_next(ring_buffer))
        self.assertTrue(iter2.has_next(ring_buffer))

        # Read with iter1
        values1 = []
        while iter1.has_next(ring_buffer):
            read_value = [0]

            def read_callback(accessor, rv=read_value):
                rv[0] = accessor.read_int(MemoryOffset(0))

            iter1.read_next(ring_buffer, read_callback)
            values1.append(read_value[0])

        # iter2 should still see all entries
        self.assertTrue(iter2.has_next(ring_buffer))

        # Read with iter2
        values2 = []
        while iter2.has_next(ring_buffer):
            read_value = [0]

            def read_callback(accessor, rv=read_value):
                rv[0] = accessor.read_int(MemoryOffset(0))

            iter2.read_next(ring_buffer, read_callback)
            values2.append(read_value[0])

        # Both should have read the same values
        self.assertEqual(len(values1), len(values2))
        for i in range(len(values1)):
            self.assertEqual(values1[i], values2[i])

    def test_set_to_end(self):
        ring_buffer = self._create_and_init_ring_buffer()
        iterator = SpmcRingBufferIterator()

        # Write some entries
        for i in range(5):
            value = i
            ring_buffer.write(
                4,
                lambda accessor, v=value: accessor.write_int(v, MemoryOffset(0)),
            )

        self.assertTrue(iterator.has_next(ring_buffer))

        # Skip to end
        iterator.set_to_end(ring_buffer)

        # Should have nothing to read now
        self.assertFalse(iterator.has_next(ring_buffer))
        self.assertFalse(iterator.has_missed_entries(ring_buffer))

        # Write more entries
        ring_buffer.write(4, lambda accessor: accessor.write_int(100, MemoryOffset(0)))

        # Now there should be something to read
        self.assertTrue(iterator.has_next(ring_buffer))

        read_value = [0]
        iterator.read_next(
            ring_buffer,
            lambda accessor: read_value.__setitem__(
                0, accessor.read_int(MemoryOffset(0))
            ),
        )
        self.assertEqual(100, read_value[0])

    def test_write_too_large(self):
        ring_buffer = self._create_and_init_ring_buffer()

        # Try to write data larger than max capacity
        max_size = ring_buffer.max_data_size
        callback_called = [False]

        def callback(accessor):
            callback_called[0] = True

        write_result = ring_buffer.write(max_size + 100, callback)

        self.assertFalse(write_result)
        self.assertFalse(callback_called[0])

    def test_write_zero_size(self):
        ring_buffer = self._create_and_init_ring_buffer()

        callback_called = [False]

        def callback(accessor):
            callback_called[0] = True

        write_result = ring_buffer.write(0, callback)

        self.assertFalse(write_result)
        self.assertFalse(callback_called[0])

    def test_write_negative_size(self):
        ring_buffer = self._create_and_init_ring_buffer()

        callback_called = [False]

        def callback(accessor):
            callback_called[0] = True

        write_result = ring_buffer.write(-1, callback)

        self.assertFalse(write_result)
        self.assertFalse(callback_called[0])

    def test_wraparound_with_multi_block(self):
        ring_buffer = self._create_and_init_ring_buffer()
        iterator = SpmcRingBufferIterator()

        # Fill most of the buffer with single-block entries
        for i in range(self.BLOCK_COUNT - 2):
            value = i
            ring_buffer.write(
                4,
                lambda accessor, v=value: accessor.write_int(v, MemoryOffset(0)),
            )

        # Now write a multi-block entry that needs to wrap
        multi_block_data_size = 50
        write_data = bytes([0xAB] * multi_block_data_size)

        def write_callback(accessor):
            for i, byte in enumerate(write_data):
                accessor.write_byte(byte, MemoryOffset(i))

        write_result = ring_buffer.write(multi_block_data_size, write_callback)
        self.assertTrue(write_result)

        # Skip to the last entry (the multi-block one)
        while iterator.has_next(ring_buffer):
            first_byte = [0]

            def read_callback(accessor, fb=first_byte):
                fb[0] = accessor.read_byte(MemoryOffset(0))

            iterator.read_next(ring_buffer, read_callback)

            # If this was the multi-block entry, verify first byte
            if first_byte[0] == 0xAB:
                # We found our multi-block entry
                break


if __name__ == "__main__":
    unittest.main()
