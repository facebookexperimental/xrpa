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

  public delegate ElemType ReadValueDelegate<ElemType>(MemoryAccessor memAccessor, int offset);
  public delegate void WriteValueDelegate<ElemType>(ElemType value, MemoryAccessor memAccessor, int offset);
  public delegate int SortCompare<LeftType, RightType>(ref LeftType a, ref RightType b);

  public class PlacedSortedArray<ElemType> where ElemType : struct {
    private static readonly int PROPS_SIZE = 8;

    private MemoryAccessor _memSource;
    private MemoryAccessor _propsAccessor;
    private MemoryAccessor _poolAccessor;
    private readonly int _elemSize;
    private readonly ReadValueDelegate<ElemType> _elemReadValue;
    private readonly WriteValueDelegate<ElemType> _elemWriteValue;
    private readonly SortCompare<ElemType, ElemType> _elemCompare;

    public PlacedSortedArray(
      MemoryAccessor memSource,
      long memOffset,
      int elemSize,
      ReadValueDelegate<ElemType> elemReadValue,
      WriteValueDelegate<ElemType> elemWriteValue,
      SortCompare<ElemType, ElemType> elemCompare
    ) {
      _memSource = memSource;
      _propsAccessor = memSource.Slice(memOffset, PROPS_SIZE);
      _poolAccessor = memSource.Slice(memOffset + PROPS_SIZE, _propsAccessor.ReadInt(0) * elemSize);
      _elemSize = elemSize;
      _elemReadValue = elemReadValue;
      _elemWriteValue = elemWriteValue;
      _elemCompare = elemCompare;
    }

    public static int GetMemSize(int maxCount, int elemSize) {
      return PROPS_SIZE + maxCount * elemSize;
    }

    public int MaxCount {
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

    public void Init(int maxCount) {
      MaxCount = maxCount;
      Count = 0;
      _poolAccessor = _memSource.Slice(_propsAccessor.MemOffset - _memSource.MemOffset + PROPS_SIZE, maxCount * _elemSize);
    }

    public void Reset() {
      Count = 0;
    }

    public bool IsFull() {
      return Count >= MaxCount;
    }

    public ElemType GetAt(int index) {
      return _elemReadValue(_poolAccessor, index * _elemSize);
    }

    private void SetAt(int index, ref ElemType value) {
      _elemWriteValue(value, _poolAccessor, index * _elemSize);
    }

    private void MemShift(int toIndex, int fromIndex, int count) {
      var temp = new ElemType[count];
      for (int i = 0; i < count; i++) {
        temp[i] = GetAt(fromIndex + i);
      }
      for (int i = 0; i < count; i++) {
        SetAt(toIndex + i, ref temp[i]);
      }
    }

    public int Insert(ref ElemType val) {
      if (IsFull()) {
        return -1;
      }

      int index = Find(ref val, _elemCompare, out _);
      InsertPresorted(ref val, index);
      return index;
    }

    // only call if you already called find() to obtain the correct index
    public bool InsertPresorted(ref ElemType val, int index) {
      if (IsFull()) {
        return false;
      }

      if (index < Count) {
        // move elements at index and higher up a spot
        MemShift(index + 1, index, Count - index);
      }
      SetAt(index, ref val);
      Count++;
      return true;
    }

    public void RemoveIndex(int index) {
      if (index < 0 || index >= Count) {
        return;
      }

      Count--;
      if (index < Count) {
        // move elements after index down a spot
        MemShift(index, index + 1, Count - index);
      }
    }

    public void RemoveIndexRange(int startIndex, int endIndex) {
      if (startIndex < 0) {
        startIndex = 0;
      }
      if (endIndex > Count) {
        endIndex = Count;
      }
      if (endIndex > startIndex) {
        Count -= endIndex - startIndex;
        MemShift(startIndex, endIndex, Count - startIndex);
      }
    }

    public void RemoveValue(ref ElemType val) {
      int index = Find(ref val, _elemCompare, out bool found);
      if (found) {
        RemoveIndex(index);
      }
    }

    public void RemoveMatching<QueryType>(ref QueryType query, SortCompare<ElemType, QueryType> compare) {
      FindRange(ref query, compare, out int startIndex, out int endIndex);
      RemoveIndexRange(startIndex, endIndex);
    }

    public int Find<TargetType>(ref TargetType target, SortCompare<ElemType, TargetType> compare, out bool found) {
      return FindInternal(ref target, compare, out found, false, false);
    }

    public bool Contains<TargetType>(ref TargetType target, SortCompare<ElemType, TargetType> compare)  {
      FindInternal(ref target, compare, out bool found, false, false);
      return found;
    }

    public void FindRange<QueryType>(ref QueryType query, SortCompare<ElemType, QueryType> compare, out int startIndexOut, out int endIndexOut) {
      startIndexOut = FindInternal(ref query, compare, out bool found, true, false);
      if (!found) {
        startIndexOut = 0;
        endIndexOut = 0;
        return;
      }
      endIndexOut = FindInternal(ref query, compare, out _, false, true) + 1;
    }

    private int FindInternal<TargetType>(ref TargetType target, SortCompare<ElemType, TargetType> compare, out bool found, bool findLow, bool findHigh) {
      // binary search
      int lowIdx = 0;
      int highIdx = Count - 1;

      int lastFound = 0;
      found = false;

      while (lowIdx <= highIdx) {
        int midIdx = (lowIdx + highIdx) / 2;
        ElemType midValue = GetAt(midIdx);
        int d = compare(ref midValue, ref target);
        if (d > 0) {
          highIdx = midIdx - 1;
        } else if (d < 0) {
          lowIdx = midIdx + 1;
        } else {
          found = true;
          lastFound = midIdx;
          if (findLow) {
            highIdx = midIdx - 1;
          } else if (findHigh) {
            lowIdx = midIdx + 1;
          } else {
            break;
          }
        }
      }
      return found ? lastFound : lowIdx;
    }
  }

}
