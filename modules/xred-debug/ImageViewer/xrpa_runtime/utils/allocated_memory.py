# @generated
# (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.


from xrpa_runtime.utils.memory_accessor import MemoryAccessor


class AllocatedMemory:
    def __init__(self, size: int):
        self._memory = bytearray(size)
        self._memory_accessor = MemoryAccessor(memoryview(self._memory), 0, size)

    @property
    def accessor(self) -> MemoryAccessor:
        return self._memory_accessor
