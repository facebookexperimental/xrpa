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

#include <folly/portability/GTest.h>
#include <array>

#include <xrpa-runtime/utils/PlacedRingBuffer.h>

using namespace Xrpa;

constexpr int INT_COUNT = 100;
constexpr int BUFFER_SIZE = INT_COUNT * (PlacedRingBuffer::ELEMENT_HEADER_SIZE + sizeof(int));
static std::array<unsigned char, sizeof(PlacedRingBuffer) + BUFFER_SIZE> testBuffer;
static PlacedRingBuffer* testRingBuffer = reinterpret_cast<PlacedRingBuffer*>(testBuffer.data());

static void Init() {
  EXPECT_EQ(PlacedRingBuffer::getMemSize(BUFFER_SIZE), sizeof(testBuffer));
  testRingBuffer->init(BUFFER_SIZE);
  EXPECT_EQ(testRingBuffer->poolSize, BUFFER_SIZE);
  EXPECT_EQ(testRingBuffer->count, 0);
  EXPECT_EQ(testRingBuffer->startID, 0);
  EXPECT_EQ(testRingBuffer->startOffset, 0);
  EXPECT_EQ(testRingBuffer->prewrapOffset, BUFFER_SIZE);
}

// order matters
static void expectRingBufferEquals(int start, int end) {
  int mul = end < start ? -1 : 1;
  EXPECT_EQ(testRingBuffer->count, 1 + mul * (end - start));
  for (int i = 0; i < testRingBuffer->count; ++i) {
    MemoryOffset offset;
    EXPECT_EQ(testRingBuffer->getAt(i).readValue<int32_t>(offset), start + i * mul);
  }
}

TEST(PlacedRingBuffer, basic_operations) {
  Init();

  // fill the buffer
  for (int i = 0; i < INT_COUNT; ++i) {
    MemoryOffset writeOffset;
    MemoryOffset readOffset;
    testRingBuffer->push(4, nullptr).writeValue<int32_t>(i, writeOffset);
    EXPECT_EQ(testRingBuffer->getAt(i).readValue<int32_t>(readOffset), i);
  }
  EXPECT_EQ(testRingBuffer->count, INT_COUNT);
  expectRingBufferEquals(0, INT_COUNT - 1);
  EXPECT_EQ(testRingBuffer->getIndexForID(0), 0);
  EXPECT_EQ(testRingBuffer->getIndexForID(1), 1);
  EXPECT_EQ(testRingBuffer->getIndexForID(2), 2);
  EXPECT_EQ(testRingBuffer->getIndexForID(3), 3);

  // additional push should wrap
  {
    MemoryOffset offset;
    testRingBuffer->push(4, nullptr).writeValue<int32_t>(INT_COUNT, offset);
    EXPECT_EQ(testRingBuffer->count, INT_COUNT);
    expectRingBufferEquals(1, INT_COUNT);
  }

  // shift oldest one out
  {
    MemoryOffset offset;
    EXPECT_EQ(testRingBuffer->shift().readValue<int32_t>(offset), 1);
    EXPECT_EQ(testRingBuffer->count, INT_COUNT - 1);
    expectRingBufferEquals(2, INT_COUNT);
  }

  // verify that the index returned for IDs that have been removed/overwritten is 0,
  // and that the index for IDs in the buffer is correct
  {
    MemoryOffset offset;
    EXPECT_EQ(testRingBuffer->getIndexForID(0), 0);
    EXPECT_EQ(testRingBuffer->getIndexForID(1), 0);
    EXPECT_EQ(testRingBuffer->getIndexForID(2), 0);
    EXPECT_EQ(testRingBuffer->getIndexForID(3), 1);
    EXPECT_EQ(
        testRingBuffer->getAt(testRingBuffer->getIndexForID(3)).readValue<int32_t>(offset), 3);
  }

  // additional push should not wrap now that there is room
  {
    MemoryOffset offset;
    testRingBuffer->push(4, nullptr).writeValue<int32_t>(INT_COUNT + 1, offset);
    EXPECT_EQ(testRingBuffer->count, INT_COUNT);
    expectRingBufferEquals(2, INT_COUNT + 1);
  }

  // now shift everything out
  for (int i = 0; i < INT_COUNT; ++i) {
    MemoryOffset offset;
    EXPECT_EQ(testRingBuffer->count, INT_COUNT - i);
    expectRingBufferEquals(2 + i, INT_COUNT + 1);
    EXPECT_EQ(testRingBuffer->shift().readValue<int32_t>(offset), 2 + i);
  }
  EXPECT_EQ(testRingBuffer->count, 0);

  // additional shift should return nullptr
  EXPECT_EQ(testRingBuffer->shift().isNull(), true);
  EXPECT_EQ(testRingBuffer->count, 0);
}

TEST(PlacedRingBuffer, mixed_sizes) {
  Init();

  {
    MemoryOffset offset;
    testRingBuffer->push(396, nullptr).writeValue<int32_t>(0, offset);
    EXPECT_EQ(testRingBuffer->count, 1);
    EXPECT_EQ(testRingBuffer->startID, 0);
    EXPECT_EQ(testRingBuffer->prewrapOffset, 800);
  }

  {
    MemoryOffset offset;
    testRingBuffer->push(196, nullptr).writeValue<int32_t>(0, offset);
    EXPECT_EQ(testRingBuffer->count, 2);
    EXPECT_EQ(testRingBuffer->startID, 0);
    EXPECT_EQ(testRingBuffer->prewrapOffset, 800);
  }

  {
    MemoryOffset offset;
    testRingBuffer->push(396, nullptr).writeValue<int32_t>(0, offset);
    EXPECT_EQ(testRingBuffer->count, 2);
    EXPECT_EQ(testRingBuffer->startID, 1);
    EXPECT_EQ(testRingBuffer->prewrapOffset, 600);
  }
}

TEST(PlacedRingBuffer, iterator) {
  Init();

  PlacedRingBufferIterator iter;

  iter.setToEnd(testRingBuffer);
  EXPECT_EQ(iter.hasMissedEntries(testRingBuffer), false);
  EXPECT_EQ(iter.hasNext(testRingBuffer), false);

  // push a value in
  {
    MemoryOffset offset;
    testRingBuffer->push(396, nullptr).writeValue<int32_t>(10, offset);
    EXPECT_EQ(testRingBuffer->count, 1);
    EXPECT_EQ(testRingBuffer->startID, 0);
    EXPECT_EQ(testRingBuffer->prewrapOffset, 800);
    EXPECT_EQ(iter.hasMissedEntries(testRingBuffer), false);
    EXPECT_EQ(iter.hasNext(testRingBuffer), true);
  }

  // get the value using the iterator
  {
    MemoryOffset offset;
    auto mem = iter.next(testRingBuffer);
    EXPECT_EQ(mem.isNull(), false);
    EXPECT_EQ(mem.readValue<int32_t>(offset), 10);
  }
  EXPECT_EQ(iter.hasMissedEntries(testRingBuffer), false);
  EXPECT_EQ(iter.hasNext(testRingBuffer), false);

  // push another value in
  {
    MemoryOffset offset;
    testRingBuffer->push(196, nullptr).writeValue<int32_t>(20, offset);
    EXPECT_EQ(testRingBuffer->count, 2);
    EXPECT_EQ(testRingBuffer->startID, 0);
    EXPECT_EQ(testRingBuffer->prewrapOffset, 800);
    EXPECT_EQ(iter.hasMissedEntries(testRingBuffer), false);
    EXPECT_EQ(iter.hasNext(testRingBuffer), true);
  }

  // get the value using the iterator
  {
    MemoryOffset offset;
    auto mem = iter.next(testRingBuffer);
    EXPECT_EQ(mem.isNull(), false);
    EXPECT_EQ(mem.readValue<int32_t>(offset), 20);
  }
  EXPECT_EQ(iter.hasMissedEntries(testRingBuffer), false);
  EXPECT_EQ(iter.hasNext(testRingBuffer), false);

  // overflow the iterator
  for (int i = 0; i < INT_COUNT; ++i) {
    MemoryOffset offset;
    testRingBuffer->push(20, nullptr).writeValue<int32_t>(0, offset);
  }
  EXPECT_EQ(iter.hasMissedEntries(testRingBuffer), true);
  EXPECT_EQ(iter.hasNext(testRingBuffer), true);
  iter.setToEnd(testRingBuffer);
  EXPECT_EQ(iter.hasMissedEntries(testRingBuffer), false);
  EXPECT_EQ(iter.hasNext(testRingBuffer), false);

  // shift everything out of the ring buffer
  while (testRingBuffer->count > 0) {
    testRingBuffer->shift();
  }
  EXPECT_EQ(iter.hasMissedEntries(testRingBuffer), false);
  EXPECT_EQ(iter.hasNext(testRingBuffer), false);

  // push a value into the ring buffer and remove it
  {
    MemoryOffset offset;
    testRingBuffer->push(396, nullptr).writeValue<int32_t>(60, offset);
    testRingBuffer->shift();
    EXPECT_EQ(iter.hasMissedEntries(testRingBuffer), true);
    EXPECT_EQ(iter.hasNext(testRingBuffer), true);
  }

  // reset the iterator so it is valid again
  iter.setToEnd(testRingBuffer);
  EXPECT_EQ(iter.hasMissedEntries(testRingBuffer), false);
  EXPECT_EQ(iter.hasNext(testRingBuffer), false);

  // insert another item into the ring buffer
  {
    MemoryOffset offset;
    testRingBuffer->push(396, nullptr).writeValue<int32_t>(30, offset);
    EXPECT_EQ(testRingBuffer->count, 1);
    EXPECT_EQ(testRingBuffer->startID, 103);
    EXPECT_EQ(testRingBuffer->prewrapOffset, 800);
    EXPECT_EQ(iter.hasMissedEntries(testRingBuffer), false);
    EXPECT_EQ(iter.hasNext(testRingBuffer), true);
  }

  // get the value using the iterator
  {
    MemoryOffset offset;
    auto mem = iter.next(testRingBuffer);
    EXPECT_EQ(mem.isNull(), false);
    EXPECT_EQ(mem.readValue<int32_t>(offset), 30);
  }
  EXPECT_EQ(iter.hasMissedEntries(testRingBuffer), false);
  EXPECT_EQ(iter.hasNext(testRingBuffer), false);
}
