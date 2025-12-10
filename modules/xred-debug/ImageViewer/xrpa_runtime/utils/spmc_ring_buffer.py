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

"""
Lock-free Single Producer Multiple Consumer (SPMC) ring buffer.

Memory Layout:
Offset  | Size | Field
--------|------|------------------
0       | 4    | poolSize (total memory after header)
4       | 4    | blockSize (aligned size of each block, includes 4-byte header)
8       | 4    | blockCount (number of blocks)
12      | 4    | (padding/reserved)
16      | 4    | writeIndex (atomic uint32, monotonically increasing)
20      | 4    | minReadIndex (atomic uint32, minimum valid read index)
24      | ...  | Block pool starts here

Block Layout:
Offset  | Size | Field
--------|------|------------------
0       | 4    | dataSize (0 = skipped block, >0 = total data size in bytes)
4       | ...  | data (up to blockSize - 4 bytes per block)

Multi-block entries:
- First block header contains total data size across all blocks
- Subsequent blocks have NO header (data is contiguous across blocks)
- If entry would wrap, remaining blocks at end are marked as skipped (size=0)
  and entry starts at block 0
"""

import warnings
from typing import Callable, Optional

from xrpa_runtime.utils.memory_accessor import MemoryAccessor, MemoryOffset
from xrpa_runtime.utils.xrpa_utils import xrpa_debug_bounds_assert

# Try to import C extension for true atomic operations
try:
    import xrpa_atomics

    _HAS_ATOMICS = True
except ImportError:
    _HAS_ATOMICS = False
    warnings.warn(
        "xrpa_atomics C extension not available. "
        "SPMC ring buffer will use non-atomic operations which may not be safe "
        "for cross-process/cross-thread shared memory.",
        RuntimeWarning,
        stacklevel=2,
    )


def _align(x: int) -> int:
    """Align x to 4-byte boundary."""
    return (x + 3) & ~3


def _atomic_load_acquire(data_source: memoryview, offset: int) -> int:
    """Atomically load a uint32 with acquire semantics."""
    if _HAS_ATOMICS:
        return xrpa_atomics.atomic_load_acquire(data_source, offset)
    else:
        # Fallback: non-atomic read (not safe for shared memory)
        import struct

        return struct.unpack("<I", data_source[offset : offset + 4])[0]


def _atomic_store_release(data_source: memoryview, offset: int, value: int) -> None:
    """Atomically store a uint32 with release semantics."""
    if _HAS_ATOMICS:
        xrpa_atomics.atomic_store_release(data_source, offset, value)
    else:
        # Fallback: non-atomic write (not safe for shared memory)
        import struct

        data_source[offset : offset + 4] = struct.pack("<I", value)


class SpmcRingBuffer:
    """Lock-free Single Producer Multiple Consumer (SPMC) ring buffer."""

    BLOCK_HEADER_SIZE = 4
    HEADER_SIZE = 24

    # Header field offsets
    _POOL_SIZE_OFFSET = 0
    _BLOCK_SIZE_OFFSET = 4
    _BLOCK_COUNT_OFFSET = 8
    _RESERVED_OFFSET = 12
    _WRITE_INDEX_OFFSET = 16
    _MIN_READ_INDEX_OFFSET = 20

    def __init__(self, mem_source: MemoryAccessor, mem_offset: int):
        """
        Constructor takes MemoryAccessor + offset (matches C++ and C# pattern).

        Args:
            mem_source: MemoryAccessor providing access to the underlying memory
            mem_offset: Byte offset within mem_source where the ring buffer starts
        """
        self._mem_source = mem_source.slice(mem_offset)
        self._header_accessor = mem_source.slice(mem_offset, self.HEADER_SIZE)
        self._pool_accessor: Optional[MemoryAccessor] = None

        # Cached header values
        self._block_size = 0
        self._block_count = 0

        if not self._header_accessor.is_null():
            pos = MemoryOffset(0)
            pool_size = self._header_accessor.read_int(pos)
            self._block_size = self._header_accessor.read_int(pos)
            self._block_count = self._header_accessor.read_int(pos)

            if pool_size > 0 and self._block_size > 0 and self._block_count > 0:
                self._pool_accessor = mem_source.slice(
                    mem_offset + self.HEADER_SIZE, pool_size
                )

    @staticmethod
    def get_mem_size(block_size: int, block_count: int) -> int:
        """Calculate total memory size needed for a ring buffer."""
        block_size = _align(block_size)
        return SpmcRingBuffer.HEADER_SIZE + (block_size * block_count)

    def init(self, block_size: int, block_count: int) -> None:
        """Initialize the ring buffer with given block size and count."""
        block_size = _align(block_size)
        self._block_size = block_size
        self._block_count = block_count

        pool_size = block_size * block_count

        pos = MemoryOffset(0)
        self._header_accessor.write_int(pool_size, pos)  # poolSize
        self._header_accessor.write_int(block_size, pos)  # blockSize
        self._header_accessor.write_int(block_count, pos)  # blockCount
        self._header_accessor.write_int(0, pos)  # reserved
        self._header_accessor.write_uint(0, pos)  # writeIndex
        self._header_accessor.write_uint(0, pos)  # minReadIndex

        self._pool_accessor = self._mem_source.slice(self.HEADER_SIZE, pool_size)

    def is_null(self) -> bool:
        """Check if the ring buffer is properly initialized."""
        return (
            self._header_accessor is None
            or self._header_accessor.is_null()
            or self._pool_accessor is None
            or self._pool_accessor.is_null()
        )

    @property
    def block_size(self) -> int:
        """Get the aligned block size."""
        return self._block_size

    @property
    def block_count(self) -> int:
        """Get the number of blocks."""
        return self._block_count

    @property
    def max_data_size(self) -> int:
        """Maximum data that can fit in a single entry (all blocks - one header)."""
        return (self._block_size * self._block_count) - self.BLOCK_HEADER_SIZE

    def write(self, data_size: int, callback: Callable[[MemoryAccessor], None]) -> bool:
        """
        Producer: write data to the ring buffer.

        Args:
            data_size: Size of data to write in bytes
            callback: Function called with MemoryAccessor for writing the data

        Returns:
            True if write succeeded, False otherwise
        """
        if self.is_null() or data_size <= 0:
            return False

        blocks_needed = self._get_blocks_needed(data_size)
        if blocks_needed > self._block_count:
            return False

        write_index = self._load_write_index()
        start_block_index = write_index % self._block_count

        # Check if entry would wrap
        end_block_index = start_block_index + blocks_needed
        skipped_blocks = 0

        if end_block_index > self._block_count:
            # Need to wrap - mark remaining blocks as skipped
            skipped_blocks = self._block_count - start_block_index
            start_block_index = 0
            new_write_index = write_index + skipped_blocks + blocks_needed
        else:
            new_write_index = write_index + blocks_needed

        # Update minReadIndex to make room (evict old blocks)
        min_read_index = self._load_min_read_index()
        required_min_read_index = (
            new_write_index - self._block_count
            if new_write_index > self._block_count
            else 0
        )

        if min_read_index < required_min_read_index:
            # Need to advance minReadIndex to a valid start block
            # Walk through entries starting from current minReadIndex until we pass required
            new_min_read_index = self._skip_to_valid_entry(
                min_read_index, required_min_read_index
            )
            self._store_min_read_index(new_min_read_index)

        # Mark skipped blocks (if wrapping)
        if skipped_blocks > 0:
            for i in range(skipped_blocks):
                block_offset = self._get_block_offset(
                    (write_index + i) % self._block_count
                )
                self._set_block_data_size(block_offset, 0)

        # Write data size to the header of the first block
        first_block_offset = self._get_block_offset(start_block_index)
        self._set_block_data_size(first_block_offset, data_size)

        # Create MemoryAccessor for the data region
        # Data starts after the first block's header and spans blocks_needed blocks
        data_offset = first_block_offset + self.BLOCK_HEADER_SIZE
        max_data_space = (blocks_needed * self._block_size) - self.BLOCK_HEADER_SIZE
        data_accessor = self._pool_accessor.slice(data_offset, max_data_space)

        callback(data_accessor)

        # Update writeIndex after data is written
        self._store_write_index(new_write_index)

        return True

    def _get_block_offset(self, block_index: int) -> int:
        """Get byte offset of a block within the pool."""
        return block_index * self._block_size

    def _get_blocks_needed(self, data_size: int) -> int:
        """Calculate number of blocks needed for given data size."""
        # First block holds data_size bytes - BLOCK_HEADER_SIZE
        # Subsequent blocks hold block_size bytes each
        first_block_data = self._block_size - self.BLOCK_HEADER_SIZE
        if data_size <= first_block_data:
            return 1
        remaining = data_size - first_block_data
        # Use (remaining - 1) // block_size + 1 to avoid overflow from remaining + block_size - 1
        return 1 + ((remaining - 1) // self._block_size) + 1

    def _load_write_index(self) -> int:
        """Atomically load the write index with acquire semantics."""
        return _atomic_load_acquire(
            self._header_accessor.data_source,
            self._header_accessor.mem_offset + self._WRITE_INDEX_OFFSET,
        )

    def _load_min_read_index(self) -> int:
        """Atomically load the min read index with acquire semantics."""
        return _atomic_load_acquire(
            self._header_accessor.data_source,
            self._header_accessor.mem_offset + self._MIN_READ_INDEX_OFFSET,
        )

    def _store_write_index(self, value: int) -> None:
        """Atomically store the write index with release semantics."""
        _atomic_store_release(
            self._header_accessor.data_source,
            self._header_accessor.mem_offset + self._WRITE_INDEX_OFFSET,
            value,
        )

    def _store_min_read_index(self, value: int) -> None:
        """Atomically store the min read index with release semantics."""
        _atomic_store_release(
            self._header_accessor.data_source,
            self._header_accessor.mem_offset + self._MIN_READ_INDEX_OFFSET,
            value,
        )

    def _set_block_data_size(self, block_offset: int, data_size: int) -> None:
        """Set the data size in a block header."""
        xrpa_debug_bounds_assert(
            block_offset, self.BLOCK_HEADER_SIZE, self._pool_accessor.size
        )
        self._pool_accessor.write_uint(data_size, MemoryOffset(block_offset))

    def _get_block_data_size(self, block_offset: int) -> int:
        """Get the data size from a block header."""
        xrpa_debug_bounds_assert(
            block_offset, self.BLOCK_HEADER_SIZE, self._pool_accessor.size
        )
        return self._pool_accessor.read_uint(MemoryOffset(block_offset))

    def _skip_to_valid_block(self, start_index: int) -> int:
        """Skip to a valid start block (one with dataSize > 0)."""
        write_index = self._load_write_index()
        while start_index < write_index:
            block_index = start_index % self._block_count
            block_offset = self._get_block_offset(block_index)
            data_size = self._get_block_data_size(block_offset)
            if data_size > 0:
                return start_index
            start_index += 1
        return start_index

    def _skip_to_valid_entry(self, current_index: int, target_index: int) -> int:
        """
        Walk through entries starting from current_index until we find one at or past target_index.
        This properly handles multi-block entries by advancing by blocks_needed instead of 1.
        """
        write_index = self._load_write_index()

        while current_index < write_index and current_index < target_index:
            block_index = current_index % self._block_count
            block_offset = self._get_block_offset(block_index)
            data_size = self._get_block_data_size(block_offset)

            if data_size == 0:
                # Skipped block (from wrapping), advance by 1
                current_index += 1
            else:
                # Valid entry - skip past all its blocks
                blocks_needed = self._get_blocks_needed(data_size)
                current_index += blocks_needed

        # Now current_index >= target_index (or at write_index if no more entries)
        # Make sure we're at a valid entry start, not in the middle of skipped blocks
        return self._skip_to_valid_block(current_index)

    # Internal accessors for iterator
    @property
    def _pool(self) -> MemoryAccessor:
        return self._pool_accessor


class SpmcRingBufferIterator:
    """
    Iterator for reading from an SPMC ring buffer.
    Each consumer should maintain its own iterator.
    """

    def __init__(self):
        self._local_read_index: int = 0

    def has_missed_entries(self, ring_buffer: SpmcRingBuffer) -> bool:
        """Check if entries were missed (overwritten before reading)."""
        min_read_index = ring_buffer._load_min_read_index()
        return self._local_read_index < min_read_index

    def has_next(self, ring_buffer: SpmcRingBuffer) -> bool:
        """Check if there are unread entries."""
        write_index = ring_buffer._load_write_index()
        return self._local_read_index < write_index

    def read_next(
        self, ring_buffer: SpmcRingBuffer, callback: Callable[[MemoryAccessor], None]
    ) -> bool:
        """
        Read next entry; callback receives MemoryAccessor.

        Args:
            ring_buffer: The ring buffer to read from
            callback: Function called with MemoryAccessor containing the data

        Returns:
            False if data was overwritten during read (stale read), True otherwise
        """
        if not self.has_next(ring_buffer):
            return False

        # Skip to valid block if we fell behind
        if self.has_missed_entries(ring_buffer):
            self._local_read_index = ring_buffer._load_min_read_index()

        # Skip any skipped blocks (size=0)
        write_index = ring_buffer._load_write_index()
        while self._local_read_index < write_index:
            block_index = self._local_read_index % ring_buffer.block_count
            block_offset = block_index * ring_buffer.block_size
            data_size = ring_buffer._get_block_data_size(block_offset)

            if data_size == 0:
                # Skipped block, advance
                self._local_read_index += 1
                continue

            # Found a valid entry
            blocks_needed = ring_buffer._get_blocks_needed(data_size)

            # Create MemoryAccessor for the data
            data_offset = block_offset + SpmcRingBuffer.BLOCK_HEADER_SIZE
            max_data_space = (
                blocks_needed * ring_buffer.block_size
            ) - SpmcRingBuffer.BLOCK_HEADER_SIZE
            data_accessor = ring_buffer._pool.slice(data_offset, max_data_space)

            callback(data_accessor)

            # Validate that data is still valid after read
            new_min_read_index = ring_buffer._load_min_read_index()
            if self._local_read_index < new_min_read_index:
                # Data was overwritten during read - stale read
                self._local_read_index = new_min_read_index
                return False

            # Advance past this entry
            self._local_read_index += blocks_needed
            return True

        return False

    def set_to_end(self, ring_buffer: SpmcRingBuffer) -> None:
        """Skip to current write position."""
        self._local_read_index = ring_buffer._load_write_index()
