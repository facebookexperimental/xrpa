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

# @generated

import typing
import uuid
import xrpa.signal_output_types
import xrpa_runtime.reconciler.collection_change_types
import xrpa_runtime.reconciler.data_store_interfaces
import xrpa_runtime.reconciler.data_store_reconciler
import xrpa_runtime.reconciler.object_collection
import xrpa_runtime.signals.inbound_signal_forwarder
import xrpa_runtime.signals.outbound_signal_data
import xrpa_runtime.signals.signal_ring_buffer
import xrpa_runtime.signals.signal_shared
import xrpa_runtime.transport.transport_stream
import xrpa_runtime.transport.transport_stream_accessor
import xrpa_runtime.utils.memory_accessor
import xrpa_runtime.utils.time_utils
import xrpa_runtime.utils.xrpa_types

class InputEventReader(xrpa_runtime.utils.xrpa_types.ObjectAccessorInterface):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._read_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  def get_type(self) -> xrpa.signal_output_types.InputEventType:
    return xrpa.signal_output_types.InputEventType(self._mem_accessor.read_int(self._read_offset))

  def get_source(self) -> int:
    return self._mem_accessor.read_int(self._read_offset)

class InputEventWriter(InputEventReader):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._write_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  def set_type(self, value: xrpa.signal_output_types.InputEventType) -> None:
    self._mem_accessor.write_int(value.value, self._write_offset)

  def set_source(self, value: int) -> None:
    self._mem_accessor.write_int(value, self._write_offset)

class SignalOutputDeviceReader(xrpa_runtime.utils.xrpa_types.ObjectAccessorInterface):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._read_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  def get_name(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  def get_device_type(self) -> xrpa.signal_output_types.SignalOutputDeviceType:
    return xrpa.signal_output_types.SignalOutputDeviceType(self._mem_accessor.read_int(self._read_offset))

  def get_num_channels(self) -> int:
    return self._mem_accessor.read_int(self._read_offset)

  def get_frame_rate(self) -> int:
    return self._mem_accessor.read_int(self._read_offset)

  def get_is_system_audio_output(self) -> bool:
    return (self._mem_accessor.read_int(self._read_offset) == 1)

  def check_name_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1) != 0

  def check_device_type_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2) != 0

  def check_num_channels_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 4) != 0

  def check_frame_rate_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 8) != 0

  def check_is_system_audio_output_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 16) != 0

class SignalOutputDeviceWriter(SignalOutputDeviceReader):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._write_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  @staticmethod
  def create(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, change_byte_count: int, timestamp: int) -> "SignalOutputDeviceWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.CreateObject.value, change_byte_count, timestamp)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    return SignalOutputDeviceWriter(change_event.access_change_data())

  @staticmethod
  def update(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, fields_changed: int, change_byte_count: int) -> "SignalOutputDeviceWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionUpdateChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.UpdateObject.value, change_byte_count)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    change_event.set_fields_changed(fields_changed)
    return SignalOutputDeviceWriter(change_event.access_change_data())

  def set_name(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

  def set_device_type(self, value: xrpa.signal_output_types.SignalOutputDeviceType) -> None:
    self._mem_accessor.write_int(value.value, self._write_offset)

  def set_num_channels(self, value: int) -> None:
    self._mem_accessor.write_int(value, self._write_offset)

  def set_frame_rate(self, value: int) -> None:
    self._mem_accessor.write_int(value, self._write_offset)

  def set_is_system_audio_output(self, value: bool) -> None:
    self._mem_accessor.write_int((1 if value is True else 0), self._write_offset)

class SignalOutputSourceReader(xrpa_runtime.utils.xrpa_types.ObjectAccessorInterface):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._read_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  def get_bind_to(self) -> xrpa.signal_output_types.DeviceBindingType:
    return xrpa.signal_output_types.DeviceBindingType(self._mem_accessor.read_int(self._read_offset))

  def get_device(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return xrpa_runtime.utils.xrpa_types.ObjectUuid.read_value(self._mem_accessor, self._read_offset)

  def get_device_name(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  def get_hostname(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  def get_port(self) -> int:
    return self._mem_accessor.read_int(self._read_offset)

  def get_is_connected(self) -> bool:
    return (self._mem_accessor.read_int(self._read_offset) == 1)

  def check_bind_to_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1) != 0

  def check_device_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2) != 0

  def check_device_name_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 4) != 0

  def check_hostname_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 8) != 0

  def check_port_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 16) != 0

  def check_is_connected_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 32) != 0

class SignalOutputSourceWriter(SignalOutputSourceReader):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._write_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  @staticmethod
  def create(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, change_byte_count: int, timestamp: int) -> "SignalOutputSourceWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.CreateObject.value, change_byte_count, timestamp)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    return SignalOutputSourceWriter(change_event.access_change_data())

  @staticmethod
  def update(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, fields_changed: int, change_byte_count: int) -> "SignalOutputSourceWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionUpdateChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.UpdateObject.value, change_byte_count)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    change_event.set_fields_changed(fields_changed)
    return SignalOutputSourceWriter(change_event.access_change_data())

  def set_bind_to(self, value: xrpa.signal_output_types.DeviceBindingType) -> None:
    self._mem_accessor.write_int(value.value, self._write_offset)

  def set_device(self, value: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    xrpa_runtime.utils.xrpa_types.ObjectUuid.write_value(value, self._mem_accessor, self._write_offset)

  def set_device_name(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

  def set_hostname(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

  def set_port(self, value: int) -> None:
    self._mem_accessor.write_int(value, self._write_offset)

  def set_is_connected(self, value: bool) -> None:
    self._mem_accessor.write_int((1 if value is True else 0), self._write_offset)

# Reconciled Types
class OutboundSignalOutputSource(xrpa_runtime.reconciler.data_store_interfaces.DataStoreObject, xrpa_runtime.reconciler.data_store_interfaces.IDataStoreObjectAccessor[SignalOutputSourceReader]):
  def __init__(self, id: xrpa_runtime.utils.xrpa_types.ObjectUuid):
    super().__init__(id, None)
    self._create_timestamp = xrpa_runtime.utils.time_utils.TimeUtils.get_current_clock_time_microseconds()
    self._xrpa_fields_changed_handler = None
    self._local_is_connected = False
    self._local_signal = xrpa_runtime.signals.outbound_signal_data.OutboundSignalData()
    self._local_bind_to = xrpa.signal_output_types.DeviceBindingType.Device
    self._local_device = xrpa_runtime.utils.xrpa_types.ObjectUuid(0, 0)
    self._local_device_name = ""
    self._local_hostname = ""
    self._local_port = 0
    self._change_bits = 0
    self._change_byte_count = 0
    self._create_written = False

  def _handle_xrpa_fields_changed(self, fields_changed: int) -> None:
    if self._xrpa_fields_changed_handler is not None: self._xrpa_fields_changed_handler(fields_changed)

  def on_xrpa_fields_changed(self, handler: typing.Callable[[int], None]) -> None:
    self._xrpa_fields_changed_handler = handler

  def get_bind_to(self) -> xrpa.signal_output_types.DeviceBindingType:
    return self._local_bind_to

  def set_bind_to(self, bind_to: xrpa.signal_output_types.DeviceBindingType) -> None:
    self._local_bind_to = bind_to
    if (self._change_bits & 1) == 0:
      self._change_bits |= 1
      self._change_byte_count += 4
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 1)

  def get_device(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return self._local_device

  def set_device(self, device: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    self._local_device = device
    if (self._change_bits & 2) == 0:
      self._change_bits |= 2
      self._change_byte_count += 16
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 2)

  def get_device_name(self) -> str:
    return self._local_device_name

  def set_device_name(self, device_name: str) -> None:
    self._local_device_name = device_name
    if (self._change_bits & 4) == 0:
      self._change_bits |= 4
      self._change_byte_count += 4
    self._change_byte_count += xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_device_name)
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 4)

  def get_hostname(self) -> str:
    return self._local_hostname

  def set_hostname(self, hostname: str) -> None:
    self._local_hostname = hostname
    if (self._change_bits & 8) == 0:
      self._change_bits |= 8
      self._change_byte_count += 4
    self._change_byte_count += xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_hostname)
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 8)

  def get_port(self) -> int:
    return self._local_port

  def set_port(self, port: int) -> None:
    self._local_port = port
    if (self._change_bits & 16) == 0:
      self._change_bits |= 16
      self._change_byte_count += 4
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 16)

  def write_ds_changes(self, accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor) -> None:
    obj_accessor = None
    if not self._create_written:
      self._change_bits = 31
      self._change_byte_count = xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_device_name) + xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_hostname) + 32
      obj_accessor = SignalOutputSourceWriter.create(accessor, self.get_collection_id(), self.get_xrpa_id(), self._change_byte_count, self._create_timestamp)
      self._create_written = True
    elif self._change_bits != 0:
      obj_accessor = SignalOutputSourceWriter.update(accessor, self.get_collection_id(), self.get_xrpa_id(), self._change_bits, self._change_byte_count)
    if obj_accessor is None or obj_accessor.is_null():
      return
    if (self._change_bits & 1) != 0:
      obj_accessor.set_bind_to(self._local_bind_to)
    if (self._change_bits & 2) != 0:
      obj_accessor.set_device(self._local_device)
    if (self._change_bits & 4) != 0:
      obj_accessor.set_device_name(self._local_device_name)
    if (self._change_bits & 8) != 0:
      obj_accessor.set_hostname(self._local_hostname)
    if (self._change_bits & 16) != 0:
      obj_accessor.set_port(self._local_port)
    self._change_bits = 0
    self._change_byte_count = 0
    self._has_notified_needs_write = False

  def prep_ds_full_update(self) -> int:
    self._create_written = False
    self._change_bits = 31
    self._change_byte_count = xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_device_name) + xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_hostname) + 32
    return self._create_timestamp

  def process_ds_update(self, value: SignalOutputSourceReader, fields_changed: int) -> None:
    if value.check_is_connected_changed(fields_changed):
      self._local_is_connected = value.get_is_connected()
    self._handle_xrpa_fields_changed(fields_changed)

  def get_is_connected(self) -> bool:
    return self._local_is_connected

  def check_bind_to_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1) != 0

  def check_device_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2) != 0

  def check_device_name_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 4) != 0

  def check_hostname_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 8) != 0

  def check_port_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 16) != 0

  def check_is_connected_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 32) != 0

  def set_signal_callback(self, signal_callback: xrpa_runtime.signals.outbound_signal_data.SignalProducerCallback, sample_type_name: str, num_channels: int, frames_per_second: int, frames_per_packet: int) -> None:
    self._local_signal.set_signal_source(signal_callback, num_channels, frames_per_second, frames_per_packet, sample_type_name)

  def set_signal_ring_buffer(self, signal_ring_buffer: xrpa_runtime.signals.signal_ring_buffer.SignalRingBuffer, sample_type_name: str, num_channels: int, frames_per_second: int, frames_per_packet: int) -> None:
    self._local_signal.set_signal_source(signal_ring_buffer, num_channels, frames_per_second, frames_per_packet, sample_type_name)

  def set_signal_forwarder(self, signal_forwarder: xrpa_runtime.signals.inbound_signal_forwarder.InboundSignalForwarder) -> None:
    self._local_signal.set_recipient(self.get_xrpa_id(), self._collection, 5)
    signal_forwarder.add_recipient(self._local_signal)

  def send_signal(self, frame_count: int, sample_type_name: str, num_channels: int, frames_per_second: int) -> xrpa_runtime.signals.signal_shared.SignalPacket:
    sample_type: int = xrpa_runtime.signals.signal_shared.SignalTypeInference.infer_sample_type(sample_type_name)
    self._local_signal.set_recipient(self.get_xrpa_id(), self._collection, 5)
    return self._local_signal.send_signal_packet(xrpa_runtime.utils.memory_accessor.MemoryUtils.get_type_size(sample_type_name), frame_count, sample_type, num_channels, frames_per_second)

  def tick_xrpa(self) -> None:
    id = self.get_xrpa_id()
    self._local_signal.set_recipient(id, self._collection, 5)
    self._local_signal.tick()

  def process_ds_message(self, message_type: int, msg_timestamp: int, message_data: xrpa_runtime.utils.memory_accessor.MemoryAccessor) -> None:
    pass

class ReconciledSignalOutputDevice(xrpa_runtime.reconciler.data_store_interfaces.DataStoreObject, xrpa_runtime.reconciler.data_store_interfaces.IDataStoreObjectAccessor[SignalOutputDeviceReader]):
  def __init__(self, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, collection: xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection):
    super().__init__(id, collection)
    self._xrpa_fields_changed_handler = None
    self._xrpa_delete_handler = None
    self._local_name = ""
    self._local_device_type = xrpa.signal_output_types.SignalOutputDeviceType.Audio
    self._local_num_channels = 0
    self._local_frame_rate = 0
    self._local_is_system_audio_output = False
    self._input_event_message_handler = None

  def _handle_xrpa_fields_changed(self, fields_changed: int) -> None:
    if self._xrpa_fields_changed_handler is not None: self._xrpa_fields_changed_handler(fields_changed)

  def on_xrpa_fields_changed(self, handler: typing.Callable[[int], None]) -> None:
    self._xrpa_fields_changed_handler = handler

  def handle_xrpa_delete(self) -> None:
    if self._xrpa_delete_handler is not None: self._xrpa_delete_handler()

  def on_xrpa_delete(self, handler: typing.Callable[[], None]) -> None:
    self._xrpa_delete_handler = handler

  def process_ds_update(self, value: SignalOutputDeviceReader, fields_changed: int) -> None:
    if value.check_name_changed(fields_changed):
      self._local_name = value.get_name()
    if value.check_device_type_changed(fields_changed):
      self._local_device_type = value.get_device_type()
    if value.check_num_channels_changed(fields_changed):
      self._local_num_channels = value.get_num_channels()
    if value.check_frame_rate_changed(fields_changed):
      self._local_frame_rate = value.get_frame_rate()
    if value.check_is_system_audio_output_changed(fields_changed):
      self._local_is_system_audio_output = value.get_is_system_audio_output()
    self._handle_xrpa_fields_changed(fields_changed)

  @staticmethod
  def create(id: xrpa_runtime.utils.xrpa_types.ObjectUuid, obj: SignalOutputDeviceReader, collection: xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection) -> "ReconciledSignalOutputDevice":
    return ReconciledSignalOutputDevice(id, collection)

  def get_name(self) -> str:
    return self._local_name

  def get_device_type(self) -> xrpa.signal_output_types.SignalOutputDeviceType:
    return self._local_device_type

  def get_num_channels(self) -> int:
    return self._local_num_channels

  def get_frame_rate(self) -> int:
    return self._local_frame_rate

  def get_is_system_audio_output(self) -> bool:
    return self._local_is_system_audio_output

  def check_name_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1) != 0

  def check_device_type_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2) != 0

  def check_num_channels_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 4) != 0

  def check_frame_rate_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 8) != 0

  def check_is_system_audio_output_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 16) != 0

  def on_input_event(self, handler: typing.Callable[[int, InputEventReader], None]) -> None:
    self._input_event_message_handler = handler

  def process_ds_message(self, message_type: int, msg_timestamp: int, message_data: xrpa_runtime.utils.memory_accessor.MemoryAccessor) -> None:
    if message_type == 5:
      if self._input_event_message_handler is not None:
        message = InputEventReader(message_data)
        self._input_event_message_handler(msg_timestamp, message)

  def write_ds_changes(self, accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor) -> None:
    pass

  def prep_ds_full_update(self) -> int:
    return 0

# Object Collections
class InboundSignalOutputDeviceReaderCollection(xrpa_runtime.reconciler.object_collection.ObjectCollection[SignalOutputDeviceReader, ReconciledSignalOutputDevice]):
  def __init__(self, reconciler: xrpa_runtime.reconciler.data_store_reconciler.DataStoreReconciler):
    super().__init__(SignalOutputDeviceReader, reconciler, 0, 31, 0, False)
    self._set_create_delegate_internal(ReconciledSignalOutputDevice.create)

  def set_create_delegate(self, create_delegate: typing.Callable[[xrpa_runtime.utils.xrpa_types.ObjectUuid, SignalOutputDeviceReader, xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection], ReconciledSignalOutputDevice]) -> None:
    self._set_create_delegate_internal(create_delegate)

class OutboundSignalOutputSourceReaderCollection(xrpa_runtime.reconciler.object_collection.ObjectCollection[SignalOutputSourceReader, OutboundSignalOutputSource]):
  def __init__(self, reconciler: xrpa_runtime.reconciler.data_store_reconciler.DataStoreReconciler):
    super().__init__(SignalOutputSourceReader, reconciler, 1, 32, 0, True)

  def add_object(self, obj: OutboundSignalOutputSource) -> None:
    self._add_object_internal(obj)

  def create_object(self) -> OutboundSignalOutputSource:
    obj = OutboundSignalOutputSource(xrpa_runtime.utils.xrpa_types.ObjectUuid.from_uuid(uuid.uuid4()))
    self._add_object_internal(obj)
    return obj

  def remove_object(self, id: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    self._remove_object_internal(id)

# Data Store Implementation
class SignalOutputDataStore(xrpa_runtime.reconciler.data_store_reconciler.DataStoreReconciler):
  def __init__(self, inbound_transport: xrpa_runtime.transport.transport_stream.TransportStream, outbound_transport: xrpa_runtime.transport.transport_stream.TransportStream):
    super().__init__(inbound_transport, outbound_transport, 9905408)
    self.SignalOutputDevice = InboundSignalOutputDeviceReaderCollection(self)
    self._register_collection(self.SignalOutputDevice)
    self.SignalOutputSource = OutboundSignalOutputSourceReaderCollection(self)
    self._register_collection(self.SignalOutputSource)
