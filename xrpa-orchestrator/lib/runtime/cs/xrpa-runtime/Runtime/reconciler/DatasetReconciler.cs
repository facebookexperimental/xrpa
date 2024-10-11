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

    public class DatasetReconciler
    {
        private class OutboundMessage
        {
            public OutboundMessage(DSIdentifier objectId, int collectionId, int fieldId, MemoryAccessor messageData)
            {
                ObjectId = objectId;
                CollectionId = collectionId;
                FieldId = fieldId;
                MessageData = messageData;
            }

            public DSIdentifier ObjectId;
            public int CollectionId;
            public int FieldId;
            public MemoryAccessor MessageData;
        };

        private class PendingWrite
        {
            public PendingWrite(DSIdentifier objectId, int collectionId)
            {
                ObjectId = objectId;
                CollectionId = collectionId;
            }

            public DSIdentifier ObjectId;
            public int CollectionId;
        };

        private readonly DatasetInterface _inboundDataset;
        private readonly DatasetInterface _outboundDataset;

        // message stuff
        private readonly List<OutboundMessage> _outboundMessages;
        private AllocatedMemory _messageDataPool;
        private int _messageDataPoolPos = 0;
        private int _messageLifetimeUS = 5000000;
        private readonly PlacedRingBufferIterator _messageIter = new();

        // collections
        private readonly Dictionary<int, CollectionInterface> _collections;
        private readonly List<PendingWrite> _pendingWrites;
        private bool _pendingOutboundFullUpdate = true;
        private bool _requestInboundFullUpdate = false;
        private bool _waitingForInboundFullUpdate = false;
        private readonly PlacedRingBufferIterator _changelogIter = new();

        public DatasetReconciler(DatasetInterface inboundDataset, DatasetInterface outboundDataset, DSHashValue schemaHash, int messageDataPoolSize)
        {
            _inboundDataset = inboundDataset;
            _outboundDataset = outboundDataset;
            _outboundMessages = new();
            _collections = new();
            _pendingWrites = new();

            if (messageDataPoolSize > 0)
            {
                _messageDataPool = new AllocatedMemory(messageDataPoolSize);
            }

            if (!inboundDataset.CheckSchemaHash(schemaHash))
            {
                throw new System.Exception("Schema hash mismatch");
            }
            if (!outboundDataset.CheckSchemaHash(schemaHash))
            {
                throw new System.Exception("Schema hash mismatch");
            }
        }

        public void TickInbound()
        {
            // non-blocking check for inbound changes
            bool bHasInboundChanges = _changelogIter.HasNext(_inboundDataset.GetLastChangelogID());

            if (!bHasInboundChanges)
            {
                return;
            }

            // acquire lock
            bool didLock = _inboundDataset.Acquire(1, (DatasetAccessor accessor) =>
            {
                ReconcileInboundChanges(accessor);
            });

            if (!didLock)
            {
                // TODO raise a warning about this, the expiry time for the acquire call may need adjusting
                return;
            }
        }

        public void TickOutbound()
        {
            foreach (var collectionKV in _collections)
            {
                collectionKV.Value.Tick();
            }

            bool bHasOutboundMessages = _outboundMessages.Count > 0;
            bool bHasOutboundChanges =
                _requestInboundFullUpdate || _pendingOutboundFullUpdate || _pendingWrites.Count > 0;
            if (!bHasOutboundChanges && !bHasOutboundMessages)
            {
                return;
            }

            // acquire lock
            bool didLock = _outboundDataset.Acquire(1, (DatasetAccessor accessor) =>
            {
                ReconcileOutboundChanges(accessor);
            });

            if (!didLock)
            {
                // TODO raise a warning about this, the expiry time for the acquire call may need adjusting
                return;
            }
        }

        public void Shutdown()
        {
            _outboundDataset.Acquire(1, (DatasetAccessor accessor) =>
            {
                accessor.WriteChangeEvent<DSChangeEventAccessor>((int)DSChangeType.Shutdown);
            });

            _messageDataPool?.Dispose();
            _messageDataPool = null;
        }

        public void SetMessageLifetime(uint messageLifetimeMS)
        {
            _messageLifetimeUS = (int)messageLifetimeMS * 1000;
        }

        public MemoryAccessor SendMessage(DSIdentifier objectId, int collectionId, int fieldId, int numBytes)
        {
            MemoryAccessor messageData = _messageDataPool.Accessor.Slice(_messageDataPoolPos, numBytes);
            _messageDataPoolPos += numBytes;
            _outboundMessages.Add(new OutboundMessage(objectId, collectionId, fieldId, messageData));
            return messageData;
        }

        public void SetDirty(DSIdentifier objectId, int collectionId)
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

        protected void RegisterCollection(CollectionInterface collection)
        {
            var collectionId = collection.GetId();
            _collections[collectionId] = collection;
        }

        public void SendFullUpdate()
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

        private void ReconcileInboundChanges(DatasetAccessor accessor)
        {
            // process inbound changes
            var changelog = accessor.GetChangeLog();
            if (_changelogIter.HasMissedEntries(changelog))
            {
                // More changes came in between tick() calls than the changelog can hold.
                // Send message to outbound dataset to reconcile the entire dataset, then make sure to
                // wait for the FullUpdate message.
                _requestInboundFullUpdate = true;
                _waitingForInboundFullUpdate = true;
                _changelogIter.SetToEnd(changelog);
                return;
            }

            int oldestMessageTimestamp = accessor.GetCurrentTimestamp() - _messageLifetimeUS;
            bool inFullUpdate = false;
            var reconciledIds = new HashSet<DSIdentifier>();

            while (_changelogIter.HasNext(changelog))
            {
                var entryMem = _changelogIter.Next(changelog);
                var changeType = (DSChangeType)((new DSChangeEventAccessor(entryMem)).GetChangeType());

                // handle RequestFullUpdate by queueing up a full update for the next outbound tick
                if (changeType == DSChangeType.RequestFullUpdate)
                {
                    SendFullUpdate();
                    continue;
                }

                if (_waitingForInboundFullUpdate && changeType != DSChangeType.FullUpdate)
                {
                    // skip all changes until we see the FullUpdate marker
                    continue;
                }

                switch (changeType)
                {
                    case DSChangeType.FullUpdate:
                    {
                        _requestInboundFullUpdate = false;
                        _waitingForInboundFullUpdate = false;
                        inFullUpdate = true;
                        break;
                    }

                    case DSChangeType.Shutdown:
                    {
                        foreach (var collectionKV in _collections)
                        {
                            collectionKV.Value.ProcessShutdown();
                        }
                        break;
                    }

                    case DSChangeType.CreateObject:
                    {
                        var entry = new DSCollectionChangeEventAccessor(entryMem);
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

                    case DSChangeType.UpdateObject:
                    {
                        var entry = new DSCollectionUpdateChangeEventAccessor(entryMem);
                        var id = entry.GetObjectId();
                        var collectionId = entry.GetCollectionId();
                        if (_collections.TryGetValue(collectionId, out var collection))
                        {
                            collection.ProcessUpdate(id, entry.AccessChangeData(), entry.GetFieldsChanged());
                        }
                        break;
                    }

                    case DSChangeType.DeleteObject:
                    {
                        var entry = new DSCollectionChangeEventAccessor(entryMem);
                        var id = entry.GetObjectId();
                        var collectionId = entry.GetCollectionId();
                        if (_collections.TryGetValue(collectionId, out var collection))
                        {
                            collection.ProcessDelete(id);
                        }
                        break;
                    }

                    case DSChangeType.Message:
                    {
                        var entry = new DSCollectionMessageChangeEventAccessor(entryMem);
                        var timestamp = entry.GetTimestamp();
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

        private void ReconcileOutboundChanges(DatasetAccessor accessor)
        {
            if (_requestInboundFullUpdate)
            {
                accessor.WriteChangeEvent<DSChangeEventAccessor>((int)DSChangeType.RequestFullUpdate);
                _requestInboundFullUpdate = false;
            }

            if (_pendingOutboundFullUpdate)
            {
                accessor.WriteChangeEvent<DSChangeEventAccessor>((int)DSChangeType.FullUpdate);
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
            foreach (var message in _outboundMessages)
            {
                var data = accessor.WriteChangeEvent<DSCollectionMessageChangeEventAccessor>(
                    (int)DSChangeType.Message, message.MessageData.Size);
                data.SetCollectionId(message.CollectionId);
                data.SetObjectId(message.ObjectId);
                data.SetFieldId(message.FieldId);
                data.AccessChangeData().CopyFrom(message.MessageData);
            }
            _outboundMessages.Clear();
            _messageDataPoolPos = 0;
        }
    }

}
