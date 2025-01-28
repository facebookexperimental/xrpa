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

namespace Xrpa
{

    unsafe public class SharedMemoryTransportStream : MemoryTransportStream
    {
        public SharedMemoryTransportStream(string name, TransportConfig config) : base(name, config)
        {
            bool didCreate = false;

            // open the shared memory file if it already exists
            try
            {
                _memFile = MemoryMappedFile.OpenExisting(_name, MemoryMappedFileRights.ReadWrite);
            }
            catch { }

            // create the shared memory file if it does not exist
            if (_memFile == null)
            {
                try
                {
                    _memFile = MemoryMappedFile.CreateOrOpen(_name, _memSize, MemoryMappedFileAccess.ReadWrite);
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
                    _memFile = MemoryMappedFile.OpenExisting(_name, MemoryMappedFileRights.ReadWrite);
                }
                catch { }
            }

            if (_memFile != null)
            {
                _memView = _memFile.CreateViewAccessor(0, _memSize, MemoryMappedFileAccess.ReadWrite);
                InitializeMemory(didCreate);
            }
        }

        public override void Dispose()
        {
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

            base.Dispose();
        }

        public override bool UnsafeAccessMemory(System.Action<MemoryAccessor> func)
        {
            if (_memView == null)
            {
                return false;
            }
            byte* bytePointer = null;
            _memView.SafeMemoryMappedViewHandle.AcquirePointer(ref bytePointer);
            if (bytePointer == null)
            {
                return false;
            }

            try
            {
                func(new MemoryAccessor(bytePointer, 0, _memSize));
                return true;
            }
            finally
            {
                _memView.SafeMemoryMappedViewHandle.ReleasePointer();
            }
        }

        private MemoryMappedFile _memFile;
        private MemoryMappedViewAccessor _memView;
    }

}
