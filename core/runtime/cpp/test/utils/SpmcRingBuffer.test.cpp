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
#include <vector>

#include <xrpa-runtime/utils/SpmcRingBuffer.h>

using namespace Xrpa;

constexpr int32_t BLOCK_SIZE = 32; // 28 bytes of data per block
constexpr int32_t BLOCK_COUNT = 10;
// HEADER_SIZE (24) + (SPMC_ALIGN(32) * 10) = 24 + 320 = 344
constexpr int32_t BUFFER_SIZE =
    SpmcRingBuffer::HEADER_SIZE + (SPMC_ALIGN(BLOCK_SIZE) * BLOCK_COUNT);
static std::array<unsigned char, BUFFER_SIZE> testBuffer;

static MemoryAccessor getTestMemoryAccessor() {
  return {testBuffer.data(), 0, static_cast<int32_t>(testBuffer.size())};
}

static void initTestBuffer() {
  testBuffer.fill(0);
  MemoryAccessor mem = getTestMemoryAccessor();
  SpmcRingBuffer ringBuffer(mem, 0);
  ringBuffer.init(BLOCK_SIZE, BLOCK_COUNT);
}

TEST(SpmcRingBuffer, Initialization) {
  initTestBuffer();

  MemoryAccessor mem = getTestMemoryAccessor();
  SpmcRingBuffer ringBuffer(mem, 0);

  EXPECT_FALSE(ringBuffer.isNull());
  EXPECT_EQ(ringBuffer.getBlockSize(), SPMC_ALIGN(BLOCK_SIZE));
  EXPECT_EQ(ringBuffer.getBlockCount(), BLOCK_COUNT);
  EXPECT_GT(ringBuffer.getMaxDataSize(), 0);
}

TEST(SpmcRingBuffer, GetMemSize) {
  int32_t expectedSize = SpmcRingBuffer::HEADER_SIZE + (SPMC_ALIGN(BLOCK_SIZE) * BLOCK_COUNT);
  EXPECT_EQ(SpmcRingBuffer::getMemSize(BLOCK_SIZE, BLOCK_COUNT), expectedSize);

  // Verify alignment is applied
  EXPECT_EQ(
      SpmcRingBuffer::getMemSize(17, 5), // 17 should align to 20
      SpmcRingBuffer::HEADER_SIZE + (20 * 5));
}

TEST(SpmcRingBuffer, SingleWriteRead) {
  initTestBuffer();

  MemoryAccessor mem = getTestMemoryAccessor();
  SpmcRingBuffer ringBuffer(mem, 0);
  SpmcRingBufferIterator iter;

  EXPECT_FALSE(iter.hasNext(&ringBuffer));
  EXPECT_FALSE(iter.hasMissedEntries(&ringBuffer));

  // Write a single value
  int32_t testValue = 12345;
  bool writeResult = ringBuffer.write(sizeof(int32_t), [&](MemoryAccessor accessor) {
    MemoryOffset pos;
    accessor.writeValue<int32_t>(testValue, pos);
  });
  EXPECT_TRUE(writeResult);

  // Verify iterator sees the entry
  EXPECT_TRUE(iter.hasNext(&ringBuffer));
  EXPECT_FALSE(iter.hasMissedEntries(&ringBuffer));

  // Read the value
  int32_t readValue = 0;
  bool readResult = iter.readNext(&ringBuffer, [&](MemoryAccessor accessor) {
    MemoryOffset pos;
    readValue = accessor.readValue<int32_t>(pos);
  });
  EXPECT_TRUE(readResult);
  EXPECT_EQ(readValue, testValue);

  // No more entries
  EXPECT_FALSE(iter.hasNext(&ringBuffer));
}

TEST(SpmcRingBuffer, MultipleWriteRead) {
  initTestBuffer();

  MemoryAccessor mem = getTestMemoryAccessor();
  SpmcRingBuffer ringBuffer(mem, 0);
  SpmcRingBufferIterator iter;

  // Write multiple values
  for (int32_t i = 0; i < 5; ++i) {
    bool writeResult = ringBuffer.write(sizeof(int32_t), [&](MemoryAccessor accessor) {
      MemoryOffset pos;
      accessor.writeValue<int32_t>(i * 100, pos);
    });
    EXPECT_TRUE(writeResult);
  }

  // Read all values
  for (int32_t i = 0; i < 5; ++i) {
    EXPECT_TRUE(iter.hasNext(&ringBuffer));

    int32_t readValue = 0;
    bool readResult = iter.readNext(&ringBuffer, [&](MemoryAccessor accessor) {
      MemoryOffset pos;
      readValue = accessor.readValue<int32_t>(pos);
    });
    EXPECT_TRUE(readResult);
    EXPECT_EQ(readValue, i * 100);
  }

  EXPECT_FALSE(iter.hasNext(&ringBuffer));
}

TEST(SpmcRingBuffer, MultiBlockEntry) {
  initTestBuffer();

  MemoryAccessor mem = getTestMemoryAccessor();
  SpmcRingBuffer ringBuffer(mem, 0);
  SpmcRingBufferIterator iter;

  // Write data that spans multiple blocks
  // Each block has BLOCK_SIZE - BLOCK_HEADER_SIZE = 28 bytes of data capacity
  // For multi-block: first block has 28 bytes, subsequent blocks have BLOCK_SIZE each
  constexpr int32_t largeDataSize = 64; // Should require 2-3 blocks
  std::vector<uint8_t> writeData(largeDataSize);
  for (size_t i = 0; i < writeData.size(); ++i) {
    writeData[i] = static_cast<uint8_t>(i & 0xFF);
  }

  bool writeResult = ringBuffer.write(
      largeDataSize, [&](MemoryAccessor accessor) { accessor.copyFrom(writeData.data()); });
  EXPECT_TRUE(writeResult);

  // Read the data back
  std::vector<uint8_t> readData(largeDataSize);
  bool readResult = iter.readNext(&ringBuffer, [&](MemoryAccessor accessor) {
    for (size_t i = 0; i < largeDataSize; ++i) {
      MemoryOffset pos;
      pos.offset_ = static_cast<int32_t>(i);
      readData[i] = accessor.readValue<uint8_t>(pos);
    }
  });
  EXPECT_TRUE(readResult);

  // Verify data matches
  for (size_t i = 0; i < largeDataSize; ++i) {
    EXPECT_EQ(readData[i], writeData[i]) << "Mismatch at index " << i;
  }
}

TEST(SpmcRingBuffer, Wraparound) {
  initTestBuffer();

  MemoryAccessor mem = getTestMemoryAccessor();
  SpmcRingBuffer ringBuffer(mem, 0);
  SpmcRingBufferIterator iter;

  // Fill the buffer to near capacity, then write one more to force wrap
  constexpr int32_t dataSize = 20; // Fits in one block

  // Write entries until we've wrapped
  for (int32_t i = 0; i < BLOCK_COUNT + 2; ++i) {
    bool writeResult = ringBuffer.write(dataSize, [&](MemoryAccessor accessor) {
      MemoryOffset pos;
      accessor.writeValue<int32_t>(i, pos);
    });
    EXPECT_TRUE(writeResult);
  }

  // Iterator should detect missed entries (old data was evicted)
  EXPECT_TRUE(iter.hasNext(&ringBuffer));
  EXPECT_TRUE(iter.hasMissedEntries(&ringBuffer));

  // Read remaining entries
  int32_t readCount = 0;
  while (iter.hasNext(&ringBuffer)) {
    int32_t readValue = 0;
    iter.readNext(&ringBuffer, [&](MemoryAccessor accessor) {
      MemoryOffset pos;
      readValue = accessor.readValue<int32_t>(pos);
    });
    readCount++;
  }

  // Should have read some entries (not all original ones due to eviction)
  EXPECT_GT(readCount, 0);
  EXPECT_LT(readCount, BLOCK_COUNT + 2);
}

TEST(SpmcRingBuffer, Eviction) {
  initTestBuffer();

  MemoryAccessor mem = getTestMemoryAccessor();
  SpmcRingBuffer ringBuffer(mem, 0);
  SpmcRingBufferIterator iter;

  // Write enough entries to cause eviction
  for (int32_t i = 0; i < BLOCK_COUNT * 2; ++i) {
    bool writeResult = ringBuffer.write(sizeof(int32_t), [&](MemoryAccessor accessor) {
      MemoryOffset pos;
      accessor.writeValue<int32_t>(i, pos);
    });
    EXPECT_TRUE(writeResult);
  }

  // Iterator should have missed entries
  EXPECT_TRUE(iter.hasMissedEntries(&ringBuffer));

  // Read what's available - should be the more recent entries
  std::vector<int32_t> readValues;
  while (iter.hasNext(&ringBuffer)) {
    iter.readNext(&ringBuffer, [&](MemoryAccessor accessor) {
      MemoryOffset pos;
      readValues.push_back(accessor.readValue<int32_t>(pos));
    });
  }

  // Verify we got the most recent entries
  EXPECT_FALSE(readValues.empty());
  // The last value should be the last written value
  EXPECT_EQ(readValues.back(), BLOCK_COUNT * 2 - 1);
}

TEST(SpmcRingBuffer, MissedEntriesDetection) {
  initTestBuffer();

  MemoryAccessor mem = getTestMemoryAccessor();
  SpmcRingBuffer ringBuffer(mem, 0);
  SpmcRingBufferIterator iter;

  // Write one entry and read it
  ringBuffer.write(sizeof(int32_t), [](MemoryAccessor accessor) {
    MemoryOffset pos;
    accessor.writeValue<int32_t>(1, pos);
  });

  iter.readNext(&ringBuffer, [](MemoryAccessor) {});
  EXPECT_FALSE(iter.hasMissedEntries(&ringBuffer));

  // Now write enough to cause eviction of the iterator's position
  for (int32_t i = 0; i < BLOCK_COUNT + 5; ++i) {
    ringBuffer.write(sizeof(int32_t), [&](MemoryAccessor accessor) {
      MemoryOffset pos;
      accessor.writeValue<int32_t>(i + 100, pos);
    });
  }

  // Iterator should now detect missed entries
  EXPECT_TRUE(iter.hasMissedEntries(&ringBuffer));
}

TEST(SpmcRingBuffer, MultipleConsumers) {
  initTestBuffer();

  MemoryAccessor mem = getTestMemoryAccessor();
  SpmcRingBuffer ringBuffer(mem, 0);

  SpmcRingBufferIterator iter1;
  SpmcRingBufferIterator iter2;

  // Write some entries
  for (int32_t i = 0; i < 5; ++i) {
    ringBuffer.write(sizeof(int32_t), [&](MemoryAccessor accessor) {
      MemoryOffset pos;
      accessor.writeValue<int32_t>(i, pos);
    });
  }

  // Both iterators should see all entries
  EXPECT_TRUE(iter1.hasNext(&ringBuffer));
  EXPECT_TRUE(iter2.hasNext(&ringBuffer));

  // Read with iter1
  std::vector<int32_t> values1;
  while (iter1.hasNext(&ringBuffer)) {
    iter1.readNext(&ringBuffer, [&](MemoryAccessor accessor) {
      MemoryOffset pos;
      values1.push_back(accessor.readValue<int32_t>(pos));
    });
  }

  // iter2 should still see all entries
  EXPECT_TRUE(iter2.hasNext(&ringBuffer));

  // Read with iter2
  std::vector<int32_t> values2;
  while (iter2.hasNext(&ringBuffer)) {
    iter2.readNext(&ringBuffer, [&](MemoryAccessor accessor) {
      MemoryOffset pos;
      values2.push_back(accessor.readValue<int32_t>(pos));
    });
  }

  // Both should have read the same values
  EXPECT_EQ(values1.size(), values2.size());
  for (size_t i = 0; i < values1.size(); ++i) {
    EXPECT_EQ(values1[i], values2[i]);
  }
}

TEST(SpmcRingBuffer, SetToEnd) {
  initTestBuffer();

  MemoryAccessor mem = getTestMemoryAccessor();
  SpmcRingBuffer ringBuffer(mem, 0);
  SpmcRingBufferIterator iter;

  // Write some entries
  for (int32_t i = 0; i < 5; ++i) {
    ringBuffer.write(sizeof(int32_t), [&](MemoryAccessor accessor) {
      MemoryOffset pos;
      accessor.writeValue<int32_t>(i, pos);
    });
  }

  EXPECT_TRUE(iter.hasNext(&ringBuffer));

  // Skip to end
  iter.setToEnd(&ringBuffer);

  // Should have nothing to read now
  EXPECT_FALSE(iter.hasNext(&ringBuffer));
  EXPECT_FALSE(iter.hasMissedEntries(&ringBuffer));

  // Write more entries
  ringBuffer.write(sizeof(int32_t), [](MemoryAccessor accessor) {
    MemoryOffset pos;
    accessor.writeValue<int32_t>(100, pos);
  });

  // Now there should be something to read
  EXPECT_TRUE(iter.hasNext(&ringBuffer));

  int32_t readValue = 0;
  iter.readNext(&ringBuffer, [&](MemoryAccessor accessor) {
    MemoryOffset pos;
    readValue = accessor.readValue<int32_t>(pos);
  });
  EXPECT_EQ(readValue, 100);
}

TEST(SpmcRingBuffer, WriteTooLarge) {
  initTestBuffer();

  MemoryAccessor mem = getTestMemoryAccessor();
  SpmcRingBuffer ringBuffer(mem, 0);

  // Try to write data larger than max capacity
  int32_t maxSize = ringBuffer.getMaxDataSize();
  bool writeResult = ringBuffer.write(maxSize + 100, [](MemoryAccessor) {
    // Should never be called
    FAIL() << "Callback should not be called for oversized write";
  });

  EXPECT_FALSE(writeResult);
}

TEST(SpmcRingBuffer, WriteZeroSize) {
  initTestBuffer();

  MemoryAccessor mem = getTestMemoryAccessor();
  SpmcRingBuffer ringBuffer(mem, 0);

  bool writeResult = ringBuffer.write(
      0, [](MemoryAccessor) { FAIL() << "Callback should not be called for zero-size write"; });

  EXPECT_FALSE(writeResult);
}

TEST(SpmcRingBuffer, WriteNegativeSize) {
  initTestBuffer();

  MemoryAccessor mem = getTestMemoryAccessor();
  SpmcRingBuffer ringBuffer(mem, 0);

  bool writeResult = ringBuffer.write(-1, [](MemoryAccessor) {
    FAIL() << "Callback should not be called for negative-size write";
  });

  EXPECT_FALSE(writeResult);
}

TEST(SpmcRingBuffer, NullBuffer) {
  SpmcRingBuffer nullBuffer;
  EXPECT_TRUE(nullBuffer.isNull());

  bool writeResult = nullBuffer.write(
      10, [](MemoryAccessor) { FAIL() << "Callback should not be called for null buffer write"; });
  EXPECT_FALSE(writeResult);
}

TEST(SpmcRingBuffer, WraparoundWithMultiBlock) {
  initTestBuffer();

  MemoryAccessor mem = getTestMemoryAccessor();
  SpmcRingBuffer ringBuffer(mem, 0);
  SpmcRingBufferIterator iter;

  // Fill most of the buffer with single-block entries
  for (int32_t i = 0; i < BLOCK_COUNT - 2; ++i) {
    ringBuffer.write(sizeof(int32_t), [&](MemoryAccessor accessor) {
      MemoryOffset pos;
      accessor.writeValue<int32_t>(i, pos);
    });
  }

  // Now write a multi-block entry that needs to wrap
  constexpr int32_t multiBlockDataSize = 50;
  std::vector<uint8_t> writeData(multiBlockDataSize, 0xAB);

  bool writeResult = ringBuffer.write(
      multiBlockDataSize, [&](MemoryAccessor accessor) { accessor.copyFrom(writeData.data()); });
  EXPECT_TRUE(writeResult);

  // Skip to the last entry (the multi-block one)
  while (iter.hasNext(&ringBuffer)) {
    uint8_t firstByte = 0;
    iter.readNext(&ringBuffer, [&](MemoryAccessor accessor) {
      MemoryOffset pos;
      firstByte = accessor.readValue<uint8_t>(pos);
    });

    // If this was the multi-block entry, verify first byte
    if (firstByte == 0xAB) {
      // We found our multi-block entry
      break;
    }
  }
}
