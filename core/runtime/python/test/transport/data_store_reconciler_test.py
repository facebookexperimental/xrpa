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


from typing import Callable, Tuple, Union

from xrpa_runtime.reconciler.collection_change_types import (
    CollectionChangeEventAccessor,
    CollectionChangeType,
    CollectionUpdateChangeEventAccessor,
)
from xrpa_runtime.reconciler.data_store_interfaces import (
    DataStoreObject,
    IDataStoreObjectAccessor,
    IObjectCollection,
)
from xrpa_runtime.reconciler.data_store_reconciler import DataStoreReconciler
from xrpa_runtime.reconciler.object_collection import ObjectCollection
from xrpa_runtime.reconciler.object_collection_index import ObjectCollectionIndex
from xrpa_runtime.reconciler.object_collection_indexed_binding import (
    ObjectCollectionIndexedBinding,
)
from xrpa_runtime.signals.inbound_signal_data import (
    InboundSignalData,
    InboundSignalDataInterface,
)
from xrpa_runtime.signals.outbound_signal_data import (
    OutboundSignalData,
    SignalProducerCallback,
)
from xrpa_runtime.signals.signal_ring_buffer import SignalRingBuffer
from xrpa_runtime.transport.transport_stream import TransportStream
from xrpa_runtime.transport.transport_stream_accessor import TransportStreamAccessor
from xrpa_runtime.utils.memory_accessor import MemoryAccessor, MemoryOffset
from xrpa_runtime.utils.time_utils import TimeUtils
from xrpa_runtime.utils.xrpa_types import ObjectAccessorInterface, ObjectUuid


class TestConstants:
    NUM_CHANNELS = 2
    SAMPLE_RATE = 48000
    SAMPLES_PER_CALLBACK = 256


class DSFooType_NumericMessage(ObjectAccessorInterface):
    def __init__(self, mem_accessor: MemoryAccessor):
        ObjectAccessorInterface.__init__(self, mem_accessor)
        self._read_offset = MemoryOffset()
        self._write_offset = MemoryOffset()

    def get_number(self) -> int:
        return self._mem_accessor.read_int(self._read_offset)

    def set_number(self, value: int):
        self._mem_accessor.write_int(value, self._write_offset)


class DSFooType_ResetMessage(ObjectAccessorInterface):
    def __init__(self, mem_accessor: MemoryAccessor):
        ObjectAccessorInterface.__init__(self, mem_accessor)


class FooTypeReader(ObjectAccessorInterface):
    aChangedBit = 1
    bChangedBit = 2
    revAChangedBit = 4
    revBChangedBit = 8

    AddMessage = 0
    ResetMessage = 1
    BounceMessage = 2
    SignalMessage = 3

    aByteCount = 4
    bByteCount = 4
    revAByteCount = 4
    revBByteCount = 4

    def __init__(self, mem_accessor: MemoryAccessor):
        ObjectAccessorInterface.__init__(self, mem_accessor)
        self._read_offset = MemoryOffset()

    def get_a(self) -> int:
        return self._mem_accessor.read_int(self._read_offset)

    def get_b(self) -> float:
        return self._mem_accessor.read_float(self._read_offset)

    def get_rev_a(self) -> int:
        return self._mem_accessor.read_int(self._read_offset)

    def get_rev_b(self) -> int:
        return self._mem_accessor.read_int(self._read_offset)


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

    def set_rev_a(self, value: int):
        self._mem_accessor.write_int(value, self._write_offset)

    def set_rev_b(self, value: int):
        self._mem_accessor.write_int(value, self._write_offset)


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


class FooTypeLocal(DataStoreObject, IDataStoreObjectAccessor[FooTypeReader]):
    INBOUND_FIELDS = FooTypeReader.aChangedBit | FooTypeReader.bChangedBit

    def __init__(
        self, id: ObjectUuid, collection: IObjectCollection, value: FooTypeReader
    ):
        DataStoreObject.__init__(self, id, collection)
        self._a = 0
        self._b = 0.0
        self._my_val = 0
        self._reset_count = 0
        self._tick_count = 0
        self._local_rev_a = 0
        self._local_rev_b = 0.0
        self._change_bits = 0
        self._change_byte_count = 0

        self._signal_data = InboundSignalData(
            TestConstants.NUM_CHANNELS, TestConstants.SAMPLE_RATE, "uint"
        )
        self._signal_signal_handler = None
        self.on_signal(self._signal_data)

    def process_ds_update(self, value: FooTypeReader, fields_changed: int):
        if (fields_changed & FooTypeReader.aChangedBit) != 0:
            self._a = value.get_a()
        if (fields_changed & FooTypeReader.bChangedBit) != 0:
            self._b = value.get_b()

    def handle_xrpa_delete(self):
        pass

    def set_rev_a(self, value: int):
        self._local_rev_a = value
        if (self._change_bits & FooTypeReader.revAChangedBit) == 0:
            self._change_bits |= FooTypeReader.revAChangedBit
            self._change_byte_count += FooTypeWriter.revAByteCount
        if not self._has_notified_needs_write:
            self._collection.notify_object_needs_write(self.get_xrpa_id())
            self._has_notified_needs_write = True
        self._collection.set_dirty(self.get_xrpa_id(), FooTypeReader.revAChangedBit)

    def set_rev_b(self, value: float):
        self._local_rev_b = value
        if (self._change_bits & FooTypeReader.revBChangedBit) == 0:
            self._change_bits |= FooTypeReader.revBChangedBit
            self._change_byte_count += FooTypeWriter.revBByteCount
        if not self._has_notified_needs_write:
            self._collection.notify_object_needs_write(self.get_xrpa_id())
            self._has_notified_needs_write = True
        self._collection.set_dirty(self.get_xrpa_id(), FooTypeReader.revBChangedBit)

    def get_a(self) -> int:
        return self._a

    def get_b(self) -> float:
        return self._b

    def get_rev_a(self) -> int:
        return self._local_rev_a

    def get_rev_b(self) -> float:
        return self._local_rev_b

    def send_add_message(self, number: int):
        msg = DSFooType_NumericMessage(
            self._collection.send_message(
                self.get_xrpa_id(),
                FooTypeReader.AddMessage,
                4,
            )
        )
        msg.set_number(number)

    def send_reset_message(self):
        self._collection.send_message(
            self.get_xrpa_id(),
            FooTypeReader.ResetMessage,
            0,
        )

    def write_ds_changes(self, accessor: TransportStreamAccessor):
        obj_accessor = FooTypeWriter.update(
            accessor,
            self.get_collection_id(),
            self.get_xrpa_id(),
            self._change_bits,
            self._change_byte_count,
        )
        if obj_accessor.is_null():
            return
        if (self._change_bits & FooTypeReader.revAChangedBit) != 0:
            obj_accessor.set_rev_a(self._local_rev_a)
        if (self._change_bits & FooTypeReader.revBChangedBit) != 0:
            obj_accessor.set_rev_b(self._local_rev_b)
        self._change_bits = 0
        self._change_byte_count = 0
        self._has_notified_needs_write = False

    def prep_ds_full_update(self) -> int:
        self._change_bits = FooTypeReader.revAChangedBit | FooTypeReader.revBChangedBit
        self._change_byte_count = (
            FooTypeWriter.revAByteCount + FooTypeWriter.revBByteCount
        )
        return 1

    def on_signal(self, signal_data: InboundSignalDataInterface):
        self._signal_signal_handler = signal_data

    def process_ds_message(
        self, message_type: int, timestamp: int, message_data: MemoryAccessor
    ):
        if message_type == FooTypeReader.AddMessage:
            msg = DSFooType_NumericMessage(message_data)
            self._my_val += msg.get_number()
        if message_type == FooTypeReader.ResetMessage:
            self._my_val = 0
        if message_type == FooTypeReader.BounceMessage:
            bounce_message = DSFooType_NumericMessage(
                self._collection.send_message(
                    self.get_xrpa_id(),
                    FooTypeReader.BounceMessage,
                    4,
                )
            )
            bounce_message.set_number(-1)
        if (
            message_type == FooTypeReader.SignalMessage
            and self._signal_signal_handler is not None
        ):
            self._signal_signal_handler.on_signal_data(timestamp, message_data)

    def tick_xrpa(self):
        self._tick_count += 1


class BarTypeLocal(DataStoreObject, IDataStoreObjectAccessor[BarTypeReader]):
    INBOUND_FIELDS = BarTypeReader.cChangedBit | BarTypeReader.strChangedBit

    def __init__(
        self, id: ObjectUuid, collection: IObjectCollection, value: BarTypeReader
    ):
        DataStoreObject.__init__(self, id, collection)
        self._c = 0
        self._str = ""

    def process_ds_update(self, value: BarTypeReader, fields_changed: int):
        if (fields_changed & BarTypeReader.cChangedBit) != 0:
            self._c = value.get_c()
        if (fields_changed & BarTypeReader.strChangedBit) != 0:
            self._str = value.get_str()

    def handle_xrpa_delete(self):
        pass

    def write_ds_changes(self, accessor: TransportStreamAccessor):
        pass

    def prep_ds_full_update(self) -> int:
        return 0

    def process_ds_message(
        self, message_type: int, timestamp: int, message_data: MemoryAccessor
    ):
        pass

    def tick_xrpa(self):
        pass


class FooTypeLocalBinding:
    def __init__(self):
        self._reconciled_obj = None

    def add_xrpa_binding(self, reconciled_obj: FooTypeLocal) -> bool:
        if self._reconciled_obj is None:
            self._reconciled_obj = reconciled_obj
            return True
        return False

    def remove_xrpa_binding(self, reconciled_obj: FooTypeLocal):
        if self._reconciled_obj == reconciled_obj:
            self._reconciled_obj = None


class FooInboundCollection(ObjectCollection[FooTypeReader, FooTypeLocal]):
    def __init__(self, reconciler: DataStoreReconciler):
        ObjectCollection.__init__(
            self, FooTypeReader, reconciler, 0, FooTypeLocal.INBOUND_FIELDS, ~0, False
        )
        self._index_binding = ObjectCollectionIndexedBinding[
            FooTypeReader, FooTypeLocal, int, FooTypeLocalBinding
        ]()

        self.foo_indexed_by_a = ObjectCollectionIndex[
            FooTypeReader, FooTypeLocal, int
        ]()

    def set_create_delegate(
        self,
        delegate: Callable[
            [ObjectUuid, FooTypeReader, IObjectCollection], FooTypeLocal
        ],
    ):
        self._set_create_delegate_internal(delegate)

    def add_indexed_binding(self, index_value: int, local_obj: FooTypeLocalBinding):
        self._index_binding.add_local_object(index_value, local_obj)

    def remove_indexed_binding(self, index_value: int, local_obj: FooTypeLocalBinding):
        self._index_binding.remove_local_object(index_value, local_obj)

    def _index_notify_create(self, obj: FooTypeLocal) -> None:
        self.foo_indexed_by_a.on_create(obj, obj._a)
        self._index_binding.on_create(obj, obj._a)

    def _index_notify_update(self, obj: FooTypeLocal, fields_changed: int) -> None:
        if (fields_changed & FooTypeReader.aChangedBit) != 0:
            self.foo_indexed_by_a.on_update(obj, obj._a)
            self._index_binding.on_update(obj, obj._a)

    def _index_notify_delete(self, obj: FooTypeLocal) -> None:
        self.foo_indexed_by_a.on_delete(obj, obj._a)
        self._index_binding.on_delete(obj, obj._a)


class BarInboundCollection(ObjectCollection[BarTypeReader, BarTypeLocal]):
    def __init__(self, reconciler: DataStoreReconciler):
        ObjectCollection.__init__(
            self, BarTypeReader, reconciler, 1, BarTypeLocal.INBOUND_FIELDS, 0, False
        )

    def set_create_delegate(
        self,
        delegate: Callable[
            [ObjectUuid, BarTypeReader, IObjectCollection], BarTypeLocal
        ],
    ):
        self._set_create_delegate_internal(delegate)


class ReadTestDataStore(DataStoreReconciler):
    def __init__(
        self, inbound_transport: TransportStream, outbound_transport: TransportStream
    ):
        DataStoreReconciler.__init__(self, inbound_transport, outbound_transport, 4096)
        self.foo_type = FooInboundCollection(self)
        self._register_collection(self.foo_type)

        self.bar_type = BarInboundCollection(self)
        self._register_collection(self.bar_type)

        self.foo_type.set_create_delegate(
            lambda id, source, collection: FooTypeLocal(id, collection, source)
        )
        self.bar_type.set_create_delegate(
            lambda id, source, collection: (
                BarTypeLocal(id, collection, source)
                if id == DataStoreReconcilerTest.theBarID
                else None
            )
        )


class OutboundFooType(DataStoreObject, IDataStoreObjectAccessor[FooTypeReader]):
    INBOUND_FIELDS = FooTypeReader.revAChangedBit | FooTypeReader.revBChangedBit

    def __init__(self, id: ObjectUuid):
        DataStoreObject.__init__(self, id, None)
        self.rev_a = 0
        self.rev_b = 0.0
        self._tick_count = 0
        self._local_signal = OutboundSignalData()

        self._local_a = 0
        self._local_b = 0.0
        self._create_timestamp = TimeUtils.get_current_clock_time_microseconds()
        self._change_bits = FooTypeReader.aChangedBit | FooTypeReader.bChangedBit
        self._change_byte_count = FooTypeWriter.aByteCount + FooTypeWriter.bByteCount
        self._create_written = False

    def set_a(self, value: int):
        self._local_a = value
        if (self._change_bits & FooTypeReader.aChangedBit) == 0:
            self._change_bits |= FooTypeReader.aChangedBit
            self._change_byte_count += FooTypeWriter.aByteCount
        if not self._has_notified_needs_write:
            self._collection.notify_object_needs_write(self.get_xrpa_id())
            self._has_notified_needs_write = True
        self._collection.set_dirty(self.get_xrpa_id(), FooTypeReader.aChangedBit)

    def set_b(self, value: float):
        self._local_b = value
        if (self._change_bits & FooTypeReader.bChangedBit) == 0:
            self._change_bits |= FooTypeReader.bChangedBit
            self._change_byte_count += FooTypeWriter.bByteCount
        if not self._has_notified_needs_write:
            self._collection.notify_object_needs_write(self.get_xrpa_id())
            self._has_notified_needs_write = True
        self._collection.set_dirty(self.get_xrpa_id(), FooTypeReader.bChangedBit)

    def get_a(self) -> int:
        return self._local_a

    def get_b(self) -> float:
        return self._local_b

    def send_add_message(self, number: int):
        msg = DSFooType_NumericMessage(
            self._collection.send_message(
                self.get_xrpa_id(),
                FooTypeReader.AddMessage,
                4,
            )
        )
        msg.set_number(number)

    def send_reset_message(self):
        self._collection.send_message(
            self.get_xrpa_id(),
            FooTypeReader.ResetMessage,
            0,
        )

    def set_signal(
        self,
        signal_data: Union[SignalProducerCallback, SignalRingBuffer],
        num_channels: int,
        frames_per_second: int,
        frames_per_packet: int,
        sample_type: str,
    ):
        self._local_signal.set_signal_source(
            signal_data, num_channels, frames_per_second, frames_per_packet, sample_type
        )

    def tick_xrpa(self):
        self._tick_count += 1
        id = self.get_xrpa_id()
        self._local_signal.set_recipient(
            id, self._collection, FooTypeReader.SignalMessage
        )
        self._local_signal.tick()

    def write_ds_changes(self, accessor: TransportStreamAccessor):
        obj_accessor = None
        if not self._create_written:
            obj_accessor = FooTypeWriter.create(
                accessor,
                self.get_collection_id(),
                self.get_xrpa_id(),
                self._change_byte_count,
                self._create_timestamp,
            )
            self._create_written = True
        if obj_accessor is None or obj_accessor.is_null():
            obj_accessor = FooTypeWriter.update(
                accessor,
                self.get_collection_id(),
                self.get_xrpa_id(),
                self._change_bits,
                self._change_byte_count,
            )
        if (self._change_bits & FooTypeReader.aChangedBit) != 0:
            obj_accessor.set_a(self._local_a)
        if (self._change_bits & FooTypeReader.bChangedBit) != 0:
            obj_accessor.set_b(self._local_b)
        self._change_bits = 0
        self._change_byte_count = 0
        self._has_notified_needs_write = False

    def prep_ds_full_update(self) -> int:
        self._create_written = False
        self._change_bits = FooTypeReader.aChangedBit | FooTypeReader.bChangedBit
        self._change_byte_count = FooTypeWriter.aByteCount + FooTypeWriter.bByteCount
        return self._create_timestamp

    def process_ds_update(self, value: FooTypeReader, fields_changed: int):
        if (fields_changed & FooTypeReader.revAChangedBit) != 0:
            self.rev_a = value.get_rev_a()
        if (fields_changed & FooTypeReader.revBChangedBit) != 0:
            self.rev_b = value.get_rev_b()

    def process_ds_message(
        self, message_type: int, timestamp: int, message_data: MemoryAccessor
    ):
        if message_type == FooTypeReader.AddMessage:
            msg = DSFooType_NumericMessage(message_data)
            self.set_a(self._local_a + msg.get_number())
        if message_type == FooTypeReader.ResetMessage:
            self.set_a(0)

    def handle_xrpa_delete(self):
        pass


class FooOutboundCollection(ObjectCollection[FooTypeReader, OutboundFooType]):
    def __init__(self, reconciler: DataStoreReconciler):
        ObjectCollection.__init__(
            self,
            FooTypeReader,
            reconciler,
            0,
            OutboundFooType.INBOUND_FIELDS,
            FooTypeReader.aChangedBit,
            True,
        )
        self.foo_indexed_by_a = ObjectCollectionIndex[
            FooTypeReader, OutboundFooType, int
        ]()

    def add_object(self, obj: OutboundFooType):
        self._add_object_internal(obj)

    def remove_object(self, id: ObjectUuid):
        self._remove_object_internal(id)

    def _index_notify_create(self, obj: OutboundFooType) -> None:
        self.foo_indexed_by_a.on_create(obj, obj.get_a())

    def _index_notify_update(self, obj: OutboundFooType, fields_changed: int) -> None:
        if (fields_changed & FooTypeReader.aChangedBit) != 0:
            self.foo_indexed_by_a.on_update(obj, obj.get_a())

    def _index_notify_delete(self, obj: OutboundFooType) -> None:
        self.foo_indexed_by_a.on_delete(obj, obj.get_a())


class OutboundBarType(DataStoreObject, IDataStoreObjectAccessor[BarTypeReader]):
    INBOUND_FIELDS = 0

    def __init__(self, id: ObjectUuid):
        DataStoreObject.__init__(self, id, None)

        self._local_c = 0
        self._local_str = ""
        self._create_timestamp = TimeUtils.get_current_clock_time_microseconds()
        self._change_bits = BarTypeReader.cChangedBit | BarTypeReader.strChangedBit
        self._change_byte_count = BarTypeReader.cByteCount + 4
        self._create_written = False

    def set_c(self, value: int):
        self._local_c = value
        if (self._change_bits & BarTypeReader.cChangedBit) == 0:
            self._change_bits |= BarTypeReader.cChangedBit
            self._change_byte_count += BarTypeWriter.cByteCount
        if not self._has_notified_needs_write:
            self._collection.notify_object_needs_write(self.get_xrpa_id())
            self._has_notified_needs_write = True
        self._collection.set_dirty(self.get_xrpa_id(), BarTypeReader.cChangedBit)

    def set_str(self, value: str):
        self._local_str = value
        if (self._change_bits & BarTypeReader.strChangedBit) == 0:
            self._change_bits |= BarTypeReader.strChangedBit
            self._change_byte_count += 4
        self._change_byte_count += MemoryAccessor.dyn_size_of_str(self._local_str)
        if not self._has_notified_needs_write:
            self._collection.notify_object_needs_write(self.get_xrpa_id())
            self._has_notified_needs_write = True
        self._collection.set_dirty(self.get_xrpa_id(), BarTypeReader.strChangedBit)

    def get_c(self) -> int:
        return self._local_c

    def get_str(self) -> str:
        return self._local_str

    def write_ds_changes(self, accessor: TransportStreamAccessor):
        obj_accessor = None
        if not self._create_written:
            obj_accessor = BarTypeWriter.create(
                accessor,
                self.get_collection_id(),
                self.get_xrpa_id(),
                self._change_byte_count,
                self._create_timestamp,
            )
            self._create_written = True
        if obj_accessor is None or obj_accessor.is_null():
            obj_accessor = BarTypeWriter.update(
                accessor,
                self.get_collection_id(),
                self.get_xrpa_id(),
                self._change_bits,
                self._change_byte_count,
            )
        if (self._change_bits & BarTypeReader.cChangedBit) != 0:
            obj_accessor.set_c(self._local_c)
        if (self._change_bits & BarTypeReader.strChangedBit) != 0:
            obj_accessor.set_str(self._local_str)
        self._change_bits = 0
        self._change_byte_count = 0
        self._has_notified_needs_write = False

    def prep_ds_full_update(self) -> int:
        self._create_written = False
        self._change_bits = BarTypeReader.cChangedBit | BarTypeReader.strChangedBit
        self._change_byte_count = (
            BarTypeWriter.cByteCount
            + 4
            + MemoryAccessor.dyn_size_of_str(self._local_str)
        )
        return self._create_timestamp

    def process_ds_update(self, value: BarTypeReader, fields_changed: int):
        pass

    def process_ds_message(
        self, message_type: int, timestamp: int, message_data: MemoryAccessor
    ):
        pass

    def handle_xrpa_delete(self):
        pass

    def tick_xrpa(self):
        pass


class BarOutboundCollection(ObjectCollection[BarTypeReader, OutboundBarType]):
    def __init__(self, reconciler: DataStoreReconciler):
        ObjectCollection.__init__(
            self,
            BarTypeReader,
            reconciler,
            1,
            OutboundBarType.INBOUND_FIELDS,
            0,
            True,
        )

    def add_object(self, obj: OutboundBarType):
        self._add_object_internal(obj)

    def remove_object(self, id: ObjectUuid):
        self._remove_object_internal(id)


class WriteTestDataStore(DataStoreReconciler):
    def __init__(
        self, inbound_transport: TransportStream, outbound_transport: TransportStream
    ):
        DataStoreReconciler.__init__(self, inbound_transport, outbound_transport, 4096)
        self.foo_type = FooOutboundCollection(self)
        self._register_collection(self.foo_type)

        self.bar_type = BarOutboundCollection(self)
        self._register_collection(self.bar_type)


class DataStoreReconcilerTest:
    foo1ID = ObjectUuid(0, 100)
    foo2ID = ObjectUuid(0, 200)
    foo3ID = ObjectUuid(0, 300)
    myFooID = ObjectUuid(0, 5000)

    bar1ID = ObjectUuid(1, 100)
    theBarID = ObjectUuid(1, 200)

    @staticmethod
    def signal_gen(data_out, _sample_rate, start_sample_pos):
        frame_count = data_out.get_frame_count()
        for i in range(data_out.get_num_channels()):
            channel_data = data_out.access_channel_buffer(i)
            for j in range(frame_count):
                channel_data[j] = start_sample_pos + j

    @staticmethod
    def signal_gen_ring_buffer(ring_buffer: SignalRingBuffer, frame_count):
        interleaved_samples = [0] * (frame_count * TestConstants.NUM_CHANNELS)
        out_idx = 0
        for frame_idx in range(frame_count):
            for _ in range(TestConstants.NUM_CHANNELS):
                interleaved_samples[out_idx] = frame_idx
                out_idx += 1

        ring_buffer.initialize(
            TestConstants.SAMPLE_RATE, 0, TestConstants.NUM_CHANNELS, "uint"
        )
        ring_buffer.write_interleaved_data(interleaved_samples, frame_count)

    @staticmethod
    def run_signal_transport_tests(
        reader_inbound_transport: TransportStream,
        reader_outbound_transport: TransportStream,
        writer_inbound_transport: TransportStream,
        writer_outbound_transport: TransportStream,
        from_ring_buffer: bool,
    ):
        reader = ReadTestDataStore(reader_inbound_transport, reader_outbound_transport)
        writer = WriteTestDataStore(writer_inbound_transport, writer_outbound_transport)

        foo1 = OutboundFooType(DataStoreReconcilerTest.foo1ID)
        writer.foo_type.add_object(foo1)

        ring_buffer = SignalRingBuffer()
        if from_ring_buffer:
            DataStoreReconcilerTest.signal_gen_ring_buffer(
                ring_buffer, TestConstants.SAMPLES_PER_CALLBACK * 2
            )
            foo1.set_signal(
                ring_buffer,
                TestConstants.NUM_CHANNELS,
                TestConstants.SAMPLE_RATE,
                TestConstants.SAMPLES_PER_CALLBACK,
                "uint",
            )
        else:
            foo1.set_signal(
                DataStoreReconcilerTest.signal_gen,
                TestConstants.NUM_CHANNELS,
                TestConstants.SAMPLE_RATE,
                TestConstants.SAMPLES_PER_CALLBACK,
                "uint",
            )

        # Advance the time to make sure the signal data is sent
        TimeUtils.time_offset_ns = 1000

        # Tick the writer to send the signal data
        assert foo1._tick_count == 0
        writer.tick_inbound()
        writer.tick_outbound()
        assert foo1._tick_count == 1

        # Tick the reader to receive the signal data
        reader.tick_inbound()
        reader.tick_outbound()
        assert len(reader.foo_type) == 1

        signal_data = reader.foo_type.get_object(
            DataStoreReconcilerTest.foo1ID
        )._signal_data
        frame_count = signal_data.get_read_frames_available()
        data = [0] * (frame_count * TestConstants.NUM_CHANNELS)
        signal_data.read_interleaved_data(data, frame_count)

        # Verify the signal data
        assert frame_count >= TestConstants.SAMPLES_PER_CALLBACK
        for i in range(len(data)):
            assert data[i] == i // TestConstants.NUM_CHANNELS

    @staticmethod
    def run_read_reconciler_tests(
        reader_inbound_transport: TransportStream,
        reader_outbound_transport: TransportStream,
        writer_inbound_transport: TransportStream,
        writer_outbound_transport: TransportStream,
    ):
        reader = ReadTestDataStore(reader_inbound_transport, reader_outbound_transport)
        writer = WriteTestDataStore(writer_inbound_transport, writer_outbound_transport)

        # create objects
        writer.tick_inbound()

        foo1 = OutboundFooType(DataStoreReconcilerTest.foo1ID)
        writer.foo_type.add_object(foo1)
        foo1.set_a(10)
        foo1.set_b(45.5)

        bar1 = OutboundBarType(DataStoreReconcilerTest.bar1ID)
        writer.bar_type.add_object(bar1)
        bar1.set_c(15)
        bar1.set_str("Hello World!")
        assert bar1.get_str() == "Hello World!"

        writer.tick_outbound()

        # tick reader, verify InboundFooCollection received only the foo1 create
        reader.tick_inbound()
        assert len(reader.foo_type) == 1
        foo1Obj = reader.foo_type.get_object(DataStoreReconcilerTest.foo1ID)
        assert foo1Obj is not None
        assert foo1Obj.get_a() == 10
        assert foo1Obj.get_b() == 45.5
        assert len(reader.bar_type) == 0
        reader.tick_outbound()

        # update objects
        writer.tick_inbound()

        foo1 = writer.foo_type.get_object(DataStoreReconcilerTest.foo1ID)
        foo1.set_b(75)

        writer.bar_type.get_object(DataStoreReconcilerTest.bar1ID)
        bar1.set_c(32)

        writer.tick_outbound()

        # tick reader, verify InboundFooCollection received the foo1 update
        reader.tick_inbound()

        assert len(reader.foo_type) == 1
        foo1Obj = reader.foo_type.get_object(DataStoreReconcilerTest.foo1ID)
        assert foo1Obj._a == 10
        assert foo1Obj._b == 75
        assert len(reader.bar_type) == 0

        reader.tick_outbound()

        # create TheBar
        writer.tick_inbound()

        TheBar = OutboundBarType(DataStoreReconcilerTest.theBarID)
        writer.bar_type.add_object(TheBar)
        TheBar.set_c(32)
        TheBar.set_str("Hello World!")

        writer.tick_outbound()

        # tick reader, verify TheBarReconciler got the update
        reader.tick_inbound()

        assert len(reader.foo_type) == 1
        foo1Obj = reader.foo_type.get_object(DataStoreReconcilerTest.foo1ID)
        assert foo1Obj._a == 10
        assert foo1Obj._b == 75
        assert len(reader.bar_type) == 1
        theBarObj = reader.bar_type.get_object(DataStoreReconcilerTest.theBarID)
        assert theBarObj._c == 32
        assert theBarObj._str == "Hello World!"

        reader.tick_outbound()

        # update TheBar
        writer.tick_inbound()

        TheBar = writer.bar_type.get_object(DataStoreReconcilerTest.theBarID)
        TheBar.set_c(92)

        # try a long string
        TheBar.set_str(
            "1234567890123456789012345678901234567890123456789012345678901234567890"
        )

        writer.tick_outbound()

        # tick reader, verify TheBarReconciler got the update
        reader.tick_inbound()

        assert len(reader.foo_type) == 1
        foo1Obj = reader.foo_type.get_object(DataStoreReconcilerTest.foo1ID)
        assert foo1Obj._a == 10
        assert foo1Obj._b == 75
        assert len(reader.bar_type) == 1
        theBarObj = reader.bar_type.get_object(DataStoreReconcilerTest.theBarID)
        assert theBarObj._c == 92
        assert (
            theBarObj._str
            == "1234567890123456789012345678901234567890123456789012345678901234567890"
        )

        reader.tick_outbound()

        # delete objects
        writer.tick_inbound()

        writer.foo_type.remove_object(DataStoreReconcilerTest.foo1ID)
        writer.bar_type.remove_object(DataStoreReconcilerTest.bar1ID)
        writer.bar_type.remove_object(DataStoreReconcilerTest.theBarID)

        writer.tick_outbound()

        # tick reader, verify collections saw the deletes properly
        reader.tick_inbound()

        assert len(reader.foo_type) == 0
        assert len(reader.bar_type) == 0

        reader.tick_outbound()

        # put some objects back in, for testing index-reconciliation mark/sweep
        writer.tick_inbound()

        foo1 = OutboundFooType(DataStoreReconcilerTest.foo1ID)
        writer.foo_type.add_object(foo1)

        foo2 = OutboundFooType(DataStoreReconcilerTest.foo2ID)
        writer.foo_type.add_object(foo2)

        foo3 = OutboundFooType(DataStoreReconcilerTest.foo3ID)
        writer.foo_type.add_object(foo3)
        foo3.set_a(15)

        TheBar = OutboundBarType(DataStoreReconcilerTest.theBarID)
        writer.bar_type.add_object(TheBar)
        TheBar.set_c(17)

        writer.tick_outbound()

        reader.tick_inbound()

        assert len(reader.foo_type) == 3
        assert len(reader.bar_type) == 1
        theBarObj = reader.bar_type.get_object(DataStoreReconcilerTest.theBarID)
        assert theBarObj._c == 17

        reader.tick_outbound()

        # write some changes but don't consume them from the reader yet
        writer.tick_inbound()

        assert len(writer.foo_type) == 3

        writer.foo_type.remove_object(DataStoreReconcilerTest.foo1ID)
        writer.foo_type.remove_object(DataStoreReconcilerTest.foo2ID)

        TheBar = writer.bar_type.get_object(DataStoreReconcilerTest.theBarID)
        TheBar.set_c(25)

        writer.tick_outbound()

        # write lots of stuff, overflowing the changelog ring buffer
        def overflow_ring_buffer(writer: TransportStreamAccessor):
            writerIter = writer_outbound_transport.create_iterator()
            assert writerIter.has_missed_entries(writer) is True

            # make sure the writes above this get pushed out of the ring buffer, so that they are forced to
            # be reconciled through a FullUpdate
            i = 0
            while not writerIter.has_missed_entries(writer):
                obj = FooTypeWriter.create(writer, 0, ObjectUuid(3, i))
                assert obj.is_null() is False
                i += 1

            foo3 = FooTypeWriter.update(
                writer,
                0,
                DataStoreReconcilerTest.foo3ID,
                FooTypeReader.bChangedBit,
                FooTypeReader.bByteCount,
            )
            assert foo3.is_null() is False
            foo3.set_b(20)

        writer_outbound_transport.transact(1, overflow_ring_buffer)
        writer.foo_type.get_object(DataStoreReconcilerTest.foo3ID)
        foo3.set_b(20)
        writer.tick_outbound()

        # tick reader to trigger RequestFullUpdate, then tick writer to send the full update
        reader.tick_inbound()
        reader.tick_outbound()
        writer.tick_inbound()
        writer.tick_outbound()

        # verify the reader applies the full update (including the changes that were written but
        # overflowed out of the changelog)
        reader.tick_inbound()

        assert len(reader.foo_type) == 1
        foo3Obj = reader.foo_type.get_object(DataStoreReconcilerTest.foo3ID)
        assert foo3Obj._a == 15
        assert foo3Obj._b == 20
        assert len(reader.bar_type) == 1
        theBarObj = reader.bar_type.get_object(DataStoreReconcilerTest.theBarID)
        assert theBarObj._c == 25

        reader.tick_outbound()

        # write a create, update, and delete to the same object
        writer.tick_inbound()

        myFoo = OutboundFooType(DataStoreReconcilerTest.myFooID)
        writer.foo_type.add_object(myFoo)
        myFoo.set_b(75)
        writer.foo_type.remove_object(DataStoreReconcilerTest.myFooID)

        writer.tick_outbound()

        # tick reader, verify it handled the deleted object properly during the create/update
        # reconciliation
        reader.tick_inbound()

        assert len(reader.foo_type) == 1
        foo3Obj = reader.foo_type.get_object(DataStoreReconcilerTest.foo3ID)
        assert foo3Obj._a == 15
        assert foo3Obj._b == 20
        assert len(reader.bar_type) == 1
        reader.bar_type.get_object(DataStoreReconcilerTest.theBarID)
        assert theBarObj._c == 25

        reader.tick_outbound()

        # send some messages
        writer.tick_inbound()

        foo1 = OutboundFooType(DataStoreReconcilerTest.foo1ID)
        writer.foo_type.add_object(foo1)

        foo2 = OutboundFooType(DataStoreReconcilerTest.foo2ID)
        writer.foo_type.add_object(foo2)

        foo3 = writer.foo_type.get_object(DataStoreReconcilerTest.foo3ID)

        foo1.send_add_message(1)
        foo2.send_add_message(2)
        foo3.send_add_message(3)
        foo3.send_reset_message()

        writer.tick_outbound()

        # tick reader, verify messages were handled
        reader.tick_inbound()

        foo1Obj = reader.foo_type.get_object(DataStoreReconcilerTest.foo1ID)
        assert foo1Obj._my_val == 1
        foo2Obj = reader.foo_type.get_object(DataStoreReconcilerTest.foo2ID)
        assert foo2Obj._my_val == 2
        foo3Obj = reader.foo_type.get_object(DataStoreReconcilerTest.foo3ID)
        assert foo3Obj._my_val == 0

        reader.tick_outbound()

    @staticmethod
    def run_read_reconciler_interrupt_tests(
        reader_inbound_transport: TransportStream,
        reader_outbound_transport: TransportStream,
        make_writer_transport: Callable[[], Tuple[TransportStream, TransportStream]],
    ):
        writer_transports = make_writer_transport()
        writer = WriteTestDataStore(writer_transports[0], writer_transports[1])
        writer.tick_inbound()
        writer.tick_outbound()

        reader = ReadTestDataStore(reader_inbound_transport, reader_outbound_transport)

        # create objects
        writer.tick_inbound()

        foo1 = OutboundFooType(DataStoreReconcilerTest.foo1ID)
        writer.foo_type.add_object(foo1)
        foo1.set_a(10)
        foo1.set_b(45.5)

        writer.tick_outbound()

        # tick reader, verify fooReconciler received the foo1 create
        reader.tick_inbound()

        assert len(reader.foo_type) == 1
        foo1Obj = reader.foo_type.get_object(DataStoreReconcilerTest.foo1ID)
        assert foo1Obj._a == 10
        assert foo1Obj._b == 45.5

        reader.tick_outbound()

        # shutdown writer
        del writer
        del writer_transports

        # create new writer
        writer_transports = make_writer_transport()
        writer = WriteTestDataStore(writer_transports[0], writer_transports[1])
        writer.tick_inbound()
        writer.tick_outbound()

        # tick reader, verify the writer cleared all Foo objects out
        reader.tick_inbound()
        assert len(reader.foo_type) == 0

        # shutdown writer
        del writer
        del writer_transports

    @staticmethod
    def run_write_reconciler_tests(
        reader_inbound_transport: TransportStream,
        reader_outbound_transport: TransportStream,
        writer_inbound_transport: TransportStream,
        writer_outbound_transport: TransportStream,
    ):
        reader = ReadTestDataStore(reader_inbound_transport, reader_outbound_transport)
        writer = WriteTestDataStore(writer_inbound_transport, writer_outbound_transport)

        writer.tick_inbound()

        foo1 = OutboundFooType(DataStoreReconcilerTest.foo1ID)
        writer.foo_type.add_object(foo1)
        foo1.set_a(10)
        foo1.set_b(15.0)

        foo2 = OutboundFooType(DataStoreReconcilerTest.foo2ID)
        writer.foo_type.add_object(foo2)
        foo2.set_a(5)
        foo2.set_b(37.0)

        writer.tick_outbound()

        reader.tick_inbound()

        assert len(reader.foo_type) == 2
        foo1Obj = reader.foo_type.get_object(DataStoreReconcilerTest.foo1ID)
        assert foo1Obj._a == 10
        assert foo1Obj._b == 15
        foo2Obj = reader.foo_type.get_object(DataStoreReconcilerTest.foo2ID)
        assert foo2Obj._a == 5
        assert foo2Obj._b == 37

        foo1Obj.send_add_message(10)

        reader.tick_outbound()

        writer.tick_inbound()
        writer.foo_type.remove_object(DataStoreReconcilerTest.foo2ID)
        writer.tick_outbound()

    @staticmethod
    def run_reverse_reconciled_fields_tests(
        reader_inbound_transport: TransportStream,
        reader_outbound_transport: TransportStream,
        writer_inbound_transport: TransportStream,
        writer_outbound_transport: TransportStream,
    ):
        reader = ReadTestDataStore(reader_inbound_transport, reader_outbound_transport)
        writer = WriteTestDataStore(writer_inbound_transport, writer_outbound_transport)

        writer.tick_inbound()

        foo1 = OutboundFooType(DataStoreReconcilerTest.foo1ID)
        writer.foo_type.add_object(foo1)
        foo1.set_a(10)
        foo1.set_b(15)

        writer.tick_outbound()

        reader.tick_inbound()

        assert len(reader.foo_type) == 1
        foo1Obj = reader.foo_type.get_object(DataStoreReconcilerTest.foo1ID)
        assert foo1Obj._a == 10
        assert foo1Obj._b == 15
        foo1Obj.set_rev_a(-4)
        foo1Obj.set_rev_b(-25)

        reader.tick_outbound()

        writer.tick_inbound()

        foo1 = writer.foo_type.get_object(DataStoreReconcilerTest.foo1ID)
        assert foo1.rev_a == -4
        assert foo1.rev_b == -25

        writer.tick_outbound()

        reader.tick_inbound()

        foo1Obj = reader.foo_type.get_object(DataStoreReconcilerTest.foo1ID)
        foo1Obj.set_rev_a(72)
        foo1Obj.set_rev_b(-15)

        reader.tick_outbound()

        writer.tick_inbound()

        foo1 = writer.foo_type.get_object(DataStoreReconcilerTest.foo1ID)
        assert foo1.rev_a == 72
        assert foo1.rev_b == -15

        writer.tick_outbound()

    @staticmethod
    def run_indexing_tests(
        reader_inbound_transport: TransportStream,
        reader_outbound_transport: TransportStream,
        writer_inbound_transport: TransportStream,
        writer_outbound_transport: TransportStream,
    ):
        reader = ReadTestDataStore(reader_inbound_transport, reader_outbound_transport)
        writer = WriteTestDataStore(writer_inbound_transport, writer_outbound_transport)

        # add a binding before the target exists
        fooBind1 = FooTypeLocalBinding()
        reader.foo_type.add_indexed_binding(4, fooBind1)
        assert fooBind1._reconciled_obj is None

        # add objects
        foo1 = OutboundFooType(DataStoreReconcilerTest.foo1ID)
        writer.foo_type.add_object(foo1)
        foo1.set_a(4)
        foo2 = OutboundFooType(DataStoreReconcilerTest.foo2ID)
        writer.foo_type.add_object(foo2)
        foo2.set_a(4)
        foo3 = OutboundFooType(DataStoreReconcilerTest.foo3ID)
        writer.foo_type.add_object(foo3)
        foo3.set_a(2)

        # verify they indexed correctly
        print(
            f"indexed_objects(4) = {writer.foo_type.foo_indexed_by_a.get_indexed_objects(4)}"
        )
        assert len(writer.foo_type.foo_indexed_by_a.get_indexed_objects(4)) == 2
        assert len(writer.foo_type.foo_indexed_by_a.get_indexed_objects(2)) == 1
        assert len(writer.foo_type.foo_indexed_by_a.get_indexed_objects(1)) == 0
        writer.tick_inbound()
        writer.tick_outbound()
        reader.tick_inbound()
        reader.tick_outbound()
        assert len(reader.foo_type) == 3
        assert len(reader.foo_type.foo_indexed_by_a.get_indexed_objects(4)) == 2
        assert len(reader.foo_type.foo_indexed_by_a.get_indexed_objects(2)) == 1
        assert len(reader.foo_type.foo_indexed_by_a.get_indexed_objects(1)) == 0
        assert fooBind1._reconciled_obj != foo1
        assert fooBind1._reconciled_obj.get_xrpa_id() == DataStoreReconcilerTest.foo1ID

        # add a new binding after the target exists
        fooBind2 = FooTypeLocalBinding()
        reader.foo_type.add_indexed_binding(4, fooBind2)
        assert fooBind2._reconciled_obj is not None
        assert fooBind2._reconciled_obj.get_xrpa_id() == DataStoreReconcilerTest.foo1ID

        # change an indexed value
        foo1.set_a(2)

        # verify the object reindexed
        assert len(writer.foo_type.foo_indexed_by_a.get_indexed_objects(4)) == 1
        assert len(writer.foo_type.foo_indexed_by_a.get_indexed_objects(2)) == 2
        assert (
            writer.foo_type.foo_indexed_by_a.get_indexed_objects(2)[1].get_xrpa_id()
            == DataStoreReconcilerTest.foo1ID
        )
        writer.tick_inbound()
        writer.tick_outbound()
        reader.tick_inbound()
        reader.tick_outbound()
        assert len(reader.foo_type) == 3
        assert len(reader.foo_type.foo_indexed_by_a.get_indexed_objects(4)) == 1
        assert len(reader.foo_type.foo_indexed_by_a.get_indexed_objects(2)) == 2
        assert (
            reader.foo_type.foo_indexed_by_a.get_indexed_objects(2)[1].get_xrpa_id()
            == DataStoreReconcilerTest.foo1ID
        )
        assert fooBind1._reconciled_obj is None
        assert fooBind2._reconciled_obj is None

        # delete an indexed object
        writer.foo_type.remove_object(DataStoreReconcilerTest.foo2ID)

        # verify the object reindexed
        assert len(writer.foo_type.foo_indexed_by_a.get_indexed_objects(4)) == 0
        assert len(writer.foo_type.foo_indexed_by_a.get_indexed_objects(2)) == 2
        writer.tick_inbound()
        writer.tick_outbound()
        reader.tick_inbound()
        reader.tick_outbound()
        assert len(reader.foo_type) == 2
        assert len(reader.foo_type.foo_indexed_by_a.get_indexed_objects(4)) == 0
        assert len(reader.foo_type.foo_indexed_by_a.get_indexed_objects(2)) == 2
