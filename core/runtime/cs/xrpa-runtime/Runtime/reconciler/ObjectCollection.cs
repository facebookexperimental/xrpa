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

namespace Xrpa
{

    public abstract class ObjectCollection<ObjectAccessorType, ReconciledType> : IObjectCollection, IEnumerable<ReconciledType>
      where ObjectAccessorType : ObjectAccessorInterface, new()
      where ReconciledType : class, IDataStoreObjectAccessor<ObjectAccessorType>
    {

        public delegate ReconciledType CreateDelegateFunction(
          ObjectUuid id,
          ObjectAccessorType remoteValue,
          IObjectCollection collection
        );

        private readonly ulong _inboundFieldMask;
        private readonly ulong _indexedFieldMask;
        private readonly bool _isLocalOwned;

        private readonly Dictionary<ObjectUuid, ReconciledType> _objects;
        private CreateDelegateFunction _createDelegate;

        public ObjectCollection(
          DataStoreReconciler reconciler,
          int collectionId,
          ulong inboundFieldMask,
          ulong indexedFieldMask,
          bool isLocalOwned) : base(reconciler, collectionId)
        {
            _inboundFieldMask = inboundFieldMask;
            _indexedFieldMask = indexedFieldMask;
            _isLocalOwned = isLocalOwned;
            _objects = new();
            _createDelegate = null;
        }

        public override bool IsLocalOwned()
        {
            return _isLocalOwned;
        }

        public ReconciledType GetObject(ObjectUuid id)
        {
            if (_objects.TryGetValue(id, out ReconciledType entry))
            {
                return entry;
            }
            return null;
        }

        public IEnumerator<ReconciledType> GetEnumerator()
        {
            return _objects.Values.GetEnumerator();
        }

        System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator()
        {
            return this.GetEnumerator();
        }

        public int Count => _objects.Count;

        // these functions are for updating indexes in derived classes
        protected virtual void IndexNotifyCreate(ReconciledType obj) { }
        protected virtual void IndexNotifyUpdate(ReconciledType obj, ulong fieldsChanged) { }
        protected virtual void IndexNotifyDelete(ReconciledType obj) { }

        // these functions are for isLocalOwned=true derived classes; they typically will be exposed with
        // public wrapper functions
        protected void AddObjectInternal(ReconciledType obj)
        {
            if (!_isLocalOwned)
            {
                return;
            }

            ObjectUuid id = obj.GetXrpaId();
            _objects.Add(id, obj);
            obj.SetXrpaCollection(this);

            if (_indexedFieldMask != 0)
            {
                IndexNotifyCreate(obj);
            }
        }

        protected void RemoveObjectInternal(ObjectUuid id)
        {
            if (!_isLocalOwned)
            {
                return;
            }

            if (!_objects.ContainsKey(id))
            {
                return;
            }

            ReconciledType obj = _objects[id];
            if (_indexedFieldMask != 0)
            {
                IndexNotifyDelete(obj);
            }

            obj.SetXrpaCollection(null);
            _objects.Remove(id);
        }

        // this function is for isLocalOwned=false derived classes; it will either be called in the
        // constructor or exposed with a public wrapper function
        protected void SetCreateDelegateInternal(CreateDelegateFunction createDelegate)
        {
            _createDelegate = createDelegate;
        }

        public override void SetDirty(ObjectUuid id, ulong fieldsChanged)
        {
            if ((_indexedFieldMask & fieldsChanged) != 0)
            {
                if (_objects.TryGetValue(id, out ReconciledType obj))
                {
                    IndexNotifyUpdate(obj, fieldsChanged);
                }
            }
        }

        public override void Tick()
        {
            foreach (var obj in _objects)
            {
                obj.Value.TickXrpa();
            }
        }

        public override void WriteChanges(TransportStreamAccessor accessor, ObjectUuid id)
        {
            if (_objects.TryGetValue(id, out ReconciledType obj))
            {
                obj.WriteDSChanges(accessor);
            }
            else if (_isLocalOwned)
            {
                var changeEvent = accessor.WriteChangeEvent<CollectionChangeEventAccessor>((int)CollectionChangeType.DeleteObject);
                changeEvent.SetCollectionId(GetId());
                changeEvent.SetObjectId(id);
            }
        }

        public override void PrepFullUpdate(List<FullUpdateEntry> entries)
        {
            foreach (var obj in _objects)
            {
                ulong timestamp = obj.Value.PrepDSFullUpdate();
                if (timestamp > 0)
                {
                    entries.Add(new FullUpdateEntry(obj.Key, GetId(), timestamp));
                }
            }

        }

        public override void ProcessCreate(ObjectUuid id, MemoryAccessor memAccessor)
        {
            if (_isLocalOwned)
            {
                return;
            }

            ReconciledType obj = null;
            var objAccessor = new ObjectAccessorType();
            objAccessor.SetAccessor(memAccessor);

            // create a new object using the delegate function
            obj = _createDelegate(id, objAccessor, this);
            if (obj == null)
            {
                return;
            }

            _objects.Add(id, obj);
            ProcessUpdateInternal(id, memAccessor, _inboundFieldMask, false);

            if (_indexedFieldMask != 0)
            {
                IndexNotifyCreate(obj);
            }
        }

        public override bool ProcessUpdate(
            ObjectUuid id,
            MemoryAccessor memAccessor,
            ulong fieldsChanged)
        {
            return ProcessUpdateInternal(id, memAccessor, fieldsChanged, true);
        }

        private bool ProcessUpdateInternal(
            ObjectUuid id,
            MemoryAccessor memAccessor,
            ulong fieldsChanged,
            bool notify)
        {
            fieldsChanged &= _inboundFieldMask;
            if (fieldsChanged == 0)
            {
                // no inbound fields changed, ignore this update
                return false;
            }

            if (!_objects.TryGetValue(id, out ReconciledType obj))
            {
                return false;
            }

            var objAccessor = new ObjectAccessorType();
            objAccessor.SetAccessor(memAccessor);
            obj.ProcessDSUpdate(objAccessor, fieldsChanged);

            if (notify && (_indexedFieldMask & fieldsChanged) != 0)
            {
                IndexNotifyUpdate(obj, fieldsChanged);
            }

            return true;
        }

        public override void ProcessDelete(ObjectUuid id)
        {
            if (_isLocalOwned)
            {
                return;
            }

            if (_objects.TryGetValue(id, out ReconciledType obj))
            {
                ProcessDeleteInternal(id, obj);
            }
        }

        private void ProcessDeleteInternal(ObjectUuid id, ReconciledType obj)
        {
            if (_indexedFieldMask != 0)
            {
                IndexNotifyDelete(obj);
            }

            obj.HandleXrpaDelete();

            _objects.Remove(id);
        }

        public override void ProcessMessage(
            ObjectUuid id,
            int messageType,
            ulong timestamp,
            MemoryAccessor msgAccessor)
        {
            if (!_objects.TryGetValue(id, out ReconciledType obj))
            {
                return;
            }

            obj.ProcessDSMessage(messageType, timestamp, msgAccessor);
        }

        public override void ProcessUpsert(ObjectUuid id, MemoryAccessor memAccessor)
        {
            if (!ProcessUpdateInternal(id, memAccessor, _inboundFieldMask, true))
            {
                ProcessCreate(id, memAccessor);
            }
        }

        public override void ProcessFullReconcile(HashSet<ObjectUuid> reconciledIds)
        {
            if (_isLocalOwned)
            {
                return;
            }

            List<ObjectUuid> toDelete = new();
            foreach (var kvp in _objects)
            {
                if (!reconciledIds.Contains(kvp.Key))
                {
                    toDelete.Add(kvp.Key);
                }
            }
            foreach (var id in toDelete)
            {
                ProcessDeleteInternal(id, _objects[id]);
            }
        }

        public override void ProcessShutdown()
        {
            if (_isLocalOwned)
            {
                return;
            }
            (new List<ObjectUuid>(_objects.Keys)).ForEach(id => ProcessDeleteInternal(id, _objects[id]));
        }
    }

}
