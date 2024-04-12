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

using System.Runtime.InteropServices;

namespace Xrpa {

  public delegate int SortCompare<LeftType, RightType>(ref LeftType a, ref RightType b);

  public class PlacedSortedArray<ElemType> where ElemType : struct {

    public PlacedSortedArray(System.IO.UnmanagedMemoryAccessor dataSource, long memOffset, SortCompare<ElemType, ElemType> elemCompare) {
      _dataSource = dataSource;
      _memOffset = memOffset;
      _elemCompare = elemCompare;
    }

    public static readonly int ElemSize = Marshal.SizeOf(typeof(ElemType));
    private static readonly int ElemOffset = 8;

    public static int GetMemSize(int maxCount) {
      return ElemOffset + maxCount * ElemSize;
    }

    public int MaxCount {
      get {
        return _dataSource.ReadInt32(_memOffset);
      }
      set {
        _dataSource.Write(_memOffset, value);
      }
    }

    public int Count {
      get {
        return _dataSource.ReadInt32(_memOffset + 4);
      }
      set {
        _dataSource.Write(_memOffset + 4, value);
      }
    }

    public void Init(int maxCount) {
      MaxCount = maxCount;
      Count = 0;
    }

    public void Reset() {
      Count = 0;
    }

    public bool IsFull() {
      return Count >= MaxCount;
    }

    public void GetAt(int index, out ElemType value) {
      _dataSource.Read(_memOffset + ElemOffset + index * ElemSize, out value);
    }

    private void SetAt(int index, ref ElemType value) {
      _dataSource.Write(_memOffset + ElemOffset + index * ElemSize, ref value);
    }

    private void MemShift(int toIndex, int fromIndex, int count) {
      var temp = new ElemType[count];
      _dataSource.ReadArray(_memOffset + ElemOffset + fromIndex * ElemSize, temp, 0, count);
      _dataSource.WriteArray(_memOffset + ElemOffset + toIndex * ElemSize, temp, 0, count);
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
        GetAt(midIdx, out ElemType midValue);
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

    private readonly System.IO.UnmanagedMemoryAccessor _dataSource;
    private readonly long _memOffset;
    private readonly SortCompare<ElemType, ElemType> _elemCompare;
  }

}
