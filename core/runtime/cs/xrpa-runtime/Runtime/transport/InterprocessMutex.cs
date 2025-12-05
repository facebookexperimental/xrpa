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

        // flock() operations
        private const int LOCK_EX = 2; // exclusive lock
        private const int LOCK_UN = 8; // unlock
        private const int LOCK_NB = 4; // non-blocking

        // errno values
        private const int EWOULDBLOCK = 35; // Resource temporarily unavailable (macOS)

        private string _lockFilePath;
        private FileStream _lockFileStream; // Only non-null while locked

        public MacOsInterprocessMutex(string name)
        {
            const string tempPath = "/tmp/xrpa";
            _lockFilePath = Path.Combine(tempPath, $"{name}.lock");

            // Create the directory and touch the file to ensure it exists
            Directory.CreateDirectory(tempPath);

            // Create the lock file if it doesn't exist
            if (!File.Exists(_lockFilePath))
            {
                File.Create(_lockFilePath).Dispose();
            }
        }

        private bool Lock()
        {
            if (_lockFileStream != null)
            {
                return true;
            }

            try
            {
                // Open the file fresh for this lock attempt
                _lockFileStream = new FileStream(
                    _lockFilePath,
                    FileMode.OpenOrCreate,
                    FileAccess.ReadWrite,
                    FileShare.ReadWrite);

                int fd = _lockFileStream.SafeFileHandle.DangerousGetHandle().ToInt32();
                int result = flock(fd, LOCK_EX | LOCK_NB);

                if (result == 0)
                {
                    return true;
                }
                else
                {
                    int errorCode = Marshal.GetLastWin32Error();
                    // Close the file stream since we didn't get the lock
                    _lockFileStream.Dispose();
                    _lockFileStream = null;

                    // EWOULDBLOCK is expected when lock is held by another process
                    if (errorCode != EWOULDBLOCK)
                    {
                        Console.WriteLine($"Error locking file (fd={fd}): errno={errorCode}");
                    }
                    return false;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error locking file: {ex.Message}");
                if (_lockFileStream != null)
                {
                    _lockFileStream.Dispose();
                    _lockFileStream = null;
                }
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

                // For longer timeouts, use polling with 1ms sleep to reduce CPU usage
                if (timeoutMS >= 5)
                {
                    Thread.Sleep(1);
                }
            } while (stopwatch.ElapsedMilliseconds < timeoutMS);

            return false;
        }

        public override void Unlock()
        {
            if (_lockFileStream == null)
            {
                return;
            }

            try
            {
                int fd = _lockFileStream.SafeFileHandle.DangerousGetHandle().ToInt32();
                int result = flock(fd, LOCK_UN);

                if (result != 0)
                {
                    Console.WriteLine($"Error unlocking file (fd={fd}): errno={Marshal.GetLastWin32Error()}");
                }
            }
            finally
            {
                _lockFileStream.Dispose();
                _lockFileStream = null;
            }
        }

        public override void Dispose()
        {
            Unlock();
        }
    }
}
