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
import xrpa.audio_transcription_types
import xrpa_runtime.reconciler.collection_change_types
import xrpa_runtime.reconciler.data_store_interfaces
import xrpa_runtime.reconciler.data_store_reconciler
import xrpa_runtime.reconciler.object_collection
import xrpa_runtime.signals.inbound_signal_data
import xrpa_runtime.transport.transport_stream
import xrpa_runtime.transport.transport_stream_accessor
import xrpa_runtime.utils.memory_accessor
import xrpa_runtime.utils.xrpa_types

class TranscriptionResultReader(xrpa_runtime.utils.xrpa_types.ObjectAccessorInterface):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._read_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  # Transcribed text from audio
  def get_text(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  # Timestamp of the start of the audio segment from which the transcription is generated
  def get_timestamp(self) -> int:
    return self._mem_accessor.read_ulong(self._read_offset)

  # Whether transcription completed successfully
  def get_success(self) -> bool:
    return (self._mem_accessor.read_int(self._read_offset) == 1)

  # Error message if transcription failed
  def get_error_message(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

class TranscriptionResultWriter(TranscriptionResultReader):
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

class AudioTranscriptionReader(xrpa_runtime.utils.xrpa_types.ObjectAccessorInterface):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._read_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

class AudioTranscriptionWriter(AudioTranscriptionReader):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._write_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  @staticmethod
  def create(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, change_byte_count: int, timestamp: int) -> "AudioTranscriptionWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.CreateObject.value, change_byte_count, timestamp)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    return AudioTranscriptionWriter(change_event.access_change_data())

  @staticmethod
  def update(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, fields_changed: int, change_byte_count: int) -> "AudioTranscriptionWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionUpdateChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.UpdateObject.value, change_byte_count)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    change_event.set_fields_changed(fields_changed)
    return AudioTranscriptionWriter(change_event.access_change_data())

# Reconciled Types
class ReconciledAudioTranscription(xrpa_runtime.reconciler.data_store_interfaces.DataStoreObject, xrpa_runtime.reconciler.data_store_interfaces.IDataStoreObjectAccessor[AudioTranscriptionReader]):
  def __init__(self, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, collection: xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection):
    super().__init__(id, collection)
    self._xrpa_fields_changed_handler = None
    self._xrpa_delete_handler = None
    self._audio_signal_signal_handler = None

  def _handle_xrpa_fields_changed(self, fields_changed: int) -> None:
    if self._xrpa_fields_changed_handler is not None: self._xrpa_fields_changed_handler(fields_changed)

  def on_xrpa_fields_changed(self, handler: typing.Callable[[int], None]) -> None:
    self._xrpa_fields_changed_handler = handler

  def handle_xrpa_delete(self) -> None:
    if self._xrpa_delete_handler is not None: self._xrpa_delete_handler()

  def on_xrpa_delete(self, handler: typing.Callable[[], None]) -> None:
    self._xrpa_delete_handler = handler

  def process_ds_update(self, value: AudioTranscriptionReader, fields_changed: int) -> None:
    self._handle_xrpa_fields_changed(fields_changed)

  @staticmethod
  def create(id: xrpa_runtime.utils.xrpa_types.ObjectUuid, obj: AudioTranscriptionReader, collection: xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection) -> "ReconciledAudioTranscription":
    return ReconciledAudioTranscription(id, collection)

  def send_transcription_result(self, text: str, timestamp: int, success: bool, error_message: str) -> None:
    message = TranscriptionResultWriter(self._collection.send_message(
        self.get_xrpa_id(),
        1,
        xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(text) + xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(error_message) + 20))
    message.set_text(text)
    message.set_timestamp(timestamp)
    message.set_success(success)
    message.set_error_message(error_message)

  def on_audio_signal(self, handler: xrpa_runtime.signals.inbound_signal_data.InboundSignalDataInterface) -> None:
    self._audio_signal_signal_handler = handler

  def process_ds_message(self, message_type: int, msg_timestamp: int, message_data: xrpa_runtime.utils.memory_accessor.MemoryAccessor) -> None:
    if message_type == 0:
      if self._audio_signal_signal_handler is not None:
        self._audio_signal_signal_handler.on_signal_data(msg_timestamp, message_data)

  def write_ds_changes(self, accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor) -> None:
    pass

  def prep_ds_full_update(self) -> int:
    return 0

# Object Collections
class InboundAudioTranscriptionReaderCollection(xrpa_runtime.reconciler.object_collection.ObjectCollection[AudioTranscriptionReader, ReconciledAudioTranscription]):
  def __init__(self, reconciler: xrpa_runtime.reconciler.data_store_reconciler.DataStoreReconciler):
    super().__init__(AudioTranscriptionReader, reconciler, 0, 0, 0, False)
    self._set_create_delegate_internal(ReconciledAudioTranscription.create)

  def set_create_delegate(self, create_delegate: typing.Callable[[xrpa_runtime.utils.xrpa_types.ObjectUuid, AudioTranscriptionReader, xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection], ReconciledAudioTranscription]) -> None:
    self._set_create_delegate_internal(create_delegate)

# Data Store Implementation
class AudioTranscriptionDataStore(xrpa_runtime.reconciler.data_store_reconciler.DataStoreReconciler):
  def __init__(self, inbound_transport: xrpa_runtime.transport.transport_stream.TransportStream, outbound_transport: xrpa_runtime.transport.transport_stream.TransportStream):
    super().__init__(inbound_transport, outbound_transport, 316000)
    self.AudioTranscription = InboundAudioTranscriptionReaderCollection(self)
    self._register_collection(self.AudioTranscription)
