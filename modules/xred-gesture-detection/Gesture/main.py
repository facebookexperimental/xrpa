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

import os
import sys
import threading
import traceback

import xrpa_runtime.utils.xrpa_module
from gesture_api import GestureAPI
from xrpa.gesture_application_interface import GestureApplicationInterface
from xrpa.gesture_detection_data_store import (
    ImageInputReader,
    ReconciledGestureDetection,
)
from xrpa.gesture_detection_types import GestureType


def get_resource_path(relative_path):
    """Get absolute path to resource, works for dev and for PyInstaller"""
    try:
        # PyInstaller creates a temp folder and stores path in _MEIPASS
        base_path = sys._MEIPASS
    except AttributeError:
        # Development environment - use script directory
        base_path = os.path.dirname(__file__)

    return os.path.join(base_path, relative_path)


MODEL_PATH = get_resource_path("gesture_recognizer.task")


class GestureDetectionModule(ReconciledGestureDetection):
    def __init__(self, id, collection):
        super().__init__(id, collection)
        self._api = GestureAPI()
        self._api.set_model_path(MODEL_PATH)
        self.on_image_input(self._handle_image_input)

    def _handle_image_input(self, timestamp, data: ImageInputReader):
        if not self._api.is_initialized():
            return

        image = data.get_image()
        if not self._validate_image(image):
            print("[GestureDetection]: Image validation failed")
            return

        try:
            gesture_result = self._api.detect_gesture(image)
            self._send_result(gesture_result)
        except Exception as e:
            print(f"[GestureDetection]: Error processing gesture detection: {e}")
            traceback.print_exc()

    def _validate_image(self, image) -> bool:
        if image is None:
            return False
        if not hasattr(image, "data") or not image.data:
            return False
        return True

    def _send_result(self, gesture_result):
        try:
            gesture_enum = GestureType(gesture_result["gestureType"])
            print(
                f"[GestureDetection]: Converted gesture {gesture_result['gestureType']} to enum: {gesture_enum}"
            )

            self.send_gesture_result(
                gesture_result["timestamp"],
                gesture_enum,
                gesture_result["confidence"],
                gesture_result["handDetected"],
                gesture_result["errorMessage"],
            )
            print("[GestureDetection]: Successfully sent gesture result to XRPA")
        except Exception as e:
            print(f"[GestureDetection]: Error sending gesture result: {e}")
            traceback.print_exc()


def tick(module: GestureApplicationInterface):
    for _ in module.gesture_detection_data_store.GestureDetection.get_enumerator():
        pass


def stop_on_enter_keypress(module: xrpa_runtime.utils.xrpa_module.XrpaModule):
    while True:
        sys.stdin.readline()
        module.stop()


def main():
    module = GestureApplicationInterface()

    input_thread = threading.Thread(target=stop_on_enter_keypress, args=(module,))
    input_thread.daemon = True
    input_thread.start()

    module.gesture_detection_data_store.GestureDetection.set_create_delegate(
        lambda id, _, collection: GestureDetectionModule(id, collection)
    )

    print("Gesture Detection started")
    module.run(30, lambda: tick(module))


if __name__ == "__main__":
    main()
    sys.exit(0)
