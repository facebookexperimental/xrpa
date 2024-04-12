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
using System.IO;
using System.IO.MemoryMappedFiles;

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
      public PendingWrite(DSIdentifier id, int type) {
        ID = id;
        Type = type;
      }

      public DSIdentifier ID;
      public int Type;
    };

    private readonly DatasetInterface _dataset;

    // message stuff
    private readonly List<OutboundMessage> _outboundMessages;
    private MemoryMappedFile _messageDataPoolFile;
    private MemoryMappedViewAccessor _messageDataPool;
    private int _messageDataPoolPos = 0;
    private int _lastHandledMessageID = -1;
    private int _messageLifetimeUS = 5000000;

    // read reconciliation
    private readonly InboundTypeReconcilerInterface[] _inboundReconcilers;
    private int _lastChangelogID = -1;
    private int _reconcileID = 0;

    // write reconciliation
    private readonly OutboundTypeReconcilerInterface[] _outboundReconcilers;
    private readonly List<int> _pendingTypeClears;
    private readonly List<PendingWrite> _pendingWrites;

    public DatasetReconciler(DatasetInterface dataset, DSHashValue schemaHash, int typeCount, int messageDataPoolSize) {
      _dataset = dataset;
      _outboundMessages = new();
      _inboundReconcilers = new InboundTypeReconcilerInterface[typeCount];
      _outboundReconcilers = new OutboundTypeReconcilerInterface[typeCount];
      _pendingTypeClears = new();
      _pendingWrites = new();

      if (messageDataPoolSize > 0) {
        _messageDataPoolFile = MemoryMappedFile.CreateNew(Path.GetRandomFileName(), messageDataPoolSize);
        _messageDataPool = _messageDataPoolFile.CreateViewAccessor(0, messageDataPoolSize, MemoryMappedFileAccess.ReadWrite);
      }

      if (!dataset.CheckSchemaHash(schemaHash)) {
        throw new System.Exception("Schema hash mismatch");
      }
    }

    public void Tick() {
      bool bHasOutboundMessages = _outboundMessages.Count > 0;
      bool bHasOutboundChanges = _pendingTypeClears.Count > 0 || _pendingWrites.Count > 0;

      // non-blocking check for inbound changes
      bool bHasInboundChanges = _dataset.GetLastChangelogID() != _lastChangelogID;
      bool bHasInboundMessages = _dataset.GetLastMessageID() != _lastHandledMessageID;

      if (!bHasInboundChanges && !bHasInboundMessages && !bHasOutboundChanges &&
          !bHasOutboundMessages) {
        return;
      }

      // acquire lock
      bool didLock = _dataset.Acquire(1, (DatasetAccessor accessor) => {
        // process inbound changes
        var changelog = accessor.GetChangeLog();
        if (changelog.GetMinID() > _lastChangelogID) {
          // more changes came in between tick() calls than the changelog can hold, so reconcile the
          // entire dataset
          // NOTE: this block also hits on the first tick
          ReconcileInboundFromIndex(accessor);
        } else {
          ReconcileInboundFromChangelog(accessor, changelog);
        }
        _lastChangelogID = changelog.GetMaxID();

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
        for (int type = 0; type < _outboundReconcilers.Length; ++type) {
          if (_outboundReconcilers[type] != null) {
            var existingIDs = accessor.GetAllObjectIDsByType(type);
            foreach (var id in existingIDs) {
              accessor.DeleteObject(id);
            }
          }
        }
      });
    }

    public void SetMessageLifetime(uint messageLifetimeMS) {
      _messageLifetimeUS = (int)messageLifetimeMS * 1000;
    }

    public MemoryAccessor SendMessage(DSIdentifier id, int messageType, int numBytes) {
      MemoryAccessor messageData = new(_messageDataPool, _messageDataPoolPos, numBytes);
      _messageDataPoolPos += numBytes;
      _outboundMessages.Add(new OutboundMessage(id, messageType, messageData));
      return messageData;
    }

    public void SetDirty(DSIdentifier id, int type) {
      var curSize = _pendingWrites.Count;
      if (curSize > 0) {
        var lastWrite = _pendingWrites[curSize - 1];
        if (lastWrite.Type == type && lastWrite.ID == id) {
          return;
        }
      }
      _pendingWrites.Add(new PendingWrite(id, type));
    }

    protected void SetInboundReconciler(int type, InboundTypeReconcilerInterface reconciler) {
      _inboundReconcilers[type] = reconciler;
    }

    protected void SetOutboundReconciler(int type, OutboundTypeReconcilerInterface reconciler) {
      _outboundReconcilers[type] = reconciler;
      _pendingTypeClears.Add(type);
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
      var nextIndex = messageQueue.GetIndexForID(_lastHandledMessageID + 1);
      var messageCount = messageQueue.Count;
      for (int i = nextIndex; i < messageCount; ++i) {
        DSMessageAccessor message = new(messageQueue.GetAt(i));
        var timestamp = message.GetTimestamp();
        if (timestamp < oldestTimestamp) {
          continue;
        }

        var id = message.GetTargetID();
        var type = message.GetTargetType();
        var messageType = message.GetMessageType();
        var messageData = message.AccessMessageData();

        if (_inboundReconcilers[type] != null) {
          _inboundReconcilers[type].ProcessMessage(id, messageType, timestamp, messageData);
        }
        if (_outboundReconcilers[type] != null) {
          _outboundReconcilers[type].ProcessMessage(id, messageType, timestamp, messageData);
        }
      }

      _lastHandledMessageID = messageQueue.GetMaxID();
    }

    private void ReconcileInboundFromIndex(DatasetAccessor accessor) {
      // increment reconcileID
      ++_reconcileID;

      // sort the index by timestamp so that we can iterate over it in creation order
      var objectIndex = accessor.GetObjectIndex();
      int objectCount = objectIndex.Count;
      List<DSObjectHeader> sortedHeaders = new();
      for (int i = 0; i < objectCount; ++i) {
        objectIndex.GetAt(i, out DSObjectHeader objHeader);
        sortedHeaders.Add(objHeader);
      }
      sortedHeaders.Sort((a, b) => {
        return a.CreateTimestamp - b.CreateTimestamp;
      });

      // sweep through the sorted index, reconciling each object and marking them with the reconcileID
      foreach (DSObjectHeader objHeader in sortedHeaders) {
        var id = objHeader.ID;
        var type = objHeader.Type;
        var memAccessor = accessor.GetObjectFromHeader(objHeader);
        if (_inboundReconcilers[type] != null) {
          _inboundReconcilers[type].ProcessFullReconcile(id, memAccessor, _reconcileID);
        }
        if (_outboundReconcilers[type] != null) {
          _outboundReconcilers[type].ProcessUpdate(id, memAccessor, ~0UL);
        }
      }

      // delete any reconciled value that was not marked above
      foreach (var reconciler in _inboundReconcilers) {
        if (reconciler != null) {
          reconciler.EndFullReconcile(_reconcileID);
        }
      }
    }

    private void ReconcileInboundFromChangelog(DatasetAccessor accessor, PlacedRingBuffer changelog) {
      int changelogCount = changelog.Count;
      for (int i = changelog.GetIndexForID(_lastChangelogID) + 1; i < changelogCount; ++i) {
        DSChangeEventAccessor entry = new(changelog.GetAt(i));
        var id = entry.GetTargetID();
        var type = entry.GetTargetType();
        var poolOffset = entry.GetTargetPoolOffset();
        var changeType = entry.GetChangeType();

        switch (changeType) {
          case DSChangeType.CreateObject: {
            var memAccessor = accessor.GetObjectFromOffset(poolOffset);
            if (!memAccessor.IsNull()) {
              if (_inboundReconcilers[type] != null) {
                _inboundReconcilers[type].ProcessCreate(id, memAccessor, _reconcileID);
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
              if (_inboundReconcilers[type] != null) {
                _inboundReconcilers[type].ProcessUpdate(id, memAccessor, changedFields, _reconcileID);
              }
              if (_outboundReconcilers[type] != null) {
                _outboundReconcilers[type].ProcessUpdate(id, memAccessor, changedFields);
              }
            }
            break;
          }

          case DSChangeType.DeleteObject: {
            if (_inboundReconcilers[type] != null) {
              _inboundReconcilers[type].ProcessDelete(id);
            }
            break;
          }
        }
      }
    }

    private void ReconcileOutboundChanges(DatasetAccessor accessor) {
      foreach (int type in _pendingTypeClears) {
        var existingIDs = accessor.GetAllObjectIDsByType(type);
        foreach (var id in existingIDs) {
          accessor.DeleteObject(id);
        }
      }
      _pendingTypeClears.Clear();

      foreach (var pendingWrite in _pendingWrites) {
        var id = pendingWrite.ID;
        if (_inboundReconcilers[pendingWrite.Type] != null) {
          _inboundReconcilers[pendingWrite.Type].WriteChanges(accessor, id);
        }
        if (_outboundReconcilers[pendingWrite.Type] != null) {
          _outboundReconcilers[pendingWrite.Type].WriteChanges(accessor, id);
        }
      }
      _pendingWrites.Clear();
    }
  }

}
