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
using System.Collections.Generic;
using System.Runtime.InteropServices;

namespace Xrpa
{

    public class DataStoreReconciler
    {
        private class PendingWrite
        {
            public PendingWrite(ObjectUuid objectId, int collectionId)
            {
                ObjectId = objectId;
                CollectionId = collectionId;
            }

            public ObjectUuid ObjectId;
            public int CollectionId;
        };

        private TransportStream _inboundTransport;
        private TransportStream _outboundTransport;

        // message stuff
        private AllocatedMemory _outboundMessagesMemory;
        private PlacedRingBuffer _outboundMessages;
        private PlacedRingBufferIterator _outboundMessagesIterator;
        private ulong _messageLifetimeUs = 5000000; // 5 seconds

        // collections
        private readonly Dictionary<int, IObjectCollection> _collections;
        private readonly List<PendingWrite> _pendingWrites;
        private bool _pendingOutboundFullUpdate = true;
        private bool _requestInboundFullUpdate = false;
        private bool _waitingForInboundFullUpdate = false;
        private readonly TransportStreamIterator _inboundTransportIter;

        public DataStoreReconciler(TransportStream inboundTransport, TransportStream outboundTransport, int messageDataPoolSize)
        {
            _inboundTransport = inboundTransport;
            _outboundTransport = outboundTransport;
            _collections = new();
            _pendingWrites = new();
            _inboundTransportIter = _inboundTransport.CreateIterator();

            if (messageDataPoolSize > 0)
            {
                _outboundMessagesMemory = new(PlacedRingBuffer.GetMemSize(messageDataPoolSize));
                _outboundMessages = new(_outboundMessagesMemory.Accessor, 0);
                _outboundMessages.Init(messageDataPoolSize);
                _outboundMessagesIterator = new();
                _outboundMessagesIterator.SetToEnd(_outboundMessages);
            }
        }

        public void TickInbound()
        {
            if (_inboundTransport == null)
            {
                return;
            }

            // non-blocking check for inbound changes
            if (!_inboundTransportIter.NeedsProcessing())
            {
                return;
            }

            // acquire lock
            bool didLock = _inboundTransport.Transact(1, (TransportStreamAccessor accessor) =>
            {
                ReconcileInboundChanges(accessor);
            });

            if (!didLock)
            {
                Console.WriteLine("Warning: Failed to acquire lock for inbound transport transaction");
                // TODO raise a warning about this, the expiry time for the transact call may need adjusting
                return;
            }
        }

        public void TickOutbound()
        {
            foreach (var collectionKV in _collections)
            {
                collectionKV.Value.Tick();
            }

            bool bHasOutboundMessages = _outboundMessages != null && _outboundMessagesIterator.HasNext(_outboundMessages);
            bool bHasOutboundChanges =
                _requestInboundFullUpdate || _pendingOutboundFullUpdate || _pendingWrites.Count > 0;
            if (!bHasOutboundChanges && !bHasOutboundMessages)
            {
                return;
            }

            if (_outboundTransport == null)
            {
                return;
            }

            // acquire lock
            bool didLock = _outboundTransport.Transact(1, (TransportStreamAccessor accessor) =>
            {
                ReconcileOutboundChanges(accessor);
            });

            if (!didLock)
            {
                Console.WriteLine("Warning: Failed to acquire lock for outbound transport transaction");
                // TODO raise a warning about this, the expiry time for the transact call may need adjusting
                return;
            }
        }

        public void Shutdown()
        {
            if (_outboundTransport == null)
            {
                return;
            }

            _outboundTransport.Transact(1, (TransportStreamAccessor accessor) =>
            {
                accessor.WriteChangeEvent<ChangeEventAccessor>((int)CollectionChangeType.Shutdown);
            });

            _outboundMessagesMemory?.Dispose();
            _outboundMessagesMemory = null;
            _outboundMessages = null;

            _inboundTransport = null;
            _outboundTransport = null;
        }

        public void SetMessageLifetime(uint messageLifetimeMS)
        {
            _messageLifetimeUs = (ulong)(messageLifetimeMS * 1000);
        }

        public MemoryAccessor SendMessage(ObjectUuid objectId, int collectionId, int fieldId, int numBytes)
        {
            int id = 0;
            var message = new CollectionMessageChangeEventAccessor();
            message.SetAccessor(_outboundMessages.Push(message.GetByteCount() + numBytes, ref id));
            message.SetChangeType((int)CollectionChangeType.Message);
            message.SetObjectId(objectId);
            message.SetCollectionId(collectionId);
            message.SetFieldId(fieldId);
            return message.AccessChangeData();
        }

        public void NotifyObjectNeedsWrite(ObjectUuid objectId, int collectionId)
        {
            var curSize = _pendingWrites.Count;
            if (curSize > 0)
            {
                var lastWrite = _pendingWrites[curSize - 1];
                if (lastWrite.CollectionId == collectionId && lastWrite.ObjectId == objectId)
                {
                    return;
                }
            }
            _pendingWrites.Add(new PendingWrite(objectId, collectionId));
        }

        protected void RegisterCollection(IObjectCollection collection)
        {
            var collectionId = collection.GetId();
            _collections[collectionId] = collection;
        }

        private void SendFullUpdate()
        {
            _pendingOutboundFullUpdate = true;

            // sort by timestamp so that we can send the full update in creation order
            List<FullUpdateEntry> entries = new();
            foreach (var collectionKV in _collections)
            {
                collectionKV.Value.PrepFullUpdate(entries);
            }

            entries.Sort((a, b) =>
            {
                if (a.Timestamp < b.Timestamp)
                {
                    return -1;
                }
                else if (a.Timestamp > b.Timestamp)
                {
                    return 1;
                }
                else
                {
                    return 0;
                }
            });

            foreach (var entry in entries)
            {
                _pendingWrites.Add(new PendingWrite(entry.ObjectId, entry.CollectionId));
            }
        }

        private void ReconcileInboundChanges(TransportStreamAccessor accessor)
        {
            // process inbound changes
            if (_inboundTransportIter.HasMissedEntries(accessor))
            {
                // More changes came in between tick() calls than the changelog can hold.
                // Send message to outbound dataset to reconcile the entire dataset, then make sure to
                // wait for the FullUpdate message.
                _requestInboundFullUpdate = true;
                _waitingForInboundFullUpdate = true;
                return;
            }

            ulong oldestMessageTimestamp = TimeUtils.GetCurrentClockTimeMicroseconds() - _messageLifetimeUs;
            ulong baseTimestamp = accessor.GetBaseTimestamp();
            bool inFullUpdate = false;
            var reconciledIds = new HashSet<ObjectUuid>();

            while (true)
            {
                var entryMem = _inboundTransportIter.GetNextEntry(accessor);
                if (entryMem.IsNull())
                {
                    break;
                }

                var changeType = (CollectionChangeType)((new ChangeEventAccessor(entryMem)).GetChangeType());

                // handle RequestFullUpdate by queueing up a full update for the next outbound tick
                if (changeType == CollectionChangeType.RequestFullUpdate)
                {
                    SendFullUpdate();
                    continue;
                }

                if (_waitingForInboundFullUpdate && changeType != CollectionChangeType.FullUpdate)
                {
                    // skip all changes until we see the FullUpdate marker
                    continue;
                }

                switch (changeType)
                {
                    case CollectionChangeType.FullUpdate:
                    {
                        _requestInboundFullUpdate = false;
                        _waitingForInboundFullUpdate = false;
                        inFullUpdate = true;
                        break;
                    }

                    case CollectionChangeType.Shutdown:
                    {
                        foreach (var collectionKV in _collections)
                        {
                            collectionKV.Value.ProcessShutdown();
                        }
                        break;
                    }

                    case CollectionChangeType.CreateObject:
                    {
                        var entry = new CollectionChangeEventAccessor(entryMem);
                        var id = entry.GetObjectId();
                        var collectionId = entry.GetCollectionId();
                        if (_collections.TryGetValue(collectionId, out var collection))
                        {
                            if (inFullUpdate)
                            {
                                collection.ProcessUpsert(id, entry.AccessChangeData());
                                reconciledIds.Add(id);
                            }
                            else
                            {
                                collection.ProcessCreate(id, entry.AccessChangeData());
                            }
                        }
                        break;
                    }

                    case CollectionChangeType.UpdateObject:
                    {
                        var entry = new CollectionUpdateChangeEventAccessor(entryMem);
                        var id = entry.GetObjectId();
                        var collectionId = entry.GetCollectionId();
                        if (_collections.TryGetValue(collectionId, out var collection))
                        {
                            collection.ProcessUpdate(id, entry.AccessChangeData(), entry.GetFieldsChanged());
                        }
                        break;
                    }

                    case CollectionChangeType.DeleteObject:
                    {
                        var entry = new CollectionChangeEventAccessor(entryMem);
                        var id = entry.GetObjectId();
                        var collectionId = entry.GetCollectionId();
                        if (_collections.TryGetValue(collectionId, out var collection))
                        {
                            collection.ProcessDelete(id);
                        }
                        break;
                    }

                    case CollectionChangeType.Message:
                    {
                        var entry = new CollectionMessageChangeEventAccessor(entryMem);
                        ulong timestamp = entry.GetTimestamp(baseTimestamp);
                        if (timestamp >= oldestMessageTimestamp)
                        {
                            var collectionId = entry.GetCollectionId();
                            if (_collections.TryGetValue(collectionId, out var collection))
                            {
                                collection.ProcessMessage(entry.GetObjectId(), entry.GetFieldId(), timestamp, entry.AccessChangeData());
                            }
                        }
                        break;
                    }
                }
            }

            if (inFullUpdate)
            {
                // delete all unreconciled objects
                foreach (var collectionKV in _collections)
                {
                    collectionKV.Value.ProcessFullReconcile(reconciledIds);
                }
            }
        }

        private void ReconcileOutboundChanges(TransportStreamAccessor accessor)
        {
            if (_requestInboundFullUpdate)
            {
                accessor.WriteChangeEvent<ChangeEventAccessor>((int)CollectionChangeType.RequestFullUpdate);
                _requestInboundFullUpdate = false;
            }

            if (_pendingOutboundFullUpdate)
            {
                accessor.WriteChangeEvent<ChangeEventAccessor>((int)CollectionChangeType.FullUpdate);
                _pendingOutboundFullUpdate = false;
            }

            // write changes
            foreach (var pendingWrite in _pendingWrites)
            {
                if (_collections.TryGetValue(pendingWrite.CollectionId, out var collection))
                {
                    collection.WriteChanges(accessor, pendingWrite.ObjectId);
                }
            }
            _pendingWrites.Clear();

            // write messages
            if (_outboundMessages != null)
            {
                while (_outboundMessagesIterator.HasNext(_outboundMessages))
                {
                    var message = _outboundMessagesIterator.Next(_outboundMessages);
                    accessor.WritePrefilledChangeEvent(message);
                }
            }
        }
    }

}
