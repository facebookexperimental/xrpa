# (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.

from typing import Any, Dict, Tuple

from xrpa.live_stack_types import Distance3, Pose, Quaternion, UnitVector3, Vector3

from .bitstream_reader import BitStreamReader
from .compression import (
    BucketedBitStreamCompression,
    FloatUncompressed,
    HalfFloatCompression,
    NormalizedFloatCompression,
    QuaternionSmallest3,
    QuaternionUncompressed,
)


def uuid_pair_to_string(prefix: int, suffix: int) -> str:
    """Convert a UUID pair (two uint64s) to a string representation."""
    return f"{prefix:016x}-{suffix:016x}"


def uint64_to_string(value: int) -> str:
    """Convert a uint64 to a string representation."""
    return f"{value:016x}"


def tuple_to_vector3(vec: Tuple[float, float, float]) -> Vector3:
    """Convert a tuple to an Xrpa Vector3."""
    return Vector3(x=vec[0], y=vec[1], z=vec[2])


def tuple_to_unit_vector3(vec: Tuple[float, float, float]) -> UnitVector3:
    """Convert a tuple to an Xrpa UnitVector3."""
    return UnitVector3(x=vec[0], y=vec[1], z=vec[2])


def tuple_to_distance3(vec: Tuple[float, float, float]) -> Distance3:
    """Convert a tuple to an Xrpa Distance3."""
    return Distance3(x=vec[0], y=vec[1], z=vec[2])


def livestack_quat_to_xrpa_quat(quat: Tuple[float, float, float, float]) -> Quaternion:
    """
    Convert LiveStack quaternion (w, x, y, z) to Xrpa Quaternion (x, y, z, w).
    LiveStack sends quaternions with w first, but Xrpa expects w last.
    """
    w, x, y, z = quat
    return Quaternion(x=x, y=y, z=z, w=w)


def se3_to_pose(
    se3: Tuple[Tuple[float, float, float, float], Tuple[float, float, float]],
) -> Pose:
    """
    Convert an SE3 transform (quaternion + translation) to an Xrpa Pose.
    LiveStack SE3: (quaternion as (w,x,y,z), translation as (x,y,z))
    Xrpa Pose: Pose(position=Vector3, orientation=Quaternion(x,y,z,w))
    """
    quaternion, translation = se3
    return Pose(
        position=tuple_to_vector3(translation),
        orientation=livestack_quat_to_xrpa_quat(quaternion),
    )


class LiveStackDeserializers:
    """
    Deserializer functions for LiveStack topic types.
    Converts binary data to Python data structures.
    """

    @staticmethod
    def deserialize_anchors(data: bytes) -> Dict[str, Any]:
        """
        Deserialize AnchorGraphDelta messages.
        Returns dict with:
        - updated_gravity: List of gravity anchor entries
        - updated_islands: List of island anchor entries
        - removed_gravity: List of removed gravity anchor UUIDs
        - removed_islands: List of removed island anchor UUIDs
        """
        reader = BitStreamReader(data)
        compression = BucketedBitStreamCompression()
        float_compression = FloatUncompressed()
        quat_compression = QuaternionUncompressed()

        result = {
            "updated_gravity": [],
            "updated_islands": [],
            "removed_gravity": [],
            "removed_islands": [],
        }

        try:
            updated_gravity_size = reader.read_packed_int32(compression)
            for _ in range(updated_gravity_size):
                uuid = reader.read_packed_uuid_pair(compression)
                gravity_tuple = reader.read_packed_vector3_delta(
                    (0.0, 0.0, 0.0), float_compression
                )

                result["updated_gravity"].append(
                    {
                        "id": uuid_pair_to_string(uuid[0], uuid[1]),
                        "gravity": tuple_to_unit_vector3(gravity_tuple),
                    }
                )

            updated_islands_size = reader.read_packed_int32(compression)
            for _ in range(updated_islands_size):
                uuid = reader.read_packed_uuid_pair(compression)
                island_index = reader.read_packed_int32_delta(0, compression)
                transform = reader.read_packed_se3_delta(
                    ((1.0, 0.0, 0.0, 0.0), (0.0, 0.0, 0.0)),
                    float_compression,
                    quat_compression,
                )

                result["updated_islands"].append(
                    {
                        "id": uuid_pair_to_string(uuid[0], uuid[1]),
                        "island_index": island_index,
                        "transform": se3_to_pose(transform),
                    }
                )

            removed_gravity_size = reader.read_packed_int32(compression)
            for _ in range(removed_gravity_size):
                uuid = reader.read_packed_uuid_pair(compression)
                result["removed_gravity"].append(uuid_pair_to_string(uuid[0], uuid[1]))

            removed_islands_size = reader.read_packed_int32(compression)
            for _ in range(removed_islands_size):
                uuid = reader.read_packed_uuid_pair(compression)
                result["removed_islands"].append(uuid_pair_to_string(uuid[0], uuid[1]))

        except Exception as e:
            raise RuntimeError(f"Failed to deserialize anchors: {e}")

        return result

    @staticmethod
    def deserialize_objects(data: bytes) -> Dict[str, Any]:
        """
        Deserialize ObjectMapperDelta messages.
        Returns dict with:
        - updated: List of object entries
        - removed: List of removed object UUIDs
        """
        reader = BitStreamReader(data)
        compression = BucketedBitStreamCompression()
        float_compression = HalfFloatCompression()
        quat_compression = QuaternionSmallest3()

        result = {
            "updated": [],
            "removed": [],
        }

        try:
            last_uid = (0, 0)
            updated_size = reader.read_packed_int32(compression)

            for _ in range(updated_size):
                uid = reader.read_packed_uuid_pair_delta(last_uid, compression)
                bb_version = reader.read_packed_int32_delta(0, compression)
                anchor_uid = reader.read_packed_uuid_pair_delta((0, 0), compression)
                category = reader.read_packed_int32_delta(0, compression)
                label = reader.read_packed_string_delta("", compression)
                room_uid = reader.read_packed_uint64_delta(0, compression)
                floor_uid = reader.read_packed_uint64_delta(0, compression)
                t_anchor_object = reader.read_packed_se3_delta(
                    ((1.0, 0.0, 0.0, 0.0), (0.0, 0.0, 0.0)),
                    float_compression,
                    quat_compression,
                )
                size_tuple = reader.read_packed_vector3_delta(
                    (0.0, 0.0, 0.0), float_compression
                )
                num_inlier_points = reader.read_packed_int32_delta(0, compression)

                result["updated"].append(
                    {
                        "uid": uuid_pair_to_string(uid[0], uid[1]),
                        "bb_version": bb_version,
                        "anchor_uid": uuid_pair_to_string(anchor_uid[0], anchor_uid[1]),
                        "category": category,
                        "label": label,
                        "room_uid": uint64_to_string(room_uid),
                        "floor_uid": uint64_to_string(floor_uid),
                        "pose": se3_to_pose(t_anchor_object),
                        "size": tuple_to_distance3(size_tuple),
                        "num_inlier_points": num_inlier_points,
                    }
                )

                last_uid = uid

            removed_size = reader.read_packed_int32(compression)
            for _ in range(removed_size):
                uid = reader.read_packed_uuid_pair(compression)
                result["removed"].append(uuid_pair_to_string(uid[0], uid[1]))

        except Exception as e:
            raise RuntimeError(f"Failed to deserialize objects: {e}")

        return result

    @staticmethod
    def deserialize_rooms(data: bytes) -> Dict[str, Any]:
        """
        Deserialize RoomsDelta messages.
        Returns dict with:
        - updated: List of room entries
        - removed: List of removed room IDs
        """
        reader = BitStreamReader(data)
        compression = BucketedBitStreamCompression()
        float_compression = HalfFloatCompression()
        quat_compression = QuaternionSmallest3()

        result = {
            "updated": [],
            "removed": [],
        }

        try:
            updated_size = reader.read_packed_int32(compression)

            for _ in range(updated_size):
                room_id = reader.read_packed_uint64_delta(0, compression)
                floor_id = reader.read_packed_uint64_delta(0, compression)
                anchor_uid = reader.read_packed_uuid_pair_delta((0, 0), compression)
                transform = reader.read_packed_se3_delta(
                    ((1.0, 0.0, 0.0, 0.0), (0.0, 0.0, 0.0)),
                    float_compression,
                    quat_compression,
                )
                floor_height = reader.read_packed_float_delta(0.0, float_compression)
                ceiling_height = reader.read_packed_float_delta(0.0, float_compression)

                polygon_vertices_count = reader.read_packed_int32(compression)
                polygon_vertices = []
                for _ in range(polygon_vertices_count):
                    vertex_tuple = reader.read_packed_vector3_delta(
                        (0.0, 0.0, 0.0), float_compression
                    )
                    polygon_vertices.append(tuple_to_vector3(vertex_tuple))

                result["updated"].append(
                    {
                        "room_id": uint64_to_string(room_id),
                        "floor_id": uint64_to_string(floor_id),
                        "anchor_uid": uuid_pair_to_string(anchor_uid[0], anchor_uid[1]),
                        "pose": se3_to_pose(transform),
                        "floor_height": floor_height,
                        "ceiling_height": ceiling_height,
                        "polygon_vertices": polygon_vertices,
                    }
                )

            removed_size = reader.read_packed_int32(compression)
            for _ in range(removed_size):
                room_id = reader.read_packed_uint64(compression)
                result["removed"].append(uint64_to_string(room_id))

        except Exception as e:
            raise RuntimeError(f"Failed to deserialize rooms: {e}")

        return result

    @staticmethod
    def deserialize_doors(data: bytes) -> Dict[str, Any]:
        """
        Deserialize DoorsDelta messages.
        Returns dict with:
        - updated: List of door entries
        - removed: List of removed door IDs
        """
        reader = BitStreamReader(data)
        compression = BucketedBitStreamCompression()
        float_compression = HalfFloatCompression()
        quat_compression = QuaternionSmallest3()

        result = {
            "updated": [],
            "removed": [],
        }

        try:
            updated_size = reader.read_packed_int32(compression)

            for _ in range(updated_size):
                door_id = reader.read_packed_uint64_delta(0, compression)
                front_room_id = reader.read_packed_uint64_delta(0, compression)
                back_room_id = reader.read_packed_uint64_delta(0, compression)
                anchor_uid = reader.read_packed_uuid_pair_delta((0, 0), compression)
                transform = reader.read_packed_se3_delta(
                    ((1.0, 0.0, 0.0, 0.0), (0.0, 0.0, 0.0)),
                    float_compression,
                    quat_compression,
                )
                width = reader.read_packed_float_delta(0.0, float_compression)
                height = reader.read_packed_float_delta(0.0, float_compression)

                result["updated"].append(
                    {
                        "door_id": uint64_to_string(door_id),
                        "front_room_id": uint64_to_string(front_room_id),
                        "back_room_id": uint64_to_string(back_room_id),
                        "anchor_uid": uuid_pair_to_string(anchor_uid[0], anchor_uid[1]),
                        "pose": se3_to_pose(transform),
                        "width": width,
                        "height": height,
                    }
                )

            removed_size = reader.read_packed_int32(compression)
            for _ in range(removed_size):
                door_id = reader.read_packed_uint64(compression)
                result["removed"].append(uint64_to_string(door_id))

        except Exception as e:
            raise RuntimeError(f"Failed to deserialize doors: {e}")

        return result

    @staticmethod
    def deserialize_hands(data: bytes) -> Dict[str, Any]:
        """
        Deserialize HandsDelta messages.
        Returns dict with:
        - anchor_uid: Anchor UUID
        - is_left_hand_tracked: Boolean
        - is_right_hand_tracked: Boolean
        - left_hand_landmarks: List of 3D vectors
        - right_hand_landmarks: List of 3D vectors
        """
        reader = BitStreamReader(data)
        compression = BucketedBitStreamCompression()
        float_compression = HalfFloatCompression()

        result = {
            "anchor_uid": None,
            "is_left_hand_tracked": False,
            "is_right_hand_tracked": False,
            "left_hand_landmarks": [],
            "right_hand_landmarks": [],
        }

        try:
            anchor_uid = reader.read_packed_uuid_pair_delta((0, 0), compression)
            result["anchor_uid"] = uuid_pair_to_string(anchor_uid[0], anchor_uid[1])

            result["is_left_hand_tracked"] = reader.read_packed_bool()
            if result["is_left_hand_tracked"]:
                size = reader.read_packed_int32(compression)
                for _ in range(size):
                    landmark_tuple = reader.read_packed_vector3(float_compression)
                    result["left_hand_landmarks"].append(
                        tuple_to_vector3(landmark_tuple)
                    )

            result["is_right_hand_tracked"] = reader.read_packed_bool()
            if result["is_right_hand_tracked"]:
                size = reader.read_packed_int32(compression)
                for _ in range(size):
                    landmark_tuple = reader.read_packed_vector3(float_compression)
                    result["right_hand_landmarks"].append(
                        tuple_to_vector3(landmark_tuple)
                    )

        except Exception as e:
            raise RuntimeError(f"Failed to deserialize hands: {e}")

        return result

    @staticmethod
    def deserialize_eye_gaze(data: bytes) -> Dict[str, Any]:
        """
        Deserialize EyeGazeDelta messages.
        Returns dict with:
        - anchor_uid: Anchor UUID
        - gaze_origin: 3D vector
        - gaze_direction: 3D unit vector
        """
        reader = BitStreamReader(data)
        compression = BucketedBitStreamCompression()
        float_compression = HalfFloatCompression()
        direction_compression = NormalizedFloatCompression()

        result = {
            "anchor_uid": None,
            "gaze_origin": (0.0, 0.0, 0.0),
            "gaze_direction": (0.0, 0.0, 1.0),
        }

        try:
            anchor_uid = reader.read_packed_uuid_pair_delta((0, 0), compression)
            result["anchor_uid"] = uuid_pair_to_string(anchor_uid[0], anchor_uid[1])

            gaze_origin_tuple = reader.read_packed_vector3_delta(
                (0.0, 0.0, 0.0), float_compression
            )
            result["gaze_origin"] = tuple_to_vector3(gaze_origin_tuple)

            gaze_direction_tuple = reader.read_packed_vector3_delta(
                (0.0, 0.0, 1.0), direction_compression
            )
            result["gaze_direction"] = tuple_to_unit_vector3(gaze_direction_tuple)

        except Exception as e:
            raise RuntimeError(f"Failed to deserialize eye gaze: {e}")

        return result

    @staticmethod
    def deserialize_body_poses(data: bytes) -> Dict[str, Any]:
        """
        Deserialize BodyPoseDelta messages.
        Returns dict with:
        - updated: List of body pose entries
        - removed: List of removed person IDs
        """
        reader = BitStreamReader(data)
        compression = BucketedBitStreamCompression()
        float_compression = HalfFloatCompression()
        quat_compression = QuaternionSmallest3()

        result = {
            "updated": [],
            "removed": [],
        }

        try:
            updated_size = reader.read_packed_int32(compression)

            for _ in range(updated_size):
                person_id = reader.read_packed_int32_delta(0, compression)
                human_uuid = reader.read_packed_uuid_pair_delta((0, 0), compression)
                anchor_uid = reader.read_packed_uuid_pair_delta((0, 0), compression)
                root_pose = reader.read_packed_se3_delta(
                    ((1.0, 0.0, 0.0, 0.0), (0.0, 0.0, 0.0)),
                    float_compression,
                    quat_compression,
                )

                joint_count = reader.read_packed_int32(compression)
                joint_poses = []
                for _ in range(joint_count):
                    joint_pose = reader.read_packed_se3_delta(
                        ((1.0, 0.0, 0.0, 0.0), (0.0, 0.0, 0.0)),
                        float_compression,
                        quat_compression,
                    )
                    joint_poses.append(se3_to_pose(joint_pose))

                result["updated"].append(
                    {
                        "person_id": person_id,
                        "human_uuid": uuid_pair_to_string(human_uuid[0], human_uuid[1]),
                        "anchor_uid": uuid_pair_to_string(anchor_uid[0], anchor_uid[1]),
                        "root_pose": se3_to_pose(root_pose),
                        "joint_poses": joint_poses,
                    }
                )

            removed_size = reader.read_packed_int32(compression)
            for _ in range(removed_size):
                person_id = reader.read_packed_int32(compression)
                result["removed"].append(person_id)

        except Exception as e:
            raise RuntimeError(f"Failed to deserialize body poses: {e}")

        return result

    @staticmethod
    def deserialize_heartbeat(data: bytes) -> Dict[str, Any]:
        """
        Deserialize ServerHeartbeat messages.
        Returns dict with:
        - server_version: String
        - timestamp: Integer
        """
        reader = BitStreamReader(data)
        compression = BucketedBitStreamCompression()

        result = {
            "server_version": "",
            "timestamp": 0,
        }

        try:
            result["server_version"] = reader.read_packed_string(compression)
            result["timestamp"] = reader.read_packed_int64(compression)

        except Exception as e:
            raise RuntimeError(f"Failed to deserialize heartbeat: {e}")

        return result
