# (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.

import struct
from typing import Tuple, TYPE_CHECKING

if TYPE_CHECKING:
    from .compression import (
        IBitStreamCompression,
        IFloatCompression,
        IQuaternionCompression,
    )


class BitStreamReader:
    """
    Python implementation of LiveStack's BitStream reading logic.
    Reads packed integers, floats, vectors from binary data.
    Port of Unity's DataStreamReader class to ensure parity between C# and C++ implementations.
    """

    def __init__(self, data: bytes):
        self.buffer = data
        self.length = len(data)
        self.read_byte_index = 0
        self.bit_index = 0
        self.bit_buffer = 0
        self.failed_reads = 0

    def get_bytes_read(self) -> int:
        """Get the number of bytes read."""
        return self.read_byte_index - (self.bit_index >> 3)

    def get_bits_read(self) -> int:
        """Get the number of bits read."""
        return (self.read_byte_index << 3) - self.bit_index

    def fill_bit_buffer(self):
        """Fill the bit buffer with bytes from the stream."""
        while self.bit_index <= 56 and self.read_byte_index < self.length:
            self.bit_buffer |= self.buffer[self.read_byte_index] << self.bit_index
            self.read_byte_index += 1
            self.bit_index += 8

    def read_raw_bits_internal(self, numbits: int) -> int:
        """Read raw bits from the bit buffer without filling."""
        if self.bit_index < numbits:
            self.failed_reads += 1
            return 0

        mask = (1 << numbits) - 1
        res = self.bit_buffer & mask
        self.bit_buffer >>= numbits
        self.bit_index -= numbits
        return res

    def read_raw_bits(self, numbits: int) -> int:
        """Read raw bits from the stream."""
        self.fill_bit_buffer()
        return self.read_raw_bits_internal(numbits)

    def read_next_field_populated(self) -> bool:
        """Check if the next field is populated (delta encoding)."""
        self.fill_bit_buffer()
        return self.read_raw_bits_internal(1) == 1

    def read_packed_bool(self) -> bool:
        """Read a boolean value."""
        self.fill_bit_buffer()
        return self.read_raw_bits_internal(1) == 1

    @staticmethod
    def zigzag_decode_32(v: int) -> int:
        """Zigzag decode a 32-bit signed integer."""
        return (v >> 1) ^ (~(v & 1) + 1)

    @staticmethod
    def zigzag_decode_64(v: int) -> int:
        """Zigzag decode a 64-bit signed integer."""
        return (v >> 1) ^ (~(v & 1) + 1)

    @staticmethod
    def as_float(bits: int) -> float:
        """Convert raw bits to a 32-bit float."""
        return struct.unpack("f", struct.pack("I", bits))[0]

    @staticmethod
    def as_double(bits: int) -> float:
        """Convert raw bits to a 64-bit double."""
        return struct.unpack("d", struct.pack("Q", bits))[0]

    def read_float(self) -> float:
        """Read a 32-bit float."""
        return self.as_float(self.read_raw_bits(32))

    def read_vector3(self) -> Tuple[float, float, float]:
        """Read a 3D vector (3 floats)."""
        x = self.read_float()
        y = self.read_float()
        z = self.read_float()
        return (x, y, z)

    def read_quaternion(self) -> Tuple[float, float, float, float]:
        """Read a quaternion (w, x, y, z)."""
        w = self.read_float()
        x = self.read_float()
        y = self.read_float()
        z = self.read_float()
        return (w, x, y, z)

    def read_packed_double(self) -> float:
        """Read a packed double with delta encoding."""
        return self.read_packed_double_delta(0.0)

    def read_packed_double_delta(self, baseline: float) -> float:
        """Read a packed double with delta encoding from a baseline."""
        self.fill_bit_buffer()
        if not self.read_next_field_populated():
            return baseline

        lower_bits = self.read_raw_bits_internal(32)
        self.fill_bit_buffer()
        upper_bits = self.read_raw_bits_internal(32)

        combined = (upper_bits << 32) | lower_bits
        return self.as_double(combined)

    def read_packed_uint32(self, compression: "IBitStreamCompression") -> int:
        """Read a packed unsigned 32-bit integer."""
        return compression.decode(self)

    def read_packed_int32(self, compression: "IBitStreamCompression") -> int:
        """Read a packed signed 32-bit integer."""
        folded = self.read_packed_uint32(compression)
        return self.zigzag_decode_32(folded)

    def read_packed_uint32_delta(
        self, baseline: int, compression: "IBitStreamCompression"
    ) -> int:
        """Read a packed unsigned 32-bit integer with delta encoding."""
        self.fill_bit_buffer()
        delta = self.read_packed_int32(compression)
        return baseline - delta

    def read_packed_int32_delta(
        self, baseline: int, compression: "IBitStreamCompression"
    ) -> int:
        """Read a packed signed 32-bit integer with delta encoding."""
        self.fill_bit_buffer()
        delta = self.read_packed_int32(compression)
        return baseline - delta

    def read_packed_uint64(self, compression: "IBitStreamCompression") -> int:
        """Read a packed unsigned 64-bit integer."""
        lower_bits = self.read_packed_uint32(compression)
        upper_bits = self.read_packed_uint32(compression)
        return (upper_bits << 32) | lower_bits

    def read_packed_int64(self, compression: "IBitStreamCompression") -> int:
        """Read a packed signed 64-bit integer."""
        folded = self.read_packed_uint64(compression)
        return self.zigzag_decode_64(folded)

    def read_packed_uint64_delta(
        self, baseline: int, compression: "IBitStreamCompression"
    ) -> int:
        """Read a packed unsigned 64-bit integer with delta encoding."""
        self.fill_bit_buffer()
        delta = self.read_packed_int64(compression)
        return baseline - delta

    def read_packed_int64_delta(
        self, baseline: int, compression: "IBitStreamCompression"
    ) -> int:
        """Read a packed signed 64-bit integer with delta encoding."""
        self.fill_bit_buffer()
        delta = self.read_packed_int64(compression)
        return baseline - delta

    def read_packed_float(self, compression: "IFloatCompression") -> float:
        """Read a packed float."""
        return self.read_packed_float_delta(0.0, compression)

    def read_packed_float_delta(
        self, baseline: float, compression: "IFloatCompression"
    ) -> float:
        """Read a packed float with delta encoding."""
        self.fill_bit_buffer()
        if not self.read_next_field_populated():
            return baseline
        return compression.decode_float(self)

    def read_packed_vector3(
        self, compression: "IFloatCompression"
    ) -> Tuple[float, float, float]:
        """Read a packed 3D vector."""
        return self.read_packed_vector3_delta((0.0, 0.0, 0.0), compression)

    def read_packed_vector3_delta(
        self, baseline: Tuple[float, float, float], compression: "IFloatCompression"
    ) -> Tuple[float, float, float]:
        """Read a packed 3D vector with delta encoding."""
        x = self.read_packed_float_delta(baseline[0], compression)
        y = self.read_packed_float_delta(baseline[1], compression)
        z = self.read_packed_float_delta(baseline[2], compression)
        return (x, y, z)

    def read_packed_quaternion(
        self, compression: "IQuaternionCompression"
    ) -> Tuple[float, float, float, float]:
        """Read a packed quaternion."""
        return self.read_packed_quaternion_delta((1.0, 0.0, 0.0, 0.0), compression)

    def read_packed_quaternion_delta(
        self,
        baseline: Tuple[float, float, float, float],
        compression: "IQuaternionCompression",
    ) -> Tuple[float, float, float, float]:
        """Read a packed quaternion with delta encoding."""
        if not self.read_next_field_populated():
            return baseline
        return compression.decode_quaternion(self)

    def read_se3(
        self,
    ) -> Tuple[Tuple[float, float, float, float], Tuple[float, float, float]]:
        """Read an SE3 transform (quaternion + translation)."""
        q = self.read_quaternion()
        t = self.read_vector3()
        return (q, t)

    def read_packed_se3(
        self,
        compression: "IFloatCompression",
        quaternion_compression: "IQuaternionCompression",
    ) -> Tuple[Tuple[float, float, float, float], Tuple[float, float, float]]:
        """Read a packed SE3 transform."""
        identity = ((1.0, 0.0, 0.0, 0.0), (0.0, 0.0, 0.0))
        return self.read_packed_se3_delta(identity, compression, quaternion_compression)

    def read_packed_se3_delta(
        self,
        baseline: Tuple[Tuple[float, float, float, float], Tuple[float, float, float]],
        compression: "IFloatCompression",
        quaternion_compression: "IQuaternionCompression",
    ) -> Tuple[Tuple[float, float, float, float], Tuple[float, float, float]]:
        """Read a packed SE3 transform with delta encoding."""
        self.fill_bit_buffer()
        if not self.read_next_field_populated():
            return baseline

        q = self.read_packed_quaternion_delta(baseline[0], quaternion_compression)
        t = self.read_packed_vector3_delta(baseline[1], compression)
        return (q, t)

    def read_packed_uuid_pair(
        self, compression: "IBitStreamCompression"
    ) -> Tuple[int, int]:
        """Read a packed UUID pair (two uint64s)."""
        prefix = self.read_packed_uint64(compression)
        suffix = self.read_packed_uint64(compression)
        return (prefix, suffix)

    def read_packed_uuid_pair_delta(
        self, baseline: Tuple[int, int], compression: "IBitStreamCompression"
    ) -> Tuple[int, int]:
        """Read a packed UUID pair with delta encoding."""
        self.fill_bit_buffer()
        if not self.read_next_field_populated():
            return baseline
        return self.read_packed_uuid_pair(compression)

    def read_packed_string(self, compression: "IBitStreamCompression") -> str:
        """Read a packed string."""
        length = self.read_packed_uint32(compression)
        chars = []
        for _ in range(length):
            chars.append(chr(self.read_packed_uint32(compression)))
        return "".join(chars)

    def read_packed_string_delta(
        self, baseline: str, compression: "IBitStreamCompression"
    ) -> str:
        """Read a packed string with delta encoding."""
        self.fill_bit_buffer()
        if not self.read_next_field_populated():
            return baseline
        return self.read_packed_string(compression)
