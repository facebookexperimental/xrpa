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

namespace Xrpa {

  public abstract class ObjectCollection<ObjectAccessorType, ReconciledType> : CollectionInterface, IEnumerable<ReconciledType>
    where ObjectAccessorType : ObjectAccessorInterface, new()
    where ReconciledType : class, IDataStoreObjectAccessor<ObjectAccessorType> {

    public delegate ReconciledType CreateDelegateFunction(
      DSIdentifier id,
      ObjectAccessorType remoteValue,
      CollectionInterface collection
    );

    private readonly ulong _inboundFieldMask;
    private readonly ulong _indexedFieldMask;
    private readonly bool _isLocalOwned;

    private readonly Dictionary<DSIdentifier, ReconciledType> _objects;
    private CreateDelegateFunction _createDelegate;

    public ObjectCollection(
      DatasetReconciler reconciler,
      int collectionId,
      ulong inboundFieldMask,
      ulong indexedFieldMask,
      bool isLocalOwned) : base(reconciler, collectionId) {
      _inboundFieldMask = inboundFieldMask;
      _indexedFieldMask = indexedFieldMask;
      _isLocalOwned = isLocalOwned;
      _objects = new();
      _createDelegate = null;
    }

    public override bool IsLocalOwned() {
      return _isLocalOwned;
    }

    public ReconciledType GetObject(DSIdentifier id) {
      if (_objects.TryGetValue(id, out ReconciledType entry)) {
        return entry;
      }
      return null;
    }

    public IEnumerator<ReconciledType> GetEnumerator() {
      return _objects.Values.GetEnumerator();
    }

    System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator() {
      return this.GetEnumerator();
    }

    // these functions are for updating indexes in derived classes
    protected virtual void IndexNotifyCreate(ReconciledType obj) {}
    protected virtual void IndexNotifyUpdate(ReconciledType obj, ulong fieldsChanged) {}
    protected virtual void IndexNotifyDelete(ReconciledType obj) {}

    protected virtual void BindingTick() {}
    protected virtual void BindingWriteChanges(DSIdentifier id) {}
    protected virtual void BindingProcessMessage(
        DSIdentifier id,
        int messageType,
        int timestamp,
        MemoryAccessor msgAccessor) {}

    // these functions are for isLocalOwned=true derived classes; they typically will be exposed with
    // public wrapper functions
    protected void AddObjectInternal(ReconciledType obj) {
      if (!_isLocalOwned) {
        return;
      }

      DSIdentifier id = obj.GetXrpaId();
      _objects.Add(id, obj);
      obj.SetXrpaCollection(this);
      SetDirty(id, 0);

      if (_indexedFieldMask != 0) {
        IndexNotifyCreate(obj);
      }
    }

    protected void RemoveObjectInternal(DSIdentifier id) {
      if (!_isLocalOwned) {
        return;
      }

      if (!_objects.ContainsKey(id)) {
        return;
      }

      if (_indexedFieldMask != 0) {
        IndexNotifyDelete(_objects[id]);
      }

      _objects.Remove(id);
      SetDirty(id, 0);
    }

    // this function is for isLocalOwned=false derived classes; it will either be called in the
    // constructor or exposed with a public wrapper function
    protected void SetCreateDelegateInternal(CreateDelegateFunction createDelegate) {
      _createDelegate = createDelegate;
    }

    public override void SetDirty(DSIdentifier id, ulong fieldsChanged) {
      base.SetDirty(id, fieldsChanged);

      if ((_indexedFieldMask & fieldsChanged) != 0) {
        if (_objects.TryGetValue(id, out ReconciledType obj)) {
          IndexNotifyUpdate(obj, fieldsChanged);
        }
      }
    }

    public override void Tick() {
      if (_indexedFieldMask != 0) {
        BindingTick();
      }

      foreach (var obj in _objects) {
        obj.Value.TickXrpa();
      }
    }

    public override void WriteChanges(DatasetAccessor accessor, DSIdentifier id) {
      if (_objects.TryGetValue(id, out ReconciledType obj)) {
        if (_indexedFieldMask != 0) {
          BindingWriteChanges(id);
        }
        obj.WriteDSChanges(accessor);
      } else if (_isLocalOwned) {
        accessor.DeleteObject(id);
      }
    }

    public override void ProcessCreate(DSIdentifier id, MemoryAccessor memAccessor) {
      if (_isLocalOwned) {
        return;
      }

      ReconciledType obj = null;
      var objAccessor = new ObjectAccessorType();
      objAccessor.SetAccessor(memAccessor);

      // create a new object using the delegate function
      obj = _createDelegate(id, objAccessor, this);
      if (obj == null) {
        return;
      }

      _objects.Add(id, obj);
      ProcessUpdateInternal(id, memAccessor, _inboundFieldMask, false);

      if (_indexedFieldMask != 0) {
        IndexNotifyCreate(obj);
      }
    }

    public override bool ProcessUpdate(
        DSIdentifier id,
        MemoryAccessor memAccessor,
        ulong fieldsChanged) {
      return ProcessUpdateInternal(id, memAccessor, fieldsChanged, true);
    }

    private bool ProcessUpdateInternal(
        DSIdentifier id,
        MemoryAccessor memAccessor,
        ulong fieldsChanged,
        bool notify) {
      fieldsChanged &= _inboundFieldMask;
      if (fieldsChanged == 0) {
        // no inbound fields changed, ignore this update
        return false;
      }

      if (!_objects.TryGetValue(id, out ReconciledType obj)) {
        return false;
      }

      var objAccessor = new ObjectAccessorType();
      objAccessor.SetAccessor(memAccessor);
      obj.ProcessDSUpdate(objAccessor, fieldsChanged);

      if (notify && (_indexedFieldMask & fieldsChanged) != 0) {
        IndexNotifyUpdate(obj, fieldsChanged);
      }

      return true;
    }

    public override void ProcessDelete(DSIdentifier id) {
      if (_isLocalOwned) {
        return;
      }

      if (_objects.TryGetValue(id, out ReconciledType obj)) {
        ProcessDeleteInternal(id, obj);
      }
    }

    private void ProcessDeleteInternal(DSIdentifier id, ReconciledType obj) {
      if (_indexedFieldMask != 0) {
        IndexNotifyDelete(obj);
      }

      obj.ProcessDSDelete();

      _objects.Remove(id);
    }

    public override void ProcessMessage(
        DSIdentifier id,
        int messageType,
        int timestamp,
        MemoryAccessor msgAccessor) {
      if (!_objects.TryGetValue(id, out ReconciledType obj)) {
        return;
      }

      obj.ProcessDSMessage(messageType, timestamp, msgAccessor);

      if (_indexedFieldMask != 0) {
        BindingProcessMessage(id, messageType, timestamp, msgAccessor);
      }
    }

    public override void ProcessUpsert(DSIdentifier id, MemoryAccessor memAccessor) {
      if (!ProcessUpdateInternal(id, memAccessor, _inboundFieldMask, true)) {
        ProcessCreate(id, memAccessor);
      }
    }

    public override void ProcessFullReconcile(HashSet<DSIdentifier> reconciledIds) {
      if (_isLocalOwned) {
        return;
      }

      List<DSIdentifier> toDelete = new();
      foreach (var kvp in _objects) {
        if (!reconciledIds.Contains(kvp.Key)) {
          toDelete.Add(kvp.Key);
        }
      }
      foreach (var id in toDelete) {
        ProcessDeleteInternal(id, _objects[id]);
      }
    }

  }

}
