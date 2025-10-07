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

namespace DataStoreReconcilerTest
{

    class TestConstants
    {
        public const int NUM_CHANNELS = 2;
        public const int SAMPLE_RATE = 48000;
        public const int SAMPLES_PER_CALLBACK = 256;
    }

    class DSFooType_NumericMessage : ObjectAccessorInterface
    {
        private MemoryOffset _readOffset = new();
        private MemoryOffset _writeOffset = new();

        public DSFooType_NumericMessage() { }

        public DSFooType_NumericMessage(MemoryAccessor memAccessor)
        {
            SetAccessor(memAccessor);
        }

        public int GetNumber()
        {
            return _memAccessor.ReadInt(_readOffset);
        }

        public void SetNumber(int value)
        {
            _memAccessor.WriteInt(value, _writeOffset);
        }
    }

    class DSFooType_ResetMessage : ObjectAccessorInterface
    {
        public DSFooType_ResetMessage() { }

        public DSFooType_ResetMessage(MemoryAccessor memAccessor)
        {
            SetAccessor(memAccessor);
        }
    }

    class FooTypeReader : ObjectAccessorInterface
    {
        private MemoryOffset _readOffset = new();

        public const ulong aChangedBit = 1;
        public const ulong bChangedBit = 2;
        public const ulong revAChangedBit = 4;
        public const ulong revBChangedBit = 8;

        public const int AddMessage = 0;
        public const int ResetMessage = 1;
        public const int BounceMessage = 2;
        public const int SignalMessage = 3;

        public static readonly int aByteCount = 4;
        public static readonly int bByteCount = 4;
        public static readonly int revAByteCount = 4;
        public static readonly int revBByteCount = 4;

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

        public int GetRevA()
        {
            return _memAccessor.ReadInt(_readOffset);
        }

        public float GetRevB()
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

        public void SetRevA(int value)
        {
            _memAccessor.WriteInt(value, _writeOffset);
        }

        public void SetRevB(float value)
        {
            _memAccessor.WriteFloat(value, _writeOffset);
        }
    }

    class BarTypeReader : ObjectAccessorInterface
    {
        private MemoryOffset _readOffset = new();

        public const ulong cChangedBit = 1;
        public const ulong strChangedBit = 2;

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

    class FooTypeLocal : DataStoreObject, IDataStoreObjectAccessor<FooTypeReader>
    {
        public static readonly ulong INBOUND_FIELDS = FooTypeReader.aChangedBit | FooTypeReader.bChangedBit;

        public FooTypeLocal(
            ObjectUuid id,
            IObjectCollection collection,
            FooTypeReader value) : base(id, collection)
        {
            _signalData = new InboundSignalData<uint>(TestConstants.NUM_CHANNELS, TestConstants.SAMPLE_RATE);
            OnSignal(_signalData);
        }

        public int _a;
        public float _b;

        public int _myVal = 0;
        public int _resetCount = 0;
        public int _tickCount = 0;

        public InboundSignalData<uint> _signalData;
        private InboundSignalDataInterface _signalSignalHandler = null;

        public void TickXrpa()
        {
            _tickCount++;
        }

        public void ProcessDSUpdate(FooTypeReader value, ulong fieldsChanged)
        {
            if ((fieldsChanged & FooTypeReader.aChangedBit) != 0)
            {
                _a = value.GetA();
            }
            if ((fieldsChanged & FooTypeReader.bChangedBit) != 0)
            {
                _b = value.GetB();
            }
        }

        public void HandleXrpaDelete()
        {
        }

        public void SetRevA(int a)
        {
            localRevA = a;
            if ((_changeBits & FooTypeReader.revAChangedBit) == 0)
            {
                _changeBits |= FooTypeReader.revAChangedBit;
                _changeByteCount += FooTypeReader.revAByteCount;
            }
            if (!_hasNotifiedNeedsWrite)
            {
                _collection.NotifyObjectNeedsWrite(GetXrpaId());
                _hasNotifiedNeedsWrite = true;
            }
            _collection.SetDirty(GetXrpaId(), FooTypeReader.revAChangedBit);
        }

        public void SetRevB(float b)
        {
            localRevB = b;
            if ((_changeBits & FooTypeReader.revBChangedBit) == 0)
            {
                _changeBits |= FooTypeReader.revBChangedBit;
                _changeByteCount += FooTypeReader.revBByteCount;
            }
            if (!_hasNotifiedNeedsWrite)
            {
                _collection.NotifyObjectNeedsWrite(GetXrpaId());
                _hasNotifiedNeedsWrite = true;
            }
            _collection.SetDirty(GetXrpaId(), FooTypeReader.revBChangedBit);
        }

        public int GetRevA()
        {
            return localRevA;
        }

        public float GetRevB()
        {
            return localRevB;
        }

        public void SendAddMessage(int number)
        {
            var msg = new DSFooType_NumericMessage(_collection.SendMessage(
                GetXrpaId(), FooTypeReader.AddMessage, 4));
            msg.SetNumber(number);
        }

        public void SendResetMessage()
        {
            _collection.SendMessage(
                GetXrpaId(), FooTypeReader.ResetMessage, 0);
        }

        public void WriteDSChanges(TransportStreamAccessor accessor)
        {
            var objAccessor = FooTypeWriter.Update(accessor, GetCollectionId(), GetXrpaId(), _changeBits, _changeByteCount);
            if (objAccessor.IsNull())
            {
                return;
            }
            if ((_changeBits & FooTypeReader.revAChangedBit) != 0)
            {
                objAccessor.SetRevA(localRevA);
            }
            if ((_changeBits & FooTypeReader.revBChangedBit) != 0)
            {
                objAccessor.SetRevB(localRevB);
            }
            _changeBits = 0;
            _changeByteCount = 0;
            _hasNotifiedNeedsWrite = false;
        }

        public ulong PrepDSFullUpdate()
        {
            _changeBits = FooTypeReader.revAChangedBit | FooTypeReader.revBChangedBit;
            _changeByteCount = FooTypeReader.revAByteCount + FooTypeReader.revBByteCount;
            return 1;
        }

        public void OnSignal(InboundSignalDataInterface handler)
        {
            _signalSignalHandler = handler;
        }

        public void ProcessDSMessage(int messageType, ulong timestamp, MemoryAccessor messageData)
        {
            if (messageType == FooTypeReader.AddMessage)
            {
                DSFooType_NumericMessage msg = new(messageData);
                _myVal += msg.GetNumber();
            }
            if (messageType == FooTypeReader.ResetMessage)
            {
                _myVal = 0;
                _resetCount++;
            }
            if (messageType == FooTypeReader.BounceMessage)
            {
                DSFooType_NumericMessage bounceMessage = new(
                  _collection.SendMessage(GetXrpaId(), FooTypeReader.BounceMessage, 4));
                bounceMessage.SetNumber(-1);
            }
            if (messageType == FooTypeReader.SignalMessage && _signalSignalHandler != null)
            {
                _signalSignalHandler.OnSignalData(timestamp, messageData);
            }
        }

        private int localRevA = 0;
        private float localRevB = 0;
        private ulong _changeBits = 0;
        private int _changeByteCount = 0;
    }

    class BarTypeLocal : DataStoreObject, IDataStoreObjectAccessor<BarTypeReader>
    {
        public static readonly ulong INBOUND_FIELDS = BarTypeReader.cChangedBit | BarTypeReader.strChangedBit;

        public BarTypeLocal(
            ObjectUuid id,
            IObjectCollection collection,
            BarTypeReader value) : base(id, collection)
        {
        }

        public ulong _c = 0;
        public string _str = "";

        public void ProcessDSUpdate(BarTypeReader value, ulong fieldsChanged)
        {
            if ((fieldsChanged & BarTypeReader.cChangedBit) != 0)
            {
                _c = value.GetC();
            }
            if ((fieldsChanged & BarTypeReader.strChangedBit) != 0)
            {
                _str = value.GetStr();
            }
        }

        public void HandleXrpaDelete()
        {
        }

        public void WriteDSChanges(TransportStreamAccessor accessor)
        {
            // noop
        }

        public ulong PrepDSFullUpdate()
        {
            return 0;
        }

        public void ProcessDSMessage(int messageType, ulong timestamp, MemoryAccessor messageData)
        {
            // no message handlers
        }
    }

    class FooTypeLocalBinding : IIndexBoundType<FooTypeReader, FooTypeLocal>
    {
        public bool AddXrpaBinding(FooTypeLocal reconciledObj)
        {
            if (_reconciledObj == null)
            {
                _reconciledObj = reconciledObj;
                return true;
            }
            return false;
        }

        public void RemoveXrpaBinding(FooTypeLocal reconciledObj)
        {
            if (_reconciledObj == reconciledObj)
            {
                _reconciledObj = null;
            }
        }

        // public for assertion testing
        public FooTypeLocal _reconciledObj;
    }

    class FooInboundCollection : ObjectCollection<FooTypeReader, FooTypeLocal>
    {
        public FooInboundCollection(DataStoreReconciler reconciler)
            : base(
                  reconciler,
                  0,
                  FooTypeLocal.INBOUND_FIELDS,
                  ~0UL,
                  false)
        {
            _indexBinding = new();
        }

        public void SetCreateDelegate(CreateDelegateFunction createDelegate)
        {
            SetCreateDelegateInternal(createDelegate);
        }

        public void AddIndexedBinding(int indexValue, FooTypeLocalBinding localObj)
        {
            _indexBinding.AddLocalObject(indexValue, localObj);
        }

        public void RemoveIndexedBinding(int indexValue, FooTypeLocalBinding localObj)
        {
            _indexBinding.RemoveLocalObject(indexValue, localObj);
        }

        public ObjectCollectionIndex<FooTypeReader, FooTypeLocal, int> FooIndexedByA = new();

        protected ObjectCollectionIndexedBinding<FooTypeReader, FooTypeLocal, int, FooTypeLocalBinding> _indexBinding;

        protected override void IndexNotifyCreate(FooTypeLocal obj)
        {
            FooIndexedByA.OnCreate(obj, obj._a);
            _indexBinding.OnCreate(obj, obj._a);
        }

        protected override void IndexNotifyUpdate(FooTypeLocal obj, ulong fieldsChanged)
        {
            if ((fieldsChanged & FooTypeReader.aChangedBit) != 0)
            {
                FooIndexedByA.OnUpdate(obj, obj._a);
                _indexBinding.OnUpdate(obj, obj._a);
            }
        }

        protected override void IndexNotifyDelete(FooTypeLocal obj)
        {
            FooIndexedByA.OnDelete(obj, obj._a);
            _indexBinding.OnDelete(obj, obj._a);
        }
    }

    class BarInboundCollection : ObjectCollection<BarTypeReader, BarTypeLocal>
    {
        public BarInboundCollection(DataStoreReconciler reconciler)
            : base(
              reconciler,
              1,
              BarTypeLocal.INBOUND_FIELDS,
              0,
              false)
        { }

        public void SetCreateDelegate(CreateDelegateFunction createDelegate)
        {
            SetCreateDelegateInternal(createDelegate);
        }
    }

    class ReadTestDataStore : DataStoreReconciler
    {
        public ReadTestDataStore(TransportStream inboundTransport, TransportStream outboundTransport) : base(
          inboundTransport, outboundTransport, 4096)
        {
            FooType = new(this);
            RegisterCollection(FooType);

            BarType = new(this);
            RegisterCollection(BarType);

            FooType.SetCreateDelegate((id, source, collection) =>
            {
                return new FooTypeLocal(id, collection, source);
            });

            BarType.SetCreateDelegate((id, source, collection) =>
            {
                if (id != DataStoreReconcilerTest.theBarID)
                {
                    return null;
                }
                return new BarTypeLocal(id, collection, source);
            });
        }

        public readonly FooInboundCollection FooType;
        public readonly BarInboundCollection BarType;
    }

    class OutboundFooType : DataStoreObject, IDataStoreObjectAccessor<FooTypeReader>
    {
        public static readonly ulong INBOUND_FIELDS = FooTypeReader.revAChangedBit | FooTypeReader.revBChangedBit;

        public OutboundFooType(ObjectUuid id) : base(id, null)
        {
            _createTimestamp = TimeUtils.GetCurrentClockTimeMicroseconds();
        }

        public int _revA = 0;
        public float _revB = 0;
        public int _tickCount = 0;
        private OutboundSignalData _localSignal = new();

        public void SetA(int a)
        {
            localA = a;
            if ((_changeBits & FooTypeReader.aChangedBit) == 0)
            {
                _changeBits |= FooTypeReader.aChangedBit;
                _changeByteCount += FooTypeReader.aByteCount;
            }
            if (!_hasNotifiedNeedsWrite)
            {
                _collection.NotifyObjectNeedsWrite(GetXrpaId());
                _hasNotifiedNeedsWrite = true;
            }
            _collection.SetDirty(GetXrpaId(), FooTypeReader.aChangedBit);
        }

        public void SetB(float b)
        {
            localB = b;
            if ((_changeBits & FooTypeReader.bChangedBit) == 0)
            {
                _changeBits |= FooTypeReader.bChangedBit;
                _changeByteCount += FooTypeReader.bByteCount;
            }
            if (!_hasNotifiedNeedsWrite)
            {
                _collection.NotifyObjectNeedsWrite(GetXrpaId());
                _hasNotifiedNeedsWrite = true;
            }
            _collection.SetDirty(GetXrpaId(), FooTypeReader.bChangedBit);
        }

        public int GetA()
        {
            return localA;
        }

        public float GetB()
        {
            return localB;
        }

        public void SendAddMessage(int number)
        {
            var msg = new DSFooType_NumericMessage(_collection.SendMessage(
                GetXrpaId(), FooTypeReader.AddMessage, 4));
            msg.SetNumber(number);
        }

        public void SendResetMessage()
        {
            _collection.SendMessage(
                GetXrpaId(), FooTypeReader.ResetMessage, 0);
        }

        public void SetSignal<SampleType>(
            SignalProducerCallback<SampleType> signalCallback,
            int numChannels,
            int framesPerSecond,
            int framesPerPacket) where SampleType : unmanaged
        {
            _localSignal.SetSignalSource(signalCallback, numChannels, framesPerSecond, framesPerPacket);
        }

        public void SetSignal<SampleType>(
            SignalRingBuffer<SampleType> signalRingBuffer,
            int numChannels,
            int framesPerSecond,
            int framesPerPacket) where SampleType : unmanaged
        {
            _localSignal.SetSignalSource(signalRingBuffer, numChannels, framesPerSecond, framesPerPacket);
        }

        public void TickXrpa()
        {
            _tickCount++;
            var id = GetXrpaId();
            _localSignal.SetRecipient(id, _collection, FooTypeReader.SignalMessage);
            _localSignal.Tick();
        }

        public void WriteDSChanges(TransportStreamAccessor accessor)
        {
            FooTypeWriter objAccessor = null;
            if (!_createWritten)
            {
                objAccessor = FooTypeWriter.Create(accessor, GetCollectionId(), GetXrpaId(), _changeByteCount, _createTimestamp);
                _createWritten = true;
            }
            if (objAccessor == null || objAccessor.IsNull())
            {
                objAccessor = FooTypeWriter.Update(accessor, GetCollectionId(), GetXrpaId(), _changeBits, _changeByteCount);
            }
            if ((_changeBits & FooTypeReader.aChangedBit) != 0)
            {
                objAccessor.SetA(localA);
            }
            if ((_changeBits & FooTypeReader.bChangedBit) != 0)
            {
                objAccessor.SetB(localB);
            }
            _changeBits = 0;
            _changeByteCount = 0;
            _hasNotifiedNeedsWrite = false;
        }

        public ulong PrepDSFullUpdate()
        {
            _createWritten = false;
            _changeBits = FooTypeReader.aChangedBit | FooTypeReader.bChangedBit;
            _changeByteCount = FooTypeReader.aByteCount + FooTypeReader.bByteCount;
            return _createTimestamp;
        }

        public void ProcessDSUpdate(FooTypeReader value, ulong fieldsChanged)
        {
            if ((fieldsChanged & FooTypeReader.revAChangedBit) != 0)
            {
                _revA = value.GetRevA();
            }
            if ((fieldsChanged & FooTypeReader.revBChangedBit) != 0)
            {
                _revB = value.GetRevB();
            }
        }

        public void ProcessDSMessage(int messageType, ulong timestamp, MemoryAccessor messageData)
        {
            if (messageType == FooTypeReader.AddMessage)
            {
                DSFooType_NumericMessage msg = new(messageData);
                SetA(localA + msg.GetNumber());
            }
            else if (messageType == FooTypeReader.ResetMessage)
            {
                SetA(0);
            }
        }

        private int localA = 0;
        private float localB = 0;
        private ulong _createTimestamp;
        private ulong _changeBits = FooTypeReader.aChangedBit | FooTypeReader.bChangedBit;
        private int _changeByteCount = FooTypeReader.aByteCount + FooTypeReader.bByteCount;
        private bool _createWritten = false;
    }

    class FooOutboundCollection : ObjectCollection<FooTypeReader, OutboundFooType>
    {
        public FooOutboundCollection(DataStoreReconciler reconciler)
            : base(
                  reconciler,
                  0,
                  OutboundFooType.INBOUND_FIELDS,
                  FooTypeReader.aChangedBit,
                  true)
        { }

        public void AddObject(OutboundFooType obj)
        {
            AddObjectInternal(obj);
        }

        public void RemoveObject(ObjectUuid id)
        {
            RemoveObjectInternal(id);
        }

        public ObjectCollectionIndex<FooTypeReader, OutboundFooType, int> FooIndexedByA = new();

        protected override void IndexNotifyCreate(OutboundFooType obj)
        {
            FooIndexedByA.OnCreate(obj, obj.GetA());
        }

        protected override void IndexNotifyUpdate(OutboundFooType obj, ulong fieldsChanged)
        {
            if ((fieldsChanged & FooTypeReader.aChangedBit) != 0)
            {
                FooIndexedByA.OnUpdate(obj, obj.GetA());
            }
        }

        protected override void IndexNotifyDelete(OutboundFooType obj)
        {
            FooIndexedByA.OnDelete(obj, obj.GetA());
        }
    }

    class OutboundBarType : DataStoreObject, IDataStoreObjectAccessor<BarTypeReader>
    {
        public static readonly ulong INBOUND_FIELDS = 0;

        public OutboundBarType(ObjectUuid id) : base(id, null)
        {
            _createTimestamp = TimeUtils.GetCurrentClockTimeMicroseconds();
        }

        public void SetC(ulong c)
        {
            localC = c;
            if ((_changeBits & BarTypeReader.cChangedBit) == 0)
            {
                _changeBits |= BarTypeReader.cChangedBit;
                _changeByteCount += BarTypeReader.cByteCount;
            }
            if (!_hasNotifiedNeedsWrite)
            {
                _collection.NotifyObjectNeedsWrite(GetXrpaId());
                _hasNotifiedNeedsWrite = true;
            }
            _collection.SetDirty(GetXrpaId(), BarTypeReader.cChangedBit);
        }

        public void SetStr(string str)
        {
            localStr = str;
            if ((_changeBits & BarTypeReader.strChangedBit) == 0)
            {
                _changeBits |= BarTypeReader.strChangedBit;
                _changeByteCount += 4;
            }
            _changeByteCount += MemoryAccessor.DynSizeOfString(localStr);
            if (!_hasNotifiedNeedsWrite)
            {
                _collection.NotifyObjectNeedsWrite(GetXrpaId());
                _hasNotifiedNeedsWrite = true;
            }
            _collection.SetDirty(GetXrpaId(), BarTypeReader.strChangedBit);
        }

        public ulong GetC()
        {
            return localC;
        }

        public string GetStr()
        {
            return localStr;
        }

        public void WriteDSChanges(TransportStreamAccessor accessor)
        {
            BarTypeWriter objAccessor = null;
            if (!_createWritten)
            {
                _changeBits = BarTypeReader.cChangedBit | BarTypeReader.strChangedBit;
                _changeByteCount = BarTypeReader.cByteCount + 4 + MemoryAccessor.DynSizeOfString(localStr);
                objAccessor = BarTypeWriter.Create(accessor, GetCollectionId(), GetXrpaId(), _changeByteCount, _createTimestamp);
                _createWritten = true;
            }
            if (objAccessor == null || objAccessor.IsNull())
            {
                objAccessor = BarTypeWriter.Update(accessor, GetCollectionId(), GetXrpaId(), _changeBits, _changeByteCount);
            }
            if ((_changeBits & BarTypeReader.cChangedBit) != 0)
            {
                objAccessor.SetC(localC);
            }
            if ((_changeBits & BarTypeReader.strChangedBit) != 0)
            {
                objAccessor.SetStr(localStr);
            }
            _changeBits = 0;
            _changeByteCount = 0;
            _hasNotifiedNeedsWrite = false;
        }

        public ulong PrepDSFullUpdate()
        {
            _createWritten = false;
            _changeBits = BarTypeReader.cChangedBit | BarTypeReader.strChangedBit;
            _changeByteCount = BarTypeReader.cByteCount + 4 + MemoryAccessor.DynSizeOfString(localStr);
            return _createTimestamp;
        }

        public void ProcessDSUpdate(BarTypeReader value, ulong fieldsChanged)
        {
        }

        public void ProcessDSMessage(int messageType, ulong timestamp, MemoryAccessor messageData)
        {
        }

        private ulong localC = 0;
        private string localStr = "";
        private ulong _createTimestamp;
        private ulong _changeBits = 0;
        private int _changeByteCount = 0;
        private bool _createWritten = false;
    }

    class BarOutboundCollection : ObjectCollection<BarTypeReader, OutboundBarType>
    {
        public BarOutboundCollection(DataStoreReconciler reconciler)
            : base(
                  reconciler,
                  1,
                  OutboundBarType.INBOUND_FIELDS,
                  0,
                  true)
        { }

        public void AddObject(OutboundBarType obj)
        {
            AddObjectInternal(obj);
        }

        public void RemoveObject(ObjectUuid id)
        {
            RemoveObjectInternal(id);
        }
    }

    class WriteTestDataStore : DataStoreReconciler
    {
        public WriteTestDataStore(TransportStream inboundTransport, TransportStream outboundTransport) : base(
          inboundTransport, outboundTransport, 4096)
        {
            FooType = new(this);
            RegisterCollection(FooType);
            BarType = new(this);
            RegisterCollection(BarType);
        }

        public readonly FooOutboundCollection FooType;
        public readonly BarOutboundCollection BarType;
    }

    public class DataStoreReconcilerTest
    {
        static readonly ObjectUuid foo1ID = new ObjectUuid(0, 100);
        static readonly ObjectUuid foo2ID = new ObjectUuid(0, 200);
        static readonly ObjectUuid foo3ID = new ObjectUuid(0, 300);
        static readonly ObjectUuid myFooID = new ObjectUuid(0, 5000);

        static readonly ObjectUuid bar1ID = new ObjectUuid(1, 100);
        public static readonly ObjectUuid theBarID = new ObjectUuid(1, 200);

        private static void SignalGen(SignalChannelData<uint> dataOut, int sampleRate, ulong startSamplePos)
        {
            int frameCount = dataOut.GetFrameCount();
            for (int i = 0; i < dataOut.GetNumChannels(); ++i)
            {
                var channelData = dataOut.AccessChannelBuffer(i);
                for (int j = 0; j < frameCount; ++j)
                {
                    channelData[j] = (uint)(startSamplePos + (ulong)j);
                }
            }
        }

        private static void SignalGenRingBuffer(SignalRingBuffer<uint> ringBuffer, int frameCount)
        {
            uint[] interleavedSamples = new uint[frameCount * TestConstants.NUM_CHANNELS];
            int outIdx = 0;
            for (int frameIdx = 0; frameIdx < frameCount; ++frameIdx)
            {
                for (int channelIdx = 0; channelIdx < TestConstants.NUM_CHANNELS; ++channelIdx)
                {
                    interleavedSamples[outIdx] = (uint)frameIdx;
                    outIdx++;
                }
            }

            ringBuffer.Initialize(TestConstants.SAMPLE_RATE, 0, TestConstants.NUM_CHANNELS);
            ringBuffer.WriteInterleavedData(interleavedSamples, frameCount);
        }

        public void RunReadReconcilerTests(TransportStream readerInboundTransport, TransportStream readerOutboundTransport, TransportStream writerInboundTransport, TransportStream writerOutboundTransport)
        {
            var reader = new ReadTestDataStore(readerInboundTransport, readerOutboundTransport);
            var writer = new WriteTestDataStore(writerInboundTransport, writerOutboundTransport);

            // create objects
            {
                writer.TickInbound();

                var foo1 = new OutboundFooType(foo1ID);
                writer.FooType.AddObject(foo1);
                foo1.SetA(10);
                foo1.SetB(45.5f);

                var bar1 = new OutboundBarType(bar1ID);
                writer.BarType.AddObject(bar1);
                bar1.SetC(15);
                bar1.SetStr("Hello World!");
                Assert.AreEqual(bar1.GetStr(), "Hello World!");

                writer.TickOutbound();
            }

            // tick reader, verify InboundFooCollection received only the foo1 create
            {
                reader.TickInbound();

                Assert.AreEqual(reader.FooType.Count, 1);
                var foo1Obj = reader.FooType.GetObject(foo1ID);
                Assert.AreEqual(foo1Obj._a, 10);
                Assert.AreEqual(foo1Obj._b, 45.5f);
                Assert.AreEqual(reader.BarType.Count, 0);

                reader.TickOutbound();
            }

            // update objects
            {
                writer.TickInbound();

                var foo1 = writer.FooType.GetObject(foo1ID);
                foo1.SetB(75);

                var bar1 = writer.BarType.GetObject(bar1ID);
                bar1.SetC(32);

                writer.TickOutbound();
            }

            // tick reader, verify InboundFooCollection received the foo1 update
            {
                reader.TickInbound();

                Assert.AreEqual(reader.FooType.Count, 1);
                var foo1Obj = reader.FooType.GetObject(foo1ID);
                Assert.AreEqual(foo1Obj._a, 10);
                Assert.AreEqual(foo1Obj._b, 75);
                Assert.AreEqual(reader.BarType.Count, 0);

                reader.TickOutbound();
            }

            // create TheBar
            {
                writer.TickInbound();

                var TheBar = new OutboundBarType(theBarID);
                writer.BarType.AddObject(TheBar);
                TheBar.SetC(32);
                TheBar.SetStr("Hello World!");

                writer.TickOutbound();
            }

            // tick reader, verify TheBarReconciler got the update
            {
                reader.TickInbound();

                Assert.AreEqual(reader.FooType.Count, 1);
                var foo1Obj = reader.FooType.GetObject(foo1ID);
                Assert.AreEqual(foo1Obj._a, 10);
                Assert.AreEqual(foo1Obj._b, 75);
                Assert.AreEqual(reader.BarType.Count, 1);
                var theBarObj = reader.BarType.GetObject(theBarID);
                Assert.AreEqual(theBarObj._c, 32);
                Assert.AreEqual(theBarObj._str, "Hello World!");

                reader.TickOutbound();
            }

            // update TheBar
            {
                writer.TickInbound();

                var TheBar = writer.BarType.GetObject(theBarID);
                TheBar.SetC(92);

                // try a long string
                TheBar.SetStr("1234567890123456789012345678901234567890123456789012345678901234567890");

                writer.TickOutbound();
            }

            // tick reader, verify TheBarReconciler got the update
            {
                reader.TickInbound();

                Assert.AreEqual(reader.FooType.Count, 1);
                var foo1Obj = reader.FooType.GetObject(foo1ID);
                Assert.AreEqual(foo1Obj._a, 10);
                Assert.AreEqual(foo1Obj._b, 75);
                Assert.AreEqual(reader.BarType.Count, 1);
                var theBarObj = reader.BarType.GetObject(theBarID);
                Assert.AreEqual(theBarObj._c, 92);
                Assert.AreEqual(theBarObj._str, "1234567890123456789012345678901234567890123456789012345678901234567890");

                reader.TickOutbound();
            }

            // delete objects
            {
                writer.TickInbound();

                writer.FooType.RemoveObject(foo1ID);
                writer.BarType.RemoveObject(bar1ID);
                writer.BarType.RemoveObject(theBarID);

                writer.TickOutbound();
            }

            // tick reader, verify collections saw the deletes properly
            {
                reader.TickInbound();

                Assert.AreEqual(reader.FooType.Count, 0);
                Assert.AreEqual(reader.BarType.Count, 0);

                reader.TickOutbound();
            }

            // put some objects back in, for testing index-reconciliation mark/sweep
            {
                writer.TickInbound();

                var foo1 = new OutboundFooType(foo1ID);
                writer.FooType.AddObject(foo1);

                var foo2 = new OutboundFooType(foo2ID);
                writer.FooType.AddObject(foo2);

                var foo3 = new OutboundFooType(foo3ID);
                writer.FooType.AddObject(foo3);
                foo3.SetA(15);

                var TheBar = new OutboundBarType(theBarID);
                writer.BarType.AddObject(TheBar);
                TheBar.SetC(17);

                writer.TickOutbound();
            }

            {
                reader.TickInbound();

                Assert.AreEqual(reader.FooType.Count, 3);
                Assert.AreEqual(reader.BarType.Count, 1);
                var theBarObj = reader.BarType.GetObject(theBarID);
                Assert.AreEqual(theBarObj._c, 17);

                reader.TickOutbound();
            }

            // write some changes but don't consume them from the reader yet
            {
                writer.TickInbound();

                Assert.AreEqual(writer.FooType.Count, 3);

                writer.FooType.RemoveObject(foo1ID);
                writer.FooType.RemoveObject(foo2ID);

                var TheBar = writer.BarType.GetObject(theBarID);
                TheBar.SetC(25);

                writer.TickOutbound();
            }

            // write lots of stuff, overflowing the changelog ring buffer
            writerOutboundTransport.Transact(1, (TransportStreamAccessor writer) =>
            {
                var writerIter = writerOutboundTransport.CreateIterator();
                Assert.AreEqual(writerIter.HasMissedEntries(writer), true);

                // make sure the writes above this get pushed out of the ring buffer, so that they are forced to
                // be reconciled through a FullUpdate
                for (int i = 0; !writerIter.HasMissedEntries(writer); ++i)
                {
                    var obj = FooTypeWriter.Create(writer, 0, new ObjectUuid(3, (ulong)i));
                    Assert.AreEqual(obj.IsNull(), false);
                }
                var foo3 = FooTypeWriter.Update(writer, 0, foo3ID, FooTypeReader.bChangedBit, FooTypeReader.bByteCount);
                Assert.AreEqual(foo3.IsNull(), false);
                foo3.SetB(20);
            });
            {
                var foo3 = writer.FooType.GetObject(foo3ID);
                foo3.SetB(20);
                writer.TickOutbound();
            }

            // tick reader to trigger RequestFullUpdate, then tick writer to send the full update
            {
                reader.TickInbound();
                reader.TickOutbound();
                writer.TickInbound();
                writer.TickOutbound();
            }

            // verify the reader applies the full update (including the changes that were written but
            // overflowed out of the changelog)
            {
                reader.TickInbound();

                Assert.AreEqual(reader.FooType.Count, 1);
                var foo3Obj = reader.FooType.GetObject(foo3ID);
                Assert.AreEqual(foo3Obj._a, 15);
                Assert.AreEqual(foo3Obj._b, 20);
                Assert.AreEqual(reader.BarType.Count, 1);
                var theBarObj = reader.BarType.GetObject(theBarID);
                Assert.AreEqual(theBarObj._c, 25);

                reader.TickOutbound();
            }

            // write a create, update, and delete to the same object
            {
                writer.TickInbound();

                var myFoo = new OutboundFooType(myFooID);
                writer.FooType.AddObject(myFoo);
                myFoo.SetB(75);
                writer.FooType.RemoveObject(myFooID);

                writer.TickOutbound();
            }

            // tick reader, verify it handled the deleted object properly during the create/update
            // reconciliation
            {
                reader.TickInbound();

                Assert.AreEqual(reader.FooType.Count, 1);
                var foo3Obj = reader.FooType.GetObject(foo3ID);
                Assert.AreEqual(foo3Obj._a, 15);
                Assert.AreEqual(foo3Obj._b, 20);
                Assert.AreEqual(reader.BarType.Count, 1);
                var theBarObj = reader.BarType.GetObject(theBarID);
                Assert.AreEqual(theBarObj._c, 25);

                reader.TickOutbound();
            }

            // send some messages
            {
                writer.TickInbound();

                var foo1 = new OutboundFooType(foo1ID);
                writer.FooType.AddObject(foo1);

                var foo2 = new OutboundFooType(foo2ID);
                writer.FooType.AddObject(foo2);

                var foo3 = writer.FooType.GetObject(foo3ID);

                foo1.SendAddMessage(1);
                foo2.SendAddMessage(2);
                foo3.SendAddMessage(3);
                foo3.SendResetMessage();

                writer.TickOutbound();
            }

            // tick reader, verify messages were handled
            {
                reader.TickInbound();

                var foo1Obj = reader.FooType.GetObject(foo1ID);
                Assert.AreEqual(foo1Obj._myVal, 1);
                var foo2Obj = reader.FooType.GetObject(foo2ID);
                Assert.AreEqual(foo2Obj._myVal, 2);
                var foo3Obj = reader.FooType.GetObject(foo3ID);
                Assert.AreEqual(foo3Obj._myVal, 0);

                reader.TickOutbound();
            }
        }

        public delegate Tuple<TransportStream, TransportStream> MakeWriterDelegate();

        public void RunReadReconcilerInterruptTests(TransportStream readerInboundTransport, TransportStream readerOutboundTransport, MakeWriterDelegate makeWriterTransport)
        {
            var writerTransports = makeWriterTransport();
            var writer = new WriteTestDataStore(writerTransports.Item1, writerTransports.Item2);
            writer.TickInbound();
            writer.TickOutbound();

            var reader = new ReadTestDataStore(readerInboundTransport, readerOutboundTransport);

            // create objects
            {
                writer.TickInbound();

                var foo1 = new OutboundFooType(foo1ID);
                writer.FooType.AddObject(foo1);
                foo1.SetA(10);
                foo1.SetB(45.5f);

                writer.TickOutbound();
            }

            // tick reader, verify fooReconciler received the foo1 create
            {
                reader.TickInbound();

                Assert.AreEqual(reader.FooType.Count, 1);
                var foo1Obj = reader.FooType.GetObject(foo1ID);
                Assert.AreEqual(foo1Obj._a, 10);
                Assert.AreEqual(foo1Obj._b, 45.5f);

                reader.TickOutbound();
            }

            // shutdown writer
            writer = null;
            writerTransports.Item1.Dispose();
            writerTransports.Item2.Dispose();
            writerTransports = null;

            // create new writer
            writerTransports = makeWriterTransport();
            writer = new WriteTestDataStore(writerTransports.Item1, writerTransports.Item2);
            writer.TickInbound();
            writer.TickOutbound();

            // tick reader, verify the writer cleared all Foo objects out
            reader.TickInbound();
            Assert.AreEqual(reader.FooType.Count, 0);

            // shutdown writer
            writer = null;
            writerTransports.Item1.Dispose();
            writerTransports.Item2.Dispose();
            writerTransports = null;
        }

        public void RunWriteReconcilerTests(TransportStream readerInboundTransport, TransportStream readerOutboundTransport, TransportStream writerInboundTransport, TransportStream writerOutboundTransport)
        {
            var reader = new ReadTestDataStore(readerInboundTransport, readerOutboundTransport);
            var writer = new WriteTestDataStore(writerInboundTransport, writerOutboundTransport);

            {
                writer.TickInbound();

                var foo1 = new OutboundFooType(foo1ID);
                writer.FooType.AddObject(foo1);
                foo1.SetA(10);
                foo1.SetB(15.0f);

                var foo2 = new OutboundFooType(foo2ID);
                writer.FooType.AddObject(foo2);
                foo2.SetA(5);
                foo2.SetB(37.0f);

                writer.TickOutbound();
            }

            {
                reader.TickInbound();

                Assert.AreEqual(reader.FooType.Count, 2);
                var foo1Obj = reader.FooType.GetObject(foo1ID);
                Assert.AreEqual(foo1Obj._a, 10);
                Assert.AreEqual(foo1Obj._b, 15f);
                var foo2Obj = reader.FooType.GetObject(foo2ID);
                Assert.AreEqual(foo2Obj._a, 5);
                Assert.AreEqual(foo2Obj._b, 37f);

                foo1Obj.SendAddMessage(10);

                reader.TickOutbound();
            }

            {
                writer.TickInbound();
                writer.FooType.RemoveObject(foo2ID);
                writer.TickOutbound();
            }
        }

        public void RunReverseReconciledFieldsTests(TransportStream readerInboundTransport, TransportStream readerOutboundTransport, TransportStream writerInboundTransport, TransportStream writerOutboundTransport)
        {
            var reader = new ReadTestDataStore(readerInboundTransport, readerOutboundTransport);
            var writer = new WriteTestDataStore(writerInboundTransport, writerOutboundTransport);

            {
                writer.TickInbound();

                var foo1 = new OutboundFooType(foo1ID);
                writer.FooType.AddObject(foo1);
                foo1.SetA(10);
                foo1.SetB(15);

                writer.TickOutbound();
            }

            {
                reader.TickInbound();

                Assert.AreEqual(reader.FooType.Count, 1);
                var foo1Obj = reader.FooType.GetObject(foo1ID);
                Assert.AreEqual(foo1Obj._a, 10);
                Assert.AreEqual(foo1Obj._b, 15);
                foo1Obj.SetRevA(-4);
                foo1Obj.SetRevB(-25);

                reader.TickOutbound();
            }

            {
                writer.TickInbound();

                var foo1 = writer.FooType.GetObject(foo1ID);
                Assert.AreEqual(foo1._revA, -4);
                Assert.AreEqual(foo1._revB, -25);

                writer.TickOutbound();
            }

            {
                reader.TickInbound();

                var foo1Obj = reader.FooType.GetObject(foo1ID);
                foo1Obj.SetRevA(72);
                foo1Obj.SetRevB(-15);

                reader.TickOutbound();
            }

            {
                writer.TickInbound();

                var foo1 = writer.FooType.GetObject(foo1ID);
                Assert.AreEqual(foo1._revA, 72);
                Assert.AreEqual(foo1._revB, -15);

                writer.TickOutbound();
            }
        }

        public void RunSignalTransportTests(
            TransportStream readerInboundTransport,
            TransportStream readerOutboundTransport,
            TransportStream writerInboundTransport,
            TransportStream writerOutboundTransport,
            bool fromRingBuffer)
        {
            var reader = new ReadTestDataStore(readerInboundTransport, readerOutboundTransport);
            var writer = new WriteTestDataStore(writerInboundTransport, writerOutboundTransport);

            var foo1 = new OutboundFooType(foo1ID);
            writer.FooType.AddObject(foo1);
            var ringBuffer = new SignalRingBuffer<uint>();
            if (fromRingBuffer)
            {
                SignalGenRingBuffer(ringBuffer, TestConstants.SAMPLES_PER_CALLBACK * 2);
                foo1.SetSignal<uint>(ringBuffer, TestConstants.NUM_CHANNELS, TestConstants.SAMPLE_RATE, TestConstants.SAMPLES_PER_CALLBACK);
            }
            else
            {
                foo1.SetSignal<uint>(SignalGen, TestConstants.NUM_CHANNELS, TestConstants.SAMPLE_RATE, TestConstants.SAMPLES_PER_CALLBACK);
            }
            Assert.AreEqual(foo1._tickCount, 0);
            writer.TickInbound();
            writer.TickOutbound();
            Assert.AreEqual(foo1._tickCount, 1);

            reader.TickInbound();
            reader.TickOutbound();
            Assert.AreEqual(reader.FooType.Count, 1);

            var signalData = reader.FooType.GetObject(foo1ID)._signalData;
            var frameCount = signalData.GetReadFramesAvailable();
            uint[] data = new uint[frameCount * TestConstants.NUM_CHANNELS];
            signalData.ReadInterleavedData(data, frameCount);
            Assert.GreaterOrEqual(frameCount, TestConstants.SAMPLES_PER_CALLBACK);
            for (int i = 0; i < data.Length; ++i)
            {
                Assert.AreEqual(data[i], (uint)Math.Floor(i / 2.0f));
            }
        }

        public void RunIndexingTests(TransportStream readerInboundTransport, TransportStream readerOutboundTransport, TransportStream writerInboundTransport, TransportStream writerOutboundTransport)
        {
            var reader = new ReadTestDataStore(readerInboundTransport, readerOutboundTransport);
            var writer = new WriteTestDataStore(writerInboundTransport, writerOutboundTransport);

            // add a binding before the target exists
            var fooBind1 = new FooTypeLocalBinding();
            reader.FooType.AddIndexedBinding(4, fooBind1);
            Assert.AreEqual(fooBind1._reconciledObj, null);

            // add objects
            var foo1 = new OutboundFooType(foo1ID);
            writer.FooType.AddObject(foo1);
            foo1.SetA(4);
            var foo2 = new OutboundFooType(foo2ID);
            writer.FooType.AddObject(foo2);
            foo2.SetA(4);
            var foo3 = new OutboundFooType(foo3ID);
            writer.FooType.AddObject(foo3);
            foo3.SetA(2);

            // verify they indexed correctly
            Assert.AreEqual(writer.FooType.FooIndexedByA.GetIndexedObjects(4).Count, 2);
            Assert.AreEqual(writer.FooType.FooIndexedByA.GetIndexedObjects(2).Count, 1);
            Assert.AreEqual(writer.FooType.FooIndexedByA.GetIndexedObjects(1).Count, 0);
            writer.TickInbound();
            writer.TickOutbound();
            reader.TickInbound();
            reader.TickOutbound();
            Assert.AreEqual(reader.FooType.Count, 3);
            Assert.AreEqual(reader.FooType.FooIndexedByA.GetIndexedObjects(4).Count, 2);
            Assert.AreEqual(reader.FooType.FooIndexedByA.GetIndexedObjects(2).Count, 1);
            Assert.AreEqual(reader.FooType.FooIndexedByA.GetIndexedObjects(1).Count, 0);
            Assert.AreNotEqual(fooBind1._reconciledObj, foo1);
            Assert.AreEqual(fooBind1._reconciledObj.GetXrpaId(), foo1ID);

            // add a new binding after the target exists
            var fooBind2 = new FooTypeLocalBinding();
            reader.FooType.AddIndexedBinding(4, fooBind2);
            Assert.AreNotEqual(fooBind2._reconciledObj, null);
            Assert.AreEqual(fooBind2._reconciledObj.GetXrpaId(), foo1ID);

            // change an indexed value
            foo1.SetA(2);

            // verify the object reindexed
            Assert.AreEqual(writer.FooType.FooIndexedByA.GetIndexedObjects(4).Count, 1);
            Assert.AreEqual(writer.FooType.FooIndexedByA.GetIndexedObjects(2).Count, 2);
            Assert.AreEqual(writer.FooType.FooIndexedByA.GetIndexedObjects(2)[1].GetXrpaId(), foo1ID);
            writer.TickInbound();
            writer.TickOutbound();
            reader.TickInbound();
            reader.TickOutbound();
            Assert.AreEqual(reader.FooType.Count, 3);
            Assert.AreEqual(reader.FooType.FooIndexedByA.GetIndexedObjects(4).Count, 1);
            Assert.AreEqual(reader.FooType.FooIndexedByA.GetIndexedObjects(2).Count, 2);
            Assert.AreEqual(reader.FooType.FooIndexedByA.GetIndexedObjects(2)[1].GetXrpaId(), foo1ID);
            Assert.AreEqual(fooBind1._reconciledObj, null);
            Assert.AreEqual(fooBind2._reconciledObj, null);

            // delete an indexed object
            writer.FooType.RemoveObject(foo2ID);

            // verify the object reindexed
            Assert.AreEqual(writer.FooType.FooIndexedByA.GetIndexedObjects(4).Count, 0);
            Assert.AreEqual(writer.FooType.FooIndexedByA.GetIndexedObjects(2).Count, 2);
            writer.TickInbound();
            writer.TickOutbound();
            reader.TickInbound();
            reader.TickOutbound();
            Assert.AreEqual(reader.FooType.Count, 2);
            Assert.AreEqual(reader.FooType.FooIndexedByA.GetIndexedObjects(4).Count, 0);
            Assert.AreEqual(reader.FooType.FooIndexedByA.GetIndexedObjects(2).Count, 2);
        }

    }
} // namespace DataStoreReconcilerTest
