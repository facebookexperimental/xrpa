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

  public class OutboundTypeReconciler<ObjectAccessorType, ReconciledType> : OutboundTypeReconcilerInterface
    where ObjectAccessorType : ObjectAccessorInterface, new()
    where ReconciledType : class, IOutboundReconciledType<ObjectAccessorType> {

    private readonly Dictionary<DSIdentifier, ReconciledType> _objects;
    private readonly int _dsType;
    private readonly ulong _inboundFieldMask;

    public OutboundTypeReconciler(DatasetReconciler reconciler, int dsType, ulong inboundFieldMask) : base(reconciler) {
      _objects = new();
      _dsType = dsType;
      _inboundFieldMask = inboundFieldMask;
    }

    public void AddObject(ReconciledType obj) {
      DSIdentifier id = obj.GetDSID();
      _objects.Add(id, obj);
      obj.SetDSReconciler(this);
      SetDirty(id);
    }

    public ReconciledType GetObject(DSIdentifier id) {
      if (_objects.TryGetValue(id, out ReconciledType obj)) {
        return obj;
      }
      return null;
    }

    public void RemoveObject(DSIdentifier id) {
      if (_objects.ContainsKey(id)) {
        _objects.Remove(id);
        SetDirty(id);
      }
    }

    public override MemoryAccessor SendMessage(DSIdentifier id, int messageType, int numBytes) {
      return _reconciler.SendMessage(id, messageType, numBytes);
    }

    public override int GetDSType() {
      return _dsType;
    }

    public override void WriteChanges(DatasetAccessor accessor, DSIdentifier id) {
      if (_objects.TryGetValue(id, out ReconciledType obj)) {
        obj.WriteDSChanges(accessor);
      } else {
        accessor.DeleteObject(id);
      }
    }

    public override bool ProcessUpdate(DSIdentifier id, MemoryAccessor memAccessor, ulong fieldsChanged) {
      fieldsChanged &= _inboundFieldMask;
      if (fieldsChanged == 0) {
        // no inbound fields changed, ignore this update
        return false;
      }

      if (_objects.TryGetValue(id, out ReconciledType obj)) {
        var proxy = new ObjectAccessorType();
        proxy.SetAccessor(memAccessor);
        obj.ProcessDSUpdate(proxy, fieldsChanged);
        return true;
      }

      return false;
    }

    public override void ProcessMessage(
        DSIdentifier id,
        int messageType,
        int timestamp,
        MemoryAccessor msgAccessor) {
      if (_objects.TryGetValue(id, out ReconciledType obj)) {
        obj.ProcessDSMessage(messageType, timestamp, msgAccessor);
      }
    }

  }

}
