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
import xrpa.eye_tracking_types
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
import xrpa_runtime.utils.image_types
import xrpa_runtime.utils.memory_accessor
import xrpa_runtime.utils.xrpa_types

class SceneCameraReader(xrpa_runtime.utils.xrpa_types.ObjectAccessorInterface):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._read_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  def get_image(self) -> xrpa_runtime.utils.image_types.Image:
    return xrpa.eye_tracking_types.DSSceneImage.read_value(self._mem_accessor, self._read_offset)

  # Gaze position in scene camera pixels corresponding to this frame
  def get_gaze_position(self) -> xrpa.eye_tracking_types.Scale2:
    return xrpa.eye_tracking_types.DSScale2.read_value(self._mem_accessor, self._read_offset)

class SceneCameraWriter(SceneCameraReader):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._write_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  def set_image(self, value: xrpa_runtime.utils.image_types.Image) -> None:
    xrpa.eye_tracking_types.DSSceneImage.write_value(value, self._mem_accessor, self._write_offset)

  def set_gaze_position(self, value: xrpa.eye_tracking_types.Scale2) -> None:
    xrpa.eye_tracking_types.DSScale2.write_value(value, self._mem_accessor, self._write_offset)

class ImuDataReader(xrpa_runtime.utils.xrpa_types.ObjectAccessorInterface):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._read_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  # Timestamp of the IMU sample
  def get_timestamp(self) -> int:
    return self._mem_accessor.read_ulong(self._read_offset)

  # Gyroscope data in deg/s (X-right, Y-forward, Z-up)
  def get_gyro(self) -> xrpa.eye_tracking_types.Vector3:
    return xrpa.eye_tracking_types.DSVector3.read_value(self._mem_accessor, self._read_offset)

  # Accelerometer data in m/s² (X-right, Y-forward, Z-up)
  def get_accel(self) -> xrpa.eye_tracking_types.Vector3:
    return xrpa.eye_tracking_types.DSVector3.read_value(self._mem_accessor, self._read_offset)

class ImuDataWriter(ImuDataReader):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._write_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  def set_timestamp(self, value: int) -> None:
    self._mem_accessor.write_ulong(value, self._write_offset)

  def set_gyro(self, value: xrpa.eye_tracking_types.Vector3) -> None:
    xrpa.eye_tracking_types.DSVector3.write_value(value, self._mem_accessor, self._write_offset)

  def set_accel(self, value: xrpa.eye_tracking_types.Vector3) -> None:
    xrpa.eye_tracking_types.DSVector3.write_value(value, self._mem_accessor, self._write_offset)

class EyeEventReader(xrpa_runtime.utils.xrpa_types.ObjectAccessorInterface):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._read_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  def get_event_type(self) -> xrpa.eye_tracking_types.EyeEventType:
    return xrpa.eye_tracking_types.EyeEventType(self._mem_accessor.read_int(self._read_offset))

  # Event start timestamp
  def get_start_time(self) -> int:
    return self._mem_accessor.read_ulong(self._read_offset)

  # Event end timestamp
  def get_end_time(self) -> int:
    return self._mem_accessor.read_ulong(self._read_offset)

  # Mean gaze position in scene camera pixels
  def get_mean_gaze(self) -> xrpa.eye_tracking_types.Scale2:
    return xrpa.eye_tracking_types.DSScale2.read_value(self._mem_accessor, self._read_offset)

  # Event amplitude in degrees
  def get_amplitude(self) -> float:
    return xrpa.eye_tracking_types.DSAngle.read_value(self._mem_accessor, self._read_offset)

  # Maximum velocity in pixels/degree
  def get_max_velocity(self) -> float:
    return xrpa.eye_tracking_types.DSScalar.read_value(self._mem_accessor, self._read_offset)

class EyeEventWriter(EyeEventReader):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._write_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  def set_event_type(self, value: xrpa.eye_tracking_types.EyeEventType) -> None:
    self._mem_accessor.write_int(value.value, self._write_offset)

  def set_start_time(self, value: int) -> None:
    self._mem_accessor.write_ulong(value, self._write_offset)

  def set_end_time(self, value: int) -> None:
    self._mem_accessor.write_ulong(value, self._write_offset)

  def set_mean_gaze(self, value: xrpa.eye_tracking_types.Scale2) -> None:
    xrpa.eye_tracking_types.DSScale2.write_value(value, self._mem_accessor, self._write_offset)

  def set_amplitude(self, value: float) -> None:
    xrpa.eye_tracking_types.DSAngle.write_value(value, self._mem_accessor, self._write_offset)

  def set_max_velocity(self, value: float) -> None:
    xrpa.eye_tracking_types.DSScalar.write_value(value, self._mem_accessor, self._write_offset)

class EyeTrackingDeviceReader(xrpa_runtime.utils.xrpa_types.ObjectAccessorInterface):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._read_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  # Network address or device name for discovery
  def get_device_address(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  # Enable gaze data streaming
  def get_stream_gaze(self) -> bool:
    return (self._mem_accessor.read_int(self._read_offset) == 1)

  # Enable scene camera streaming
  def get_stream_scene_camera(self) -> bool:
    return (self._mem_accessor.read_int(self._read_offset) == 1)

  # Enable IMU data streaming
  def get_stream_imu(self) -> bool:
    return (self._mem_accessor.read_int(self._read_offset) == 1)

  # Enable eye events (blinks, fixations, saccades)
  def get_stream_eye_events(self) -> bool:
    return (self._mem_accessor.read_int(self._read_offset) == 1)

  # Enable audio streaming
  def get_stream_audio(self) -> bool:
    return (self._mem_accessor.read_int(self._read_offset) == 1)

  # Human-readable device name
  def get_device_name(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  # Hardware version info
  def get_hardware_version(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  # Device serial number
  def get_serial_number(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  # Connection status
  def get_is_connected(self) -> bool:
    return (self._mem_accessor.read_int(self._read_offset) == 1)

  # Camera calibration data (JSON format)
  def get_calibration_json(self) -> str:
    return self._mem_accessor.read_str(self._read_offset)

  # Last data update timestamp
  def get_last_update(self) -> int:
    return self._mem_accessor.read_ulong(self._read_offset)

  # Head orientation (always updated)
  def get_head_orientation(self) -> xrpa.eye_tracking_types.Quaternion:
    return xrpa.eye_tracking_types.DSQuaternion.read_value(self._mem_accessor, self._read_offset)

  # Gaze direction in world space
  def get_gaze_direction(self) -> xrpa.eye_tracking_types.UnitVector3:
    return xrpa.eye_tracking_types.DSUnitVector3.read_value(self._mem_accessor, self._read_offset)

  # Whether glasses are worn
  def get_worn(self) -> bool:
    return (self._mem_accessor.read_int(self._read_offset) == 1)

  # Left pupil diameter
  def get_pupil_diameter_left(self) -> float:
    return xrpa.eye_tracking_types.DSDistance.read_value(self._mem_accessor, self._read_offset)

  # Right pupil diameter
  def get_pupil_diameter_right(self) -> float:
    return xrpa.eye_tracking_types.DSDistance.read_value(self._mem_accessor, self._read_offset)

  # Current scene camera frame rate
  def get_scene_camera_frame_rate(self) -> int:
    return self._mem_accessor.read_int(self._read_offset)

  def check_device_address_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1) != 0

  def check_stream_gaze_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2) != 0

  def check_stream_scene_camera_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 4) != 0

  def check_stream_imu_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 8) != 0

  def check_stream_eye_events_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 16) != 0

  def check_stream_audio_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 32) != 0

  def check_device_name_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 64) != 0

  def check_hardware_version_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 128) != 0

  def check_serial_number_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 256) != 0

  def check_is_connected_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 512) != 0

  def check_calibration_json_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1024) != 0

  def check_last_update_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2048) != 0

  def check_head_orientation_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 4096) != 0

  def check_gaze_direction_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 8192) != 0

  def check_worn_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 16384) != 0

  def check_pupil_diameter_left_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 32768) != 0

  def check_pupil_diameter_right_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 65536) != 0

  def check_scene_camera_frame_rate_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 131072) != 0

class EyeTrackingDeviceWriter(EyeTrackingDeviceReader):
  def __init__(self, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor):
    super().__init__(mem_accessor)
    self._write_offset = xrpa_runtime.utils.memory_accessor.MemoryOffset()

  @staticmethod
  def create(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, change_byte_count: int, timestamp: int) -> "EyeTrackingDeviceWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.CreateObject.value, change_byte_count, timestamp)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    return EyeTrackingDeviceWriter(change_event.access_change_data())

  @staticmethod
  def update(accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor, collection_id: int, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, fields_changed: int, change_byte_count: int) -> "EyeTrackingDeviceWriter":
    change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionUpdateChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.UpdateObject.value, change_byte_count)
    change_event.set_collection_id(collection_id)
    change_event.set_object_id(id)
    change_event.set_fields_changed(fields_changed)
    return EyeTrackingDeviceWriter(change_event.access_change_data())

  def set_device_address(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

  def set_stream_gaze(self, value: bool) -> None:
    self._mem_accessor.write_int((1 if value is True else 0), self._write_offset)

  def set_stream_scene_camera(self, value: bool) -> None:
    self._mem_accessor.write_int((1 if value is True else 0), self._write_offset)

  def set_stream_imu(self, value: bool) -> None:
    self._mem_accessor.write_int((1 if value is True else 0), self._write_offset)

  def set_stream_eye_events(self, value: bool) -> None:
    self._mem_accessor.write_int((1 if value is True else 0), self._write_offset)

  def set_stream_audio(self, value: bool) -> None:
    self._mem_accessor.write_int((1 if value is True else 0), self._write_offset)

  def set_device_name(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

  def set_hardware_version(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

  def set_serial_number(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

  def set_is_connected(self, value: bool) -> None:
    self._mem_accessor.write_int((1 if value is True else 0), self._write_offset)

  def set_calibration_json(self, value: str) -> None:
    self._mem_accessor.write_str(value, self._write_offset)

  def set_last_update(self, value: int) -> None:
    self._mem_accessor.write_ulong(value, self._write_offset)

  def set_head_orientation(self, value: xrpa.eye_tracking_types.Quaternion) -> None:
    xrpa.eye_tracking_types.DSQuaternion.write_value(value, self._mem_accessor, self._write_offset)

  def set_gaze_direction(self, value: xrpa.eye_tracking_types.UnitVector3) -> None:
    xrpa.eye_tracking_types.DSUnitVector3.write_value(value, self._mem_accessor, self._write_offset)

  def set_worn(self, value: bool) -> None:
    self._mem_accessor.write_int((1 if value is True else 0), self._write_offset)

  def set_pupil_diameter_left(self, value: float) -> None:
    xrpa.eye_tracking_types.DSDistance.write_value(value, self._mem_accessor, self._write_offset)

  def set_pupil_diameter_right(self, value: float) -> None:
    xrpa.eye_tracking_types.DSDistance.write_value(value, self._mem_accessor, self._write_offset)

  def set_scene_camera_frame_rate(self, value: int) -> None:
    self._mem_accessor.write_int(value, self._write_offset)

# Reconciled Types
class ReconciledEyeTrackingDevice(xrpa_runtime.reconciler.data_store_interfaces.DataStoreObject, xrpa_runtime.reconciler.data_store_interfaces.IDataStoreObjectAccessor[EyeTrackingDeviceReader]):
  def __init__(self, id: xrpa_runtime.utils.xrpa_types.ObjectUuid, collection: xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection):
    super().__init__(id, collection)
    self._xrpa_fields_changed_handler = None
    self._xrpa_delete_handler = None
    self._local_device_name = ""
    self._local_hardware_version = ""
    self._local_serial_number = ""
    self._local_is_connected = False
    self._local_calibration_json = ""
    self._local_last_update = 0
    self._local_head_orientation = xrpa.eye_tracking_types.Quaternion(0, 0, 0, 1)
    self._local_gaze_direction = xrpa.eye_tracking_types.UnitVector3(0, -1, 0)
    self._local_worn = False
    self._local_pupil_diameter_left = 0
    self._local_pupil_diameter_right = 0
    self._local_scene_camera_frame_rate = 0
    self._change_bits = 0
    self._change_byte_count = 0
    self._local_device_address = ""
    self._local_stream_gaze = False
    self._local_stream_scene_camera = False
    self._local_stream_imu = False
    self._local_stream_eye_events = False
    self._local_stream_audio = False
    self._local_audio = xrpa_runtime.signals.outbound_signal_data.OutboundSignalData()

  def _handle_xrpa_fields_changed(self, fields_changed: int) -> None:
    if self._xrpa_fields_changed_handler is not None: self._xrpa_fields_changed_handler(fields_changed)

  def on_xrpa_fields_changed(self, handler: typing.Callable[[int], None]) -> None:
    self._xrpa_fields_changed_handler = handler

  def handle_xrpa_delete(self) -> None:
    if self._xrpa_delete_handler is not None: self._xrpa_delete_handler()

  def on_xrpa_delete(self, handler: typing.Callable[[], None]) -> None:
    self._xrpa_delete_handler = handler

  def get_device_name(self) -> str:
    return self._local_device_name

  def set_device_name(self, device_name: str) -> None:
    self._local_device_name = device_name
    if (self._change_bits & 64) == 0:
      self._change_bits |= 64
      self._change_byte_count += 4
    self._change_byte_count += xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_device_name)
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 64)

  def get_hardware_version(self) -> str:
    return self._local_hardware_version

  def set_hardware_version(self, hardware_version: str) -> None:
    self._local_hardware_version = hardware_version
    if (self._change_bits & 128) == 0:
      self._change_bits |= 128
      self._change_byte_count += 4
    self._change_byte_count += xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_hardware_version)
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 128)

  def get_serial_number(self) -> str:
    return self._local_serial_number

  def set_serial_number(self, serial_number: str) -> None:
    self._local_serial_number = serial_number
    if (self._change_bits & 256) == 0:
      self._change_bits |= 256
      self._change_byte_count += 4
    self._change_byte_count += xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_serial_number)
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 256)

  def get_is_connected(self) -> bool:
    return self._local_is_connected

  def set_is_connected(self, is_connected: bool) -> None:
    self._local_is_connected = is_connected
    if (self._change_bits & 512) == 0:
      self._change_bits |= 512
      self._change_byte_count += 4
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 512)

  def get_calibration_json(self) -> str:
    return self._local_calibration_json

  def set_calibration_json(self, calibration_json: str) -> None:
    self._local_calibration_json = calibration_json
    if (self._change_bits & 1024) == 0:
      self._change_bits |= 1024
      self._change_byte_count += 4
    self._change_byte_count += xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_calibration_json)
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 1024)

  def get_last_update(self) -> int:
    return self._local_last_update

  def set_last_update(self) -> None:
    self._local_last_update = xrpa_runtime.utils.time_utils.TimeUtils.get_current_clock_time_microseconds();
    if (self._change_bits & 2048) == 0:
      self._change_bits |= 2048
      self._change_byte_count += 8
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 2048)

  def clear_last_update(self) -> None:
    clear_value: int = 0;
    if self._local_last_update != clear_value:
      self._local_last_update = clear_value
      if (self._change_bits & 2048) == 0:
        self._change_bits |= 2048
        self._change_byte_count += 8
      if self._collection is not None:
        if not self._has_notified_needs_write:
          self._collection.notify_object_needs_write(self.get_xrpa_id())
          self._has_notified_needs_write = True
        self._collection.set_dirty(self.get_xrpa_id(), 2048)

  def get_head_orientation(self) -> xrpa.eye_tracking_types.Quaternion:
    return self._local_head_orientation

  def set_head_orientation(self, head_orientation: xrpa.eye_tracking_types.Quaternion) -> None:
    self._local_head_orientation = head_orientation
    if (self._change_bits & 4096) == 0:
      self._change_bits |= 4096
      self._change_byte_count += 16
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 4096)

  def get_gaze_direction(self) -> xrpa.eye_tracking_types.UnitVector3:
    return self._local_gaze_direction

  def set_gaze_direction(self, gaze_direction: xrpa.eye_tracking_types.UnitVector3) -> None:
    self._local_gaze_direction = gaze_direction
    if (self._change_bits & 8192) == 0:
      self._change_bits |= 8192
      self._change_byte_count += 12
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 8192)

  def get_worn(self) -> bool:
    return self._local_worn

  def set_worn(self, worn: bool) -> None:
    self._local_worn = worn
    if (self._change_bits & 16384) == 0:
      self._change_bits |= 16384
      self._change_byte_count += 4
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 16384)

  def get_pupil_diameter_left(self) -> float:
    return self._local_pupil_diameter_left

  def set_pupil_diameter_left(self, pupil_diameter_left: float) -> None:
    self._local_pupil_diameter_left = pupil_diameter_left
    if (self._change_bits & 32768) == 0:
      self._change_bits |= 32768
      self._change_byte_count += 4
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 32768)

  def get_pupil_diameter_right(self) -> float:
    return self._local_pupil_diameter_right

  def set_pupil_diameter_right(self, pupil_diameter_right: float) -> None:
    self._local_pupil_diameter_right = pupil_diameter_right
    if (self._change_bits & 65536) == 0:
      self._change_bits |= 65536
      self._change_byte_count += 4
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 65536)

  def get_scene_camera_frame_rate(self) -> int:
    return self._local_scene_camera_frame_rate

  def set_scene_camera_frame_rate(self, scene_camera_frame_rate: int) -> None:
    self._local_scene_camera_frame_rate = scene_camera_frame_rate
    if (self._change_bits & 131072) == 0:
      self._change_bits |= 131072
      self._change_byte_count += 4
    if self._collection is not None:
      if not self._has_notified_needs_write:
        self._collection.notify_object_needs_write(self.get_xrpa_id())
        self._has_notified_needs_write = True
      self._collection.set_dirty(self.get_xrpa_id(), 131072)

  def process_ds_update(self, value: EyeTrackingDeviceReader, fields_changed: int) -> None:
    if value.check_device_address_changed(fields_changed):
      self._local_device_address = value.get_device_address()
    if value.check_stream_gaze_changed(fields_changed):
      self._local_stream_gaze = value.get_stream_gaze()
    if value.check_stream_scene_camera_changed(fields_changed):
      self._local_stream_scene_camera = value.get_stream_scene_camera()
    if value.check_stream_imu_changed(fields_changed):
      self._local_stream_imu = value.get_stream_imu()
    if value.check_stream_eye_events_changed(fields_changed):
      self._local_stream_eye_events = value.get_stream_eye_events()
    if value.check_stream_audio_changed(fields_changed):
      self._local_stream_audio = value.get_stream_audio()
    self._handle_xrpa_fields_changed(fields_changed)

  @staticmethod
  def create(id: xrpa_runtime.utils.xrpa_types.ObjectUuid, obj: EyeTrackingDeviceReader, collection: xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection) -> "ReconciledEyeTrackingDevice":
    return ReconciledEyeTrackingDevice(id, collection)

  def get_device_address(self) -> str:
    return self._local_device_address

  def get_stream_gaze(self) -> bool:
    return self._local_stream_gaze

  def get_stream_scene_camera(self) -> bool:
    return self._local_stream_scene_camera

  def get_stream_imu(self) -> bool:
    return self._local_stream_imu

  def get_stream_eye_events(self) -> bool:
    return self._local_stream_eye_events

  def get_stream_audio(self) -> bool:
    return self._local_stream_audio

  def check_device_address_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1) != 0

  def check_stream_gaze_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2) != 0

  def check_stream_scene_camera_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 4) != 0

  def check_stream_imu_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 8) != 0

  def check_stream_eye_events_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 16) != 0

  def check_stream_audio_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 32) != 0

  def check_device_name_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 64) != 0

  def check_hardware_version_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 128) != 0

  def check_serial_number_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 256) != 0

  def check_is_connected_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 512) != 0

  def check_calibration_json_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 1024) != 0

  def check_last_update_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 2048) != 0

  def check_head_orientation_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 4096) != 0

  def check_gaze_direction_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 8192) != 0

  def check_worn_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 16384) != 0

  def check_pupil_diameter_left_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 32768) != 0

  def check_pupil_diameter_right_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 65536) != 0

  def check_scene_camera_frame_rate_changed(self, fields_changed: int) -> bool:
    return (fields_changed & 131072) != 0

  def send_scene_camera(self, image: xrpa_runtime.utils.image_types.Image, gaze_position: xrpa.eye_tracking_types.Scale2) -> None:
    message = SceneCameraWriter(self._collection.send_message(
        self.get_xrpa_id(),
        17,
        xrpa.eye_tracking_types.DSSceneImage.dyn_size_of_value(image) + 56))
    message.set_image(image)
    message.set_gaze_position(gaze_position)

  def send_imu_data(self, timestamp: int, gyro: xrpa.eye_tracking_types.Vector3, accel: xrpa.eye_tracking_types.Vector3) -> None:
    message = ImuDataWriter(self._collection.send_message(
        self.get_xrpa_id(),
        19,
        32))
    message.set_timestamp(timestamp)
    message.set_gyro(gyro)
    message.set_accel(accel)

  def send_eye_event(self, event_type: xrpa.eye_tracking_types.EyeEventType, start_time: int, end_time: int, mean_gaze: xrpa.eye_tracking_types.Scale2, amplitude: float, max_velocity: float) -> None:
    message = EyeEventWriter(self._collection.send_message(
        self.get_xrpa_id(),
        20,
        36))
    message.set_event_type(event_type)
    message.set_start_time(start_time)
    message.set_end_time(end_time)
    message.set_mean_gaze(mean_gaze)
    message.set_amplitude(amplitude)
    message.set_max_velocity(max_velocity)

  def set_audio_callback(self, signal_callback: xrpa_runtime.signals.outbound_signal_data.SignalProducerCallback, sample_type_name: str, num_channels: int, frames_per_second: int, frames_per_packet: int) -> None:
    self._local_audio.set_signal_source(signal_callback, num_channels, frames_per_second, frames_per_packet, sample_type_name)

  def set_audio_ring_buffer(self, signal_ring_buffer: xrpa_runtime.signals.signal_ring_buffer.SignalRingBuffer, sample_type_name: str, num_channels: int, frames_per_second: int, frames_per_packet: int) -> None:
    self._local_audio.set_signal_source(signal_ring_buffer, num_channels, frames_per_second, frames_per_packet, sample_type_name)

  def set_audio_forwarder(self, signal_forwarder: xrpa_runtime.signals.inbound_signal_forwarder.InboundSignalForwarder) -> None:
    self._local_audio.set_recipient(self.get_xrpa_id(), self._collection, 21)
    signal_forwarder.add_recipient(self._local_audio)

  def send_audio(self, frame_count: int, sample_type_name: str, num_channels: int, frames_per_second: int) -> xrpa_runtime.signals.signal_shared.SignalPacket:
    sample_type: int = xrpa_runtime.signals.signal_shared.SignalTypeInference.infer_sample_type(sample_type_name)
    self._local_audio.set_recipient(self.get_xrpa_id(), self._collection, 21)
    return self._local_audio.send_signal_packet(xrpa_runtime.utils.memory_accessor.MemoryUtils.get_type_size(sample_type_name), frame_count, sample_type, num_channels, frames_per_second)

  def tick_xrpa(self) -> None:
    id = self.get_xrpa_id()
    self._local_audio.set_recipient(id, self._collection, 21)
    self._local_audio.tick()

  def process_ds_message(self, message_type: int, msg_timestamp: int, message_data: xrpa_runtime.utils.memory_accessor.MemoryAccessor) -> None:
    pass

  def write_ds_changes(self, accessor: xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor) -> None:
    if self._change_bits == 0:
      return
    obj_accessor = EyeTrackingDeviceWriter.update(accessor, self.get_collection_id(), self.get_xrpa_id(), self._change_bits, self._change_byte_count)
    if obj_accessor is None or obj_accessor.is_null():
      return
    if (self._change_bits & 64) != 0:
      obj_accessor.set_device_name(self._local_device_name)
    if (self._change_bits & 128) != 0:
      obj_accessor.set_hardware_version(self._local_hardware_version)
    if (self._change_bits & 256) != 0:
      obj_accessor.set_serial_number(self._local_serial_number)
    if (self._change_bits & 512) != 0:
      obj_accessor.set_is_connected(self._local_is_connected)
    if (self._change_bits & 1024) != 0:
      obj_accessor.set_calibration_json(self._local_calibration_json)
    if (self._change_bits & 2048) != 0:
      obj_accessor.set_last_update(self._local_last_update)
    if (self._change_bits & 4096) != 0:
      obj_accessor.set_head_orientation(self._local_head_orientation)
    if (self._change_bits & 8192) != 0:
      obj_accessor.set_gaze_direction(self._local_gaze_direction)
    if (self._change_bits & 16384) != 0:
      obj_accessor.set_worn(self._local_worn)
    if (self._change_bits & 32768) != 0:
      obj_accessor.set_pupil_diameter_left(self._local_pupil_diameter_left)
    if (self._change_bits & 65536) != 0:
      obj_accessor.set_pupil_diameter_right(self._local_pupil_diameter_right)
    if (self._change_bits & 131072) != 0:
      obj_accessor.set_scene_camera_frame_rate(self._local_scene_camera_frame_rate)
    self._change_bits = 0
    self._change_byte_count = 0
    self._has_notified_needs_write = False

  def prep_ds_full_update(self) -> int:
    self._change_bits = 262080
    self._change_byte_count = xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_device_name) + xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_hardware_version) + xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_serial_number) + xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_str(self._local_calibration_json) + 72
    return 1

# Object Collections
class InboundEyeTrackingDeviceReaderCollection(xrpa_runtime.reconciler.object_collection.ObjectCollection[EyeTrackingDeviceReader, ReconciledEyeTrackingDevice]):
  def __init__(self, reconciler: xrpa_runtime.reconciler.data_store_reconciler.DataStoreReconciler):
    super().__init__(EyeTrackingDeviceReader, reconciler, 0, 63, 0, False)
    self._set_create_delegate_internal(ReconciledEyeTrackingDevice.create)

  def set_create_delegate(self, create_delegate: typing.Callable[[xrpa_runtime.utils.xrpa_types.ObjectUuid, EyeTrackingDeviceReader, xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection], ReconciledEyeTrackingDevice]) -> None:
    self._set_create_delegate_internal(create_delegate)

# Data Store Implementation
class EyeTrackingDataStore(xrpa_runtime.reconciler.data_store_reconciler.DataStoreReconciler):
  def __init__(self, inbound_transport: xrpa_runtime.transport.transport_stream.TransportStream, outbound_transport: xrpa_runtime.transport.transport_stream.TransportStream):
    super().__init__(inbound_transport, outbound_transport, 34872064)
    self.EyeTrackingDevice = InboundEyeTrackingDeviceReaderCollection(self)
    self._register_collection(self.EyeTrackingDevice)
