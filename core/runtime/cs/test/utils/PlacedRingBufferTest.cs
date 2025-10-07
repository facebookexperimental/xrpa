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
using System.Diagnostics;
using System.IO;
using Xrpa;

[TestFixture]
public class PlacedRingBufferTest
{
    private static readonly int INT_COUNT = 100;
    private static readonly int BUFFER_SIZE = INT_COUNT * (PlacedRingBuffer.ELEMENT_HEADER_SIZE + 4);

    private AllocatedMemory _memory;
    private PlacedRingBuffer _testRingBuffer;
    private PlacedRingBuffer _testRingBuffer2;

    [OneTimeSetUp]
    public void SetUp()
    {
        int memSize = PlacedRingBuffer.GetMemSize(BUFFER_SIZE);
        Assert.AreEqual(memSize, 24 + BUFFER_SIZE);

        _memory = new AllocatedMemory(memSize);
    }

    [OneTimeTearDown]
    public void TearDown()
    {
        _memory.Dispose();
    }

    // order matters
    private static void AssertRingBufferEquals(PlacedRingBuffer testRingBuffer, int start, int end)
    {
        int mul = end < start ? -1 : 1;
        Assert.AreEqual(testRingBuffer.Count, 1 + mul * (end - start));
        for (int i = 0; i < testRingBuffer.Count; ++i)
        {
            Assert.AreEqual(testRingBuffer.GetAt(i).ReadInt(new MemoryOffset(0)), start + i * mul);
        }
    }

    [SetUp]
    public void Init()
    {
        _testRingBuffer = new PlacedRingBuffer(_memory.Accessor, 0);
        _testRingBuffer.Init(BUFFER_SIZE);

        _testRingBuffer2 = new PlacedRingBuffer(_memory.Accessor, 0);

        Assert.AreEqual(_testRingBuffer.PoolSize, BUFFER_SIZE);
        Assert.AreEqual(_testRingBuffer.Count, 0);
        Assert.AreEqual(_testRingBuffer.StartID, 0);
        Assert.AreEqual(_testRingBuffer.StartOffset, 0);
        Assert.AreEqual(_testRingBuffer.PrewrapOffset, BUFFER_SIZE);

        Assert.AreEqual(_testRingBuffer2.PoolSize, BUFFER_SIZE);
        Assert.AreEqual(_testRingBuffer2.Count, 0);
        Assert.AreEqual(_testRingBuffer2.StartID, 0);
        Assert.AreEqual(_testRingBuffer2.StartOffset, 0);
        Assert.AreEqual(_testRingBuffer2.PrewrapOffset, BUFFER_SIZE);
    }

    [Test]
    public void TestBasicOperations()
    {
        int id = 0;

        // fill the buffer
        for (int i = 0; i < INT_COUNT; ++i)
        {
            _testRingBuffer.Push(4, ref id).WriteInt(i, new MemoryOffset(0));
            Assert.AreEqual(_testRingBuffer.GetAt(i).ReadInt(new MemoryOffset(0)), i);
            Assert.AreEqual(_testRingBuffer2.GetAt(i).ReadInt(new MemoryOffset(0)), i);
        }

        Assert.AreEqual(_testRingBuffer.Count, INT_COUNT);
        Assert.AreEqual(_testRingBuffer2.Count, INT_COUNT);
        AssertRingBufferEquals(_testRingBuffer, 0, INT_COUNT - 1);
        AssertRingBufferEquals(_testRingBuffer2, 0, INT_COUNT - 1);
        Assert.AreEqual(_testRingBuffer.GetIndexForID(0), 0);
        Assert.AreEqual(_testRingBuffer2.GetIndexForID(0), 0);
        Assert.AreEqual(_testRingBuffer.GetIndexForID(1), 1);
        Assert.AreEqual(_testRingBuffer2.GetIndexForID(1), 1);
        Assert.AreEqual(_testRingBuffer.GetIndexForID(2), 2);
        Assert.AreEqual(_testRingBuffer2.GetIndexForID(2), 2);
        Assert.AreEqual(_testRingBuffer.GetIndexForID(3), 3);
        Assert.AreEqual(_testRingBuffer2.GetIndexForID(3), 3);

        // additional push should wrap
        _testRingBuffer.Push(4, ref id).WriteInt(INT_COUNT, new MemoryOffset(0));
        Assert.AreEqual(_testRingBuffer.Count, INT_COUNT);
        Assert.AreEqual(_testRingBuffer2.Count, INT_COUNT);
        AssertRingBufferEquals(_testRingBuffer, 1, INT_COUNT);
        AssertRingBufferEquals(_testRingBuffer2, 1, INT_COUNT);

        // shift oldest one out
        Assert.AreEqual(_testRingBuffer.Shift().ReadInt(new MemoryOffset(0)), 1);
        Assert.AreEqual(_testRingBuffer.Count, INT_COUNT - 1);
        Assert.AreEqual(_testRingBuffer2.Count, INT_COUNT - 1);
        AssertRingBufferEquals(_testRingBuffer, 2, INT_COUNT);
        AssertRingBufferEquals(_testRingBuffer2, 2, INT_COUNT);

        // verify that the index returned for IDs that have been removed/overwritten is 0,
        // and that the index for IDs in the buffer is correct
        Assert.AreEqual(_testRingBuffer.GetIndexForID(0), 0);
        Assert.AreEqual(_testRingBuffer2.GetIndexForID(0), 0);
        Assert.AreEqual(_testRingBuffer.GetIndexForID(1), 0);
        Assert.AreEqual(_testRingBuffer2.GetIndexForID(1), 0);
        Assert.AreEqual(_testRingBuffer.GetIndexForID(2), 0);
        Assert.AreEqual(_testRingBuffer2.GetIndexForID(2), 0);
        Assert.AreEqual(_testRingBuffer.GetIndexForID(3), 1);
        Assert.AreEqual(_testRingBuffer2.GetIndexForID(3), 1);

        Assert.AreEqual(_testRingBuffer.GetAt(_testRingBuffer.GetIndexForID(3)).ReadInt(new MemoryOffset(0)), 3);
        Assert.AreEqual(_testRingBuffer2.GetAt(_testRingBuffer2.GetIndexForID(3)).ReadInt(new MemoryOffset(0)), 3);

        // additional push should not wrap now that there is room
        _testRingBuffer.Push(4, ref id).WriteInt(INT_COUNT + 1, new MemoryOffset(0));

        Assert.AreEqual(_testRingBuffer.Count, INT_COUNT);
        Assert.AreEqual(_testRingBuffer2.Count, INT_COUNT);
        AssertRingBufferEquals(_testRingBuffer, 2, INT_COUNT + 1);
        AssertRingBufferEquals(_testRingBuffer2, 2, INT_COUNT + 1);

        // now shift everything out
        for (int i = 0; i < INT_COUNT; ++i)
        {
            Assert.AreEqual(_testRingBuffer.Count, INT_COUNT - i);
            Assert.AreEqual(_testRingBuffer2.Count, INT_COUNT - i);
            AssertRingBufferEquals(_testRingBuffer, 2 + i, INT_COUNT + 1);
            AssertRingBufferEquals(_testRingBuffer2, 2 + i, INT_COUNT + 1);

            Assert.AreEqual(_testRingBuffer.Shift().ReadInt(new MemoryOffset(0)), 2 + i);
        }

        Assert.AreEqual(_testRingBuffer.Count, 0);
        Assert.AreEqual(_testRingBuffer2.Count, 0);

        // additional shift should return null
        Assert.IsTrue(_testRingBuffer.Shift().IsNull());
        Assert.IsTrue(_testRingBuffer2.Shift().IsNull());
        Assert.AreEqual(_testRingBuffer.Count, 0);
        Assert.AreEqual(_testRingBuffer2.Count, 0);
    }

    [Test]
    public void TestMixedSizes()
    {
        int id = 0;

        _testRingBuffer.Push(396, ref id).WriteInt(0, new MemoryOffset(0));
        Assert.AreEqual(_testRingBuffer.Count, 1);
        Assert.AreEqual(_testRingBuffer.StartID, 0);
        Assert.AreEqual(_testRingBuffer.PrewrapOffset, 800);

        _testRingBuffer.Push(196, ref id).WriteInt(0, new MemoryOffset(0));
        Assert.AreEqual(_testRingBuffer.Count, 2);
        Assert.AreEqual(_testRingBuffer.StartID, 0);
        Assert.AreEqual(_testRingBuffer.PrewrapOffset, 800);

        _testRingBuffer.Push(396, ref id).WriteInt(0, new MemoryOffset(0));
        Assert.AreEqual(_testRingBuffer.Count, 2);
        Assert.AreEqual(_testRingBuffer.StartID, 1);
        Assert.AreEqual(_testRingBuffer.PrewrapOffset, 600);
    }

    [Test]
    public void TestIterator()
    {
        PlacedRingBufferIterator iter = new();
        int id = 0;

        iter.SetToEnd(_testRingBuffer);
        Assert.AreEqual(iter.HasMissedEntries(_testRingBuffer), false);
        Assert.AreEqual(iter.HasNext(_testRingBuffer), false);

        // push a value in
        _testRingBuffer.Push(396, ref id).WriteInt(10, new MemoryOffset(0));
        Assert.AreEqual(_testRingBuffer.Count, 1);
        Assert.AreEqual(_testRingBuffer.StartID, 0);
        Assert.AreEqual(_testRingBuffer.PrewrapOffset, 800);
        Assert.AreEqual(iter.HasMissedEntries(_testRingBuffer), false);
        Assert.AreEqual(iter.HasNext(_testRingBuffer), true);

        // get the value using the iterator
        {
            var mem = iter.Next(_testRingBuffer);
            Assert.AreEqual(mem.IsNull(), false);
            Assert.AreEqual(mem.ReadInt(new MemoryOffset(0)), 10);
        }
        Assert.AreEqual(iter.HasMissedEntries(_testRingBuffer), false);
        Assert.AreEqual(iter.HasNext(_testRingBuffer), false);

        // push another value in
        _testRingBuffer.Push(196, ref id).WriteInt(20, new MemoryOffset(0));
        Assert.AreEqual(_testRingBuffer.Count, 2);
        Assert.AreEqual(_testRingBuffer.StartID, 0);
        Assert.AreEqual(_testRingBuffer.PrewrapOffset, 800);
        Assert.AreEqual(iter.HasMissedEntries(_testRingBuffer), false);
        Assert.AreEqual(iter.HasNext(_testRingBuffer), true);

        // get the value using the iterator
        {
            var mem = iter.Next(_testRingBuffer);
            Assert.AreEqual(mem.IsNull(), false);
            Assert.AreEqual(mem.ReadInt(new MemoryOffset(0)), 20);
        }
        Assert.AreEqual(iter.HasMissedEntries(_testRingBuffer), false);
        Assert.AreEqual(iter.HasNext(_testRingBuffer), false);

        // overflow the iterator
        for (int i = 0; i < INT_COUNT; ++i)
        {
            _testRingBuffer.Push(20, ref id).WriteInt(0, new MemoryOffset(0));
        }
        Assert.AreEqual(iter.HasMissedEntries(_testRingBuffer), true);
        Assert.AreEqual(iter.HasNext(_testRingBuffer), true);
        iter.SetToEnd(_testRingBuffer);
        Assert.AreEqual(iter.HasMissedEntries(_testRingBuffer), false);
        Assert.AreEqual(iter.HasNext(_testRingBuffer), false);

        // shift everything out of the ring buffer
        while (_testRingBuffer.Count > 0)
        {
            _testRingBuffer.Shift();
        }
        Assert.AreEqual(iter.HasMissedEntries(_testRingBuffer), false);
        Assert.AreEqual(iter.HasNext(_testRingBuffer), false);

        // push a value into the ring buffer and remove it
        _testRingBuffer.Push(396, ref id).WriteInt(60, new MemoryOffset(0));
        _testRingBuffer.Shift();
        Assert.AreEqual(iter.HasMissedEntries(_testRingBuffer), true);
        Assert.AreEqual(iter.HasNext(_testRingBuffer), true);

        // reset the iterator so it is valid again
        iter.SetToEnd(_testRingBuffer);
        Assert.AreEqual(iter.HasMissedEntries(_testRingBuffer), false);
        Assert.AreEqual(iter.HasNext(_testRingBuffer), false);

        // insert another item into the ring buffer
        _testRingBuffer.Push(396, ref id).WriteInt(30, new MemoryOffset(0));
        Assert.AreEqual(_testRingBuffer.Count, 1);
        Assert.AreEqual(_testRingBuffer.StartID, 103);
        Assert.AreEqual(_testRingBuffer.PrewrapOffset, 800);
        Assert.AreEqual(iter.HasMissedEntries(_testRingBuffer), false);
        Assert.AreEqual(iter.HasNext(_testRingBuffer), true);

        // get the value using the iterator
        {
            var mem = iter.Next(_testRingBuffer);
            Assert.AreEqual(mem.IsNull(), false);
            Assert.AreEqual(mem.ReadInt(new MemoryOffset(0)), 30);
        }
        Assert.AreEqual(iter.HasMissedEntries(_testRingBuffer), false);
        Assert.AreEqual(iter.HasNext(_testRingBuffer), false);
    }
}
