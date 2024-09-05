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

#include <xrpa-runtime/utils/MemoryAccessor.h>
#include <xrpa-runtime/utils/XrpaUtils.h>
#include <cstdint>

namespace Xrpa {

#define PMA_ALIGN(x) (((x) + 3) & ~3)
#define PMA_SPLIT_THRESHOLD 64

#define PMA_POOL_START (reinterpret_cast<unsigned char*>(this) + sizeof(PlacedMemoryAllocator))
#define PMA_POOL_START_CONST \
  (reinterpret_cast<const unsigned char*>(this) + sizeof(PlacedMemoryAllocator))

struct PMAFreeNode {
  int32_t size; // node size including this struct
  int32_t next;
  int32_t prev;
};

struct PMAAllocNode {
  int32_t size; // allocated size including this struct
};

struct PlacedMemoryAllocator {
  int32_t firstFree;
  int32_t poolSize;

  static int32_t getMemSize(int32_t poolSizeIn) {
    return sizeof(PlacedMemoryAllocator) + poolSizeIn;
  }

  void init(int32_t poolSizeIn) {
    firstFree = 0;
    poolSize = poolSizeIn;
    auto* freeNode = getAt<PMAFreeNode>(firstFree);
    freeNode->size = poolSize;
    freeNode->next = -1;
    freeNode->prev = -1;
  }

  void reset() {
    init(poolSize);
  }

  MemoryAccessor alloc(int32_t numBytes) {
    validateFreeNodes();

    // an allocated block MUST be large enough to hold a FreeNode when it is returned to the heap
    const int32_t sizeNeeded =
        std::max(PMA_ALIGN(sizeof(PMAAllocNode) + numBytes), sizeof(PMAFreeNode));

    int32_t foundOffset = -1;
    int32_t foundSize = 0;

    int32_t curOffset = firstFree;
    while (curOffset >= 0) {
      auto* curNode = getAt<PMAFreeNode>(curOffset);
      int32_t curSize = curNode->size;
      if (curSize >= sizeNeeded && (foundOffset < 0 || curSize < foundSize)) {
        foundOffset = curOffset;
        foundSize = curSize;
      }
      curOffset = curNode->next;
    }
    if (foundOffset < 0) {
      return {};
    }

    // as soon as we start writing to memory, foundNode will become invalid, so we need to copy the
    // data out first (the memory regions may be aliased - FreeNode is bigger than AllocNode)
    auto* foundNode = getAt<PMAFreeNode>(foundOffset);
    int32_t foundPrev = foundNode->prev;
    int32_t foundNext = foundNode->next;
    if (foundSize - sizeNeeded > PMA_SPLIT_THRESHOLD) {
      // split foundNode
      int32_t splitOffset = foundOffset + sizeNeeded;
      auto* splitNode = getAt<PMAFreeNode>(splitOffset);
      splitNode->size = foundSize - sizeNeeded;
      splitNode->prev = foundPrev;
      splitNode->next = foundNext;
      fixupNodeNeighbors(splitNode);

      getAt<PMAAllocNode>(foundOffset)->size = sizeNeeded;
    } else {
      // fixup linked list to remove foundNode
      auto* prevNode = getAt<PMAFreeNode>(foundPrev);
      if (prevNode) {
        prevNode->next = foundNext;
      } else {
        firstFree = foundNext;
      }

      auto* nextNode = getAt<PMAFreeNode>(foundNext);
      if (nextNode) {
        nextNode->prev = foundPrev;
      }
    }

    validateFreeNodes();

    return {
        getAt<uint8_t>(0),
        static_cast<int32_t>(foundOffset + sizeof(PMAAllocNode)),
        static_cast<int32_t>(sizeNeeded - sizeof(PMAAllocNode))};
  }

  MemoryAccessor get(int32_t offset) {
    if (offset < sizeof(PMAAllocNode)) {
      // invalid offset
      return {};
    }
    int32_t nodeOffset = offset - sizeof(PMAAllocNode);
    auto size = getAt<PMAAllocNode>(nodeOffset)->size;
    return {getAt<uint8_t>(0), offset, static_cast<int32_t>(size - sizeof(PMAAllocNode))};
  }

  void free(const MemoryAccessor& mem) {
    free(mem.getOffset());
  }

  void free(int32_t offset) {
    int32_t nodeOffset = offset - sizeof(PMAAllocNode);
    if (nodeOffset < 0) {
      // invalid offset
      return;
    }

    validateFreeNodes();

    auto size = getAt<PMAAllocNode>(nodeOffset)->size;

    // find correct place to insert newly freed node, to keep the nodes sorted
    int32_t prevOffset = -1;
    int32_t nextOffset = firstFree;
    while (nextOffset >= 0 && nodeOffset > nextOffset) {
      auto* nextNode = getAt<PMAFreeNode>(nextOffset);
      prevOffset = nextOffset;
      nextOffset = nextNode->next;
    }

    // merge with prev node if adjacent
    auto* prevNode = getAt<PMAFreeNode>(prevOffset);
    if (prevNode && nodeOffset == prevOffset + prevNode->size) {
      nodeOffset = prevOffset;
      prevOffset = prevNode->prev;
      size += prevNode->size;
    }

    // merge with next node if adjacent
    if (nextOffset == nodeOffset + size) {
      auto* nextNode = getAt<PMAFreeNode>(nextOffset);
      nextOffset = nextNode->next;
      size += nextNode->size;
    }

    // create new node in linked list
    auto* node = getAt<PMAFreeNode>(nodeOffset);
    node->size = size;
    node->prev = prevOffset;
    node->next = nextOffset;
    fixupNodeNeighbors(node);

    validateFreeNodes();
  }

  int32_t ptrToOffset(void* ptr) const {
    if (ptr == nullptr) {
      return 0;
    }
    return reinterpret_cast<const unsigned char*>(ptr) - PMA_POOL_START_CONST;
  }

  void* offsetToPtr(int32_t offset) {
    if (offset < sizeof(PMAAllocNode)) {
      return nullptr;
    }
    return PMA_POOL_START + offset;
  }

  [[nodiscard]] const void* offsetToPtr(int32_t offset) const {
    if (offset < sizeof(PMAAllocNode)) {
      return nullptr;
    }
    return PMA_POOL_START_CONST + offset;
  }

 private:
  template <typename MemType>
  MemType* getAt(int32_t offset) {
    if (offset < 0) {
      return nullptr;
    }
    xrpaDebugBoundsAssert(offset, sizeof(MemType), 0, poolSize);
    return reinterpret_cast<MemType*>(PMA_POOL_START + offset);
  }

  void fixupNodeNeighbors(PMAFreeNode* node) {
    auto offset = ptrToOffset(node);
    xrpaDebugBoundsAssert(offset, sizeof(PMAFreeNode), 0, poolSize);

    auto* prevNode = getAt<PMAFreeNode>(node->prev);
    if (prevNode) {
      prevNode->next = offset;
    } else {
      firstFree = offset;
    }

    auto* nextNode = getAt<PMAFreeNode>(node->next);
    if (nextNode) {
      nextNode->prev = offset;
    }
  }

  void validateFreeNodes() {
    int32_t curOffset = firstFree;
    xrpaDebugAssert(curOffset >= -1, "PlacedMemoryAllocator.ValidateFreeNodes failed");

    while (curOffset >= 0) {
      auto* curNode = getAt<PMAFreeNode>(curOffset);

      xrpaDebugAssert(curNode->size > 0, "PlacedMemoryAllocator.ValidateFreeNodes failed");
      xrpaDebugAssert(curNode->prev < curOffset, "PlacedMemoryAllocator.ValidateFreeNodes failed");
      xrpaDebugAssert(
          curNode->next == -1 || curNode->next >= curOffset + curNode->size,
          "PlacedMemoryAllocator.ValidateFreeNodes failed");

      curOffset = curNode->next;
    }
  }
};

} // namespace Xrpa
