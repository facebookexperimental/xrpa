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

using System.IO.MemoryMappedFiles;
using System.Threading;

namespace Xrpa
{

    unsafe public class SharedMemoryBlock : System.IDisposable
    {
        public SharedMemoryBlock() { }

        public SharedMemoryBlock(string name, int size)
        {
            OpenMemory(name, size);
        }

        public void Dispose()
        {
            CloseMemory();
        }

        public bool IsOpen()
        {
            return _memFile != null;
        }

        public bool OpenMemory(string name, int size)
        {
            bool didCreate = false;

            CloseMemory();

            _memName = name;
            _memSize = size;

            // open the shared memory file if it already exists
            try
            {
                _memFile = MemoryMappedFile.OpenExisting(_memName, MemoryMappedFileRights.ReadWrite);
            }
            catch { }

            // create the shared memory file if it does not exist
            if (_memFile == null)
            {
                try
                {
                    _memFile = MemoryMappedFile.CreateOrOpen(_memName, _memSize, MemoryMappedFileAccess.ReadWrite);
                    if (_memFile != null)
                    {
                        didCreate = true;
                    }
                }
                catch { }
            }

            // if the create failed then it is possible we hit a race condition, so try opening it again
            if (_memFile == null)
            {
                try
                {
                    _memFile = MemoryMappedFile.OpenExisting(_memName, MemoryMappedFileRights.ReadWrite);
                }
                catch { }
            }

            if (_memFile != null)
            {
                _memView = _memFile.CreateViewAccessor(0, _memSize, MemoryMappedFileAccess.ReadWrite);
                _mutex = new Mutex(false, "Global\\" + _memName + "Mutex");
            }

            return didCreate;
        }

        public void CloseMemory()
        {
            if (_mutex != null)
            {
                _mutex.Dispose();
                _mutex = null;
            }
            if (_memView != null)
            {
                _memView.Dispose();
                _memView = null;
            }
            if (_memFile != null)
            {
                _memFile.Dispose();
                _memFile = null;
            }
        }

        public MutexLockedAccessor Acquire(int timeoutMS)
        {
            if (_memFile == null)
            {
                OpenMemory(_memName, _memSize);
            }
            if (_mutex == null || !_mutex.WaitOne(timeoutMS))
            {
                return null;
            }

            return new MutexLockedAccessor(AcquireUnsafeAccess(), _mutex, () => ReleaseUnsafeAccess());
        }

        public MemoryAccessor AcquireUnsafeAccess()
        {
            if (_memView == null)
            {
                return null;
            }
            byte* bytePointer = null;
            _memView.SafeMemoryMappedViewHandle.AcquirePointer(ref bytePointer);
            return new MemoryAccessor(bytePointer, 0, _memSize);
        }

        public void ReleaseUnsafeAccess()
        {
            if (_memView != null)
            {
                _memView.SafeMemoryMappedViewHandle.ReleasePointer();
            }
        }

        private string _memName;
        private int _memSize;

        private MemoryMappedFile _memFile;
        private MemoryMappedViewAccessor _memView;
        private Mutex _mutex;
    }

}
