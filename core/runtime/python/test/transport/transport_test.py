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


from xrpa_runtime.reconciler.collection_change_types import (
    CollectionChangeEventAccessor,
    CollectionChangeType,
    CollectionUpdateChangeEventAccessor,
)
from xrpa_runtime.transport.transport_stream import TransportStream
from xrpa_runtime.transport.transport_stream_accessor import TransportStreamAccessor
from xrpa_runtime.utils.memory_accessor import MemoryAccessor, MemoryOffset
from xrpa_runtime.utils.xrpa_types import ObjectAccessorInterface, ObjectUuid


class FooTypeReader(ObjectAccessorInterface):
    aChangedBit = 1
    bChangedBit = 2

    aByteCount = 4
    bByteCount = 4

    def __init__(self, mem_accessor: MemoryAccessor):
        ObjectAccessorInterface.__init__(self, mem_accessor)
        self._read_offset = MemoryOffset()

    def get_a(self) -> int:
        return self._mem_accessor.read_int(self._read_offset)

    def get_b(self) -> float:
        return self._mem_accessor.read_float(self._read_offset)


class FooTypeWriter(FooTypeReader):
    @staticmethod
    def create(
        accessor: TransportStreamAccessor,
        collection_id: int,
        id: ObjectUuid,
        change_byte_count: int = 8,
        timestamp: int = 0,
    ) -> "FooTypeWriter":
        change_event = accessor.write_change_event(
            CollectionChangeEventAccessor,
            CollectionChangeType.CreateObject.value,
            change_byte_count,
            timestamp,
        )
        assert not change_event.is_null()
        change_event.set_collection_id(collection_id)
        change_event.set_object_id(id)
        return FooTypeWriter(change_event.access_change_data())

    @staticmethod
    def update(
        accessor: TransportStreamAccessor,
        collection_id: int,
        id: ObjectUuid,
        fields_changed: int,
        change_byte_count: int,
    ) -> "FooTypeWriter":
        change_event = accessor.write_change_event(
            CollectionUpdateChangeEventAccessor,
            CollectionChangeType.UpdateObject.value,
            change_byte_count,
        )
        assert not change_event.is_null()
        change_event.set_collection_id(collection_id)
        change_event.set_object_id(id)
        change_event.set_fields_changed(fields_changed)
        return FooTypeWriter(change_event.access_change_data())

    def __init__(self, mem_accessor: MemoryAccessor):
        FooTypeReader.__init__(self, mem_accessor)
        self._write_offset = MemoryOffset()

    def set_a(self, value: int):
        self._mem_accessor.write_int(value, self._write_offset)

    def set_b(self, value: float):
        self._mem_accessor.write_float(value, self._write_offset)


class BarTypeReader(ObjectAccessorInterface):
    cChangedBit = 1
    strChangedBit = 2

    cByteCount = 8

    def __init__(self, mem_accessor: MemoryAccessor):
        ObjectAccessorInterface.__init__(self, mem_accessor)
        self._read_offset = MemoryOffset()

    def get_c(self) -> int:
        return self._mem_accessor.read_ulong(self._read_offset)

    def get_str(self) -> str:
        return self._mem_accessor.read_str(self._read_offset)


class BarTypeWriter(BarTypeReader):
    @staticmethod
    def create(
        accessor: TransportStreamAccessor,
        collection_id: int,
        id: ObjectUuid,
        change_byte_count: int,
        timestamp: int = 0,
    ) -> "BarTypeWriter":
        change_event = accessor.write_change_event(
            CollectionChangeEventAccessor,
            CollectionChangeType.CreateObject.value,
            change_byte_count,
            timestamp,
        )
        change_event.set_collection_id(collection_id)
        change_event.set_object_id(id)
        return BarTypeWriter(change_event.access_change_data())

    @staticmethod
    def update(
        accessor: TransportStreamAccessor,
        collection_id: int,
        id: ObjectUuid,
        fields_changed: int,
        change_byte_count: int,
    ) -> "BarTypeWriter":
        change_event = accessor.write_change_event(
            CollectionUpdateChangeEventAccessor,
            CollectionChangeType.UpdateObject.value,
            change_byte_count,
        )
        change_event.set_collection_id(collection_id)
        change_event.set_object_id(id)
        change_event.set_fields_changed(fields_changed)
        return BarTypeWriter(change_event.access_change_data())

    def __init__(self, mem_accessor: MemoryAccessor):
        BarTypeReader.__init__(self, mem_accessor)
        self._write_offset = MemoryOffset()

    def set_c(self, value: int):
        self._mem_accessor.write_ulong(value, self._write_offset)

    def set_str(self, value: str):
        self._mem_accessor.write_str(value, self._write_offset)


class TransportTest:
    Foo1ID = ObjectUuid(0, 100)
    Foo2ID = ObjectUuid(0, 200)
    Foo3ID = ObjectUuid(0, 300)

    Bar1ID = ObjectUuid(1, 100)
    Bar2ID = ObjectUuid(1, 200)

    @staticmethod
    def run_transport_object_tests(
        reader_transport: TransportStream, writer_transport: TransportStream
    ):
        reader_iter = reader_transport.create_iterator()

        def createFoo1(writer: TransportStreamAccessor):
            foo1 = FooTypeWriter.create(writer, 0, TransportTest.Foo1ID)
            assert not foo1.is_null()
            foo1.set_a(10)
            foo1.set_b(45.2)

        writer_transport.transact(1, createFoo1)

        def verifyCreateFoo1(reader: TransportStreamAccessor):
            entry = CollectionChangeEventAccessor(reader_iter.get_next_entry(reader))
            assert not entry.is_null()
            assert entry.get_change_type() == CollectionChangeType.CreateObject.value
            assert entry.get_object_id() == TransportTest.Foo1ID
            assert entry.get_collection_id() == 0
            foo1 = FooTypeReader(entry.access_change_data())
            assert foo1.get_a() == 10
            assert 45.199 < foo1.get_b() < 45.201

        reader_transport.transact(1, verifyCreateFoo1)

        def createBar1(writer: TransportStreamAccessor):
            bar1 = BarTypeWriter.create(
                writer,
                1,
                TransportTest.Bar1ID,
                BarTypeReader.cByteCount + 4 + MemoryAccessor.dyn_size_of_str("Hello"),
            )
            assert not bar1.is_null()
            bar1.set_c(15)
            bar1.set_str("Hello")

        writer_transport.transact(1, createBar1)

        def verifyCreateBar1(reader: TransportStreamAccessor):
            entry = CollectionChangeEventAccessor(reader_iter.get_next_entry(reader))
            assert not entry.is_null()
            assert entry.get_change_type() == CollectionChangeType.CreateObject.value
            assert entry.get_object_id() == TransportTest.Bar1ID
            assert entry.get_collection_id() == 1
            bar1 = BarTypeReader(entry.access_change_data())
            assert bar1.get_c() == 15
            assert bar1.get_str() == "Hello"

        reader_transport.transact(1, verifyCreateBar1)

        def createFoo2(writer: TransportStreamAccessor):
            foo2 = FooTypeWriter.create(writer, 0, TransportTest.Foo2ID)
            assert not foo2.is_null()
            foo2.set_a(500)
            foo2.set_b(17)

        writer_transport.transact(1, createFoo2)

        def verifyCreateFoo2(reader: TransportStreamAccessor):
            entry = CollectionChangeEventAccessor(reader_iter.get_next_entry(reader))
            assert not entry.is_null()
            assert entry.get_change_type() == CollectionChangeType.CreateObject.value
            assert entry.get_object_id() == TransportTest.Foo2ID
            assert entry.get_collection_id() == 0
            foo2 = FooTypeReader(entry.access_change_data())
            assert foo2.get_a() == 500
            assert foo2.get_b() == 17

        reader_transport.transact(1, verifyCreateFoo2)
