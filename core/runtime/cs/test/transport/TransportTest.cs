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

namespace TransportTest
{

    class FooTypeReader : ObjectAccessorInterface
    {
        private MemoryOffset _readOffset = new();

        public static readonly ulong aChangedBit = 1;
        public static readonly ulong bChangedBit = 2;

        public static readonly int aByteCount = 4;
        public static readonly int bByteCount = 4;

        public FooTypeReader() { }

        public FooTypeReader(MemoryAccessor memAccessor)
        {
            SetAccessor(memAccessor);
        }

        public int GetA()
        {
            return _memAccessor.ReadInt(_readOffset);
        }

        public float GetB()
        {
            return _memAccessor.ReadFloat(_readOffset);
        }
    }

    class FooTypeWriter : FooTypeReader
    {
        private MemoryOffset _writeOffset = new();

        public static FooTypeWriter Create(
            TransportStreamAccessor accessor,
            int collectionId,
            ObjectUuid id,
            int changeByteCount = 8,
            ulong timestamp = 0)
        {
            var changeEvent = accessor.WriteChangeEvent<CollectionChangeEventAccessor>(
                (int)CollectionChangeType.CreateObject, changeByteCount, timestamp);
            changeEvent.SetCollectionId(collectionId);
            changeEvent.SetObjectId(id);
            return new FooTypeWriter(changeEvent.AccessChangeData());
        }

        public static FooTypeWriter Update(
            TransportStreamAccessor accessor,
            int collectionId,
            ObjectUuid id,
            ulong fieldsChanged,
            int changeByteCount)
        {
            var changeEvent = accessor.WriteChangeEvent<CollectionUpdateChangeEventAccessor>(
                (int)CollectionChangeType.UpdateObject, changeByteCount);
            changeEvent.SetCollectionId(collectionId);
            changeEvent.SetObjectId(id);
            changeEvent.SetFieldsChanged(fieldsChanged);
            return new FooTypeWriter(changeEvent.AccessChangeData());
        }

        public FooTypeWriter() { }

        public FooTypeWriter(MemoryAccessor memAccessor) : base(memAccessor) { }

        public void SetA(int value)
        {
            _memAccessor.WriteInt(value, _writeOffset);
        }

        public void SetB(float value)
        {
            _memAccessor.WriteFloat(value, _writeOffset);
        }
    }

    class BarTypeReader : ObjectAccessorInterface
    {
        private MemoryOffset _readOffset = new();

        public static readonly ulong cChangedBit = 1;
        public static readonly ulong strChangedBit = 2;

        public static readonly int cByteCount = 8;

        public BarTypeReader() { }

        public BarTypeReader(MemoryAccessor memAccessor)
        {
            SetAccessor(memAccessor);
        }

        public ulong GetC()
        {
            return _memAccessor.ReadUlong(_readOffset);
        }

        public string GetStr()
        {
            return _memAccessor.ReadString(_readOffset);
        }
    }

    class BarTypeWriter : BarTypeReader
    {
        private MemoryOffset _writeOffset = new();

        public static BarTypeWriter Create(
            TransportStreamAccessor accessor,
            int collectionId,
            ObjectUuid id,
            int changeByteCount,
            ulong timestamp = 0)
        {
            var changeEvent = accessor.WriteChangeEvent<CollectionChangeEventAccessor>(
                (int)CollectionChangeType.CreateObject, changeByteCount, timestamp);
            changeEvent.SetCollectionId(collectionId);
            changeEvent.SetObjectId(id);
            return new BarTypeWriter(changeEvent.AccessChangeData());
        }

        public static BarTypeWriter Update(
            TransportStreamAccessor accessor,
            int collectionId,
            ObjectUuid id,
            ulong fieldsChanged,
            int changeByteCount)
        {
            var changeEvent = accessor.WriteChangeEvent<CollectionUpdateChangeEventAccessor>(
                (int)CollectionChangeType.UpdateObject, changeByteCount);
            changeEvent.SetCollectionId(collectionId);
            changeEvent.SetObjectId(id);
            changeEvent.SetFieldsChanged(fieldsChanged);
            return new BarTypeWriter(changeEvent.AccessChangeData());
        }

        public BarTypeWriter() { }

        public BarTypeWriter(MemoryAccessor memAccessor) : base(memAccessor) { }

        public void SetC(ulong value)
        {
            _memAccessor.WriteUlong(value, _writeOffset);
        }

        public void SetStr(string value)
        {
            _memAccessor.WriteString(value, _writeOffset);
        }
    }

    public class TransportTest
    {
        static readonly ObjectUuid foo1ID = new(0, 100);
        static readonly ObjectUuid foo2ID = new(0, 200);
        static readonly ObjectUuid foo3ID = new(0, 300);

        static readonly ObjectUuid bar1ID = new(1, 100);
        static readonly ObjectUuid bar2ID = new(1, 200);

        public void RunTransportObjectTests(TransportStream readerTransport, TransportStream writerTransport)
        {
            var readerIter = readerTransport.CreateIterator();

            // create foo1
            writerTransport.Transact(1, (writer) =>
            {
                var foo1 = FooTypeWriter.Create(writer, 0, foo1ID);
                Assert.AreEqual(foo1.IsNull(), false);
                foo1.SetA(10);
                foo1.SetB(45.2f);
            });
            readerTransport.Transact(1, (reader) =>
            {
                var entry = new CollectionChangeEventAccessor(readerIter.GetNextEntry(reader));
                Assert.AreEqual(entry.IsNull(), false);
                Assert.AreEqual(entry.GetChangeType(), (int)CollectionChangeType.CreateObject);
                Assert.AreEqual(entry.GetObjectId(), foo1ID);
                Assert.AreEqual(entry.GetCollectionId(), 0);
                var foo1 = new FooTypeReader(entry.AccessChangeData());
                Assert.AreEqual(foo1.GetA(), 10);
                Assert.AreEqual(foo1.GetB(), 45.2f, 0.0001f);
            });

            // create bar1
            writerTransport.Transact(1, (writer) =>
            {
                var bar1 = BarTypeWriter.Create(writer, 1, bar1ID, BarTypeReader.cByteCount + 4 + MemoryAccessor.DynSizeOfString("Hello"));
                Assert.AreEqual(bar1.IsNull(), false);
                bar1.SetC(15);
                bar1.SetStr("Hello");
            });
            readerTransport.Transact(1, (reader) =>
            {
                var entry = new CollectionChangeEventAccessor(readerIter.GetNextEntry(reader));
                Assert.AreEqual(entry.IsNull(), false);
                Assert.AreEqual(entry.GetChangeType(), (int)CollectionChangeType.CreateObject);
                Assert.AreEqual(entry.GetObjectId(), bar1ID);
                Assert.AreEqual(entry.GetCollectionId(), 1);
                var bar1 = new BarTypeReader(entry.AccessChangeData());
                Assert.AreEqual(bar1.GetC(), 15);
                Assert.AreEqual(bar1.GetStr(), "Hello");
            });

            // create foo2
            writerTransport.Transact(1, (writer) =>
            {
                var foo2 = FooTypeWriter.Create(writer, 0, foo2ID);
                Assert.AreEqual(foo2.IsNull(), false);
                foo2.SetA(500);
                foo2.SetB(17f);
            });
            readerTransport.Transact(1, (reader) =>
            {
                var entry = new CollectionChangeEventAccessor(readerIter.GetNextEntry(reader));
                Assert.AreEqual(entry.IsNull(), false);
                Assert.AreEqual(entry.GetChangeType(), (int)CollectionChangeType.CreateObject);
                Assert.AreEqual(entry.GetObjectId(), foo2ID);
                Assert.AreEqual(entry.GetCollectionId(), 0);
                var foo2 = new FooTypeReader(entry.AccessChangeData());
                Assert.AreEqual(foo2.GetA(), 500);
                Assert.AreEqual(foo2.GetB(), 17f);
            });
        }
    }

} // namespace TransportTest
