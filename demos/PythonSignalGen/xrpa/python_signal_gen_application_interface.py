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

import threading
import xrpa.python_signal_gen_program_interfaces
import xrpa.signal_output_types
import xrpa_runtime.transport.shared_memory_transport_stream

class PythonSignalGenApplicationInterface(xrpa.python_signal_gen_program_interfaces.PythonSignalGenProgramInterfaces):
  def __init__(self):
    super().__init__(xrpa_runtime.transport.shared_memory_transport_stream.SharedMemoryTransportStream("SignalOutputOutput", xrpa.signal_output_types.signal_output_data_store_config.transport_config), xrpa_runtime.transport.shared_memory_transport_stream.SharedMemoryTransportStream("SignalOutputInput", xrpa.signal_output_types.signal_output_data_store_config.transport_config))
    self._thread = threading.Thread(target=self._background_tick_thread)
    self._thread.start()

  def shutdown(self) -> None:
    self.stop()
    self._thread.join()
