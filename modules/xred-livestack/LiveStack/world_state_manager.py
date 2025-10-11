# (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.

import logging
import time
from typing import Any, Dict, Optional, Set

from xrpa.live_stack_data_store import LiveStackDataStore
from xrpa.live_stack_types import Pose, UnitVector3
from xrpa_runtime.utils.xrpa_types import ObjectUuid


class WorldStateManager:
    """
    Manages the current world state for a LiveStack instance.
    Maintains stateful collections of objects, rooms, doors, anchors, etc.
    Applies incremental delta updates as messages arrive from LiveStack.

    Features:
    - Maintains mappings between LiveStack UUIDs and Xrpa object IDs
    - Applies delta updates (add/update/remove) from LiveStack messages
    - Tracks last update timestamps for stale data detection
    - Provides cleanup on disconnection
    """

    def __init__(
        self,
        instance_id: ObjectUuid,
        data_store: LiveStackDataStore,
        logger: Optional[logging.Logger] = None,
        stale_timeout_seconds: float = 30.0,
    ) -> None:
        """
        Initialize the world state manager.

        Args:
            instance_id: Xrpa ID of the LiveStack instance
            data_store: Xrpa data store for creating/updating objects
            logger: Optional logger instance
            stale_timeout_seconds: Time in seconds before data is considered stale (default: 30s)
        """
        self.instance_id: ObjectUuid = instance_id
        self.data_store: LiveStackDataStore = data_store
        self.logger: logging.Logger = logger or logging.getLogger("WorldStateManager")
        self.stale_timeout_seconds: float = stale_timeout_seconds

        # State dictionaries mapping LiveStack UUIDs to Xrpa object IDs
        # Format: {livestack_uuid_str: xrpa_object_id}
        self._anchor_map: Dict[str, ObjectUuid] = {}
        self._object_map: Dict[str, ObjectUuid] = {}
        self._room_map: Dict[str, ObjectUuid] = {}
        self._door_map: Dict[str, ObjectUuid] = {}
        self._body_pose_map: Dict[str, ObjectUuid] = {}

        # Last update timestamps for stale data detection
        # Format: {xrpa_object_id: timestamp_in_seconds}
        self._anchor_timestamps: Dict[ObjectUuid, float] = {}
        self._object_timestamps: Dict[ObjectUuid, float] = {}
        self._room_timestamps: Dict[ObjectUuid, float] = {}
        self._door_timestamps: Dict[ObjectUuid, float] = {}
        self._body_pose_timestamps: Dict[ObjectUuid, float] = {}
        self._hands_timestamp: Optional[float] = None
        self._eye_gaze_timestamp: Optional[float] = None

        # Single objects for hands and eye gaze (not collections)
        self._hands_id: Optional[ObjectUuid] = None
        self._eye_gaze_id: Optional[ObjectUuid] = None

    def clear_state(self) -> None:
        """
        Clear all state on disconnection.
        Removes all Xrpa objects and clears internal mappings.
        """
        self.logger.info("Clearing world state")

        # Remove all Xrpa objects for this instance
        for xrpa_id in self._anchor_map.values():
            self.data_store.LiveStackAnchor.remove_object(xrpa_id)

        for xrpa_id in self._object_map.values():
            self.data_store.LiveStackObject.remove_object(xrpa_id)

        for xrpa_id in self._room_map.values():
            self.data_store.LiveStackRoom.remove_object(xrpa_id)

        for xrpa_id in self._door_map.values():
            self.data_store.LiveStackDoor.remove_object(xrpa_id)

        for xrpa_id in self._body_pose_map.values():
            self.data_store.LiveStackBodyPose.remove_object(xrpa_id)

        if self._hands_id is not None:
            self.data_store.LiveStackHands.remove_object(self._hands_id)
            self._hands_id = None

        if self._eye_gaze_id is not None:
            self.data_store.LiveStackEyeGaze.remove_object(self._eye_gaze_id)
            self._eye_gaze_id = None

        # Clear maps
        self._anchor_map.clear()
        self._object_map.clear()
        self._room_map.clear()
        self._door_map.clear()
        self._body_pose_map.clear()

        # Clear timestamp maps
        self._anchor_timestamps.clear()
        self._object_timestamps.clear()
        self._room_timestamps.clear()
        self._door_timestamps.clear()
        self._body_pose_timestamps.clear()
        self._hands_timestamp = None
        self._eye_gaze_timestamp = None

    def cleanup_stale_data(self) -> int:
        """
        Remove objects that haven't been updated within the stale timeout period.
        This helps prevent memory leaks from objects that are no longer being tracked
        by LiveStack but weren't explicitly removed.

        Returns:
            Number of stale objects removed
        """
        current_time = time.time()
        cutoff_time = current_time - self.stale_timeout_seconds
        removed_count = 0

        # Check and remove stale anchors
        stale_anchors: Set[str] = set()
        for livestack_id, xrpa_id in self._anchor_map.items():
            last_update = self._anchor_timestamps.get(xrpa_id, 0.0)
            if last_update > 0 and last_update < cutoff_time:
                stale_anchors.add(livestack_id)
                self.data_store.LiveStackAnchor.remove_object(xrpa_id)
                del self._anchor_timestamps[xrpa_id]
                removed_count += 1
                self.logger.info(
                    f"Removed stale anchor {livestack_id} (last update: {current_time - last_update:.1f}s ago)"
                )

        for livestack_id in stale_anchors:
            del self._anchor_map[livestack_id]

        # Check and remove stale objects
        stale_objects: Set[str] = set()
        for livestack_id, xrpa_id in self._object_map.items():
            last_update = self._object_timestamps.get(xrpa_id, 0.0)
            if last_update > 0 and last_update < cutoff_time:
                stale_objects.add(livestack_id)
                self.data_store.LiveStackObject.remove_object(xrpa_id)
                del self._object_timestamps[xrpa_id]
                removed_count += 1
                self.logger.info(
                    f"Removed stale object {livestack_id} (last update: {current_time - last_update:.1f}s ago)"
                )

        for livestack_id in stale_objects:
            del self._object_map[livestack_id]

        # Check and remove stale rooms
        stale_rooms: Set[str] = set()
        for livestack_id, xrpa_id in self._room_map.items():
            last_update = self._room_timestamps.get(xrpa_id, 0.0)
            if last_update > 0 and last_update < cutoff_time:
                stale_rooms.add(livestack_id)
                self.data_store.LiveStackRoom.remove_object(xrpa_id)
                del self._room_timestamps[xrpa_id]
                removed_count += 1
                self.logger.info(
                    f"Removed stale room {livestack_id} (last update: {current_time - last_update:.1f}s ago)"
                )

        for livestack_id in stale_rooms:
            del self._room_map[livestack_id]

        # Check and remove stale doors
        stale_doors: Set[str] = set()
        for livestack_id, xrpa_id in self._door_map.items():
            last_update = self._door_timestamps.get(xrpa_id, 0.0)
            if last_update > 0 and last_update < cutoff_time:
                stale_doors.add(livestack_id)
                self.data_store.LiveStackDoor.remove_object(xrpa_id)
                del self._door_timestamps[xrpa_id]
                removed_count += 1
                self.logger.info(
                    f"Removed stale door {livestack_id} (last update: {current_time - last_update:.1f}s ago)"
                )

        for livestack_id in stale_doors:
            del self._door_map[livestack_id]

        # Check and remove stale body poses
        stale_poses: Set[str] = set()
        for livestack_id, xrpa_id in self._body_pose_map.items():
            last_update = self._body_pose_timestamps.get(xrpa_id, 0.0)
            if last_update > 0 and last_update < cutoff_time:
                stale_poses.add(livestack_id)
                self.data_store.LiveStackBodyPose.remove_object(xrpa_id)
                del self._body_pose_timestamps[xrpa_id]
                removed_count += 1
                self.logger.info(
                    f"Removed stale body pose {livestack_id} (last update: {current_time - last_update:.1f}s ago)"
                )

        for livestack_id in stale_poses:
            del self._body_pose_map[livestack_id]

        # Check and remove stale hands data
        if (
            self._hands_id is not None
            and self._hands_timestamp is not None
            and self._hands_timestamp < cutoff_time
        ):
            self.data_store.LiveStackHands.remove_object(self._hands_id)
            self._hands_id = None
            self._hands_timestamp = None
            removed_count += 1
            self.logger.info(
                f"Removed stale hands data (last update: {current_time - self._hands_timestamp:.1f}s ago)"
            )

        # Check and remove stale eye gaze data
        if (
            self._eye_gaze_id is not None
            and self._eye_gaze_timestamp is not None
            and self._eye_gaze_timestamp < cutoff_time
        ):
            self.data_store.LiveStackEyeGaze.remove_object(self._eye_gaze_id)
            self._eye_gaze_id = None
            self._eye_gaze_timestamp = None
            removed_count += 1
            self.logger.info(
                f"Removed stale eye gaze data (last update: {current_time - self._eye_gaze_timestamp:.1f}s ago)"
            )

        if removed_count > 0:
            self.logger.info(f"Cleaned up {removed_count} stale objects")

        return removed_count

    def update_anchors(self, delta_data: Dict[str, Any]):
        """
        Update anchor state based on delta message.

        Args:
            delta_data: Parsed anchor delta with:
                - updated_islands: list of island anchor entries
                - updated_gravity: list of gravity anchor entries
                - removed_islands: list of removed island anchor UUIDs
                - removed_gravity: list of removed gravity anchor UUIDs
        """
        # Process removed anchors (both gravity and islands)
        for anchor_uuid_str in delta_data.get("removed_gravity", []):
            try:
                if anchor_uuid_str in self._anchor_map:
                    xrpa_id = self._anchor_map[anchor_uuid_str]
                    self.data_store.LiveStackAnchor.remove_object(xrpa_id)
                    del self._anchor_map[anchor_uuid_str]
                    self.logger.debug(f"Removed gravity anchor: {anchor_uuid_str}")
            except Exception as e:
                self.logger.error(
                    f"Failed to remove gravity anchor {anchor_uuid_str}: {e}",
                    exc_info=True,
                )

        for anchor_uuid_str in delta_data.get("removed_islands", []):
            try:
                if anchor_uuid_str in self._anchor_map:
                    xrpa_id = self._anchor_map[anchor_uuid_str]
                    self.data_store.LiveStackAnchor.remove_object(xrpa_id)
                    del self._anchor_map[anchor_uuid_str]
                    self.logger.debug(f"Removed island anchor: {anchor_uuid_str}")
            except Exception as e:
                self.logger.error(
                    f"Failed to remove island anchor {anchor_uuid_str}: {e}",
                    exc_info=True,
                )

        # Process updated/added gravity anchors
        for anchor_data in delta_data.get("updated_gravity", []):
            anchor_uuid_str = anchor_data["id"]

            if anchor_uuid_str in self._anchor_map:
                # Update existing
                xrpa_id = self._anchor_map[anchor_uuid_str]
                anchor = self.data_store.LiveStackAnchor.get_object(xrpa_id)
            else:
                # Create new
                anchor = self.data_store.LiveStackAnchor.create_object()
                xrpa_id = anchor.get_id()
                self._anchor_map[anchor_uuid_str] = xrpa_id
                anchor.set_live_stack_instance(self.instance_id)
                self.logger.debug(f"Created gravity anchor: {anchor_uuid_str}")

            # Update fields - gravity anchors only have gravity direction
            # Gravity is already a UnitVector3 from deserializer
            gravity = anchor_data.get("gravity")
            if gravity:
                anchor.set_gravity_direction(gravity)

            anchor.set_last_update_timestamp(0)  # Gravity anchors don't have timestamps
            self._anchor_timestamps[xrpa_id] = time.time()

        # Process updated/added island anchors
        for anchor_data in delta_data.get("updated_islands", []):
            anchor_uuid_str = anchor_data["id"]

            if anchor_uuid_str in self._anchor_map:
                # Update existing
                xrpa_id = self._anchor_map[anchor_uuid_str]
                anchor = self.data_store.LiveStackAnchor.get_object(xrpa_id)
            else:
                # Create new
                anchor = self.data_store.LiveStackAnchor.create_object()
                xrpa_id = anchor.get_id()
                self._anchor_map[anchor_uuid_str] = xrpa_id
                anchor.set_live_stack_instance(self.instance_id)
                self.logger.debug(f"Created island anchor: {anchor_uuid_str}")

            # Update fields - island anchors have island_index and transform
            island_index = anchor_data.get("island_index", 0)
            anchor.set_island_id(str(island_index))

            # Pose should be a Pose object from deserializer
            pose = anchor_data.get("transform")
            if pose and isinstance(pose, Pose):
                anchor.set_pose_in_island(pose)

            # Set a zero gravity as default for island anchors
            anchor.set_gravity_direction(UnitVector3(x=0.0, y=-1.0, z=0.0))

            anchor.set_last_update_timestamp(0)

    def update_objects(self, delta_data: Dict[str, Any]):
        """
        Update object state based on delta message.

        Args:
            delta_data: Parsed object delta with 'updated' and 'removed' keys
        """
        # Process removed objects
        for obj_uuid_str in delta_data.get("removed", []):
            if obj_uuid_str in self._object_map:
                xrpa_id = self._object_map[obj_uuid_str]
                self.data_store.LiveStackObject.remove_object(xrpa_id)
                del self._object_map[obj_uuid_str]
                self.logger.debug(f"Removed object: {obj_uuid_str}")

        # Process updated/added objects
        for obj_data in delta_data.get("updated", []):
            obj_uuid_str = obj_data["uid"]

            if obj_uuid_str in self._object_map:
                # Update existing
                xrpa_id = self._object_map[obj_uuid_str]
                obj = self.data_store.LiveStackObject.get_object(xrpa_id)
            else:
                # Create new
                obj = self.data_store.LiveStackObject.create_object()
                xrpa_id = obj.get_id()
                self._object_map[obj_uuid_str] = xrpa_id
                obj.set_live_stack_instance(self.instance_id)
                obj.set_live_stack_uuid(obj_uuid_str)
                self.logger.debug(f"Created object: {obj_uuid_str}")

            # Update fields
            obj.set_label(obj_data.get("label", ""))
            obj.set_category(obj_data.get("category", 0))

            # Pose should be a Pose object from deserializer
            pose = obj_data.get("pose")
            if pose and isinstance(pose, Pose):
                obj.set_pose(pose)

            # Size is already a Distance3 from deserializer
            size = obj_data.get("size")
            if size:
                obj.set_size(size)

            # Set anchor reference
            anchor_uuid_str = obj_data.get("anchor_uuid")
            if anchor_uuid_str and anchor_uuid_str in self._anchor_map:
                obj.set_anchor(self._anchor_map[anchor_uuid_str])

            # Set room reference
            room_id = obj_data.get("room_id")
            if room_id and room_id in self._room_map:
                obj.set_room(self._room_map[room_id])

            obj.set_num_inlier_points(obj_data.get("num_inlier_points", 0))
            obj.set_last_update_timestamp(obj_data.get("timestamp", 0))
            self._object_timestamps[xrpa_id] = time.time()

    def update_rooms(self, delta_data: Dict[str, Any]):
        """
        Update room state based on delta message.

        Args:
            delta_data: Parsed room delta with 'updated' and 'removed' keys
        """
        # Process removed rooms
        for room_id_str in delta_data.get("removed", []):
            if room_id_str in self._room_map:
                xrpa_id = self._room_map[room_id_str]
                self.data_store.LiveStackRoom.remove_object(xrpa_id)
                del self._room_map[room_id_str]
                self.logger.debug(f"Removed room: {room_id_str}")

        # Process updated/added rooms
        for room_data in delta_data.get("updated", []):
            room_id_str = room_data["room_id"]

            if room_id_str in self._room_map:
                # Update existing
                xrpa_id = self._room_map[room_id_str]
                room = self.data_store.LiveStackRoom.get_object(xrpa_id)
            else:
                # Create new
                room = self.data_store.LiveStackRoom.create_object()
                xrpa_id = room.get_id()
                self._room_map[room_id_str] = xrpa_id
                room.set_live_stack_instance(self.instance_id)
                room.set_live_stack_room_id(room_id_str)
                self.logger.debug(f"Created room: {room_id_str}")

            # Update fields
            room.set_floor_id(room_data.get("floor_id", ""))

            # Set anchor reference
            anchor_uuid_str = room_data.get("anchor_uid")
            if anchor_uuid_str and anchor_uuid_str in self._anchor_map:
                room.set_anchor(self._anchor_map[anchor_uuid_str])

            # Pose should be a Pose object from deserializer
            pose = room_data.get("pose")
            if pose and isinstance(pose, Pose):
                room.set_pose(pose)

            room.set_floor_height(room_data.get("floor_height", 0.0))
            room.set_ceiling_height(room_data.get("ceiling_height", 0.0))

            # Polygon vertices are already Vector3 objects from deserializer
            vertices = room_data.get("polygon_vertices", [])
            if vertices:
                room.set_polygon_vertices(vertices)

            room.set_last_update_timestamp(room_data.get("timestamp", 0))
            self._room_timestamps[xrpa_id] = time.time()

    def update_doors(self, delta_data: Dict[str, Any]):
        """
        Update door state based on delta message.

        Args:
            delta_data: Parsed door delta with 'updated' and 'removed' keys
        """
        # Process removed doors
        for door_id_str in delta_data.get("removed", []):
            if door_id_str in self._door_map:
                xrpa_id = self._door_map[door_id_str]
                self.data_store.LiveStackDoor.remove_object(xrpa_id)
                del self._door_map[door_id_str]
                self.logger.debug(f"Removed door: {door_id_str}")

        # Process updated/added doors
        for door_data in delta_data.get("updated", []):
            door_id_str = door_data["door_id"]

            if door_id_str in self._door_map:
                # Update existing
                xrpa_id = self._door_map[door_id_str]
                door = self.data_store.LiveStackDoor.get_object(xrpa_id)
            else:
                # Create new
                door = self.data_store.LiveStackDoor.create_object()
                xrpa_id = door.get_id()
                self._door_map[door_id_str] = xrpa_id
                door.set_live_stack_instance(self.instance_id)
                door.set_live_stack_door_id(door_id_str)
                self.logger.debug(f"Created door: {door_id_str}")

            # Update fields
            # Set anchor reference
            anchor_uuid_str = door_data.get("anchor_uid")
            if anchor_uuid_str and anchor_uuid_str in self._anchor_map:
                door.set_anchor(self._anchor_map[anchor_uuid_str])

            # Pose should be a Pose object from deserializer
            pose = door_data.get("pose")
            if pose and isinstance(pose, Pose):
                door.set_pose(pose)

            # Set room references
            front_room_id = door_data.get("front_room_id")
            if front_room_id and front_room_id in self._room_map:
                door.set_front_room(self._room_map[front_room_id])

            back_room_id = door_data.get("back_room_id")
            if back_room_id and back_room_id in self._room_map:
                door.set_back_room(self._room_map[back_room_id])

            door.set_width(door_data.get("width", 0.0))
            door.set_height(door_data.get("height", 0.0))
            door.set_last_update_timestamp(door_data.get("timestamp", 0))
            self._door_timestamps[xrpa_id] = time.time()

    def update_hands(self, hands_data: Dict[str, Any]):
        """
        Update hands state.

        Args:
            hands_data: Parsed hands data
        """
        # Create hands object if it doesn't exist
        if self._hands_id is None:
            hands = self.data_store.LiveStackHands.create_object()
            self._hands_id = hands.get_id()
            hands.set_live_stack_instance(self.instance_id)
            self.logger.debug("Created hands object")
        else:
            hands = self.data_store.LiveStackHands.get_object(self._hands_id)

        # Set anchor reference
        anchor_uuid_str = hands_data.get("anchor_uid")
        if anchor_uuid_str and anchor_uuid_str in self._anchor_map:
            hands.set_anchor(self._anchor_map[anchor_uuid_str])

        # Update tracking status
        hands.set_is_left_hand_tracked(hands_data.get("is_left_hand_tracked", False))
        hands.set_is_right_hand_tracked(hands_data.get("is_right_hand_tracked", False))

        # Landmarks are already Vector3 objects from deserializer
        left_landmarks = hands_data.get("left_hand_landmarks", [])
        if left_landmarks:
            hands.set_left_hand_landmarks(left_landmarks)

        right_landmarks = hands_data.get("right_hand_landmarks", [])
        if right_landmarks:
            hands.set_right_hand_landmarks(right_landmarks)

        hands.set_last_update_timestamp(hands_data.get("timestamp", 0))
        self._hands_timestamp = time.time()

    def update_eye_gaze(self, gaze_data: Dict[str, Any]):
        """
        Update eye gaze state.

        Args:
            gaze_data: Parsed eye gaze data
        """
        # Create eye gaze object if it doesn't exist
        if self._eye_gaze_id is None:
            gaze = self.data_store.LiveStackEyeGaze.create_object()
            self._eye_gaze_id = gaze.get_id()
            gaze.set_live_stack_instance(self.instance_id)
            self.logger.debug("Created eye gaze object")
        else:
            gaze = self.data_store.LiveStackEyeGaze.get_object(self._eye_gaze_id)

        # Set anchor reference
        anchor_uuid_str = gaze_data.get("anchor_uid")
        if anchor_uuid_str and anchor_uuid_str in self._anchor_map:
            gaze.set_anchor(self._anchor_map[anchor_uuid_str])

        # Gaze origin and direction are already Vector3 and UnitVector3 from deserializer
        origin = gaze_data.get("gaze_origin")
        if origin:
            gaze.set_gaze_origin(origin)

        direction = gaze_data.get("gaze_direction")
        if direction:
            gaze.set_gaze_direction(direction)

        gaze.set_last_update_timestamp(gaze_data.get("timestamp", 0))
        self._eye_gaze_timestamp = time.time()

    def update_body_poses(self, delta_data: Dict[str, Any]):
        """
        Update body pose state based on delta message.

        Args:
            delta_data: Parsed body pose delta with 'updated' and 'removed' keys
        """
        # Process removed body poses
        for person_id_str in delta_data.get("removed", []):
            if person_id_str in self._body_pose_map:
                xrpa_id = self._body_pose_map[person_id_str]
                self.data_store.LiveStackBodyPose.remove_object(xrpa_id)
                del self._body_pose_map[person_id_str]
                self.logger.debug(f"Removed body pose: {person_id_str}")

        # Process updated/added body poses
        for pose_data in delta_data.get("updated", []):
            person_id = pose_data.get("person_id", 0)
            person_id_str = str(person_id)

            if person_id_str in self._body_pose_map:
                # Update existing
                xrpa_id = self._body_pose_map[person_id_str]
                body_pose = self.data_store.LiveStackBodyPose.get_object(xrpa_id)
            else:
                # Create new
                body_pose = self.data_store.LiveStackBodyPose.create_object()
                xrpa_id = body_pose.get_id()
                self._body_pose_map[person_id_str] = xrpa_id
                body_pose.set_live_stack_instance(self.instance_id)
                body_pose.set_live_stack_person_id(person_id)
                self.logger.debug(f"Created body pose: {person_id_str}")

            # Update fields
            body_pose.set_live_stack_human_uuid(pose_data.get("human_uuid", ""))

            # Set anchor reference
            anchor_uuid_str = pose_data.get("anchor_uid")
            if anchor_uuid_str and anchor_uuid_str in self._anchor_map:
                body_pose.set_anchor(self._anchor_map[anchor_uuid_str])

            # Root pose should be a Pose object from deserializer
            root_pose = pose_data.get("root_pose")
            if root_pose and isinstance(root_pose, Pose):
                body_pose.set_root_pose(root_pose)

            # Update joint poses - should already be a list of Pose objects
            joint_poses = pose_data.get("joint_poses", [])
            if joint_poses:
                body_pose.set_joint_poses(joint_poses)

            body_pose.set_last_update_timestamp(pose_data.get("timestamp", 0))
            self._body_pose_timestamps[xrpa_id] = time.time()
