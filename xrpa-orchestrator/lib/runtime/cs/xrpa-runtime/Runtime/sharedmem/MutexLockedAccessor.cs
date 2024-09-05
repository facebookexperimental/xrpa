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

using System.Threading;

namespace Xrpa
{

    public class MutexLockedAccessor : System.IDisposable
    {
        public MutexLockedAccessor(MemoryAccessor memAccessor, Mutex lockedMutex, System.Action onDispose)
        {
            Memory = memAccessor;
            _mutex = lockedMutex;
            _onDispose = onDispose;
        }

        public void Dispose()
        {
            _onDispose();
            if (_mutex != null)
            {
                _mutex.ReleaseMutex();
                _mutex = null;
            }
        }

        public MemoryAccessor Memory { get; }
        private Mutex _mutex;
        private System.Action _onDispose;
    }

}
