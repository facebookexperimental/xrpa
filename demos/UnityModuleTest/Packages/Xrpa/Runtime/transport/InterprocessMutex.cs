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
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading;

namespace Xrpa
{
    public abstract class InterprocessMutex : IDisposable
    {
        public abstract bool LockWait(int timeoutMS);
        public abstract void Unlock();
        public abstract void Dispose();
    }

    public class WindowsInterprocessMutex : InterprocessMutex
    {
        private Mutex _mutex;
        private string _name;

        public WindowsInterprocessMutex(string name)
        {
            _mutex = new Mutex(false, "Global\\" + name + "Mutex");
            _name = name;
        }

        public override bool LockWait(int timeoutMS)
        {
            bool acquired = false;
            try
            {
                acquired = _mutex.WaitOne(timeoutMS);
            }
            catch (AbandonedMutexException)
            {
                // Previous owner terminated without releasing mutex
                Console.WriteLine($"Acquired abandoned mutex for {_name}");
                acquired = true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception acquiring mutex: {ex.Message}");
            }
            return acquired;
        }

        public override void Unlock()
        {
            _mutex.ReleaseMutex();
        }

        public override void Dispose()
        {
            if (_mutex != null)
            {
                _mutex.Dispose();
                _mutex = null;
            }
        }
    }

    public class MacOsInterprocessMutex : InterprocessMutex
    {
        // P/Invoke for flock
        [DllImport("libc", SetLastError = true)]
        private static extern int flock(int fd, int operation);

        private const int LOCK_EX = 2; // exclusive lock
        private const int LOCK_UN = 8; // unlock
        private const int LOCK_NB = 4; // non-blocking

        private string _lockFilePath;
        private bool _isLocked = false;

        public MacOsInterprocessMutex(string name)
        {
            const string tempPath = "/tmp/xrpa";
            _lockFilePath = Path.Combine(tempPath, $"{name}.lock");

            try
            {
                Directory.CreateDirectory(tempPath);

                using (var fs = new FileStream(
                    _lockFilePath,
                    FileMode.OpenOrCreate,
                    FileAccess.ReadWrite,
                    FileShare.ReadWrite,
                    4096))
                {
                    // nothing to do here, just need to open the file to create it
                }
            }
            catch (IOException ex)
            {
                Console.WriteLine($"Lock file creation failed: {ex.Message}");
                throw new InvalidOperationException($"Could not create lock file at {_lockFilePath}", ex);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lock file creation failed: {ex.Message}");
                throw new InvalidOperationException($"Could not create lock file: {_lockFilePath}", ex);
            }
        }

        private bool Lock()
        {
            if (_isLocked)
            {
                return true;
            }

            try
            {
                using (var fs = new FileStream(_lockFilePath, FileMode.OpenOrCreate))
                {
                    bool result = flock(fs.SafeFileHandle.DangerousGetHandle().ToInt32(), LOCK_EX | LOCK_NB) == 0;
                    if (result)
                    {
                        _isLocked = true;
                    }
                    else
                    {
                        Console.WriteLine($"Error locking file: {Marshal.GetLastWin32Error()}");
                    }
                    return result;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error locking file: {ex.Message}");
                return false;
            }
        }

        public override bool LockWait(int timeoutMS)
        {
            if (timeoutMS <= 0)
            {
                return Lock();
            }

            var stopwatch = new Stopwatch();
            stopwatch.Start();

            do
            {
                if (Lock())
                {
                    return true;
                }

                Thread.Sleep(1);
            } while (stopwatch.ElapsedMilliseconds < timeoutMS);

            return false;
        }

        public override void Unlock()
        {
            if (!_isLocked)
            {
                return;
            }

            try
            {
                using (var fs = new FileStream(_lockFilePath, FileMode.Open))
                {
                    bool result = flock(fs.SafeFileHandle.DangerousGetHandle().ToInt32(), LOCK_UN) == 0;
                    _isLocked = false;
                    if (!result)
                    {
                        Console.WriteLine($"Error unlocking file: {Marshal.GetLastWin32Error()}");
                    }
                    return;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error unlocking file: {ex.Message}");
                return;
            }
        }

        public override void Dispose()
        {
            Unlock();
        }
    }
}
