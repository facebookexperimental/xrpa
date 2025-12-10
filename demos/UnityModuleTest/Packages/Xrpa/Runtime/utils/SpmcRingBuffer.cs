/*
// @generated
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

using System;

namespace Xrpa
{
    /// <summary>
    /// Lock-free Single Producer Multiple Consumer (SPMC) ring buffer.
    ///
    /// Memory Layout:
    /// Offset  | Size | Field
    /// --------|------|------------------
    /// 0       | 4    | poolSize (total memory after header)
    /// 4       | 4    | blockSize (aligned size of each block, includes 4-byte header)
    /// 8       | 4    | blockCount (number of blocks)
    /// 12      | 4    | (padding/reserved)
    /// 16      | 4    | writeIndex (atomic uint32, monotonically increasing)
    /// 20      | 4    | minReadIndex (atomic uint32, minimum valid read index)
    /// 24      | ...  | Block pool starts here
    ///
    /// Block Layout:
    /// Offset  | Size | Field
    /// --------|------|------------------
    /// 0       | 4    | dataSize (0 = skipped block, greater than 0 = total data size in bytes)
    /// 4       | ...  | data (up to blockSize - 4 bytes per block)
    ///
    /// Multi-block entries:
    /// - First block header contains total data size across all blocks
    /// - Subsequent blocks have NO header (data is contiguous across blocks)
    /// - If entry would wrap, remaining blocks at end are marked as skipped (size=0)
    ///   and entry starts at block 0
    /// </summary>
    unsafe public class SpmcRingBuffer
    {
        public static readonly int BLOCK_HEADER_SIZE = 4;
        public static readonly int HEADER_SIZE = 24;

        private MemoryAccessor _memSource;
        private MemoryAccessor _headerAccessor;
        private MemoryAccessor _poolAccessor;

        private int _blockSize = 0;
        private int _blockCount = 0;

        public SpmcRingBuffer() { }

        /// <summary>
        /// Constructor takes MemoryAccessor + offset (matches C++ and Python pattern)
        /// </summary>
        public SpmcRingBuffer(MemoryAccessor memSource, long memOffset)
        {
            _memSource = memSource.Slice(memOffset);
            _headerAccessor = memSource.Slice(memOffset, HEADER_SIZE);

            if (!_headerAccessor.IsNull())
            {
                MemoryOffset pos = new();
                int poolSize = _headerAccessor.ReadInt(pos);
                _blockSize = _headerAccessor.ReadInt(pos);
                _blockCount = _headerAccessor.ReadInt(pos);

                if (poolSize > 0 && _blockSize > 0 && _blockCount > 0)
                {
                    _poolAccessor = memSource.Slice(memOffset + HEADER_SIZE, poolSize);
                }
            }
        }

        /// <summary>
        /// Calculate total memory size needed for a ring buffer with given block size and count.
        /// </summary>
        public static int GetMemSize(int blockSize, int blockCount)
        {
            blockSize = Align(blockSize);
            return HEADER_SIZE + (blockSize * blockCount);
        }

        /// <summary>
        /// Initialize the ring buffer with given block size and count.
        /// </summary>
        public void Init(int blockSize, int blockCount)
        {
            blockSize = Align(blockSize);
            _blockSize = blockSize;
            _blockCount = blockCount;

            int poolSize = blockSize * blockCount;

            MemoryOffset pos = new();
            _headerAccessor.WriteInt(poolSize, pos);    // poolSize
            _headerAccessor.WriteInt(blockSize, pos);   // blockSize
            _headerAccessor.WriteInt(blockCount, pos);  // blockCount
            _headerAccessor.WriteInt(0, pos);           // reserved
            _headerAccessor.WriteUint(0, pos);          // writeIndex
            _headerAccessor.WriteUint(0, pos);          // minReadIndex

            _poolAccessor = _memSource.Slice(HEADER_SIZE, poolSize);
        }

        public bool IsNull()
        {
            return _headerAccessor == null || _headerAccessor.IsNull() ||
                   _poolAccessor == null || _poolAccessor.IsNull();
        }

        public int BlockSize => _blockSize;
        public int BlockCount => _blockCount;

        /// <summary>
        /// Maximum data that can fit in a single entry (all blocks - one header)
        /// </summary>
        public int MaxDataSize => (_blockSize * _blockCount) - BLOCK_HEADER_SIZE;

        /// <summary>
        /// Producer: write data to the ring buffer.
        /// Returns true if write succeeded.
        /// Calls callback with MemoryAccessor for writing the data.
        /// </summary>
        public bool Write(int dataSize, Action<MemoryAccessor> callback)
        {
            if (IsNull() || dataSize <= 0)
            {
                return false;
            }

            int blocksNeeded = GetBlocksNeeded(dataSize);
            if (blocksNeeded > _blockCount)
            {
                return false;
            }

            uint writeIndex = LoadWriteIndex();
            uint startBlockIndex = writeIndex % (uint)_blockCount;

            // Check if entry would wrap
            uint endBlockIndex = startBlockIndex + (uint)blocksNeeded;
            uint newWriteIndex;
            int skippedBlocks = 0;

            if (endBlockIndex > (uint)_blockCount)
            {
                // Need to wrap - mark remaining blocks as skipped
                skippedBlocks = _blockCount - (int)startBlockIndex;
                startBlockIndex = 0;
                newWriteIndex = writeIndex + (uint)(skippedBlocks + blocksNeeded);
            }
            else
            {
                newWriteIndex = writeIndex + (uint)blocksNeeded;
            }

            // Update minReadIndex to make room (evict old blocks)
            uint minReadIndex = LoadMinReadIndex();
            uint requiredMinReadIndex = newWriteIndex > (uint)_blockCount
                ? newWriteIndex - (uint)_blockCount
                : 0;

            if (minReadIndex < requiredMinReadIndex)
            {
                // Need to advance minReadIndex to a valid start block
                // Walk through entries starting from current minReadIndex until we pass required
                uint newMinReadIndex = SkipToValidEntry(minReadIndex, requiredMinReadIndex);
                StoreMinReadIndex(newMinReadIndex);
            }

            // Mark skipped blocks (if wrapping)
            if (skippedBlocks > 0)
            {
                for (int i = 0; i < skippedBlocks; ++i)
                {
                    int blockOffset = GetBlockOffset((writeIndex + (uint)i) % (uint)_blockCount);
                    SetBlockDataSize(blockOffset, 0);
                }
            }

            // Write data size to the header of the first block
            int firstBlockOffset = GetBlockOffset(startBlockIndex);
            SetBlockDataSize(firstBlockOffset, (uint)dataSize);

            // Create MemoryAccessor for the data region
            // Data starts after the first block's header and spans blocksNeeded blocks
            int dataOffset = firstBlockOffset + BLOCK_HEADER_SIZE;
            int maxDataSpace = (blocksNeeded * _blockSize) - BLOCK_HEADER_SIZE;
            MemoryAccessor dataAccessor = _poolAccessor.Slice(dataOffset, maxDataSpace);

            callback(dataAccessor);

            // Update writeIndex after data is written
            StoreWriteIndex(newWriteIndex);

            return true;
        }

        private static int Align(int x)
        {
            return (x + 3) & ~3;
        }

        private int GetBlockOffset(uint blockIndex)
        {
            return (int)blockIndex * _blockSize;
        }

        internal int GetBlocksNeeded(int dataSize)
        {
            // First block holds dataSize bytes - BLOCK_HEADER_SIZE
            // Subsequent blocks hold blockSize bytes each
            int firstBlockData = _blockSize - BLOCK_HEADER_SIZE;
            if (dataSize <= firstBlockData)
            {
                return 1;
            }
            int remaining = dataSize - firstBlockData;
            // Use (remaining - 1) / _blockSize + 1 to avoid overflow from remaining + _blockSize - 1
            return 1 + ((remaining - 1) / _blockSize) + 1;
        }

        private uint* GetWriteIndexPtr()
        {
            return (uint*)(_headerAccessor.DataSource + _headerAccessor.MemOffset + 16);
        }

        private uint* GetMinReadIndexPtr()
        {
            return (uint*)(_headerAccessor.DataSource + _headerAccessor.MemOffset + 20);
        }

        internal uint LoadWriteIndex()
        {
            return AtomicUtils.AtomicLoadAcquire(GetWriteIndexPtr());
        }

        internal uint LoadMinReadIndex()
        {
            return AtomicUtils.AtomicLoadAcquire(GetMinReadIndexPtr());
        }

        private void StoreWriteIndex(uint value)
        {
            AtomicUtils.AtomicStoreRelease(GetWriteIndexPtr(), value);
        }

        private void StoreMinReadIndex(uint value)
        {
            AtomicUtils.AtomicStoreRelease(GetMinReadIndexPtr(), value);
        }

        private void SetBlockDataSize(int blockOffset, uint dataSize)
        {
            XrpaUtils.BoundsAssert(blockOffset, BLOCK_HEADER_SIZE, 0, _poolAccessor.Size);
            *((uint*)(_poolAccessor.DataSource + _poolAccessor.MemOffset + blockOffset)) = dataSize;
        }

        internal uint GetBlockDataSize(int blockOffset)
        {
            XrpaUtils.BoundsAssert(blockOffset, BLOCK_HEADER_SIZE, 0, _poolAccessor.Size);
            return *((uint*)(_poolAccessor.DataSource + _poolAccessor.MemOffset + blockOffset));
        }

        /// <summary>
        /// Skip to a valid start block (one with dataSize greater than 0)
        /// </summary>
        private uint SkipToValidBlock(uint startIndex)
        {
            uint writeIndex = LoadWriteIndex();
            while (startIndex < writeIndex)
            {
                uint blockIndex = startIndex % (uint)_blockCount;
                int blockOffset = GetBlockOffset(blockIndex);
                uint dataSize = GetBlockDataSize(blockOffset);
                if (dataSize > 0)
                {
                    return startIndex;
                }
                startIndex++;
            }
            return startIndex;
        }

        /// <summary>
        /// Walk through entries starting from currentIndex until we find one at or past targetIndex.
        /// This properly handles multi-block entries by advancing by blocksNeeded instead of 1.
        /// </summary>
        private uint SkipToValidEntry(uint currentIndex, uint targetIndex)
        {
            uint writeIndex = LoadWriteIndex();

            while (currentIndex < writeIndex && currentIndex < targetIndex)
            {
                uint blockIndex = currentIndex % (uint)_blockCount;
                int blockOffset = GetBlockOffset(blockIndex);
                uint dataSize = GetBlockDataSize(blockOffset);

                if (dataSize == 0)
                {
                    // Skipped block (from wrapping), advance by 1
                    currentIndex++;
                }
                else
                {
                    // Valid entry - skip past all its blocks
                    int blocksNeeded = GetBlocksNeeded((int)dataSize);
                    currentIndex += (uint)blocksNeeded;
                }
            }

            // Now currentIndex >= targetIndex (or at writeIndex if no more entries)
            // Make sure we're at a valid entry start, not in the middle of skipped blocks
            return SkipToValidBlock(currentIndex);
        }

        internal MemoryAccessor PoolAccessor => _poolAccessor;
    }

    /// <summary>
    /// Iterator for reading from an SPMC ring buffer.
    /// Each consumer should maintain its own iterator.
    /// </summary>
    public class SpmcRingBufferIterator
    {
        private uint _localReadIndex = 0;

        /// <summary>
        /// Check if entries were missed (overwritten before reading)
        /// </summary>
        public bool HasMissedEntries(SpmcRingBuffer ringBuffer)
        {
            uint minReadIndex = ringBuffer.LoadMinReadIndex();
            return _localReadIndex < minReadIndex;
        }

        /// <summary>
        /// Check if there are unread entries
        /// </summary>
        public bool HasNext(SpmcRingBuffer ringBuffer)
        {
            uint writeIndex = ringBuffer.LoadWriteIndex();
            return _localReadIndex < writeIndex;
        }

        /// <summary>
        /// Read next entry; callback receives MemoryAccessor.
        /// Returns false if data was overwritten during read (stale read).
        /// </summary>
        public bool ReadNext(SpmcRingBuffer ringBuffer, Action<MemoryAccessor> callback)
        {
            if (!HasNext(ringBuffer))
            {
                return false;
            }

            // Skip to valid block if we fell behind
            if (HasMissedEntries(ringBuffer))
            {
                _localReadIndex = ringBuffer.LoadMinReadIndex();
            }

            // Skip any skipped blocks (size=0)
            uint writeIndex = ringBuffer.LoadWriteIndex();
            while (_localReadIndex < writeIndex)
            {
                uint blockIndex = _localReadIndex % (uint)ringBuffer.BlockCount;
                int blockOffset = (int)blockIndex * ringBuffer.BlockSize;
                uint dataSize = ringBuffer.GetBlockDataSize(blockOffset);

                if (dataSize == 0)
                {
                    // Skipped block, advance
                    _localReadIndex++;
                    continue;
                }

                // Found a valid entry
                int blocksNeeded = ringBuffer.GetBlocksNeeded((int)dataSize);

                // Create MemoryAccessor for the data
                int dataOffset = blockOffset + SpmcRingBuffer.BLOCK_HEADER_SIZE;
                int maxDataSpace = (blocksNeeded * ringBuffer.BlockSize) - SpmcRingBuffer.BLOCK_HEADER_SIZE;
                MemoryAccessor dataAccessor = ringBuffer.PoolAccessor.Slice(dataOffset, maxDataSpace);

                callback(dataAccessor);

                // Validate that data is still valid after read
                uint newMinReadIndex = ringBuffer.LoadMinReadIndex();
                if (_localReadIndex < newMinReadIndex)
                {
                    // Data was overwritten during read - stale read
                    _localReadIndex = newMinReadIndex;
                    return false;
                }

                // Advance past this entry
                _localReadIndex += (uint)blocksNeeded;
                return true;
            }

            return false;
        }

        /// <summary>
        /// Skip to current write position
        /// </summary>
        public void SetToEnd(SpmcRingBuffer ringBuffer)
        {
            _localReadIndex = ringBuffer.LoadWriteIndex();
        }
    }
}
