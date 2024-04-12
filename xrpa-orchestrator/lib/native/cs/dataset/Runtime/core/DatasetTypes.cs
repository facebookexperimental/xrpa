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

using System;
using System.Diagnostics;
using System.Runtime.InteropServices;

namespace Xrpa {

  public abstract class ObjectAccessorInterface {
    protected MemoryAccessor _memAccessor;

    public void SetAccessor(MemoryAccessor memAccessor) {
      _memAccessor = memAccessor;
    }

    public bool IsNull() {
      return _memAccessor == null || _memAccessor.IsNull();
    }

    public abstract int GetDSType();
    public abstract int GetByteCount();
  }

  [StructLayout(LayoutKind.Sequential)]
  public struct DSHashValue {
    public ulong Value0;
    public ulong Value1;
    public ulong Value2;
    public ulong Value3;

    public DSHashValue(ulong part0, ulong part1, ulong part2, ulong part3) {
      Value0 = part0;
      Value1 = part1;
      Value2 = part2;
      Value3 = part3;
    }

    public static bool operator==(DSHashValue left, DSHashValue right) {
      return left.Value0 == right.Value0 && left.Value1 == right.Value1 && left.Value2 == right.Value2 && left.Value3 == right.Value3;
    }

    public static bool operator!=(DSHashValue left, DSHashValue right) {
      return left.Value0 != right.Value0 || left.Value1 != right.Value1 || left.Value2 != right.Value2 || left.Value3 != right.Value3;
    }

    public bool Equals(DSHashValue other) {
      if (ReferenceEquals(this, other)) {
        return true;
      }
      return this == other;
    }

    public override bool Equals(object obj){
      if (obj is DSHashValue identifier) {
        return Equals(identifier);
      }
      return false;
    }

    public override int GetHashCode() {
      return System.HashCode.Combine(Value0, Value1, Value2, Value3);
    }

    public static DSHashValue ReadValue(MemoryAccessor memAccessor, int offset) {
      return new DSHashValue{
        Value0 = memAccessor.ReadUlong(offset),
        Value1 = memAccessor.ReadUlong(offset + 8),
        Value2 = memAccessor.ReadUlong(offset + 16),
        Value3 = memAccessor.ReadUlong(offset + 24)
      };
    }

    public static void WriteValue(DSHashValue value, MemoryAccessor memAccessor, int offset) {
      memAccessor.WriteUlong(value.Value0, offset);
      memAccessor.WriteUlong(value.Value1, offset + 8);
      memAccessor.WriteUlong(value.Value2, offset + 16);
      memAccessor.WriteUlong(value.Value3, offset + 24);
    }
  }

  [StructLayout(LayoutKind.Sequential, Pack = 4)]
  public struct DSHeader {
    public int DatasetVersion;
    public int TotalBytes;
    public DSHashValue SchemaHash;

    // System clock time in microseconds when the Dataset was initialized; all other timestamps are
    // relative to this value.
    // Also indicates that the dataset memory is initialized, as it is set last.
    public ulong BaseTimestamp;

    // memory offsets to the various region data structures
    public int ObjectHeadersRegion;
    public int MemoryPoolRegion;
    public int ChangelogRegion;
    public int MessageQueueRegion;

    // this is the monotonically increasing ID value for the last entry written to the changelog;
    // readers can check this without locking the mutex to see if there have been changes
    public int LastChangelogID;

    // this is the monotonically increasing ID value for the last entry written to the message queue;
    // readers can check this without locking the mutex to see if there have been changes
    public int LastMessageID;
  }

  [StructLayout(LayoutKind.Sequential)]
  public struct DSIdentifier {
    public ulong ID0;
    public ulong ID1;

    public DSIdentifier(ulong part0, ulong part1) {
      ID0 = part0;
      ID1 = part1;
    }

    public DSIdentifier(uint A, uint B, uint C, uint D) {
      ID0 = (((ulong)A) << 32) | B;
      ID1 = (((ulong)C) << 32) | D;
    }

    public DSIdentifier(System.Guid guid) {
      var bytes = guid.ToByteArray();
      uint A = ((uint)bytes[0]) << 24 | ((uint)bytes[1]) << 16 | ((uint)bytes[2]) << 8 | ((uint)bytes[3]);
      uint B = ((uint)bytes[4]) << 24 | ((uint)bytes[5]) << 16 | ((uint)bytes[6]) << 8 | ((uint)bytes[7]);
      uint C = ((uint)bytes[8]) << 24 | ((uint)bytes[9]) << 16 | ((uint)bytes[10]) << 8 | ((uint)bytes[11]);
      uint D = ((uint)bytes[12]) << 24 | ((uint)bytes[13]) << 16 | ((uint)bytes[14]) << 8 | ((uint)bytes[15]);
      ID0 = (((ulong)A) << 32) | B;
      ID1 = (((ulong)C) << 32) | D;
    }

    public void Clear() {
      ID0 = 0;
      ID1 = 0;
    }

    public static bool operator==(DSIdentifier left, DSIdentifier right) {
      return left.ID0 == right.ID0 && left.ID1 == right.ID1;
    }

    public static bool operator!=(DSIdentifier left, DSIdentifier right) {
      return left.ID0 != right.ID0 || left.ID1 != right.ID1;
    }

    public bool Equals(DSIdentifier other) {
      if (ReferenceEquals(this, other)) {
        return true;
      }
      return ID0 == other.ID0 && ID1 == other.ID1;
    }

    public override bool Equals(object obj){
      if (obj is DSIdentifier identifier) {
        return Equals(identifier);
      }
      return false;
    }

    public override int GetHashCode() {
      return System.HashCode.Combine(ID0, ID1);
    }

    public int Compare(DSIdentifier other) {
      if (ID0 == other.ID0) {
        if (ID1 == other.ID1) {
          return 0;
        }
        return ID1 < other.ID1 ? -1 : 1;
      }
      return ID0 < other.ID0 ? -1 : 1;
    }

    public static DSIdentifier ReadValue(MemoryAccessor memAccessor, int offset) {
      return new DSIdentifier(memAccessor.ReadUlong(offset), memAccessor.ReadUlong(offset + 8));
    }

    public static void WriteValue(DSIdentifier value, MemoryAccessor memAccessor, int offset) {
      memAccessor.WriteUlong(value.ID0, offset);
      memAccessor.WriteUlong(value.ID1, offset + 8);
    }
  }

  [StructLayout(LayoutKind.Sequential)]
  public struct DSObjectHeader {
    public DSIdentifier ID;
    public int Type;
    public int PoolOffset;
    public int CreateTimestamp;

    public static int Compare(ref DSObjectHeader a, ref DSObjectHeader b) {
      return a.ID.Compare(b.ID);
    }

    public static int Compare(ref DSObjectHeader a, ref DSIdentifier id) {
      return a.ID.Compare(id);
    }
  }

  public enum DSChangeType {
    CreateObject = 0,
    DeleteObject = 1,
    UpdateObject = 2,
  }

  public class DSChangeEventAccessor : ObjectAccessorInterface {
    public static readonly int DS_SIZE = 32;

    public DSChangeEventAccessor() {}

    public DSChangeEventAccessor(MemoryAccessor memAccessor) {
      SetAccessor(memAccessor);
    }

    public override int GetDSType() {
      return 0;
    }

    public override int GetByteCount() {
      return DS_SIZE;
    }

    public DSIdentifier GetTargetID() {
      return DSIdentifier.ReadValue(_memAccessor, 0);
    }

    public void SetTargetID(DSIdentifier id) {
      DSIdentifier.WriteValue(id, _memAccessor, 0);
    }

    public int GetTargetType() {
      return _memAccessor.ReadInt(16);
    }

    public void SetTargetType(int type) {
      _memAccessor.WriteInt(type, 16);
    }

    public int GetTargetPoolOffset() {
      return _memAccessor.ReadInt(20);
    }

    public void SetTargetPoolOffset(int type) {
      _memAccessor.WriteInt(type, 20);
    }

    public void SetTarget(ref DSObjectHeader target) {
      SetTargetID(target.ID);
      SetTargetType(target.Type);
      SetTargetPoolOffset(target.PoolOffset);
    }

    public void ClearPoolOffsetIfMatch(int poolOffset) {
      int curPoolOffset = GetTargetPoolOffset();
      if (curPoolOffset == poolOffset) {
        SetTargetPoolOffset(0);
      }
    }

    public DSChangeType GetChangeType() {
      return (DSChangeType)_memAccessor.ReadInt(24);
    }

    public void SetChangeType(DSChangeType type) {
      _memAccessor.WriteInt((int)type, 24);
    }

    public int GetTimestamp() {
      return _memAccessor.ReadInt(28);
    }

    public void SetTimestamp(int timestamp) {
      _memAccessor.WriteInt(timestamp, 28);
    }

    public ulong GetChangedFields() {
      return _memAccessor.ReadUlong(32);
    }

    public void SetChangedFields(ulong fieldMask) {
      _memAccessor.WriteUlong(fieldMask, 32);
    }
  }

  public class DSMessageAccessor : ObjectAccessorInterface {
    public static readonly int DS_SIZE = 28;

    public DSMessageAccessor() {}

    public DSMessageAccessor(MemoryAccessor memAccessor) {
      SetAccessor(memAccessor);
    }

    public override int GetDSType() {
      return 0;
    }

    public override int GetByteCount() {
      return DS_SIZE;
    }

    public DSIdentifier GetTargetID() {
      return DSIdentifier.ReadValue(_memAccessor, 0);
    }

    public void SetTargetID(DSIdentifier id) {
      DSIdentifier.WriteValue(id, _memAccessor, 0);
    }

    public int GetTargetType() {
      return _memAccessor.ReadInt(16);
    }

    public void SetTargetType(int type) {
      _memAccessor.WriteInt(type, 16);
    }

    public void SetTarget(ref DSObjectHeader target) {
      SetTargetID(target.ID);
      SetTargetType(target.Type);
    }

    public int GetMessageType() {
      return _memAccessor.ReadInt(20);
    }

    public void SetMessageType(int type) {
      _memAccessor.WriteInt(type, 20);
    }

    public int GetTimestamp() {
      return _memAccessor.ReadInt(24);
    }

    public void SetTimestamp(int timestamp) {
      _memAccessor.WriteInt(timestamp, 24);
    }

    public MemoryAccessor AccessMessageData() {
      return _memAccessor.Slice(28);
    }
  }

}
