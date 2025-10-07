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
import xrpa_runtime.utils.memory_accessor
import xrpa_runtime.utils.xrpa_types

class sensory_stimulus_data_store_config:
  transport_config = xrpa_runtime.utils.xrpa_types.TransportConfig(xrpa_runtime.utils.xrpa_types.HashValue(0x748cf01432af8f7c, 0x2feb41b1214accbe, 0xca40b1cae9317d9e, 0x8729a24008450788), 11092756)

class ImageFormat(enum.Enum):
  RGB8 = 0
  BGR8 = 1
  RGBA8 = 2
  Y8 = 3

class ImageEncoding(enum.Enum):
  Raw = 0
  Jpeg = 1

class ImageOrientation(enum.Enum):
  Oriented = 0
  RotatedCW = 1
  RotatedCCW = 2
  Rotated180 = 3

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
class Pose:
  position: Vector3
  orientation: Quaternion

@dataclasses.dataclass
class Image:

  # Image width
  width: int

  # Image height
  height: int
  format: ImageFormat
  encoding: ImageEncoding
  orientation: ImageOrientation

  # Image gain
  gain: float

  # Image exposure duration, if available
  exposure_duration: int

  # Capture timestamp, if available
  timestamp: int

  # Capture frame rate, if available
  capture_frame_rate: float

  # Image data
  data: bytearray

@dataclasses.dataclass
class DSVector3:
  @staticmethod
  def read_value(mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> Vector3:
    x = mem_accessor.read_float(offset)
    y = mem_accessor.read_float(offset)
    z = mem_accessor.read_float(offset)
    return Vector3(x, y, -z)

  @staticmethod
  def write_value(val: Vector3, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> None:
    mem_accessor.write_float(val.x, offset)
    mem_accessor.write_float(val.y, offset)
    mem_accessor.write_float(-val.z, offset)

@dataclasses.dataclass
class DSQuaternion:
  @staticmethod
  def read_value(mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> Quaternion:
    x = mem_accessor.read_float(offset)
    y = mem_accessor.read_float(offset)
    z = mem_accessor.read_float(offset)
    w = mem_accessor.read_float(offset)
    return Quaternion(-x, -y, z, w)

  @staticmethod
  def write_value(val: Quaternion, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> None:
    mem_accessor.write_float(-val.x, offset)
    mem_accessor.write_float(-val.y, offset)
    mem_accessor.write_float(val.z, offset)
    mem_accessor.write_float(val.w, offset)

@dataclasses.dataclass
class DSPose:
  @staticmethod
  def read_value(mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> Pose:
    position = DSVector3.read_value(mem_accessor, offset)
    orientation = DSQuaternion.read_value(mem_accessor, offset)
    return Pose(position, orientation)

  @staticmethod
  def write_value(val: Pose, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> None:
    DSVector3.write_value(val.position, mem_accessor, offset)
    DSQuaternion.write_value(val.orientation, mem_accessor, offset)

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
class DSImage:
  @staticmethod
  def read_value(mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> Image:
    width = mem_accessor.read_int(offset)
    height = mem_accessor.read_int(offset)
    format = mem_accessor.read_int(offset)
    encoding = mem_accessor.read_int(offset)
    orientation = mem_accessor.read_int(offset)
    gain = DSScalar.read_value(mem_accessor, offset)
    exposureDuration = mem_accessor.read_ulong(offset)
    timestamp = mem_accessor.read_ulong(offset)
    captureFrameRate = DSScalar.read_value(mem_accessor, offset)
    data = mem_accessor.read_bytearray(offset)
    return Image(width, height, ImageFormat(format), ImageEncoding(encoding), ImageOrientation(orientation), gain, exposureDuration, timestamp, captureFrameRate, data)

  @staticmethod
  def write_value(val: Image, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> None:
    mem_accessor.write_int(val.width, offset)
    mem_accessor.write_int(val.height, offset)
    mem_accessor.write_int(val.format.value, offset)
    mem_accessor.write_int(val.encoding.value, offset)
    mem_accessor.write_int(val.orientation.value, offset)
    DSScalar.write_value(val.gain, mem_accessor, offset)
    mem_accessor.write_ulong(val.exposure_duration, offset)
    mem_accessor.write_ulong(val.timestamp, offset)
    DSScalar.write_value(val.captureFrameRate, mem_accessor, offset)
    mem_accessor.write_bytearray(val.data, offset)

  @staticmethod
  def dyn_size_of_value(val: Image) -> int:
    return xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_bytearray(val.data)
