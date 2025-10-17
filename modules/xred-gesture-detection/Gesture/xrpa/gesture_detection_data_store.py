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
import xrpa.gesture_detection_types
import xrpa_runtime.reconciler.collection_change_types
import xrpa_runtime.reconciler.data_store_interfaces
import xrpa_runtime.reconciler.data_store_reconciler
import xrpa_runtime.reconciler.object_collection
import xrpa_runtime.transport.transport_stream
import xrpa_runtime.transport.transport_stream_accessor
import xrpa_runtime.utils.memory_accessor
import xrpa_runtime.utils.xrpa_types

class ImageInputReader(xrpa_runtime.utils.xrpa_types.ObjectAccessorInterface):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._read_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  def get_image(self) -> xrpa.gesture_detection_types.GestureImage:
    return xrpa.gesture_detection_types.DSGestureImage.read_value(self._mem_accessor, self._read_offset)

class ImageInputWriter(ImageInputReader):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._write_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  def set_image(self, value: xrpa.gesture_detection_types.GestureImage) -> None:
    xrpa.gesture_detection_types.DSGestureImage.write_value(value, self._mem_accessor, self._write_offset)

class GestureResultReader(xrpa_runtime.utils.xrpa_types.ObjectAccessorInterface):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._read_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  # Timestamp of when input image was captured
  def get_timestamp(self) -> int:
    return self._mem_accessor.read_ulong(self._read_offset)

  def get_gesture_type(self) -> xrpa.gesture_detection_types.GestureType:
    return xrpa.gesture_detection_types.GestureType(self._mem_accessor.read_int(self._read_offset))

  # Confidence score for the detected gesture (0.0 - 1.0)
  def get_confidence(self) -> float:
    return xrpa.gesture_detection_types.DSScalar.read_value(self._mem_accessor, self._read_offset)

  # Whether a hand was detected in the frame
  def get_hand_detected(self) -> bool:
    return (self._mem_accessor.read_int(self._read_offset) == 1)

  # Error message if gesture processing failed
  def get_error_message(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

class GestureResultWriter(GestureResultReader):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._write_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  def set_timestamp(self, value: int) -> None:
    self._mem_accessor.write_ulong(value, self._write_offset)

  def set_gesture_type(self, value: xrpa.gesture_detection_types.GestureType) -> None:
    self._mem_accessor.write_int(value.value, self._write_offset)

  def set_confidence(self, value: float) -> None:
    xrpa.gesture_detection_types.DSScalar.write_value(value, self._mem_accessor, self._write_offset)

  def set_hand_detected(self, value: bool) -> None:
    self._mem_accessor.write_int((1 if value is True else 0), self._write_offset)

  def set_error_message(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

class GestureDetectionReader(xrpa_runtime.utils.xrpa_types.ObjectAccessorInterface):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._read_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

class GestureDetectionWriter(GestureDetectionReader):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._write_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  @staticmethod
  def create(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, change_byte_count: int, timestamp: int) -> "GestureDetectionWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.CreateObject.value, change_byte_count, timestamp)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    return GestureDetectionWriter(change_event.access_change_data())

  @staticmethod
  def update(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, fields_changed: int, change_byte_count: int) -> "GestureDetectionWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionUpdateChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.UpdateObject.value, change_byte_count)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    change_event.set_fields_changed(fields_changed)
    return GestureDetectionWriter(change_event.access_change_data())

# Reconciled Types
class ReconciledGestureDetection(xrpa_runtime.reconciler.data_store_interfaces.DataStoreObject, xrpa_runtime.reconciler.data_store_interfaces.IDataStoreObjectAccessor[GestureDetectionReader]):
  def __init__(self, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, collection: xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection):
    super().__init__(id, collection)
    self._xrpa_fields_changed_handler = None
    self._xrpa_delete_handler = None
    self._image_input_message_handler = None

  def _handle_xrpa_fields_changed(self, fields_changed: int) -> None:
    if self._xrpa_fields_changed_handler is not None: self._xrpa_fields_changed_handler(fields_changed)

  def on_xrpa_fields_changed(self, handler: typing.Callable[[int], None]) -> None:
    self._xrpa_fields_changed_handler = handler

  def handle_xrpa_delete(self) -> None:
    if self._xrpa_delete_handler is not None: self._xrpa_delete_handler()

  def on_xrpa_delete(self, handler: typing.Callable[[], None]) -> None:
    self._xrpa_delete_handler = handler

  def process_ds_update(self, value: GestureDetectionReader, fields_changed: int) -> None:
    self._handle_xrpa_fields_changed(fields_changed)

  @staticmethod
  def create(id: xrpa_runtime.utils.xrpa_types.ObjectUuid, obj: GestureDetectionReader, collection: xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection) -> "ReconciledGestureDetection":
    return ReconciledGestureDetection(id, collection)

  def on_image_input(self, handler: typing.Callable[[int, ImageInputReader], None]) -> None:
    self._image_input_message_handler = handler

  def send_gesture_result(self, timestamp: int, gesture_type: xrpa.gesture_detection_types.GestureType, confidence: float, hand_detected: bool, error_message: str) -> None:
    message = GestureResultWriter(self._collection.send_message(
        self.get_xrpa_id(),
        1,
        xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(error_message) + 24))
    message.set_timestamp(timestamp)
    message.set_gesture_type(gesture_type)
    message.set_confidence(confidence)
    message.set_hand_detected(hand_detected)
    message.set_error_message(error_message)

  def process_ds_message(self, message_type: int, msg_timestamp: int, message_data: xrpa_runtime.utils.memory_accessor.MemoryAccessor) -> None:
    if message_type == 0:
      if self._image_input_message_handler is not None:
        message = ImageInputReader(message_data)
        self._image_input_message_handler(msg_timestamp, message)

  def write_ds_changes(self, accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor) -> None:
    pass

  def prep_ds_full_update(self) -> int:
    return 0

# Object Collections
class InboundGestureDetectionReaderCollection(xrpa_runtime.reconciler.object_collection.ObjectCollection[GestureDetectionReader, ReconciledGestureDetection]):
  def __init__(self, reconciler: xrpa_runtime.reconciler.data_store_reconciler.DataStoreReconciler):
    super().__init__(GestureDetectionReader, reconciler, 0, 0, 0, False)
    self._set_create_delegate_internal(ReconciledGestureDetection.create)

  def set_create_delegate(self, create_delegate: typing.Callable[[xrpa_runtime.utils.xrpa_types.ObjectUuid, GestureDetectionReader, xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection], ReconciledGestureDetection]) -> None:
    self._set_create_delegate_internal(create_delegate)

# Data Store Implementation
class GestureDetectionDataStore(xrpa_runtime.reconciler.data_store_reconciler.DataStoreReconciler):
  def __init__(self, inbound_transport: xrpa_runtime.transport.transport_stream.TransportStream, outbound_transport: xrpa_runtime.transport.transport_stream.TransportStream):
    super().__init__(inbound_transport, outbound_transport, 37327176)
    self.GestureDetection = InboundGestureDetectionReaderCollection(self)
    self._register_collection(self.GestureDetection)
