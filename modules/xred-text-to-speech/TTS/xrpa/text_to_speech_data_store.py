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
import xrpa.text_to_speech_types
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
import xrpa_runtime.utils.xrpa_types

class TextRequestReader(xrpa_runtime.utils.xrpa_types.ObjectAccessorInterface):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._read_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  # Text to convert to speech
  def get_text(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  # Optional ID. If sent with a text request, the response will have the same ID.
  def get_id(self) -> int:
    return self._mem_accessor.read_int(self._read_offset)

class TextRequestWriter(TextRequestReader):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._write_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  def set_text(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

  def set_id(self, value: int) -> None:
    self._mem_accessor.write_int(value, self._write_offset)

class TtsResponseReader(xrpa_runtime.utils.xrpa_types.ObjectAccessorInterface):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._read_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  # Request ID that matches the original text request
  def get_id(self) -> int:
    return self._mem_accessor.read_int(self._read_offset)

  # Whether synthesis completed successfully
  def get_success(self) -> bool:
    return (self._mem_accessor.read_int(self._read_offset) == 1)

  # Error message if processing failed
  def get_error_message(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  # Timestamp when audio playback started
  def get_playback_start_timestamp(self) -> int:
    return self._mem_accessor.read_ulong(self._read_offset)

class TtsResponseWriter(TtsResponseReader):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._write_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  def set_id(self, value: int) -> None:
    self._mem_accessor.write_int(value, self._write_offset)

  def set_success(self, value: bool) -> None:
    self._mem_accessor.write_int((1 if value is True else 0), self._write_offset)

  def set_error_message(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

  def set_playback_start_timestamp(self, value: int) -> None:
    self._mem_accessor.write_ulong(value, self._write_offset)

class TextToSpeechReader(xrpa_runtime.utils.xrpa_types.ObjectAccessorInterface):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._read_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

class TextToSpeechWriter(TextToSpeechReader):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._write_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  @staticmethod
  def create(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, change_byte_count: int, timestamp: int) -> "TextToSpeechWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.CreateObject.value, change_byte_count, timestamp)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    return TextToSpeechWriter(change_event.access_change_data())

  @staticmethod
  def update(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, fields_changed: int, change_byte_count: int) -> "TextToSpeechWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionUpdateChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.UpdateObject.value, change_byte_count)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    change_event.set_fields_changed(fields_changed)
    return TextToSpeechWriter(change_event.access_change_data())

# Reconciled Types
class ReconciledTextToSpeech(xrpa_runtime.reconciler.data_store_interfaces.DataStoreObject, xrpa_runtime.reconciler.data_store_interfaces.IDataStoreObjectAccessor[TextToSpeechReader]):
  def __init__(self, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, collection: xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection):
    super().__init__(id, collection)
    self._xrpa_fields_changed_handler = None
    self._xrpa_delete_handler = None
    self._text_request_message_handler = None
    self._local_audio = xrpa_runtime.signals.outbound_signal_data.OutboundSignalData()

  def _handle_xrpa_fields_changed(self, fields_changed: int) -> None:
    if self._xrpa_fields_changed_handler is not None: self._xrpa_fields_changed_handler(fields_changed)

  def on_xrpa_fields_changed(self, handler: typing.Callable[[int], None]) -> None:
    self._xrpa_fields_changed_handler = handler

  def handle_xrpa_delete(self) -> None:
    if self._xrpa_delete_handler is not None: self._xrpa_delete_handler()

  def on_xrpa_delete(self, handler: typing.Callable[[], None]) -> None:
    self._xrpa_delete_handler = handler

  def process_ds_update(self, value: TextToSpeechReader, fields_changed: int) -> None:
    self._handle_xrpa_fields_changed(fields_changed)

  @staticmethod
  def create(id: xrpa_runtime.utils.xrpa_types.ObjectUuid, obj: TextToSpeechReader, collection: xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection) -> "ReconciledTextToSpeech":
    return ReconciledTextToSpeech(id, collection)

  def on_text_request(self, handler: typing.Callable[[int, TextRequestReader], None]) -> None:
    self._text_request_message_handler = handler

  def send_tts_response(self, id: int, success: bool, error_message: str, playback_start_timestamp: int) -> None:
    message = TtsResponseWriter(self._collection.send_message(
        self.get_xrpa_id(),
        2,
        xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(error_message) + 20))
    message.set_id(id)
    message.set_success(success)
    message.set_error_message(error_message)
    message.set_playback_start_timestamp(playback_start_timestamp)

  def set_audio_callback(self, signal_callback: xrpa_runtime.signals.outbound_signal_data.SignalProducerCallback, sample_type_name: str, num_channels: int, frames_per_second: int, frames_per_packet: int) -> None:
    self._local_audio.set_signal_source(signal_callback, num_channels, frames_per_second, frames_per_packet, sample_type_name)

  def set_audio_ring_buffer(self, signal_ring_buffer: xrpa_runtime.signals.signal_ring_buffer.SignalRingBuffer, sample_type_name: str, num_channels: int, frames_per_second: int, frames_per_packet: int) -> None:
    self._local_audio.set_signal_source(signal_ring_buffer, num_channels, frames_per_second, frames_per_packet, sample_type_name)

  def set_audio_forwarder(self, signal_forwarder: xrpa_runtime.signals.inbound_signal_forwarder.InboundSignalForwarder) -> None:
    self._local_audio.set_recipient(self.get_xrpa_id(), self._collection, 1)
    signal_forwarder.add_recipient(self._local_audio)

  def send_audio(self, frame_count: int, sample_type_name: str, num_channels: int, frames_per_second: int) -> xrpa_runtime.signals.signal_shared.SignalPacket:
    sample_type: int = xrpa_runtime.signals.signal_shared.SignalTypeInference.infer_sample_type(sample_type_name)
    self._local_audio.set_recipient(self.get_xrpa_id(), self._collection, 1)
    return self._local_audio.send_signal_packet(xrpa_runtime.utils.memory_accessor.MemoryUtils.get_type_size(sample_type_name), frame_count, sample_type, num_channels, frames_per_second)

  def tick_xrpa(self) -> None:
    id = self.get_xrpa_id()
    self._local_audio.set_recipient(id, self._collection, 1)
    self._local_audio.tick()

  def process_ds_message(self, message_type: int, msg_timestamp: int, message_data: xrpa_runtime.utils.memory_accessor.MemoryAccessor) -> None:
    if message_type == 0:
      if self._text_request_message_handler is not None:
        message = TextRequestReader(message_data)
        self._text_request_message_handler(msg_timestamp, message)

  def write_ds_changes(self, accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor) -> None:
    pass

  def prep_ds_full_update(self) -> int:
    return 0

# Object Collections
class InboundTextToSpeechReaderCollection(xrpa_runtime.reconciler.object_collection.ObjectCollection[TextToSpeechReader, ReconciledTextToSpeech]):
  def __init__(self, reconciler: xrpa_runtime.reconciler.data_store_reconciler.DataStoreReconciler):
    super().__init__(TextToSpeechReader, reconciler, 0, 0, 0, False)
    self._set_create_delegate_internal(ReconciledTextToSpeech.create)

  def set_create_delegate(self, create_delegate: typing.Callable[[xrpa_runtime.utils.xrpa_types.ObjectUuid, TextToSpeechReader, xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection], ReconciledTextToSpeech]) -> None:
    self._set_create_delegate_internal(create_delegate)

# Data Store Implementation
class TextToSpeechDataStore(xrpa_runtime.reconciler.data_store_reconciler.DataStoreReconciler):
  def __init__(self, inbound_transport: xrpa_runtime.transport.transport_stream.TransportStream, outbound_transport: xrpa_runtime.transport.transport_stream.TransportStream):
    super().__init__(inbound_transport, outbound_transport, 1266112)
    self.TextToSpeech = InboundTextToSpeechReaderCollection(self)
    self._register_collection(self.TextToSpeech)
