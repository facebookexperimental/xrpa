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

class gesture_detection_data_store_config:
  transport_config = xrpa_runtime.utils.xrpa_types.TransportConfig(xrpa_runtime.utils.xrpa_types.HashValue(0x61aa1cf873aaf74c, 0x514c23f6d31e701d, 0x29b9f041d06819a8, 0x562ec8a5cbb52dae), 37327296)

class GestureType(enum.Enum):
  None_ = 0
  ClosedFist = 1
  OpenPalm = 2
  PointingUp = 3
  ThumbDown = 4
  ThumbUp = 5
  Victory = 6
  ILoveYou = 7
  Pinch = 8

class MotionDirection(enum.Enum):
  Static = 0
  Up = 1
  Down = 2
  Left = 3
  Right = 4

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
class DSGestureImage:
  @staticmethod
  def read_value(mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> xrpa_runtime.utils.image_types.Image:
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
    return xrpa_runtime.utils.image_types.Image(width, height, xrpa_runtime.utils.image_types.ImageFormat(format), xrpa_runtime.utils.image_types.ImageEncoding(encoding), xrpa_runtime.utils.image_types.ImageOrientation(orientation), gain, exposureDuration, timestamp, captureFrameRate, data)

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
    DSScalar.write_value(val.captureFrameRate, mem_accessor, offset)
    mem_accessor.write_bytearray(val.data, offset)

  @staticmethod
  def dyn_size_of_value(val: xrpa_runtime.utils.image_types.Image) -> int:
    return xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_bytearray(val.data)
