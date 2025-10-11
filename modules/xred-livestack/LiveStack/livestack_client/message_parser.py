# (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.

import logging
from typing import Optional

import zstandard as zstd


# LiveStack Topic IDs (from LiveStack networking/data/Topics.h)
TOPIC_DEVICE_STATE = 16
TOPIC_BACKGROUND_POINTS = 17
TOPIC_DISPLAY_STATE = 18
TOPIC_DRAWING = 19
TOPIC_DRAWING_UNRELIABLE = 20
TOPIC_EYE_GAZE = 21
TOPIC_EVENTS = 22
TOPIC_HANDS = 23
TOPIC_OBJECTS = 24
TOPIC_MIDAS_OBJECTS = 25
TOPIC_EGO_BODY_POSE = 26
TOPIC_OCCUPANCY_GRID = 27
TOPIC_SERVER_HEARTBEAT = 28
TOPIC_PERSISTENT_INDEX_MAP = 30
TOPIC_GUIDE_CAMERA_STATE = 31
TOPIC_SPEECH = 32
TOPIC_OBJECT_MESHES = 33
TOPIC_ROOMS = 35
TOPIC_DOORS = 36
TOPIC_OBJECT_POINTS = 37
TOPIC_ANCHOR_GRAPH = 38
TOPIC_EXO_BODY_POSE = 39
TOPIC_AGGREGATOR_ANNOUNCEMENT = 40


class MessageParser:
    """
    Parser for LiveStack binary WebSocket messages.
    Extracts topic ID and decompresses payload data.
    """

    def __init__(self) -> None:
        """Initialize the message parser with a Zstandard decompressor."""
        self.decompressor: zstd.ZstdDecompressor = zstd.ZstdDecompressor()
        self.logger: logging.Logger = logging.getLogger("MessageParser")

    def decompress(self, compressed_data: bytes) -> Optional[bytes]:
        """
        Decompress a Zstandard-compressed payload.
        Alias for decompress_payload to maintain compatibility.

        Args:
            compressed_data: Zstandard-compressed binary data

        Returns:
            Decompressed bytes or None if decompression fails
        """
        return self.decompress_payload(compressed_data)

    def decompress_payload(self, compressed_data: bytes) -> Optional[bytes]:
        """
        Decompress a Zstandard-compressed payload.

        Args:
            compressed_data: Zstandard-compressed binary data

        Returns:
            Decompressed bytes or None if decompression fails
        """
        if not compressed_data:
            self.logger.warning("Empty compressed data")
            return None

        try:
            decompressed = self.decompressor.decompress(compressed_data)
            self.logger.debug(
                f"Decompressed {len(compressed_data)} bytes to {len(decompressed)} bytes"
            )
            return decompressed
        except zstd.ZstdError as e:
            self.logger.error(f"Zstandard decompression error: {e}")
            return None
        except Exception as e:
            self.logger.error(f"Unexpected error during decompression: {e}")
            return None

    def get_topic_name(self, topic_id: int) -> str:
        """Get a human-readable name for a topic ID."""
        topic_names = {
            TOPIC_DEVICE_STATE: "DeviceState",
            TOPIC_BACKGROUND_POINTS: "BackgroundPoints",
            TOPIC_DISPLAY_STATE: "DisplayState",
            TOPIC_DRAWING: "Drawing",
            TOPIC_DRAWING_UNRELIABLE: "DrawingUnreliable",
            TOPIC_EYE_GAZE: "EyeGaze",
            TOPIC_EVENTS: "Events",
            TOPIC_HANDS: "Hands",
            TOPIC_OBJECTS: "Objects",
            TOPIC_MIDAS_OBJECTS: "MidasObjects",
            TOPIC_EGO_BODY_POSE: "EgoBodyPose",
            TOPIC_OCCUPANCY_GRID: "OccupancyGrid",
            TOPIC_SERVER_HEARTBEAT: "ServerHeartbeat",
            TOPIC_PERSISTENT_INDEX_MAP: "PersistentIndexMap",
            TOPIC_GUIDE_CAMERA_STATE: "GuideCameraState",
            TOPIC_SPEECH: "Speech",
            TOPIC_OBJECT_MESHES: "ObjectMeshes",
            TOPIC_ROOMS: "Rooms",
            TOPIC_DOORS: "Doors",
            TOPIC_OBJECT_POINTS: "ObjectPoints",
            TOPIC_ANCHOR_GRAPH: "AnchorGraph",
            TOPIC_EXO_BODY_POSE: "ExoBodyPose",
            TOPIC_AGGREGATOR_ANNOUNCEMENT: "AggregatorAnnouncement",
        }
        return topic_names.get(topic_id, f"Unknown({topic_id})")
