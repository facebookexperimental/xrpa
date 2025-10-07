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

    unsafe public class HeapMemoryTransportStream : MemoryTransportStream
    {
        public HeapMemoryTransportStream(string name, TransportConfig config) : base(name, config)
        {
            _memoryBlock = new(_memSize);
            _memoryPtr = (System.IntPtr)0;
            InitializeMemory(true);
        }

        public HeapMemoryTransportStream(string name, TransportConfig config, System.IntPtr memoryPtr) : base(name, config)
        {
            _memoryBlock = null;
            _memoryPtr = memoryPtr;
            InitializeMemory(false);
        }

        public override void Dispose()
        {
            if (_memoryBlock != null)
            {
                _memoryBlock.Dispose();
                _memoryBlock = null;
            }

            base.Dispose();
        }

        public override bool UnsafeAccessMemory(System.Action<MemoryAccessor> func)
        {
            if (_memoryBlock != null)
            {
                func(_memoryBlock.Accessor);
            }
            else
            {
                func(new MemoryAccessor((byte*)_memoryPtr, 0, _memSize));
            }
            return true;
        }

        public System.IntPtr GetMemoryPtr()
        {
            if (_memoryBlock != null)
            {
                return (System.IntPtr)_memoryBlock.Accessor.DataSource;
            }
            else
            {
                return _memoryPtr;
            }
        }

        private AllocatedMemory _memoryBlock;
        private System.IntPtr _memoryPtr;
    }

}
