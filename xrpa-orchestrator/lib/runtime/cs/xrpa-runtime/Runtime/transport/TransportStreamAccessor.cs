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

        public int GetTimestamp()
        {
            return _memAccessor.ReadInt(new MemoryOffset(4));
        }

        public void SetTimestamp(int timestamp)
        {
            _memAccessor.WriteInt(timestamp, new MemoryOffset(4));
        }
    }

    public abstract class TransportStreamIteratorData
    {
    }

    public class TransportStreamAccessor
    {
        public TransportStreamAccessor(ulong baseTimestamp, TransportStreamIteratorData iteratorData, System.Func<int, MemoryAccessor> eventAllocator)
        {
            _baseTimestamp = baseTimestamp;
            _iteratorData = iteratorData;
            _eventAllocator = eventAllocator;
        }

        public EventAccessor WriteChangeEvent<EventAccessor>(int changeType, int numBytes = 0, ulong timestamp = 0) where EventAccessor : ChangeEventAccessor, new()
        {
            EventAccessor changeEvent = new();
            changeEvent.SetAccessor(_eventAllocator(changeEvent.GetByteCount() + numBytes));

            if (!changeEvent.IsNull())
            {
                changeEvent.SetChangeType(changeType);
                changeEvent.SetTimestamp((timestamp != 0) ? (int)(timestamp - _baseTimestamp) : GetCurrentTimestamp());
            }

            return changeEvent;
        }

        public int GetCurrentTimestamp()
        {
            return (int)(TimeUtils.GetCurrentClockTimeMicroseconds() - _baseTimestamp);
        }

        public IteratorData GetIteratorData<IteratorData>() where IteratorData : TransportStreamIteratorData
        {
            return _iteratorData as IteratorData;
        }

        private ulong _baseTimestamp;
        private TransportStreamIteratorData _iteratorData;
        private System.Func<int, MemoryAccessor> _eventAllocator;
    }

}
