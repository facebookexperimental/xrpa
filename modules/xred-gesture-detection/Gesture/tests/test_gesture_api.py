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

import unittest
from unittest.mock import MagicMock, patch

from gesture_api import GestureAPI, MotionDetector
from xrpa.gesture_detection_types import GestureType, MotionDirection


class MotionDetectorTest(unittest.TestCase):
    def setUp(self) -> None:
        self.detector = MotionDetector(history_size=10, sensitivity=0.02)

    def test_detect_motion_returns_static_with_insufficient_history(self) -> None:
        self.detector.add_position(0.5, 0.5, 100)
        self.detector.add_position(0.6, 0.5, 200)

        result = self.detector.detect_motion()

        self.assertEqual(result.direction, MotionDirection.Static)
        self.assertFalse(result.is_active)
        self.assertEqual(result.speed, 0.0)
        self.assertEqual(result.confidence, 0.0)

    def test_detect_motion_returns_static_below_sensitivity(self) -> None:
        for i in range(5):
            self.detector.add_position(0.5, 0.5, 100 * i)

        result = self.detector.detect_motion()

        self.assertEqual(result.direction, MotionDirection.Static)
        self.assertFalse(result.is_active)

    def test_detect_motion_detects_leftward_movement(self) -> None:
        for i in range(5):
            self.detector.add_position(0.3 + i * 0.05, 0.5, 100 * i)

        result = self.detector.detect_motion()

        self.assertEqual(result.direction, MotionDirection.Left)
        self.assertTrue(result.is_active)
        self.assertGreater(result.speed, 0.0)
        self.assertGreater(result.confidence, 0.0)

    def test_detect_motion_detects_rightward_movement(self) -> None:
        for i in range(5):
            self.detector.add_position(0.7 - i * 0.05, 0.5, 100 * i)

        result = self.detector.detect_motion()

        self.assertEqual(result.direction, MotionDirection.Right)
        self.assertTrue(result.is_active)

    def test_detect_motion_detects_upward_movement(self) -> None:
        for i in range(5):
            self.detector.add_position(0.5, 0.7 - i * 0.05, 100 * i)

        result = self.detector.detect_motion()

        self.assertEqual(result.direction, MotionDirection.Up)
        self.assertTrue(result.is_active)

    def test_detect_motion_detects_downward_movement(self) -> None:
        for i in range(5):
            self.detector.add_position(0.5, 0.3 + i * 0.05, 100 * i)

        result = self.detector.detect_motion()

        self.assertEqual(result.direction, MotionDirection.Down)
        self.assertTrue(result.is_active)

    def test_detect_motion_uses_last_five_positions(self) -> None:
        for i in range(8):
            self.detector.add_position(0.5, 0.5, 100 * i)
        for i in range(5):
            self.detector.add_position(0.5 + (i + 1) * 0.05, 0.5, 900 + 100 * i)

        result = self.detector.detect_motion()

        self.assertEqual(result.direction, MotionDirection.Left)
        self.assertTrue(result.is_active)

    def test_reset_clears_history(self) -> None:
        for i in range(5):
            self.detector.add_position(0.3 + i * 0.1, 0.5, 100 * i)

        self.detector.reset()

        result = self.detector.detect_motion()
        self.assertEqual(result.direction, MotionDirection.Static)
        self.assertFalse(result.is_active)

    def test_old_positions_evicted_when_history_full(self) -> None:
        detector = MotionDetector(history_size=5, sensitivity=0.02)
        # Add 5 positions moving right (decreasing x)
        for i in range(5):
            detector.add_position(0.7 - i * 0.05, 0.5, 100 * i)

        # Verify initial direction is Right
        result = detector.detect_motion()
        self.assertEqual(result.direction, MotionDirection.Right)

        # Add 5 more positions moving left (increasing x)
        for i in range(5):
            detector.add_position(0.5 + i * 0.05, 0.5, 500 + 100 * i)

        # Old positions should be evicted, motion should now be Left
        result = detector.detect_motion()
        self.assertEqual(result.direction, MotionDirection.Left)
        self.assertTrue(result.is_active)

    def test_speed_is_normalized_to_max_one(self) -> None:
        self.detector.add_position(0.0, 0.5, 0)
        self.detector.add_position(0.25, 0.5, 1)
        self.detector.add_position(0.5, 0.5, 2)
        self.detector.add_position(0.75, 0.5, 3)
        self.detector.add_position(1.0, 0.5, 4)

        result = self.detector.detect_motion()

        self.assertLessEqual(result.speed, 1.0)
        self.assertGreaterEqual(result.speed, 0.0)

    def test_confidence_reflects_directional_dominance(self) -> None:
        for i in range(5):
            self.detector.add_position(0.3 + i * 0.1, 0.5, 100 * i)

        result = self.detector.detect_motion()

        self.assertAlmostEqual(result.confidence, 1.0, places=2)


class GestureAPITest(unittest.TestCase):
    def setUp(self) -> None:
        self.api = GestureAPI()

    def test_uninitialized_api_raises_on_detect(self) -> None:
        with self.assertRaises(RuntimeError) as cm:
            self.api._ensure_api_initialized()
        self.assertIn("not initialized", str(cm.exception))

    def test_result_callback_maps_gesture_names_correctly(self) -> None:
        gesture_cat = MagicMock()
        gesture_cat.category_name = "victory"
        gesture_cat.score = 0.85

        landmark = MagicMock(x=0.5, y=0.5, z=0.0)
        landmarks = [landmark for _ in range(21)]

        result_obj = MagicMock()
        result_obj.gestures = [[gesture_cat]]
        result_obj.hand_landmarks = [landmarks]

        mock_image = MagicMock()

        self.api._result_callback(result_obj, mock_image, 1000)

        self.assertEqual(
            self.api._latest_result["gestureType"], GestureType.Victory.value
        )
        self.assertAlmostEqual(self.api._latest_result["confidence"], 0.85)

    def test_map_gesture_name_is_case_insensitive(self) -> None:
        self.assertEqual(self.api._map_gesture_name_to_int("Closed_Fist"), 1)
        self.assertEqual(self.api._map_gesture_name_to_int("OPEN_PALM"), 2)

    def test_map_gesture_name_unknown_returns_zero(self) -> None:
        self.assertEqual(self.api._map_gesture_name_to_int("unknown_gesture"), 0)

    def test_motion_offset_uses_correct_landmark_for_gesture_type(self) -> None:
        # Create 21 landmarks all centered
        landmarks = [MagicMock(x=0.5, y=0.5) for _ in range(21)]
        # Set landmark 4 (thumb tip) to edge position
        landmarks[4] = MagicMock(x=1.0, y=0.5)

        result_obj = MagicMock()
        result_obj.hand_landmarks = [landmarks]

        # ThumbUp uses landmark 4, which is at edge
        offset = self.api._calculate_motion_offset(
            result_obj, GestureType.ThumbUp.value
        )
        self.assertAlmostEqual(offset, 1.0, places=5)

        # OpenPalm uses landmark 9, which is centered
        offset = self.api._calculate_motion_offset(
            result_obj, GestureType.OpenPalm.value
        )
        self.assertAlmostEqual(offset, 0.0, places=5)

    @patch("gesture_api.convert_to_pil")
    def test_detect_gesture_returns_error_on_decode_failure(
        self, mock_convert: MagicMock
    ) -> None:
        # Set up API as initialized
        self.api._initialized = True
        self.api._recognizer = MagicMock()

        # Create mock image that will fail to decode
        image = MagicMock()
        image.data = b"fake"
        image.timestamp = 5000000

        # Simulate decode failure
        mock_convert.return_value = None

        result = self.api.detect_gesture(image)

        self.assertIn("Failed to decode image", result["errorMessage"])
        self.assertFalse(result["handDetected"])

    def test_validate_image_input_raises_on_none(self) -> None:
        with self.assertRaises(ValueError):
            self.api._validate_image_input(None)

    def test_validate_image_input_raises_on_empty_data(self) -> None:
        image = MagicMock()
        image.data = b""
        with self.assertRaises(ValueError):
            self.api._validate_image_input(image)

    def test_validate_image_input_raises_on_missing_data_attr(self) -> None:
        image = MagicMock(spec=[])
        with self.assertRaises(ValueError):
            self.api._validate_image_input(image)

    @patch("gesture_api.os.path.exists", return_value=True)
    @patch("gesture_api.mp")
    def test_set_model_path_triggers_initialization(
        self, mock_mp: MagicMock, mock_exists: MagicMock
    ) -> None:
        mock_recognizer = MagicMock()
        mock_mp.tasks.vision.GestureRecognizer.create_from_options.return_value = (
            mock_recognizer
        )

        self.api.set_model_path("/fake/model.task")

        self.assertTrue(self.api.is_initialized())
        self.assertIsNotNone(self.api._recognizer)

    @patch("gesture_api.os.path.exists", return_value=False)
    def test_initialize_api_raises_on_missing_model_file(
        self, mock_exists: MagicMock
    ) -> None:
        self.api._model_path = "/nonexistent/model.task"

        with self.assertRaises(FileNotFoundError) as cm:
            self.api._initialize_api()
        self.assertIn("not found", str(cm.exception))

    def test_initialize_api_raises_without_model_path(self) -> None:
        with self.assertRaises(ValueError):
            self.api._initialize_api()

    def test_detect_pinch_no_landmarks(self) -> None:
        result_obj = MagicMock(spec=[])
        detected, confidence = self.api._detect_pinch(result_obj)

        self.assertFalse(detected)
        self.assertEqual(confidence, 0.0)

    def test_detect_pinch_empty_landmarks(self) -> None:
        result_obj = MagicMock()
        result_obj.hand_landmarks = []

        detected, confidence = self.api._detect_pinch(result_obj)

        self.assertFalse(detected)
        self.assertEqual(confidence, 0.0)

    def test_detect_pinch_close_fingers(self) -> None:
        thumb = MagicMock(x=0.5, y=0.5, z=0.0)
        index = MagicMock(x=0.51, y=0.51, z=0.0)
        landmarks = [MagicMock() for _ in range(21)]
        landmarks[4] = thumb
        landmarks[8] = index

        result_obj = MagicMock()
        result_obj.hand_landmarks = [landmarks]

        detected, confidence = self.api._detect_pinch(result_obj)

        self.assertTrue(detected)
        self.assertGreater(confidence, 0.0)
        self.assertLessEqual(confidence, 1.0)

    def test_detect_pinch_far_fingers(self) -> None:
        thumb = MagicMock(x=0.1, y=0.1, z=0.0)
        index = MagicMock(x=0.9, y=0.9, z=0.0)
        landmarks = [MagicMock() for _ in range(21)]
        landmarks[4] = thumb
        landmarks[8] = index

        result_obj = MagicMock()
        result_obj.hand_landmarks = [landmarks]

        detected, confidence = self.api._detect_pinch(result_obj)

        self.assertFalse(detected)
        self.assertEqual(confidence, 0.0)

    def test_calculate_motion_offset_no_landmarks(self) -> None:
        result_obj = MagicMock()
        result_obj.hand_landmarks = []

        offset = self.api._calculate_motion_offset(
            result_obj, GestureType.OpenPalm.value
        )

        self.assertEqual(offset, 0.0)

    def test_calculate_motion_offset_centered_hand(self) -> None:
        landmark = MagicMock(x=0.5, y=0.5)
        landmarks = [MagicMock() for _ in range(21)]
        landmarks[9] = landmark

        result_obj = MagicMock()
        result_obj.hand_landmarks = [landmarks]

        offset = self.api._calculate_motion_offset(
            result_obj, GestureType.OpenPalm.value
        )

        self.assertAlmostEqual(offset, 0.0, places=5)

    def test_calculate_motion_offset_edge_hand(self) -> None:
        landmark = MagicMock(x=1.0, y=0.5)
        landmarks = [MagicMock() for _ in range(21)]
        landmarks[9] = landmark

        result_obj = MagicMock()
        result_obj.hand_landmarks = [landmarks]

        offset = self.api._calculate_motion_offset(
            result_obj, GestureType.OpenPalm.value
        )

        self.assertAlmostEqual(offset, 1.0, places=5)

    def test_update_motion_tracking_resets_on_gesture_change(self) -> None:
        landmark = MagicMock(x=0.5, y=0.5)
        landmarks = [MagicMock() for _ in range(21)]
        landmarks[9] = landmark
        result_obj = MagicMock()
        result_obj.hand_landmarks = [landmarks]

        self.api._update_motion_tracking(result_obj, GestureType.OpenPalm.value, 100)
        self.assertEqual(self.api._current_gesture_type, GestureType.OpenPalm.value)

        self.api._update_motion_tracking(result_obj, GestureType.ClosedFist.value, 200)
        self.assertEqual(self.api._current_gesture_type, GestureType.ClosedFist.value)
        self.assertEqual(len(self.api._motion_detector.position_history), 1)

    def test_update_motion_tracking_no_landmarks_returns_static(self) -> None:
        result_obj = MagicMock()
        result_obj.hand_landmarks = []

        motion = self.api._update_motion_tracking(result_obj, 0, 100)

        self.assertEqual(motion.direction, MotionDirection.Static)
        self.assertFalse(motion.is_active)

    def test_result_callback_with_gesture(self) -> None:
        gesture_cat = MagicMock()
        gesture_cat.category_name = "open_palm"
        gesture_cat.score = 0.9

        landmark = MagicMock(x=0.5, y=0.5, z=0.0)
        landmarks = [landmark for _ in range(21)]

        result_obj = MagicMock()
        result_obj.gestures = [[gesture_cat]]
        result_obj.hand_landmarks = [landmarks]

        mock_image = MagicMock()

        self.api._result_callback(result_obj, mock_image, 1000)

        self.assertIsNotNone(self.api._latest_result)
        self.assertEqual(
            self.api._latest_result["gestureType"], GestureType.OpenPalm.value
        )
        self.assertTrue(self.api._latest_result["handDetected"])
        self.assertAlmostEqual(self.api._latest_result["confidence"], 0.9)

    def test_result_callback_no_gesture_resets_state(self) -> None:
        result_obj = MagicMock()
        result_obj.gestures = []

        mock_image = MagicMock()

        self.api._result_callback(result_obj, mock_image, 1000)

        self.assertIsNotNone(self.api._latest_result)
        self.assertEqual(self.api._latest_result["gestureType"], 0)
        self.assertFalse(self.api._latest_result["handDetected"])

    def test_result_callback_pinch_overrides_none_gesture(self) -> None:
        gesture_cat = MagicMock()
        gesture_cat.category_name = "None"
        gesture_cat.score = 0.3

        thumb = MagicMock(x=0.5, y=0.5, z=0.0)
        index = MagicMock(x=0.505, y=0.505, z=0.0)
        landmarks = [MagicMock(x=0.5, y=0.5, z=0.0) for _ in range(21)]
        landmarks[4] = thumb
        landmarks[8] = index

        result_obj = MagicMock()
        result_obj.gestures = [[gesture_cat]]
        result_obj.hand_landmarks = [landmarks]

        mock_image = MagicMock()

        self.api._result_callback(result_obj, mock_image, 1000)

        self.assertEqual(
            self.api._latest_result["gestureType"], GestureType.Pinch.value
        )

    def test_cleanup_releases_recognizer(self) -> None:
        mock_recognizer = MagicMock()
        self.api._recognizer = mock_recognizer
        self.api._initialized = True

        self.api.cleanup()

        mock_recognizer.close.assert_called_once()
        self.assertIsNone(self.api._recognizer)
        self.assertFalse(self.api._initialized)

    @patch("gesture_api.convert_to_pil")
    def test_decode_image_bytes_success(self, mock_convert: MagicMock) -> None:
        import numpy as np
        from PIL import Image as PilImage

        pil_img = PilImage.new("RGB", (10, 10), color=(255, 0, 0))
        mock_convert.return_value = pil_img

        image = MagicMock()
        result = self.api._decode_image_bytes(image)

        self.assertIsNotNone(result)
        self.assertIsInstance(result, np.ndarray)
        self.assertEqual(result.shape, (10, 10, 3))

    @patch("gesture_api.convert_to_pil")
    def test_decode_image_bytes_returns_none_on_failure(
        self, mock_convert: MagicMock
    ) -> None:
        mock_convert.return_value = None

        image = MagicMock()
        result = self.api._decode_image_bytes(image)

        self.assertIsNone(result)

    @patch("gesture_api.convert_to_pil")
    def test_decode_image_bytes_raises_on_exception(
        self, mock_convert: MagicMock
    ) -> None:
        mock_convert.side_effect = Exception("corrupt data")

        image = MagicMock()
        with self.assertRaises(ValueError) as cm:
            self.api._decode_image_bytes(image)
        self.assertIn("Failed to decode", str(cm.exception))


if __name__ == "__main__":
    unittest.main()
