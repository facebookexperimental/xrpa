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

using NUnit.Framework;
using System;
using System.Collections.Generic;
using Xrpa;

[TestFixture]
public class SpmcRingBufferTest
{
    private static readonly int BLOCK_SIZE = 32; // 28 bytes of data per block
    private static readonly int BLOCK_COUNT = 10;
    // HEADER_SIZE (24) + (Align(32) * 10) = 24 + 320 = 344
    private static readonly int BUFFER_SIZE = SpmcRingBuffer.HEADER_SIZE + (Align(BLOCK_SIZE) * BLOCK_COUNT);

    private AllocatedMemory _memory;

    private static int Align(int x)
    {
        return (x + 3) & ~3;
    }

    [OneTimeSetUp]
    public void SetUp()
    {
        _memory = new AllocatedMemory(BUFFER_SIZE);
    }

    [OneTimeTearDown]
    public void TearDown()
    {
        _memory.Dispose();
    }

    private SpmcRingBuffer CreateAndInitRingBuffer()
    {
        var ringBuffer = new SpmcRingBuffer(_memory.Accessor, 0);
        ringBuffer.Init(BLOCK_SIZE, BLOCK_COUNT);
        return ringBuffer;
    }

    [Test]
    public void TestInitialization()
    {
        var ringBuffer = CreateAndInitRingBuffer();

        Assert.IsFalse(ringBuffer.IsNull());
        Assert.AreEqual(Align(BLOCK_SIZE), ringBuffer.BlockSize);
        Assert.AreEqual(BLOCK_COUNT, ringBuffer.BlockCount);
        Assert.Greater(ringBuffer.MaxDataSize, 0);
    }

    [Test]
    public void TestGetMemSize()
    {
        int expectedSize = SpmcRingBuffer.HEADER_SIZE + (Align(BLOCK_SIZE) * BLOCK_COUNT);
        Assert.AreEqual(expectedSize, SpmcRingBuffer.GetMemSize(BLOCK_SIZE, BLOCK_COUNT));

        // Verify alignment is applied
        Assert.AreEqual(
            SpmcRingBuffer.HEADER_SIZE + (20 * 5), // 17 should align to 20
            SpmcRingBuffer.GetMemSize(17, 5));
    }

    [Test]
    public void TestSingleWriteRead()
    {
        var ringBuffer = CreateAndInitRingBuffer();
        var iter = new SpmcRingBufferIterator();

        Assert.IsFalse(iter.HasNext(ringBuffer));
        Assert.IsFalse(iter.HasMissedEntries(ringBuffer));

        // Write a single value
        int testValue = 12345;
        bool writeResult = ringBuffer.Write(sizeof(int), accessor =>
        {
            accessor.WriteInt(testValue, new MemoryOffset(0));
        });
        Assert.IsTrue(writeResult);

        // Verify iterator sees the entry
        Assert.IsTrue(iter.HasNext(ringBuffer));
        Assert.IsFalse(iter.HasMissedEntries(ringBuffer));

        // Read the value
        int readValue = 0;
        bool readResult = iter.ReadNext(ringBuffer, accessor =>
        {
            readValue = accessor.ReadInt(new MemoryOffset(0));
        });
        Assert.IsTrue(readResult);
        Assert.AreEqual(testValue, readValue);

        // No more entries
        Assert.IsFalse(iter.HasNext(ringBuffer));
    }

    [Test]
    public void TestMultipleWriteRead()
    {
        var ringBuffer = CreateAndInitRingBuffer();
        var iter = new SpmcRingBufferIterator();

        // Write multiple values
        for (int i = 0; i < 5; ++i)
        {
            int value = i * 100;
            bool writeResult = ringBuffer.Write(sizeof(int), accessor =>
            {
                accessor.WriteInt(value, new MemoryOffset(0));
            });
            Assert.IsTrue(writeResult);
        }

        // Read all values
        for (int i = 0; i < 5; ++i)
        {
            Assert.IsTrue(iter.HasNext(ringBuffer));

            int readValue = 0;
            bool readResult = iter.ReadNext(ringBuffer, accessor =>
            {
                readValue = accessor.ReadInt(new MemoryOffset(0));
            });
            Assert.IsTrue(readResult);
            Assert.AreEqual(i * 100, readValue);
        }

        Assert.IsFalse(iter.HasNext(ringBuffer));
    }

    [Test]
    public void TestMultiBlockEntry()
    {
        var ringBuffer = CreateAndInitRingBuffer();
        var iter = new SpmcRingBufferIterator();

        // Write data that spans multiple blocks
        // Each block has BLOCK_SIZE - BLOCK_HEADER_SIZE = 28 bytes of data capacity
        // For multi-block: first block has 28 bytes, subsequent blocks have BLOCK_SIZE each
        int largeDataSize = 64; // Should require 2-3 blocks
        byte[] writeData = new byte[largeDataSize];
        for (int i = 0; i < writeData.Length; ++i)
        {
            writeData[i] = (byte)(i & 0xFF);
        }

        bool writeResult = ringBuffer.Write(largeDataSize, accessor =>
        {
            for (int i = 0; i < largeDataSize; ++i)
            {
                accessor.WriteByte(writeData[i], new MemoryOffset(i));
            }
        });
        Assert.IsTrue(writeResult);

        // Read the data back
        byte[] readData = new byte[largeDataSize];
        bool readResult = iter.ReadNext(ringBuffer, accessor =>
        {
            for (int i = 0; i < largeDataSize; ++i)
            {
                readData[i] = accessor.ReadByte(new MemoryOffset(i));
            }
        });
        Assert.IsTrue(readResult);

        // Verify data matches
        for (int i = 0; i < largeDataSize; ++i)
        {
            Assert.AreEqual(writeData[i], readData[i], $"Mismatch at index {i}");
        }
    }

    [Test]
    public void TestWraparound()
    {
        var ringBuffer = CreateAndInitRingBuffer();
        var iter = new SpmcRingBufferIterator();

        // Fill the buffer to near capacity, then write one more to force wrap
        int dataSize = 20; // Fits in one block

        // Write entries until we've wrapped
        for (int i = 0; i < BLOCK_COUNT + 2; ++i)
        {
            int value = i;
            bool writeResult = ringBuffer.Write(dataSize, accessor =>
            {
                accessor.WriteInt(value, new MemoryOffset(0));
            });
            Assert.IsTrue(writeResult);
        }

        // Iterator should detect missed entries (old data was evicted)
        Assert.IsTrue(iter.HasNext(ringBuffer));
        Assert.IsTrue(iter.HasMissedEntries(ringBuffer));

        // Read remaining entries
        int readCount = 0;
        while (iter.HasNext(ringBuffer))
        {
            int readValue = 0;
            iter.ReadNext(ringBuffer, accessor =>
            {
                readValue = accessor.ReadInt(new MemoryOffset(0));
            });
            readCount++;
        }

        // Should have read some entries (not all original ones due to eviction)
        Assert.Greater(readCount, 0);
        Assert.Less(readCount, BLOCK_COUNT + 2);
    }

    [Test]
    public void TestEviction()
    {
        var ringBuffer = CreateAndInitRingBuffer();
        var iter = new SpmcRingBufferIterator();

        // Write enough entries to cause eviction
        for (int i = 0; i < BLOCK_COUNT * 2; ++i)
        {
            int value = i;
            bool writeResult = ringBuffer.Write(sizeof(int), accessor =>
            {
                accessor.WriteInt(value, new MemoryOffset(0));
            });
            Assert.IsTrue(writeResult);
        }

        // Iterator should have missed entries
        Assert.IsTrue(iter.HasMissedEntries(ringBuffer));

        // Read what's available - should be the more recent entries
        var readValues = new List<int>();
        while (iter.HasNext(ringBuffer))
        {
            iter.ReadNext(ringBuffer, accessor =>
            {
                readValues.Add(accessor.ReadInt(new MemoryOffset(0)));
            });
        }

        // Verify we got the most recent entries
        Assert.IsNotEmpty(readValues);
        // The last value should be the last written value
        Assert.AreEqual(BLOCK_COUNT * 2 - 1, readValues[readValues.Count - 1]);
    }

    [Test]
    public void TestMissedEntriesDetection()
    {
        var ringBuffer = CreateAndInitRingBuffer();
        var iter = new SpmcRingBufferIterator();

        // Write one entry and read it
        ringBuffer.Write(sizeof(int), accessor =>
        {
            accessor.WriteInt(1, new MemoryOffset(0));
        });

        iter.ReadNext(ringBuffer, accessor => { });
        Assert.IsFalse(iter.HasMissedEntries(ringBuffer));

        // Now write enough to cause eviction of the iterator's position
        for (int i = 0; i < BLOCK_COUNT + 5; ++i)
        {
            int value = i + 100;
            ringBuffer.Write(sizeof(int), accessor =>
            {
                accessor.WriteInt(value, new MemoryOffset(0));
            });
        }

        // Iterator should now detect missed entries
        Assert.IsTrue(iter.HasMissedEntries(ringBuffer));
    }

    [Test]
    public void TestMultipleConsumers()
    {
        var ringBuffer = CreateAndInitRingBuffer();
        var iter1 = new SpmcRingBufferIterator();
        var iter2 = new SpmcRingBufferIterator();

        // Write some entries
        for (int i = 0; i < 5; ++i)
        {
            int value = i;
            ringBuffer.Write(sizeof(int), accessor =>
            {
                accessor.WriteInt(value, new MemoryOffset(0));
            });
        }

        // Both iterators should see all entries
        Assert.IsTrue(iter1.HasNext(ringBuffer));
        Assert.IsTrue(iter2.HasNext(ringBuffer));

        // Read with iter1
        var values1 = new List<int>();
        while (iter1.HasNext(ringBuffer))
        {
            iter1.ReadNext(ringBuffer, accessor =>
            {
                values1.Add(accessor.ReadInt(new MemoryOffset(0)));
            });
        }

        // iter2 should still see all entries
        Assert.IsTrue(iter2.HasNext(ringBuffer));

        // Read with iter2
        var values2 = new List<int>();
        while (iter2.HasNext(ringBuffer))
        {
            iter2.ReadNext(ringBuffer, accessor =>
            {
                values2.Add(accessor.ReadInt(new MemoryOffset(0)));
            });
        }

        // Both should have read the same values
        Assert.AreEqual(values1.Count, values2.Count);
        for (int i = 0; i < values1.Count; ++i)
        {
            Assert.AreEqual(values1[i], values2[i]);
        }
    }

    [Test]
    public void TestSetToEnd()
    {
        var ringBuffer = CreateAndInitRingBuffer();
        var iter = new SpmcRingBufferIterator();

        // Write some entries
        for (int i = 0; i < 5; ++i)
        {
            int value = i;
            ringBuffer.Write(sizeof(int), accessor =>
            {
                accessor.WriteInt(value, new MemoryOffset(0));
            });
        }

        Assert.IsTrue(iter.HasNext(ringBuffer));

        // Skip to end
        iter.SetToEnd(ringBuffer);

        // Should have nothing to read now
        Assert.IsFalse(iter.HasNext(ringBuffer));
        Assert.IsFalse(iter.HasMissedEntries(ringBuffer));

        // Write more entries
        ringBuffer.Write(sizeof(int), accessor =>
        {
            accessor.WriteInt(100, new MemoryOffset(0));
        });

        // Now there should be something to read
        Assert.IsTrue(iter.HasNext(ringBuffer));

        int readValue = 0;
        iter.ReadNext(ringBuffer, accessor =>
        {
            readValue = accessor.ReadInt(new MemoryOffset(0));
        });
        Assert.AreEqual(100, readValue);
    }

    [Test]
    public void TestWriteTooLarge()
    {
        var ringBuffer = CreateAndInitRingBuffer();

        // Try to write data larger than max capacity
        int maxSize = ringBuffer.MaxDataSize;
        bool callbackCalled = false;
        bool writeResult = ringBuffer.Write(maxSize + 100, accessor =>
        {
            callbackCalled = true;
        });

        Assert.IsFalse(writeResult);
        Assert.IsFalse(callbackCalled);
    }

    [Test]
    public void TestWriteZeroSize()
    {
        var ringBuffer = CreateAndInitRingBuffer();

        bool callbackCalled = false;
        bool writeResult = ringBuffer.Write(0, accessor =>
        {
            callbackCalled = true;
        });

        Assert.IsFalse(writeResult);
        Assert.IsFalse(callbackCalled);
    }

    [Test]
    public void TestWriteNegativeSize()
    {
        var ringBuffer = CreateAndInitRingBuffer();

        bool callbackCalled = false;
        bool writeResult = ringBuffer.Write(-1, accessor =>
        {
            callbackCalled = true;
        });

        Assert.IsFalse(writeResult);
        Assert.IsFalse(callbackCalled);
    }

    [Test]
    public void TestNullBuffer()
    {
        var nullBuffer = new SpmcRingBuffer();
        Assert.IsTrue(nullBuffer.IsNull());

        bool callbackCalled = false;
        bool writeResult = nullBuffer.Write(10, accessor =>
        {
            callbackCalled = true;
        });
        Assert.IsFalse(writeResult);
        Assert.IsFalse(callbackCalled);
    }

    [Test]
    public void TestWraparoundWithMultiBlock()
    {
        var ringBuffer = CreateAndInitRingBuffer();
        var iter = new SpmcRingBufferIterator();

        // Fill most of the buffer with single-block entries
        for (int i = 0; i < BLOCK_COUNT - 2; ++i)
        {
            int value = i;
            ringBuffer.Write(sizeof(int), accessor =>
            {
                accessor.WriteInt(value, new MemoryOffset(0));
            });
        }

        // Now write a multi-block entry that needs to wrap
        int multiBlockDataSize = 50;
        byte[] writeData = new byte[multiBlockDataSize];
        for (int i = 0; i < multiBlockDataSize; ++i)
        {
            writeData[i] = 0xAB;
        }

        bool writeResult = ringBuffer.Write(multiBlockDataSize, accessor =>
        {
            for (int i = 0; i < multiBlockDataSize; ++i)
            {
                accessor.WriteByte(writeData[i], new MemoryOffset(i));
            }
        });
        Assert.IsTrue(writeResult);

        // Skip to the last entry (the multi-block one)
        while (iter.HasNext(ringBuffer))
        {
            byte firstByte = 0;
            iter.ReadNext(ringBuffer, accessor =>
            {
                firstByte = accessor.ReadByte(new MemoryOffset(0));
            });

            // If this was the multi-block entry, verify first byte
            if (firstByte == 0xAB)
            {
                // We found our multi-block entry
                break;
            }
        }
    }
}
