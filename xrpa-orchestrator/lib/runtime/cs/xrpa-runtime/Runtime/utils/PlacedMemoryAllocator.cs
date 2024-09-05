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

namespace Xrpa
{

    public class PlacedMemoryAllocator
    {
        private static readonly int PROPS_SIZE = 8;

        private MemoryAccessor _memSource;
        private MemoryAccessor _propsAccessor;
        private MemoryAccessor _poolAccessor;

        public PlacedMemoryAllocator(MemoryAccessor memSource, long memOffset)
        {
            _memSource = memSource;
            _propsAccessor = memSource.Slice(memOffset, PROPS_SIZE);
            _poolAccessor = memSource.Slice(memOffset + PROPS_SIZE, _propsAccessor.ReadInt(4));
        }

        public static int GetMemSize(int poolSize)
        {
            return PROPS_SIZE + poolSize;
        }

        public int FirstFree
        {
            get
            {
                return _propsAccessor.ReadInt(0);
            }
            set
            {
                _propsAccessor.WriteInt(value, 0);
            }
        }

        public int PoolSize
        {
            get
            {
                return _propsAccessor.ReadInt(4);
            }
            set
            {
                _propsAccessor.WriteInt(value, 4);
            }
        }

        public void Init(int poolSize)
        {
            FirstFree = 0;
            PoolSize = poolSize;
            _poolAccessor = _memSource.Slice(_propsAccessor.MemOffset - _memSource.MemOffset + PROPS_SIZE, poolSize);

            WriteNodeSize(0, poolSize);
            WriteNodeNext(0, -1);
            WriteNodePrev(0, -1);
        }

        public void Reset()
        {
            Init(PoolSize);
        }

        private static readonly int SplitThreshold = 64;

        private static readonly int AllocNodeSize = 4;
        private static readonly int FreeNodeSize = 12;

        private void WriteNodeSize(int nodeOffset, int size)
        {
            _poolAccessor.WriteInt(size, nodeOffset);
        }

        private void WriteNodeNext(int nodeOffset, int next)
        {
            _poolAccessor.WriteInt(next, nodeOffset + 4);
        }

        private void WriteNodePrev(int nodeOffset, int prev)
        {
            _poolAccessor.WriteInt(prev, nodeOffset + 8);
        }

        private int ReadNodeSize(int nodeOffset)
        {
            return _poolAccessor.ReadInt(nodeOffset);
        }

        private int ReadNodeNext(int nodeOffset)
        {
            return _poolAccessor.ReadInt(nodeOffset + 4);
        }

        private int ReadNodePrev(int nodeOffset)
        {
            return _poolAccessor.ReadInt(nodeOffset + 8);
        }

        private static int Align(int x)
        {
            return (x + 3) & ~3;
        }

        public MemoryAccessor Alloc(int numBytes)
        {
            DebugValidateFreeNodes();

            // an allocated block MUST be large enough to hold a FreeNode when it is returned to the heap
            int sizeNeeded = Align(AllocNodeSize + numBytes);
            if (sizeNeeded < FreeNodeSize)
            {
                sizeNeeded = FreeNodeSize;
            }

            int foundOffset = -1;
            int foundSize = 0;

            int curOffset = FirstFree;
            while (curOffset >= 0)
            {
                int curSize = ReadNodeSize(curOffset);
                if (curSize >= sizeNeeded && (foundOffset < 0 || curSize < foundSize))
                {
                    foundOffset = curOffset;
                    foundSize = curSize;
                }
                curOffset = ReadNodeNext(curOffset);
            }
            if (foundOffset < 0)
            {
                return new MemoryAccessor();
            }

            int foundNext = ReadNodeNext(foundOffset);
            int foundPrev = ReadNodePrev(foundOffset);

            if (foundSize - sizeNeeded > SplitThreshold)
            {
                // split found node
                int splitOffset = foundOffset + sizeNeeded;
                WriteNodeSize(splitOffset, foundSize - sizeNeeded);
                WriteNodePrev(splitOffset, foundPrev);
                WriteNodeNext(splitOffset, foundNext);
                FixupNodeNeighbors(splitOffset);

                // reduce the size of the found node
                WriteNodeSize(foundOffset, sizeNeeded);
            }
            else
            {
                // fixup linked list to remove foundNode
                if (foundPrev >= 0)
                {
                    WriteNodeNext(foundPrev, foundNext);
                }
                else
                {
                    FirstFree = foundNext;
                }

                if (foundNext >= 0)
                {
                    WriteNodePrev(foundNext, foundPrev);
                }
            }

            DebugValidateFreeNodes();

            return _poolAccessor.Slice(foundOffset + AllocNodeSize, sizeNeeded - AllocNodeSize);
        }

        public int GetAllocOffset(MemoryAccessor mem)
        {
            if (mem.MemOffset == 0)
            {
                return 0;
            }
            return (int)(mem.MemOffset - _poolAccessor.MemOffset);
        }

        public MemoryAccessor Get(int allocOffset)
        {
            if (allocOffset < AllocNodeSize)
            {
                return new MemoryAccessor();
            }
            int nodeOffset = allocOffset - AllocNodeSize;
            int nodeSize = ReadNodeSize(nodeOffset);
            return _poolAccessor.Slice(allocOffset, nodeSize - AllocNodeSize);
        }

        public void Free(int allocOffset)
        {
            int nodeOffset = allocOffset - AllocNodeSize;
            if (nodeOffset < 0)
            {
                // invalid offset
                return;
            }

            DebugValidateFreeNodes();

            int size = ReadNodeSize(nodeOffset);

            // find correct place to insert newly freed node, to keep the nodes sorted
            int prevOffset = -1;
            int nextOffset = FirstFree;
            while (nextOffset >= 0 && nodeOffset > nextOffset)
            {
                prevOffset = nextOffset;
                nextOffset = ReadNodeNext(nextOffset);
            }

            // merge with prev node if adjacent
            if (prevOffset >= 0)
            {
                int prevNodeSize = ReadNodeSize(prevOffset);
                if (nodeOffset == prevOffset + prevNodeSize)
                {
                    nodeOffset = prevOffset;
                    prevOffset = ReadNodePrev(prevOffset);
                    size += prevNodeSize;
                }
            }

            // merge with next node if adjacent
            if (nextOffset == nodeOffset + size)
            {
                int nextNodeSize = ReadNodeSize(nextOffset);
                nextOffset = ReadNodeNext(nextOffset);
                size += nextNodeSize;
            }

            // create new node in linked list
            WriteNodeSize(nodeOffset, size);
            WriteNodePrev(nodeOffset, prevOffset);
            WriteNodeNext(nodeOffset, nextOffset);
            FixupNodeNeighbors(nodeOffset);

            DebugValidateFreeNodes();
        }

        public void Free(MemoryAccessor mem)
        {
            Free(GetAllocOffset(mem));
        }

        private void FixupNodeNeighbors(int offset)
        {
            int nodePrev = ReadNodePrev(offset);
            int nodeNext = ReadNodeNext(offset);
            if (nodePrev >= 0)
            {
                WriteNodeNext(nodePrev, offset);
            }
            else
            {
                FirstFree = offset;
            }

            if (nodeNext >= 0)
            {
                WriteNodePrev(nodeNext, offset);
            }
        }

        // this function is public for tests to use, not for general use
        public void DebugValidateFreeNodes()
        {
            int curOffset = FirstFree;
            XrpaUtils.DebugAssert(curOffset >= -1, "PlacedMemoryAllocator.DebugValidateFreeNodes failed");

            while (curOffset >= 0)
            {
                int curSize = ReadNodeSize(curOffset);
                int prevOffset = ReadNodePrev(curOffset);
                int nextOffset = ReadNodeNext(curOffset);

                XrpaUtils.DebugAssert(curSize > 0, "PlacedMemoryAllocator.DebugValidateFreeNodes failed");
                XrpaUtils.DebugAssert(prevOffset < curOffset, "PlacedMemoryAllocator.DebugValidateFreeNodes failed");
                XrpaUtils.DebugAssert(nextOffset == -1 || nextOffset >= curOffset + curSize, "PlacedMemoryAllocator.DebugValidateFreeNodes failed");

                curOffset = nextOffset;
            }
        }
    }
}
