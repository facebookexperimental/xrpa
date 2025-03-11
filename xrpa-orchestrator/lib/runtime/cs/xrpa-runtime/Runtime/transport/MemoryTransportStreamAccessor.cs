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

    public class MemoryTransportStreamAccessor
    {
        public static readonly int DS_SIZE = 52;

        private const int TRANSPORT_VERSION = 8; // conorwdickinson: unidirectional transport, no object store

        private MemoryAccessor _memSource;
        private MemoryAccessor _memAccessor;

        public MemoryTransportStreamAccessor(MemoryAccessor source)
        {
            _memSource = source;
            _memAccessor = source.Slice(0, DS_SIZE);
        }

        public int TransportVersion
        {
            get
            {
                return _memAccessor.ReadInt(new MemoryOffset(0));
            }
            set
            {
                _memAccessor.WriteInt(value, new MemoryOffset(0));
            }
        }

        public int TotalBytes
        {
            get
            {
                return _memAccessor.ReadInt(new MemoryOffset(4));
            }
            set
            {
                _memAccessor.WriteInt(value, new MemoryOffset(4));
            }
        }

        public HashValue SchemaHash
        {
            get
            {
                return HashValue.ReadValue(_memAccessor, new MemoryOffset(8));
            }
            set
            {
                HashValue.WriteValue(value, _memAccessor, new MemoryOffset(8));
            }
        }

        // System clock time in microseconds when the transport state was initialized; all other timestamps are
        // relative to this value.
        // Also indicates that the transport memory is initialized, as it is set last.
        public ulong BaseTimestamp
        {
            get
            {
                return _memAccessor.ReadUlong(new MemoryOffset(40));
            }
            set
            {
                _memAccessor.WriteUlong(value, new MemoryOffset(40));
            }
        }

        // this is the monotonically increasing ID value for the last entry written to the changelog;
        // readers can check this without locking the mutex to see if there have been changes
        public int LastChangelogID
        {
            get
            {
                return _memAccessor.ReadInt(new MemoryOffset(48));
            }
            set
            {
                _memAccessor.WriteInt(value, new MemoryOffset(48));
            }
        }

        public PlacedRingBuffer GetChangelog()
        {
            return new PlacedRingBuffer(_memSource, DS_SIZE);
        }

        public static int GetMemSize(TransportConfig config)
        {
            return DS_SIZE + PlacedRingBuffer.GetMemSize(config.ChangelogByteCount);
        }

        public void Initialize(TransportConfig config)
        {
            // initialize baseTimestamp to 0 first, to let lock-free readers know the data is invalid
            // (note there is still sort of a race condition there... but a reader always has to acquire
            // the lock before actually doing anything anyway)
            BaseTimestamp = 0;

            LastChangelogID = -1;
            TransportVersion = TRANSPORT_VERSION;
            SchemaHash = config.SchemaHash;
            TotalBytes = GetMemSize(config);

            GetChangelog().Init(config.ChangelogByteCount);

            // set this last as it tells anyone accessing the header
            // without a mutex lock that the header is not yet initialized
            BaseTimestamp = TimeUtils.GetCurrentClockTimeMicroseconds();
        }

        public bool VersionCheck(TransportConfig config)
        {
            return BaseTimestamp != 0 && TransportVersion == TRANSPORT_VERSION && SchemaHash == config.SchemaHash;
        }
    }

}
