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
import xrpa.llm_hub_types
import xrpa_runtime.reconciler.collection_change_types
import xrpa_runtime.reconciler.data_store_interfaces
import xrpa_runtime.reconciler.data_store_reconciler
import xrpa_runtime.reconciler.object_collection
import xrpa_runtime.reconciler.object_collection_index
import xrpa_runtime.transport.transport_stream
import xrpa_runtime.transport.transport_stream_accessor
import xrpa_runtime.utils.image_types
import xrpa_runtime.utils.memory_accessor
import xrpa_runtime.utils.xrpa_types

class McpServerSetReader(xrpa_runtime.utils.xrpa_types.ObjectAccessorInterface):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._read_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

class McpServerSetWriter(McpServerSetReader):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._write_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  @staticmethod
  def create(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, change_byte_count: int, timestamp: int) -> "McpServerSetWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.CreateObject.value, change_byte_count, timestamp)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    return McpServerSetWriter(change_event.access_change_data())

  @staticmethod
  def update(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, fields_changed: int, change_byte_count: int) -> "McpServerSetWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionUpdateChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.UpdateObject.value, change_byte_count)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    change_event.set_fields_changed(fields_changed)
    return McpServerSetWriter(change_event.access_change_data())

class McpServerConfigReader(xrpa_runtime.utils.xrpa_types.ObjectAccessorInterface):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._read_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  # URL of the MCP server
  def get_url(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  # Authentication token for the MCP server
  def get_auth_token(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  # Reference back to the server set this config belongs to
  def get_server_set(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return xrpa_runtime.utils.xrpa_types.ObjectUuid.read_value(self._mem_accessor, self._read_offset)

  def check_url_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1) != 0

  def check_auth_token_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2) != 0

  def check_server_set_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 4) != 0

class McpServerConfigWriter(McpServerConfigReader):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._write_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  @staticmethod
  def create(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, change_byte_count: int, timestamp: int) -> "McpServerConfigWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.CreateObject.value, change_byte_count, timestamp)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    return McpServerConfigWriter(change_event.access_change_data())

  @staticmethod
  def update(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, fields_changed: int, change_byte_count: int) -> "McpServerConfigWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionUpdateChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.UpdateObject.value, change_byte_count)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    change_event.set_fields_changed(fields_changed)
    return McpServerConfigWriter(change_event.access_change_data())

  def set_url(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

  def set_auth_token(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

  def set_server_set(self, value: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    xrpa_runtime.utils.xrpa_types.ObjectUuid.write_value(value, self._mem_accessor, self._write_offset)

class LlmChatMessageReader(xrpa_runtime.utils.xrpa_types.ObjectAccessorInterface):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._read_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  def get_data(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  # Optional JPEG image data.
  def get_jpeg_image_data(self) -> bytearray:
    return self._mem_accessor.read_bytearray(self._read_offset)

  # Optional ID. If sent with a chat message, the response will have the same ID.
  def get_id(self) -> int:
    return self._mem_accessor.read_int(self._read_offset)

class LlmChatMessageWriter(LlmChatMessageReader):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._write_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  def set_data(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

  def set_jpeg_image_data(self, value: bytearray) -> None:
    self._mem_accessor.write_bytearray(value, self._write_offset)

  def set_id(self, value: int) -> None:
    self._mem_accessor.write_int(value, self._write_offset)

class LlmChatResponseReader(xrpa_runtime.utils.xrpa_types.ObjectAccessorInterface):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._read_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  def get_data(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  # Optional ID. If sent with a chat message, the response will have the same ID.
  def get_id(self) -> int:
    return self._mem_accessor.read_int(self._read_offset)

class LlmChatResponseWriter(LlmChatResponseReader):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._write_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  def set_data(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

  def set_id(self, value: int) -> None:
    self._mem_accessor.write_int(value, self._write_offset)

class LlmQueryReader(xrpa_runtime.utils.xrpa_types.ObjectAccessorInterface):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._read_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  def get_api_key(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  def get_api_provider(self) -> xrpa.llm_hub_types.ApiProvider:
    return xrpa.llm_hub_types.ApiProvider(self._mem_accessor.read_int(self._read_offset))

  def get_model_size(self) -> xrpa.llm_hub_types.ModelSizeHint:
    return xrpa.llm_hub_types.ModelSizeHint(self._mem_accessor.read_int(self._read_offset))

  def get_sys_prompt(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  # Controls randomness: 0.0 = deterministic, 1.0 = creative
  def get_temperature(self) -> float:
    return xrpa.llm_hub_types.DSScalar.read_value(self._mem_accessor, self._read_offset)

  # Maximum number of tokens to generate
  def get_max_tokens(self) -> int:
    return self._mem_accessor.read_int(self._read_offset)

  # Maximum number of consecutive tool calls
  def get_max_consecutive_tool_calls(self) -> int:
    return self._mem_accessor.read_int(self._read_offset)

  def get_is_processing(self) -> int:
    return self._mem_accessor.read_int(self._read_offset)

  # Optional JSON schema for the response.
  def get_json_schema(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  def get_mcp_server_set(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return xrpa_runtime.utils.xrpa_types.ObjectUuid.read_value(self._mem_accessor, self._read_offset)

  def get_user_prompt(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  # Optional JPEG image data.
  def get_jpeg_image_data(self) -> bytearray:
    return self._mem_accessor.read_bytearray(self._read_offset)

  def check_api_key_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1) != 0

  def check_api_provider_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2) != 0

  def check_model_size_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 4) != 0

  def check_sys_prompt_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 8) != 0

  def check_temperature_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 16) != 0

  def check_max_tokens_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 32) != 0

  def check_max_consecutive_tool_calls_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 64) != 0

  def check_is_processing_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 128) != 0

  def check_json_schema_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 256) != 0

  def check_mcp_server_set_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 512) != 0

  def check_user_prompt_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1024) != 0

  def check_jpeg_image_data_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2048) != 0

class LlmQueryWriter(LlmQueryReader):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._write_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  @staticmethod
  def create(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, change_byte_count: int, timestamp: int) -> "LlmQueryWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.CreateObject.value, change_byte_count, timestamp)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    return LlmQueryWriter(change_event.access_change_data())

  @staticmethod
  def update(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, fields_changed: int, change_byte_count: int) -> "LlmQueryWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionUpdateChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.UpdateObject.value, change_byte_count)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    change_event.set_fields_changed(fields_changed)
    return LlmQueryWriter(change_event.access_change_data())

  def set_api_key(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

  def set_api_provider(self, value: xrpa.llm_hub_types.ApiProvider) -> None:
    self._mem_accessor.write_int(value.value, self._write_offset)

  def set_model_size(self, value: xrpa.llm_hub_types.ModelSizeHint) -> None:
    self._mem_accessor.write_int(value.value, self._write_offset)

  def set_sys_prompt(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

  def set_temperature(self, value: float) -> None:
    xrpa.llm_hub_types.DSScalar.write_value(value, self._mem_accessor, self._write_offset)

  def set_max_tokens(self, value: int) -> None:
    self._mem_accessor.write_int(value, self._write_offset)

  def set_max_consecutive_tool_calls(self, value: int) -> None:
    self._mem_accessor.write_int(value, self._write_offset)

  def set_is_processing(self, value: int) -> None:
    self._mem_accessor.write_int(value, self._write_offset)

  def set_json_schema(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

  def set_mcp_server_set(self, value: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    xrpa_runtime.utils.xrpa_types.ObjectUuid.write_value(value, self._mem_accessor, self._write_offset)

  def set_user_prompt(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

  def set_jpeg_image_data(self, value: bytearray) -> None:
    self._mem_accessor.write_bytearray(value, self._write_offset)

class RgbImageFeedReader(xrpa_runtime.utils.xrpa_types.ObjectAccessorInterface):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._read_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  def get_image(self) -> xrpa_runtime.utils.image_types.Image:
    return xrpa.llm_hub_types.DSRgbImage.read_value(self._mem_accessor, self._read_offset)

class RgbImageFeedWriter(RgbImageFeedReader):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._write_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  def set_image(self, value: xrpa_runtime.utils.image_types.Image) -> None:
    xrpa.llm_hub_types.DSRgbImage.write_value(value, self._mem_accessor, self._write_offset)

class LlmTriggeredQueryReader(xrpa_runtime.utils.xrpa_types.ObjectAccessorInterface):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._read_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  def get_api_key(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  def get_api_provider(self) -> xrpa.llm_hub_types.ApiProvider:
    return xrpa.llm_hub_types.ApiProvider(self._mem_accessor.read_int(self._read_offset))

  def get_model_size(self) -> xrpa.llm_hub_types.ModelSizeHint:
    return xrpa.llm_hub_types.ModelSizeHint(self._mem_accessor.read_int(self._read_offset))

  def get_sys_prompt(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  # Controls randomness: 0.0 = deterministic, 1.0 = creative
  def get_temperature(self) -> float:
    return xrpa.llm_hub_types.DSScalar.read_value(self._mem_accessor, self._read_offset)

  # Maximum number of tokens to generate
  def get_max_tokens(self) -> int:
    return self._mem_accessor.read_int(self._read_offset)

  # Maximum number of consecutive tool calls
  def get_max_consecutive_tool_calls(self) -> int:
    return self._mem_accessor.read_int(self._read_offset)

  def get_is_processing(self) -> int:
    return self._mem_accessor.read_int(self._read_offset)

  # Optional JSON schema for the response.
  def get_json_schema(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  def get_mcp_server_set(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return xrpa_runtime.utils.xrpa_types.ObjectUuid.read_value(self._mem_accessor, self._read_offset)

  def get_user_prompt(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  def get_trigger_id(self) -> int:
    return self._mem_accessor.read_int(self._read_offset)

  def check_api_key_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1) != 0

  def check_api_provider_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2) != 0

  def check_model_size_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 4) != 0

  def check_sys_prompt_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 8) != 0

  def check_temperature_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 16) != 0

  def check_max_tokens_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 32) != 0

  def check_max_consecutive_tool_calls_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 64) != 0

  def check_is_processing_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 128) != 0

  def check_json_schema_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 256) != 0

  def check_mcp_server_set_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 512) != 0

  def check_user_prompt_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1024) != 0

  def check_trigger_id_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2048) != 0

class LlmTriggeredQueryWriter(LlmTriggeredQueryReader):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._write_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  @staticmethod
  def create(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, change_byte_count: int, timestamp: int) -> "LlmTriggeredQueryWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.CreateObject.value, change_byte_count, timestamp)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    return LlmTriggeredQueryWriter(change_event.access_change_data())

  @staticmethod
  def update(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, fields_changed: int, change_byte_count: int) -> "LlmTriggeredQueryWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionUpdateChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.UpdateObject.value, change_byte_count)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    change_event.set_fields_changed(fields_changed)
    return LlmTriggeredQueryWriter(change_event.access_change_data())

  def set_api_key(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

  def set_api_provider(self, value: xrpa.llm_hub_types.ApiProvider) -> None:
    self._mem_accessor.write_int(value.value, self._write_offset)

  def set_model_size(self, value: xrpa.llm_hub_types.ModelSizeHint) -> None:
    self._mem_accessor.write_int(value.value, self._write_offset)

  def set_sys_prompt(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

  def set_temperature(self, value: float) -> None:
    xrpa.llm_hub_types.DSScalar.write_value(value, self._mem_accessor, self._write_offset)

  def set_max_tokens(self, value: int) -> None:
    self._mem_accessor.write_int(value, self._write_offset)

  def set_max_consecutive_tool_calls(self, value: int) -> None:
    self._mem_accessor.write_int(value, self._write_offset)

  def set_is_processing(self, value: int) -> None:
    self._mem_accessor.write_int(value, self._write_offset)

  def set_json_schema(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

  def set_mcp_server_set(self, value: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    xrpa_runtime.utils.xrpa_types.ObjectUuid.write_value(value, self._mem_accessor, self._write_offset)

  def set_user_prompt(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

  def set_trigger_id(self, value: int) -> None:
    self._mem_accessor.write_int(value, self._write_offset)

class LlmConversationReader(xrpa_runtime.utils.xrpa_types.ObjectAccessorInterface):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._read_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  def get_api_key(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  def get_api_provider(self) -> xrpa.llm_hub_types.ApiProvider:
    return xrpa.llm_hub_types.ApiProvider(self._mem_accessor.read_int(self._read_offset))

  def get_model_size(self) -> xrpa.llm_hub_types.ModelSizeHint:
    return xrpa.llm_hub_types.ModelSizeHint(self._mem_accessor.read_int(self._read_offset))

  def get_sys_prompt(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  # Controls randomness: 0.0 = deterministic, 1.0 = creative
  def get_temperature(self) -> float:
    return xrpa.llm_hub_types.DSScalar.read_value(self._mem_accessor, self._read_offset)

  # Maximum number of tokens to generate
  def get_max_tokens(self) -> int:
    return self._mem_accessor.read_int(self._read_offset)

  # Maximum number of consecutive tool calls
  def get_max_consecutive_tool_calls(self) -> int:
    return self._mem_accessor.read_int(self._read_offset)

  def get_is_processing(self) -> int:
    return self._mem_accessor.read_int(self._read_offset)

  # Optional starter message for the conversation. Will be sent as an additional message between the system prompt and the user prompt.
  def get_conversation_starter(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  def get_mcp_server_set(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return xrpa_runtime.utils.xrpa_types.ObjectUuid.read_value(self._mem_accessor, self._read_offset)

  def check_api_key_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1) != 0

  def check_api_provider_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2) != 0

  def check_model_size_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 4) != 0

  def check_sys_prompt_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 8) != 0

  def check_temperature_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 16) != 0

  def check_max_tokens_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 32) != 0

  def check_max_consecutive_tool_calls_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 64) != 0

  def check_is_processing_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 128) != 0

  def check_conversation_starter_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 256) != 0

  def check_mcp_server_set_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 512) != 0

class LlmConversationWriter(LlmConversationReader):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._write_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  @staticmethod
  def create(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, change_byte_count: int, timestamp: int) -> "LlmConversationWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.CreateObject.value, change_byte_count, timestamp)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    return LlmConversationWriter(change_event.access_change_data())

  @staticmethod
  def update(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, fields_changed: int, change_byte_count: int) -> "LlmConversationWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionUpdateChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.UpdateObject.value, change_byte_count)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    change_event.set_fields_changed(fields_changed)
    return LlmConversationWriter(change_event.access_change_data())

  def set_api_key(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

  def set_api_provider(self, value: xrpa.llm_hub_types.ApiProvider) -> None:
    self._mem_accessor.write_int(value.value, self._write_offset)

  def set_model_size(self, value: xrpa.llm_hub_types.ModelSizeHint) -> None:
    self._mem_accessor.write_int(value.value, self._write_offset)

  def set_sys_prompt(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

  def set_temperature(self, value: float) -> None:
    xrpa.llm_hub_types.DSScalar.write_value(value, self._mem_accessor, self._write_offset)

  def set_max_tokens(self, value: int) -> None:
    self._mem_accessor.write_int(value, self._write_offset)

  def set_max_consecutive_tool_calls(self, value: int) -> None:
    self._mem_accessor.write_int(value, self._write_offset)

  def set_is_processing(self, value: int) -> None:
    self._mem_accessor.write_int(value, self._write_offset)

  def set_conversation_starter(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

  def set_mcp_server_set(self, value: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    xrpa_runtime.utils.xrpa_types.ObjectUuid.write_value(value, self._mem_accessor, self._write_offset)

# Reconciled Types
class ReconciledMcpServerSet(xrpa_runtime.reconciler.data_store_interfaces.DataStoreObject, xrpa_runtime.reconciler.data_store_interfaces.IDataStoreObjectAccessor[McpServerSetReader]):
  def __init__(self, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, collection: xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection):
    super().__init__(id, collection)
    self._xrpa_fields_changed_handler = None
    self._xrpa_delete_handler = None

  def _handle_xrpa_fields_changed(self, fields_changed: int) -> None:
    if self._xrpa_fields_changed_handler is not None: self._xrpa_fields_changed_handler(fields_changed)

  def on_xrpa_fields_changed(self, handler: typing.Callable[[int], None]) -> None:
    self._xrpa_fields_changed_handler = handler

  def handle_xrpa_delete(self) -> None:
    if self._xrpa_delete_handler is not None: self._xrpa_delete_handler()

  def on_xrpa_delete(self, handler: typing.Callable[[], None]) -> None:
    self._xrpa_delete_handler = handler

  def process_ds_update(self, value: McpServerSetReader, fields_changed: int) -> None:
    self._handle_xrpa_fields_changed(fields_changed)

  @staticmethod
  def create(id: xrpa_runtime.utils.xrpa_types.ObjectUuid, obj: McpServerSetReader, collection: xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection) -> "ReconciledMcpServerSet":
    return ReconciledMcpServerSet(id, collection)

  def process_ds_message(self, message_type: int, msg_timestamp: int, message_data: xrpa_runtime.utils.memory_accessor.MemoryAccessor) -> None:
    pass

  def write_ds_changes(self, accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor) -> None:
    pass

  def prep_ds_full_update(self) -> int:
    return 0

class ReconciledMcpServerConfig(xrpa_runtime.reconciler.data_store_interfaces.DataStoreObject, xrpa_runtime.reconciler.data_store_interfaces.IDataStoreObjectAccessor[McpServerConfigReader]):
  def __init__(self, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, collection: xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection):
    super().__init__(id, collection)
    self._xrpa_fields_changed_handler = None
    self._xrpa_delete_handler = None
    self._local_url = "http://localhost:3000/mcp"
    self._local_auth_token = ""
    self._local_server_set = xrpa_runtime.utils.xrpa_types.ObjectUuid(0, 0)

  def _handle_xrpa_fields_changed(self, fields_changed: int) -> None:
    if self._xrpa_fields_changed_handler is not None: self._xrpa_fields_changed_handler(fields_changed)

  def on_xrpa_fields_changed(self, handler: typing.Callable[[int], None]) -> None:
    self._xrpa_fields_changed_handler = handler

  def handle_xrpa_delete(self) -> None:
    if self._xrpa_delete_handler is not None: self._xrpa_delete_handler()

  def on_xrpa_delete(self, handler: typing.Callable[[], None]) -> None:
    self._xrpa_delete_handler = handler

  def process_ds_update(self, value: McpServerConfigReader, fields_changed: int) -> None:
    if value.check_url_changed(fields_changed):
      self._local_url = value.get_url()
    if value.check_auth_token_changed(fields_changed):
      self._local_auth_token = value.get_auth_token()
    if value.check_server_set_changed(fields_changed):
      self._local_server_set = value.get_server_set()
    self._handle_xrpa_fields_changed(fields_changed)

  @staticmethod
  def create(id: xrpa_runtime.utils.xrpa_types.ObjectUuid, obj: McpServerConfigReader, collection: xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection) -> "ReconciledMcpServerConfig":
    return ReconciledMcpServerConfig(id, collection)

  def get_url(self) -> str:
    return self._local_url

  def get_auth_token(self) -> str:
    return self._local_auth_token

  def get_server_set(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return self._local_server_set

  def check_url_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1) != 0

  def check_auth_token_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2) != 0

  def check_server_set_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 4) != 0

  def process_ds_message(self, message_type: int, msg_timestamp: int, message_data: xrpa_runtime.utils.memory_accessor.MemoryAccessor) -> None:
    pass

  def write_ds_changes(self, accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor) -> None:
    pass

  def prep_ds_full_update(self) -> int:
    return 0

class ReconciledLlmQuery(xrpa_runtime.reconciler.data_store_interfaces.DataStoreObject, xrpa_runtime.reconciler.data_store_interfaces.IDataStoreObjectAccessor[LlmQueryReader]):
  def __init__(self, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, collection: xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection):
    super().__init__(id, collection)
    self._xrpa_fields_changed_handler = None
    self._xrpa_delete_handler = None
    self._local_is_processing = 0
    self._change_bits = 0
    self._change_byte_count = 0
    self._local_api_key = ""
    self._local_api_provider = xrpa.llm_hub_types.ApiProvider.MetaGenProxy
    self._local_model_size = xrpa.llm_hub_types.ModelSizeHint.Small
    self._local_sys_prompt = ""
    self._local_temperature = 0.7
    self._local_max_tokens = 256
    self._local_max_consecutive_tool_calls = 20
    self._local_json_schema = ""
    self._local_mcp_server_set = xrpa_runtime.utils.xrpa_types.ObjectUuid(0, 0)
    self._local_user_prompt = ""
    self._local_jpeg_image_data = bytearray()
    self._query_message_handler = None

  def _handle_xrpa_fields_changed(self, fields_changed: int) -> None:
    if self._xrpa_fields_changed_handler is not None: self._xrpa_fields_changed_handler(fields_changed)

  def on_xrpa_fields_changed(self, handler: typing.Callable[[int], None]) -> None:
    self._xrpa_fields_changed_handler = handler

  def handle_xrpa_delete(self) -> None:
    if self._xrpa_delete_handler is not None: self._xrpa_delete_handler()

  def on_xrpa_delete(self, handler: typing.Callable[[], None]) -> None:
    self._xrpa_delete_handler = handler

  def get_is_processing(self) -> int:
    return self._local_is_processing

  def set_is_processing(self, is_processing: int) -> None:
    self._local_is_processing = is_processing
    if (self._change_bits & 128) == 0:
      self._change_bits |= 128
      self._change_byte_count += 4
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 128)

  def process_ds_update(self, value: LlmQueryReader, fields_changed: int) -> None:
    if value.check_api_key_changed(fields_changed):
      self._local_api_key = value.get_api_key()
    if value.check_api_provider_changed(fields_changed):
      self._local_api_provider = value.get_api_provider()
    if value.check_model_size_changed(fields_changed):
      self._local_model_size = value.get_model_size()
    if value.check_sys_prompt_changed(fields_changed):
      self._local_sys_prompt = value.get_sys_prompt()
    if value.check_temperature_changed(fields_changed):
      self._local_temperature = value.get_temperature()
    if value.check_max_tokens_changed(fields_changed):
      self._local_max_tokens = value.get_max_tokens()
    if value.check_max_consecutive_tool_calls_changed(fields_changed):
      self._local_max_consecutive_tool_calls = value.get_max_consecutive_tool_calls()
    if value.check_json_schema_changed(fields_changed):
      self._local_json_schema = value.get_json_schema()
    if value.check_mcp_server_set_changed(fields_changed):
      self._local_mcp_server_set = value.get_mcp_server_set()
    if value.check_user_prompt_changed(fields_changed):
      self._local_user_prompt = value.get_user_prompt()
    if value.check_jpeg_image_data_changed(fields_changed):
      self._local_jpeg_image_data = value.get_jpeg_image_data()
    self._handle_xrpa_fields_changed(fields_changed)

  @staticmethod
  def create(id: xrpa_runtime.utils.xrpa_types.ObjectUuid, obj: LlmQueryReader, collection: xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection) -> "ReconciledLlmQuery":
    return ReconciledLlmQuery(id, collection)

  def get_api_key(self) -> str:
    return self._local_api_key

  def get_api_provider(self) -> xrpa.llm_hub_types.ApiProvider:
    return self._local_api_provider

  def get_model_size(self) -> xrpa.llm_hub_types.ModelSizeHint:
    return self._local_model_size

  def get_sys_prompt(self) -> str:
    return self._local_sys_prompt

  def get_temperature(self) -> float:
    return self._local_temperature

  def get_max_tokens(self) -> int:
    return self._local_max_tokens

  def get_max_consecutive_tool_calls(self) -> int:
    return self._local_max_consecutive_tool_calls

  def get_json_schema(self) -> str:
    return self._local_json_schema

  def get_mcp_server_set(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return self._local_mcp_server_set

  def get_user_prompt(self) -> str:
    return self._local_user_prompt

  def get_jpeg_image_data(self) -> bytearray:
    return self._local_jpeg_image_data

  def check_api_key_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1) != 0

  def check_api_provider_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2) != 0

  def check_model_size_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 4) != 0

  def check_sys_prompt_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 8) != 0

  def check_temperature_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 16) != 0

  def check_max_tokens_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 32) != 0

  def check_max_consecutive_tool_calls_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 64) != 0

  def check_is_processing_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 128) != 0

  def check_json_schema_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 256) != 0

  def check_mcp_server_set_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 512) != 0

  def check_user_prompt_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1024) != 0

  def check_jpeg_image_data_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2048) != 0

  def on_query(self, handler: typing.Callable[[int, LlmChatMessageReader], None]) -> None:
    self._query_message_handler = handler

  def send_response(self, data: str, id: int) -> None:
    message = LlmChatResponseWriter(self._collection.send_message(
        self.get_xrpa_id(),
        13,
        xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(data) + 8))
    message.set_data(data)
    message.set_id(id)

  def send_response_stream(self, data: str, id: int) -> None:
    message = LlmChatResponseWriter(self._collection.send_message(
        self.get_xrpa_id(),
        14,
        xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(data) + 8))
    message.set_data(data)
    message.set_id(id)

  def process_ds_message(self, message_type: int, msg_timestamp: int, message_data: xrpa_runtime.utils.memory_accessor.MemoryAccessor) -> None:
    if message_type == 10:
      if self._query_message_handler is not None:
        message = LlmChatMessageReader(message_data)
        self._query_message_handler(msg_timestamp, message)

  def write_ds_changes(self, accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor) -> None:
    if self._change_bits == 0:
      return
    obj_accessor = LlmQueryWriter.update(accessor, self.get_collection_id(), self.get_xrpa_id(), self._change_bits, self._change_byte_count)
    if obj_accessor is None or obj_accessor.is_null():
      return
    if (self._change_bits & 128) != 0:
      obj_accessor.set_is_processing(self._local_is_processing)
    self._change_bits = 0
    self._change_byte_count = 0
    self._has_notified_needs_write = False

  def prep_ds_full_update(self) -> int:
    self._change_bits = 128
    self._change_byte_count = 4
    return 1

class ReconciledLlmTriggeredQuery(xrpa_runtime.reconciler.data_store_interfaces.DataStoreObject, xrpa_runtime.reconciler.data_store_interfaces.IDataStoreObjectAccessor[LlmTriggeredQueryReader]):
  def __init__(self, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, collection: xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection):
    super().__init__(id, collection)
    self._xrpa_fields_changed_handler = None
    self._xrpa_delete_handler = None
    self._local_is_processing = 0
    self._change_bits = 0
    self._change_byte_count = 0
    self._local_api_key = ""
    self._local_api_provider = xrpa.llm_hub_types.ApiProvider.MetaGenProxy
    self._local_model_size = xrpa.llm_hub_types.ModelSizeHint.Small
    self._local_sys_prompt = ""
    self._local_temperature = 0.7
    self._local_max_tokens = 256
    self._local_max_consecutive_tool_calls = 20
    self._local_json_schema = ""
    self._local_mcp_server_set = xrpa_runtime.utils.xrpa_types.ObjectUuid(0, 0)
    self._local_user_prompt = ""
    self._local_trigger_id = 0
    self._rgb_image_feed_message_handler = None

  def _handle_xrpa_fields_changed(self, fields_changed: int) -> None:
    if self._xrpa_fields_changed_handler is not None: self._xrpa_fields_changed_handler(fields_changed)

  def on_xrpa_fields_changed(self, handler: typing.Callable[[int], None]) -> None:
    self._xrpa_fields_changed_handler = handler

  def handle_xrpa_delete(self) -> None:
    if self._xrpa_delete_handler is not None: self._xrpa_delete_handler()

  def on_xrpa_delete(self, handler: typing.Callable[[], None]) -> None:
    self._xrpa_delete_handler = handler

  def get_is_processing(self) -> int:
    return self._local_is_processing

  def set_is_processing(self, is_processing: int) -> None:
    self._local_is_processing = is_processing
    if (self._change_bits & 128) == 0:
      self._change_bits |= 128
      self._change_byte_count += 4
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 128)

  def process_ds_update(self, value: LlmTriggeredQueryReader, fields_changed: int) -> None:
    if value.check_api_key_changed(fields_changed):
      self._local_api_key = value.get_api_key()
    if value.check_api_provider_changed(fields_changed):
      self._local_api_provider = value.get_api_provider()
    if value.check_model_size_changed(fields_changed):
      self._local_model_size = value.get_model_size()
    if value.check_sys_prompt_changed(fields_changed):
      self._local_sys_prompt = value.get_sys_prompt()
    if value.check_temperature_changed(fields_changed):
      self._local_temperature = value.get_temperature()
    if value.check_max_tokens_changed(fields_changed):
      self._local_max_tokens = value.get_max_tokens()
    if value.check_max_consecutive_tool_calls_changed(fields_changed):
      self._local_max_consecutive_tool_calls = value.get_max_consecutive_tool_calls()
    if value.check_json_schema_changed(fields_changed):
      self._local_json_schema = value.get_json_schema()
    if value.check_mcp_server_set_changed(fields_changed):
      self._local_mcp_server_set = value.get_mcp_server_set()
    if value.check_user_prompt_changed(fields_changed):
      self._local_user_prompt = value.get_user_prompt()
    if value.check_trigger_id_changed(fields_changed):
      self._local_trigger_id = value.get_trigger_id()
    self._handle_xrpa_fields_changed(fields_changed)

  @staticmethod
  def create(id: xrpa_runtime.utils.xrpa_types.ObjectUuid, obj: LlmTriggeredQueryReader, collection: xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection) -> "ReconciledLlmTriggeredQuery":
    return ReconciledLlmTriggeredQuery(id, collection)

  def get_api_key(self) -> str:
    return self._local_api_key

  def get_api_provider(self) -> xrpa.llm_hub_types.ApiProvider:
    return self._local_api_provider

  def get_model_size(self) -> xrpa.llm_hub_types.ModelSizeHint:
    return self._local_model_size

  def get_sys_prompt(self) -> str:
    return self._local_sys_prompt

  def get_temperature(self) -> float:
    return self._local_temperature

  def get_max_tokens(self) -> int:
    return self._local_max_tokens

  def get_max_consecutive_tool_calls(self) -> int:
    return self._local_max_consecutive_tool_calls

  def get_json_schema(self) -> str:
    return self._local_json_schema

  def get_mcp_server_set(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return self._local_mcp_server_set

  def get_user_prompt(self) -> str:
    return self._local_user_prompt

  def get_trigger_id(self) -> int:
    return self._local_trigger_id

  def check_api_key_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1) != 0

  def check_api_provider_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2) != 0

  def check_model_size_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 4) != 0

  def check_sys_prompt_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 8) != 0

  def check_temperature_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 16) != 0

  def check_max_tokens_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 32) != 0

  def check_max_consecutive_tool_calls_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 64) != 0

  def check_is_processing_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 128) != 0

  def check_json_schema_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 256) != 0

  def check_mcp_server_set_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 512) != 0

  def check_user_prompt_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1024) != 0

  def check_trigger_id_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2048) != 0

  def on_rgb_image_feed(self, handler: typing.Callable[[int, RgbImageFeedReader], None]) -> None:
    self._rgb_image_feed_message_handler = handler

  def send_response(self, data: str, id: int) -> None:
    message = LlmChatResponseWriter(self._collection.send_message(
        self.get_xrpa_id(),
        13,
        xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(data) + 8))
    message.set_data(data)
    message.set_id(id)

  def send_response_stream(self, data: str, id: int) -> None:
    message = LlmChatResponseWriter(self._collection.send_message(
        self.get_xrpa_id(),
        14,
        xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(data) + 8))
    message.set_data(data)
    message.set_id(id)

  def process_ds_message(self, message_type: int, msg_timestamp: int, message_data: xrpa_runtime.utils.memory_accessor.MemoryAccessor) -> None:
    if message_type == 11:
      if self._rgb_image_feed_message_handler is not None:
        message = RgbImageFeedReader(message_data)
        self._rgb_image_feed_message_handler(msg_timestamp, message)

  def write_ds_changes(self, accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor) -> None:
    if self._change_bits == 0:
      return
    obj_accessor = LlmTriggeredQueryWriter.update(accessor, self.get_collection_id(), self.get_xrpa_id(), self._change_bits, self._change_byte_count)
    if obj_accessor is None or obj_accessor.is_null():
      return
    if (self._change_bits & 128) != 0:
      obj_accessor.set_is_processing(self._local_is_processing)
    self._change_bits = 0
    self._change_byte_count = 0
    self._has_notified_needs_write = False

  def prep_ds_full_update(self) -> int:
    self._change_bits = 128
    self._change_byte_count = 4
    return 1

class ReconciledLlmConversation(xrpa_runtime.reconciler.data_store_interfaces.DataStoreObject, xrpa_runtime.reconciler.data_store_interfaces.IDataStoreObjectAccessor[LlmConversationReader]):
  def __init__(self, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, collection: xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection):
    super().__init__(id, collection)
    self._xrpa_fields_changed_handler = None
    self._xrpa_delete_handler = None
    self._local_is_processing = 0
    self._change_bits = 0
    self._change_byte_count = 0
    self._local_api_key = ""
    self._local_api_provider = xrpa.llm_hub_types.ApiProvider.MetaGenProxy
    self._local_model_size = xrpa.llm_hub_types.ModelSizeHint.Small
    self._local_sys_prompt = ""
    self._local_temperature = 0.7
    self._local_max_tokens = 256
    self._local_max_consecutive_tool_calls = 20
    self._local_conversation_starter = ""
    self._local_mcp_server_set = xrpa_runtime.utils.xrpa_types.ObjectUuid(0, 0)
    self._chat_message_message_handler = None

  def _handle_xrpa_fields_changed(self, fields_changed: int) -> None:
    if self._xrpa_fields_changed_handler is not None: self._xrpa_fields_changed_handler(fields_changed)

  def on_xrpa_fields_changed(self, handler: typing.Callable[[int], None]) -> None:
    self._xrpa_fields_changed_handler = handler

  def handle_xrpa_delete(self) -> None:
    if self._xrpa_delete_handler is not None: self._xrpa_delete_handler()

  def on_xrpa_delete(self, handler: typing.Callable[[], None]) -> None:
    self._xrpa_delete_handler = handler

  def get_is_processing(self) -> int:
    return self._local_is_processing

  def set_is_processing(self, is_processing: int) -> None:
    self._local_is_processing = is_processing
    if (self._change_bits & 128) == 0:
      self._change_bits |= 128
      self._change_byte_count += 4
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 128)

  def process_ds_update(self, value: LlmConversationReader, fields_changed: int) -> None:
    if value.check_api_key_changed(fields_changed):
      self._local_api_key = value.get_api_key()
    if value.check_api_provider_changed(fields_changed):
      self._local_api_provider = value.get_api_provider()
    if value.check_model_size_changed(fields_changed):
      self._local_model_size = value.get_model_size()
    if value.check_sys_prompt_changed(fields_changed):
      self._local_sys_prompt = value.get_sys_prompt()
    if value.check_temperature_changed(fields_changed):
      self._local_temperature = value.get_temperature()
    if value.check_max_tokens_changed(fields_changed):
      self._local_max_tokens = value.get_max_tokens()
    if value.check_max_consecutive_tool_calls_changed(fields_changed):
      self._local_max_consecutive_tool_calls = value.get_max_consecutive_tool_calls()
    if value.check_conversation_starter_changed(fields_changed):
      self._local_conversation_starter = value.get_conversation_starter()
    if value.check_mcp_server_set_changed(fields_changed):
      self._local_mcp_server_set = value.get_mcp_server_set()
    self._handle_xrpa_fields_changed(fields_changed)

  @staticmethod
  def create(id: xrpa_runtime.utils.xrpa_types.ObjectUuid, obj: LlmConversationReader, collection: xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection) -> "ReconciledLlmConversation":
    return ReconciledLlmConversation(id, collection)

  def get_api_key(self) -> str:
    return self._local_api_key

  def get_api_provider(self) -> xrpa.llm_hub_types.ApiProvider:
    return self._local_api_provider

  def get_model_size(self) -> xrpa.llm_hub_types.ModelSizeHint:
    return self._local_model_size

  def get_sys_prompt(self) -> str:
    return self._local_sys_prompt

  def get_temperature(self) -> float:
    return self._local_temperature

  def get_max_tokens(self) -> int:
    return self._local_max_tokens

  def get_max_consecutive_tool_calls(self) -> int:
    return self._local_max_consecutive_tool_calls

  def get_conversation_starter(self) -> str:
    return self._local_conversation_starter

  def get_mcp_server_set(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return self._local_mcp_server_set

  def check_api_key_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1) != 0

  def check_api_provider_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2) != 0

  def check_model_size_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 4) != 0

  def check_sys_prompt_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 8) != 0

  def check_temperature_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 16) != 0

  def check_max_tokens_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 32) != 0

  def check_max_consecutive_tool_calls_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 64) != 0

  def check_is_processing_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 128) != 0

  def check_conversation_starter_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 256) != 0

  def check_mcp_server_set_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 512) != 0

  def on_chat_message(self, handler: typing.Callable[[int, LlmChatMessageReader], None]) -> None:
    self._chat_message_message_handler = handler

  def send_chat_response(self, data: str, id: int) -> None:
    message = LlmChatResponseWriter(self._collection.send_message(
        self.get_xrpa_id(),
        11,
        xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(data) + 8))
    message.set_data(data)
    message.set_id(id)

  def send_chat_response_stream(self, data: str, id: int) -> None:
    message = LlmChatResponseWriter(self._collection.send_message(
        self.get_xrpa_id(),
        12,
        xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(data) + 8))
    message.set_data(data)
    message.set_id(id)

  def process_ds_message(self, message_type: int, msg_timestamp: int, message_data: xrpa_runtime.utils.memory_accessor.MemoryAccessor) -> None:
    if message_type == 10:
      if self._chat_message_message_handler is not None:
        message = LlmChatMessageReader(message_data)
        self._chat_message_message_handler(msg_timestamp, message)

  def write_ds_changes(self, accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor) -> None:
    if self._change_bits == 0:
      return
    obj_accessor = LlmConversationWriter.update(accessor, self.get_collection_id(), self.get_xrpa_id(), self._change_bits, self._change_byte_count)
    if obj_accessor is None or obj_accessor.is_null():
      return
    if (self._change_bits & 128) != 0:
      obj_accessor.set_is_processing(self._local_is_processing)
    self._change_bits = 0
    self._change_byte_count = 0
    self._has_notified_needs_write = False

  def prep_ds_full_update(self) -> int:
    self._change_bits = 128
    self._change_byte_count = 4
    return 1

# Object Collections
class InboundMcpServerSetReaderCollection(xrpa_runtime.reconciler.object_collection.ObjectCollection[McpServerSetReader, ReconciledMcpServerSet]):
  def __init__(self, reconciler: xrpa_runtime.reconciler.data_store_reconciler.DataStoreReconciler):
    super().__init__(McpServerSetReader, reconciler, 0, 0, 0, False)
    self._set_create_delegate_internal(ReconciledMcpServerSet.create)

  def set_create_delegate(self, create_delegate: typing.Callable[[xrpa_runtime.utils.xrpa_types.ObjectUuid, McpServerSetReader, xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection], ReconciledMcpServerSet]) -> None:
    self._set_create_delegate_internal(create_delegate)

class InboundMcpServerConfigReaderCollection(xrpa_runtime.reconciler.object_collection.ObjectCollection[McpServerConfigReader, ReconciledMcpServerConfig]):
  def __init__(self, reconciler: xrpa_runtime.reconciler.data_store_reconciler.DataStoreReconciler):
    super().__init__(McpServerConfigReader, reconciler, 1, 7, 4, False)
    self.server_set_index = xrpa_runtime.reconciler.object_collection_index.ObjectCollectionIndex[McpServerConfigReader, ReconciledMcpServerConfig, xrpa_runtime.utils.xrpa_types.ObjectUuid]()
    self._set_create_delegate_internal(ReconciledMcpServerConfig.create)

  def set_create_delegate(self, create_delegate: typing.Callable[[xrpa_runtime.utils.xrpa_types.ObjectUuid, McpServerConfigReader, xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection], ReconciledMcpServerConfig]) -> None:
    self._set_create_delegate_internal(create_delegate)

  def _index_notify_create(self, obj: ReconciledMcpServerConfig) -> None:
    self.server_set_index.on_create(obj, obj.get_server_set())

  def _index_notify_update(self, obj: ReconciledMcpServerConfig, fields_changed: int) -> None:
    if (fields_changed & 4) != 0:
      self.server_set_index.on_update(obj, obj.get_server_set())

  def _index_notify_delete(self, obj: ReconciledMcpServerConfig) -> None:
    self.server_set_index.on_delete(obj, obj.get_server_set())

class InboundLlmQueryReaderCollection(xrpa_runtime.reconciler.object_collection.ObjectCollection[LlmQueryReader, ReconciledLlmQuery]):
  def __init__(self, reconciler: xrpa_runtime.reconciler.data_store_reconciler.DataStoreReconciler):
    super().__init__(LlmQueryReader, reconciler, 2, 3967, 0, False)
    self._set_create_delegate_internal(ReconciledLlmQuery.create)

  def set_create_delegate(self, create_delegate: typing.Callable[[xrpa_runtime.utils.xrpa_types.ObjectUuid, LlmQueryReader, xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection], ReconciledLlmQuery]) -> None:
    self._set_create_delegate_internal(create_delegate)

class InboundLlmTriggeredQueryReaderCollection(xrpa_runtime.reconciler.object_collection.ObjectCollection[LlmTriggeredQueryReader, ReconciledLlmTriggeredQuery]):
  def __init__(self, reconciler: xrpa_runtime.reconciler.data_store_reconciler.DataStoreReconciler):
    super().__init__(LlmTriggeredQueryReader, reconciler, 3, 3967, 0, False)
    self._set_create_delegate_internal(ReconciledLlmTriggeredQuery.create)

  def set_create_delegate(self, create_delegate: typing.Callable[[xrpa_runtime.utils.xrpa_types.ObjectUuid, LlmTriggeredQueryReader, xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection], ReconciledLlmTriggeredQuery]) -> None:
    self._set_create_delegate_internal(create_delegate)

class InboundLlmConversationReaderCollection(xrpa_runtime.reconciler.object_collection.ObjectCollection[LlmConversationReader, ReconciledLlmConversation]):
  def __init__(self, reconciler: xrpa_runtime.reconciler.data_store_reconciler.DataStoreReconciler):
    super().__init__(LlmConversationReader, reconciler, 4, 895, 0, False)
    self._set_create_delegate_internal(ReconciledLlmConversation.create)

  def set_create_delegate(self, create_delegate: typing.Callable[[xrpa_runtime.utils.xrpa_types.ObjectUuid, LlmConversationReader, xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection], ReconciledLlmConversation]) -> None:
    self._set_create_delegate_internal(create_delegate)

# Data Store Implementation
class LlmHubDataStore(xrpa_runtime.reconciler.data_store_reconciler.DataStoreReconciler):
  def __init__(self, inbound_transport: xrpa_runtime.transport.transport_stream.TransportStream, outbound_transport: xrpa_runtime.transport.transport_stream.TransportStream):
    super().__init__(inbound_transport, outbound_transport, 388727552)
    self.McpServerSet = InboundMcpServerSetReaderCollection(self)
    self._register_collection(self.McpServerSet)
    self.McpServerConfig = InboundMcpServerConfigReaderCollection(self)
    self._register_collection(self.McpServerConfig)
    self.LlmQuery = InboundLlmQueryReaderCollection(self)
    self._register_collection(self.LlmQuery)
    self.LlmTriggeredQuery = InboundLlmTriggeredQueryReaderCollection(self)
    self._register_collection(self.LlmTriggeredQuery)
    self.LlmConversation = InboundLlmConversationReaderCollection(self)
    self._register_collection(self.LlmConversation)
