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


import threading
from typing import List, Union

from xrpa_runtime.utils.allocated_memory import AllocatedMemory
from xrpa_runtime.utils.memory_accessor import MemoryArray, MemoryUtils


class SignalRingBuffer:
    """
    A ring buffer implementation for signal data.

    This class provides a thread-safe ring buffer for storing and retrieving signal data.
    It supports both interleaved and deinterleaved data formats.
    """

    def __init__(self):
        """Initialize a new SignalRingBuffer instance."""
        self._mutex = threading.Lock()
        self._ring_buffer_mem = None
        self._temp_buffer_mem = None
        self._ring_buffer = None
        self._temp_buffer = None
        self._ring_buffer_read_pos = 0
        self._ring_buffer_write_pos = 0
        self._num_channels = 1
        self._ring_buffer_size = 0
        self._warmup_frame_count = 0
        self._is_warming_up = True
        self._type_name = None

    def initialize(
        self,
        frame_count: int,
        warmup_frame_count: int,
        num_channels: int,
        type_name: str = "float",
    ) -> None:
        """
        Initialize the ring buffer with the specified parameters.

        Args:
            frame_count: Number of frames to allocate in the buffer
            warmup_frame_count: Number of frames to collect before starting to output data
            num_channels: Number of audio channels
            type_name: Type of the sample data (float, int, etc.)
        """
        self._type_name = type_name
        sample_size = MemoryUtils.get_type_size(type_name)
        self._ring_buffer_size = frame_count * num_channels

        self._ring_buffer_mem = AllocatedMemory(self._ring_buffer_size * sample_size)
        self._temp_buffer_mem = AllocatedMemory(self._ring_buffer_size * sample_size)

        self._ring_buffer = self._ring_buffer_mem.accessor.get_array(type_name)
        self._temp_buffer = self._temp_buffer_mem.accessor.get_array(type_name)

        # Initialize buffer with zeros
        for i in range(self._ring_buffer_size):
            self._ring_buffer[i] = 0

        self._warmup_frame_count = warmup_frame_count
        self._num_channels = num_channels
        self._ring_buffer_read_pos = 0
        self._ring_buffer_write_pos = 0

    def dispose(self) -> None:
        """Release resources used by the ring buffer."""
        # In Python, we don't need to explicitly dispose of memory,
        # but we'll set references to None to help garbage collection
        self._temp_buffer = None
        self._ring_buffer = None
        self._temp_buffer_mem = None
        self._ring_buffer_mem = None

    def get_read_frames_available(self) -> int:
        """
        Get the number of frames available for reading.

        Returns:
            int: Number of frames available
        """
        return self._get_ring_buffer_available_for_read() // self._num_channels

    def get_write_frames_available(self) -> int:
        """
        Get the number of frames available for writing.

        Returns:
            int: Number of frames available
        """
        return self._get_ring_buffer_available_for_write() // self._num_channels

    def read_interleaved_data(
        self, output_buffer: MemoryArray, frames_needed: int
    ) -> bool:
        """
        Read interleaved data from the ring buffer.

        Args:
            output_buffer: Buffer to store the read data
            frames_needed: Number of frames to read

        Returns:
            bool: False if the buffer underflowed, True otherwise
        """
        with self._mutex:
            read_frames_available = self.get_read_frames_available()
            did_underflow = False

            # If we're warming up, don't return any samples until we've reached the threshold
            if self._is_warming_up:
                if read_frames_available < self._warmup_frame_count:
                    read_frames_available = 0
                else:
                    self._is_warming_up = False
            elif read_frames_available < frames_needed:
                self._is_warming_up = True
                did_underflow = True

            # Copy samples from ring buffer to output buffer, filling in 0s for any remaining samples
            frames_from_ring_buffer = min(read_frames_available, frames_needed)
            ring_samples = self._num_channels * frames_from_ring_buffer
            total_samples = self._num_channels * frames_needed

            end_ring_pos = self._ring_buffer_read_pos + ring_samples

            if end_ring_pos > self._ring_buffer_size:
                # The range straddles the end of the ring buffer, so we need to copy in two batches
                output_buffer.copy_from(
                    0,
                    self._ring_buffer,
                    self._ring_buffer_read_pos,
                    self._ring_buffer_size - self._ring_buffer_read_pos,
                )
                output_buffer.copy_from(
                    self._ring_buffer_size - self._ring_buffer_read_pos,
                    self._ring_buffer,
                    0,
                    end_ring_pos - self._ring_buffer_size,
                )

                self._ring_buffer_read_pos = (
                    end_ring_pos - self._ring_buffer_size
                ) % self._ring_buffer_size
            else:
                # The range is entirely within the ring buffer, so we can copy it in one go
                output_buffer.copy_from(
                    0, self._ring_buffer, self._ring_buffer_read_pos, ring_samples
                )

                self._ring_buffer_read_pos = end_ring_pos % self._ring_buffer_size

            # Fill in the remaining samples with 0s
            if ring_samples < total_samples:
                for i in range(ring_samples, total_samples):
                    output_buffer[i] = 0

            return not did_underflow

    def read_deinterleaved_data(
        self,
        output_buffer: Union[MemoryArray, List],
        frames_needed: int,
        output_stride: int,
    ) -> bool:
        """
        Read deinterleaved data from the ring buffer.

        Args:
            output_buffer: Buffer to store the read data
            frames_needed: Number of frames to read
            output_stride: Stride between samples in the output buffer

        Returns:
            bool: False if the buffer underflowed, True otherwise
        """
        filled = self.read_interleaved_data(self._temp_buffer, frames_needed)

        src_index = 0
        for frame_idx in range(frames_needed):
            for channel_idx in range(self._num_channels):
                output_buffer[channel_idx * output_stride + frame_idx] = (
                    self._temp_buffer[src_index]
                )
                src_index += 1

        return filled

    def write_interleaved_data(
        self, input_buffer: Union[MemoryArray, List], frames_to_write: int
    ) -> int:
        """
        Write interleaved data to the ring buffer.

        Args:
            input_buffer: Buffer containing the data to write
            frames_to_write: Number of frames to write

        Returns:
            int: Number of frames actually written
        """
        with self._mutex:
            write_frames_available = self.get_write_frames_available()

            frames_to_ring_buffer = min(frames_to_write, write_frames_available)
            ring_samples = self._num_channels * frames_to_ring_buffer

            end_ring_pos = self._ring_buffer_write_pos + ring_samples

            if end_ring_pos > self._ring_buffer_size:
                # The range straddles the end of the ring buffer, so we need to copy in two batches
                first_batch_samples = (
                    self._ring_buffer_size - self._ring_buffer_write_pos
                )
                second_batch_samples = end_ring_pos - self._ring_buffer_size

                if isinstance(input_buffer, MemoryArray):
                    self._ring_buffer.copy_from(
                        self._ring_buffer_write_pos,
                        input_buffer,
                        0,
                        first_batch_samples,
                    )
                    self._ring_buffer.copy_from(
                        0, input_buffer, first_batch_samples, second_batch_samples
                    )
                else:  # Assume it's a list
                    for i in range(first_batch_samples):
                        self._ring_buffer[self._ring_buffer_write_pos + i] = (
                            input_buffer[i]
                        )
                    for i in range(second_batch_samples):
                        self._ring_buffer[i] = input_buffer[first_batch_samples + i]

                self._ring_buffer_write_pos = second_batch_samples
            else:
                # The range is entirely within the ring buffer, so we can copy it in one go
                if isinstance(input_buffer, MemoryArray):
                    self._ring_buffer.copy_from(
                        self._ring_buffer_write_pos, input_buffer, 0, ring_samples
                    )
                else:  # Assume it's a list
                    for i in range(ring_samples):
                        self._ring_buffer[self._ring_buffer_write_pos + i] = (
                            input_buffer[i]
                        )

                self._ring_buffer_write_pos = end_ring_pos % self._ring_buffer_size

            return frames_to_ring_buffer

    def _get_ring_buffer_available_for_read(self) -> int:
        """
        Get the number of samples available for reading.

        Returns:
            int: Number of samples available
        """
        if self._ring_buffer_write_pos >= self._ring_buffer_read_pos:
            return self._ring_buffer_write_pos - self._ring_buffer_read_pos
        else:
            return (
                self._ring_buffer_write_pos
                + self._ring_buffer_size
                - self._ring_buffer_read_pos
            )

    def _get_ring_buffer_available_for_write(self) -> int:
        """
        Get the number of samples available for writing.

        Returns:
            int: Number of samples available
        """
        if self._ring_buffer_write_pos >= self._ring_buffer_read_pos:
            return self._ring_buffer_size - (
                self._ring_buffer_write_pos - self._ring_buffer_read_pos
            )
        else:
            return self._ring_buffer_read_pos - self._ring_buffer_write_pos
