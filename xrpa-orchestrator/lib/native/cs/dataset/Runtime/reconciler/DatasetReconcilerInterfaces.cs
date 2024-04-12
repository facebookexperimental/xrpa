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

  public interface IReconciledType {
    DSIdentifier GetDSID();
    void WriteDSChanges(DatasetAccessor accessor);
    void ProcessDSMessage(int messageType, int timestamp, MemoryAccessor msgAccessor);
  }

  public interface IInboundReconciledType<ObjectAccessorType> : IReconciledType where ObjectAccessorType : ObjectAccessorInterface, new() {
    void ProcessDSUpdate(ObjectAccessorType remoteValue, ulong fieldsChanged);
    void ProcessDSDelete();
  }

  public interface IOutboundReconciledType<ObjectAccessorType> : IReconciledType where ObjectAccessorType : ObjectAccessorInterface, new() {
    void SetDSReconciler(OutboundTypeReconcilerInterface reconciler);
    void ProcessDSUpdate(ObjectAccessorType remoteValue, ulong fieldsChanged);
  }

  public abstract class DataStoreObject : IReconciledType {
    private DSIdentifier _id;
    private int _type;

    public DataStoreObject(DSIdentifier id, int type) {
      _id = id;
      _type = type;
    }

    public DSIdentifier GetDSID() {
      return _id;
    }

    public int GetDSType() {
      return _type;
    }

    public abstract void WriteDSChanges(DatasetAccessor accessor);
    public abstract void ProcessDSMessage(int messageType, int timestamp, MemoryAccessor msgAccessor);
  }

  public abstract class InboundTypeReconcilerInterface {
    protected DatasetReconciler _reconciler;

    public InboundTypeReconcilerInterface(DatasetReconciler reconciler) {
      _reconciler = reconciler;
    }

    public abstract MemoryAccessor SendMessage(DSIdentifier id, int messageType, int numBytes);

    public void SetDirty(DSIdentifier id) {
      _reconciler.SetDirty(id, GetDSType());
    }

    public abstract int GetDSType();

    public abstract void WriteChanges(DatasetAccessor accessor, DSIdentifier id);

    public abstract void ProcessCreate(DSIdentifier id, MemoryAccessor memAccessor, int reconcileID);

    public abstract bool ProcessUpdate(
        DSIdentifier id,
        MemoryAccessor memAccessor,
        ulong fieldsChanged,
        int reconcileID);

    public abstract void ProcessDelete(DSIdentifier id);

    public abstract void ProcessMessage(
        DSIdentifier id,
        int messageType,
        int timestamp,
        MemoryAccessor msgAccessor);

    public abstract void ProcessFullReconcile(DSIdentifier id, MemoryAccessor memAccessor, int reconcileID);

    public abstract void EndFullReconcile(int reconcileID);
  }

  public abstract class OutboundTypeReconcilerInterface {
    protected readonly DatasetReconciler _reconciler;

    public OutboundTypeReconcilerInterface(DatasetReconciler reconciler) {
      _reconciler = reconciler;
    }

    public abstract MemoryAccessor SendMessage(DSIdentifier id, int messageType, int numBytes);

    public void SetDirty(DSIdentifier id) {
      _reconciler.SetDirty(id, GetDSType());
    }

    public abstract int GetDSType();

    public abstract void WriteChanges(DatasetAccessor accessor, DSIdentifier id);

    public abstract bool ProcessUpdate(DSIdentifier id, MemoryAccessor memAccessor, ulong fieldsChanged);

    public abstract void ProcessMessage(
        DSIdentifier id,
        int messageType,
        int timestamp,
        MemoryAccessor msgAccessor);
  }

}
