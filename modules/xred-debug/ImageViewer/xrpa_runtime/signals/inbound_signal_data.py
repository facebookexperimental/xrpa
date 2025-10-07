# @generated
# (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.


from typing import List

from xrpa_runtime.signals.signal_ring_buffer import SignalRingBuffer
from xrpa_runtime.signals.signal_shared import SignalPacket, SignalTypeInference

from xrpa_runtime.utils.allocated_memory import AllocatedMemory
from xrpa_runtime.utils.memory_accessor import MemoryAccessor, MemoryUtils


class InboundSignalDataInterface:
    def on_signal_data(self, _timestamp: int, _mem_accessor: MemoryAccessor) -> None:
        pass


class InboundSignalData(InboundSignalDataInterface):
    """
    Handles incoming signal data.

    This class receives signal data packets, processes them, and makes them available
    for reading through a ring buffer.
    """

    def __init__(
        self,
        num_channels: int,
        frames_per_second: int,
        type_name: str,
        warmup_time_in_seconds: float = 0.0,
    ):
        """
        Initialize an InboundSignalData instance.

        Args:
            num_channels: Number of audio channels
            frames_per_second: Sample rate in frames per second
            type_name: Type of the sample data (float, int, etc.)
            warmup_time_in_seconds: Time to collect samples before starting to output data
        """
        self._type_name = type_name
        sample_size = MemoryUtils.get_type_size(type_name)
        self._sample_type = SignalTypeInference.infer_sample_type(type_name)
        self._frames_per_second = frames_per_second
        self._num_channels = num_channels

        warmup_frames = int(warmup_time_in_seconds * frames_per_second)
        max_frames_in_buffer = max(warmup_frames * 2, frames_per_second)

        self._ring_buffer = SignalRingBuffer()
        self._ring_buffer.initialize(
            max_frames_in_buffer, warmup_frames, num_channels, type_name
        )

        self._temp_buffer_mem = AllocatedMemory(max_frames_in_buffer * sample_size)
        self._temp_data = self._temp_buffer_mem.accessor.get_array(type_name)

    def dispose(self) -> None:
        """Release resources used by the inbound signal data."""
        self._temp_data = None
        self._temp_buffer_mem = None
        self._ring_buffer.dispose()

    def on_signal_data(self, _timestamp: int, mem_accessor: MemoryAccessor) -> None:
        """
        Process incoming signal data.

        Args:
            timestamp: Timestamp of the signal data
            mem_accessor: Memory accessor for the signal data
        """
        packet = SignalPacket(mem_accessor)
        sample_type = packet.get_sample_type()
        frames_per_second = packet.get_frame_rate()
        channel_data_in = packet.access_channel_data(self._type_name)

        if (
            sample_type != self._sample_type
            or frames_per_second != self._frames_per_second
        ):
            # TODO: Convert the data if types don't match
            return

        # Make sure not to overflow the ring buffer (discard extra samples)
        frame_count = min(
            self._ring_buffer.get_write_frames_available(), packet.get_frame_count()
        )

        # Read and interleave the data into a temp buffer
        for i in range(self._num_channels):
            channel_data_in.read_channel_data(
                i, self._temp_data, i, frame_count, self._num_channels
            )

        # Write the interleaved data into the ring buffer
        self._ring_buffer.write_interleaved_data(self._temp_data, frame_count)

    def get_read_frames_available(self) -> int:
        """
        Get the number of frames available for reading.

        Returns:
            int: Number of frames available
        """
        return self._ring_buffer.get_read_frames_available()

    def read_interleaved_data(self, output_buffer: List, frames_needed: int) -> bool:
        """
        Read interleaved data from the buffer.

        Args:
            output_buffer: Buffer to store the read data
            frames_needed: Number of frames to read

        Returns:
            bool: False if the buffer underflowed, True otherwise
        """
        total_samples = self._num_channels * frames_needed
        filled = self._ring_buffer.read_interleaved_data(self._temp_data, frames_needed)

        for i in range(total_samples):
            output_buffer[i] = self._temp_data[i]

        return filled

    def read_deinterleaved_data(
        self, output_buffer: List, frames_needed: int, output_stride: int
    ) -> bool:
        """
        Read deinterleaved data from the buffer.

        Args:
            output_buffer: Buffer to store the read data
            frames_needed: Number of frames to read
            output_stride: Stride between samples in the output buffer

        Returns:
            bool: False if the buffer underflowed, True otherwise
        """
        filled = self._ring_buffer.read_deinterleaved_data(
            self._temp_data, frames_needed, output_stride
        )

        for frame_idx in range(frames_needed):
            for channel_idx in range(self._num_channels):
                output_buffer[channel_idx * output_stride + frame_idx] = (
                    self._temp_data[channel_idx * output_stride + frame_idx]
                )

        return filled
