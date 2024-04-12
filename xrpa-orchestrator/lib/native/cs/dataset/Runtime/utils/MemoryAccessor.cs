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
using System.Text;
using System.Diagnostics;
using System.Runtime.InteropServices;

namespace Xrpa {

  public class MemoryAccessor {
    public MemoryAccessor() {}

    public MemoryAccessor(System.IO.UnmanagedMemoryAccessor dataSource, long offset, long size) {
      _dataSource = dataSource;
      _memOffset = offset;
      _size = (int)size;
    }

    public long MemOffset => _memOffset;
    public System.IO.UnmanagedMemoryAccessor DataSource => _dataSource;
    public int Size => _size;

    private readonly System.IO.UnmanagedMemoryAccessor _dataSource;
    private readonly long _memOffset;
    private readonly int _size;

    public MemoryAccessor Slice(int offset, int size = -1) {
      if (size < 0 || size > _size - offset) {
        size = _size - offset;
      }
      if (size < 0) {
        size = 0;
      }
      XrpaUtils.BoundsAssert(offset, size, 0, _size);
      return new MemoryAccessor(_dataSource, _memOffset + offset, size);
    }

    public bool IsNull() {
      return _dataSource == null || _size == 0;
    }

    public void WriteToZeros() {
      for (int pos = 0; pos < _size;) {
        if (_size - pos >= 8) {
          WriteUlong(0, pos);
          pos += 8;
        } else if (_size - pos >= 4) {
          WriteInt(0, pos);
          pos += 4;
        } else {
          WriteByte(0, pos);
          pos += 1;
        }
      }
    }

    public void CopyFrom(MemoryAccessor other) {
      if (other.IsNull()) {
        return;
      }
      int size = other.Size < _size ? other.Size : _size;
      for (int pos = 0; pos < size;) {
        if (size - pos >= 8) {
          WriteUlong(other.ReadUlong(pos), pos);
          pos += 8;
        } else if (size - pos >= 4) {
          WriteInt(other.ReadInt(pos), pos);
          pos += 4;
        } else {
          WriteByte(other.ReadByte(pos), pos);
          pos += 1;
        }
      }
    }

    public byte ReadByte(int offset) {
      XrpaUtils.BoundsAssert(offset, 1, 0, _size);
      return _dataSource.ReadByte(_memOffset + offset);
    }

    public void WriteByte(byte val, int offset) {
      XrpaUtils.BoundsAssert(offset, 1, 0, _size);
      _dataSource.Write(_memOffset + offset, val);
    }

    public int ReadInt(int offset) {
      XrpaUtils.BoundsAssert(offset, 4, 0, _size);
      return _dataSource.ReadInt32(_memOffset + offset);
    }

    public void WriteInt(int val, int offset) {
      XrpaUtils.BoundsAssert(offset, 4, 0, _size);
      _dataSource.Write(_memOffset + offset, val);
    }

    public uint ReadUint(int offset) {
      XrpaUtils.BoundsAssert(offset, 4, 0, _size);
      return _dataSource.ReadUInt32(_memOffset + offset);
    }

    public void WriteUint(uint val, int offset) {
      XrpaUtils.BoundsAssert(offset, 4, 0, _size);
      _dataSource.Write(_memOffset + offset, val);
    }

    public float ReadFloat(int offset) {
      XrpaUtils.BoundsAssert(offset, 4, 0, _size);
      return _dataSource.ReadSingle(_memOffset + offset);
    }

    public void WriteFloat(float val, int offset) {
      XrpaUtils.BoundsAssert(offset, 4, 0, _size);
      _dataSource.Write(_memOffset + offset, val);
    }

    public ulong ReadUlong(int offset) {
      XrpaUtils.BoundsAssert(offset, 8, 0, _size);
      return _dataSource.ReadUInt64(_memOffset + offset);
    }

    public void WriteUlong(ulong val, int offset) {
      XrpaUtils.BoundsAssert(offset, 8, 0, _size);
      _dataSource.Write(_memOffset + offset, val);
    }

    public string ReadString(int offset, int maxBytes) {
      int byteCount = ReadInt(offset);
      XrpaUtils.DebugAssert(byteCount <= maxBytes);
      offset += 4;

      XrpaUtils.BoundsAssert(offset, byteCount, 0, _size);
      byte[] byteArray = new byte[byteCount];
      int bytesRead = _dataSource.ReadArray(_memOffset + offset, byteArray, 0, byteCount);
      return Encoding.UTF8.GetString(byteArray, 0, bytesRead);;
    }

    public void WriteString(string val, int offset, int maxBytes) {
      byte[] byteArray = Encoding.UTF8.GetBytes(val);
      int byteCount = byteArray.Length;
      // truncate the string to fit in the buffer
      byteCount = Math.Min(maxBytes, byteCount);
      WriteInt(byteCount, offset);
      offset += 4;

      XrpaUtils.BoundsAssert(offset, maxBytes, 0, _size);
      _dataSource.WriteArray(_memOffset + offset, byteArray, 0, byteCount);
    }
  }

}
