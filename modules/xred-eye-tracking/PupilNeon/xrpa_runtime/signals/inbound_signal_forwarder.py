# Copyright (c) Meta Platforms, Inc. and affiliates.
# @generated
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


from typing import TYPE_CHECKING

from xrpa_runtime.signals.inbound_signal_data import InboundSignalDataInterface
from xrpa_runtime.signals.signal_shared import SignalPacket

from xrpa_runtime.utils.memory_accessor import MemoryAccessor

if TYPE_CHECKING:
    from xrpa_runtime.signals.outbound_signal_data import OutboundSignalData


class InboundSignalForwarder(InboundSignalDataInterface):
    """
    Forwards inbound signal data to multiple recipients.

    This class receives signal data and forwards it to registered OutboundSignalData recipients.
    """

    def __init__(self):
        """Initialize a new InboundSignalForwarder instance."""
        self._recipients = []

    def add_recipient(self, recipient: "OutboundSignalData") -> None:
        """
        Add a recipient to receive forwarded signal data.

        Args:
            recipient: The OutboundSignalData instance to receive the signal data
        """
        self._recipients.append(recipient)

    def on_signal_data(self, _timestamp: int, mem_accessor: MemoryAccessor) -> None:
        """
        Process incoming signal data and forward it to all recipients.

        Args:
            timestamp: Timestamp of the signal data (unused)
            mem_accessor: Memory accessor for the signal data
        """
        inbound_packet = SignalPacket(mem_accessor)
        frame_count = inbound_packet.get_frame_count()
        sample_type = inbound_packet.get_sample_type()
        num_channels = inbound_packet.get_num_channels()
        frame_rate = inbound_packet.get_frame_rate()

        # Determine sample size based on sample type
        sample_size = 4  # Default size (float, int, uint)
        if sample_type in [2, 5]:  # short, ushort
            sample_size = 2
        elif sample_type in [3, 6]:  # sbyte, byte
            sample_size = 1

        # Forward the signal data to all recipients
        for recipient in self._recipients:
            outbound_packet = recipient.send_signal_packet(
                sample_size, frame_count, sample_type, num_channels, frame_rate
            )
            outbound_packet.copy_channel_data_from(inbound_packet)
