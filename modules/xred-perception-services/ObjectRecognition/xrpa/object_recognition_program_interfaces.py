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

import xrpa.object_recognition_data_store
import xrpa_runtime.utils.xrpa_module

class ObjectRecognitionProgramInterfaces(xrpa_runtime.utils.xrpa_module.XrpaModule):
  def __init__(self, objectrecognition_inbound_transport: xrpa_runtime.transport.transport_stream.TransportStream, objectrecognition_outbound_transport: xrpa_runtime.transport.transport_stream.TransportStream):
    super().__init__()
    self.object_recognition_data_store = xrpa.object_recognition_data_store.ObjectRecognitionDataStore(objectrecognition_inbound_transport, objectrecognition_outbound_transport)

  def __del__(self):
    self.shutdown()

  def _tick_inputs(self) -> None:
    self.object_recognition_data_store.tick_inbound()

  def _tick_outputs(self) -> None:
    self.object_recognition_data_store.tick_outbound()

  def _shutdown(self) -> None:
    self.object_recognition_data_store.shutdown()
