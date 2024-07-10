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

  public interface IIndexBoundType<ObjectAccessorType, ReconciledType>
    where ObjectAccessorType : ObjectAccessorInterface, new()
    where ReconciledType: class, IDataStoreObjectAccessor<ObjectAccessorType> {

    bool AddXrpaBinding(ReconciledType obj);
    void RemoveXrpaBinding(ReconciledType obj);

    void TickXrpa() {}

    void WriteDSChanges();
    void ProcessDSMessage(int messageType, int timestamp, MemoryAccessor msgAccessor);
    void ProcessDSUpdate(ulong fieldsChanged);
    void ProcessDSDelete() {}
  }

  public class ObjectCollectionIndexedBinding<ObjectAccessorType, ReconciledType, IndexFieldType, LocalType> : ObjectCollectionIndex<ObjectAccessorType, ReconciledType, IndexFieldType>
    where ObjectAccessorType : ObjectAccessorInterface, new()
    where ReconciledType : class, IDataStoreObjectAccessor<ObjectAccessorType>
    where IndexFieldType : System.IEquatable<IndexFieldType>
    where LocalType : class, IIndexBoundType<ObjectAccessorType, ReconciledType> {

    public ObjectCollectionIndexedBinding(ulong inboundFieldMask) : base() {
      _inboundFieldMask = inboundFieldMask;
    }

    public void AddLocalObject(IndexFieldType indexValue, LocalType localObj) {
      // add local object to lookup
      if (!_localObjects.TryGetValue(indexValue, out var localObjects)) {
        localObjects = new List<LocalType>();
        _localObjects[indexValue] = localObjects;
      }
      localObjects.Add(localObj);

      // check if there is already a reconciled object for this index value and bind to it if it
      // exists
      var reconciledObjects = GetIndexedObjects(indexValue);
      foreach (var reconciledObj in reconciledObjects) {
        if (localObj.AddXrpaBinding(reconciledObj)) {
          var id = reconciledObj.GetXrpaId();
          _boundLocalObjects[id].Add(localObj);
          localObj.ProcessDSUpdate(_inboundFieldMask);
        }
      }
    }

    public void RemoveLocalObject(IndexFieldType indexValue, LocalType localObj) {
      // remove local object from lookup
      if (_localObjects.TryGetValue(indexValue, out var localObjects)) {
        localObjects.Remove(localObj);
        if (localObjects.Count == 0) {
          _localObjects.Remove(indexValue);
        }
      }

      // unbind local object from reconciled object
      var reconciledObjects = GetIndexedObjects(indexValue);
      foreach (var reconciledObj in reconciledObjects) {
        localObj.RemoveXrpaBinding(reconciledObj);

        var id = reconciledObj.GetXrpaId();
        if (_boundLocalObjects.TryGetValue(id, out var localBoundObjects)) {
          localBoundObjects.Remove(localObj);
          if (localBoundObjects.Count == 0) {
            _boundLocalObjects.Remove(id);
          }
        }
      }
    }

    public override void OnCreate(ReconciledType reconciledObj, IndexFieldType indexValue) {
      base.OnCreate(reconciledObj, indexValue);

      // bind local objects to reconciled object
      var id = reconciledObj.GetXrpaId();
      if (_localObjects.TryGetValue(indexValue, out var localObjects)) {
        foreach (var localObj in localObjects) {
          if (localObj.AddXrpaBinding(reconciledObj)) {
            if (!_boundLocalObjects.TryGetValue(id, out var localBoundObjects)) {
              localBoundObjects = new List<LocalType>();
              _boundLocalObjects[id] = localBoundObjects;
            }
            localBoundObjects.Add(localObj);
            localObj.ProcessDSUpdate(_inboundFieldMask);
          }
        }
      }
    }

    public override void OnDelete(ReconciledType reconciledObj, IndexFieldType indexValue) {
      var id = reconciledObj.GetXrpaId();

      if (_boundLocalObjects.TryGetValue(id, out var localBoundObjects)) {
        foreach (var localObj in localBoundObjects) {
          localObj.ProcessDSDelete();
        }
      }

      base.OnDelete(reconciledObj, indexValue);

      // unbound local objects from reconciled object
      if (localBoundObjects != null) {
        foreach (var localObj in localBoundObjects) {
          localObj.RemoveXrpaBinding(reconciledObj);
        }
        _boundLocalObjects.Remove(id);
      }
    }

    public void Tick() {
      foreach (var (id, localObjects) in _boundLocalObjects) {
        foreach (var localObj in localObjects) {
          localObj.TickXrpa();
        }
      }
    }

    public void WriteChanges(DSIdentifier id) {
      if (_boundLocalObjects.TryGetValue(id, out var localBoundObjects)) {
        foreach (var localObj in localBoundObjects) {
          localObj.WriteDSChanges();
        }
      }
    }

    public void ProcessUpdate(DSIdentifier id, ulong fieldsChanged) {
      if (_boundLocalObjects.TryGetValue(id, out var localBoundObjects)) {
        foreach (var localObj in localBoundObjects) {
          localObj.ProcessDSUpdate(fieldsChanged);
        }
      }
    }

    public void ProcessMessage(DSIdentifier id, int messageType, int timestamp, MemoryAccessor msgAccessor) {
      if (_boundLocalObjects.TryGetValue(id, out var localBoundObjects)) {
        foreach (var localObj in localBoundObjects) {
          localObj.ProcessDSMessage(messageType, timestamp, msgAccessor);
        }
      }
    }

    private ulong _inboundFieldMask;
    private Dictionary<IndexFieldType, List<LocalType>> _localObjects = new();
    private Dictionary<DSIdentifier, List<LocalType>> _boundLocalObjects = new();
  }

}
