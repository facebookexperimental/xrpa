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

namespace Xrpa {

  public class DatasetReconciler {
    private class OutboundMessage {
      public OutboundMessage(DSIdentifier id, int messageType, MemoryAccessor messageData) {
        ID = id;
        MessageType = messageType;
        MessageData = messageData;
      }

      public DSIdentifier ID;
      public int MessageType;
      public MemoryAccessor MessageData;
    };

    private class PendingWrite {
      public PendingWrite(DSIdentifier id, int collectionId) {
        ID = id;
        CollectionId = collectionId;
      }

      public DSIdentifier ID;
      public int CollectionId;
    };

    private readonly DatasetInterface _dataset;

    // message stuff
    private readonly List<OutboundMessage> _outboundMessages;
    private AllocatedMemory _messageDataPool;
    private int _messageDataPoolPos = 0;
    private int _messageLifetimeUS = 5000000;
    private readonly PlacedRingBufferIterator _messageIter = new();

    // collections
    private readonly Dictionary<int, CollectionInterface> _collections;
    private readonly List<int> _pendingCollectionClears;
    private readonly List<PendingWrite> _pendingWrites;
    private readonly PlacedRingBufferIterator _changelogIter = new();

    public DatasetReconciler(DatasetInterface dataset, DSHashValue schemaHash, int messageDataPoolSize) {
      _dataset = dataset;
      _outboundMessages = new();
      _collections = new();
      _pendingCollectionClears = new();
      _pendingWrites = new();

      if (messageDataPoolSize > 0) {
        _messageDataPool = new AllocatedMemory(messageDataPoolSize);
      }

      if (!dataset.CheckSchemaHash(schemaHash)) {
        throw new System.Exception("Schema hash mismatch");
      }
    }

    public void Tick() {
      foreach (var collectionKV in _collections) {
        collectionKV.Value.Tick();
      }

      bool bHasOutboundMessages = _outboundMessages.Count > 0;
      bool bHasOutboundChanges = _pendingCollectionClears.Count > 0 || _pendingWrites.Count > 0;

      // non-blocking check for inbound changes
      bool bHasInboundChanges = _changelogIter.HasNext(_dataset.GetLastChangelogID());
      bool bHasInboundMessages = _messageIter.HasNext(_dataset.GetLastMessageID());

      if (!bHasInboundChanges && !bHasInboundMessages && !bHasOutboundChanges &&
          !bHasOutboundMessages) {
        return;
      }

      // acquire lock
      bool didLock = _dataset.Acquire(1, (DatasetAccessor accessor) => {
        // process inbound changes
        var changelog = accessor.GetChangeLog();
        if (_changelogIter.HasMissedEntries(changelog)) {
          // more changes came in between Tick() calls than the changelog can hold, so reconcile the
          // entire dataset
          ReconcileInboundFromIndex(accessor);
          _changelogIter.SetToEnd(changelog);
        } else {
          ReconcileInboundFromChangelog(accessor, changelog);
        }

        // dispatch inbound messages
        DispatchInboundMessages(accessor);

        // write outbound changes
        ReconcileOutboundChanges(accessor);

        // send outbound messages last, so that any messages that may have been sent as a result of
        // reconciling don't have to wait for a full tick cycle to be written into the dataset
        SendOutboundMessages(accessor);
      });

      if (!didLock) {
        // TODO raise a warning about this, the expiry time for the acquire call may need adjusting
        return;
      }
    }

    public void Shutdown() {
      _dataset.Acquire(1, (DatasetAccessor accessor) => {
        foreach (var collectionKV in _collections) {
          if (collectionKV.Value.IsLocalOwned()) {
            accessor.DeleteAllByType(collectionKV.Key);
          }
        }
      });

      _messageDataPool?.Dispose();
      _messageDataPool = null;
    }

    public void SetMessageLifetime(uint messageLifetimeMS) {
      _messageLifetimeUS = (int)messageLifetimeMS * 1000;
    }

    public MemoryAccessor SendMessage(DSIdentifier id, int messageType, int numBytes) {
      MemoryAccessor messageData = _messageDataPool.Accessor.Slice(_messageDataPoolPos, numBytes);
      _messageDataPoolPos += numBytes;
      _outboundMessages.Add(new OutboundMessage(id, messageType, messageData));
      return messageData;
    }

    public void SetDirty(DSIdentifier id, int collectionId) {
      var curSize = _pendingWrites.Count;
      if (curSize > 0) {
        var lastWrite = _pendingWrites[curSize - 1];
        if (lastWrite.CollectionId == collectionId && lastWrite.ID == id) {
          return;
        }
      }
      _pendingWrites.Add(new PendingWrite(id, collectionId));
    }

    protected void RegisterCollection(CollectionInterface collection) {
      var collectionId = collection.GetId();
      _collections[collectionId] = collection;
      if (collection.IsLocalOwned()) {
        _pendingCollectionClears.Add(collectionId);
      }
    }

    private void SendOutboundMessages(DatasetAccessor accessor) {
      if (_outboundMessages.Count == 0) {
        return;
      }

      foreach (var message in _outboundMessages) {
        accessor.SendMessage(message.ID, message.MessageType, message.MessageData.Size).CopyFrom(message.MessageData);
      }
      _outboundMessages.Clear();
      _messageDataPoolPos = 0;
    }

    private void DispatchInboundMessages(DatasetAccessor accessor) {
      int oldestTimestamp = accessor.GetCurrentTimestamp() - _messageLifetimeUS;

      var messageQueue = accessor.GetMessageQueue();
      while (_messageIter.HasNext(messageQueue)) {
        DSMessageAccessor message = new(_messageIter.Next(messageQueue));
        var timestamp = message.GetTimestamp();
        if (timestamp < oldestTimestamp) {
          continue;
        }

        var id = message.GetTargetID();
        var collectionId = message.GetTargetType();
        var messageType = message.GetMessageType();
        var messageData = message.AccessMessageData();

        if (_collections.TryGetValue(collectionId, out var collection)) {
          collection.ProcessMessage(id, messageType, timestamp, messageData);
        }
      }
    }

    private void ReconcileInboundFromIndex(DatasetAccessor accessor) {
      // sort the index by timestamp so that we can iterate over it in creation order
      var objectIndex = accessor.GetObjectIndex();
      int objectCount = objectIndex.Count;
      List<DSObjectHeader> sortedHeaders = new();
      for (int i = 0; i < objectCount; ++i) {
        sortedHeaders.Add(objectIndex.GetAt(i));
      }
      sortedHeaders.Sort((a, b) => {
        return a.CreateTimestamp - b.CreateTimestamp;
      });

      // sweep through the sorted index, reconciling each object and keeping track of the IDs
      var reconciledIds = new HashSet<DSIdentifier>();
      foreach (DSObjectHeader objHeader in sortedHeaders) {
        var id = objHeader.ID;
        var collectionId = objHeader.Type;
        var memAccessor = accessor.GetObjectFromHeader(objHeader);
        if (_collections.TryGetValue(collectionId, out var collection)) {
          collection.ProcessUpsert(id, memAccessor);
          reconciledIds.Add(id);
        }
      }

      // delete all unreconciled objects
      foreach (var collectionKV in _collections) {
        collectionKV.Value.ProcessFullReconcile(reconciledIds);
      }
    }

    private void ReconcileInboundFromChangelog(DatasetAccessor accessor, PlacedRingBuffer changelog) {
      while (_changelogIter.HasNext(changelog)) {
        DSChangeEventAccessor entry = new(_changelogIter.Next(changelog));
        var id = entry.GetTargetID();
        var collectionId = entry.GetTargetType();
        var poolOffset = entry.GetTargetPoolOffset();
        var changeType = entry.GetChangeType();

        switch (changeType) {
          case DSChangeType.CreateObject: {
            var memAccessor = accessor.GetObjectFromOffset(poolOffset);
            if (!memAccessor.IsNull()) {
              if (_collections.TryGetValue(collectionId, out var collection)) {
                collection.ProcessCreate(id, memAccessor);
              }
            }
            break;
          }

          case DSChangeType.UpdateObject: {
            // TODO collapse multiple updates to same object? they can be squashed by combining field
            // flags, but intervening deletes/creates need to be taken into account as well

            var memAccessor = accessor.GetObjectFromOffset(poolOffset);
            if (!memAccessor.IsNull()) {
              var changedFields = entry.GetChangedFields();
              if (_collections.TryGetValue(collectionId, out var collection)) {
                collection.ProcessUpdate(id, memAccessor, changedFields);
              }
            }
            break;
          }

          case DSChangeType.DeleteObject: {
            if (_collections.TryGetValue(collectionId, out var collection)) {
              collection.ProcessDelete(id);
            }
            break;
          }
        }
      }
    }

    private void ReconcileOutboundChanges(DatasetAccessor accessor) {
      foreach (int collectionId in _pendingCollectionClears) {
        accessor.DeleteAllByType(collectionId);
      }
      _pendingCollectionClears.Clear();

      foreach (var pendingWrite in _pendingWrites) {
        var id = pendingWrite.ID;
        if (_collections.TryGetValue(pendingWrite.CollectionId, out var collection)) {
          collection.WriteChanges(accessor, id);
        }
      }
      _pendingWrites.Clear();
    }
  }

}
