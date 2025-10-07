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

namespace Xrpa
{

    public enum CollectionChangeType
    {
        RequestFullUpdate = 0,
        FullUpdate = 1,
        Shutdown = 2,
        CreateObject = 3,
        DeleteObject = 4,
        UpdateObject = 5,
        Message = 6,
    }

    public class CollectionChangeEventAccessor : ChangeEventAccessor
    {
        new public static readonly int DS_SIZE = ChangeEventAccessor.DS_SIZE + 20;

        public CollectionChangeEventAccessor() { }

        public CollectionChangeEventAccessor(MemoryAccessor memAccessor) : base(memAccessor)
        {
        }

        public override int GetByteCount()
        {
            return DS_SIZE;
        }

        public ObjectUuid GetObjectId()
        {
            return ObjectUuid.ReadValue(_memAccessor, new MemoryOffset(ChangeEventAccessor.DS_SIZE));
        }

        public void SetObjectId(ObjectUuid id)
        {
            ObjectUuid.WriteValue(id, _memAccessor, new MemoryOffset(ChangeEventAccessor.DS_SIZE));
        }

        public int GetCollectionId()
        {
            return _memAccessor.ReadInt(new MemoryOffset(ChangeEventAccessor.DS_SIZE + 16));
        }

        public void SetCollectionId(int collectionId)
        {
            _memAccessor.WriteInt(collectionId, new MemoryOffset(ChangeEventAccessor.DS_SIZE + 16));
        }

        public virtual MemoryAccessor AccessChangeData()
        {
            return _memAccessor.Slice(DS_SIZE);
        }
    }

    public class CollectionUpdateChangeEventAccessor : CollectionChangeEventAccessor
    {
        new public static readonly int DS_SIZE = CollectionChangeEventAccessor.DS_SIZE + 8;

        public CollectionUpdateChangeEventAccessor() { }

        public CollectionUpdateChangeEventAccessor(MemoryAccessor memAccessor) : base(memAccessor)
        {
        }

        public override int GetByteCount()
        {
            return DS_SIZE;
        }

        public ulong GetFieldsChanged()
        {
            return _memAccessor.ReadUlong(new MemoryOffset(CollectionChangeEventAccessor.DS_SIZE));
        }

        public void SetFieldsChanged(ulong fieldsChanged)
        {
            _memAccessor.WriteUlong(fieldsChanged, new MemoryOffset(CollectionChangeEventAccessor.DS_SIZE));
        }

        public override MemoryAccessor AccessChangeData()
        {
            return _memAccessor.Slice(DS_SIZE);
        }
    }

    public class CollectionMessageChangeEventAccessor : CollectionChangeEventAccessor
    {
        // TODO this should be 4 bytes, not 8
        new public static readonly int DS_SIZE = CollectionChangeEventAccessor.DS_SIZE + 8;

        public CollectionMessageChangeEventAccessor() { }

        public CollectionMessageChangeEventAccessor(MemoryAccessor memAccessor) : base(memAccessor)
        {
        }

        public override int GetByteCount()
        {
            return DS_SIZE;
        }

        public int GetFieldId()
        {
            return _memAccessor.ReadInt(new MemoryOffset(CollectionChangeEventAccessor.DS_SIZE));
        }

        public void SetFieldId(int fieldId)
        {
            _memAccessor.WriteInt(fieldId, new MemoryOffset(CollectionChangeEventAccessor.DS_SIZE));
        }

        public override MemoryAccessor AccessChangeData()
        {
            return _memAccessor.Slice(DS_SIZE);
        }
    }

} // namespace Xrpa
