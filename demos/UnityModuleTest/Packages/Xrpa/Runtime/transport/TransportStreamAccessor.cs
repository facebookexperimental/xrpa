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


namespace Xrpa
{

    public class ChangeEventAccessor : ObjectAccessorInterface
    {
        public static readonly int DS_SIZE = 8;

        public ChangeEventAccessor() { }

        public ChangeEventAccessor(MemoryAccessor memAccessor)
        {
            SetAccessor(memAccessor);
        }

        public virtual int GetByteCount()
        {
            return DS_SIZE;
        }

        public int GetChangeType()
        {
            return _memAccessor.ReadInt(new MemoryOffset(0));
        }

        public void SetChangeType(int type)
        {
            _memAccessor.WriteInt(type, new MemoryOffset(0));
        }

        public ulong GetTimestamp(ulong baseTimestampUs)
        {
            ulong timestampOffsetMs = (ulong)(_memAccessor.ReadInt(new MemoryOffset(4)));
            return baseTimestampUs + (timestampOffsetMs * 1000);
        }

        public void SetTimestamp(ulong timestampUs, ulong baseTimestampUs)
        {
            _memAccessor.WriteInt((int)((timestampUs - baseTimestampUs) / 1000), new MemoryOffset(4));
        }
    }

    public abstract class TransportStreamIteratorData
    {
    }

    public class TransportStreamAccessor
    {
        public TransportStreamAccessor(ulong baseTimestampUs, TransportStreamIteratorData iteratorData, System.Func<int, MemoryAccessor> eventAllocator)
        {
            _baseTimestampUs = baseTimestampUs;
            _iteratorData = iteratorData;
            _eventAllocator = eventAllocator;
        }

        public EventAccessor WriteChangeEvent<EventAccessor>(int changeType, int numBytes = 0, ulong timestampUs = 0) where EventAccessor : ChangeEventAccessor, new()
        {
            EventAccessor changeEvent = new();
            changeEvent.SetAccessor(_eventAllocator(changeEvent.GetByteCount() + numBytes));

            if (!changeEvent.IsNull())
            {
                changeEvent.SetChangeType(changeType);
                changeEvent.SetTimestamp((timestampUs != 0) ? timestampUs : TimeUtils.GetCurrentClockTimeMicroseconds(), _baseTimestampUs);
            }

            return changeEvent;
        }

        public void WritePrefilledChangeEvent(MemoryAccessor memAccessor, ulong timestampUs = 0)
        {
            var transportMem = _eventAllocator(memAccessor.Size);
            if (transportMem.IsNull())
            {
                return;
            }
            transportMem.CopyFrom(memAccessor);

            var changeEvent = new ChangeEventAccessor(transportMem);
            changeEvent.SetTimestamp((timestampUs != 0) ? timestampUs : TimeUtils.GetCurrentClockTimeMicroseconds(), _baseTimestampUs);
        }

        public ulong GetBaseTimestamp()
        {
            return _baseTimestampUs;
        }

        public IteratorData GetIteratorData<IteratorData>() where IteratorData : TransportStreamIteratorData
        {
            return _iteratorData as IteratorData;
        }

        private ulong _baseTimestampUs;
        private TransportStreamIteratorData _iteratorData;
        private System.Func<int, MemoryAccessor> _eventAllocator;
    }

}
