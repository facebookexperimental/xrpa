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

namespace Xrpa {

  public class PlacedRingBuffer {
    public static readonly int ELEMENT_HEADER_SIZE = 4;
    private static readonly int PROPS_SIZE = 24;

    private MemoryAccessor _memSource;
    private MemoryAccessor _propsAccessor;
    private MemoryAccessor _poolAccessor;

    public PlacedRingBuffer(MemoryAccessor memSource, long memOffset) {
      _memSource = memSource;
      _propsAccessor = memSource.Slice(memOffset, PROPS_SIZE);
      _poolAccessor = memSource.Slice(memOffset + PROPS_SIZE, _propsAccessor.ReadInt(0));
    }

    public static int GetMemSize(int poolSize) {
      return PROPS_SIZE + poolSize;
    }

    public int PoolSize {
      get {
        return _propsAccessor.ReadInt(0);
      }
      set {
        _propsAccessor.WriteInt(value, 0);
      }
    }

    public int Count {
      get {
        return _propsAccessor.ReadInt(4);
      }
      set {
        _propsAccessor.WriteInt(value, 4);
      }
    }

    public int StartID {
      get {
        return _propsAccessor.ReadInt(8);
      }
      set {
        _propsAccessor.WriteInt(value, 8);
      }
    }

    public int StartOffset {
      get {
        return _propsAccessor.ReadInt(12);
      }
      set {
        _propsAccessor.WriteInt(value, 12);
      }
    }

    public int LastElemOffset {
      get {
        return _propsAccessor.ReadInt(16);
      }
      set {
        _propsAccessor.WriteInt(value, 16);
      }
    }

    public int PrewrapOffset {
      get {
        return _propsAccessor.ReadInt(20);
      }
      set {
        _propsAccessor.WriteInt(value, 20);
      }
    }

    public void Init(int poolSize) {
      PoolSize = poolSize;
      Count = 0;
      StartID = 0;
      StartOffset = 0;
      LastElemOffset = 0;
      PrewrapOffset = poolSize;
      _poolAccessor = _memSource.Slice(_propsAccessor.MemOffset - _memSource.MemOffset + PROPS_SIZE, poolSize);
    }

    public void Reset() {
      Init(PoolSize);
    }

    public MemoryAccessor GetAt(int index) {
      if (index >= Count) {
        return new MemoryAccessor();
      }

      int offset = GetOffsetForIndex(index);
      return GetElementAccessor(offset);
    }

    public MemoryAccessor GetByID(int id) {
      if (id < StartID || id > GetMaxID()) {
        return new MemoryAccessor();
      }
      return GetAt(GetIndexForID(id));
    }

    public int GetID(int index) {
      return StartID + index;
    }

    public int GetIndexForID(int id) {
      if (Count == 0 || id < StartID) {
        return 0;
      }
      return id - StartID;
    }

    public int GetMinID() {
      return StartID;
    }

    public int GetMaxID() {
      return StartID + Count - 1;
    }

    private static int Align(int x) {
      return (x + 3) & ~3;
    }

    // allocates space in the ring buffer at the end, shifting out the oldest data if needed
    // returns the monotonically-increasing ID of the newly-added value in idOut
    public MemoryAccessor Push(int numBytes, ref int idOut) {
      numBytes = Align(numBytes);
      int sizeNeeded = ELEMENT_HEADER_SIZE + numBytes;
      if (sizeNeeded >= PoolSize) {
        return new MemoryAccessor();
      }

      int offset;
      for (offset = FindFreeOffset(sizeNeeded); offset < 0; offset = FindFreeOffset(sizeNeeded)) {
        // free oldest element to make room
        Shift();
      }

      Count++;
      idOut = StartID + Count - 1;

      XrpaUtils.BoundsAssert(offset, sizeNeeded, 0, PoolSize);
      SetElementSize(offset, numBytes);
      LastElemOffset = offset;
      return GetElementAccessor(offset);
    }

    // removes the oldest element from the ring buffer
    // Note that shift() returns a MemoryAccessor pointing to the removed data; this is dangerous
    // to hold on to but allows for the null check in case the ring buffer is empty
    public MemoryAccessor Shift() {
      if (Count == 0) {
        return new MemoryAccessor();
      }

      MemoryAccessor ret = GetAt(0);

      int numBytes = GetElementSize(StartOffset);
      StartOffset += ELEMENT_HEADER_SIZE + numBytes;
      if (StartOffset >= PrewrapOffset) {
        // shifting start past the wrap-point, so reset the offset and PrewrapOffset
        StartOffset = 0;
        PrewrapOffset = PoolSize;
      }

      StartID++;
      --Count;

      if (Count == 0) {
        StartOffset = 0;
        LastElemOffset = 0;
        PrewrapOffset = PoolSize;
      }

      return ret;
    }

    private void SetElementSize(int offset, int numBytes) {
      XrpaUtils.DebugAssert(numBytes > 0);
      _poolAccessor.WriteInt(numBytes, offset);
    }

    private int GetElementSize(int offset)  {
      int numBytes = _poolAccessor.ReadInt(offset);
      XrpaUtils.DebugAssert(numBytes > 0);
      return numBytes;
    }

    public MemoryAccessor GetElementAccessor(int offset) {
      int elementSize = GetElementSize(offset);
      return _poolAccessor.Slice(offset + ELEMENT_HEADER_SIZE, elementSize);
    }

    private int GetOffsetForIndex(int index) {
      int offset = StartOffset;
      for (int i = 0; i < index; ++i) {
        offset += ELEMENT_HEADER_SIZE + GetElementSize(offset);
        if (offset >= PrewrapOffset) {
          offset = 0;
        }
      }
      return offset;
    }

    public int GetNextOffset(int offset) {
      int elementSize = GetElementSize(offset);
      offset += ELEMENT_HEADER_SIZE + elementSize;
      if (offset >= PrewrapOffset) {
        offset = 0;
      }
      return offset;
    }

    // sizeNeeded includes the size of the header
    private int FindFreeOffset(int sizeNeeded) {
      if (Count == 0) {
        XrpaUtils.DebugAssert(StartOffset == 0);
        return StartOffset;
      }

      int lastElemOffset = LastElemOffset;
      int offset = lastElemOffset + ELEMENT_HEADER_SIZE + GetElementSize(lastElemOffset);

      if (StartOffset < offset) {
        // check if there is space between the last element and the end of the buffer
        if (PoolSize - offset >= sizeNeeded) {
          return offset;
        } else {
          // need to wrap around
          XrpaUtils.DebugAssert(offset <= PoolSize, "Last element of ring buffer extends beyond memory range");
          PrewrapOffset = offset;
          offset = 0;
        }
      }

      // the buffer has wrapped around, check if there is space between the last element and the
      // first element
      if (StartOffset - offset >= sizeNeeded) {
        return offset;
      } else {
        return -1;
      }
    }
  }


  public class PlacedRingBufferIterator {
    public bool HasMissedEntries(PlacedRingBuffer ringBuffer) {
      return _lastReadId < ringBuffer.StartID - 1;
    }

    public bool HasNext(PlacedRingBuffer ringBuffer) {
      return _lastReadId < ringBuffer.GetMaxID();
    }

    public bool HasNext(int maxId) {
      return _lastReadId < maxId;
    }

    public MemoryAccessor Next(PlacedRingBuffer ringBuffer) {
      if (!HasNext(ringBuffer)) {
        return new MemoryAccessor();
      }
      int startID = ringBuffer.StartID;
      if (_lastReadId < startID) {
        _lastReadId = startID;
        _lastReadOffset = ringBuffer.StartOffset;
      } else {
        _lastReadId++;
        _lastReadOffset = ringBuffer.GetNextOffset(_lastReadOffset);
      }
      return ringBuffer.GetElementAccessor(_lastReadOffset);
    }

    public void SetToEnd(PlacedRingBuffer ringBuffer) {
      _lastReadId = ringBuffer.GetMaxID();
      _lastReadOffset = ringBuffer.LastElemOffset;
    }

    private int _lastReadId = -1;
    private int _lastReadOffset = 0;
  };

}
