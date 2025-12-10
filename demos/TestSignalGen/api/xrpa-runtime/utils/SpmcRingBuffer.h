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

#pragma once

#include <xrpa-runtime/utils/AtomicUtils.h>
#include <xrpa-runtime/utils/MemoryAccessor.h>
#include <xrpa-runtime/utils/XrpaUtils.h>

#include <cstdint>
#include <functional>

namespace Xrpa {

#define SPMC_ALIGN(x) (((x) + 3) & ~3)

class SpmcRingBufferIterator;

/*
 * Lock-free Single Producer Multiple Consumer (SPMC) ring buffer.
 *
 * Memory Layout:
 * Offset  | Size | Field
 * --------|------|------------------
 * 0       | 4    | poolSize (total memory after header)
 * 4       | 4    | blockSize (aligned size of each block, includes 4-byte header)
 * 8       | 4    | blockCount (number of blocks)
 * 12      | 4    | (padding/reserved)
 * 16      | 4    | writeIndex (atomic uint32, monotonically increasing)
 * 20      | 4    | minReadIndex (atomic uint32, minimum valid read index)
 * 24      | ...  | Block pool starts here
 *
 * Block Layout:
 * Offset  | Size | Field
 * --------|------|------------------
 * 0       | 4    | dataSize (0 = skipped block, >0 = total data size in bytes)
 * 4       | ...  | data (up to blockSize - 4 bytes per block)
 *
 * Multi-block entries:
 * - First block header contains total data size across all blocks
 * - Subsequent blocks have NO header (data is contiguous across blocks)
 * - If entry would wrap, remaining blocks at end are marked as skipped (size=0)
 *   and entry starts at block 0
 */
class SpmcRingBuffer {
 public:
  static constexpr int32_t BLOCK_HEADER_SIZE = 4;
  static constexpr int32_t HEADER_SIZE = 24;

  SpmcRingBuffer() = default;

  SpmcRingBuffer(const MemoryAccessor& memSource, int32_t memOffset)
      : memSource_(memSource.slice(memOffset)),
        headerAccessor_(memSource.slice(memOffset, HEADER_SIZE)) {
    if (!headerAccessor_.isNull()) {
      MemoryOffset pos;
      auto poolSize = headerAccessor_.readValue<int32_t>(pos);
      blockSize_ = headerAccessor_.readValue<int32_t>(pos);
      blockCount_ = headerAccessor_.readValue<int32_t>(pos);

      if (poolSize > 0 && blockSize_ > 0 && blockCount_ > 0) {
        poolAccessor_ = memSource.slice(memOffset + HEADER_SIZE, poolSize);
      }
    }
  }

  static constexpr int32_t getMemSize(int32_t blockSize, int32_t blockCount) {
    blockSize = SPMC_ALIGN(blockSize);
    return HEADER_SIZE + (blockSize * blockCount);
  }

  void init(int32_t blockSizeIn, int32_t blockCountIn) {
    blockSizeIn = SPMC_ALIGN(blockSizeIn);
    blockSize_ = blockSizeIn;
    blockCount_ = blockCountIn;

    int32_t poolSize = blockSizeIn * blockCountIn;

    MemoryOffset pos;
    headerAccessor_.writeValue<int32_t>(poolSize, pos);
    headerAccessor_.writeValue<int32_t>(blockSizeIn, pos);
    headerAccessor_.writeValue<int32_t>(blockCountIn, pos);
    headerAccessor_.writeValue<int32_t>(0, pos); // reserved
    headerAccessor_.writeValue<uint32_t>(0, pos); // writeIndex
    headerAccessor_.writeValue<uint32_t>(0, pos); // minReadIndex

    poolAccessor_ = memSource_.slice(HEADER_SIZE, poolSize);
  }

  [[nodiscard]] bool isNull() const {
    return headerAccessor_.isNull() || poolAccessor_.isNull();
  }

  [[nodiscard]] int32_t getBlockSize() const {
    return blockSize_;
  }

  [[nodiscard]] int32_t getBlockCount() const {
    return blockCount_;
  }

  [[nodiscard]] int32_t getMaxDataSize() const {
    // Maximum data that can fit in a single entry (all blocks - one header)
    return (blockSize_ * blockCount_) - BLOCK_HEADER_SIZE;
  }

  // Producer: write data to the ring buffer
  // Returns true if write succeeded
  // Calls callback with MemoryAccessor for writing the data
  bool write(int32_t dataSize, const std::function<void(MemoryAccessor)>& callback) {
    if (isNull() || dataSize <= 0) {
      return false;
    }

    int32_t blocksNeeded = getBlocksNeeded(dataSize);
    if (blocksNeeded > blockCount_) {
      return false;
    }

    uint32_t writeIndex = loadWriteIndex();
    uint32_t startBlockIndex = writeIndex % static_cast<uint32_t>(blockCount_);

    // Check if entry would wrap
    uint32_t endBlockIndex = startBlockIndex + static_cast<uint32_t>(blocksNeeded);
    uint32_t newWriteIndex = 0;
    int32_t skippedBlocks = 0;

    if (endBlockIndex > static_cast<uint32_t>(blockCount_)) {
      // Need to wrap - mark remaining blocks as skipped
      skippedBlocks = blockCount_ - static_cast<int32_t>(startBlockIndex);
      startBlockIndex = 0;
      newWriteIndex = writeIndex + static_cast<uint32_t>(skippedBlocks + blocksNeeded);
    } else {
      newWriteIndex = writeIndex + static_cast<uint32_t>(blocksNeeded);
    }

    // Update minReadIndex to make room (evict old blocks)
    uint32_t minReadIndex = loadMinReadIndex();
    uint32_t requiredMinReadIndex = newWriteIndex > static_cast<uint32_t>(blockCount_)
        ? newWriteIndex - static_cast<uint32_t>(blockCount_)
        : 0;

    if (minReadIndex < requiredMinReadIndex) {
      // Need to advance minReadIndex to a valid start block
      // Walk through entries starting from current minReadIndex until we pass requiredMinReadIndex
      uint32_t newMinReadIndex = skipToValidEntry(minReadIndex, requiredMinReadIndex);
      storeMinReadIndex(newMinReadIndex);
    }

    // Mark skipped blocks (if wrapping)
    if (skippedBlocks > 0) {
      for (int32_t i = 0; i < skippedBlocks; ++i) {
        int32_t blockOffset = getBlockOffset(
            (writeIndex + static_cast<uint32_t>(i)) % static_cast<uint32_t>(blockCount_));
        setBlockDataSize(blockOffset, 0);
      }
    }

    // Write data size to the header of the first block
    int32_t firstBlockOffset = getBlockOffset(startBlockIndex);
    setBlockDataSize(firstBlockOffset, static_cast<uint32_t>(dataSize));

    // Create MemoryAccessor for the data region
    // Data starts after the first block's header and spans blocksNeeded blocks
    int32_t dataOffset = firstBlockOffset + BLOCK_HEADER_SIZE;
    int32_t maxDataSpace = (blocksNeeded * blockSize_) - BLOCK_HEADER_SIZE;
    MemoryAccessor dataAccessor = poolAccessor_.slice(dataOffset, maxDataSpace);

    callback(dataAccessor);

    // Update writeIndex after data is written
    storeWriteIndex(newWriteIndex);

    return true;
  }

 private:
  friend class SpmcRingBufferIterator;

  MemoryAccessor memSource_;
  MemoryAccessor headerAccessor_;
  MemoryAccessor poolAccessor_;

  int32_t blockSize_ = 0;
  int32_t blockCount_ = 0;

  [[nodiscard]] int32_t getBlockOffset(uint32_t blockIndex) const {
    return static_cast<int32_t>(blockIndex) * blockSize_;
  }

  [[nodiscard]] int32_t getBlocksNeeded(int32_t dataSize) const {
    // First block holds dataSize bytes - BLOCK_HEADER_SIZE
    // Subsequent blocks hold blockSize bytes each
    int32_t firstBlockData = blockSize_ - BLOCK_HEADER_SIZE;
    if (dataSize <= firstBlockData) {
      return 1;
    }
    int32_t remaining = dataSize - firstBlockData;
    // Use (remaining - 1) / blockSize_ + 1 to avoid overflow from remaining + blockSize_ - 1
    return 1 + ((remaining - 1) / blockSize_) + 1;
  }

  [[nodiscard]] volatile uint32_t* getWriteIndexPtr() const {
    return reinterpret_cast<volatile uint32_t*>(
        const_cast<MemoryAccessor&>(headerAccessor_).getRawPointer(16, sizeof(uint32_t)));
  }

  [[nodiscard]] volatile uint32_t* getMinReadIndexPtr() const {
    return reinterpret_cast<volatile uint32_t*>(
        const_cast<MemoryAccessor&>(headerAccessor_).getRawPointer(20, sizeof(uint32_t)));
  }

  [[nodiscard]] uint32_t loadWriteIndex() const {
    return atomicLoadAcquire(getWriteIndexPtr());
  }

  [[nodiscard]] uint32_t loadMinReadIndex() const {
    return atomicLoadAcquire(getMinReadIndexPtr());
  }

  void storeWriteIndex(uint32_t value) {
    atomicStoreRelease(getWriteIndexPtr(), value);
  }

  void storeMinReadIndex(uint32_t value) {
    atomicStoreRelease(getMinReadIndexPtr(), value);
  }

  void setBlockDataSize(int32_t blockOffset, uint32_t dataSize) {
    xrpaDebugBoundsAssert(blockOffset, BLOCK_HEADER_SIZE, 0, poolAccessor_.getSize());
    *reinterpret_cast<uint32_t*>(poolAccessor_.getRawPointer(blockOffset, BLOCK_HEADER_SIZE)) =
        dataSize;
  }

  [[nodiscard]] uint32_t getBlockDataSize(int32_t blockOffset) const {
    xrpaDebugBoundsAssert(blockOffset, BLOCK_HEADER_SIZE, 0, poolAccessor_.getSize());
    return *reinterpret_cast<uint32_t*>(
        const_cast<MemoryAccessor&>(poolAccessor_).getRawPointer(blockOffset, BLOCK_HEADER_SIZE));
  }

  // Skip to a valid start block (one with dataSize > 0)
  [[nodiscard]] uint32_t skipToValidBlock(uint32_t startIndex) const {
    uint32_t writeIndex = loadWriteIndex();
    while (startIndex < writeIndex) {
      uint32_t blockIndex = startIndex % static_cast<uint32_t>(blockCount_);
      int32_t blockOffset = getBlockOffset(blockIndex);
      uint32_t dataSize = getBlockDataSize(blockOffset);
      if (dataSize > 0) {
        return startIndex;
      }
      startIndex++;
    }
    return startIndex;
  }

  // Walk through entries starting from currentIndex until we find one at or past targetIndex.
  // This properly handles multi-block entries by advancing by blocksNeeded instead of 1.
  [[nodiscard]] uint32_t skipToValidEntry(uint32_t currentIndex, uint32_t targetIndex) const {
    uint32_t writeIndex = loadWriteIndex();

    while (currentIndex < writeIndex && currentIndex < targetIndex) {
      uint32_t blockIndex = currentIndex % static_cast<uint32_t>(blockCount_);
      int32_t blockOffset = getBlockOffset(blockIndex);
      uint32_t dataSize = getBlockDataSize(blockOffset);

      if (dataSize == 0) {
        // Skipped block (from wrapping), advance by 1
        currentIndex++;
      } else {
        // Valid entry - skip past all its blocks
        int32_t blocksNeeded = getBlocksNeeded(static_cast<int32_t>(dataSize));
        currentIndex += static_cast<uint32_t>(blocksNeeded);
      }
    }

    // Now currentIndex >= targetIndex (or at writeIndex if no more entries)
    // Make sure we're at a valid entry start, not in the middle of skipped blocks
    return skipToValidBlock(currentIndex);
  }
};

class SpmcRingBufferIterator {
 public:
  // Check if entries were missed (overwritten before reading)
  [[nodiscard]] bool hasMissedEntries(const SpmcRingBuffer* ringBuffer) const {
    uint32_t minReadIndex = ringBuffer->loadMinReadIndex();
    return localReadIndex_ < minReadIndex;
  }

  // Check if there are unread entries
  [[nodiscard]] bool hasNext(const SpmcRingBuffer* ringBuffer) const {
    uint32_t writeIndex = ringBuffer->loadWriteIndex();
    return localReadIndex_ < writeIndex;
  }

  // Read next entry; callback receives MemoryAccessor
  // Returns false if data was overwritten during read (stale read)
  bool readNext(SpmcRingBuffer* ringBuffer, const std::function<void(MemoryAccessor)>& callback) {
    if (!hasNext(ringBuffer)) {
      return false;
    }

    // Skip to valid block if we fell behind
    if (hasMissedEntries(ringBuffer)) {
      localReadIndex_ = ringBuffer->loadMinReadIndex();
    }

    // Skip any skipped blocks (size=0)
    uint32_t writeIndex = ringBuffer->loadWriteIndex();
    while (localReadIndex_ < writeIndex) {
      uint32_t blockIndex = localReadIndex_ % static_cast<uint32_t>(ringBuffer->blockCount_);
      int32_t blockOffset = ringBuffer->getBlockOffset(blockIndex);
      uint32_t dataSize = ringBuffer->getBlockDataSize(blockOffset);

      if (dataSize == 0) {
        // Skipped block, advance
        localReadIndex_++;
        continue;
      }

      // Found a valid entry
      int32_t blocksNeeded = ringBuffer->getBlocksNeeded(static_cast<int32_t>(dataSize));

      // Create MemoryAccessor for the data
      int32_t dataOffset = blockOffset + SpmcRingBuffer::BLOCK_HEADER_SIZE;
      int32_t maxDataSpace =
          (blocksNeeded * ringBuffer->blockSize_) - SpmcRingBuffer::BLOCK_HEADER_SIZE;
      MemoryAccessor dataAccessor = ringBuffer->poolAccessor_.slice(dataOffset, maxDataSpace);

      callback(dataAccessor);

      // Validate that data is still valid after read
      uint32_t newMinReadIndex = ringBuffer->loadMinReadIndex();
      if (localReadIndex_ < newMinReadIndex) {
        // Data was overwritten during read - stale read
        localReadIndex_ = newMinReadIndex;
        return false;
      }

      // Advance past this entry
      localReadIndex_ += static_cast<uint32_t>(blocksNeeded);
      return true;
    }

    return false;
  }

  // Skip to current write position
  void setToEnd(const SpmcRingBuffer* ringBuffer) {
    localReadIndex_ = ringBuffer->loadWriteIndex();
  }

 private:
  uint32_t localReadIndex_ = 0;
};

} // namespace Xrpa
