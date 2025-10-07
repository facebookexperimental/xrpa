# @generated
# (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.


import uuid
from dataclasses import dataclass

from xrpa_runtime.utils.memory_accessor import MemoryAccessor, MemoryOffset


class ObjectAccessorInterface:
    def __init__(self, mem_accessor: "MemoryAccessor" = None):
        self._mem_accessor = mem_accessor

    def is_null(self) -> bool:
        return self._mem_accessor is None or self._mem_accessor.is_null()


class HashValue:
    def __init__(self, part0: int, part1: int, part2: int, part3: int):
        self.Value0 = part0
        self.Value1 = part1
        self.Value2 = part2
        self.Value3 = part3

    def __eq__(self, other: "HashValue"):
        return (
            self.Value0 == other.Value0
            and self.Value1 == other.Value1
            and self.Value2 == other.Value2
            and self.Value3 == other.Value3
        )

    def __ne__(self, other: "HashValue"):
        return not self.__eq__(other)

    def __hash__(self):
        return hash((self.Value0, self.Value1, self.Value2, self.Value3))

    @staticmethod
    def read_value(mem_accessor, offset: MemoryOffset) -> "HashValue":
        v0 = mem_accessor.read_ulong(offset)
        v1 = mem_accessor.read_ulong(offset)
        v2 = mem_accessor.read_ulong(offset)
        v3 = mem_accessor.read_ulong(offset)
        return HashValue(v0, v1, v2, v3)

    @staticmethod
    def write_value(value, mem_accessor, offset: MemoryOffset):
        mem_accessor.write_ulong(value.Value0, offset)
        mem_accessor.write_ulong(value.Value1, offset)
        mem_accessor.write_ulong(value.Value2, offset)
        mem_accessor.write_ulong(value.Value3, offset)


@dataclass(frozen=True)
class TransportConfig:
    schema_hash: HashValue
    changelog_byte_count: int


class ObjectUuid:
    def __init__(self, part0: int, part1: int):
        self.ID0 = part0
        self.ID1 = part1

    @classmethod
    def from_uint(cls, A: int, B: int, C: int, D: int):
        ID0 = ((A) << 32) | B
        ID1 = ((C) << 32) | D
        return cls(ID0, ID1)

    @classmethod
    def from_uuid(cls, guid: uuid.UUID):
        bytes = guid.bytes
        A = (bytes[0]) << 24 | (bytes[1]) << 16 | (bytes[2]) << 8 | (bytes[3])
        B = (bytes[4]) << 24 | (bytes[5]) << 16 | (bytes[6]) << 8 | (bytes[7])
        C = (bytes[8]) << 24 | (bytes[9]) << 16 | (bytes[10]) << 8 | (bytes[11])
        D = (bytes[12]) << 24 | (bytes[13]) << 16 | (bytes[14]) << 8 | (bytes[15])
        return cls.from_uint(A, B, C, D)

    def clear(self):
        self.ID0 = 0
        self.ID1 = 0

    def is_empty(self) -> bool:
        return self.ID0 == 0 and self.ID1 == 0

    def __eq__(self, other: "ObjectUuid"):
        return self.ID0 == other.ID0 and self.ID1 == other.ID1

    def __ne__(self, other: "ObjectUuid"):
        return not self.__eq__(other)

    def __hash__(self: "ObjectUuid"):
        return hash((self.ID0, self.ID1))

    def compare(self, other: "ObjectUuid"):
        if self.ID0 == other.ID0:
            if self.ID1 == other.ID1:
                return 0
            return self.ID1 < other.ID1 and -1 or 1
        return self.ID0 < other.ID0 and -1 or 1

    @staticmethod
    def read_value(mem_accessor: MemoryAccessor, offset: MemoryOffset) -> "ObjectUuid":
        id0 = mem_accessor.read_ulong(offset)
        id1 = mem_accessor.read_ulong(offset)
        return ObjectUuid(id0, id1)

    @staticmethod
    def write_value(
        value: "ObjectUuid", mem_accessor: MemoryAccessor, offset: MemoryOffset
    ):
        mem_accessor.write_ulong(value.ID0, offset)
        mem_accessor.write_ulong(value.ID1, offset)
