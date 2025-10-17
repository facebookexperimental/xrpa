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

import io
import os
import time
from typing import Any, Dict, Optional

import mediapipe as mp
import numpy as np
from PIL import Image

from xrpa.gesture_detection_types import GestureType


class GestureAPI:
    def __init__(self, model_path: Optional[str] = None):
        self._model_path = model_path
        self._recognizer = None
        self._initialized = False
        self._latest_result = None
        self._frame_timestamp_ms = 0

    def set_model_path(self, model_path: str) -> None:
        self._model_path = model_path
        if model_path:
            self._initialize_api()

    def _initialize_api(self) -> None:
        if not self._model_path:
            raise ValueError("Model path is required for initialization")

        if not os.path.exists(self._model_path):
            raise FileNotFoundError(
                f"Gesture recognizer model file not found at: {self._model_path}\n"
                f"Please ensure gesture_recognizer.task is present in the Gesture directory."
            )

        try:
            print("[GestureAPI]: Initializing MediaPipe Gesture Recognizer...")

            BaseOptions = mp.tasks.BaseOptions
            GestureRecognizer = mp.tasks.vision.GestureRecognizer
            GestureRecognizerOptions = mp.tasks.vision.GestureRecognizerOptions
            VisionRunningMode = mp.tasks.vision.RunningMode

            options = GestureRecognizerOptions(
                base_options=BaseOptions(model_asset_path=self._model_path),
                running_mode=VisionRunningMode.LIVE_STREAM,
                num_hands=1,
                min_hand_detection_confidence=0.5,
                min_hand_presence_confidence=0.5,
                min_tracking_confidence=0.5,
                result_callback=self._result_callback,
            )

            self._recognizer = GestureRecognizer.create_from_options(options)

            print(
                "[GestureAPI]: Gesture Recognizer initialized successfully (LIVE_STREAM mode)"
            )
            self._initialized = True

        except Exception as e:
            print(f"[GestureAPI]: Failed to initialize API: {e}")
            import traceback

            traceback.print_exc()

    def _result_callback(self, result, output_image: mp.Image, timestamp_ms: int):
        if result and result.gestures:
            gesture_category = result.gestures[0][0]
            gesture_name = gesture_category.category_name
            confidence = gesture_category.score

            pinch_detected, pinch_confidence = self._detect_pinch(result)

            PINCH_CONFIDENCE_THRESHOLD = 0.5
            if (
                pinch_detected
                and pinch_confidence > PINCH_CONFIDENCE_THRESHOLD
                and gesture_name.lower() == "none"
            ):
                gesture_type_id = GestureType.Pinch.value
                confidence = pinch_confidence
            else:
                # Map MediaPipe gesture name to integer
                gesture_type_id = self._map_gesture_name_to_int(gesture_name)

            self._latest_result = {
                "gestureType": gesture_type_id,
                "handDetected": True,
                "confidence": confidence,
                "errorMessage": "",
            }
        else:
            self._latest_result = {
                "gestureType": 0,
                "handDetected": False,
                "confidence": 0.0,
                "errorMessage": "",
            }

    def detect_gesture(self, image) -> Dict[str, Any]:
        self._ensure_api_initialized()
        self._validate_image_input(image)

        timestamp = getattr(image, "timestamp", int(time.time() * 1000000))

        try:
            image_array = self._decode_image_bytes(image)

            timestamp_ms = int(timestamp / 1000)
            self._frame_timestamp_ms = timestamp_ms

            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_array)
            self._recognizer.recognize_async(mp_image, timestamp_ms)

            if self._latest_result:
                result = self._latest_result.copy()
                result["timestamp"] = timestamp
                return result
            else:
                return self._create_gesture_result(
                    timestamp,
                    gesture_type=0,
                    hand_detected=False,
                    confidence=0.0,
                    error="",
                )

        except Exception as e:
            print(f"[GestureAPI]: Error during gesture detection: {e}")
            import traceback

            traceback.print_exc()
            return self._create_gesture_result(
                timestamp,
                gesture_type=0,
                hand_detected=False,
                confidence=0.0,
                error=str(e),
            )

    def _ensure_api_initialized(self) -> None:
        if not self._initialized or self._recognizer is None:
            if self._model_path:
                self._initialize_api()
            else:
                raise RuntimeError("API not initialized. Please set model path first.")

    def _validate_image_input(self, image) -> None:
        if not image or not hasattr(image, "data") or not image.data:
            raise ValueError("Image data cannot be empty")

    def _create_gesture_result(
        self,
        timestamp: int,
        gesture_type: int,
        hand_detected: bool,
        confidence: float,
        error: str,
    ) -> Dict[str, Any]:
        return {
            "timestamp": timestamp,
            "gestureType": gesture_type,
            "handDetected": hand_detected,
            "confidence": confidence,
            "errorMessage": error,
        }

    def _decode_image_bytes(self, image) -> np.ndarray:
        try:
            if hasattr(image, "encoding") and image.encoding.value == 0:
                pil_image = Image.frombytes(
                    "RGB", (image.width, image.height), image.data
                )
            else:
                pil_image = Image.open(io.BytesIO(image.data))
                pil_image = pil_image.convert("RGB")

            if hasattr(image, "orientation"):
                if image.orientation.value == 1:
                    pil_image = pil_image.rotate(-90, expand=True)
                elif image.orientation.value == 2:
                    pil_image = pil_image.rotate(90, expand=True)
                elif image.orientation.value == 3:
                    pil_image = pil_image.rotate(180, expand=True)

            rgb_array = np.array(pil_image)

            return rgb_array

        except Exception as e:
            raise ValueError(f"Failed to decode image data: {e}")

    def _detect_pinch(self, result) -> tuple[bool, float]:
        if (
            not hasattr(result, "hand_landmarks")
            or not result.hand_landmarks
            or len(result.hand_landmarks) == 0
        ):
            return False, 0.0

        hand_landmarks = result.hand_landmarks[0]

        # Thumb tip is landmark 4, index finger tip is landmark 8
        thumb_tip = hand_landmarks[4]
        index_tip = hand_landmarks[8]

        distance = np.sqrt(
            (thumb_tip.x - index_tip.x) ** 2
            + (thumb_tip.y - index_tip.y) ** 2
            + (thumb_tip.z - index_tip.z) ** 2
        )

        PINCH_THRESHOLD = 0.1

        if distance < PINCH_THRESHOLD:
            confidence = min(1.0, (PINCH_THRESHOLD - distance) / PINCH_THRESHOLD)
            print(
                f"[GestureAPI]: ✅ Pinch detected! Distance: {distance:.4f}, Confidence: {confidence:.2f}"
            )
            return True, confidence

        return False, 0.0

    def _map_gesture_name_to_int(self, gesture_name: str) -> int:
        gesture_name_lower = gesture_name.lower()

        gesture_mapping = {
            "none": 0,
            "closed_fist": 1,
            "open_palm": 2,
            "pointing_up": 3,
            "thumb_down": 4,
            "thumb_up": 5,
            "victory": 6,
            "iloveyou": 7,
        }

        return gesture_mapping.get(gesture_name_lower, 0)

    def is_initialized(self) -> bool:
        return self._initialized and self._recognizer is not None

    def cleanup(self) -> None:
        if self._recognizer:
            self._recognizer.close()
            self._recognizer = None
            self._initialized = False
