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

using System;
using System.IO;
using System.Runtime.InteropServices;

namespace Xrpa
{
    public abstract class MemoryTransportStream : TransportStream
    {
        public MemoryTransportStream(string name, TransportConfig config)
        {
            _name = name;
            _config = config;
            _memSize = MemoryTransportStreamAccessor.GetMemSize(config);
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            {
                _mutex = new WindowsInterprocessMutex(_name);
            }
            else if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
            {
                _mutex = new MacOsInterprocessMutex(_name);
            }
            else
            {
                throw new NotImplementedException($"Unsupported platform: {RuntimeInformation.OSDescription}");
            }
        }

        public override void Dispose()
        {
            if (_mutex != null)
            {
                _mutex.Dispose();
                _mutex = null;
            }
        }

        public override bool Transact(int timeoutMS, System.Action<TransportStreamAccessor> func)
        {
            return Lock(timeoutMS, memAccessor =>
            {
                MemoryTransportStreamAccessor streamAccessor = new(memAccessor);
                var changelog = streamAccessor.GetChangelog();
                var baseTimestamp = streamAccessor.BaseTimestamp;
                MemoryTransportStreamIteratorData iterData = new(changelog);

                TransportStreamAccessor transportAccessor = new(baseTimestamp, iterData, byteCount =>
                {
                    int changeId = 0;
                    var eventMem = changelog.Push(byteCount, ref changeId);
                    if (!eventMem.IsNull())
                    {
                        streamAccessor.LastChangelogID = changeId;
                    }
                    return eventMem;
                });
                func(transportAccessor);
            });
        }

        public override TransportStreamIterator CreateIterator()
        {
            return new MemoryTransportStreamIterator(this);
        }

        public abstract bool UnsafeAccessMemory(System.Action<MemoryAccessor> func);

        private bool Lock(int timeoutMS, System.Action<MemoryAccessor> func)
        {
            if (!_mutex.LockWait(timeoutMS))
            {
                Console.WriteLine($"Failed to acquire mutex for {_name} after {timeoutMS}ms");
                return false;
            }

            try
            {
                return UnsafeAccessMemory(func);
            }
            finally
            {
                _mutex.Unlock();
            }
        }

        protected bool InitializeMemory(bool didCreate)
        {
            if (didCreate)
            {
                return Lock(5000, memAccessor =>
                {
                    MemoryTransportStreamAccessor streamAccessor = new(memAccessor);
                    streamAccessor.Initialize(_config);
                });
            }

            // lock-free version check against the transport metadata
            bool ret = false;
            UnsafeAccessMemory(memAccessor =>
            {
                MemoryTransportStreamAccessor streamAccessor = new(memAccessor);
                ret = streamAccessor.VersionCheck(_config);
                // TODO log a warning on version mismatch? it isn't a hard failure but it will be
                // confusing without a log message
            });
            return ret;
        }

        protected string _name;
        protected TransportConfig _config;
        protected int _memSize;
        protected InterprocessMutex _mutex;

        private class MemoryTransportStreamIteratorData : TransportStreamIteratorData
        {
            public MemoryTransportStreamIteratorData(PlacedRingBuffer changelog)
            {
                _changelog = changelog;
            }

            public PlacedRingBuffer _changelog;
        }

        private class MemoryTransportStreamIterator : TransportStreamIterator
        {
            public MemoryTransportStreamIterator(MemoryTransportStream transportStream)
            {
                _transportStream = transportStream;
                _iter = new();
            }

            public override bool NeedsProcessing()
            {
                // lock-free check against the transport header
                bool ret = false;
                _transportStream.UnsafeAccessMemory(memAccessor =>
                {
                    MemoryTransportStreamAccessor streamAccessor = new(memAccessor);
                    ret = _iter.HasNext(streamAccessor.LastChangelogID);
                });
                return ret;
            }

            public override bool HasMissedEntries(TransportStreamAccessor accessor)
            {
                var iterData = accessor.GetIteratorData<MemoryTransportStreamIteratorData>();
                if (iterData == null)
                {
                    return false;
                }
                var changelog = iterData._changelog;
                if (_iter.HasMissedEntries(changelog))
                {
                    _iter.SetToEnd(changelog);
                    return true;
                }
                return false;
            }

            public override MemoryAccessor GetNextEntry(TransportStreamAccessor accessor)
            {
                var iterData = accessor.GetIteratorData<MemoryTransportStreamIteratorData>();
                var changelog = iterData._changelog;
                return _iter.Next(changelog);
            }

            private MemoryTransportStream _transportStream;
            private PlacedRingBufferIterator _iter;
        }
    }
}
