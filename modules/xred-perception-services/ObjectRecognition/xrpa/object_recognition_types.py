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

class object_recognition_data_store_config:
  transport_config = xrpa_runtime.utils.xrpa_types.TransportConfig(xrpa_runtime.utils.xrpa_types.HashValue(0xd94a476c6efda834, 0xdf9f224e1956167d, 0x6937ac3838e465f8, 0xc4440fce9688e4fb), 5949456)

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
class ImageRgbImage:

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
class RgbImage:
  image: ImageRgbImage

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
class DSImageRgbImage:
  @staticmethod
  def read_value(mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> ImageRgbImage:
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
    return ImageRgbImage(width, height, ImageFormat(format), ImageEncoding(encoding), ImageOrientation(orientation), gain, exposureDuration, timestamp, captureFrameRate, data)

  @staticmethod
  def write_value(val: ImageRgbImage, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> None:
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
  def dyn_size_of_value(val: ImageRgbImage) -> int:
    return xrpa_runtime.utils.memory_accessor.MemoryAccessor.dyn_size_of_bytearray(val.data)

@dataclasses.dataclass
class DSRgbImage:
  @staticmethod
  def read_value(mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> RgbImage:
    image = DSImageRgbImage.read_value(mem_accessor, offset)
    return RgbImage(image)

  @staticmethod
  def write_value(val: RgbImage, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> None:
    DSImageRgbImage.write_value(val.image, mem_accessor, offset)

  @staticmethod
  def dyn_size_of_value(val: RgbImage) -> int:
    return DSImageRgbImage.dyn_size_of_value(val.image)
