# @generated
# (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.


import ctypes
import sys
import time

assert sys.platform in ["win32", "darwin"]


class InterprocessMutex:
    def __init__(self, name: str):
        self._name = name

    def close(self):
        raise NotImplementedError("close must be implemented by subclass")

    def try_lock(self, timeoutMS: int) -> bool:
        raise NotImplementedError("try_lock must be implemented by subclass")

    def release(self):
        raise NotImplementedError("release must be implemented by subclass")


if sys.platform == "win32":
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


class WindowsInterprocessMutex(InterprocessMutex):
    def __init__(self, name: str):
        super().__init__(name)
        self._mutex = _CreateMutex(None, False, f"Global\\{name}Mutex")
        if self._mutex != 0 and _GetLastError() == _ERROR_ALREADY_EXISTS:
            print(f"Mutex {name} already exists, opening it for SYNCHRONIZE")
            _CloseHandle(self._mutex)
            self._mutex = _OpenMutex(_SYNCHRONIZE, False, f"Global\\{name}Mutex")

        assert self._mutex != 0

    def close(self):
        if self._mutex != 0:
            _CloseHandle(self._mutex)
            self._mutex = 0

    def try_lock(self, timeoutMS: int) -> bool:
        acquired = False
        try:
            acquired = _WaitForSingleObject(self._mutex, timeoutMS) == 0
        except Exception as ex:
            print(f"Exception acquiring mutex: {ex}")
        return acquired

    def release(self):
        if self._mutex != 0:
            _ReleaseMutex(self._mutex)


if sys.platform == "darwin":
    import fcntl
    import os


class MacOsInterprocessMutex(InterprocessMutex):
    def __init__(self, name: str):
        super().__init__(name)
        self._lock_file_path = f"/tmp/xrpa/{name}.lock"
        self._is_locked = False

        try:
            os.makedirs(os.path.dirname(self._lock_file_path), exist_ok=True)
            with open(self._lock_file_path, "w"):
                pass
        except OSError as ex:
            print(f"Lock file creation failed: {ex}")
            raise

    def close(self):
        self.release()

    def try_lock(self, timeoutMS: int) -> bool:
        if timeoutMS <= 0:
            return self.lock()
        start_time = time.time()
        while True:
            if self.lock():
                return True
            if time.time() - start_time > timeoutMS / 1000:
                break
            time.sleep(0.001)
        return False

    def lock(self) -> bool:
        if self._is_locked:
            return True

        try:
            with open(self._lock_file_path, "r+") as f:
                fcntl.flock(f, fcntl.LOCK_EX | fcntl.LOCK_NB)
                self._is_locked = True
                return True
        except BlockingIOError:
            print("Error locking file")
            return False
        except Exception as ex:
            print(f"Error locking file: {ex}")
            return False

    def release(self):
        if not self._is_locked:
            return

        try:
            with open(self._lock_file_path, "r+") as f:
                fcntl.flock(f, fcntl.LOCK_UN)
                self._is_locked = False
        except Exception as ex:
            print(f"Error releasing file: {ex}")
