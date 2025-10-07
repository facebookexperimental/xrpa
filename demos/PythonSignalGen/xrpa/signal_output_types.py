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

import enum
import xrpa_runtime.utils.xrpa_types

class signal_output_data_store_config:
  transport_config = xrpa_runtime.utils.xrpa_types.TransportConfig(xrpa_runtime.utils.xrpa_types.HashValue(0x3a089fe74f7b49b5, 0xc6d3971034f707b0, 0x769c6567e17da92d, 0xe9815c007af8ef81), 10092288)

class SignalOutputDeviceType(enum.Enum):
  Audio = 0
  Haptics = 1

class InputEventType(enum.Enum):
  Release = 0
  Press = 1

class DeviceBindingType(enum.Enum):
  Device = 0
  DeviceByName = 1
  SystemAudio = 2
  TcpStream = 3
