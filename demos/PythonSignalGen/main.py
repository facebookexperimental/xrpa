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

import sys
from math import pi, sin

from xrpa.python_signal_gen_application_interface import (
    PythonSignalGenApplicationInterface,
)
from xrpa.signal_output_types import DeviceBindingType

from xrpa_runtime.signals.signal_shared import SignalChannelData


def signal_gen(data: SignalChannelData, sample_rate: int, start_sample_pos: int):
    # generate a sine wave in each channel
    freq = 440
    gain = 0.5
    frame_count = data.get_frame_count()
    for i in range(data.get_num_channels()):
        channel_data = data.access_channel_buffer(i)
        for j in range(frame_count):
            channel_data[j] = gain * sin(
                2 * pi * freq * (j + start_sample_pos) / sample_rate
            )


def main():
    app = PythonSignalGenApplicationInterface()

    def create_output():
        output = app.signal_output_data_store.SignalOutputSource.create_object()
        output.set_signal_callback(signal_gen, "float", 2, 44100, 441)
        output.set_bind_to(DeviceBindingType.SystemAudio)

    app.transact(create_output)

    sys.stdin.readline()
    app.shutdown()


if __name__ == "__main__":
    main()
    sys.exit(0)
