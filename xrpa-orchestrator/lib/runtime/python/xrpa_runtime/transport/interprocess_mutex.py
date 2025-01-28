# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import ctypes
import sys

assert sys.platform == "win32"

from ctypes.wintypes import BOOL, DWORD, HANDLE, LPCVOID, LPCWSTR

_CreateMutex = ctypes.windll.kernel32.CreateMutexW
_CreateMutex.argtypes = [LPCVOID, BOOL, LPCWSTR]
_CreateMutex.restype = HANDLE

_OpenMutex = ctypes.windll.kernel32.OpenMutexW
_OpenMutex.argtypes = [DWORD, BOOL, LPCWSTR]
_OpenMutex.restype = HANDLE

_GetLastError = ctypes.windll.kernel32.GetLastError
_GetLastError.argtypes = []
_GetLastError.restype = DWORD

_WaitForSingleObject = ctypes.windll.kernel32.WaitForSingleObject
_WaitForSingleObject.argtypes = [HANDLE, DWORD]
_WaitForSingleObject.restype = DWORD

_ReleaseMutex = ctypes.windll.kernel32.ReleaseMutex
_ReleaseMutex.argtypes = [HANDLE]
_ReleaseMutex.restype = BOOL

_CloseHandle = ctypes.windll.kernel32.CloseHandle
_CloseHandle.argtypes = [HANDLE]
_CloseHandle.restype = BOOL

_SYNCHRONIZE = 0x00100000
_ERROR_ALREADY_EXISTS = 183


class InterprocessMutex:
    def __init__(self, name: str):
        self._name = f"Global\\{name}"
        self._mutex = _CreateMutex(None, False, self._name)
        if self._mutex != 0 and _GetLastError() == _ERROR_ALREADY_EXISTS:
            print(f"Mutex {name} already exists, opening it for SYNCHRONIZE")
            _CloseHandle(self._mutex)
            self._mutex = _OpenMutex(_SYNCHRONIZE, False, self._name)

        assert self._mutex != 0

    def close(self):
        if self._mutex != 0:
            _CloseHandle(self._mutex)
            self._mutex = 0

    __del__ = close

    def try_lock(self, timeoutMS: int) -> bool:
        if self._mutex == 0:
            return False
        if _WaitForSingleObject(self._mutex, timeoutMS) == 0:
            return True
        return False

    def release(self):
        if self._mutex != 0:
            _ReleaseMutex(self._mutex)
