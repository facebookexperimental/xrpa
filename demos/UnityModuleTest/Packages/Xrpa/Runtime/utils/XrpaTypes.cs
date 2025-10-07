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


using System;
using System.Diagnostics;

namespace Xrpa
{

    public abstract class ObjectAccessorInterface
    {
        protected MemoryAccessor _memAccessor;

        public void SetAccessor(MemoryAccessor memAccessor)
        {
            _memAccessor = memAccessor;
        }

        public bool IsNull()
        {
            return _memAccessor == null || _memAccessor.IsNull();
        }
    }

    public struct HashValue
    {
        public static readonly int DS_HASH_SIZE = 32;

        public ulong Value0;
        public ulong Value1;
        public ulong Value2;
        public ulong Value3;

        public HashValue(ulong part0, ulong part1, ulong part2, ulong part3)
        {
            Value0 = part0;
            Value1 = part1;
            Value2 = part2;
            Value3 = part3;
        }

        public static bool operator ==(HashValue left, HashValue right)
        {
            return left.Value0 == right.Value0 && left.Value1 == right.Value1 && left.Value2 == right.Value2 && left.Value3 == right.Value3;
        }

        public static bool operator !=(HashValue left, HashValue right)
        {
            return left.Value0 != right.Value0 || left.Value1 != right.Value1 || left.Value2 != right.Value2 || left.Value3 != right.Value3;
        }

        public bool Equals(HashValue other)
        {
            if (ReferenceEquals(this, other))
            {
                return true;
            }
            return this == other;
        }

        public override bool Equals(object obj)
        {
            if (obj is HashValue identifier)
            {
                return Equals(identifier);
            }
            return false;
        }

        public override int GetHashCode()
        {
            return System.HashCode.Combine(Value0, Value1, Value2, Value3);
        }

        public static HashValue ReadValue(MemoryAccessor memAccessor, MemoryOffset offset)
        {
            var v0 = memAccessor.ReadUlong(offset);
            var v1 = memAccessor.ReadUlong(offset);
            var v2 = memAccessor.ReadUlong(offset);
            var v3 = memAccessor.ReadUlong(offset);
            return new HashValue
            {
                Value0 = v0,
                Value1 = v1,
                Value2 = v2,
                Value3 = v3
            };
        }

        public static void WriteValue(HashValue value, MemoryAccessor memAccessor, MemoryOffset offset)
        {
            memAccessor.WriteUlong(value.Value0, offset);
            memAccessor.WriteUlong(value.Value1, offset);
            memAccessor.WriteUlong(value.Value2, offset);
            memAccessor.WriteUlong(value.Value3, offset);
        }
    }

    public class TransportConfig
    {
        public HashValue SchemaHash;
        public int ChangelogByteCount;
    }

    public struct ObjectUuid : System.IEquatable<ObjectUuid>
    {
        public ulong ID0;
        public ulong ID1;

        public ObjectUuid(ulong part0, ulong part1)
        {
            ID0 = part0;
            ID1 = part1;
        }

        public ObjectUuid(uint A, uint B, uint C, uint D)
        {
            ID0 = (((ulong)A) << 32) | B;
            ID1 = (((ulong)C) << 32) | D;
        }

        public ObjectUuid(System.Guid guid)
        {
            var bytes = guid.ToByteArray();
            uint A = ((uint)bytes[0]) << 24 | ((uint)bytes[1]) << 16 | ((uint)bytes[2]) << 8 | ((uint)bytes[3]);
            uint B = ((uint)bytes[4]) << 24 | ((uint)bytes[5]) << 16 | ((uint)bytes[6]) << 8 | ((uint)bytes[7]);
            uint C = ((uint)bytes[8]) << 24 | ((uint)bytes[9]) << 16 | ((uint)bytes[10]) << 8 | ((uint)bytes[11]);
            uint D = ((uint)bytes[12]) << 24 | ((uint)bytes[13]) << 16 | ((uint)bytes[14]) << 8 | ((uint)bytes[15]);
            ID0 = (((ulong)A) << 32) | B;
            ID1 = (((ulong)C) << 32) | D;
        }

        public void Clear()
        {
            ID0 = 0;
            ID1 = 0;
        }

        public bool IsEmpty()
        {
            return ID0 == 0 && ID1 == 0;
        }

        public static bool operator ==(ObjectUuid left, ObjectUuid right)
        {
            return left.ID0 == right.ID0 && left.ID1 == right.ID1;
        }

        public static bool operator !=(ObjectUuid left, ObjectUuid right)
        {
            return left.ID0 != right.ID0 || left.ID1 != right.ID1;
        }

        public bool Equals(ObjectUuid other)
        {
            if (ReferenceEquals(this, other))
            {
                return true;
            }
            return ID0 == other.ID0 && ID1 == other.ID1;
        }

        public override bool Equals(object obj)
        {
            if (obj is ObjectUuid identifier)
            {
                return Equals(identifier);
            }
            return false;
        }

        public override int GetHashCode()
        {
            return System.HashCode.Combine(ID0, ID1);
        }

        public int Compare(ObjectUuid other)
        {
            if (ID0 == other.ID0)
            {
                if (ID1 == other.ID1)
                {
                    return 0;
                }
                return ID1 < other.ID1 ? -1 : 1;
            }
            return ID0 < other.ID0 ? -1 : 1;
        }

        public static ObjectUuid ReadValue(MemoryAccessor memAccessor, MemoryOffset offset)
        {
            var id0 = memAccessor.ReadUlong(offset);
            var id1 = memAccessor.ReadUlong(offset);
            return new ObjectUuid(id0, id1);
        }

        public static void WriteValue(ObjectUuid value, MemoryAccessor memAccessor, MemoryOffset offset)
        {
            memAccessor.WriteUlong(value.ID0, offset);
            memAccessor.WriteUlong(value.ID1, offset);
        }
    }

}
