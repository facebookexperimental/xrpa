# (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .bitstream_reader import BitStreamReader


class IBitStreamCompression(ABC):
    """Abstract base class for integer compression."""

    @abstractmethod
    def decode(self, reader: "BitStreamReader") -> int:
        pass


class UncompressedBitStream(IBitStreamCompression):
    """No compression - reads raw 32-bit values."""

    def decode(self, reader: "BitStreamReader") -> int:
        reader.fill_bit_buffer()
        return reader.read_raw_bits_internal(32)


class VarInt8BitStreamCompression(IBitStreamCompression):
    """Variable-length integer compression using 8-bit chunks."""

    def decode(self, reader: "BitStreamReader") -> int:
        result = 0
        shift = 0

        while True:
            reader.fill_bit_buffer()
            byte_val = reader.read_raw_bits_internal(8)
            result |= (byte_val & 0x7F) << shift

            if (byte_val & 0x80) == 0:
                break

            shift += 7
            if shift >= 32:
                return 0

        return result


class VarInt5BitStreamCompression(IBitStreamCompression):
    """Variable-length integer compression using 5-bit chunks."""

    def decode(self, reader: "BitStreamReader") -> int:
        result = 0
        shift = 0

        while True:
            reader.fill_bit_buffer()
            byte_val = reader.read_raw_bits_internal(5)
            result |= (byte_val & 0xF) << shift

            if (byte_val & 0x10) == 0:
                break

            shift += 4
            if shift >= 32:
                return 0

        return result


class BucketedBitStreamCompression(IBitStreamCompression):
    """Bucketed compression for small values."""

    NUM_BUCKETS = 7
    ID = [0, 1, 4, 5, 6, 7, 3]
    ID_BITS = [1, 1, 2, 2, 2, 2, 2]
    VALUE_BITS = [0, 6, 8, 14, 20, 26, 32]
    VALUE_OFFSETS = [0, 1, 65, 321, 16705, 1065025, 68165665]

    @staticmethod
    def reverse_bits(value: int, num_bits: int) -> int:
        """Reverse the bits in a value."""
        result = 0
        for _ in range(num_bits):
            result = (result << 1) | (value & 1)
            value >>= 1
        return result

    def decode(self, reader: "BitStreamReader") -> int:
        reader.fill_bit_buffer()

        bucket_id = reader.read_raw_bits_internal(self.ID_BITS[0])
        if bucket_id == 1:
            reader.fill_bit_buffer()
            next_bits = self.reverse_bits(reader.read_raw_bits_internal(2), 2)
            bucket_id = 4 | next_bits

        bucket_index = self._get_bucket_index_for_id(bucket_id)
        reader.fill_bit_buffer()
        value = self.VALUE_OFFSETS[bucket_index] + reader.read_raw_bits_internal(
            self.VALUE_BITS[bucket_index]
        )
        return value

    def _get_bucket_index_for_id(self, bucket_id: int) -> int:
        """Get the bucket index for a given ID."""
        for i in range(self.NUM_BUCKETS):
            if bucket_id == self.ID[i]:
                return i
        return -1


class IFloatCompression(ABC):
    """Abstract base class for float compression."""

    @abstractmethod
    def decode_float(self, reader: "BitStreamReader") -> float:
        pass


class FloatUncompressed(IFloatCompression):
    """No compression - reads raw 32-bit floats."""

    def decode_float(self, reader: "BitStreamReader") -> float:
        return reader.read_float()


class HalfFloatCompression(IFloatCompression):
    """Half precision (16-bit) float compression."""

    def decode_float(self, reader: "BitStreamReader") -> float:
        return self._f16_to_f32(reader.read_raw_bits(16))

    @staticmethod
    def _f16_to_f32(h: int) -> float:
        """Convert half precision float to full precision."""
        sign = (h >> 15) & 0x1
        exponent = (h >> 10) & 0x1F
        mantissa = h & 0x3FF

        if exponent == 0:
            if mantissa == 0:
                return (-1.0) ** sign * 0.0
            else:
                return (-1.0) ** sign * (mantissa / 1024.0) * (2.0**-14)
        elif exponent == 31:
            if mantissa == 0:
                return (-1.0) ** sign * float("inf")
            else:
                return float("nan")
        else:
            return (-1.0) ** sign * (1.0 + mantissa / 1024.0) * (2.0 ** (exponent - 15))


class NormalizedFloatCompression(IFloatCompression):
    """Normalized float compression for values in [-1, 1]."""

    def __init__(self, bits: int = 10):
        self.bits = bits

    def decode_float(self, reader: "BitStreamReader") -> float:
        quantized = reader.read_raw_bits(self.bits)
        return self._dequantize_n(quantized, self.bits)

    @staticmethod
    def _dequantize_n(quantized: int, bits: int) -> float:
        """Dequantize a normalized value from bits."""
        max_val = (1 << bits) - 1
        return (quantized / max_val) * 2.0 - 1.0


class IQuaternionCompression(ABC):
    """Abstract base class for quaternion compression."""

    @abstractmethod
    def decode_quaternion(self, reader: "BitStreamReader") -> tuple:
        pass


class QuaternionUncompressed(IQuaternionCompression):
    """No compression - reads raw quaternion."""

    def decode_quaternion(self, reader: "BitStreamReader") -> tuple:
        return reader.read_quaternion()


class QuaternionSmallest3(IQuaternionCompression):
    """Smallest 3 quaternion compression."""

    def __init__(self, bits: int = 10):
        self.bits = bits

    def decode_quaternion(self, reader: "BitStreamReader") -> tuple:
        max_index = reader.read_raw_bits(2)
        q0 = reader.read_raw_bits(self.bits)
        q1 = reader.read_raw_bits(self.bits)
        q2 = reader.read_raw_bits(self.bits)

        d0 = self._dequantize_n(q0, self.bits)
        d1 = self._dequantize_n(q1, self.bits)
        d2 = self._dequantize_n(q2, self.bits)

        sum_squares = d0 * d0 + d1 * d1 + d2 * d2
        missing = (max(0.0, 1.0 - sum_squares)) ** 0.5

        comp = [0.0, 0.0, 0.0, 0.0]
        j = 0
        for i in range(4):
            if i == max_index:
                comp[i] = missing
            else:
                comp[i] = [d0, d1, d2][j]
                j += 1

        return (comp[0], comp[1], comp[2], comp[3])

    @staticmethod
    def _dequantize_n(quantized: int, bits: int) -> float:
        """Dequantize a normalized value from bits."""
        max_val = (1 << bits) - 1
        return (quantized / max_val) * 2.0 - 1.0
