#!/usr/bin/env python3
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

"""
SPMC Ring Buffer Fuzz Test - Python Implementation

Usage:
  python spmc_fuzz_test.py --mode producer --entries 10000 --shm-name test
  python spmc_fuzz_test.py --mode consumer --entries 10000 --shm-name test

Data Protocol (per entry):
  Offset | Size | Field
  -------|------|------------------
  0      | 4    | sequence (uint32, monotonically increasing)
  4      | 4    | checksum (uint32, simple sum of payload bytes)
  8      | 4    | payload_size (uint32, size of payload in bytes)
  12     | ...  | payload (random bytes)
"""

import argparse
import mmap
import os
import random
import struct
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

from xrpa_runtime.utils.memory_accessor import MemoryAccessor, MemoryOffset
from xrpa_runtime.utils.spmc_ring_buffer import SpmcRingBuffer, SpmcRingBufferIterator


# Configuration constants - defaults suitable for image data testing
DEFAULT_BLOCK_SIZE = 1024 * 1024  # 1MB blocks
DEFAULT_BLOCK_COUNT = 4
DEFAULT_ENTRIES = 100
WRITE_DELAY_MS = 1
MAGIC_NUMBER = 0x53504D43  # "SPMC"
VERSION = 1

# Header offsets in shared memory
SHM_MAGIC_OFFSET = 0
SHM_VERSION_OFFSET = 4
SHM_RINGBUF_OFFSET = 8

# Entry header size (sequence + checksum + payload length prefix)
ENTRY_HEADER_SIZE = 12

# Payload size range (in blocks worth of data)
MIN_PAYLOAD_BLOCKS = 0.5
MAX_PAYLOAD_BLOCKS = 3.0


@dataclass
class Config:
    mode: str = ""
    shm_name: str = "xrpa_spmc_fuzz_test"
    entries: int = DEFAULT_ENTRIES
    block_size: int = DEFAULT_BLOCK_SIZE
    block_count: int = DEFAULT_BLOCK_COUNT
    startup_delay_ms: int = 0
    verbose: bool = False


@dataclass
class Statistics:
    entries_written: int = 0
    entries_read: int = 0
    checksum_errors: int = 0
    sequence_errors: int = 0
    missed_entries: int = 0
    stale_reads: int = 0
    min_payload_size: int = field(default_factory=lambda: 2**32 - 1)
    max_payload_size: int = 0
    total_payload_bytes: int = 0
    read_processing_time_us: int = (
        0  # Time spent actually reading/processing (microseconds)
    )
    write_processing_time_us: int = 0  # Time spent actually writing (microseconds)


def compute_checksum(data: bytes, size: int) -> int:
    """Compute simple checksum (sum of bytes)."""
    # Use a memoryview to avoid copying, and sum is optimized for bytes
    return sum(memoryview(data)[:size]) & 0xFFFFFFFF


def get_shared_memory_path(name: str) -> str:
    """Get platform-specific shared memory path."""
    if sys.platform == "win32":
        return name
    return f"/tmp/xrpa/{name}"


def create_directories(path: str) -> None:
    """Create parent directories if they don't exist."""
    if sys.platform != "win32":
        parent = Path(path).parent
        if parent and not parent.exists():
            parent.mkdir(parents=True, exist_ok=True)


def delete_shared_memory(name: str) -> None:
    """Delete existing shared memory file."""
    if sys.platform != "win32":
        path = get_shared_memory_path(name)
        if os.path.exists(path):
            os.unlink(path)


def run_producer(config: Config) -> int:
    """Run the producer."""
    print("=== SPMC Fuzz Test Producer (Python) ===")
    print(f"Shared memory: {config.shm_name}")
    print(f"Entries to write: {config.entries}")

    ring_buf_mem_size = SpmcRingBuffer.get_mem_size(
        config.block_size, config.block_count
    )
    total_size = SHM_RINGBUF_OFFSET + ring_buf_mem_size

    print(f"Ring buffer: {config.block_count} blocks x {config.block_size} bytes")
    print(f"Total shared memory size: {total_size} bytes")

    # Clean up any existing shared memory
    delete_shared_memory(config.shm_name)

    mm: Optional[mmap.mmap] = None
    fd: Optional[int] = None
    mem_view: Optional[memoryview] = None

    try:
        if sys.platform == "win32":
            # Windows: use named shared memory
            mm = mmap.mmap(-1, total_size, tagname=config.shm_name)
        else:
            # Unix: use file-backed mmap
            path = get_shared_memory_path(config.shm_name)
            create_directories(path)

            fd = os.open(path, os.O_RDWR | os.O_CREAT | os.O_TRUNC, 0o666)
            os.ftruncate(fd, total_size)
            mm = mmap.mmap(fd, total_size)

        # Create memoryview for the mmap
        mem_view = memoryview(mm)

        # Initialize ring buffer BEFORE writing magic number
        # This ensures consumers see the magic number only after ring buffer is ready
        mem_accessor = MemoryAccessor(mem_view, 0, total_size)
        ring_buffer = SpmcRingBuffer(mem_accessor, SHM_RINGBUF_OFFSET)
        ring_buffer.init(config.block_size, config.block_count)

        # Now write the magic number and version to signal initialization is complete
        struct.pack_into("<I", mm, SHM_MAGIC_OFFSET, MAGIC_NUMBER)
        struct.pack_into("<I", mm, SHM_VERSION_OFFSET, VERSION)

        # Flush changes
        mm.flush()

        print("Shared memory initialized. Starting writes...")

        # Startup delay to allow consumers to connect
        if config.startup_delay_ms > 0:
            print(f"Waiting {config.startup_delay_ms}ms for consumers to connect...")
            time.sleep(config.startup_delay_ms / 1000.0)

        # Calculate payload size range
        data_per_block = config.block_size - SpmcRingBuffer.BLOCK_HEADER_SIZE
        min_payload_size = int(MIN_PAYLOAD_BLOCKS * data_per_block)
        max_payload_size = int(MAX_PAYLOAD_BLOCKS * data_per_block)
        # Clamp to max that fits in ring buffer
        max_possible = ring_buffer.max_data_size - ENTRY_HEADER_SIZE
        max_payload_size = min(max_payload_size, max_possible)

        stats = Statistics()
        start_time = time.perf_counter()

        for seq in range(config.entries):
            # Generate random payload
            payload_size = random.randint(min_payload_size, max_payload_size)
            payload = random.randbytes(payload_size)

            # Compute checksum
            checksum = compute_checksum(payload, payload_size)

            # Total entry size
            entry_size = ENTRY_HEADER_SIZE + payload_size

            # Write entry to ring buffer
            # Capture loop variables as default arguments to avoid B023
            def write_callback(
                data_accessor: MemoryAccessor,
                _seq: int = seq,
                _checksum: int = checksum,
                _payload: bytes = payload,
            ) -> None:
                pos = MemoryOffset(0)
                data_accessor.write_uint(_seq, pos)
                data_accessor.write_uint(_checksum, pos)
                data_accessor.write_bytearray(_payload, pos)

            write_start = time.perf_counter()
            success = ring_buffer.write(entry_size, write_callback)
            write_end = time.perf_counter()
            stats.write_processing_time_us += int((write_end - write_start) * 1_000_000)

            if not success:
                print(f"ERROR: Failed to write entry {seq}", file=sys.stderr)
                return 1

            # Flush changes
            mm.flush()

            stats.entries_written += 1
            stats.total_payload_bytes += payload_size
            stats.min_payload_size = min(stats.min_payload_size, payload_size)
            stats.max_payload_size = max(stats.max_payload_size, payload_size)

            if config.verbose and (seq % 1000 == 0):
                print(f"Written {seq} entries...")

            # Small delay to avoid overwhelming consumers
            time.sleep(WRITE_DELAY_MS / 1000.0)

        end_time = time.perf_counter()
        duration_ms = (end_time - start_time) * 1000

        print("\n=== Producer Results ===")
        print(f"Entries written: {stats.entries_written}")
        print(f"Total payload bytes: {stats.total_payload_bytes}")
        print(
            f"Payload size range: {stats.min_payload_size} - {stats.max_payload_size} bytes"
        )
        print(f"Duration: {duration_ms:.0f} ms")
        print(f"Rate: {stats.entries_written * 1000.0 / duration_ms:.2f} entries/sec")
        print(f"INTERNAL_LOOP_DURATION_MS: {duration_ms:.0f}")
        print(f"INTERNAL_WRITE_PROCESSING_MS: {stats.write_processing_time_us // 1000}")

        print("\nPRODUCER COMPLETED SUCCESSFULLY")
        return 0

    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 1

    finally:
        # Release references in reverse order to avoid buffer errors
        # The MemoryAccessor and ring_buffer hold references to mem_view
        # We need to delete them before closing the mmap
        try:
            del ring_buffer
            del mem_accessor
        except NameError:
            pass
        if mem_view is not None:
            mem_view.release()
        if mm is not None:
            mm.close()
        if fd is not None:
            os.close(fd)


def run_consumer(config: Config) -> int:
    """Run the consumer."""
    print("=== SPMC Fuzz Test Consumer (Python) ===")
    print(f"Shared memory: {config.shm_name}")
    print(f"Entries expected: {config.entries}")

    ring_buf_mem_size = SpmcRingBuffer.get_mem_size(
        config.block_size, config.block_count
    )
    total_size = SHM_RINGBUF_OFFSET + ring_buf_mem_size

    mm: Optional[mmap.mmap] = None
    fd: Optional[int] = None
    mem_view: Optional[memoryview] = None
    ring_buffer = None
    mem_accessor = None
    iterator = None

    # Wait for shared memory to be created
    max_retries = 100
    retry_delay_ms = 100
    retries = 0

    while mm is None and retries < max_retries:
        try:
            if sys.platform == "win32":
                # Windows: open existing named shared memory
                mm = mmap.mmap(
                    -1, total_size, tagname=config.shm_name, access=mmap.ACCESS_WRITE
                )
            else:
                # Unix: open existing file
                path = get_shared_memory_path(config.shm_name)
                if os.path.exists(path):
                    fd = os.open(path, os.O_RDWR, 0o666)
                    mm = mmap.mmap(fd, total_size)
        except Exception:
            pass

        if mm is None:
            time.sleep(retry_delay_ms / 1000.0)
            retries += 1

    if mm is None:
        print(
            f"ERROR: Failed to open shared memory after {max_retries} retries",
            file=sys.stderr,
        )
        return 1

    print(f"Connected to shared memory after {retries} retries")

    try:
        # Create memoryview for the mmap
        mem_view = memoryview(mm)

        # Wait for magic number and version to be initialized
        # The producer creates the file first, then initializes the header
        magic_retries = 0
        max_magic_retries = 100
        magic_retry_delay_ms = 100

        while magic_retries < max_magic_retries:
            magic = struct.unpack_from("<I", mm, SHM_MAGIC_OFFSET)[0]
            version = struct.unpack_from("<I", mm, SHM_VERSION_OFFSET)[0]

            if magic == MAGIC_NUMBER and version == VERSION:
                break

            time.sleep(magic_retry_delay_ms / 1000.0)
            magic_retries += 1

        if magic != MAGIC_NUMBER:
            print(f"ERROR: Invalid magic number: 0x{magic:08X}", file=sys.stderr)
            return 1

        if version != VERSION:
            print(
                f"ERROR: Version mismatch: expected {VERSION}, got {version}",
                file=sys.stderr,
            )
            return 1

        print(
            f"Shared memory verified after {magic_retries} header retries. Starting reads..."
        )

        # Create ring buffer accessor
        mem_accessor = MemoryAccessor(mem_view, 0, total_size)
        ring_buffer = SpmcRingBuffer(mem_accessor, SHM_RINGBUF_OFFSET)
        iterator = SpmcRingBufferIterator()

        if ring_buffer.is_null():
            print("ERROR: Ring buffer is null", file=sys.stderr)
            return 1

        print(
            f"Ring buffer: blockSize={ring_buffer.block_size}, "
            f"blockCount={ring_buffer.block_count}, "
            f"maxDataSize={ring_buffer.max_data_size}"
        )

        stats = Statistics()
        expected_sequence = 0
        start_time = time.perf_counter()

        max_idle_ms = 10000  # 10 second timeout for no new data
        last_read_time = time.perf_counter()

        while stats.entries_read < config.entries:
            # Check for missed entries
            if iterator.has_missed_entries(ring_buffer):
                stats.missed_entries += 1
                expected_sequence = -1  # Reset sequence tracking

            # Try to read next entry
            if iterator.has_next(ring_buffer):
                read_start = time.perf_counter()

                # Variables to capture data from callback
                read_data: dict = {
                    "sequence": 0,
                    "checksum": 0,
                    "payload": None,
                    "valid": False,
                }

                def read_callback(
                    data_accessor: MemoryAccessor,
                    _read_data: dict = read_data,
                ) -> None:
                    pos = MemoryOffset(0)
                    _read_data["sequence"] = data_accessor.read_uint(pos)
                    _read_data["checksum"] = data_accessor.read_uint(pos)
                    _read_data["payload"] = data_accessor.read_bytearray(pos)
                    _read_data["valid"] = True

                read_success = iterator.read_next(ring_buffer, read_callback)

                read_end = time.perf_counter()
                stats.read_processing_time_us += int(
                    (read_end - read_start) * 1_000_000
                )

                if not read_success:
                    # Stale read - data was overwritten during read
                    stats.stale_reads += 1
                    if config.verbose:
                        print("Stale read detected, ignoring")
                elif not read_data["valid"]:
                    # Callback didn't complete - shouldn't happen if read_success is True
                    print(
                        "ERROR: Read succeeded but callback didn't complete",
                        file=sys.stderr,
                    )
                    stats.checksum_errors += 1
                else:
                    # Valid read - now verify checksum
                    sequence = read_data["sequence"]
                    checksum = read_data["checksum"]
                    payload = read_data["payload"]
                    payload_size = len(payload)

                    if config.verbose:
                        print(
                            f"Reading entry: seq={sequence}, checksum=0x{checksum:08X}, "
                            f"payloadSize={payload_size}"
                        )

                    computed_checksum = compute_checksum(payload, payload_size)
                    if computed_checksum != checksum:
                        print(
                            f"ERROR: Checksum mismatch at sequence {sequence}: "
                            f"expected 0x{checksum:08X}, got 0x{computed_checksum:08X}",
                            file=sys.stderr,
                        )
                        stats.checksum_errors += 1
                    else:
                        # Verify sequence (if not reset)
                        if expected_sequence >= 0 and sequence != expected_sequence:
                            if config.verbose:
                                print(
                                    f"SEQUENCE GAP: expected {expected_sequence}, got {sequence}",
                                    file=sys.stderr,
                                )
                            stats.sequence_errors += 1

                        expected_sequence = sequence + 1

                        stats.entries_read += 1
                        stats.total_payload_bytes += payload_size
                        stats.min_payload_size = min(
                            stats.min_payload_size, payload_size
                        )
                        stats.max_payload_size = max(
                            stats.max_payload_size, payload_size
                        )

                last_read_time = time.perf_counter()

                if config.verbose and (stats.entries_read % 1000 == 0):
                    print(f"Read {stats.entries_read} entries...")
            else:
                # No data available, check timeout
                idle_ms = (time.perf_counter() - last_read_time) * 1000

                if idle_ms > max_idle_ms:
                    print(f"TIMEOUT: No new data for {idle_ms:.0f} ms", file=sys.stderr)
                    break

                time.sleep(0.0001)  # 100 microseconds

        end_time = time.perf_counter()
        duration_ms = (end_time - start_time) * 1000

        print("\n=== Consumer Results ===")
        print(f"Entries read: {stats.entries_read}")
        print(f"Total payload bytes: {stats.total_payload_bytes}")
        if stats.min_payload_size != 2**32 - 1:
            print(
                f"Payload size range: {stats.min_payload_size} - {stats.max_payload_size} bytes"
            )
        print(f"Duration: {duration_ms:.0f} ms")
        if duration_ms > 0:
            print(f"Rate: {stats.entries_read * 1000.0 / duration_ms:.2f} entries/sec")
        print(f"INTERNAL_LOOP_DURATION_MS: {duration_ms:.0f}")
        print(f"INTERNAL_READ_PROCESSING_MS: {stats.read_processing_time_us // 1000}")
        print("\nError Summary:")
        print(f"  Checksum errors: {stats.checksum_errors}")
        print(f"  Sequence gaps: {stats.sequence_errors}")
        print(f"  Missed entries (evictions): {stats.missed_entries}")
        print(f"  Stale reads: {stats.stale_reads}")

        passed = stats.checksum_errors == 0
        if passed:
            print("\nCONSUMER PASSED")
            return 0
        else:
            print("\nCONSUMER FAILED")
            return 1

    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        import traceback

        traceback.print_exc()
        return 1

    finally:
        # Release references in reverse order to avoid buffer errors
        # The MemoryAccessor and ring_buffer hold references to mem_view
        # We need to delete them before closing the mmap
        if iterator is not None:
            del iterator
        if ring_buffer is not None:
            del ring_buffer
        if mem_accessor is not None:
            del mem_accessor
        if mem_view is not None:
            mem_view.release()
        if mm is not None:
            mm.close()
        if fd is not None:
            os.close(fd)


def print_usage(program_name: str) -> None:
    """Print usage information."""
    print(f"Usage: {program_name} --mode <producer|consumer> [options]")
    print("\nOptions:")
    print("  --mode <mode>      Mode: 'producer' or 'consumer' (required)")
    print(
        f"  --entries <n>      Number of entries to write/read (default: {DEFAULT_ENTRIES})"
    )
    print(f"  --block-size <n>   Block size in bytes (default: {DEFAULT_BLOCK_SIZE})")
    print(f"  --block-count <n>  Number of blocks (default: {DEFAULT_BLOCK_COUNT})")
    print("  --shm-name <name>  Shared memory name (default: xrpa_spmc_fuzz_test)")
    print("  --startup-delay <ms>  Delay before producer starts writing (default: 0)")
    print("  --verbose          Enable verbose output")
    print("  --help             Show this help")


def parse_args() -> Config:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="SPMC Ring Buffer Fuzz Test",
        add_help=False,
    )
    parser.add_argument("--mode", type=str, default="")
    parser.add_argument("--entries", type=int, default=DEFAULT_ENTRIES)
    parser.add_argument("--block-size", type=int, default=DEFAULT_BLOCK_SIZE)
    parser.add_argument("--block-count", type=int, default=DEFAULT_BLOCK_COUNT)
    parser.add_argument("--shm-name", type=str, default="xrpa_spmc_fuzz_test")
    parser.add_argument("--startup-delay", type=int, default=0)
    parser.add_argument("--verbose", action="store_true")
    parser.add_argument("--help", action="store_true")

    args = parser.parse_args()

    if args.help:
        print_usage(sys.argv[0])
        sys.exit(0)

    return Config(
        mode=args.mode,
        shm_name=args.shm_name,
        entries=args.entries,
        block_size=args.block_size,
        block_count=args.block_count,
        startup_delay_ms=args.startup_delay,
        verbose=args.verbose,
    )


def main() -> int:
    """Main entry point."""
    config = parse_args()

    if not config.mode:
        print("ERROR: --mode is required", file=sys.stderr)
        print_usage(sys.argv[0])
        return 1

    if config.mode == "producer":
        return run_producer(config)
    elif config.mode == "consumer":
        return run_consumer(config)
    else:
        print(
            f"ERROR: Invalid mode '{config.mode}'. Use 'producer' or 'consumer'.",
            file=sys.stderr,
        )
        return 1


if __name__ == "__main__":
    sys.exit(main())
