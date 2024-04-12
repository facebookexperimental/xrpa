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

namespace Xrpa {

  public class MutexLockedAccessor : System.IDisposable {
    public MutexLockedAccessor(System.IO.UnmanagedMemoryAccessor accessor, Mutex lockedMutex) {
      View = accessor;
      _mutex = lockedMutex;
    }

    public void Dispose() {
      if (_mutex != null) {
        _mutex.ReleaseMutex();
        _mutex = null;
      }
    }

    public System.IO.UnmanagedMemoryAccessor View { get; }

    private Mutex _mutex;
  }

}
