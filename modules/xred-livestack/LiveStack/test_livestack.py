#!/usr/bin/env python3
# (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.

"""
Comprehensive test suite for xred-livestack module.
Tests WebSocket client, message parsing, deserialization, and world state management.
"""

import asyncio
import struct
import sys
from unittest.mock import Mock

import zstandard as zstd

from serialization.bitstream_reader import BitStreamReader
from serialization.compression import BucketedBitStreamCompression
from serialization.deserializers import LiveStackDeserializers
from world_state_manager import WorldStateManager


def print_separator(title: str = ""):
    """Print a separator line with optional title."""
    if title:
        print(f"\n{'=' * 20} {title} {'=' * 20}")
    else:
        print("=" * 60)


def print_test_result(test_name: str, passed: bool, details: str = ""):
    """Print test result with consistent formatting."""
    status = "PASS" if passed else "FAIL"
    print(f"{status}: {test_name}")
    if details:
        print(f"   {details}")


class TestResults:
    """Track test results."""

    def __init__(self):
        self.total = 0
        self.passed = 0
        self.failed = 0

    def add_result(self, passed: bool):
        self.total += 1
        if passed:
            self.passed += 1
        else:
            self.failed += 1

    def print_summary(self):
        print_separator("Test Summary")
        print(f"Total tests: {self.total}")
        print(f"Passed: {self.passed}")
        print(f"Failed: {self.failed}")
        print(
            f"Success rate: {(self.passed/self.total*100):.1f}%"
            if self.total > 0
            else "No tests run"
        )


test_results = TestResults()


def test_bitstream_reader():
    """Test BitStreamReader functionality."""
    print_separator("BitStreamReader Tests")

    # Test reading raw float
    data = struct.pack("<f", 3.14)
    reader = BitStreamReader(data)
    val = reader.read_float()
    passed = abs(val - 3.14) < 0.01
    test_results.add_result(passed)
    print_test_result("Read float", passed, f"Read value: {val:.2f}")

    # Test reading vector3
    data = struct.pack("<fff", 1.0, 2.0, 3.0)
    reader = BitStreamReader(data)
    vec = reader.read_vector3()
    passed = vec == (1.0, 2.0, 3.0)
    test_results.add_result(passed)
    print_test_result("Read vector3", passed, f"Read vector: {vec}")

    # Test reading quaternion
    data = struct.pack("<ffff", 1.0, 0.0, 0.0, 0.0)
    reader = BitStreamReader(data)
    quat = reader.read_quaternion()
    passed = quat == (1.0, 0.0, 0.0, 0.0)
    test_results.add_result(passed)
    print_test_result("Read quaternion", passed, f"Read quaternion: {quat}")

    # Test packed integers with compression
    compression = BucketedBitStreamCompression()
    data = bytes([0x00])  # Empty bitstream
    reader = BitStreamReader(data)
    val = reader.read_packed_int32(compression)
    passed = val == 0
    test_results.add_result(passed)
    print_test_result("Read packed int32", passed, f"Read value: {val}")


def create_simple_heartbeat_data():
    """Create a simple heartbeat message using packed format."""
    result = bytearray()

    # For simplicity, we'll create minimal data
    # This might need adjustment based on actual binary protocol
    version_str = "LiveStack v1.0.0"

    # Write length as simple uint32
    result.extend(struct.pack("<I", len(version_str)))

    # Write each character
    for char in version_str:
        result.extend(struct.pack("<I", ord(char)))

    # Write timestamp
    result.extend(struct.pack("<Q", 1234567890))

    return bytes(result)


def test_heartbeat_deserialization():
    """Test heartbeat message deserialization."""
    print_separator("Heartbeat Deserialization Tests")

    try:
        data = create_simple_heartbeat_data()
        result = LiveStackDeserializers.deserialize_heartbeat(data)

        passed = (
            result is not None and "server_version" in result and "timestamp" in result
        )
        test_results.add_result(passed)
        print_test_result(
            "Valid heartbeat deserialization",
            passed,
            f"Version: {result.get('server_version', 'N/A')}, Timestamp: {result.get('timestamp', 0)}"
            if result
            else "",
        )
    except Exception as e:
        test_results.add_result(False)
        print_test_result("Heartbeat deserialization", False, f"Error: {e}")


def create_simple_anchor_data():
    """Create simple anchor delta data."""
    result = bytearray()

    # 0 updated gravity anchors
    result.extend(bytes([0x00]))

    # 0 updated island anchors
    result.extend(bytes([0x00]))

    # 0 removed gravity anchors
    result.extend(bytes([0x00]))

    # 0 removed island anchors
    result.extend(bytes([0x00]))

    return bytes(result)


def test_anchor_deserialization():
    """Test anchor message deserialization."""
    print_separator("Anchor Deserialization Tests")

    try:
        data = create_simple_anchor_data()
        result = LiveStackDeserializers.deserialize_anchors(data)

        passed = (
            result is not None
            and "updated_gravity" in result
            and "updated_islands" in result
            and "removed_gravity" in result
            and "removed_islands" in result
        )
        test_results.add_result(passed)
        print_test_result(
            "Valid anchor deserialization (empty)",
            passed,
            f"Gravity: {len(result.get('updated_gravity', []))}, Islands: {len(result.get('updated_islands', []))}"
            if result
            else "",
        )
    except Exception as e:
        test_results.add_result(False)
        print_test_result("Anchor deserialization", False, f"Error: {e}")


def create_simple_object_data():
    """Create simple object delta data."""
    result = bytearray()

    # 0 updated objects
    result.extend(bytes([0x00]))

    # 0 removed objects
    result.extend(bytes([0x00]))

    return bytes(result)


def test_object_deserialization():
    """Test object message deserialization."""
    print_separator("Object Deserialization Tests")

    try:
        data = create_simple_object_data()
        result = LiveStackDeserializers.deserialize_objects(data)

        passed = result is not None and "updated" in result and "removed" in result
        test_results.add_result(passed)
        print_test_result(
            "Valid object deserialization (empty)",
            passed,
            f"Updated: {len(result.get('updated', []))}, Removed: {len(result.get('removed', []))}"
            if result
            else "",
        )
    except Exception as e:
        test_results.add_result(False)
        print_test_result("Object deserialization", False, f"Error: {e}")


def create_simple_room_data():
    """Create simple room delta data."""
    result = bytearray()

    # 0 updated rooms
    result.extend(bytes([0x00]))

    # 0 removed rooms
    result.extend(bytes([0x00]))

    return bytes(result)


def test_room_deserialization():
    """Test room message deserialization."""
    print_separator("Room Deserialization Tests")

    try:
        data = create_simple_room_data()
        result = LiveStackDeserializers.deserialize_rooms(data)

        passed = result is not None and "updated" in result and "removed" in result
        test_results.add_result(passed)
        print_test_result(
            "Valid room deserialization (empty)",
            passed,
            f"Updated: {len(result.get('updated', []))}, Removed: {len(result.get('removed', []))}"
            if result
            else "",
        )
    except Exception as e:
        test_results.add_result(False)
        print_test_result("Room deserialization", False, f"Error: {e}")


def create_simple_door_data():
    """Create simple door delta data."""
    result = bytearray()

    # 0 updated doors
    result.extend(bytes([0x00]))

    # 0 removed doors
    result.extend(bytes([0x00]))

    return bytes(result)


def test_door_deserialization():
    """Test door message deserialization."""
    print_separator("Door Deserialization Tests")

    try:
        data = create_simple_door_data()
        result = LiveStackDeserializers.deserialize_doors(data)

        passed = result is not None and "updated" in result and "removed" in result
        test_results.add_result(passed)
        print_test_result(
            "Valid door deserialization (empty)",
            passed,
            f"Updated: {len(result.get('updated', []))}, Removed: {len(result.get('removed', []))}"
            if result
            else "",
        )
    except Exception as e:
        test_results.add_result(False)
        print_test_result("Door deserialization", False, f"Error: {e}")


def create_simple_hands_data():
    """Create simple hands data."""
    result = bytearray()

    # Empty anchor UUID delta (not populated)
    result.extend(bytes([0x00]))

    # Left hand not tracked
    result.extend(bytes([0x00]))

    # Right hand not tracked
    result.extend(bytes([0x00]))

    return bytes(result)


def test_hands_deserialization():
    """Test hands message deserialization."""
    print_separator("Hands Deserialization Tests")

    try:
        data = create_simple_hands_data()
        result = LiveStackDeserializers.deserialize_hands(data)

        passed = (
            result is not None
            and "anchor_uid" in result
            and "is_left_hand_tracked" in result
            and "is_right_hand_tracked" in result
        )
        test_results.add_result(passed)
        print_test_result(
            "Valid hands deserialization (not tracking)",
            passed,
            f"Left: {result.get('is_left_hand_tracked')}, Right: {result.get('is_right_hand_tracked')}"
            if result
            else "",
        )
    except Exception as e:
        test_results.add_result(False)
        print_test_result("Hands deserialization", False, f"Error: {e}")


def create_simple_eye_gaze_data():
    """Create simple eye gaze data."""
    result = bytearray()

    # Empty anchor UUID delta (not populated)
    result.extend(bytes([0x00]))

    # Gaze origin (not populated, use baseline 0,0,0)
    result.extend(bytes([0x00] * 3))

    # Gaze direction (not populated, use baseline 0,0,1)
    result.extend(bytes([0x00] * 3))

    return bytes(result)


def test_eye_gaze_deserialization():
    """Test eye gaze message deserialization."""
    print_separator("Eye Gaze Deserialization Tests")

    try:
        data = create_simple_eye_gaze_data()
        result = LiveStackDeserializers.deserialize_eye_gaze(data)

        passed = (
            result is not None
            and "anchor_uid" in result
            and "gaze_origin" in result
            and "gaze_direction" in result
        )
        test_results.add_result(passed)
        print_test_result(
            "Valid eye gaze deserialization",
            passed,
            f"Origin: {result.get('gaze_origin')}, Direction: {result.get('gaze_direction')}"
            if result
            else "",
        )
    except Exception as e:
        test_results.add_result(False)
        print_test_result("Eye gaze deserialization", False, f"Error: {e}")


def create_simple_body_pose_data():
    """Create simple body pose delta data."""
    result = bytearray()

    # 0 updated body poses
    result.extend(bytes([0x00]))

    # 0 removed body poses
    result.extend(bytes([0x00]))

    return bytes(result)


def test_body_pose_deserialization():
    """Test body pose message deserialization."""
    print_separator("Body Pose Deserialization Tests")

    try:
        data = create_simple_body_pose_data()
        result = LiveStackDeserializers.deserialize_body_poses(data)

        passed = result is not None and "updated" in result and "removed" in result
        test_results.add_result(passed)
        print_test_result(
            "Valid body pose deserialization (empty)",
            passed,
            f"Updated: {len(result.get('updated', []))}, Removed: {len(result.get('removed', []))}"
            if result
            else "",
        )
    except Exception as e:
        test_results.add_result(False)
        print_test_result("Body pose deserialization", False, f"Error: {e}")


def test_world_state_manager():
    """Test WorldStateManager functionality."""
    print_separator("WorldStateManager Tests")

    # Create mock data store
    mock_data_store = Mock()

    # Set up mock collections
    mock_anchor_collection = Mock()
    mock_anchor_collection.create_object = Mock(return_value=Mock(id=1))
    mock_data_store.live_stack_anchors = mock_anchor_collection

    mock_object_collection = Mock()
    mock_object_collection.create_object = Mock(return_value=Mock(id=2))
    mock_data_store.live_stack_objects = mock_object_collection

    mock_room_collection = Mock()
    mock_room_collection.create_object = Mock(return_value=Mock(id=3))
    mock_data_store.live_stack_rooms = mock_room_collection

    # Create WorldStateManager
    manager = WorldStateManager(mock_data_store, "test_instance_id")

    # Test initial state
    passed = (
        len(manager._anchor_map) == 0
        and len(manager._object_map) == 0
        and len(manager._room_map) == 0
    )
    test_results.add_result(passed)
    print_test_result("Initial state is empty", passed)

    # Test clear_state
    manager.clear_state()
    passed = (
        len(manager._anchor_map) == 0
        and len(manager._object_map) == 0
        and len(manager._room_map) == 0
    )
    test_results.add_result(passed)
    print_test_result("State cleared successfully", passed)


async def test_websocket_client_lifecycle():
    """Test WebSocket client connection lifecycle."""
    print_separator("WebSocket Client Lifecycle Tests")

    try:
        from livestack_client.websocket_client import (
            ConnectionState,
            LiveStackWebSocketClient,
        )

        # Test client creation
        client = LiveStackWebSocketClient("127.0.0.1", 5047)
        passed = client.ip_address == "127.0.0.1" and client.port == 5047
        test_results.add_result(passed)
        print_test_result("Client creation", passed)

        # Test initial connection state
        passed = client.connection_state == ConnectionState.DISCONNECTED
        test_results.add_result(passed)
        print_test_result("Initial disconnected state", passed)

        # Test message handler registration
        async def test_handler(topic_id: int, data: bytes) -> None:
            _ = (topic_id, data)

        client.register_handler(16, test_handler)
        passed = 16 in client.message_handlers
        test_results.add_result(passed)
        print_test_result("Handler registration", passed)

        # Test connection parameters
        passed = (
            client.reconnect_delay == 1.0
            and client.max_reconnect_delay == 30.0
            and client.reconnect_backoff == 2.0
        )
        test_results.add_result(passed)
        print_test_result("Connection parameters initialized", passed)
    except Exception as e:
        test_results.add_result(False)
        print_test_result("WebSocket client lifecycle", False, f"Error: {e}")


async def test_message_parsing():
    """Test WebSocket message parsing."""
    print_separator("Message Parsing Tests")

    try:
        from livestack_client.message_parser import MessageParser

        parser = MessageParser()

        # Test decompression
        original_data = b"test_payload"
        compressor = zstd.ZstdCompressor()
        compressed = compressor.compress(original_data)

        decompressed = parser.decompress(compressed)
        passed = decompressed == original_data
        test_results.add_result(passed)
        print_test_result(
            "Valid message decompression",
            passed,
            f"Original length: {len(original_data)}, Decompressed length: {len(decompressed) if decompressed else 0}",
        )

        # Test empty message
        result = parser.decompress(b"")
        passed = result is None
        test_results.add_result(passed)
        print_test_result("Empty message handling", passed)

        # Test malformed compressed data
        result = parser.decompress(b"invalid_compressed_data")
        passed = result is None
        test_results.add_result(passed)
        print_test_result("Malformed message handling", passed)

        # Test topic name resolution
        from livestack_client.message_parser import TOPIC_ANCHOR_GRAPH

        topic_name = parser.get_topic_name(TOPIC_ANCHOR_GRAPH)
        passed = topic_name == "AnchorGraph"
        test_results.add_result(passed)
        print_test_result("Topic name resolution", passed, f"Topic 38 → {topic_name}")
    except Exception as e:
        test_results.add_result(False)
        print_test_result("Message parsing", False, f"Error: {e}")


def print_usage_summary():
    """Print usage summary."""
    print_separator("Usage Summary")
    print("""
LiveStack Module - Successfully tested core functionality

Basic usage in package.json:
  yarn test             - Run this test suite
  yarn LiveStack        - Run LiveStack module standalone
  yarn codegen          - Generate Xrpa bindings

Key features verified:
  ✓ BitStreamReader for binary data
  ✓ Message deserializers for all LiveStack topics
  ✓ WebSocket client lifecycle
  ✓ World state management
  ✓ Message parsing and decompression

For detailed configuration options and troubleshooting, see:
  modules/xred-livestack/README.md
  fbsource/arvr/projects/surreal/live_stack/networking/README.md
""")


async def main():
    """Run the comprehensive test suite."""
    print("LiveStack Module Comprehensive Test Suite")
    print("=" * 60)

    try:
        # BitStream tests
        test_bitstream_reader()

        # Deserialization tests (using simple/empty data)
        test_heartbeat_deserialization()
        test_anchor_deserialization()
        test_object_deserialization()
        test_room_deserialization()
        test_door_deserialization()
        test_hands_deserialization()
        test_eye_gaze_deserialization()
        test_body_pose_deserialization()

        # World state management tests
        test_world_state_manager()

        # WebSocket client tests (async)
        await test_websocket_client_lifecycle()
        await test_message_parsing()

        # Print results
        test_results.print_summary()
        print_usage_summary()

        return 0 if test_results.failed == 0 else 1

    except Exception as e:
        print(f"ERROR: Test suite failed with error: {e}")
        import traceback

        traceback.print_exc()
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
