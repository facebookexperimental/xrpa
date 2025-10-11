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
import typing
import xrpa_runtime.utils.memory_accessor
import xrpa_runtime.utils.xrpa_types

class live_stack_data_store_config:
  transport_config = xrpa_runtime.utils.xrpa_types.TransportConfig(xrpa_runtime.utils.xrpa_types.HashValue(0xa0dbc7be26d4407d, 0xf905f97500da5628, 0x99712cde0127b031, 0x50f684e2eb8fbfa4), 4462048)

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
class UnitVector3:
  x: float
  y: float
  z: float

@dataclasses.dataclass
class Distance3:
  x: float
  y: float
  z: float

@dataclasses.dataclass
class DSVector3:
  @staticmethod
  def read_value(mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> Vector3:
    x = mem_accessor.read_float(offset)
    y = mem_accessor.read_float(offset)
    z = mem_accessor.read_float(offset)
    return Vector3(x, y, z)

  @staticmethod
  def write_value(val: Vector3, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> None:
    mem_accessor.write_float(val.x, offset)
    mem_accessor.write_float(val.y, offset)
    mem_accessor.write_float(val.z, offset)

@dataclasses.dataclass
class DSQuaternion:
  @staticmethod
  def read_value(mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> Quaternion:
    x = mem_accessor.read_float(offset)
    y = mem_accessor.read_float(offset)
    z = mem_accessor.read_float(offset)
    w = mem_accessor.read_float(offset)
    return Quaternion(x, y, z, w)

  @staticmethod
  def write_value(val: Quaternion, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> None:
    mem_accessor.write_float(val.x, offset)
    mem_accessor.write_float(val.y, offset)
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
class DSUnitVector3:
  @staticmethod
  def read_value(mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> UnitVector3:
    x = mem_accessor.read_float(offset)
    y = mem_accessor.read_float(offset)
    z = mem_accessor.read_float(offset)
    return UnitVector3(x, y, z)

  @staticmethod
  def write_value(val: UnitVector3, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> None:
    mem_accessor.write_float(val.x, offset)
    mem_accessor.write_float(val.y, offset)
    mem_accessor.write_float(val.z, offset)

@dataclasses.dataclass
class DSVector3_64:
  @staticmethod
  def read_value(mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> typing.List[Vector3]:
    value0 = DSVector3.read_value(mem_accessor, offset)
    value1 = DSVector3.read_value(mem_accessor, offset)
    value2 = DSVector3.read_value(mem_accessor, offset)
    value3 = DSVector3.read_value(mem_accessor, offset)
    value4 = DSVector3.read_value(mem_accessor, offset)
    value5 = DSVector3.read_value(mem_accessor, offset)
    value6 = DSVector3.read_value(mem_accessor, offset)
    value7 = DSVector3.read_value(mem_accessor, offset)
    value8 = DSVector3.read_value(mem_accessor, offset)
    value9 = DSVector3.read_value(mem_accessor, offset)
    value10 = DSVector3.read_value(mem_accessor, offset)
    value11 = DSVector3.read_value(mem_accessor, offset)
    value12 = DSVector3.read_value(mem_accessor, offset)
    value13 = DSVector3.read_value(mem_accessor, offset)
    value14 = DSVector3.read_value(mem_accessor, offset)
    value15 = DSVector3.read_value(mem_accessor, offset)
    value16 = DSVector3.read_value(mem_accessor, offset)
    value17 = DSVector3.read_value(mem_accessor, offset)
    value18 = DSVector3.read_value(mem_accessor, offset)
    value19 = DSVector3.read_value(mem_accessor, offset)
    value20 = DSVector3.read_value(mem_accessor, offset)
    value21 = DSVector3.read_value(mem_accessor, offset)
    value22 = DSVector3.read_value(mem_accessor, offset)
    value23 = DSVector3.read_value(mem_accessor, offset)
    value24 = DSVector3.read_value(mem_accessor, offset)
    value25 = DSVector3.read_value(mem_accessor, offset)
    value26 = DSVector3.read_value(mem_accessor, offset)
    value27 = DSVector3.read_value(mem_accessor, offset)
    value28 = DSVector3.read_value(mem_accessor, offset)
    value29 = DSVector3.read_value(mem_accessor, offset)
    value30 = DSVector3.read_value(mem_accessor, offset)
    value31 = DSVector3.read_value(mem_accessor, offset)
    value32 = DSVector3.read_value(mem_accessor, offset)
    value33 = DSVector3.read_value(mem_accessor, offset)
    value34 = DSVector3.read_value(mem_accessor, offset)
    value35 = DSVector3.read_value(mem_accessor, offset)
    value36 = DSVector3.read_value(mem_accessor, offset)
    value37 = DSVector3.read_value(mem_accessor, offset)
    value38 = DSVector3.read_value(mem_accessor, offset)
    value39 = DSVector3.read_value(mem_accessor, offset)
    value40 = DSVector3.read_value(mem_accessor, offset)
    value41 = DSVector3.read_value(mem_accessor, offset)
    value42 = DSVector3.read_value(mem_accessor, offset)
    value43 = DSVector3.read_value(mem_accessor, offset)
    value44 = DSVector3.read_value(mem_accessor, offset)
    value45 = DSVector3.read_value(mem_accessor, offset)
    value46 = DSVector3.read_value(mem_accessor, offset)
    value47 = DSVector3.read_value(mem_accessor, offset)
    value48 = DSVector3.read_value(mem_accessor, offset)
    value49 = DSVector3.read_value(mem_accessor, offset)
    value50 = DSVector3.read_value(mem_accessor, offset)
    value51 = DSVector3.read_value(mem_accessor, offset)
    value52 = DSVector3.read_value(mem_accessor, offset)
    value53 = DSVector3.read_value(mem_accessor, offset)
    value54 = DSVector3.read_value(mem_accessor, offset)
    value55 = DSVector3.read_value(mem_accessor, offset)
    value56 = DSVector3.read_value(mem_accessor, offset)
    value57 = DSVector3.read_value(mem_accessor, offset)
    value58 = DSVector3.read_value(mem_accessor, offset)
    value59 = DSVector3.read_value(mem_accessor, offset)
    value60 = DSVector3.read_value(mem_accessor, offset)
    value61 = DSVector3.read_value(mem_accessor, offset)
    value62 = DSVector3.read_value(mem_accessor, offset)
    value63 = DSVector3.read_value(mem_accessor, offset)
    return [value0, value1, value2, value3, value4, value5, value6, value7, value8, value9, value10, value11, value12, value13, value14, value15, value16, value17, value18, value19, value20, value21, value22, value23, value24, value25, value26, value27, value28, value29, value30, value31, value32, value33, value34, value35, value36, value37, value38, value39, value40, value41, value42, value43, value44, value45, value46, value47, value48, value49, value50, value51, value52, value53, value54, value55, value56, value57, value58, value59, value60, value61, value62, value63]

  @staticmethod
  def write_value(val: typing.List[Vector3], mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> None:
    DSVector3.write_value(val[0], mem_accessor, offset)
    DSVector3.write_value(val[1], mem_accessor, offset)
    DSVector3.write_value(val[2], mem_accessor, offset)
    DSVector3.write_value(val[3], mem_accessor, offset)
    DSVector3.write_value(val[4], mem_accessor, offset)
    DSVector3.write_value(val[5], mem_accessor, offset)
    DSVector3.write_value(val[6], mem_accessor, offset)
    DSVector3.write_value(val[7], mem_accessor, offset)
    DSVector3.write_value(val[8], mem_accessor, offset)
    DSVector3.write_value(val[9], mem_accessor, offset)
    DSVector3.write_value(val[10], mem_accessor, offset)
    DSVector3.write_value(val[11], mem_accessor, offset)
    DSVector3.write_value(val[12], mem_accessor, offset)
    DSVector3.write_value(val[13], mem_accessor, offset)
    DSVector3.write_value(val[14], mem_accessor, offset)
    DSVector3.write_value(val[15], mem_accessor, offset)
    DSVector3.write_value(val[16], mem_accessor, offset)
    DSVector3.write_value(val[17], mem_accessor, offset)
    DSVector3.write_value(val[18], mem_accessor, offset)
    DSVector3.write_value(val[19], mem_accessor, offset)
    DSVector3.write_value(val[20], mem_accessor, offset)
    DSVector3.write_value(val[21], mem_accessor, offset)
    DSVector3.write_value(val[22], mem_accessor, offset)
    DSVector3.write_value(val[23], mem_accessor, offset)
    DSVector3.write_value(val[24], mem_accessor, offset)
    DSVector3.write_value(val[25], mem_accessor, offset)
    DSVector3.write_value(val[26], mem_accessor, offset)
    DSVector3.write_value(val[27], mem_accessor, offset)
    DSVector3.write_value(val[28], mem_accessor, offset)
    DSVector3.write_value(val[29], mem_accessor, offset)
    DSVector3.write_value(val[30], mem_accessor, offset)
    DSVector3.write_value(val[31], mem_accessor, offset)
    DSVector3.write_value(val[32], mem_accessor, offset)
    DSVector3.write_value(val[33], mem_accessor, offset)
    DSVector3.write_value(val[34], mem_accessor, offset)
    DSVector3.write_value(val[35], mem_accessor, offset)
    DSVector3.write_value(val[36], mem_accessor, offset)
    DSVector3.write_value(val[37], mem_accessor, offset)
    DSVector3.write_value(val[38], mem_accessor, offset)
    DSVector3.write_value(val[39], mem_accessor, offset)
    DSVector3.write_value(val[40], mem_accessor, offset)
    DSVector3.write_value(val[41], mem_accessor, offset)
    DSVector3.write_value(val[42], mem_accessor, offset)
    DSVector3.write_value(val[43], mem_accessor, offset)
    DSVector3.write_value(val[44], mem_accessor, offset)
    DSVector3.write_value(val[45], mem_accessor, offset)
    DSVector3.write_value(val[46], mem_accessor, offset)
    DSVector3.write_value(val[47], mem_accessor, offset)
    DSVector3.write_value(val[48], mem_accessor, offset)
    DSVector3.write_value(val[49], mem_accessor, offset)
    DSVector3.write_value(val[50], mem_accessor, offset)
    DSVector3.write_value(val[51], mem_accessor, offset)
    DSVector3.write_value(val[52], mem_accessor, offset)
    DSVector3.write_value(val[53], mem_accessor, offset)
    DSVector3.write_value(val[54], mem_accessor, offset)
    DSVector3.write_value(val[55], mem_accessor, offset)
    DSVector3.write_value(val[56], mem_accessor, offset)
    DSVector3.write_value(val[57], mem_accessor, offset)
    DSVector3.write_value(val[58], mem_accessor, offset)
    DSVector3.write_value(val[59], mem_accessor, offset)
    DSVector3.write_value(val[60], mem_accessor, offset)
    DSVector3.write_value(val[61], mem_accessor, offset)
    DSVector3.write_value(val[62], mem_accessor, offset)
    DSVector3.write_value(val[63], mem_accessor, offset)

@dataclasses.dataclass
class DSDistance:
  @staticmethod
  def read_value(mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> float:
    value = mem_accessor.read_float(offset)
    return value

  @staticmethod
  def write_value(val: float, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> None:
    mem_accessor.write_float(val, offset)

@dataclasses.dataclass
class DSDistance3:
  @staticmethod
  def read_value(mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> Distance3:
    x = mem_accessor.read_float(offset)
    y = mem_accessor.read_float(offset)
    z = mem_accessor.read_float(offset)
    return Distance3(x, y, z)

  @staticmethod
  def write_value(val: Distance3, mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> None:
    mem_accessor.write_float(val.x, offset)
    mem_accessor.write_float(val.y, offset)
    mem_accessor.write_float(val.z, offset)

@dataclasses.dataclass
class DSPose_24:
  @staticmethod
  def read_value(mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> typing.List[Pose]:
    value0 = DSPose.read_value(mem_accessor, offset)
    value1 = DSPose.read_value(mem_accessor, offset)
    value2 = DSPose.read_value(mem_accessor, offset)
    value3 = DSPose.read_value(mem_accessor, offset)
    value4 = DSPose.read_value(mem_accessor, offset)
    value5 = DSPose.read_value(mem_accessor, offset)
    value6 = DSPose.read_value(mem_accessor, offset)
    value7 = DSPose.read_value(mem_accessor, offset)
    value8 = DSPose.read_value(mem_accessor, offset)
    value9 = DSPose.read_value(mem_accessor, offset)
    value10 = DSPose.read_value(mem_accessor, offset)
    value11 = DSPose.read_value(mem_accessor, offset)
    value12 = DSPose.read_value(mem_accessor, offset)
    value13 = DSPose.read_value(mem_accessor, offset)
    value14 = DSPose.read_value(mem_accessor, offset)
    value15 = DSPose.read_value(mem_accessor, offset)
    value16 = DSPose.read_value(mem_accessor, offset)
    value17 = DSPose.read_value(mem_accessor, offset)
    value18 = DSPose.read_value(mem_accessor, offset)
    value19 = DSPose.read_value(mem_accessor, offset)
    value20 = DSPose.read_value(mem_accessor, offset)
    value21 = DSPose.read_value(mem_accessor, offset)
    value22 = DSPose.read_value(mem_accessor, offset)
    value23 = DSPose.read_value(mem_accessor, offset)
    return [value0, value1, value2, value3, value4, value5, value6, value7, value8, value9, value10, value11, value12, value13, value14, value15, value16, value17, value18, value19, value20, value21, value22, value23]

  @staticmethod
  def write_value(val: typing.List[Pose], mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> None:
    DSPose.write_value(val[0], mem_accessor, offset)
    DSPose.write_value(val[1], mem_accessor, offset)
    DSPose.write_value(val[2], mem_accessor, offset)
    DSPose.write_value(val[3], mem_accessor, offset)
    DSPose.write_value(val[4], mem_accessor, offset)
    DSPose.write_value(val[5], mem_accessor, offset)
    DSPose.write_value(val[6], mem_accessor, offset)
    DSPose.write_value(val[7], mem_accessor, offset)
    DSPose.write_value(val[8], mem_accessor, offset)
    DSPose.write_value(val[9], mem_accessor, offset)
    DSPose.write_value(val[10], mem_accessor, offset)
    DSPose.write_value(val[11], mem_accessor, offset)
    DSPose.write_value(val[12], mem_accessor, offset)
    DSPose.write_value(val[13], mem_accessor, offset)
    DSPose.write_value(val[14], mem_accessor, offset)
    DSPose.write_value(val[15], mem_accessor, offset)
    DSPose.write_value(val[16], mem_accessor, offset)
    DSPose.write_value(val[17], mem_accessor, offset)
    DSPose.write_value(val[18], mem_accessor, offset)
    DSPose.write_value(val[19], mem_accessor, offset)
    DSPose.write_value(val[20], mem_accessor, offset)
    DSPose.write_value(val[21], mem_accessor, offset)
    DSPose.write_value(val[22], mem_accessor, offset)
    DSPose.write_value(val[23], mem_accessor, offset)

@dataclasses.dataclass
class DSVector3_21:
  @staticmethod
  def read_value(mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> typing.List[Vector3]:
    value0 = DSVector3.read_value(mem_accessor, offset)
    value1 = DSVector3.read_value(mem_accessor, offset)
    value2 = DSVector3.read_value(mem_accessor, offset)
    value3 = DSVector3.read_value(mem_accessor, offset)
    value4 = DSVector3.read_value(mem_accessor, offset)
    value5 = DSVector3.read_value(mem_accessor, offset)
    value6 = DSVector3.read_value(mem_accessor, offset)
    value7 = DSVector3.read_value(mem_accessor, offset)
    value8 = DSVector3.read_value(mem_accessor, offset)
    value9 = DSVector3.read_value(mem_accessor, offset)
    value10 = DSVector3.read_value(mem_accessor, offset)
    value11 = DSVector3.read_value(mem_accessor, offset)
    value12 = DSVector3.read_value(mem_accessor, offset)
    value13 = DSVector3.read_value(mem_accessor, offset)
    value14 = DSVector3.read_value(mem_accessor, offset)
    value15 = DSVector3.read_value(mem_accessor, offset)
    value16 = DSVector3.read_value(mem_accessor, offset)
    value17 = DSVector3.read_value(mem_accessor, offset)
    value18 = DSVector3.read_value(mem_accessor, offset)
    value19 = DSVector3.read_value(mem_accessor, offset)
    value20 = DSVector3.read_value(mem_accessor, offset)
    return [value0, value1, value2, value3, value4, value5, value6, value7, value8, value9, value10, value11, value12, value13, value14, value15, value16, value17, value18, value19, value20]

  @staticmethod
  def write_value(val: typing.List[Vector3], mem_accessor: xrpa_runtime.utils.memory_accessor.MemoryAccessor, offset: xrpa_runtime.utils.memory_accessor.MemoryOffset) -> None:
    DSVector3.write_value(val[0], mem_accessor, offset)
    DSVector3.write_value(val[1], mem_accessor, offset)
    DSVector3.write_value(val[2], mem_accessor, offset)
    DSVector3.write_value(val[3], mem_accessor, offset)
    DSVector3.write_value(val[4], mem_accessor, offset)
    DSVector3.write_value(val[5], mem_accessor, offset)
    DSVector3.write_value(val[6], mem_accessor, offset)
    DSVector3.write_value(val[7], mem_accessor, offset)
    DSVector3.write_value(val[8], mem_accessor, offset)
    DSVector3.write_value(val[9], mem_accessor, offset)
    DSVector3.write_value(val[10], mem_accessor, offset)
    DSVector3.write_value(val[11], mem_accessor, offset)
    DSVector3.write_value(val[12], mem_accessor, offset)
    DSVector3.write_value(val[13], mem_accessor, offset)
    DSVector3.write_value(val[14], mem_accessor, offset)
    DSVector3.write_value(val[15], mem_accessor, offset)
    DSVector3.write_value(val[16], mem_accessor, offset)
    DSVector3.write_value(val[17], mem_accessor, offset)
    DSVector3.write_value(val[18], mem_accessor, offset)
    DSVector3.write_value(val[19], mem_accessor, offset)
    DSVector3.write_value(val[20], mem_accessor, offset)
