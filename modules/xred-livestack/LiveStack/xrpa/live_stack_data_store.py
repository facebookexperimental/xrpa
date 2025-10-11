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
import xrpa.live_stack_types
import xrpa_runtime.reconciler.collection_change_types
import xrpa_runtime.reconciler.data_store_interfaces
import xrpa_runtime.reconciler.data_store_reconciler
import xrpa_runtime.reconciler.object_collection
import xrpa_runtime.transport.transport_stream
import xrpa_runtime.transport.transport_stream_accessor
import xrpa_runtime.utils.memory_accessor
import xrpa_runtime.utils.time_utils
import xrpa_runtime.utils.xrpa_types

class LiveStackInstanceReader(xrpa_runtime.utils.xrpa_types.ObjectAccessorInterface):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._read_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  def get_ip_address(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  def get_port(self) -> int:
    return self._mem_accessor.read_int(self._read_offset)

  def get_subscribe_to_objects(self) -> bool:
    return (self._mem_accessor.read_int(self._read_offset) == 1)

  def get_subscribe_to_rooms(self) -> bool:
    return (self._mem_accessor.read_int(self._read_offset) == 1)

  def get_subscribe_to_doors(self) -> bool:
    return (self._mem_accessor.read_int(self._read_offset) == 1)

  def get_subscribe_to_hands(self) -> bool:
    return (self._mem_accessor.read_int(self._read_offset) == 1)

  def get_subscribe_to_eye_gaze(self) -> bool:
    return (self._mem_accessor.read_int(self._read_offset) == 1)

  def get_subscribe_to_body_poses(self) -> bool:
    return (self._mem_accessor.read_int(self._read_offset) == 1)

  def get_subscribe_to_anchors(self) -> bool:
    return (self._mem_accessor.read_int(self._read_offset) == 1)

  def get_connection_status(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  def get_last_heartbeat(self) -> int:
    return self._mem_accessor.read_ulong(self._read_offset)

  def get_server_version(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  def check_ip_address_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1) != 0

  def check_port_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2) != 0

  def check_subscribe_to_objects_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 4) != 0

  def check_subscribe_to_rooms_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 8) != 0

  def check_subscribe_to_doors_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 16) != 0

  def check_subscribe_to_hands_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 32) != 0

  def check_subscribe_to_eye_gaze_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 64) != 0

  def check_subscribe_to_body_poses_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 128) != 0

  def check_subscribe_to_anchors_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 256) != 0

  def check_connection_status_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 512) != 0

  def check_last_heartbeat_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1024) != 0

  def check_server_version_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2048) != 0

class LiveStackInstanceWriter(LiveStackInstanceReader):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._write_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  @staticmethod
  def create(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, change_byte_count: int, timestamp: int) -> "LiveStackInstanceWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.CreateObject.value, change_byte_count, timestamp)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    return LiveStackInstanceWriter(change_event.access_change_data())

  @staticmethod
  def update(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, fields_changed: int, change_byte_count: int) -> "LiveStackInstanceWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionUpdateChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.UpdateObject.value, change_byte_count)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    change_event.set_fields_changed(fields_changed)
    return LiveStackInstanceWriter(change_event.access_change_data())

  def set_ip_address(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

  def set_port(self, value: int) -> None:
    self._mem_accessor.write_int(value, self._write_offset)

  def set_subscribe_to_objects(self, value: bool) -> None:
    self._mem_accessor.write_int((1 if value is True else 0), self._write_offset)

  def set_subscribe_to_rooms(self, value: bool) -> None:
    self._mem_accessor.write_int((1 if value is True else 0), self._write_offset)

  def set_subscribe_to_doors(self, value: bool) -> None:
    self._mem_accessor.write_int((1 if value is True else 0), self._write_offset)

  def set_subscribe_to_hands(self, value: bool) -> None:
    self._mem_accessor.write_int((1 if value is True else 0), self._write_offset)

  def set_subscribe_to_eye_gaze(self, value: bool) -> None:
    self._mem_accessor.write_int((1 if value is True else 0), self._write_offset)

  def set_subscribe_to_body_poses(self, value: bool) -> None:
    self._mem_accessor.write_int((1 if value is True else 0), self._write_offset)

  def set_subscribe_to_anchors(self, value: bool) -> None:
    self._mem_accessor.write_int((1 if value is True else 0), self._write_offset)

  def set_connection_status(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

  def set_last_heartbeat(self, value: int) -> None:
    self._mem_accessor.write_ulong(value, self._write_offset)

  def set_server_version(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

class LiveStackAnchorReader(xrpa_runtime.utils.xrpa_types.ObjectAccessorInterface):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._read_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  def get_live_stack_instance(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return xrpa_runtime.utils.xrpa_types.ObjectUuid.read_value(self._mem_accessor, self._read_offset)

  def get_island_id(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  def get_pose_in_island(self) -> xrpa.live_stack_types.Pose:
    return xrpa.live_stack_types.DSPose.read_value(self._mem_accessor, self._read_offset)

  def get_gravity_direction(self) -> xrpa.live_stack_types.UnitVector3:
    return xrpa.live_stack_types.DSUnitVector3.read_value(self._mem_accessor, self._read_offset)

  def get_last_update_timestamp(self) -> int:
    return self._mem_accessor.read_ulong(self._read_offset)

  def check_live_stack_instance_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1) != 0

  def check_island_id_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2) != 0

  def check_pose_in_island_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 4) != 0

  def check_gravity_direction_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 8) != 0

  def check_last_update_timestamp_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 16) != 0

class LiveStackAnchorWriter(LiveStackAnchorReader):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._write_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  @staticmethod
  def create(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, change_byte_count: int, timestamp: int) -> "LiveStackAnchorWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.CreateObject.value, change_byte_count, timestamp)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    return LiveStackAnchorWriter(change_event.access_change_data())

  @staticmethod
  def update(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, fields_changed: int, change_byte_count: int) -> "LiveStackAnchorWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionUpdateChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.UpdateObject.value, change_byte_count)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    change_event.set_fields_changed(fields_changed)
    return LiveStackAnchorWriter(change_event.access_change_data())

  def set_live_stack_instance(self, value: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    xrpa_runtime.utils.xrpa_types.ObjectUuid.write_value(value, self._mem_accessor, self._write_offset)

  def set_island_id(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

  def set_pose_in_island(self, value: xrpa.live_stack_types.Pose) -> None:
    xrpa.live_stack_types.DSPose.write_value(value, self._mem_accessor, self._write_offset)

  def set_gravity_direction(self, value: xrpa.live_stack_types.UnitVector3) -> None:
    xrpa.live_stack_types.DSUnitVector3.write_value(value, self._mem_accessor, self._write_offset)

  def set_last_update_timestamp(self, value: int) -> None:
    self._mem_accessor.write_ulong(value, self._write_offset)

class LiveStackRoomReader(xrpa_runtime.utils.xrpa_types.ObjectAccessorInterface):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._read_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  def get_live_stack_instance(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return xrpa_runtime.utils.xrpa_types.ObjectUuid.read_value(self._mem_accessor, self._read_offset)

  def get_live_stack_room_id(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  def get_floor_id(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  def get_anchor(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return xrpa_runtime.utils.xrpa_types.ObjectUuid.read_value(self._mem_accessor, self._read_offset)

  def get_pose(self) -> xrpa.live_stack_types.Pose:
    return xrpa.live_stack_types.DSPose.read_value(self._mem_accessor, self._read_offset)

  def get_floor_height(self) -> float:
    return xrpa.live_stack_types.DSDistance.read_value(self._mem_accessor, self._read_offset)

  def get_ceiling_height(self) -> float:
    return xrpa.live_stack_types.DSDistance.read_value(self._mem_accessor, self._read_offset)

  def get_polygon_vertices(self) -> typing.List[xrpa.live_stack_types.Vector3]:
    return xrpa.live_stack_types.DSVector3_64.read_value(self._mem_accessor, self._read_offset)

  def get_last_update_timestamp(self) -> int:
    return self._mem_accessor.read_ulong(self._read_offset)

  def check_live_stack_instance_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1) != 0

  def check_live_stack_room_id_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2) != 0

  def check_floor_id_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 4) != 0

  def check_anchor_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 8) != 0

  def check_pose_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 16) != 0

  def check_floor_height_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 32) != 0

  def check_ceiling_height_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 64) != 0

  def check_polygon_vertices_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 128) != 0

  def check_last_update_timestamp_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 256) != 0

class LiveStackRoomWriter(LiveStackRoomReader):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._write_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  @staticmethod
  def create(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, change_byte_count: int, timestamp: int) -> "LiveStackRoomWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.CreateObject.value, change_byte_count, timestamp)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    return LiveStackRoomWriter(change_event.access_change_data())

  @staticmethod
  def update(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, fields_changed: int, change_byte_count: int) -> "LiveStackRoomWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionUpdateChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.UpdateObject.value, change_byte_count)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    change_event.set_fields_changed(fields_changed)
    return LiveStackRoomWriter(change_event.access_change_data())

  def set_live_stack_instance(self, value: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    xrpa_runtime.utils.xrpa_types.ObjectUuid.write_value(value, self._mem_accessor, self._write_offset)

  def set_live_stack_room_id(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

  def set_floor_id(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

  def set_anchor(self, value: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    xrpa_runtime.utils.xrpa_types.ObjectUuid.write_value(value, self._mem_accessor, self._write_offset)

  def set_pose(self, value: xrpa.live_stack_types.Pose) -> None:
    xrpa.live_stack_types.DSPose.write_value(value, self._mem_accessor, self._write_offset)

  def set_floor_height(self, value: float) -> None:
    xrpa.live_stack_types.DSDistance.write_value(value, self._mem_accessor, self._write_offset)

  def set_ceiling_height(self, value: float) -> None:
    xrpa.live_stack_types.DSDistance.write_value(value, self._mem_accessor, self._write_offset)

  def set_polygon_vertices(self, value: typing.List[xrpa.live_stack_types.Vector3]) -> None:
    xrpa.live_stack_types.DSVector3_64.write_value(value, self._mem_accessor, self._write_offset)

  def set_last_update_timestamp(self, value: int) -> None:
    self._mem_accessor.write_ulong(value, self._write_offset)

class LiveStackObjectReader(xrpa_runtime.utils.xrpa_types.ObjectAccessorInterface):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._read_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  def get_live_stack_instance(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return xrpa_runtime.utils.xrpa_types.ObjectUuid.read_value(self._mem_accessor, self._read_offset)

  def get_live_stack_uuid(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  def get_label(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  def get_category(self) -> int:
    return self._mem_accessor.read_int(self._read_offset)

  def get_pose(self) -> xrpa.live_stack_types.Pose:
    return xrpa.live_stack_types.DSPose.read_value(self._mem_accessor, self._read_offset)

  def get_size(self) -> xrpa.live_stack_types.Distance3:
    return xrpa.live_stack_types.DSDistance3.read_value(self._mem_accessor, self._read_offset)

  def get_anchor(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return xrpa_runtime.utils.xrpa_types.ObjectUuid.read_value(self._mem_accessor, self._read_offset)

  def get_room(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return xrpa_runtime.utils.xrpa_types.ObjectUuid.read_value(self._mem_accessor, self._read_offset)

  def get_num_inlier_points(self) -> int:
    return self._mem_accessor.read_int(self._read_offset)

  def get_last_update_timestamp(self) -> int:
    return self._mem_accessor.read_ulong(self._read_offset)

  def check_live_stack_instance_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1) != 0

  def check_live_stack_uuid_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2) != 0

  def check_label_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 4) != 0

  def check_category_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 8) != 0

  def check_pose_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 16) != 0

  def check_size_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 32) != 0

  def check_anchor_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 64) != 0

  def check_room_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 128) != 0

  def check_num_inlier_points_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 256) != 0

  def check_last_update_timestamp_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 512) != 0

class LiveStackObjectWriter(LiveStackObjectReader):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._write_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  @staticmethod
  def create(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, change_byte_count: int, timestamp: int) -> "LiveStackObjectWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.CreateObject.value, change_byte_count, timestamp)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    return LiveStackObjectWriter(change_event.access_change_data())

  @staticmethod
  def update(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, fields_changed: int, change_byte_count: int) -> "LiveStackObjectWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionUpdateChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.UpdateObject.value, change_byte_count)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    change_event.set_fields_changed(fields_changed)
    return LiveStackObjectWriter(change_event.access_change_data())

  def set_live_stack_instance(self, value: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    xrpa_runtime.utils.xrpa_types.ObjectUuid.write_value(value, self._mem_accessor, self._write_offset)

  def set_live_stack_uuid(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

  def set_label(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

  def set_category(self, value: int) -> None:
    self._mem_accessor.write_int(value, self._write_offset)

  def set_pose(self, value: xrpa.live_stack_types.Pose) -> None:
    xrpa.live_stack_types.DSPose.write_value(value, self._mem_accessor, self._write_offset)

  def set_size(self, value: xrpa.live_stack_types.Distance3) -> None:
    xrpa.live_stack_types.DSDistance3.write_value(value, self._mem_accessor, self._write_offset)

  def set_anchor(self, value: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    xrpa_runtime.utils.xrpa_types.ObjectUuid.write_value(value, self._mem_accessor, self._write_offset)

  def set_room(self, value: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    xrpa_runtime.utils.xrpa_types.ObjectUuid.write_value(value, self._mem_accessor, self._write_offset)

  def set_num_inlier_points(self, value: int) -> None:
    self._mem_accessor.write_int(value, self._write_offset)

  def set_last_update_timestamp(self, value: int) -> None:
    self._mem_accessor.write_ulong(value, self._write_offset)

class LiveStackDoorReader(xrpa_runtime.utils.xrpa_types.ObjectAccessorInterface):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._read_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  def get_live_stack_instance(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return xrpa_runtime.utils.xrpa_types.ObjectUuid.read_value(self._mem_accessor, self._read_offset)

  def get_live_stack_door_id(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  def get_front_room(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return xrpa_runtime.utils.xrpa_types.ObjectUuid.read_value(self._mem_accessor, self._read_offset)

  def get_back_room(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return xrpa_runtime.utils.xrpa_types.ObjectUuid.read_value(self._mem_accessor, self._read_offset)

  def get_anchor(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return xrpa_runtime.utils.xrpa_types.ObjectUuid.read_value(self._mem_accessor, self._read_offset)

  def get_pose(self) -> xrpa.live_stack_types.Pose:
    return xrpa.live_stack_types.DSPose.read_value(self._mem_accessor, self._read_offset)

  def get_width(self) -> float:
    return xrpa.live_stack_types.DSDistance.read_value(self._mem_accessor, self._read_offset)

  def get_height(self) -> float:
    return xrpa.live_stack_types.DSDistance.read_value(self._mem_accessor, self._read_offset)

  def get_last_update_timestamp(self) -> int:
    return self._mem_accessor.read_ulong(self._read_offset)

  def check_live_stack_instance_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1) != 0

  def check_live_stack_door_id_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2) != 0

  def check_front_room_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 4) != 0

  def check_back_room_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 8) != 0

  def check_anchor_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 16) != 0

  def check_pose_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 32) != 0

  def check_width_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 64) != 0

  def check_height_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 128) != 0

  def check_last_update_timestamp_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 256) != 0

class LiveStackDoorWriter(LiveStackDoorReader):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._write_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  @staticmethod
  def create(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, change_byte_count: int, timestamp: int) -> "LiveStackDoorWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.CreateObject.value, change_byte_count, timestamp)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    return LiveStackDoorWriter(change_event.access_change_data())

  @staticmethod
  def update(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, fields_changed: int, change_byte_count: int) -> "LiveStackDoorWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionUpdateChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.UpdateObject.value, change_byte_count)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    change_event.set_fields_changed(fields_changed)
    return LiveStackDoorWriter(change_event.access_change_data())

  def set_live_stack_instance(self, value: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    xrpa_runtime.utils.xrpa_types.ObjectUuid.write_value(value, self._mem_accessor, self._write_offset)

  def set_live_stack_door_id(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

  def set_front_room(self, value: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    xrpa_runtime.utils.xrpa_types.ObjectUuid.write_value(value, self._mem_accessor, self._write_offset)

  def set_back_room(self, value: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    xrpa_runtime.utils.xrpa_types.ObjectUuid.write_value(value, self._mem_accessor, self._write_offset)

  def set_anchor(self, value: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    xrpa_runtime.utils.xrpa_types.ObjectUuid.write_value(value, self._mem_accessor, self._write_offset)

  def set_pose(self, value: xrpa.live_stack_types.Pose) -> None:
    xrpa.live_stack_types.DSPose.write_value(value, self._mem_accessor, self._write_offset)

  def set_width(self, value: float) -> None:
    xrpa.live_stack_types.DSDistance.write_value(value, self._mem_accessor, self._write_offset)

  def set_height(self, value: float) -> None:
    xrpa.live_stack_types.DSDistance.write_value(value, self._mem_accessor, self._write_offset)

  def set_last_update_timestamp(self, value: int) -> None:
    self._mem_accessor.write_ulong(value, self._write_offset)

class LiveStackBodyPoseReader(xrpa_runtime.utils.xrpa_types.ObjectAccessorInterface):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._read_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  def get_live_stack_instance(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return xrpa_runtime.utils.xrpa_types.ObjectUuid.read_value(self._mem_accessor, self._read_offset)

  def get_live_stack_person_id(self) -> int:
    return self._mem_accessor.read_int(self._read_offset)

  def get_live_stack_human_uuid(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  def get_anchor(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return xrpa_runtime.utils.xrpa_types.ObjectUuid.read_value(self._mem_accessor, self._read_offset)

  def get_root_pose(self) -> xrpa.live_stack_types.Pose:
    return xrpa.live_stack_types.DSPose.read_value(self._mem_accessor, self._read_offset)

  def get_joint_poses(self) -> typing.List[xrpa.live_stack_types.Pose]:
    return xrpa.live_stack_types.DSPose_24.read_value(self._mem_accessor, self._read_offset)

  def get_last_update_timestamp(self) -> int:
    return self._mem_accessor.read_ulong(self._read_offset)

  def check_live_stack_instance_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1) != 0

  def check_live_stack_person_id_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2) != 0

  def check_live_stack_human_uuid_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 4) != 0

  def check_anchor_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 8) != 0

  def check_root_pose_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 16) != 0

  def check_joint_poses_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 32) != 0

  def check_last_update_timestamp_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 64) != 0

class LiveStackBodyPoseWriter(LiveStackBodyPoseReader):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._write_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  @staticmethod
  def create(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, change_byte_count: int, timestamp: int) -> "LiveStackBodyPoseWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.CreateObject.value, change_byte_count, timestamp)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    return LiveStackBodyPoseWriter(change_event.access_change_data())

  @staticmethod
  def update(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, fields_changed: int, change_byte_count: int) -> "LiveStackBodyPoseWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionUpdateChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.UpdateObject.value, change_byte_count)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    change_event.set_fields_changed(fields_changed)
    return LiveStackBodyPoseWriter(change_event.access_change_data())

  def set_live_stack_instance(self, value: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    xrpa_runtime.utils.xrpa_types.ObjectUuid.write_value(value, self._mem_accessor, self._write_offset)

  def set_live_stack_person_id(self, value: int) -> None:
    self._mem_accessor.write_int(value, self._write_offset)

  def set_live_stack_human_uuid(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

  def set_anchor(self, value: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    xrpa_runtime.utils.xrpa_types.ObjectUuid.write_value(value, self._mem_accessor, self._write_offset)

  def set_root_pose(self, value: xrpa.live_stack_types.Pose) -> None:
    xrpa.live_stack_types.DSPose.write_value(value, self._mem_accessor, self._write_offset)

  def set_joint_poses(self, value: typing.List[xrpa.live_stack_types.Pose]) -> None:
    xrpa.live_stack_types.DSPose_24.write_value(value, self._mem_accessor, self._write_offset)

  def set_last_update_timestamp(self, value: int) -> None:
    self._mem_accessor.write_ulong(value, self._write_offset)

class LiveStackHandsReader(xrpa_runtime.utils.xrpa_types.ObjectAccessorInterface):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._read_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  def get_live_stack_instance(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return xrpa_runtime.utils.xrpa_types.ObjectUuid.read_value(self._mem_accessor, self._read_offset)

  def get_anchor(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return xrpa_runtime.utils.xrpa_types.ObjectUuid.read_value(self._mem_accessor, self._read_offset)

  def get_is_left_hand_tracked(self) -> bool:
    return (self._mem_accessor.read_int(self._read_offset) == 1)

  def get_is_right_hand_tracked(self) -> bool:
    return (self._mem_accessor.read_int(self._read_offset) == 1)

  def get_left_hand_landmarks(self) -> typing.List[xrpa.live_stack_types.Vector3]:
    return xrpa.live_stack_types.DSVector3_21.read_value(self._mem_accessor, self._read_offset)

  def get_right_hand_landmarks(self) -> typing.List[xrpa.live_stack_types.Vector3]:
    return xrpa.live_stack_types.DSVector3_21.read_value(self._mem_accessor, self._read_offset)

  def get_last_update_timestamp(self) -> int:
    return self._mem_accessor.read_ulong(self._read_offset)

  def check_live_stack_instance_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1) != 0

  def check_anchor_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2) != 0

  def check_is_left_hand_tracked_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 4) != 0

  def check_is_right_hand_tracked_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 8) != 0

  def check_left_hand_landmarks_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 16) != 0

  def check_right_hand_landmarks_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 32) != 0

  def check_last_update_timestamp_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 64) != 0

class LiveStackHandsWriter(LiveStackHandsReader):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._write_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  @staticmethod
  def create(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, change_byte_count: int, timestamp: int) -> "LiveStackHandsWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.CreateObject.value, change_byte_count, timestamp)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    return LiveStackHandsWriter(change_event.access_change_data())

  @staticmethod
  def update(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, fields_changed: int, change_byte_count: int) -> "LiveStackHandsWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionUpdateChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.UpdateObject.value, change_byte_count)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    change_event.set_fields_changed(fields_changed)
    return LiveStackHandsWriter(change_event.access_change_data())

  def set_live_stack_instance(self, value: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    xrpa_runtime.utils.xrpa_types.ObjectUuid.write_value(value, self._mem_accessor, self._write_offset)

  def set_anchor(self, value: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    xrpa_runtime.utils.xrpa_types.ObjectUuid.write_value(value, self._mem_accessor, self._write_offset)

  def set_is_left_hand_tracked(self, value: bool) -> None:
    self._mem_accessor.write_int((1 if value is True else 0), self._write_offset)

  def set_is_right_hand_tracked(self, value: bool) -> None:
    self._mem_accessor.write_int((1 if value is True else 0), self._write_offset)

  def set_left_hand_landmarks(self, value: typing.List[xrpa.live_stack_types.Vector3]) -> None:
    xrpa.live_stack_types.DSVector3_21.write_value(value, self._mem_accessor, self._write_offset)

  def set_right_hand_landmarks(self, value: typing.List[xrpa.live_stack_types.Vector3]) -> None:
    xrpa.live_stack_types.DSVector3_21.write_value(value, self._mem_accessor, self._write_offset)

  def set_last_update_timestamp(self, value: int) -> None:
    self._mem_accessor.write_ulong(value, self._write_offset)

class LiveStackEyeGazeReader(xrpa_runtime.utils.xrpa_types.ObjectAccessorInterface):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._read_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  def get_live_stack_instance(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return xrpa_runtime.utils.xrpa_types.ObjectUuid.read_value(self._mem_accessor, self._read_offset)

  def get_anchor(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return xrpa_runtime.utils.xrpa_types.ObjectUuid.read_value(self._mem_accessor, self._read_offset)

  def get_gaze_origin(self) -> xrpa.live_stack_types.Vector3:
    return xrpa.live_stack_types.DSVector3.read_value(self._mem_accessor, self._read_offset)

  def get_gaze_direction(self) -> xrpa.live_stack_types.UnitVector3:
    return xrpa.live_stack_types.DSUnitVector3.read_value(self._mem_accessor, self._read_offset)

  def get_last_update_timestamp(self) -> int:
    return self._mem_accessor.read_ulong(self._read_offset)

  def check_live_stack_instance_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1) != 0

  def check_anchor_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2) != 0

  def check_gaze_origin_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 4) != 0

  def check_gaze_direction_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 8) != 0

  def check_last_update_timestamp_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 16) != 0

class LiveStackEyeGazeWriter(LiveStackEyeGazeReader):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._write_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  @staticmethod
  def create(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, change_byte_count: int, timestamp: int) -> "LiveStackEyeGazeWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.CreateObject.value, change_byte_count, timestamp)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    return LiveStackEyeGazeWriter(change_event.access_change_data())

  @staticmethod
  def update(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, fields_changed: int, change_byte_count: int) -> "LiveStackEyeGazeWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionUpdateChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.UpdateObject.value, change_byte_count)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    change_event.set_fields_changed(fields_changed)
    return LiveStackEyeGazeWriter(change_event.access_change_data())

  def set_live_stack_instance(self, value: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    xrpa_runtime.utils.xrpa_types.ObjectUuid.write_value(value, self._mem_accessor, self._write_offset)

  def set_anchor(self, value: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    xrpa_runtime.utils.xrpa_types.ObjectUuid.write_value(value, self._mem_accessor, self._write_offset)

  def set_gaze_origin(self, value: xrpa.live_stack_types.Vector3) -> None:
    xrpa.live_stack_types.DSVector3.write_value(value, self._mem_accessor, self._write_offset)

  def set_gaze_direction(self, value: xrpa.live_stack_types.UnitVector3) -> None:
    xrpa.live_stack_types.DSUnitVector3.write_value(value, self._mem_accessor, self._write_offset)

  def set_last_update_timestamp(self, value: int) -> None:
    self._mem_accessor.write_ulong(value, self._write_offset)

# Reconciled Types
class OutboundLiveStackAnchor(xrpa_runtime.reconciler.data_store_interfaces.DataStoreObject, xrpa_runtime.reconciler.data_store_interfaces.IDataStoreObjectAccessor[LiveStackAnchorReader]):
  def __init__(self, id: xrpa_runtime.utils.xrpa_types.ObjectUuid):
    super().__init__(id, None)
    self._create_timestamp = xrpa_runtime.utils.time_utils.TimeUtils.get_current_clock_time_microseconds()
    self._xrpa_fields_changed_handler = None
    self._local_live_stack_instance = xrpa_runtime.utils.xrpa_types.ObjectUuid(0, 0)
    self._local_island_id = ""
    self._local_pose_in_island = xrpa.live_stack_types.Pose(xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Quaternion(0, 0, 0, 1))
    self._local_gravity_direction = xrpa.live_stack_types.UnitVector3(0, 0, 1)
    self._local_last_update_timestamp = 0
    self._change_bits = 0
    self._change_byte_count = 0
    self._create_written = False

  def _handle_xrpa_fields_changed(self, fields_changed: int) -> None:
    if self._xrpa_fields_changed_handler is not None: self._xrpa_fields_changed_handler(fields_changed)

  def on_xrpa_fields_changed(self, handler: typing.Callable[[int], None]) -> None:
    self._xrpa_fields_changed_handler = handler

  def get_live_stack_instance(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return self._local_live_stack_instance

  def set_live_stack_instance(self, live_stack_instance: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    self._local_live_stack_instance = live_stack_instance
    if (self._change_bits & 1) == 0:
      self._change_bits |= 1
      self._change_byte_count += 16
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 1)

  def get_island_id(self) -> str:
    return self._local_island_id

  def set_island_id(self, island_id: str) -> None:
    self._local_island_id = island_id
    if (self._change_bits & 2) == 0:
      self._change_bits |= 2
      self._change_byte_count += 4
    self._change_byte_count += xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_island_id)
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 2)

  def get_pose_in_island(self) -> xrpa.live_stack_types.Pose:
    return self._local_pose_in_island

  def set_pose_in_island(self, pose_in_island: xrpa.live_stack_types.Pose) -> None:
    self._local_pose_in_island = pose_in_island
    if (self._change_bits & 4) == 0:
      self._change_bits |= 4
      self._change_byte_count += 28
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 4)

  def get_gravity_direction(self) -> xrpa.live_stack_types.UnitVector3:
    return self._local_gravity_direction

  def set_gravity_direction(self, gravity_direction: xrpa.live_stack_types.UnitVector3) -> None:
    self._local_gravity_direction = gravity_direction
    if (self._change_bits & 8) == 0:
      self._change_bits |= 8
      self._change_byte_count += 12
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 8)

  def get_last_update_timestamp(self) -> int:
    return self._local_last_update_timestamp

  def set_last_update_timestamp(self) -> None:
    self._local_last_update_timestamp = xrpa_runtime.utils.time_utils.TimeUtils.get_current_clock_time_microseconds();
    if (self._change_bits & 16) == 0:
      self._change_bits |= 16
      self._change_byte_count += 8
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 16)

  def clear_last_update_timestamp(self) -> None:
    clear_value: int = 0;
    if self._local_last_update_timestamp != clear_value:
      self._local_last_update_timestamp = clear_value
      if (self._change_bits & 16) == 0:
        self._change_bits |= 16
        self._change_byte_count += 8
      if self._collection is not None:
        if not self._has_notified_needs_write:
          self._collection.notify_object_needs_write(self.get_xrpa_id())
          self._has_notified_needs_write = True
        self._collection.set_dirty(self.get_xrpa_id(), 16)

  def write_ds_changes(self, accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor) -> None:
    obj_accessor = None
    if not self._create_written:
      self._change_bits = 31
      self._change_byte_count = xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_island_id) + 68
      obj_accessor = LiveStackAnchorWriter.create(accessor, self.get_collection_id(), self.get_xrpa_id(), self._change_byte_count, self._create_timestamp)
      self._create_written = True
    elif self._change_bits != 0:
      obj_accessor = LiveStackAnchorWriter.update(accessor, self.get_collection_id(), self.get_xrpa_id(), self._change_bits, self._change_byte_count)
    if obj_accessor is None or obj_accessor.is_null():
      return
    if (self._change_bits & 1) != 0:
      obj_accessor.set_live_stack_instance(self._local_live_stack_instance)
    if (self._change_bits & 2) != 0:
      obj_accessor.set_island_id(self._local_island_id)
    if (self._change_bits & 4) != 0:
      obj_accessor.set_pose_in_island(self._local_pose_in_island)
    if (self._change_bits & 8) != 0:
      obj_accessor.set_gravity_direction(self._local_gravity_direction)
    if (self._change_bits & 16) != 0:
      obj_accessor.set_last_update_timestamp(self._local_last_update_timestamp)
    self._change_bits = 0
    self._change_byte_count = 0
    self._has_notified_needs_write = False

  def prep_ds_full_update(self) -> int:
    self._create_written = False
    self._change_bits = 31
    self._change_byte_count = xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_island_id) + 68
    return self._create_timestamp

  def process_ds_update(self, value: LiveStackAnchorReader, fields_changed: int) -> None:
    self._handle_xrpa_fields_changed(fields_changed)

  def check_live_stack_instance_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1) != 0

  def check_island_id_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2) != 0

  def check_pose_in_island_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 4) != 0

  def check_gravity_direction_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 8) != 0

  def check_last_update_timestamp_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 16) != 0

  def process_ds_message(self, message_type: int, msg_timestamp: int, message_data: xrpa_runtime.utils.memory_accessor.MemoryAccessor) -> None:
    pass

class OutboundLiveStackRoom(xrpa_runtime.reconciler.data_store_interfaces.DataStoreObject, xrpa_runtime.reconciler.data_store_interfaces.IDataStoreObjectAccessor[LiveStackRoomReader]):
  def __init__(self, id: xrpa_runtime.utils.xrpa_types.ObjectUuid):
    super().__init__(id, None)
    self._create_timestamp = xrpa_runtime.utils.time_utils.TimeUtils.get_current_clock_time_microseconds()
    self._xrpa_fields_changed_handler = None
    self._local_live_stack_instance = xrpa_runtime.utils.xrpa_types.ObjectUuid(0, 0)
    self._local_live_stack_room_id = ""
    self._local_floor_id = ""
    self._local_anchor = xrpa_runtime.utils.xrpa_types.ObjectUuid(0, 0)
    self._local_pose = xrpa.live_stack_types.Pose(xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Quaternion(0, 0, 0, 1))
    self._local_floor_height = 0
    self._local_ceiling_height = 0
    self._local_polygon_vertices = [xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0)]
    self._local_last_update_timestamp = 0
    self._change_bits = 0
    self._change_byte_count = 0
    self._create_written = False

  def _handle_xrpa_fields_changed(self, fields_changed: int) -> None:
    if self._xrpa_fields_changed_handler is not None: self._xrpa_fields_changed_handler(fields_changed)

  def on_xrpa_fields_changed(self, handler: typing.Callable[[int], None]) -> None:
    self._xrpa_fields_changed_handler = handler

  def get_live_stack_instance(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return self._local_live_stack_instance

  def set_live_stack_instance(self, live_stack_instance: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    self._local_live_stack_instance = live_stack_instance
    if (self._change_bits & 1) == 0:
      self._change_bits |= 1
      self._change_byte_count += 16
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 1)

  def get_live_stack_room_id(self) -> str:
    return self._local_live_stack_room_id

  def set_live_stack_room_id(self, live_stack_room_id: str) -> None:
    self._local_live_stack_room_id = live_stack_room_id
    if (self._change_bits & 2) == 0:
      self._change_bits |= 2
      self._change_byte_count += 4
    self._change_byte_count += xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_live_stack_room_id)
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 2)

  def get_floor_id(self) -> str:
    return self._local_floor_id

  def set_floor_id(self, floor_id: str) -> None:
    self._local_floor_id = floor_id
    if (self._change_bits & 4) == 0:
      self._change_bits |= 4
      self._change_byte_count += 4
    self._change_byte_count += xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_floor_id)
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 4)

  def get_anchor(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return self._local_anchor

  def set_anchor(self, anchor: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    self._local_anchor = anchor
    if (self._change_bits & 8) == 0:
      self._change_bits |= 8
      self._change_byte_count += 16
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 8)

  def get_pose(self) -> xrpa.live_stack_types.Pose:
    return self._local_pose

  def set_pose(self, pose: xrpa.live_stack_types.Pose) -> None:
    self._local_pose = pose
    if (self._change_bits & 16) == 0:
      self._change_bits |= 16
      self._change_byte_count += 28
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 16)

  def get_floor_height(self) -> float:
    return self._local_floor_height

  def set_floor_height(self, floor_height: float) -> None:
    self._local_floor_height = floor_height
    if (self._change_bits & 32) == 0:
      self._change_bits |= 32
      self._change_byte_count += 4
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 32)

  def get_ceiling_height(self) -> float:
    return self._local_ceiling_height

  def set_ceiling_height(self, ceiling_height: float) -> None:
    self._local_ceiling_height = ceiling_height
    if (self._change_bits & 64) == 0:
      self._change_bits |= 64
      self._change_byte_count += 4
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 64)

  def get_polygon_vertices(self) -> typing.List[xrpa.live_stack_types.Vector3]:
    return self._local_polygon_vertices

  def set_polygon_vertices(self, polygon_vertices: typing.List[xrpa.live_stack_types.Vector3]) -> None:
    self._local_polygon_vertices = polygon_vertices
    if (self._change_bits & 128) == 0:
      self._change_bits |= 128
      self._change_byte_count += 768
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 128)

  def get_last_update_timestamp(self) -> int:
    return self._local_last_update_timestamp

  def set_last_update_timestamp(self) -> None:
    self._local_last_update_timestamp = xrpa_runtime.utils.time_utils.TimeUtils.get_current_clock_time_microseconds();
    if (self._change_bits & 256) == 0:
      self._change_bits |= 256
      self._change_byte_count += 8
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 256)

  def clear_last_update_timestamp(self) -> None:
    clear_value: int = 0;
    if self._local_last_update_timestamp != clear_value:
      self._local_last_update_timestamp = clear_value
      if (self._change_bits & 256) == 0:
        self._change_bits |= 256
        self._change_byte_count += 8
      if self._collection is not None:
        if not self._has_notified_needs_write:
          self._collection.notify_object_needs_write(self.get_xrpa_id())
          self._has_notified_needs_write = True
        self._collection.set_dirty(self.get_xrpa_id(), 256)

  def write_ds_changes(self, accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor) -> None:
    obj_accessor = None
    if not self._create_written:
      self._change_bits = 511
      self._change_byte_count = xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_live_stack_room_id) + xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_floor_id) + 852
      obj_accessor = LiveStackRoomWriter.create(accessor, self.get_collection_id(), self.get_xrpa_id(), self._change_byte_count, self._create_timestamp)
      self._create_written = True
    elif self._change_bits != 0:
      obj_accessor = LiveStackRoomWriter.update(accessor, self.get_collection_id(), self.get_xrpa_id(), self._change_bits, self._change_byte_count)
    if obj_accessor is None or obj_accessor.is_null():
      return
    if (self._change_bits & 1) != 0:
      obj_accessor.set_live_stack_instance(self._local_live_stack_instance)
    if (self._change_bits & 2) != 0:
      obj_accessor.set_live_stack_room_id(self._local_live_stack_room_id)
    if (self._change_bits & 4) != 0:
      obj_accessor.set_floor_id(self._local_floor_id)
    if (self._change_bits & 8) != 0:
      obj_accessor.set_anchor(self._local_anchor)
    if (self._change_bits & 16) != 0:
      obj_accessor.set_pose(self._local_pose)
    if (self._change_bits & 32) != 0:
      obj_accessor.set_floor_height(self._local_floor_height)
    if (self._change_bits & 64) != 0:
      obj_accessor.set_ceiling_height(self._local_ceiling_height)
    if (self._change_bits & 128) != 0:
      obj_accessor.set_polygon_vertices(self._local_polygon_vertices)
    if (self._change_bits & 256) != 0:
      obj_accessor.set_last_update_timestamp(self._local_last_update_timestamp)
    self._change_bits = 0
    self._change_byte_count = 0
    self._has_notified_needs_write = False

  def prep_ds_full_update(self) -> int:
    self._create_written = False
    self._change_bits = 511
    self._change_byte_count = xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_live_stack_room_id) + xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_floor_id) + 852
    return self._create_timestamp

  def process_ds_update(self, value: LiveStackRoomReader, fields_changed: int) -> None:
    self._handle_xrpa_fields_changed(fields_changed)

  def check_live_stack_instance_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1) != 0

  def check_live_stack_room_id_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2) != 0

  def check_floor_id_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 4) != 0

  def check_anchor_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 8) != 0

  def check_pose_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 16) != 0

  def check_floor_height_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 32) != 0

  def check_ceiling_height_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 64) != 0

  def check_polygon_vertices_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 128) != 0

  def check_last_update_timestamp_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 256) != 0

  def process_ds_message(self, message_type: int, msg_timestamp: int, message_data: xrpa_runtime.utils.memory_accessor.MemoryAccessor) -> None:
    pass

class OutboundLiveStackObject(xrpa_runtime.reconciler.data_store_interfaces.DataStoreObject, xrpa_runtime.reconciler.data_store_interfaces.IDataStoreObjectAccessor[LiveStackObjectReader]):
  def __init__(self, id: xrpa_runtime.utils.xrpa_types.ObjectUuid):
    super().__init__(id, None)
    self._create_timestamp = xrpa_runtime.utils.time_utils.TimeUtils.get_current_clock_time_microseconds()
    self._xrpa_fields_changed_handler = None
    self._local_live_stack_instance = xrpa_runtime.utils.xrpa_types.ObjectUuid(0, 0)
    self._local_live_stack_uuid = ""
    self._local_label = ""
    self._local_category = 0
    self._local_pose = xrpa.live_stack_types.Pose(xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Quaternion(0, 0, 0, 1))
    self._local_size = xrpa.live_stack_types.Distance3(0, 0, 0)
    self._local_anchor = xrpa_runtime.utils.xrpa_types.ObjectUuid(0, 0)
    self._local_room = xrpa_runtime.utils.xrpa_types.ObjectUuid(0, 0)
    self._local_num_inlier_points = 0
    self._local_last_update_timestamp = 0
    self._change_bits = 0
    self._change_byte_count = 0
    self._create_written = False

  def _handle_xrpa_fields_changed(self, fields_changed: int) -> None:
    if self._xrpa_fields_changed_handler is not None: self._xrpa_fields_changed_handler(fields_changed)

  def on_xrpa_fields_changed(self, handler: typing.Callable[[int], None]) -> None:
    self._xrpa_fields_changed_handler = handler

  def get_live_stack_instance(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return self._local_live_stack_instance

  def set_live_stack_instance(self, live_stack_instance: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    self._local_live_stack_instance = live_stack_instance
    if (self._change_bits & 1) == 0:
      self._change_bits |= 1
      self._change_byte_count += 16
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 1)

  def get_live_stack_uuid(self) -> str:
    return self._local_live_stack_uuid

  def set_live_stack_uuid(self, live_stack_uuid: str) -> None:
    self._local_live_stack_uuid = live_stack_uuid
    if (self._change_bits & 2) == 0:
      self._change_bits |= 2
      self._change_byte_count += 4
    self._change_byte_count += xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_live_stack_uuid)
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 2)

  def get_label(self) -> str:
    return self._local_label

  def set_label(self, label: str) -> None:
    self._local_label = label
    if (self._change_bits & 4) == 0:
      self._change_bits |= 4
      self._change_byte_count += 4
    self._change_byte_count += xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_label)
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 4)

  def get_category(self) -> int:
    return self._local_category

  def set_category(self, category: int) -> None:
    self._local_category = category
    if (self._change_bits & 8) == 0:
      self._change_bits |= 8
      self._change_byte_count += 4
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 8)

  def get_pose(self) -> xrpa.live_stack_types.Pose:
    return self._local_pose

  def set_pose(self, pose: xrpa.live_stack_types.Pose) -> None:
    self._local_pose = pose
    if (self._change_bits & 16) == 0:
      self._change_bits |= 16
      self._change_byte_count += 28
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 16)

  def get_size(self) -> xrpa.live_stack_types.Distance3:
    return self._local_size

  def set_size(self, size: xrpa.live_stack_types.Distance3) -> None:
    self._local_size = size
    if (self._change_bits & 32) == 0:
      self._change_bits |= 32
      self._change_byte_count += 12
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 32)

  def get_anchor(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return self._local_anchor

  def set_anchor(self, anchor: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    self._local_anchor = anchor
    if (self._change_bits & 64) == 0:
      self._change_bits |= 64
      self._change_byte_count += 16
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 64)

  def get_room(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return self._local_room

  def set_room(self, room: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    self._local_room = room
    if (self._change_bits & 128) == 0:
      self._change_bits |= 128
      self._change_byte_count += 16
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 128)

  def get_num_inlier_points(self) -> int:
    return self._local_num_inlier_points

  def set_num_inlier_points(self, num_inlier_points: int) -> None:
    self._local_num_inlier_points = num_inlier_points
    if (self._change_bits & 256) == 0:
      self._change_bits |= 256
      self._change_byte_count += 4
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 256)

  def get_last_update_timestamp(self) -> int:
    return self._local_last_update_timestamp

  def set_last_update_timestamp(self) -> None:
    self._local_last_update_timestamp = xrpa_runtime.utils.time_utils.TimeUtils.get_current_clock_time_microseconds();
    if (self._change_bits & 512) == 0:
      self._change_bits |= 512
      self._change_byte_count += 8
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 512)

  def clear_last_update_timestamp(self) -> None:
    clear_value: int = 0;
    if self._local_last_update_timestamp != clear_value:
      self._local_last_update_timestamp = clear_value
      if (self._change_bits & 512) == 0:
        self._change_bits |= 512
        self._change_byte_count += 8
      if self._collection is not None:
        if not self._has_notified_needs_write:
          self._collection.notify_object_needs_write(self.get_xrpa_id())
          self._has_notified_needs_write = True
        self._collection.set_dirty(self.get_xrpa_id(), 512)

  def write_ds_changes(self, accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor) -> None:
    obj_accessor = None
    if not self._create_written:
      self._change_bits = 1023
      self._change_byte_count = xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_live_stack_uuid) + xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_label) + 112
      obj_accessor = LiveStackObjectWriter.create(accessor, self.get_collection_id(), self.get_xrpa_id(), self._change_byte_count, self._create_timestamp)
      self._create_written = True
    elif self._change_bits != 0:
      obj_accessor = LiveStackObjectWriter.update(accessor, self.get_collection_id(), self.get_xrpa_id(), self._change_bits, self._change_byte_count)
    if obj_accessor is None or obj_accessor.is_null():
      return
    if (self._change_bits & 1) != 0:
      obj_accessor.set_live_stack_instance(self._local_live_stack_instance)
    if (self._change_bits & 2) != 0:
      obj_accessor.set_live_stack_uuid(self._local_live_stack_uuid)
    if (self._change_bits & 4) != 0:
      obj_accessor.set_label(self._local_label)
    if (self._change_bits & 8) != 0:
      obj_accessor.set_category(self._local_category)
    if (self._change_bits & 16) != 0:
      obj_accessor.set_pose(self._local_pose)
    if (self._change_bits & 32) != 0:
      obj_accessor.set_size(self._local_size)
    if (self._change_bits & 64) != 0:
      obj_accessor.set_anchor(self._local_anchor)
    if (self._change_bits & 128) != 0:
      obj_accessor.set_room(self._local_room)
    if (self._change_bits & 256) != 0:
      obj_accessor.set_num_inlier_points(self._local_num_inlier_points)
    if (self._change_bits & 512) != 0:
      obj_accessor.set_last_update_timestamp(self._local_last_update_timestamp)
    self._change_bits = 0
    self._change_byte_count = 0
    self._has_notified_needs_write = False

  def prep_ds_full_update(self) -> int:
    self._create_written = False
    self._change_bits = 1023
    self._change_byte_count = xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_live_stack_uuid) + xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_label) + 112
    return self._create_timestamp

  def process_ds_update(self, value: LiveStackObjectReader, fields_changed: int) -> None:
    self._handle_xrpa_fields_changed(fields_changed)

  def check_live_stack_instance_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1) != 0

  def check_live_stack_uuid_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2) != 0

  def check_label_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 4) != 0

  def check_category_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 8) != 0

  def check_pose_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 16) != 0

  def check_size_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 32) != 0

  def check_anchor_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 64) != 0

  def check_room_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 128) != 0

  def check_num_inlier_points_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 256) != 0

  def check_last_update_timestamp_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 512) != 0

  def process_ds_message(self, message_type: int, msg_timestamp: int, message_data: xrpa_runtime.utils.memory_accessor.MemoryAccessor) -> None:
    pass

class OutboundLiveStackDoor(xrpa_runtime.reconciler.data_store_interfaces.DataStoreObject, xrpa_runtime.reconciler.data_store_interfaces.IDataStoreObjectAccessor[LiveStackDoorReader]):
  def __init__(self, id: xrpa_runtime.utils.xrpa_types.ObjectUuid):
    super().__init__(id, None)
    self._create_timestamp = xrpa_runtime.utils.time_utils.TimeUtils.get_current_clock_time_microseconds()
    self._xrpa_fields_changed_handler = None
    self._local_live_stack_instance = xrpa_runtime.utils.xrpa_types.ObjectUuid(0, 0)
    self._local_live_stack_door_id = ""
    self._local_front_room = xrpa_runtime.utils.xrpa_types.ObjectUuid(0, 0)
    self._local_back_room = xrpa_runtime.utils.xrpa_types.ObjectUuid(0, 0)
    self._local_anchor = xrpa_runtime.utils.xrpa_types.ObjectUuid(0, 0)
    self._local_pose = xrpa.live_stack_types.Pose(xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Quaternion(0, 0, 0, 1))
    self._local_width = 0
    self._local_height = 0
    self._local_last_update_timestamp = 0
    self._change_bits = 0
    self._change_byte_count = 0
    self._create_written = False

  def _handle_xrpa_fields_changed(self, fields_changed: int) -> None:
    if self._xrpa_fields_changed_handler is not None: self._xrpa_fields_changed_handler(fields_changed)

  def on_xrpa_fields_changed(self, handler: typing.Callable[[int], None]) -> None:
    self._xrpa_fields_changed_handler = handler

  def get_live_stack_instance(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return self._local_live_stack_instance

  def set_live_stack_instance(self, live_stack_instance: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    self._local_live_stack_instance = live_stack_instance
    if (self._change_bits & 1) == 0:
      self._change_bits |= 1
      self._change_byte_count += 16
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 1)

  def get_live_stack_door_id(self) -> str:
    return self._local_live_stack_door_id

  def set_live_stack_door_id(self, live_stack_door_id: str) -> None:
    self._local_live_stack_door_id = live_stack_door_id
    if (self._change_bits & 2) == 0:
      self._change_bits |= 2
      self._change_byte_count += 4
    self._change_byte_count += xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_live_stack_door_id)
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 2)

  def get_front_room(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return self._local_front_room

  def set_front_room(self, front_room: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    self._local_front_room = front_room
    if (self._change_bits & 4) == 0:
      self._change_bits |= 4
      self._change_byte_count += 16
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 4)

  def get_back_room(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return self._local_back_room

  def set_back_room(self, back_room: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    self._local_back_room = back_room
    if (self._change_bits & 8) == 0:
      self._change_bits |= 8
      self._change_byte_count += 16
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 8)

  def get_anchor(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return self._local_anchor

  def set_anchor(self, anchor: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    self._local_anchor = anchor
    if (self._change_bits & 16) == 0:
      self._change_bits |= 16
      self._change_byte_count += 16
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 16)

  def get_pose(self) -> xrpa.live_stack_types.Pose:
    return self._local_pose

  def set_pose(self, pose: xrpa.live_stack_types.Pose) -> None:
    self._local_pose = pose
    if (self._change_bits & 32) == 0:
      self._change_bits |= 32
      self._change_byte_count += 28
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 32)

  def get_width(self) -> float:
    return self._local_width

  def set_width(self, width: float) -> None:
    self._local_width = width
    if (self._change_bits & 64) == 0:
      self._change_bits |= 64
      self._change_byte_count += 4
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 64)

  def get_height(self) -> float:
    return self._local_height

  def set_height(self, height: float) -> None:
    self._local_height = height
    if (self._change_bits & 128) == 0:
      self._change_bits |= 128
      self._change_byte_count += 4
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 128)

  def get_last_update_timestamp(self) -> int:
    return self._local_last_update_timestamp

  def set_last_update_timestamp(self) -> None:
    self._local_last_update_timestamp = xrpa_runtime.utils.time_utils.TimeUtils.get_current_clock_time_microseconds();
    if (self._change_bits & 256) == 0:
      self._change_bits |= 256
      self._change_byte_count += 8
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 256)

  def clear_last_update_timestamp(self) -> None:
    clear_value: int = 0;
    if self._local_last_update_timestamp != clear_value:
      self._local_last_update_timestamp = clear_value
      if (self._change_bits & 256) == 0:
        self._change_bits |= 256
        self._change_byte_count += 8
      if self._collection is not None:
        if not self._has_notified_needs_write:
          self._collection.notify_object_needs_write(self.get_xrpa_id())
          self._has_notified_needs_write = True
        self._collection.set_dirty(self.get_xrpa_id(), 256)

  def write_ds_changes(self, accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor) -> None:
    obj_accessor = None
    if not self._create_written:
      self._change_bits = 511
      self._change_byte_count = xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_live_stack_door_id) + 112
      obj_accessor = LiveStackDoorWriter.create(accessor, self.get_collection_id(), self.get_xrpa_id(), self._change_byte_count, self._create_timestamp)
      self._create_written = True
    elif self._change_bits != 0:
      obj_accessor = LiveStackDoorWriter.update(accessor, self.get_collection_id(), self.get_xrpa_id(), self._change_bits, self._change_byte_count)
    if obj_accessor is None or obj_accessor.is_null():
      return
    if (self._change_bits & 1) != 0:
      obj_accessor.set_live_stack_instance(self._local_live_stack_instance)
    if (self._change_bits & 2) != 0:
      obj_accessor.set_live_stack_door_id(self._local_live_stack_door_id)
    if (self._change_bits & 4) != 0:
      obj_accessor.set_front_room(self._local_front_room)
    if (self._change_bits & 8) != 0:
      obj_accessor.set_back_room(self._local_back_room)
    if (self._change_bits & 16) != 0:
      obj_accessor.set_anchor(self._local_anchor)
    if (self._change_bits & 32) != 0:
      obj_accessor.set_pose(self._local_pose)
    if (self._change_bits & 64) != 0:
      obj_accessor.set_width(self._local_width)
    if (self._change_bits & 128) != 0:
      obj_accessor.set_height(self._local_height)
    if (self._change_bits & 256) != 0:
      obj_accessor.set_last_update_timestamp(self._local_last_update_timestamp)
    self._change_bits = 0
    self._change_byte_count = 0
    self._has_notified_needs_write = False

  def prep_ds_full_update(self) -> int:
    self._create_written = False
    self._change_bits = 511
    self._change_byte_count = xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_live_stack_door_id) + 112
    return self._create_timestamp

  def process_ds_update(self, value: LiveStackDoorReader, fields_changed: int) -> None:
    self._handle_xrpa_fields_changed(fields_changed)

  def check_live_stack_instance_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1) != 0

  def check_live_stack_door_id_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2) != 0

  def check_front_room_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 4) != 0

  def check_back_room_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 8) != 0

  def check_anchor_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 16) != 0

  def check_pose_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 32) != 0

  def check_width_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 64) != 0

  def check_height_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 128) != 0

  def check_last_update_timestamp_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 256) != 0

  def process_ds_message(self, message_type: int, msg_timestamp: int, message_data: xrpa_runtime.utils.memory_accessor.MemoryAccessor) -> None:
    pass

class OutboundLiveStackBodyPose(xrpa_runtime.reconciler.data_store_interfaces.DataStoreObject, xrpa_runtime.reconciler.data_store_interfaces.IDataStoreObjectAccessor[LiveStackBodyPoseReader]):
  def __init__(self, id: xrpa_runtime.utils.xrpa_types.ObjectUuid):
    super().__init__(id, None)
    self._create_timestamp = xrpa_runtime.utils.time_utils.TimeUtils.get_current_clock_time_microseconds()
    self._xrpa_fields_changed_handler = None
    self._local_live_stack_instance = xrpa_runtime.utils.xrpa_types.ObjectUuid(0, 0)
    self._local_live_stack_person_id = 0
    self._local_live_stack_human_uuid = ""
    self._local_anchor = xrpa_runtime.utils.xrpa_types.ObjectUuid(0, 0)
    self._local_root_pose = xrpa.live_stack_types.Pose(xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Quaternion(0, 0, 0, 1))
    self._local_joint_poses = [xrpa.live_stack_types.Pose(xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Quaternion(0, 0, 0, 1)), xrpa.live_stack_types.Pose(xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Quaternion(0, 0, 0, 1)), xrpa.live_stack_types.Pose(xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Quaternion(0, 0, 0, 1)), xrpa.live_stack_types.Pose(xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Quaternion(0, 0, 0, 1)), xrpa.live_stack_types.Pose(xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Quaternion(0, 0, 0, 1)), xrpa.live_stack_types.Pose(xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Quaternion(0, 0, 0, 1)), xrpa.live_stack_types.Pose(xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Quaternion(0, 0, 0, 1)), xrpa.live_stack_types.Pose(xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Quaternion(0, 0, 0, 1)), xrpa.live_stack_types.Pose(xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Quaternion(0, 0, 0, 1)), xrpa.live_stack_types.Pose(xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Quaternion(0, 0, 0, 1)), xrpa.live_stack_types.Pose(xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Quaternion(0, 0, 0, 1)), xrpa.live_stack_types.Pose(xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Quaternion(0, 0, 0, 1)), xrpa.live_stack_types.Pose(xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Quaternion(0, 0, 0, 1)), xrpa.live_stack_types.Pose(xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Quaternion(0, 0, 0, 1)), xrpa.live_stack_types.Pose(xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Quaternion(0, 0, 0, 1)), xrpa.live_stack_types.Pose(xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Quaternion(0, 0, 0, 1)), xrpa.live_stack_types.Pose(xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Quaternion(0, 0, 0, 1)), xrpa.live_stack_types.Pose(xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Quaternion(0, 0, 0, 1)), xrpa.live_stack_types.Pose(xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Quaternion(0, 0, 0, 1)), xrpa.live_stack_types.Pose(xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Quaternion(0, 0, 0, 1)), xrpa.live_stack_types.Pose(xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Quaternion(0, 0, 0, 1)), xrpa.live_stack_types.Pose(xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Quaternion(0, 0, 0, 1)), xrpa.live_stack_types.Pose(xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Quaternion(0, 0, 0, 1)), xrpa.live_stack_types.Pose(xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Quaternion(0, 0, 0, 1))]
    self._local_last_update_timestamp = 0
    self._change_bits = 0
    self._change_byte_count = 0
    self._create_written = False

  def _handle_xrpa_fields_changed(self, fields_changed: int) -> None:
    if self._xrpa_fields_changed_handler is not None: self._xrpa_fields_changed_handler(fields_changed)

  def on_xrpa_fields_changed(self, handler: typing.Callable[[int], None]) -> None:
    self._xrpa_fields_changed_handler = handler

  def get_live_stack_instance(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return self._local_live_stack_instance

  def set_live_stack_instance(self, live_stack_instance: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    self._local_live_stack_instance = live_stack_instance
    if (self._change_bits & 1) == 0:
      self._change_bits |= 1
      self._change_byte_count += 16
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 1)

  def get_live_stack_person_id(self) -> int:
    return self._local_live_stack_person_id

  def set_live_stack_person_id(self, live_stack_person_id: int) -> None:
    self._local_live_stack_person_id = live_stack_person_id
    if (self._change_bits & 2) == 0:
      self._change_bits |= 2
      self._change_byte_count += 4
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 2)

  def get_live_stack_human_uuid(self) -> str:
    return self._local_live_stack_human_uuid

  def set_live_stack_human_uuid(self, live_stack_human_uuid: str) -> None:
    self._local_live_stack_human_uuid = live_stack_human_uuid
    if (self._change_bits & 4) == 0:
      self._change_bits |= 4
      self._change_byte_count += 4
    self._change_byte_count += xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_live_stack_human_uuid)
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 4)

  def get_anchor(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return self._local_anchor

  def set_anchor(self, anchor: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    self._local_anchor = anchor
    if (self._change_bits & 8) == 0:
      self._change_bits |= 8
      self._change_byte_count += 16
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 8)

  def get_root_pose(self) -> xrpa.live_stack_types.Pose:
    return self._local_root_pose

  def set_root_pose(self, root_pose: xrpa.live_stack_types.Pose) -> None:
    self._local_root_pose = root_pose
    if (self._change_bits & 16) == 0:
      self._change_bits |= 16
      self._change_byte_count += 28
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 16)

  def get_joint_poses(self) -> typing.List[xrpa.live_stack_types.Pose]:
    return self._local_joint_poses

  def set_joint_poses(self, joint_poses: typing.List[xrpa.live_stack_types.Pose]) -> None:
    self._local_joint_poses = joint_poses
    if (self._change_bits & 32) == 0:
      self._change_bits |= 32
      self._change_byte_count += 672
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 32)

  def get_last_update_timestamp(self) -> int:
    return self._local_last_update_timestamp

  def set_last_update_timestamp(self) -> None:
    self._local_last_update_timestamp = xrpa_runtime.utils.time_utils.TimeUtils.get_current_clock_time_microseconds();
    if (self._change_bits & 64) == 0:
      self._change_bits |= 64
      self._change_byte_count += 8
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 64)

  def clear_last_update_timestamp(self) -> None:
    clear_value: int = 0;
    if self._local_last_update_timestamp != clear_value:
      self._local_last_update_timestamp = clear_value
      if (self._change_bits & 64) == 0:
        self._change_bits |= 64
        self._change_byte_count += 8
      if self._collection is not None:
        if not self._has_notified_needs_write:
          self._collection.notify_object_needs_write(self.get_xrpa_id())
          self._has_notified_needs_write = True
        self._collection.set_dirty(self.get_xrpa_id(), 64)

  def write_ds_changes(self, accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor) -> None:
    obj_accessor = None
    if not self._create_written:
      self._change_bits = 127
      self._change_byte_count = xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_live_stack_human_uuid) + 748
      obj_accessor = LiveStackBodyPoseWriter.create(accessor, self.get_collection_id(), self.get_xrpa_id(), self._change_byte_count, self._create_timestamp)
      self._create_written = True
    elif self._change_bits != 0:
      obj_accessor = LiveStackBodyPoseWriter.update(accessor, self.get_collection_id(), self.get_xrpa_id(), self._change_bits, self._change_byte_count)
    if obj_accessor is None or obj_accessor.is_null():
      return
    if (self._change_bits & 1) != 0:
      obj_accessor.set_live_stack_instance(self._local_live_stack_instance)
    if (self._change_bits & 2) != 0:
      obj_accessor.set_live_stack_person_id(self._local_live_stack_person_id)
    if (self._change_bits & 4) != 0:
      obj_accessor.set_live_stack_human_uuid(self._local_live_stack_human_uuid)
    if (self._change_bits & 8) != 0:
      obj_accessor.set_anchor(self._local_anchor)
    if (self._change_bits & 16) != 0:
      obj_accessor.set_root_pose(self._local_root_pose)
    if (self._change_bits & 32) != 0:
      obj_accessor.set_joint_poses(self._local_joint_poses)
    if (self._change_bits & 64) != 0:
      obj_accessor.set_last_update_timestamp(self._local_last_update_timestamp)
    self._change_bits = 0
    self._change_byte_count = 0
    self._has_notified_needs_write = False

  def prep_ds_full_update(self) -> int:
    self._create_written = False
    self._change_bits = 127
    self._change_byte_count = xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_live_stack_human_uuid) + 748
    return self._create_timestamp

  def process_ds_update(self, value: LiveStackBodyPoseReader, fields_changed: int) -> None:
    self._handle_xrpa_fields_changed(fields_changed)

  def check_live_stack_instance_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1) != 0

  def check_live_stack_person_id_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2) != 0

  def check_live_stack_human_uuid_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 4) != 0

  def check_anchor_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 8) != 0

  def check_root_pose_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 16) != 0

  def check_joint_poses_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 32) != 0

  def check_last_update_timestamp_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 64) != 0

  def process_ds_message(self, message_type: int, msg_timestamp: int, message_data: xrpa_runtime.utils.memory_accessor.MemoryAccessor) -> None:
    pass

class OutboundLiveStackHands(xrpa_runtime.reconciler.data_store_interfaces.DataStoreObject, xrpa_runtime.reconciler.data_store_interfaces.IDataStoreObjectAccessor[LiveStackHandsReader]):
  def __init__(self, id: xrpa_runtime.utils.xrpa_types.ObjectUuid):
    super().__init__(id, None)
    self._create_timestamp = xrpa_runtime.utils.time_utils.TimeUtils.get_current_clock_time_microseconds()
    self._xrpa_fields_changed_handler = None
    self._local_live_stack_instance = xrpa_runtime.utils.xrpa_types.ObjectUuid(0, 0)
    self._local_anchor = xrpa_runtime.utils.xrpa_types.ObjectUuid(0, 0)
    self._local_is_left_hand_tracked = False
    self._local_is_right_hand_tracked = False
    self._local_left_hand_landmarks = [xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0)]
    self._local_right_hand_landmarks = [xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0), xrpa.live_stack_types.Vector3(0, 0, 0)]
    self._local_last_update_timestamp = 0
    self._change_bits = 0
    self._change_byte_count = 0
    self._create_written = False

  def _handle_xrpa_fields_changed(self, fields_changed: int) -> None:
    if self._xrpa_fields_changed_handler is not None: self._xrpa_fields_changed_handler(fields_changed)

  def on_xrpa_fields_changed(self, handler: typing.Callable[[int], None]) -> None:
    self._xrpa_fields_changed_handler = handler

  def get_live_stack_instance(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return self._local_live_stack_instance

  def set_live_stack_instance(self, live_stack_instance: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    self._local_live_stack_instance = live_stack_instance
    if (self._change_bits & 1) == 0:
      self._change_bits |= 1
      self._change_byte_count += 16
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 1)

  def get_anchor(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return self._local_anchor

  def set_anchor(self, anchor: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    self._local_anchor = anchor
    if (self._change_bits & 2) == 0:
      self._change_bits |= 2
      self._change_byte_count += 16
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 2)

  def get_is_left_hand_tracked(self) -> bool:
    return self._local_is_left_hand_tracked

  def set_is_left_hand_tracked(self, is_left_hand_tracked: bool) -> None:
    self._local_is_left_hand_tracked = is_left_hand_tracked
    if (self._change_bits & 4) == 0:
      self._change_bits |= 4
      self._change_byte_count += 4
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 4)

  def get_is_right_hand_tracked(self) -> bool:
    return self._local_is_right_hand_tracked

  def set_is_right_hand_tracked(self, is_right_hand_tracked: bool) -> None:
    self._local_is_right_hand_tracked = is_right_hand_tracked
    if (self._change_bits & 8) == 0:
      self._change_bits |= 8
      self._change_byte_count += 4
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 8)

  def get_left_hand_landmarks(self) -> typing.List[xrpa.live_stack_types.Vector3]:
    return self._local_left_hand_landmarks

  def set_left_hand_landmarks(self, left_hand_landmarks: typing.List[xrpa.live_stack_types.Vector3]) -> None:
    self._local_left_hand_landmarks = left_hand_landmarks
    if (self._change_bits & 16) == 0:
      self._change_bits |= 16
      self._change_byte_count += 252
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 16)

  def get_right_hand_landmarks(self) -> typing.List[xrpa.live_stack_types.Vector3]:
    return self._local_right_hand_landmarks

  def set_right_hand_landmarks(self, right_hand_landmarks: typing.List[xrpa.live_stack_types.Vector3]) -> None:
    self._local_right_hand_landmarks = right_hand_landmarks
    if (self._change_bits & 32) == 0:
      self._change_bits |= 32
      self._change_byte_count += 252
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 32)

  def get_last_update_timestamp(self) -> int:
    return self._local_last_update_timestamp

  def set_last_update_timestamp(self) -> None:
    self._local_last_update_timestamp = xrpa_runtime.utils.time_utils.TimeUtils.get_current_clock_time_microseconds();
    if (self._change_bits & 64) == 0:
      self._change_bits |= 64
      self._change_byte_count += 8
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 64)

  def clear_last_update_timestamp(self) -> None:
    clear_value: int = 0;
    if self._local_last_update_timestamp != clear_value:
      self._local_last_update_timestamp = clear_value
      if (self._change_bits & 64) == 0:
        self._change_bits |= 64
        self._change_byte_count += 8
      if self._collection is not None:
        if not self._has_notified_needs_write:
          self._collection.notify_object_needs_write(self.get_xrpa_id())
          self._has_notified_needs_write = True
        self._collection.set_dirty(self.get_xrpa_id(), 64)

  def write_ds_changes(self, accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor) -> None:
    obj_accessor = None
    if not self._create_written:
      self._change_bits = 127
      self._change_byte_count = 552
      obj_accessor = LiveStackHandsWriter.create(accessor, self.get_collection_id(), self.get_xrpa_id(), self._change_byte_count, self._create_timestamp)
      self._create_written = True
    elif self._change_bits != 0:
      obj_accessor = LiveStackHandsWriter.update(accessor, self.get_collection_id(), self.get_xrpa_id(), self._change_bits, self._change_byte_count)
    if obj_accessor is None or obj_accessor.is_null():
      return
    if (self._change_bits & 1) != 0:
      obj_accessor.set_live_stack_instance(self._local_live_stack_instance)
    if (self._change_bits & 2) != 0:
      obj_accessor.set_anchor(self._local_anchor)
    if (self._change_bits & 4) != 0:
      obj_accessor.set_is_left_hand_tracked(self._local_is_left_hand_tracked)
    if (self._change_bits & 8) != 0:
      obj_accessor.set_is_right_hand_tracked(self._local_is_right_hand_tracked)
    if (self._change_bits & 16) != 0:
      obj_accessor.set_left_hand_landmarks(self._local_left_hand_landmarks)
    if (self._change_bits & 32) != 0:
      obj_accessor.set_right_hand_landmarks(self._local_right_hand_landmarks)
    if (self._change_bits & 64) != 0:
      obj_accessor.set_last_update_timestamp(self._local_last_update_timestamp)
    self._change_bits = 0
    self._change_byte_count = 0
    self._has_notified_needs_write = False

  def prep_ds_full_update(self) -> int:
    self._create_written = False
    self._change_bits = 127
    self._change_byte_count = 552
    return self._create_timestamp

  def process_ds_update(self, value: LiveStackHandsReader, fields_changed: int) -> None:
    self._handle_xrpa_fields_changed(fields_changed)

  def check_live_stack_instance_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1) != 0

  def check_anchor_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2) != 0

  def check_is_left_hand_tracked_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 4) != 0

  def check_is_right_hand_tracked_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 8) != 0

  def check_left_hand_landmarks_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 16) != 0

  def check_right_hand_landmarks_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 32) != 0

  def check_last_update_timestamp_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 64) != 0

  def process_ds_message(self, message_type: int, msg_timestamp: int, message_data: xrpa_runtime.utils.memory_accessor.MemoryAccessor) -> None:
    pass

class OutboundLiveStackEyeGaze(xrpa_runtime.reconciler.data_store_interfaces.DataStoreObject, xrpa_runtime.reconciler.data_store_interfaces.IDataStoreObjectAccessor[LiveStackEyeGazeReader]):
  def __init__(self, id: xrpa_runtime.utils.xrpa_types.ObjectUuid):
    super().__init__(id, None)
    self._create_timestamp = xrpa_runtime.utils.time_utils.TimeUtils.get_current_clock_time_microseconds()
    self._xrpa_fields_changed_handler = None
    self._local_live_stack_instance = xrpa_runtime.utils.xrpa_types.ObjectUuid(0, 0)
    self._local_anchor = xrpa_runtime.utils.xrpa_types.ObjectUuid(0, 0)
    self._local_gaze_origin = xrpa.live_stack_types.Vector3(0, 0, 0)
    self._local_gaze_direction = xrpa.live_stack_types.UnitVector3(0, 0, 1)
    self._local_last_update_timestamp = 0
    self._change_bits = 0
    self._change_byte_count = 0
    self._create_written = False

  def _handle_xrpa_fields_changed(self, fields_changed: int) -> None:
    if self._xrpa_fields_changed_handler is not None: self._xrpa_fields_changed_handler(fields_changed)

  def on_xrpa_fields_changed(self, handler: typing.Callable[[int], None]) -> None:
    self._xrpa_fields_changed_handler = handler

  def get_live_stack_instance(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return self._local_live_stack_instance

  def set_live_stack_instance(self, live_stack_instance: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    self._local_live_stack_instance = live_stack_instance
    if (self._change_bits & 1) == 0:
      self._change_bits |= 1
      self._change_byte_count += 16
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 1)

  def get_anchor(self) -> xrpa_runtime.utils.xrpa_types.ObjectUuid:
    return self._local_anchor

  def set_anchor(self, anchor: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    self._local_anchor = anchor
    if (self._change_bits & 2) == 0:
      self._change_bits |= 2
      self._change_byte_count += 16
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 2)

  def get_gaze_origin(self) -> xrpa.live_stack_types.Vector3:
    return self._local_gaze_origin

  def set_gaze_origin(self, gaze_origin: xrpa.live_stack_types.Vector3) -> None:
    self._local_gaze_origin = gaze_origin
    if (self._change_bits & 4) == 0:
      self._change_bits |= 4
      self._change_byte_count += 12
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 4)

  def get_gaze_direction(self) -> xrpa.live_stack_types.UnitVector3:
    return self._local_gaze_direction

  def set_gaze_direction(self, gaze_direction: xrpa.live_stack_types.UnitVector3) -> None:
    self._local_gaze_direction = gaze_direction
    if (self._change_bits & 8) == 0:
      self._change_bits |= 8
      self._change_byte_count += 12
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 8)

  def get_last_update_timestamp(self) -> int:
    return self._local_last_update_timestamp

  def set_last_update_timestamp(self) -> None:
    self._local_last_update_timestamp = xrpa_runtime.utils.time_utils.TimeUtils.get_current_clock_time_microseconds();
    if (self._change_bits & 16) == 0:
      self._change_bits |= 16
      self._change_byte_count += 8
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 16)

  def clear_last_update_timestamp(self) -> None:
    clear_value: int = 0;
    if self._local_last_update_timestamp != clear_value:
      self._local_last_update_timestamp = clear_value
      if (self._change_bits & 16) == 0:
        self._change_bits |= 16
        self._change_byte_count += 8
      if self._collection is not None:
        if not self._has_notified_needs_write:
          self._collection.notify_object_needs_write(self.get_xrpa_id())
          self._has_notified_needs_write = True
        self._collection.set_dirty(self.get_xrpa_id(), 16)

  def write_ds_changes(self, accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor) -> None:
    obj_accessor = None
    if not self._create_written:
      self._change_bits = 31
      self._change_byte_count = 64
      obj_accessor = LiveStackEyeGazeWriter.create(accessor, self.get_collection_id(), self.get_xrpa_id(), self._change_byte_count, self._create_timestamp)
      self._create_written = True
    elif self._change_bits != 0:
      obj_accessor = LiveStackEyeGazeWriter.update(accessor, self.get_collection_id(), self.get_xrpa_id(), self._change_bits, self._change_byte_count)
    if obj_accessor is None or obj_accessor.is_null():
      return
    if (self._change_bits & 1) != 0:
      obj_accessor.set_live_stack_instance(self._local_live_stack_instance)
    if (self._change_bits & 2) != 0:
      obj_accessor.set_anchor(self._local_anchor)
    if (self._change_bits & 4) != 0:
      obj_accessor.set_gaze_origin(self._local_gaze_origin)
    if (self._change_bits & 8) != 0:
      obj_accessor.set_gaze_direction(self._local_gaze_direction)
    if (self._change_bits & 16) != 0:
      obj_accessor.set_last_update_timestamp(self._local_last_update_timestamp)
    self._change_bits = 0
    self._change_byte_count = 0
    self._has_notified_needs_write = False

  def prep_ds_full_update(self) -> int:
    self._create_written = False
    self._change_bits = 31
    self._change_byte_count = 64
    return self._create_timestamp

  def process_ds_update(self, value: LiveStackEyeGazeReader, fields_changed: int) -> None:
    self._handle_xrpa_fields_changed(fields_changed)

  def check_live_stack_instance_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1) != 0

  def check_anchor_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2) != 0

  def check_gaze_origin_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 4) != 0

  def check_gaze_direction_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 8) != 0

  def check_last_update_timestamp_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 16) != 0

  def process_ds_message(self, message_type: int, msg_timestamp: int, message_data: xrpa_runtime.utils.memory_accessor.MemoryAccessor) -> None:
    pass

class ReconciledLiveStackInstance(xrpa_runtime.reconciler.data_store_interfaces.DataStoreObject, xrpa_runtime.reconciler.data_store_interfaces.IDataStoreObjectAccessor[LiveStackInstanceReader]):
  def __init__(self, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, collection: xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection):
    super().__init__(id, collection)
    self._xrpa_fields_changed_handler = None
    self._xrpa_delete_handler = None
    self._local_connection_status = ""
    self._local_last_heartbeat = 0
    self._local_server_version = ""
    self._change_bits = 0
    self._change_byte_count = 0
    self._local_ip_address = ""
    self._local_port = 5047
    self._local_subscribe_to_objects = True
    self._local_subscribe_to_rooms = True
    self._local_subscribe_to_doors = True
    self._local_subscribe_to_hands = True
    self._local_subscribe_to_eye_gaze = True
    self._local_subscribe_to_body_poses = True
    self._local_subscribe_to_anchors = True

  def _handle_xrpa_fields_changed(self, fields_changed: int) -> None:
    if self._xrpa_fields_changed_handler is not None: self._xrpa_fields_changed_handler(fields_changed)

  def on_xrpa_fields_changed(self, handler: typing.Callable[[int], None]) -> None:
    self._xrpa_fields_changed_handler = handler

  def handle_xrpa_delete(self) -> None:
    if self._xrpa_delete_handler is not None: self._xrpa_delete_handler()

  def on_xrpa_delete(self, handler: typing.Callable[[], None]) -> None:
    self._xrpa_delete_handler = handler

  def get_connection_status(self) -> str:
    return self._local_connection_status

  def set_connection_status(self, connection_status: str) -> None:
    self._local_connection_status = connection_status
    if (self._change_bits & 512) == 0:
      self._change_bits |= 512
      self._change_byte_count += 4
    self._change_byte_count += xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_connection_status)
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 512)

  def get_last_heartbeat(self) -> int:
    return self._local_last_heartbeat

  def set_last_heartbeat(self) -> None:
    self._local_last_heartbeat = xrpa_runtime.utils.time_utils.TimeUtils.get_current_clock_time_microseconds();
    if (self._change_bits & 1024) == 0:
      self._change_bits |= 1024
      self._change_byte_count += 8
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 1024)

  def clear_last_heartbeat(self) -> None:
    clear_value: int = 0;
    if self._local_last_heartbeat != clear_value:
      self._local_last_heartbeat = clear_value
      if (self._change_bits & 1024) == 0:
        self._change_bits |= 1024
        self._change_byte_count += 8
      if self._collection is not None:
        if not self._has_notified_needs_write:
          self._collection.notify_object_needs_write(self.get_xrpa_id())
          self._has_notified_needs_write = True
        self._collection.set_dirty(self.get_xrpa_id(), 1024)

  def get_server_version(self) -> str:
    return self._local_server_version

  def set_server_version(self, server_version: str) -> None:
    self._local_server_version = server_version
    if (self._change_bits & 2048) == 0:
      self._change_bits |= 2048
      self._change_byte_count += 4
    self._change_byte_count += xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_server_version)
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 2048)

  def process_ds_update(self, value: LiveStackInstanceReader, fields_changed: int) -> None:
    if value.check_ip_address_changed(fields_changed):
      self._local_ip_address = value.get_ip_address()
    if value.check_port_changed(fields_changed):
      self._local_port = value.get_port()
    if value.check_subscribe_to_objects_changed(fields_changed):
      self._local_subscribe_to_objects = value.get_subscribe_to_objects()
    if value.check_subscribe_to_rooms_changed(fields_changed):
      self._local_subscribe_to_rooms = value.get_subscribe_to_rooms()
    if value.check_subscribe_to_doors_changed(fields_changed):
      self._local_subscribe_to_doors = value.get_subscribe_to_doors()
    if value.check_subscribe_to_hands_changed(fields_changed):
      self._local_subscribe_to_hands = value.get_subscribe_to_hands()
    if value.check_subscribe_to_eye_gaze_changed(fields_changed):
      self._local_subscribe_to_eye_gaze = value.get_subscribe_to_eye_gaze()
    if value.check_subscribe_to_body_poses_changed(fields_changed):
      self._local_subscribe_to_body_poses = value.get_subscribe_to_body_poses()
    if value.check_subscribe_to_anchors_changed(fields_changed):
      self._local_subscribe_to_anchors = value.get_subscribe_to_anchors()
    self._handle_xrpa_fields_changed(fields_changed)

  @staticmethod
  def create(id: xrpa_runtime.utils.xrpa_types.ObjectUuid, obj: LiveStackInstanceReader, collection: xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection) -> "ReconciledLiveStackInstance":
    return ReconciledLiveStackInstance(id, collection)

  def get_ip_address(self) -> str:
    return self._local_ip_address

  def get_port(self) -> int:
    return self._local_port

  def get_subscribe_to_objects(self) -> bool:
    return self._local_subscribe_to_objects

  def get_subscribe_to_rooms(self) -> bool:
    return self._local_subscribe_to_rooms

  def get_subscribe_to_doors(self) -> bool:
    return self._local_subscribe_to_doors

  def get_subscribe_to_hands(self) -> bool:
    return self._local_subscribe_to_hands

  def get_subscribe_to_eye_gaze(self) -> bool:
    return self._local_subscribe_to_eye_gaze

  def get_subscribe_to_body_poses(self) -> bool:
    return self._local_subscribe_to_body_poses

  def get_subscribe_to_anchors(self) -> bool:
    return self._local_subscribe_to_anchors

  def check_ip_address_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1) != 0

  def check_port_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2) != 0

  def check_subscribe_to_objects_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 4) != 0

  def check_subscribe_to_rooms_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 8) != 0

  def check_subscribe_to_doors_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 16) != 0

  def check_subscribe_to_hands_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 32) != 0

  def check_subscribe_to_eye_gaze_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 64) != 0

  def check_subscribe_to_body_poses_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 128) != 0

  def check_subscribe_to_anchors_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 256) != 0

  def check_connection_status_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 512) != 0

  def check_last_heartbeat_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1024) != 0

  def check_server_version_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2048) != 0

  def process_ds_message(self, message_type: int, msg_timestamp: int, message_data: xrpa_runtime.utils.memory_accessor.MemoryAccessor) -> None:
    pass

  def write_ds_changes(self, accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor) -> None:
    if self._change_bits == 0:
      return
    obj_accessor = LiveStackInstanceWriter.update(accessor, self.get_collection_id(), self.get_xrpa_id(), self._change_bits, self._change_byte_count)
    if obj_accessor is None or obj_accessor.is_null():
      return
    if (self._change_bits & 512) != 0:
      obj_accessor.set_connection_status(self._local_connection_status)
    if (self._change_bits & 1024) != 0:
      obj_accessor.set_last_heartbeat(self._local_last_heartbeat)
    if (self._change_bits & 2048) != 0:
      obj_accessor.set_server_version(self._local_server_version)
    self._change_bits = 0
    self._change_byte_count = 0
    self._has_notified_needs_write = False

  def prep_ds_full_update(self) -> int:
    self._change_bits = 3584
    self._change_byte_count = xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_connection_status) + xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_server_version) + 16
    return 1

# Object Collections
class InboundLiveStackInstanceReaderCollection(xrpa_runtime.reconciler.object_collection.ObjectCollection[LiveStackInstanceReader, ReconciledLiveStackInstance]):
  def __init__(self, reconciler: xrpa_runtime.reconciler.data_store_reconciler.DataStoreReconciler):
    super().__init__(LiveStackInstanceReader, reconciler, 0, 511, 0, False)
    self._set_create_delegate_internal(ReconciledLiveStackInstance.create)

  def set_create_delegate(self, create_delegate: typing.Callable[[xrpa_runtime.utils.xrpa_types.ObjectUuid, LiveStackInstanceReader, xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection], ReconciledLiveStackInstance]) -> None:
    self._set_create_delegate_internal(create_delegate)

class OutboundLiveStackAnchorReaderCollection(xrpa_runtime.reconciler.object_collection.ObjectCollection[LiveStackAnchorReader, OutboundLiveStackAnchor]):
  def __init__(self, reconciler: xrpa_runtime.reconciler.data_store_reconciler.DataStoreReconciler):
    super().__init__(LiveStackAnchorReader, reconciler, 1, 0, 0, True)

  def add_object(self, obj: OutboundLiveStackAnchor) -> None:
    self._add_object_internal(obj)

  def create_object(self) -> OutboundLiveStackAnchor:
    obj = OutboundLiveStackAnchor(xrpa_runtime.utils.xrpa_types.ObjectUuid.from_uuid(uuid.uuid4()))
    self._add_object_internal(obj)
    return obj

  def remove_object(self, id: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    self._remove_object_internal(id)

class OutboundLiveStackRoomReaderCollection(xrpa_runtime.reconciler.object_collection.ObjectCollection[LiveStackRoomReader, OutboundLiveStackRoom]):
  def __init__(self, reconciler: xrpa_runtime.reconciler.data_store_reconciler.DataStoreReconciler):
    super().__init__(LiveStackRoomReader, reconciler, 2, 0, 0, True)

  def add_object(self, obj: OutboundLiveStackRoom) -> None:
    self._add_object_internal(obj)

  def create_object(self) -> OutboundLiveStackRoom:
    obj = OutboundLiveStackRoom(xrpa_runtime.utils.xrpa_types.ObjectUuid.from_uuid(uuid.uuid4()))
    self._add_object_internal(obj)
    return obj

  def remove_object(self, id: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    self._remove_object_internal(id)

class OutboundLiveStackObjectReaderCollection(xrpa_runtime.reconciler.object_collection.ObjectCollection[LiveStackObjectReader, OutboundLiveStackObject]):
  def __init__(self, reconciler: xrpa_runtime.reconciler.data_store_reconciler.DataStoreReconciler):
    super().__init__(LiveStackObjectReader, reconciler, 3, 0, 0, True)

  def add_object(self, obj: OutboundLiveStackObject) -> None:
    self._add_object_internal(obj)

  def create_object(self) -> OutboundLiveStackObject:
    obj = OutboundLiveStackObject(xrpa_runtime.utils.xrpa_types.ObjectUuid.from_uuid(uuid.uuid4()))
    self._add_object_internal(obj)
    return obj

  def remove_object(self, id: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    self._remove_object_internal(id)

class OutboundLiveStackDoorReaderCollection(xrpa_runtime.reconciler.object_collection.ObjectCollection[LiveStackDoorReader, OutboundLiveStackDoor]):
  def __init__(self, reconciler: xrpa_runtime.reconciler.data_store_reconciler.DataStoreReconciler):
    super().__init__(LiveStackDoorReader, reconciler, 4, 0, 0, True)

  def add_object(self, obj: OutboundLiveStackDoor) -> None:
    self._add_object_internal(obj)

  def create_object(self) -> OutboundLiveStackDoor:
    obj = OutboundLiveStackDoor(xrpa_runtime.utils.xrpa_types.ObjectUuid.from_uuid(uuid.uuid4()))
    self._add_object_internal(obj)
    return obj

  def remove_object(self, id: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    self._remove_object_internal(id)

class OutboundLiveStackBodyPoseReaderCollection(xrpa_runtime.reconciler.object_collection.ObjectCollection[LiveStackBodyPoseReader, OutboundLiveStackBodyPose]):
  def __init__(self, reconciler: xrpa_runtime.reconciler.data_store_reconciler.DataStoreReconciler):
    super().__init__(LiveStackBodyPoseReader, reconciler, 5, 0, 0, True)

  def add_object(self, obj: OutboundLiveStackBodyPose) -> None:
    self._add_object_internal(obj)

  def create_object(self) -> OutboundLiveStackBodyPose:
    obj = OutboundLiveStackBodyPose(xrpa_runtime.utils.xrpa_types.ObjectUuid.from_uuid(uuid.uuid4()))
    self._add_object_internal(obj)
    return obj

  def remove_object(self, id: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    self._remove_object_internal(id)

class OutboundLiveStackHandsReaderCollection(xrpa_runtime.reconciler.object_collection.ObjectCollection[LiveStackHandsReader, OutboundLiveStackHands]):
  def __init__(self, reconciler: xrpa_runtime.reconciler.data_store_reconciler.DataStoreReconciler):
    super().__init__(LiveStackHandsReader, reconciler, 6, 0, 0, True)

  def add_object(self, obj: OutboundLiveStackHands) -> None:
    self._add_object_internal(obj)

  def create_object(self) -> OutboundLiveStackHands:
    obj = OutboundLiveStackHands(xrpa_runtime.utils.xrpa_types.ObjectUuid.from_uuid(uuid.uuid4()))
    self._add_object_internal(obj)
    return obj

  def remove_object(self, id: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    self._remove_object_internal(id)

class OutboundLiveStackEyeGazeReaderCollection(xrpa_runtime.reconciler.object_collection.ObjectCollection[LiveStackEyeGazeReader, OutboundLiveStackEyeGaze]):
  def __init__(self, reconciler: xrpa_runtime.reconciler.data_store_reconciler.DataStoreReconciler):
    super().__init__(LiveStackEyeGazeReader, reconciler, 7, 0, 0, True)

  def add_object(self, obj: OutboundLiveStackEyeGaze) -> None:
    self._add_object_internal(obj)

  def create_object(self) -> OutboundLiveStackEyeGaze:
    obj = OutboundLiveStackEyeGaze(xrpa_runtime.utils.xrpa_types.ObjectUuid.from_uuid(uuid.uuid4()))
    self._add_object_internal(obj)
    return obj

  def remove_object(self, id: xrpa_runtime.utils.xrpa_types.ObjectUuid) -> None:
    self._remove_object_internal(id)

# Data Store Implementation
class LiveStackDataStore(xrpa_runtime.reconciler.data_store_reconciler.DataStoreReconciler):
  def __init__(self, inbound_transport: xrpa_runtime.transport.transport_stream.TransportStream, outbound_transport: xrpa_runtime.transport.transport_stream.TransportStream):
    super().__init__(inbound_transport, outbound_transport, 0)
    self.LiveStackInstance = InboundLiveStackInstanceReaderCollection(self)
    self._register_collection(self.LiveStackInstance)
    self.LiveStackAnchor = OutboundLiveStackAnchorReaderCollection(self)
    self._register_collection(self.LiveStackAnchor)
    self.LiveStackRoom = OutboundLiveStackRoomReaderCollection(self)
    self._register_collection(self.LiveStackRoom)
    self.LiveStackObject = OutboundLiveStackObjectReaderCollection(self)
    self._register_collection(self.LiveStackObject)
    self.LiveStackDoor = OutboundLiveStackDoorReaderCollection(self)
    self._register_collection(self.LiveStackDoor)
    self.LiveStackBodyPose = OutboundLiveStackBodyPoseReaderCollection(self)
    self._register_collection(self.LiveStackBodyPose)
    self.LiveStackHands = OutboundLiveStackHandsReaderCollection(self)
    self._register_collection(self.LiveStackHands)
    self.LiveStackEyeGaze = OutboundLiveStackEyeGazeReaderCollection(self)
    self._register_collection(self.LiveStackEyeGaze)
