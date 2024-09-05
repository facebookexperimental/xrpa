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

    public interface IDataStoreObject
    {
        DSIdentifier GetXrpaId();
        int GetCollectionId();
        void SetXrpaCollection(CollectionInterface collection);
    }

    public interface IDataStoreObjectAccessor<ObjectAccessorType> : IDataStoreObject where ObjectAccessorType : ObjectAccessorInterface, new()
    {
        void WriteDSChanges(DatasetAccessor accessor);
        void ProcessDSMessage(int messageType, int timestamp, MemoryAccessor msgAccessor);
        void ProcessDSUpdate(ObjectAccessorType remoteValue, ulong fieldsChanged);
        void ProcessDSDelete() { }
        void TickXrpa() { }
    }

    public abstract class DataStoreObject : IDataStoreObject
    {
        protected CollectionInterface _collection;
        private DSIdentifier _id;

        public DataStoreObject(DSIdentifier id, CollectionInterface collection)
        {
            _collection = collection;
            _id = id;
        }

        public DSIdentifier GetXrpaId()
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

        public void SetXrpaCollection(CollectionInterface collection)
        {
            _collection = collection;
        }
    }

    public abstract class CollectionInterface
    {
        protected readonly DatasetReconciler _reconciler;
        private readonly int _collectionId;

        public CollectionInterface(DatasetReconciler reconciler, int collectionId)
        {
            _reconciler = reconciler;
            _collectionId = collectionId;
        }

        public MemoryAccessor SendMessage(DSIdentifier id, int messageType, int numBytes)
        {
            return _reconciler.SendMessage(id, messageType, numBytes);
        }

        public virtual void SetDirty(DSIdentifier id, ulong fieldsChanged)
        {
            _reconciler.SetDirty(id, GetId());
        }

        public int GetId()
        {
            return _collectionId;
        }

        public abstract bool IsLocalOwned();

        public abstract void Tick();

        public abstract void WriteChanges(DatasetAccessor accessor, DSIdentifier id);

        public abstract void ProcessCreate(DSIdentifier id, MemoryAccessor memAccessor);

        public abstract bool ProcessUpdate(
            DSIdentifier id,
            MemoryAccessor memAccessor,
            ulong fieldsChanged);

        public abstract void ProcessDelete(DSIdentifier id);

        public abstract void ProcessMessage(
            DSIdentifier id,
            int messageType,
            int timestamp,
            MemoryAccessor msgAccessor);

        public abstract void ProcessUpsert(DSIdentifier id, MemoryAccessor memAccessor);

        public abstract void ProcessFullReconcile(HashSet<DSIdentifier> reconciledIds);
    }

}
