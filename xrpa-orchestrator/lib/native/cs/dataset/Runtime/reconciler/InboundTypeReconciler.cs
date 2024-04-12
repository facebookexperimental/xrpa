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
using System.Diagnostics;

namespace Xrpa {

  public interface IIndexReconciledType<ObjectAccessorType, ReconciledType>
    where ObjectAccessorType : ObjectAccessorInterface, new()
    where ReconciledType: class, IInboundReconciledType<ObjectAccessorType> {

    void SetDSReconciledObj(ReconciledType obj);

    void WriteDSChanges();
    void ProcessDSMessage(int messageType, int timestamp, MemoryAccessor msgAccessor);
    void ProcessDSUpdate(ulong fieldsChanged);
  }

  public class DummyIndexReconciledType<ObjectAccessorType, ReconciledType> : IIndexReconciledType<ObjectAccessorType, ReconciledType>
    where ObjectAccessorType : ObjectAccessorInterface, new()
    where ReconciledType: class, IInboundReconciledType<ObjectAccessorType> {

    public void SetDSReconciledObj(ReconciledType obj) {}

    public void WriteDSChanges() {}
    public void ProcessDSMessage(int messageType, int timestamp, MemoryAccessor msgAccessor) {}
    public void ProcessDSUpdate(ulong fieldsChanged) {}
  }

  public class InboundReconciledEntry<ObjectAccessorType, ReconciledType, IndexReconciledType>
    where ObjectAccessorType : ObjectAccessorInterface, new()
    where ReconciledType : class, IInboundReconciledType<ObjectAccessorType>
    where IndexReconciledType : class, IIndexReconciledType<ObjectAccessorType, ReconciledType> {

    public InboundReconciledEntry(int rID, ReconciledType rValue) {
      ReconcileID = rID;
      DirectReconciledObj = rValue;
    }

    public void SetIndexReconciledObj(IndexReconciledType iObj, ulong inboundFieldMask) {
      XrpaUtils.DebugAssert(IndexReconciledObj == null);
      IndexReconciledObj = iObj;
      IndexReconciledObj.SetDSReconciledObj(DirectReconciledObj);
      IndexReconciledObj.ProcessDSUpdate(inboundFieldMask);
    }

    public void RemoveIndexReconciledObj() {
      if (IndexReconciledObj != null) {
        IndexReconciledObj.SetDSReconciledObj(null);
      }
      IndexReconciledObj = null;
    }

    public void WriteDSChanges(DatasetAccessor accessor) {
      if (IndexReconciledObj != null) {
        IndexReconciledObj.WriteDSChanges();
      }

      DirectReconciledObj.WriteDSChanges(accessor);
    }

    public void ProcessDSUpdate(ObjectAccessorType objAccessor, ulong fieldsChanged) {
      DirectReconciledObj.ProcessDSUpdate(objAccessor, fieldsChanged);

      if (IndexReconciledObj != null) {
        IndexReconciledObj.ProcessDSUpdate(fieldsChanged);
      }
    }

    public IndexReconciledType ProcessDSDelete() {
      DirectReconciledObj.ProcessDSDelete();

      var ret = IndexReconciledObj;
      RemoveIndexReconciledObj();
      return ret;
    }

    public void ProcessDSMessage(int messageType, int timestamp, MemoryAccessor messageData) {
      DirectReconciledObj.ProcessDSMessage(messageType, timestamp, messageData);

      if (IndexReconciledObj != null) {
        IndexReconciledObj.ProcessDSMessage(messageType, timestamp, messageData);
      }
    }

    public int ReconcileID;
    public readonly ReconciledType DirectReconciledObj;
    public IndexReconciledType IndexReconciledObj;
  }

  public abstract class InboundTypeReconciler<ObjectAccessorType, ReconciledType, IndexFieldType, IndexReconciledType> : InboundTypeReconcilerInterface
    where ObjectAccessorType : ObjectAccessorInterface, new()
    where ReconciledType : class, IInboundReconciledType<ObjectAccessorType>
    where IndexReconciledType : class, IIndexReconciledType<ObjectAccessorType, ReconciledType> {

    public delegate ReconciledType CreateDelegateFunction(
      DSIdentifier id,
      ObjectAccessorType remoteValue,
      InboundTypeReconcilerInterface reconciler
    );

    private readonly Dictionary<DSIdentifier, InboundReconciledEntry<ObjectAccessorType, ReconciledType, IndexReconciledType>> _reconciledEntries;
    private readonly Dictionary<IndexFieldType, IndexReconciledType> _indexReconciledOrphans;
    private readonly Dictionary<IndexFieldType, DSIdentifier> _indexLookup;
    private CreateDelegateFunction _createDelegate;
    private readonly int _dsType;
    private readonly ulong _inboundFieldMask;
    private readonly ulong _indexFieldMask;

    public InboundTypeReconciler(DatasetReconciler reconciler, int dsType, ulong outboundFieldMask, ulong indexFieldMask) : base(reconciler) {
      _reconciledEntries = new();
      _indexReconciledOrphans = new();
      _indexLookup = new();
      _dsType = dsType;
      _inboundFieldMask = ~outboundFieldMask;
      _indexFieldMask = indexFieldMask;
    }

    public void SetCreateDelegate(CreateDelegateFunction createDelegate) {
      _createDelegate = createDelegate;
    }

    public override MemoryAccessor SendMessage(DSIdentifier id, int messageType, int numBytes) {
      return _reconciler.SendMessage(id, messageType, numBytes);
    }

    public ReconciledType GetObject(DSIdentifier id) {
      if (_reconciledEntries.TryGetValue(id, out InboundReconciledEntry<ObjectAccessorType, ReconciledType, IndexReconciledType> entry)) {
        return entry.DirectReconciledObj;
      }
      return null;
    }

    public void AddIndexReconciledObject(IndexFieldType indexField, IndexReconciledType iObj) {
      if (_indexLookup.TryGetValue(indexField, out DSIdentifier id)) {
        // add to the existing entry
        if (_reconciledEntries.TryGetValue(id, out InboundReconciledEntry<ObjectAccessorType, ReconciledType, IndexReconciledType> entry)) {
          entry.SetIndexReconciledObj(iObj, _inboundFieldMask);
        }
      } else {
        // no entry for this index field yet
        _indexReconciledOrphans.Add(indexField, iObj);
      }
    }

    public void RemoveIndexReconciledObject(IndexFieldType indexField) {
      // look for it in an entry
      if (_indexLookup.TryGetValue(indexField, out DSIdentifier id)) {
        if (_reconciledEntries.TryGetValue(id, out InboundReconciledEntry<ObjectAccessorType, ReconciledType, IndexReconciledType> entry)) {
          entry.RemoveIndexReconciledObj();
        }
      }

      // look for it as an orphan
      _indexReconciledOrphans.Remove(indexField);
    }

    protected abstract IndexFieldType GetIndexField(ReconciledType reconciledObj);

    public override int GetDSType() {
      return _dsType;
    }

    public override void WriteChanges(DatasetAccessor accessor, DSIdentifier id) {
      if (_reconciledEntries.TryGetValue(id, out InboundReconciledEntry<ObjectAccessorType, ReconciledType, IndexReconciledType> entry)) {
        entry.WriteDSChanges(accessor);
      }
    }

    public override void ProcessCreate(DSIdentifier id, MemoryAccessor memAccessor, int reconcileID) {
      ReconciledType localValue = null;
      var proxy = new ObjectAccessorType();
      proxy.SetAccessor(memAccessor);

      // create a new direct-reconciled object
      localValue = _createDelegate(id, proxy, this);
      if (localValue == null) {
        return;
      }

      // add a reconciler entry
      var entry = new InboundReconciledEntry<ObjectAccessorType, ReconciledType, IndexReconciledType>(reconcileID, localValue);
      _reconciledEntries.Add(id, entry);

      // update the reconciled object with the inbound fields
      entry.ProcessDSUpdate(proxy, _inboundFieldMask);

      // update the index
      if (_indexFieldMask != 0) {
        var indexField = GetIndexField(entry.DirectReconciledObj);
        _indexLookup.Add(indexField, id);

        // if we already have an index-reconciled object, then move it into the entry so it receives
        // updates
        if (_indexReconciledOrphans.TryGetValue(indexField, out IndexReconciledType indexReconciledObj)) {
          _indexReconciledOrphans.Remove(indexField);
          entry.SetIndexReconciledObj(indexReconciledObj, _inboundFieldMask);
        }
      }
    }

    public override bool ProcessUpdate(
        DSIdentifier id,
        MemoryAccessor memAccessor,
        ulong fieldsChanged,
        int reconcileID) {
      fieldsChanged &= _inboundFieldMask;
      if (fieldsChanged == 0) {
        // no inbound fields changed, ignore this update
        return false;
      }

      if (_reconciledEntries.TryGetValue(id, out InboundReconciledEntry<ObjectAccessorType, ReconciledType, IndexReconciledType> entry)) {
        var proxy = new ObjectAccessorType();
        proxy.SetAccessor(memAccessor);
        entry.ProcessDSUpdate(proxy, fieldsChanged);
        entry.ReconcileID = reconcileID;
        return true;
      }

      return false;
    }

    private void ProcessDeleteInternal(DSIdentifier id, InboundReconciledEntry<ObjectAccessorType, ReconciledType, IndexReconciledType> entry) {
      var indexField = GetIndexField(entry.DirectReconciledObj);
      if (_indexFieldMask != 0) {
        // remove the lookup from index field value to object ID
        _indexLookup.Remove(indexField);
      }

      var indexReconciledObj = entry.ProcessDSDelete();
      if (indexReconciledObj != null) {
        // put the index-reconciled object back into the orphan list
        _indexReconciledOrphans.Add(indexField, indexReconciledObj);
      }

      _reconciledEntries.Remove(id);
    }

    public override void ProcessDelete(DSIdentifier id) {
      if (_reconciledEntries.TryGetValue(id, out InboundReconciledEntry<ObjectAccessorType, ReconciledType, IndexReconciledType> entry)) {
        ProcessDeleteInternal(id, entry);
      }
    }

    public override void ProcessMessage(
        DSIdentifier id,
        int messageType,
        int timestamp,
        MemoryAccessor msgAccessor) {
      if (_reconciledEntries.TryGetValue(id, out InboundReconciledEntry<ObjectAccessorType, ReconciledType, IndexReconciledType> entry)) {
        entry.ProcessDSMessage(messageType, timestamp, msgAccessor);
      }
    }

    public override void ProcessFullReconcile(DSIdentifier id, MemoryAccessor memAccessor, int reconcileID) {
      if (!ProcessUpdate(id, memAccessor, _inboundFieldMask, reconcileID)) {
        ProcessCreate(id, memAccessor, reconcileID);
      }
    }

    public override void EndFullReconcile(int reconcileID) {
      var toRemove = new List<KeyValuePair<DSIdentifier, InboundReconciledEntry<ObjectAccessorType, ReconciledType, IndexReconciledType>>>();
      foreach (var kvp in _reconciledEntries) {
        if (kvp.Value.ReconcileID != reconcileID) {
          toRemove.Add(kvp);
        }
      }
      foreach (var item in toRemove) {
        ProcessDeleteInternal(item.Key, item.Value);
      }
    }
  }

}
