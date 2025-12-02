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

import dataclasses
import enum
import xrpa_runtime.utils.image_types
import xrpa_runtime.utils.memory_accessor
import xrpa_runtime.utils.xrpa_types

class eye_tracking_data_store_config:
  transport_config = xrpa_runtime.utils.xrpa_types.TransportConfig(xrpa_runtime.utils.xrpa_types.HashValue(0xc0501e465ab80a0b, 0xf695396386015ca8, 0xffa6f3230c250cbe, 0x5893636f9c85b315), 34883200)

class EyeEventType(enum.Enum):
  Blink = 0
  Fixation = 1
  Saccade = 2
  FixationOnset = 3
  SaccadeOnset = 4

@dataclasses.dataclass
class Vector2:
  x: float
  y: float

@dataclasses.dataclass
class Vector3:
  x: float
  y: float
  z: float

@dataclasses.dataclass
class Quaternion:
  x: float
  y: float
  z: float
  w: float

@dataclasses.dataclass
class UnitVector3:
  x: float
  y: float
  z: float

@dataclasses.dataclass
class DSScalar:
  @staticmethod
  def read_value(mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> float:
    value = mem_accessor.read_float(offset)
    return value

  @staticmethod
  def write_value(val: float, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> None:
    mem_accessor.write_float(val, offset)

@dataclasses.dataclass
class DSSceneImage:
  @staticmethod
  def read_value(mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> xrpa_runtime.utils.image_types.Image:
    width = mem_accessor.read_int(offset)
    height = mem_accessor.read_int(offset)
    format = mem_accessor.read_int(offset)
    encoding = mem_accessor.read_int(offset)
    orientation = mem_accessor.read_int(offset)
    gain = DSScalar.read_value(mem_accessor, offset)
    exposure_duration = mem_accessor.read_ulong(offset)
    timestamp = mem_accessor.read_ulong(offset)
    capture_frame_rate = DSScalar.read_value(mem_accessor, offset)
    data = mem_accessor.read_bytearray(offset)
    return xrpa_runtime.utils.image_types.Image(width, height, xrpa_runtime.utils.image_types.ImageFormat(format), xrpa_runtime.utils.image_types.ImageEncoding(encoding), xrpa_runtime.utils.image_types.ImageOrientation(orientation), gain, exposure_duration, timestamp, capture_frame_rate, data)

  @staticmethod
  def write_value(val: xrpa_runtime.utils.image_types.Image, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> None:
    mem_accessor.write_int(val.width, offset)
    mem_accessor.write_int(val.height, offset)
    mem_accessor.write_int(val.format.value, offset)
    mem_accessor.write_int(val.encoding.value, offset)
    mem_accessor.write_int(val.orientation.value, offset)
    DSScalar.write_value(val.gain, mem_accessor, offset)
    mem_accessor.write_ulong(val.exposure_duration, offset)
    mem_accessor.write_ulong(val.timestamp, offset)
    DSScalar.write_value(val.capture_frame_rate, mem_accessor, offset)
    mem_accessor.write_bytearray(val.data, offset)

  @staticmethod
  def dyn_size_of_value(val: xrpa_runtime.utils.image_types.Image) -> int:
    return xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_bytearray(val.data)

@dataclasses.dataclass
class DSVector2:
  @staticmethod
  def read_value(mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> Vector2:
    x = mem_accessor.read_float(offset)
    y = mem_accessor.read_float(offset)
    return Vector2(x * 100, y * 100)

  @staticmethod
  def write_value(val: Vector2, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> None:
    mem_accessor.write_float(val.x / 100, offset)
    mem_accessor.write_float(val.y / 100, offset)

@dataclasses.dataclass
class DSVector3:
  @staticmethod
  def read_value(mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> Vector3:
    x = mem_accessor.read_float(offset)
    y = mem_accessor.read_float(offset)
    z = mem_accessor.read_float(offset)
    return Vector3(x * 100, -z * 100, y * 100)

  @staticmethod
  def write_value(val: Vector3, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> None:
    mem_accessor.write_float(val.x / 100, offset)
    mem_accessor.write_float(val.z / 100, offset)
    mem_accessor.write_float(-val.y / 100, offset)

@dataclasses.dataclass
class DSAngle:
  @staticmethod
  def read_value(mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> float:
    value = mem_accessor.read_float(offset)
    return value * 57.29577951308232

  @staticmethod
  def write_value(val: float, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> None:
    mem_accessor.write_float(val * 0.017453292519943295, offset)

@dataclasses.dataclass
class DSQuaternion:
  @staticmethod
  def read_value(mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> Quaternion:
    x = mem_accessor.read_float(offset)
    y = mem_accessor.read_float(offset)
    z = mem_accessor.read_float(offset)
    w = mem_accessor.read_float(offset)
    return Quaternion(x, -z, y, w)

  @staticmethod
  def write_value(val: Quaternion, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> None:
    mem_accessor.write_float(val.x, offset)
    mem_accessor.write_float(val.z, offset)
    mem_accessor.write_float(-val.y, offset)
    mem_accessor.write_float(val.w, offset)

@dataclasses.dataclass
class DSUnitVector3:
  @staticmethod
  def read_value(mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> UnitVector3:
    x = mem_accessor.read_float(offset)
    y = mem_accessor.read_float(offset)
    z = mem_accessor.read_float(offset)
    return UnitVector3(x, -z, y)

  @staticmethod
  def write_value(val: UnitVector3, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> None:
    mem_accessor.write_float(val.x, offset)
    mem_accessor.write_float(val.z, offset)
    mem_accessor.write_float(-val.y, offset)

@dataclasses.dataclass
class DSDistance:
  @staticmethod
  def read_value(mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> float:
    value = mem_accessor.read_float(offset)
    return value * 100

  @staticmethod
  def write_value(val: float, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> None:
    mem_accessor.write_float(val / 100, offset)
