/*
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

#include <dataset/utils/MemoryAccessor.h>
#include <dataset/utils/XrpaUtils.h>
#include <stdint.h>

namespace Xrpa {

#define PRB_ALIGN(x) ((x + 3) & ~3)

#define PRB_POOL_START (reinterpret_cast<uint8_t*>(this) + sizeof(PlacedRingBuffer))
#define PRB_POOL_START_CONST (reinterpret_cast<const uint8_t*>(this) + sizeof(PlacedRingBuffer))

struct PlacedRingBuffer {
  static constexpr int32_t ELEMENT_HEADER_SIZE = 4;

  int32_t poolSize;
  int32_t count;
  int32_t startID;
  int32_t startOffset;
  int32_t lastElemOffset;
  int32_t prewrapOffset; // offset past which the ring buffer is wrapped

  static int32_t getMemSize(int32_t poolSizeIn) {
    return sizeof(PlacedRingBuffer) + poolSizeIn;
  }

  void init(int32_t poolSizeIn) {
    poolSize = poolSizeIn;
    count = 0;
    startID = 0;
    startOffset = 0;
    lastElemOffset = 0;
    prewrapOffset = poolSize;
  }

  void reset() {
    init(poolSize);
  }

  // returns an accessor to the element at the given index from the start of the ring buffer
  [[nodiscard]] MemoryAccessor getAt(int32_t index) {
    if (index >= count) {
      return {};
    }

    int32_t offset = getOffsetForIndex(index);
    return getElementAccessor(offset);
  }

  [[nodiscard]] MemoryAccessor getByID(int32_t id) {
    if (id < startID || id > getMaxID()) {
      return {};
    }
    return getAt(getIndexForID(id));
  }

  [[nodiscard]] int32_t getID(int32_t index) const {
    return startID + index;
  }

  [[nodiscard]] int32_t getIndexForID(int32_t id) const {
    if (!count || id < startID) {
      return 0;
    }
    return id - startID;
  }

  [[nodiscard]] int32_t getMinID() const {
    return startID;
  }

  [[nodiscard]] int32_t getMaxID() const {
    return startID + count - 1;
  }

  // allocates space in the ring buffer at the end, shifting out the oldest data if needed
  // returns the monotonically-increasing ID of the newly-added value in idOut
  [[nodiscard]] MemoryAccessor push(int32_t numBytes, int32_t* idOut) {
    // validateEntries();

    numBytes = PRB_ALIGN(numBytes);
    xrpaDebugAssert(numBytes > 0);
    const int32_t sizeNeeded = ELEMENT_HEADER_SIZE + numBytes;
    if (sizeNeeded >= poolSize) {
      return {};
    }

    int32_t offset;
    for (offset = findFreeOffset(sizeNeeded); offset < 0; offset = findFreeOffset(sizeNeeded)) {
      // free oldest element to make room
      shift();
    }

    count++;
    if (idOut != nullptr) {
      *idOut = startID + count - 1;
    }

    setElementSize(offset, numBytes);
    lastElemOffset = offset;
    // validateEntries();

    return getElementAccessor(offset);
  }

  // removes the oldest element from the ring buffer
  // Note that shift() returns a MemoryAccessor pointing to the removed data; this is dangerous
  // to hold on to but allows for the null check in case the ring buffer is empty
  MemoryAccessor shift() {
    if (count == 0) {
      return {};
    }

    // validateEntries();

    auto ret = getAt(0);

    int32_t numBytes = getElementSize(startOffset);
    startOffset += ELEMENT_HEADER_SIZE + numBytes;
    if (startOffset >= prewrapOffset) {
      // shifting start past the wrap-point, so reset the offset and prewrapOffset
      startOffset = 0;
      prewrapOffset = poolSize;
    }

    startID++;
    --count;

    if (count == 0) {
      startOffset = 0;
      lastElemOffset = 0;
      prewrapOffset = poolSize;
    }

    // validateEntries();

    return ret;
  }

  void validateEntries() {
    int32_t offset = startOffset;
    bool isWrapped = false;
    for (int32_t i = 0; i < count; ++i) {
      int32_t numBytes = getElementSize(offset);
      if (isWrapped) {
        xrpaDebugBoundsAssert(offset, ELEMENT_HEADER_SIZE + numBytes, 0, startOffset);
      } else {
        xrpaDebugBoundsAssert(offset, ELEMENT_HEADER_SIZE + numBytes, startOffset, prewrapOffset);
      }
      offset += ELEMENT_HEADER_SIZE + numBytes;
      if (offset >= prewrapOffset) {
        xrpaDebugAssert(offset == prewrapOffset);
        xrpaDebugAssert(!isWrapped, "Wrapped twice");
        isWrapped = true;
        offset = 0;
      }
    }
  }

 private:
  friend class PlacedRingBufferIterator;

  void setElementSize(int32_t offset, int32_t numBytes) {
    xrpaDebugAssert(numBytes > 0);
    xrpaDebugBoundsAssert(offset, 4, 0, poolSize);
    uint8_t* poolStart = PRB_POOL_START;
    *reinterpret_cast<int32_t*>(poolStart + offset) = numBytes;
  }

  [[nodiscard]] int32_t getElementSize(int32_t offset) const {
    xrpaDebugBoundsAssert(offset, 4, 0, poolSize);
    const uint8_t* poolStart = PRB_POOL_START_CONST;
    int32_t numBytes = *reinterpret_cast<const int32_t*>(poolStart + offset);
    xrpaDebugAssert(numBytes > 0);
    return numBytes;
  }

  [[nodiscard]] MemoryAccessor getElementAccessor(int32_t offset) {
    int32_t numBytes = getElementSize(offset);
    xrpaDebugBoundsAssert(offset, ELEMENT_HEADER_SIZE + numBytes, 0, poolSize);
    return MemoryAccessor(PRB_POOL_START, offset + ELEMENT_HEADER_SIZE, numBytes);
  }

  [[nodiscard]] int32_t getOffsetForIndex(int32_t index) const {
    int32_t offset = startOffset;
    for (int32_t i = 0; i < index; ++i) {
      offset += ELEMENT_HEADER_SIZE + getElementSize(offset);
      if (offset >= prewrapOffset) {
        offset = 0;
      }
    }
    return offset;
  }

  [[nodiscard]] int32_t getNextOffset(int32_t offset) const {
    int32_t numBytes = getElementSize(offset);
    offset += ELEMENT_HEADER_SIZE + numBytes;
    if (offset >= prewrapOffset) {
      offset = 0;
    }
    return offset;
  }

  // sizeNeeded includes the size of the header
  [[nodiscard]] int32_t findFreeOffset(int32_t sizeNeeded) {
    if (count == 0) {
      xrpaDebugAssert(startOffset == 0);
      return startOffset;
    }

    int32_t offset = lastElemOffset + ELEMENT_HEADER_SIZE + getElementSize(lastElemOffset);

    if (startOffset < offset) {
      // check if there is space between the last element and the end of the buffer
      if (poolSize - offset >= sizeNeeded) {
        return offset;
      } else {
        // need to wrap around
        xrpaDebugAssert(
            offset <= poolSize, "Last element of ring buffer extends beyond memory range");
        prewrapOffset = offset;
        offset = 0;
      }
    }

    // the buffer has wrapped around, check if there is space between the last element and the
    // first element
    if (startOffset - offset >= sizeNeeded) {
      return offset;
    } else {
      return -1;
    }
  }
};

class PlacedRingBufferIterator {
 public:
  [[nodiscard]] bool hasMissedEntries(const PlacedRingBuffer* ringBuffer) const {
    return lastReadId_ < ringBuffer->startID - 1;
  }

  [[nodiscard]] bool hasNext(const PlacedRingBuffer* ringBuffer) const {
    return lastReadId_ < ringBuffer->getMaxID();
  }

  [[nodiscard]] bool hasNext(int maxId) const {
    return lastReadId_ < maxId;
  }

  [[nodiscard]] MemoryAccessor next(PlacedRingBuffer* ringBuffer) {
    if (!hasNext(ringBuffer)) {
      return {};
    }
    if (lastReadId_ < ringBuffer->startID) {
      lastReadId_ = ringBuffer->startID;
      lastReadOffset_ = ringBuffer->startOffset;
    } else {
      lastReadId_++;
      lastReadOffset_ = ringBuffer->getNextOffset(lastReadOffset_);
    }
    return ringBuffer->getElementAccessor(lastReadOffset_);
  }

  void setToEnd(const PlacedRingBuffer* ringBuffer) {
    lastReadId_ = ringBuffer->getMaxID();
    lastReadOffset_ = ringBuffer->lastElemOffset;
  }

 private:
  int32_t lastReadId_ = -1;
  int32_t lastReadOffset_ = 0;
};

} // namespace Xrpa
