# @generated
# (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.


from typing import Callable, Union

from xrpa_runtime.reconciler.data_store_interfaces import IObjectCollection

from xrpa_runtime.signals.signal_ring_buffer import SignalRingBuffer
from xrpa_runtime.signals.signal_shared import (
    SignalChannelData,
    SignalPacket,
    SignalTypeInference,
)

from xrpa_runtime.utils.memory_accessor import MemoryUtils
from xrpa_runtime.utils.time_utils import TimeUtils
from xrpa_runtime.utils.xrpa_types import ObjectUuid


# Type for signal producer callback function
SignalProducerCallback = Callable[[SignalChannelData, int, int], None]


class OutboundSignalData:
    def __init__(self):
        self._id = None
        self._collection = None
        self._message_type = 0

        self._signal_source = None
        self._sample_type = 0
        self._sample_size = 4
        self._num_channels = 1
        self._frames_per_second = 0
        self._frames_per_packet = 1024

        # Internal state management
        self._cur_read_pos = 0
        self._prev_frame_start_time = 0
        self._type_name = "float"  # Default type

    def set_signal_source(
        self,
        source: Union[SignalProducerCallback, SignalRingBuffer],
        num_channels: int,
        frames_per_second: int,
        frames_per_packet: int,
        type_name: str,
    ) -> None:
        if isinstance(source, SignalRingBuffer):

            def signal_source_rb_wrapper(packet: SignalPacket) -> None:
                channel_data = packet.access_channel_data(type_name)
                channel_data.consume_from_ring_buffer(source)

            self._signal_source = signal_source_rb_wrapper
        else:

            def signal_source_cb_wrapper(packet: SignalPacket) -> None:
                channel_data = packet.access_channel_data(type_name)
                source(channel_data, self._frames_per_second, self._cur_read_pos)

            self._signal_source = signal_source_cb_wrapper

        self._set_signal_source_shared(
            num_channels, frames_per_second, frames_per_packet, type_name
        )

    def set_recipient(
        self, obj_id: ObjectUuid, collection: IObjectCollection, message_type: int
    ) -> None:
        self._id = obj_id
        self._collection = collection
        self._message_type = message_type

    def tick(self) -> None:
        end_time_us = TimeUtils.get_current_clock_time_microseconds()
        frame_count = self._get_next_frame_count(end_time_us)

        while frame_count > 0:
            if self._signal_source is not None and self._collection is not None:
                packet = self.send_signal_packet(
                    self._sample_size,
                    frame_count,
                    self._sample_type,
                    self._num_channels,
                    self._frames_per_second,
                )
                self._signal_source(packet)

            self._cur_read_pos += frame_count
            frame_count = self._get_next_frame_count(end_time_us)

    def send_signal_packet(
        self,
        sample_size: int,
        frame_count: int,
        sample_type: int,
        num_channels: int,
        frames_per_second: int,
    ) -> SignalPacket:
        packet_size = SignalPacket.calc_packet_size(
            num_channels, sample_size, frame_count
        )
        mem_accessor = self._collection.send_message(
            self._id, self._message_type, packet_size
        )

        packet = SignalPacket(mem_accessor)
        packet.set_frame_count(frame_count)
        packet.set_sample_type(sample_type)
        packet.set_num_channels(num_channels)
        packet.set_frame_rate(frames_per_second)

        return packet

    def _set_signal_source_shared(
        self,
        num_channels: int,
        frames_per_second: int,
        frames_per_packet: int,
        type_name: str,
    ) -> None:
        self._type_name = type_name
        self._sample_type = SignalTypeInference.infer_sample_type(type_name)
        self._sample_size = MemoryUtils.get_type_size(type_name)
        self._num_channels = num_channels
        self._frames_per_second = frames_per_second
        self._frames_per_packet = frames_per_packet

        self._prev_frame_start_time = TimeUtils.get_current_clock_time_microseconds()

    def _get_next_frame_count(self, end_time_us: int) -> int:
        if self._frames_per_second == 0:
            return 0

        # Generate signal in fixed-size packets of data
        frame_count = (
            0 if end_time_us <= self._prev_frame_start_time else self._frames_per_packet
        )

        # Do NOT set to current clock time, as that will lead to accumulation of error
        self._prev_frame_start_time += (
            frame_count * 1000000
        ) // self._frames_per_second

        return frame_count
