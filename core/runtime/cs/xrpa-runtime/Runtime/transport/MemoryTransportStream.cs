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
    public static class TransportConstants
    {
        public const long TRANSPORT_HEARTBEAT_INTERVAL = 1_000_000; // 1 second in microseconds
        public const long TRANSPORT_EXPIRE_TIME = 20_000_000; // 20 seconds in microseconds
    }
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
                streamAccessor.SetLastUpdateTimestamp();
            });
        }

        public override TransportStreamIterator CreateIterator()
        {
            return new MemoryTransportStreamIterator(this);
        }

        public override bool NeedsHeartbeat()
        {
            bool ret = false;
            UnsafeAccessMemory(memAccessor =>
            {
                MemoryTransportStreamAccessor streamAccessor = new(memAccessor);
                ret = streamAccessor.GetLastUpdateAgeMicroseconds() > TransportConstants.TRANSPORT_HEARTBEAT_INTERVAL;
            });
            return ret;
        }

        public abstract bool UnsafeAccessMemory(System.Action<MemoryAccessor> func);

        private bool InitializeMemoryOnCreate()
        {
            return Lock(5000, memAccessor =>
            {
                MemoryTransportStreamAccessor streamAccessor = new(memAccessor);
                streamAccessor.Initialize(_config);
            });
        }

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
                return InitializeMemoryOnCreate();
            }

            // lock-free version check against the transport header
            bool isInitialized = false;
            UnsafeAccessMemory(memAccessor =>
            {
                MemoryTransportStreamAccessor streamAccessor = new(memAccessor);
                isInitialized = streamAccessor.IsInitialized();
            });

            if (!isInitialized)
            {
                Console.WriteLine("MemoryTransportStream(" + _name + ").InitializeMemory: memory not available");
                return false;
            }

            ulong baseTimestamp = 0;
            UnsafeAccessMemory(memAccessor =>
            {
                MemoryTransportStreamAccessor streamAccessor = new(memAccessor);
                baseTimestamp = streamAccessor.BaseTimestamp;
            });

            if (baseTimestamp == 0)
            {
                // another process could be initializing the memory, so wait for it to finish
                Lock(5000, memAccessor =>
                {
                    // no-op, just needed to wait for the other process to finish initializing the memory
                });
                UnsafeAccessMemory(memAccessor =>
                {
                    MemoryTransportStreamAccessor streamAccessor = new(memAccessor);
                    baseTimestamp = streamAccessor.BaseTimestamp;
                });
                if (baseTimestamp == 0)
                {
                    // if the memory is still not initialized after the timeout, then re-initialize it
                    return InitializeMemoryOnCreate();
                }
            }

            int transportVersion = 0;
            UnsafeAccessMemory(memAccessor =>
            {
                MemoryTransportStreamAccessor streamAccessor = new(memAccessor);
                transportVersion = streamAccessor.TransportVersion;
            });

            if (transportVersion < 9)
            {
                // no heartbeat to check, so re-initialize the transport memory
                Console.WriteLine("MemoryTransportStream(" + _name + ").InitializeMemory: transport version too old, reinitializing");
                return InitializeMemoryOnCreate();
            }

            // check if the transport memory has expired
            ulong lastUpdateAgeMicroseconds = 0;
            UnsafeAccessMemory(memAccessor =>
            {
                MemoryTransportStreamAccessor streamAccessor = new(memAccessor);
                lastUpdateAgeMicroseconds = streamAccessor.GetLastUpdateAgeMicroseconds();
            });

            if (lastUpdateAgeMicroseconds > TransportConstants.TRANSPORT_EXPIRE_TIME)
            {
                Console.WriteLine("MemoryTransportStream(" + _name + ").InitializeMemory: transport memory expired, reinitializing");
                return InitializeMemoryOnCreate();
            }

            if (transportVersion != MemoryTransportStreamAccessor.TRANSPORT_VERSION)
            {
                // transport version mismatch, but the memory is in use, so error out
                Console.WriteLine("MemoryTransportStream(" + _name + ").InitializeMemory: version check failed");
                return false;
            }

            HashValue schemaHash = new();
            UnsafeAccessMemory(memAccessor =>
            {
                MemoryTransportStreamAccessor streamAccessor = new(memAccessor);
                schemaHash = streamAccessor.SchemaHash;
            });

            if (schemaHash != _config.SchemaHash)
            {
                // schema hash mismatch, but the memory is in use, so error out
                Console.WriteLine("MemoryTransportStream(" + _name + ").InitializeMemory: schema hash mismatch");
                return false;
            }

            return true;
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
