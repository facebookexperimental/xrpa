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

namespace Xrpa
{

    public enum DSChangeType
    {
        RequestFullUpdate = 0,
        FullUpdate = 1,
        Shutdown = 2,
        CreateObject = 3,
        DeleteObject = 4,
        UpdateObject = 5,
        Message = 6,
    }

    public class DSCollectionChangeEventAccessor : DSChangeEventAccessor
    {
        new public static readonly int DS_SIZE = DSChangeEventAccessor.DS_SIZE + 20;

        public DSCollectionChangeEventAccessor() { }

        public DSCollectionChangeEventAccessor(MemoryAccessor memAccessor) : base(memAccessor)
        {
        }

        public override int GetByteCount()
        {
            return DS_SIZE;
        }

        public DSIdentifier GetObjectId()
        {
            return DSIdentifier.ReadValue(_memAccessor, DSChangeEventAccessor.DS_SIZE);
        }

        public void SetObjectId(DSIdentifier id)
        {
            DSIdentifier.WriteValue(id, _memAccessor, DSChangeEventAccessor.DS_SIZE);
        }

        public int GetCollectionId()
        {
            return _memAccessor.ReadInt(DSChangeEventAccessor.DS_SIZE + 16);
        }

        public void SetCollectionId(int collectionId)
        {
            _memAccessor.WriteInt(collectionId, DSChangeEventAccessor.DS_SIZE + 16);
        }

        public virtual MemoryAccessor AccessChangeData()
        {
            return _memAccessor.Slice(DS_SIZE);
        }
    }

    public class DSCollectionUpdateChangeEventAccessor : DSCollectionChangeEventAccessor
    {
        new public static readonly int DS_SIZE = DSCollectionChangeEventAccessor.DS_SIZE + 8;

        public DSCollectionUpdateChangeEventAccessor() { }

        public DSCollectionUpdateChangeEventAccessor(MemoryAccessor memAccessor) : base(memAccessor)
        {
        }

        public override int GetByteCount()
        {
            return DS_SIZE;
        }

        public ulong GetFieldsChanged()
        {
            return _memAccessor.ReadUlong(DSCollectionChangeEventAccessor.DS_SIZE);
        }

        public void SetFieldsChanged(ulong fieldsChanged)
        {
            _memAccessor.WriteUlong(fieldsChanged, DSCollectionChangeEventAccessor.DS_SIZE);
        }

        public override MemoryAccessor AccessChangeData()
        {
            return _memAccessor.Slice(DS_SIZE);
        }
    }

    public class DSCollectionMessageChangeEventAccessor : DSCollectionChangeEventAccessor
    {
        new public static readonly int DS_SIZE = DSCollectionChangeEventAccessor.DS_SIZE + 8;

        public DSCollectionMessageChangeEventAccessor() { }

        public DSCollectionMessageChangeEventAccessor(MemoryAccessor memAccessor) : base(memAccessor)
        {
        }

        public override int GetByteCount()
        {
            return DS_SIZE;
        }

        public int GetFieldId()
        {
            return _memAccessor.ReadInt(DSCollectionChangeEventAccessor.DS_SIZE);
        }

        public void SetFieldId(int fieldId)
        {
            _memAccessor.WriteInt(fieldId, DSCollectionChangeEventAccessor.DS_SIZE);
        }

        public override MemoryAccessor AccessChangeData()
        {
            return _memAccessor.Slice(DS_SIZE);
        }
    }

    public struct FullUpdateEntry
    {
        public FullUpdateEntry(DSIdentifier objectId, int collectionId, ulong timestamp)
        {
            ObjectId = objectId;
            CollectionId = collectionId;
            Timestamp = timestamp;
        }

        public DSIdentifier ObjectId;
        public int CollectionId;
        public ulong Timestamp;
    }

} // namespace Xrpa
