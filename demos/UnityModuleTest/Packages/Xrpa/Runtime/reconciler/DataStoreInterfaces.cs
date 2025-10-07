/*
// @generated
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

    public struct FullUpdateEntry
    {
        public FullUpdateEntry(ObjectUuid objectId, int collectionId, ulong timestamp)
        {
            ObjectId = objectId;
            CollectionId = collectionId;
            Timestamp = timestamp;
        }

        public ObjectUuid ObjectId;
        public int CollectionId;
        public ulong Timestamp;
    }

    public interface IDataStoreObject
    {
        ObjectUuid GetXrpaId();
        int GetCollectionId();
        void SetXrpaCollection(IObjectCollection collection);
    }

    public interface IDataStoreObjectAccessor<ObjectAccessorType> : IDataStoreObject where ObjectAccessorType : ObjectAccessorInterface, new()
    {
        void WriteDSChanges(TransportStreamAccessor accessor);
        void ProcessDSMessage(int messageType, ulong timestamp, MemoryAccessor msgAccessor);
        void ProcessDSUpdate(ObjectAccessorType remoteValue, ulong fieldsChanged);
        void HandleXrpaDelete() { }
        ulong PrepDSFullUpdate() { return 0; }
        void TickXrpa() { }
    }

    public abstract class DataStoreObject : IDataStoreObject
    {
        protected IObjectCollection _collection;
        protected bool _hasNotifiedNeedsWrite = false;
        private ObjectUuid _id;
        private object _owner;

        public DataStoreObject(ObjectUuid id, IObjectCollection collection)
        {
            _collection = collection;
            _id = id;
        }

        public ObjectUuid GetXrpaId()
        {
            return _id;
        }

        public int GetCollectionId()
        {
            if (_collection != null)
            {
                return _collection.GetId();
            }
            return -1;
        }

        public void SetXrpaCollection(IObjectCollection collection)
        {
            if (collection == null && _collection != null && !_hasNotifiedNeedsWrite)
            {
                // object removed from collection
                _collection.NotifyObjectNeedsWrite(_id);
                _hasNotifiedNeedsWrite = true;
            }

            _collection = collection;

            if (_collection != null && !_hasNotifiedNeedsWrite)
            {
                // object added to collection
                _collection.NotifyObjectNeedsWrite(_id);
                _hasNotifiedNeedsWrite = true;
            }
        }

        public void SetXrpaOwner(object owner)
        {
            _owner = owner;
        }

        public T GetXrpaOwner<T>() where T : class
        {
            return _owner as T;
        }
    }

    public abstract class IObjectCollection
    {
        protected readonly DataStoreReconciler _reconciler;
        private readonly int _collectionId;

        public IObjectCollection(DataStoreReconciler reconciler, int collectionId)
        {
            _reconciler = reconciler;
            _collectionId = collectionId;
        }

        public MemoryAccessor SendMessage(ObjectUuid id, int messageType, int numBytes)
        {
            return _reconciler.SendMessage(id, _collectionId, messageType, numBytes);
        }

        public void NotifyObjectNeedsWrite(ObjectUuid id)
        {
            _reconciler.NotifyObjectNeedsWrite(id, _collectionId);
        }

        public abstract void SetDirty(ObjectUuid id, ulong fieldsChanged);

        public int GetId()
        {
            return _collectionId;
        }

        public abstract bool IsLocalOwned();

        public abstract void Tick();

        public abstract void WriteChanges(TransportStreamAccessor accessor, ObjectUuid id);

        public abstract void PrepFullUpdate(List<FullUpdateEntry> entries);

        public abstract void ProcessCreate(ObjectUuid id, MemoryAccessor memAccessor);

        public abstract bool ProcessUpdate(
            ObjectUuid id,
            MemoryAccessor memAccessor,
            ulong fieldsChanged);

        public abstract void ProcessDelete(ObjectUuid id);

        public abstract void ProcessMessage(
            ObjectUuid id,
            int messageType,
            ulong timestamp,
            MemoryAccessor msgAccessor);

        public abstract void ProcessUpsert(ObjectUuid id, MemoryAccessor memAccessor);

        public abstract void ProcessFullReconcile(HashSet<ObjectUuid> reconciledIds);

        public abstract void ProcessShutdown();
    }

}
