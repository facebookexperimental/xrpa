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


from typing import TYPE_CHECKING, TypeVar, Union

from xrpa_runtime.utils.memory_accessor import (
    MemoryAccessor,
    MemoryArray,
    MemoryOffset,
    MemoryUtils,
)

if TYPE_CHECKING:
    from xrpa_runtime.signals.signal_ring_buffer import SignalRingBuffer

T = TypeVar("T")


class SignalTypeInference:
    """Utility class for inferring signal sample types."""

    @staticmethod
    def infer_sample_type(type_name: str) -> int:
        type_map = {
            "float": 0,
            "int": 1,
            "short": 2,
            "sbyte": 3,
            "uint": 4,
            "ushort": 5,
            "byte": 6,
        }

        if type_name not in type_map:
            raise ValueError(f"Unsupported sample type: {type_name}")

        return type_map[type_name]


class SignalChannelData:
    """Handles signal channel data operations."""

    def __init__(
        self,
        mem_accessor: MemoryAccessor,
        frame_count: int,
        num_channels: int,
        type_name: str,
    ):
        """
        Initialize a SignalChannelData instance.

        Args:
            mem_accessor: Memory accessor for the channel data
            frame_count: Number of frames in the channel
            num_channels: Number of channels
            type_name: Type of the sample data (float, int, etc.)
        """
        self._mem_accessor = mem_accessor
        self._frame_count = frame_count
        self._num_channels = num_channels
        self._type_name = type_name

    def get_num_channels(self) -> int:
        """Get the number of channels."""
        return self._num_channels

    def get_frame_count(self) -> int:
        """Get the number of frames."""
        return self._frame_count

    def get_channel_buffer_size(self) -> int:
        """Get the size of a single channel buffer in bytes."""
        return MemoryUtils.get_type_size(self._type_name) * self._frame_count

    def read_channel_data(
        self,
        channel_idx: int,
        dst: Union[MemoryArray, list],
        dst_start_offset: int,
        dst_count: int,
        dst_stride: int = 1,
    ) -> None:
        """
        Read data from a specific channel into a destination buffer.

        Args:
            channel_idx: Index of the channel to read from
            dst: Destination buffer (MemoryArray or list)
            dst_start_offset: Starting offset in the destination buffer
            dst_count: Number of frames to read
            dst_stride: Stride between samples in the destination buffer
        """
        src = self.access_channel_buffer(channel_idx)
        fill_count = min(self._frame_count, dst_count) if not src.is_null() else 0

        # Copy available data
        for i in range(fill_count):
            dst[dst_start_offset + i * dst_stride] = src[i]

        # Fill remaining with zeros
        for i in range(fill_count, dst_count):
            dst[dst_start_offset + i * dst_stride] = 0

    def write_channel_data(
        self, channel_idx: int, src: Union[MemoryArray, list], src_count: int
    ) -> None:
        """
        Write data to a specific channel from a source buffer.

        Args:
            channel_idx: Index of the channel to write to
            src: Source buffer (MemoryArray or list)
            src_count: Number of frames to write
        """
        dst = self.access_channel_buffer(channel_idx)
        if not dst.is_null():
            self._copy_sample_data(src, src_count, dst, self._frame_count)

    def consume_from_ring_buffer(self, ring_buffer: "SignalRingBuffer") -> None:
        """
        Consume data from a ring buffer.

        Args:
            ring_buffer: The ring buffer to consume from
        """
        channel_buffer_size = self.get_channel_buffer_size()
        out_data = self._mem_accessor.slice(
            0, channel_buffer_size * self._num_channels
        ).get_array(self._type_name)
        ring_buffer.read_deinterleaved_data(
            out_data, self._frame_count, self._frame_count
        )

    def clear_unused_channels(
        self, start_channel_idx: int, used_channel_count: int
    ) -> None:
        """
        Clear unused channels.

        Args:
            start_channel_idx: Starting channel index
            used_channel_count: Number of channels that are used
        """
        # Clear channels before the start index
        for i in range(start_channel_idx):
            dst = self.access_channel_buffer(i)
            if not dst.is_null():
                for j in range(self._frame_count):
                    dst[j] = 0

        # Clear channels after the used channels
        for i in range(start_channel_idx + used_channel_count, self._num_channels):
            dst = self.access_channel_buffer(i)
            if not dst.is_null():
                for j in range(self._frame_count):
                    dst[j] = 0

    def access_channel_buffer(self, channel_idx: int) -> MemoryArray:
        """
        Access a specific channel buffer.

        Args:
            channel_idx: Index of the channel to access

        Returns:
            MemoryArray: The channel buffer
        """
        if channel_idx < 0 or channel_idx >= self.get_num_channels():
            return MemoryArray(MemoryAccessor(), self._type_name)

        channel_buffer_size = self.get_channel_buffer_size()
        offset = channel_idx * channel_buffer_size
        return self._mem_accessor.slice(offset).get_array(self._type_name)

    def _copy_sample_data(
        self,
        src: Union[MemoryArray, list],
        src_count: int,
        dst: MemoryArray,
        dst_count: int,
    ) -> None:
        """
        Copy sample data from source to destination.

        Args:
            src: Source buffer (MemoryArray or list)
            src_count: Number of samples in source
            dst: Destination buffer
            dst_count: Number of samples in destination
        """
        copy_count = min(src_count, dst_count)

        # Copy available data
        for i in range(copy_count):
            dst[i] = src[i]

        # Fill remaining with zeros
        if src_count < dst_count:
            for i in range(src_count, dst_count):
                dst[i] = 0


class SignalPacket:
    """Represents a packet of signal data."""

    HEADER_SIZE = 16

    def __init__(self, mem_accessor: MemoryAccessor):
        """
        Initialize a SignalPacket instance.

        Args:
            mem_accessor: Memory accessor for the packet data
        """
        self._mem_accessor = mem_accessor

    def get_frame_count(self) -> int:
        """Get the number of frames in the packet."""
        offset = MemoryOffset(0)
        return self._mem_accessor.read_int(offset)

    def set_frame_count(self, frame_count: int) -> None:
        """Set the number of frames in the packet."""
        offset = MemoryOffset(0)
        self._mem_accessor.write_int(frame_count, offset)

    def get_sample_type(self) -> int:
        """Get the sample type identifier."""
        offset = MemoryOffset(4)
        return self._mem_accessor.read_int(offset)

    def set_sample_type(self, sample_type: int) -> None:
        """Set the sample type identifier."""
        offset = MemoryOffset(4)
        self._mem_accessor.write_int(sample_type, offset)

    def get_num_channels(self) -> int:
        """Get the number of channels."""
        offset = MemoryOffset(8)
        return self._mem_accessor.read_int(offset)

    def set_num_channels(self, num_channels: int) -> None:
        """Set the number of channels."""
        offset = MemoryOffset(8)
        self._mem_accessor.write_int(num_channels, offset)

    def get_frame_rate(self) -> int:
        """Get the frame rate (frames per second)."""
        offset = MemoryOffset(12)
        return self._mem_accessor.read_int(offset)

    def set_frame_rate(self, frames_per_second: int) -> None:
        """Set the frame rate (frames per second)."""
        offset = MemoryOffset(12)
        self._mem_accessor.write_int(frames_per_second, offset)

    def access_channel_data(self, type_name: str) -> SignalChannelData:
        """
        Access the channel data with the specified type.

        Args:
            type_name: Type of the sample data (float, int, etc.)

        Returns:
            SignalChannelData: The channel data
        """
        return SignalChannelData(
            self._mem_accessor.slice(self.HEADER_SIZE),
            self.get_frame_count(),
            self.get_num_channels(),
            type_name,
        )

    def copy_channel_data_from(self, src: "SignalPacket") -> None:
        """
        Copy channel data from another packet.

        Args:
            src: Source packet
        """
        self._mem_accessor.slice(self.HEADER_SIZE).copy_from(
            src._mem_accessor.slice(self.HEADER_SIZE)
        )

    @staticmethod
    def calc_packet_size(num_channels: int, sample_size: int, frame_count: int) -> int:
        """
        Calculate the size of a packet.

        Args:
            num_channels: Number of channels
            sample_size: Size of each sample in bytes
            frame_count: Number of frames

        Returns:
            int: The packet size in bytes
        """
        return SignalPacket.HEADER_SIZE + (num_channels * sample_size * frame_count)
