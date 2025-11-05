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
using System.IO;
using System.IO.MemoryMappedFiles;
using System.Runtime.InteropServices;

namespace Xrpa
{
    public class SharedMemoryFile : IDisposable
    {
        public MemoryMappedFile memFile;
        public bool didCreate = false;

        public void Dispose()
        {
            if (memFile != null)
            {
                memFile.Dispose();
                memFile = null;
            }
        }
    }

    public class WindowsSharedMemoryFile : SharedMemoryFile
    {
        public WindowsSharedMemoryFile(string name, int memSize)
        {
            // open the shared memory file if it already exists
            try
            {
                memFile = MemoryMappedFile.OpenExisting(name, MemoryMappedFileRights.ReadWrite);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception caught while opening existing memory file: {ex.Message}");
            }

            // create the shared memory file if it does not exist
            if (memFile == null)
            {
                try
                {
                    memFile = MemoryMappedFile.CreateOrOpen(name, memSize, MemoryMappedFileAccess.ReadWrite);
                    if (memFile != null)
                    {
                        didCreate = true;
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Exception caught while creating or opening memory file: {ex.Message}");
                }
            }

            // if the create failed then it is possible we hit a race condition, so try opening it again
            if (memFile == null)
            {
                try
                {
                    memFile = MemoryMappedFile.OpenExisting(name, MemoryMappedFileRights.ReadWrite);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Exception caught while reopening existing memory file: {ex.Message}");
                }
            }
        }
    }

    public class MacOsSharedMemoryFile : SharedMemoryFile
    {
        public MacOsSharedMemoryFile(string name, int memSize)
        {
            string tempPath = "/tmp/xrpa/";
            string filePath = Path.Combine(tempPath, $"{name}");

            if (!File.Exists(filePath))
            {
                try
                {
                    Directory.CreateDirectory(tempPath);

                    using (var fs = new FileStream(filePath, FileMode.Create))
                    {
                        fs.SetLength(memSize);
                        didCreate = true;
                        Console.WriteLine($"Created shared memory file at {filePath} with size {memSize} bytes");
                    }
                }
                catch (IOException ex)
                {
                    Console.WriteLine($"Shared memory file creation failed with IOException: {ex.Message}");
                    throw new InvalidOperationException($"Could not create shared memory file at {filePath}", ex);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Shared memory file creation failed: {ex.Message}");
                    throw new InvalidOperationException($"Could not create shared memory file: {filePath}", ex);
                }
            }

            try
            {
                memFile = MemoryMappedFile.CreateFromFile(filePath, FileMode.Open, null, memSize, MemoryMappedFileAccess.ReadWrite);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Shared memory creation from file failed: {ex.Message}");
                throw new InvalidOperationException($"Could not create shared memory from file: {filePath}", ex);
            }
        }
    }

    unsafe public class SharedMemoryTransportStream : MemoryTransportStream
    {
        public SharedMemoryTransportStream(string name, TransportConfig config) : base(name, config)
        {
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            {
                _memFile = new WindowsSharedMemoryFile(name, _memSize);
            }
            else if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
            {
                _memFile = new MacOsSharedMemoryFile(name, _memSize);
            }
            else
            {
                throw new NotImplementedException($"Unsupported platform: {RuntimeInformation.OSDescription}");
            }

            if (_memFile != null)
            {
                _memView = _memFile.memFile.CreateViewAccessor(0, _memSize, MemoryMappedFileAccess.ReadWrite);
                if (!InitializeMemory(_memFile.didCreate))
                {
                    Shutdown();
                }
            }
        }

        public override void Dispose()
        {
            Shutdown();
            base.Dispose();
        }

        private void Shutdown()
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

        private SharedMemoryFile _memFile;
        private MemoryMappedViewAccessor _memView;
    }

}
