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
import xrpa.optical_character_recognition_types
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

  def get_image(self) -> xrpa.optical_character_recognition_types.OcrImage:
    return xrpa.optical_character_recognition_types.DSOcrImage.read_value(self._mem_accessor, self._read_offset)

class ImageInputWriter(ImageInputReader):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._write_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  def set_image(self, value: xrpa.optical_character_recognition_types.OcrImage) -> None:
    xrpa.optical_character_recognition_types.DSOcrImage.write_value(value, self._mem_accessor, self._write_offset)

class OcrResultReader(xrpa_runtime.utils.xrpa_types.ObjectAccessorInterface):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._read_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  # Transcribed text from the image
  def get_text(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  # Timestamp of when input image was captured
  def get_timestamp(self) -> int:
    return self._mem_accessor.read_ulong(self._read_offset)

  # Whether OCR processing completed successfully
  def get_success(self) -> bool:
    return (self._mem_accessor.read_int(self._read_offset) == 1)

  # Error message if OCR processing failed
  def get_error_message(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

class OcrResultWriter(OcrResultReader):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._write_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  def set_text(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

  def set_timestamp(self, value: int) -> None:
    self._mem_accessor.write_ulong(value, self._write_offset)

  def set_success(self, value: bool) -> None:
    self._mem_accessor.write_int((1 if value is True else 0), self._write_offset)

  def set_error_message(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

class OpticalCharacterRecognitionReader(xrpa_runtime.utils.xrpa_types.ObjectAccessorInterface):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._read_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  # Increment this value to trigger OCR processing
  def get_trigger_id(self) -> int:
    return self._mem_accessor.read_int(self._read_offset)

  # Whether to use immediate mode (true) or triggered mode (false)
  def get_immediate_mode(self) -> bool:
    return (self._mem_accessor.read_int(self._read_offset) == 1)

  def check_trigger_id_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1) != 0

  def check_immediate_mode_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2) != 0

class OpticalCharacterRecognitionWriter(OpticalCharacterRecognitionReader):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._write_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  @staticmethod
  def create(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, change_byte_count: int, timestamp: int) -> "OpticalCharacterRecognitionWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.CreateObject.value, change_byte_count, timestamp)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    return OpticalCharacterRecognitionWriter(change_event.access_change_data())

  @staticmethod
  def update(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, fields_changed: int, change_byte_count: int) -> "OpticalCharacterRecognitionWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionUpdateChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.UpdateObject.value, change_byte_count)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    change_event.set_fields_changed(fields_changed)
    return OpticalCharacterRecognitionWriter(change_event.access_change_data())

  def set_trigger_id(self, value: int) -> None:
    self._mem_accessor.write_int(value, self._write_offset)

  def set_immediate_mode(self, value: bool) -> None:
    self._mem_accessor.write_int((1 if value is True else 0), self._write_offset)

# Reconciled Types
class ReconciledOpticalCharacterRecognition(xrpa_runtime.reconciler.data_store_interfaces.DataStoreObject, xrpa_runtime.reconciler.data_store_interfaces.IDataStoreObjectAccessor[OpticalCharacterRecognitionReader]):
  def __init__(self, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, collection: xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection):
    super().__init__(id, collection)
    self._xrpa_fields_changed_handler = None
    self._xrpa_delete_handler = None
    self._local_trigger_id = 0
    self._local_immediate_mode = False
    self._image_input_message_handler = None

  def _handle_xrpa_fields_changed(self, fields_changed: int) -> None:
    if self._xrpa_fields_changed_handler is not None: self._xrpa_fields_changed_handler(fields_changed)

  def on_xrpa_fields_changed(self, handler: typing.Callable[[int], None]) -> None:
    self._xrpa_fields_changed_handler = handler

  def handle_xrpa_delete(self) -> None:
    if self._xrpa_delete_handler is not None: self._xrpa_delete_handler()

  def on_xrpa_delete(self, handler: typing.Callable[[], None]) -> None:
    self._xrpa_delete_handler = handler

  def process_ds_update(self, value: OpticalCharacterRecognitionReader, fields_changed: int) -> None:
    if value.check_trigger_id_changed(fields_changed):
      self._local_trigger_id = value.get_trigger_id()
    if value.check_immediate_mode_changed(fields_changed):
      self._local_immediate_mode = value.get_immediate_mode()
    self._handle_xrpa_fields_changed(fields_changed)

  @staticmethod
  def create(id: xrpa_runtime.utils.xrpa_types.ObjectUuid, obj: OpticalCharacterRecognitionReader, collection: xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection) -> "ReconciledOpticalCharacterRecognition":
    return ReconciledOpticalCharacterRecognition(id, collection)

  def get_trigger_id(self) -> int:
    return self._local_trigger_id

  def get_immediate_mode(self) -> bool:
    return self._local_immediate_mode

  def check_trigger_id_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1) != 0

  def check_immediate_mode_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2) != 0

  def on_image_input(self, handler: typing.Callable[[int, ImageInputReader], None]) -> None:
    self._image_input_message_handler = handler

  def send_ocr_result(self, text: str, timestamp: int, success: bool, error_message: str) -> None:
    message = OcrResultWriter(self._collection.send_message(
        self.get_xrpa_id(),
        3,
        xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(text) + xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(error_message) + 20))
    message.set_text(text)
    message.set_timestamp(timestamp)
    message.set_success(success)
    message.set_error_message(error_message)

  def process_ds_message(self, message_type: int, timestamp: int, message_data: xrpa_runtime.utils.memory_accessor.MemoryAccessor) -> None:
    if message_type == 0:
      if self._image_input_message_handler is not None:
        message = ImageInputReader(message_data)
        self._image_input_message_handler(timestamp, message)

  def write_ds_changes(self, accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor) -> None:
    pass

  def prep_ds_full_update(self) -> int:
    return 0

# Object Collections
class InboundOpticalCharacterRecognitionReaderCollection(xrpa_runtime.reconciler.object_collection.ObjectCollection[OpticalCharacterRecognitionReader, ReconciledOpticalCharacterRecognition]):
  def __init__(self, reconciler: xrpa_runtime.reconciler.data_store_reconciler.DataStoreReconciler):
    super().__init__(OpticalCharacterRecognitionReader, reconciler, 0, 3, 0, False)
    self._set_create_delegate_internal(ReconciledOpticalCharacterRecognition.create)

  def set_create_delegate(self, create_delegate: typing.Callable[[xrpa_runtime.utils.xrpa_types.ObjectUuid, OpticalCharacterRecognitionReader, xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection], ReconciledOpticalCharacterRecognition]) -> None:
    self._set_create_delegate_internal(create_delegate)

# Data Store Implementation
class OpticalCharacterRecognitionDataStore(xrpa_runtime.reconciler.data_store_reconciler.DataStoreReconciler):
  def __init__(self, inbound_transport: xrpa_runtime.transport.transport_stream.TransportStream, outbound_transport: xrpa_runtime.transport.transport_stream.TransportStream):
    super().__init__(inbound_transport, outbound_transport, 5316148)
    self.OpticalCharacterRecognition = InboundOpticalCharacterRecognitionReaderCollection(self)
    self._register_collection(self.OpticalCharacterRecognition)
