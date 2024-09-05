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

#include <stdint.h>
#include <string.h>

namespace Xrpa {

template <typename ElemType>
struct PlacedSortedArray {
  int32_t maxCount;
  int32_t count;

  static int32_t getMemSize(int32_t maxCount) {
    return sizeof(PlacedSortedArray<ElemType>) + maxCount * sizeof(ElemType);
  }

  void init(int32_t maxElements) {
    maxCount = maxElements;
    count = 0;
  }

  void reset() {
    count = 0;
  }

  bool isFull() const {
    return count >= maxCount;
  }

  ElemType* get() {
    return reinterpret_cast<ElemType*>(reinterpret_cast<unsigned char*>(this) + sizeof(*this));
  }

  const ElemType* get() const {
    return reinterpret_cast<const ElemType*>(
        reinterpret_cast<const unsigned char*>(this) + sizeof(*this));
  }

  // returns a reference to the element at the given index
  ElemType& getAt(int32_t index) {
    return get()[index];
  }

  const ElemType& getAt(int32_t index) const {
    return get()[index];
  }

  void clear() {
    count = 0;
  }

  int32_t insert(const ElemType& val) {
    if (isFull()) {
      return -1;
    }

    bool found;
    auto index = find(val, found);
    insertPresorted(val, index);
    return index;
  }

  // only call if you already called find() to obtain the correct index
  bool insertPresorted(const ElemType& val, int32_t index) {
    if (isFull()) {
      return false;
    }

    auto arrPtr = get();
    if (index < count) {
      // move elements at index and higher up a spot
      memmove(arrPtr + index + 1, arrPtr + index, (count - index) * sizeof(ElemType));
    }
    arrPtr[index] = val;
    count++;
    return true;
  }

  void removeIndex(int32_t index) {
    if (index < 0 || index >= count) {
      return;
    }

    count--;
    if (index < count) {
      // move elements after index down a spot
      auto arrPtr = get();
      memmove(arrPtr + index, arrPtr + index + 1, (count - index) * sizeof(ElemType));
    }
  }

  void removeIndexRange(int32_t startIndex, int32_t endIndex) {
    if (startIndex < 0) {
      startIndex = 0;
    }
    if (endIndex > count) {
      endIndex = count;
    }
    if (endIndex > startIndex) {
      count -= endIndex - startIndex;
      auto arrPtr = get();
      memmove(arrPtr + startIndex, arrPtr + endIndex, (count - startIndex) * sizeof(ElemType));
    }
  }

  void removeValue(const ElemType& val) {
    bool found;
    auto index = find(val, found);
    if (found) {
      removeIndex(index);
    }
  }

  template <typename QueryType>
  void removeMatching(const QueryType& query) {
    int32_t startIndex, endIndex;
    findRange(query, startIndex, endIndex);
    removeIndexRange(startIndex, endIndex);
  }

  template <typename TargetType>
  int32_t find(const TargetType& target, bool& found) const {
    return findInternal(target, found, false, false);
  }

  template <typename TargetType>
  bool contains(const TargetType& target) const {
    bool found;
    findInternal(target, found, false, false);
    return found;
  }

  template <typename QueryType>
  void findRange(const QueryType& query, int32_t& startIndexOut, int32_t& endIndexOut) const {
    bool found;
    startIndexOut = findInternal(query, found, true, false);
    if (!found) {
      startIndexOut = 0;
      endIndexOut = 0;
      return;
    }
    endIndexOut = findInternal(query, found, false, true) + 1;
  }

 private:
  template <typename TargetType>
  int32_t findInternal(const TargetType& target, bool& found, bool findLow, bool findHigh) const {
    // binary search
    int32_t lowIdx = 0;
    int32_t highIdx = count - 1;
    auto arr = get();

    int32_t lastFound = 0;
    found = false;

    while (lowIdx <= highIdx) {
      int midIdx = (lowIdx + highIdx) / 2;
      int d = ElemType::compare(arr[midIdx], target);
      if (d > 0) {
        highIdx = midIdx - 1;
      } else if (d < 0) {
        lowIdx = midIdx + 1;
      } else {
        found = true;
        lastFound = midIdx;
        if (findLow) {
          highIdx = midIdx - 1;
        } else if (findHigh) {
          lowIdx = midIdx + 1;
        } else {
          break;
        }
      }
    }
    return found ? lastFound : lowIdx;
  }
};

} // namespace Xrpa
