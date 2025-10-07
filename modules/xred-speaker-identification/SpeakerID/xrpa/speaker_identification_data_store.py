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
import xrpa.speaker_identification_types
import xrpa_runtime.reconciler.collection_change_types
import xrpa_runtime.reconciler.data_store_interfaces
import xrpa_runtime.reconciler.data_store_reconciler
import xrpa_runtime.reconciler.object_collection
import xrpa_runtime.signals.inbound_signal_data
import xrpa_runtime.transport.transport_stream
import xrpa_runtime.transport.transport_stream_accessor
import xrpa_runtime.utils.memory_accessor
import xrpa_runtime.utils.xrpa_types

class SpeakerIdentifierReader(xrpa_runtime.utils.xrpa_types.ObjectAccessorInterface):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._read_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  # ID of the identified speaker, empty if no match
  def get_identified_speaker_id(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  # Name of the identified speaker, empty if no match
  def get_identified_speaker_name(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  # Confidence score of the match (0-1)
  def get_confidence_score(self) -> int:
    return self._mem_accessor.read_int(self._read_offset)

  # Error message if identification failed
  def get_error_message(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  def check_identified_speaker_id_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1) != 0

  def check_identified_speaker_name_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2) != 0

  def check_confidence_score_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 4) != 0

  def check_error_message_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 8) != 0

class SpeakerIdentifierWriter(SpeakerIdentifierReader):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._write_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  @staticmethod
  def create(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, change_byte_count: int, timestamp: int) -> "SpeakerIdentifierWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.CreateObject.value, change_byte_count, timestamp)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    return SpeakerIdentifierWriter(change_event.access_change_data())

  @staticmethod
  def update(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, fields_changed: int, change_byte_count: int) -> "SpeakerIdentifierWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionUpdateChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.UpdateObject.value, change_byte_count)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    change_event.set_fields_changed(fields_changed)
    return SpeakerIdentifierWriter(change_event.access_change_data())

  def set_identified_speaker_id(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

  def set_identified_speaker_name(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

  def set_confidence_score(self, value: int) -> None:
    self._mem_accessor.write_int(value, self._write_offset)

  def set_error_message(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

class ReferenceSpeakerReader(xrpa_runtime.utils.xrpa_types.ObjectAccessorInterface):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._read_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  # Unique identifier for this speaker
  def get_speaker_id(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  # Human-readable name for this speaker
  def get_speaker_name(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  # Path to the audio file containing the speaker's voice sample
  def get_file_path(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  # Reference back to the SpeakerIdentifier that this config belongs to
  def get_speaker_identifier(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return xrpa_runtime.utils.xrpa_types.ObjectUuid.read_value(self._mem_accessor, self._read_offset)

  def check_speaker_id_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1) != 0

  def check_speaker_name_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2) != 0

  def check_file_path_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 4) != 0

  def check_speaker_identifier_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 8) != 0

class ReferenceSpeakerWriter(ReferenceSpeakerReader):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._write_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  @staticmethod
  def create(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, change_byte_count: int, timestamp: int) -> "ReferenceSpeakerWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.CreateObject.value, change_byte_count, timestamp)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    return ReferenceSpeakerWriter(change_event.access_change_data())

  @staticmethod
  def update(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, fields_changed: int, change_byte_count: int) -> "ReferenceSpeakerWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionUpdateChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.UpdateObject.value, change_byte_count)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    change_event.set_fields_changed(fields_changed)
    return ReferenceSpeakerWriter(change_event.access_change_data())

  def set_speaker_id(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

  def set_speaker_name(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

  def set_file_path(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

  def set_speaker_identifier(self, value: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    xrpa_runtime.utils.xrpa_types.ObjectUuid.write_value(value, self._mem_accessor, self._write_offset)

class ReferenceSpeakerAudioFileReader(xrpa_runtime.utils.xrpa_types.ObjectAccessorInterface):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._read_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  # Path to the audio file containing the speaker's voice sample
  def get_file_path(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  # Reference back to the speaker this audio file belongs to
  def get_speaker(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return xrpa_runtime.utils.xrpa_types.ObjectUuid.read_value(self._mem_accessor, self._read_offset)

  def check_file_path_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1) != 0

  def check_speaker_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2) != 0

class ReferenceSpeakerAudioFileWriter(ReferenceSpeakerAudioFileReader):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._write_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  @staticmethod
  def create(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, change_byte_count: int, timestamp: int) -> "ReferenceSpeakerAudioFileWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.CreateObject.value, change_byte_count, timestamp)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    return ReferenceSpeakerAudioFileWriter(change_event.access_change_data())

  @staticmethod
  def update(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, fields_changed: int, change_byte_count: int) -> "ReferenceSpeakerAudioFileWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionUpdateChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.UpdateObject.value, change_byte_count)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    change_event.set_fields_changed(fields_changed)
    return ReferenceSpeakerAudioFileWriter(change_event.access_change_data())

  def set_file_path(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

  def set_speaker(self, value: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    xrpa_runtime.utils.xrpa_types.ObjectUuid.write_value(value, self._mem_accessor, self._write_offset)

# Reconciled Types
class ReconciledSpeakerIdentifier(xrpa_runtime.reconciler.data_store_interfaces.DataStoreObject, xrpa_runtime.reconciler.data_store_interfaces.IDataStoreObjectAccessor[SpeakerIdentifierReader]):
  def __init__(self, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, collection: xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection):
    super().__init__(id, collection)
    self._xrpa_fields_changed_handler = None
    self._xrpa_delete_handler = None
    self._local_identified_speaker_id = ""
    self._local_identified_speaker_name = ""
    self._local_confidence_score = 0
    self._local_error_message = ""
    self._change_bits = 0
    self._change_byte_count = 0
    self._audio_signal_signal_handler = None

  def _handle_xrpa_fields_changed(self, fields_changed: int) -> None:
    if self._xrpa_fields_changed_handler is not None: self._xrpa_fields_changed_handler(fields_changed)

  def on_xrpa_fields_changed(self, handler: typing.Callable[[int], None]) -> None:
    self._xrpa_fields_changed_handler = handler

  def handle_xrpa_delete(self) -> None:
    if self._xrpa_delete_handler is not None: self._xrpa_delete_handler()

  def on_xrpa_delete(self, handler: typing.Callable[[], None]) -> None:
    self._xrpa_delete_handler = handler

  def get_identified_speaker_id(self) -> str:
    return self._local_identified_speaker_id

  def set_identified_speaker_id(self, identified_speaker_id: str) -> None:
    self._local_identified_speaker_id = identified_speaker_id
    if (self._change_bits & 1) == 0:
      self._change_bits |= 1
      self._change_byte_count += 4
    self._change_byte_count += xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_identified_speaker_id)
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 1)

  def get_identified_speaker_name(self) -> str:
    return self._local_identified_speaker_name

  def set_identified_speaker_name(self, identified_speaker_name: str) -> None:
    self._local_identified_speaker_name = identified_speaker_name
    if (self._change_bits & 2) == 0:
      self._change_bits |= 2
      self._change_byte_count += 4
    self._change_byte_count += xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_identified_speaker_name)
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 2)

  def get_confidence_score(self) -> int:
    return self._local_confidence_score

  def set_confidence_score(self, confidence_score: int) -> None:
    self._local_confidence_score = confidence_score
    if (self._change_bits & 4) == 0:
      self._change_bits |= 4
      self._change_byte_count += 4
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 4)

  def get_error_message(self) -> str:
    return self._local_error_message

  def set_error_message(self, error_message: str) -> None:
    self._local_error_message = error_message
    if (self._change_bits & 8) == 0:
      self._change_bits |= 8
      self._change_byte_count += 4
    self._change_byte_count += xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_error_message)
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 8)

  def process_ds_update(self, value: SpeakerIdentifierReader, fields_changed: int) -> None:
    self._handle_xrpa_fields_changed(fields_changed)

  @staticmethod
  def create(id: xrpa_runtime.utils.xrpa_types.ObjectUuid, obj: SpeakerIdentifierReader, collection: xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection) -> "ReconciledSpeakerIdentifier":
    return ReconciledSpeakerIdentifier(id, collection)

  def check_identified_speaker_id_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1) != 0

  def check_identified_speaker_name_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2) != 0

  def check_confidence_score_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 4) != 0

  def check_error_message_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 8) != 0

  def on_audio_signal(self, handler: xrpa_runtime.signals.inbound_signal_data.InboundSignalDataInterface) -> None:
    self._audio_signal_signal_handler = handler

  def process_ds_message(self, message_type: int, msg_timestamp: int, message_data: xrpa_runtime.utils.memory_accessor.MemoryAccessor) -> None:
    if message_type == 0:
      if self._audio_signal_signal_handler is not None:
        self._audio_signal_signal_handler.on_signal_data(msg_timestamp, message_data)

  def write_ds_changes(self, accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor) -> None:
    if self._change_bits == 0:
      return
    obj_accessor = SpeakerIdentifierWriter.update(accessor, self.get_collection_id(), self.get_xrpa_id(), self._change_bits, self._change_byte_count)
    if obj_accessor is None or obj_accessor.is_null():
      return
    if (self._change_bits & 1) != 0:
      obj_accessor.set_identified_speaker_id(self._local_identified_speaker_id)
    if (self._change_bits & 2) != 0:
      obj_accessor.set_identified_speaker_name(self._local_identified_speaker_name)
    if (self._change_bits & 4) != 0:
      obj_accessor.set_confidence_score(self._local_confidence_score)
    if (self._change_bits & 8) != 0:
      obj_accessor.set_error_message(self._local_error_message)
    self._change_bits = 0
    self._change_byte_count = 0
    self._has_notified_needs_write = False

  def prep_ds_full_update(self) -> int:
    self._change_bits = 15
    self._change_byte_count = xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_identified_speaker_id) + xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_identified_speaker_name) + xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_error_message) + 16
    return 1

class ReconciledReferenceSpeaker(xrpa_runtime.reconciler.data_store_interfaces.DataStoreObject, xrpa_runtime.reconciler.data_store_interfaces.IDataStoreObjectAccessor[ReferenceSpeakerReader]):
  def __init__(self, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, collection: xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection):
    super().__init__(id, collection)
    self._xrpa_fields_changed_handler = None
    self._xrpa_delete_handler = None
    self._local_speaker_id = ""
    self._local_speaker_name = ""
    self._local_file_path = ""
    self._local_speaker_identifier = xrpa_runtime.utils.xrpa_types.ObjectUuid(0, 0)

  def _handle_xrpa_fields_changed(self, fields_changed: int) -> None:
    if self._xrpa_fields_changed_handler is not None: self._xrpa_fields_changed_handler(fields_changed)

  def on_xrpa_fields_changed(self, handler: typing.Callable[[int], None]) -> None:
    self._xrpa_fields_changed_handler = handler

  def handle_xrpa_delete(self) -> None:
    if self._xrpa_delete_handler is not None: self._xrpa_delete_handler()

  def on_xrpa_delete(self, handler: typing.Callable[[], None]) -> None:
    self._xrpa_delete_handler = handler

  def process_ds_update(self, value: ReferenceSpeakerReader, fields_changed: int) -> None:
    if value.check_speaker_id_changed(fields_changed):
      self._local_speaker_id = value.get_speaker_id()
    if value.check_speaker_name_changed(fields_changed):
      self._local_speaker_name = value.get_speaker_name()
    if value.check_file_path_changed(fields_changed):
      self._local_file_path = value.get_file_path()
    if value.check_speaker_identifier_changed(fields_changed):
      self._local_speaker_identifier = value.get_speaker_identifier()
    self._handle_xrpa_fields_changed(fields_changed)

  @staticmethod
  def create(id: xrpa_runtime.utils.xrpa_types.ObjectUuid, obj: ReferenceSpeakerReader, collection: xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection) -> "ReconciledReferenceSpeaker":
    return ReconciledReferenceSpeaker(id, collection)

  def get_speaker_id(self) -> str:
    return self._local_speaker_id

  def get_speaker_name(self) -> str:
    return self._local_speaker_name

  def get_file_path(self) -> str:
    return self._local_file_path

  def get_speaker_identifier(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return self._local_speaker_identifier

  def check_speaker_id_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1) != 0

  def check_speaker_name_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2) != 0

  def check_file_path_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 4) != 0

  def check_speaker_identifier_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 8) != 0

  def process_ds_message(self, message_type: int, msg_timestamp: int, message_data: xrpa_runtime.utils.memory_accessor.MemoryAccessor) -> None:
    pass

  def write_ds_changes(self, accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor) -> None:
    pass

  def prep_ds_full_update(self) -> int:
    return 0

class ReconciledReferenceSpeakerAudioFile(xrpa_runtime.reconciler.data_store_interfaces.DataStoreObject, xrpa_runtime.reconciler.data_store_interfaces.IDataStoreObjectAccessor[ReferenceSpeakerAudioFileReader]):
  def __init__(self, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, collection: xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection):
    super().__init__(id, collection)
    self._xrpa_fields_changed_handler = None
    self._xrpa_delete_handler = None
    self._local_file_path = ""
    self._local_speaker = xrpa_runtime.utils.xrpa_types.ObjectUuid(0, 0)

  def _handle_xrpa_fields_changed(self, fields_changed: int) -> None:
    if self._xrpa_fields_changed_handler is not None: self._xrpa_fields_changed_handler(fields_changed)

  def on_xrpa_fields_changed(self, handler: typing.Callable[[int], None]) -> None:
    self._xrpa_fields_changed_handler = handler

  def handle_xrpa_delete(self) -> None:
    if self._xrpa_delete_handler is not None: self._xrpa_delete_handler()

  def on_xrpa_delete(self, handler: typing.Callable[[], None]) -> None:
    self._xrpa_delete_handler = handler

  def process_ds_update(self, value: ReferenceSpeakerAudioFileReader, fields_changed: int) -> None:
    if value.check_file_path_changed(fields_changed):
      self._local_file_path = value.get_file_path()
    if value.check_speaker_changed(fields_changed):
      self._local_speaker = value.get_speaker()
    self._handle_xrpa_fields_changed(fields_changed)

  @staticmethod
  def create(id: xrpa_runtime.utils.xrpa_types.ObjectUuid, obj: ReferenceSpeakerAudioFileReader, collection: xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection) -> "ReconciledReferenceSpeakerAudioFile":
    return ReconciledReferenceSpeakerAudioFile(id, collection)

  def get_file_path(self) -> str:
    return self._local_file_path

  def get_speaker(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return self._local_speaker

  def check_file_path_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1) != 0

  def check_speaker_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2) != 0

  def process_ds_message(self, message_type: int, msg_timestamp: int, message_data: xrpa_runtime.utils.memory_accessor.MemoryAccessor) -> None:
    pass

  def write_ds_changes(self, accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor) -> None:
    pass

  def prep_ds_full_update(self) -> int:
    return 0

# Object Collections
class InboundSpeakerIdentifierReaderCollection(xrpa_runtime.reconciler.object_collection.ObjectCollection[SpeakerIdentifierReader, ReconciledSpeakerIdentifier]):
  def __init__(self, reconciler: xrpa_runtime.reconciler.data_store_reconciler.DataStoreReconciler):
    super().__init__(SpeakerIdentifierReader, reconciler, 0, 0, 0, False)
    self._set_create_delegate_internal(ReconciledSpeakerIdentifier.create)

  def set_create_delegate(self, create_delegate: typing.Callable[[xrpa_runtime.utils.xrpa_types.ObjectUuid, SpeakerIdentifierReader, xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection], ReconciledSpeakerIdentifier]) -> None:
    self._set_create_delegate_internal(create_delegate)

class InboundReferenceSpeakerReaderCollection(xrpa_runtime.reconciler.object_collection.ObjectCollection[ReferenceSpeakerReader, ReconciledReferenceSpeaker]):
  def __init__(self, reconciler: xrpa_runtime.reconciler.data_store_reconciler.DataStoreReconciler):
    super().__init__(ReferenceSpeakerReader, reconciler, 1, 15, 0, False)
    self._set_create_delegate_internal(ReconciledReferenceSpeaker.create)

  def set_create_delegate(self, create_delegate: typing.Callable[[xrpa_runtime.utils.xrpa_types.ObjectUuid, ReferenceSpeakerReader, xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection], ReconciledReferenceSpeaker]) -> None:
    self._set_create_delegate_internal(create_delegate)

class InboundReferenceSpeakerAudioFileReaderCollection(xrpa_runtime.reconciler.object_collection.ObjectCollection[ReferenceSpeakerAudioFileReader, ReconciledReferenceSpeakerAudioFile]):
  def __init__(self, reconciler: xrpa_runtime.reconciler.data_store_reconciler.DataStoreReconciler):
    super().__init__(ReferenceSpeakerAudioFileReader, reconciler, 2, 3, 0, False)
    self._set_create_delegate_internal(ReconciledReferenceSpeakerAudioFile.create)

  def set_create_delegate(self, create_delegate: typing.Callable[[xrpa_runtime.utils.xrpa_types.ObjectUuid, ReferenceSpeakerAudioFileReader, xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection], ReconciledReferenceSpeakerAudioFile]) -> None:
    self._set_create_delegate_internal(create_delegate)

# Data Store Implementation
class SpeakerIdentificationDataStore(xrpa_runtime.reconciler.data_store_reconciler.DataStoreReconciler):
  def __init__(self, inbound_transport: xrpa_runtime.transport.transport_stream.TransportStream, outbound_transport: xrpa_runtime.transport.transport_stream.TransportStream):
    super().__init__(inbound_transport, outbound_transport, 77320)
    self.SpeakerIdentifier = InboundSpeakerIdentifierReaderCollection(self)
    self._register_collection(self.SpeakerIdentifier)
    self.ReferenceSpeaker = InboundReferenceSpeakerReaderCollection(self)
    self._register_collection(self.ReferenceSpeaker)
    self.ReferenceSpeakerAudioFile = InboundReferenceSpeakerAudioFileReaderCollection(self)
    self._register_collection(self.ReferenceSpeakerAudioFile)
