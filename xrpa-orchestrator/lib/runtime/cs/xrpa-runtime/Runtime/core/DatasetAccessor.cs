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

using System.Collections.Generic;

namespace Xrpa
{

    public class DatasetConfig
    {
        public DSHashValue SchemaHash;
        public int ChangelogByteCount;
    }

    public class DatasetAccessor : System.IDisposable
    {
        private const int DATASET_VERSION = 8; // conorwdickinson: unidirectional transport, no object store

        public DatasetAccessor(MemoryAccessor memAccessor, bool isInitializing)
        {
            _memAccessor = memAccessor;
            _header = new DSHeader(_memAccessor);

            if (!isInitializing)
            {
                _changeLog = _header.GetChangelog();
            }
        }

        public void Dispose()
        {
        }

        private static long TicksPerMicrosecond = System.TimeSpan.TicksPerMillisecond / 1000;
        private static long UnixEpochStart = (new System.DateTime(1970, 1, 1, 0, 0, 0, System.DateTimeKind.Utc)).Ticks;

        public static ulong GetCurrentClockTimeMicroseconds()
        {
            return (ulong)((System.DateTime.UtcNow.Ticks - UnixEpochStart) / TicksPerMicrosecond);
        }

        public void InitContents(int totalBytes, DatasetConfig config)
        {
            // initialize baseTimestamp to 0 first, to let lock-free readers know the data is invalid
            // (note there is still sort of a race condition there... but a reader always has to acquire
            // the lock before actually doing anything anyway)
            _header.BaseTimestamp = 0;

            _header.LastChangelogID = -1;
            _header.DatasetVersion = DATASET_VERSION;
            _header.SchemaHash = config.SchemaHash;
            _header.TotalBytes = totalBytes;
            _changeLog = _header.GetChangelog(config.ChangelogByteCount);

            // set this last as it tells anyone accessing the header
            // without a mutex lock that the header is not yet initialized
            _header.BaseTimestamp = GetCurrentClockTimeMicroseconds();
        }

        public void Clear()
        {
            // initialize baseTimestamp to 0 first, to let lock-free readers know the data is invalid
            // (note there is still sort of a race condition there... but a reader always has to acquire
            // the lock before actually doing anything anyway)
            _header.BaseTimestamp = 0;

            _header.LastChangelogID = -1;

            _changeLog.Reset();

            // set this last as it tells anyone accessing the header
            // without a mutex lock that the header is not yet initialized
            _header.BaseTimestamp = GetCurrentClockTimeMicroseconds();
        }

        public int GetCurrentTimestamp()
        {
            return (int)(GetCurrentClockTimeMicroseconds() - _header.BaseTimestamp);
        }

        public ulong GetBaseTimestamp()
        {
            return _header.BaseTimestamp;
        }

        public int GetChangelogTotal()
        {
            return _changeLog.GetMaxID() + 1;
        }

        public PlacedRingBuffer GetChangeLog()
        {
            return _changeLog;
        }

        public EventAccessor WriteChangeEvent<EventAccessor>(int changeType, int numBytes = 0, ulong timestamp = 0) where EventAccessor : DSChangeEventAccessor, new()
        {
            int changeId = 0;
            EventAccessor changeEvent = new();
            changeEvent.SetAccessor(_changeLog.Push(changeEvent.GetByteCount() + numBytes, ref changeId));
            if (changeEvent.IsNull())
            {
                return changeEvent;
            }

            _header.LastChangelogID = changeId;

            changeEvent.SetChangeType(changeType);
            changeEvent.SetTimestamp((timestamp != 0) ? (int)(timestamp - _header.BaseTimestamp) : GetCurrentTimestamp());

            return changeEvent;
        }

        public static int GetTotalBytes(DatasetConfig config)
        {
            return DSHeader.DS_SIZE + PlacedRingBuffer.GetMemSize(config.ChangelogByteCount);
        }

        public static bool VersionCheck(MemoryAccessor memAccessor, DatasetConfig config)
        {
            DSHeader header = new(memAccessor);
            return header.BaseTimestamp != 0 && header.DatasetVersion == DATASET_VERSION && header.SchemaHash == config.SchemaHash;
        }

        private readonly MemoryAccessor _memAccessor;

        private DSHeader _header;
        private PlacedRingBuffer _changeLog;
    }

}
