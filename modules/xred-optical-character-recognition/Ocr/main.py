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

import sys
import threading
import time
import traceback

import easyocr
import numpy as np
import xrpa_runtime.utils.xrpa_module
from PIL import Image as PilImage
from xrpa.ocr_application_interface import OcrApplicationInterface
from xrpa.optical_character_recognition_data_store import (
    ImageInputReader,
    ReconciledOpticalCharacterRecognition,
)
from xrpa_runtime.utils.image_utils import convert_to_pil


class EasyOCROpticalCharacterRecognition(ReconciledOpticalCharacterRecognition):
    def __init__(self, id, collection):
        super().__init__(id, collection)
        self._ocr = None
        self._initialized = False
        self._last_trigger_id = 0
        self._waiting_for_fresh_image = False

        self.on_image_input(self._handle_image_input)
        self._initialize_model()

    def _initialize_model(self):
        if self._initialized:
            return True

        try:
            print("[EasyOCR]: Initializing EasyOCR...")
            self._ocr = easyocr.Reader(["en"], gpu=False)
            self._initialized = True
            print("[EasyOCR]: EasyOCR initialization completed successfully")
            return True

        except Exception as e:
            print(f"[EasyOCR]: Error initializing EasyOCR: {e}")
            traceback.print_exc()
            self._initialized = False
            return False

    def _handle_xrpa_fields_changed(self, fields_changed: int) -> None:
        if self.check_trigger_id_changed(fields_changed):
            current_trigger_id = self.get_trigger_id()
            if current_trigger_id > self._last_trigger_id:
                print(
                    f"[EasyOCR]: Trigger ID changed from {self._last_trigger_id} to {current_trigger_id}"
                )
                self._last_trigger_id = current_trigger_id
                print("[EasyOCR]: Trigger received - waiting for next fresh image")
                self._waiting_for_fresh_image = True

        if self.check_immediate_mode_changed(fields_changed):
            immediate_mode = self.get_immediate_mode()
            print(f"[EasyOCR]: Immediate mode changed to: {immediate_mode}")

    def _handle_image_input(self, timestamp, data: ImageInputReader):
        try:
            image = data.get_image()
            if not self._validate_image(image):
                return

            if self.get_immediate_mode() or self._waiting_for_fresh_image:
                if self._waiting_for_fresh_image:
                    print("[EasyOCR]: Fresh image received - processing now")
                self._waiting_for_fresh_image = False
                pil_image = convert_to_pil(image)
                if pil_image is not None:
                    self._process_image(pil_image, timestamp)

        except Exception as e:
            print(f"[EasyOCR]: Error in _handle_image_input: {e}")
            traceback.print_exc()
            self._send_error_result(str(e))

    def _process_image(self, pil_image: PilImage, timestamp):
        try:
            print(f"[EasyOCR]: Processing image at timestamp {timestamp}")
            ocr_result = self._recognize_text(pil_image)
            self._send_result(ocr_result, timestamp)

        except Exception as e:
            print(f"[EasyOCR]: Error processing image: {e}")
            traceback.print_exc()
            self._send_error_result(str(e))

    def _recognize_text(self, pil_image: PilImage):
        print("[EasyOCR]: *** STARTING OCR RECOGNITION ***")
        sys.stdout.flush()
        try:
            print(f"[EasyOCR]: Processing image with size: {pil_image.size}")

            img_array = np.array(pil_image)

            print("[EasyOCR]: Running EasyOCR with optimized camera settings...")

            result = self._ocr.readtext(
                img_array,
                width_ths=0.4,
                height_ths=0.4,
                paragraph=False,
                adjust_contrast=0.5,
                text_threshold=0.6,
                low_text=0.3,
                link_threshold=0.3,
                canvas_size=2560,
                mag_ratio=1.5,
            )

            print(f"[EasyOCR]: Raw OCR result: {result}")

            final_text = ""
            if result:
                for detection in result:
                    if len(detection) >= 3:
                        text = detection[1]
                        confidence = detection[2]
                        print(
                            f"[EasyOCR]: Detected text: '{text}' (confidence: {confidence:.3f})"
                        )
                        final_text += " " + text

            cleaned_text = final_text.strip()
            print(f"[EasyOCR]: Final combined text: '{cleaned_text}'")
            print(f"[EasyOCR]: Text length: {len(cleaned_text)}")

            return {
                "text": cleaned_text,
                "timestamp": time.time(),
                "success": True,
                "error_message": "",
            }

        except Exception as e:
            error_msg = f"Error during OCR processing: {str(e)}"
            print(f"[EasyOCR]: {error_msg}")
            traceback.print_exc()
            return {
                "text": "",
                "timestamp": time.time(),
                "success": False,
                "error_message": error_msg,
            }

    def _validate_image(self, image) -> bool:
        if image is None:
            print("[EasyOCR]: Image is None")
            return False
        if not hasattr(image, "data") or not image.data:
            print("[EasyOCR]: Image data is empty or missing")
            return False
        return True

    def _send_result(self, ocr_result, image_timestamp_ns):
        try:
            print(f"[EasyOCR]: Preparing to send OCR result: {ocr_result}")

            self.send_ocr_result(
                ocr_result["text"],
                image_timestamp_ns,
                ocr_result["success"],
                ocr_result["error_message"],
            )
            print("[EasyOCR]: Successfully sent OCR result to XRPA")
        except Exception as e:
            print(f"[EasyOCR]: Error sending OCR result: {e}")
            traceback.print_exc()

    def _send_error_result(self, error_message):
        try:
            timestamp_ns = int(time.time() * 1_000_000_000)

            self.send_ocr_result(
                "",
                timestamp_ns,
                False,
                error_message,
            )
            print(f"[EasyOCR]: Sent error result: {error_message}")
        except Exception as e:
            print(f"[EasyOCR]: Error sending error result: {e}")
            traceback.print_exc()


def tick(module: OcrApplicationInterface):
    for _ in module.optical_character_recognition_data_store.OpticalCharacterRecognition.get_enumerator():
        pass


def stop_on_enter_keypress(module: xrpa_runtime.utils.xrpa_module.XrpaModule):
    while True:
        sys.stdin.readline()
        module.stop()


def main():
    module = OcrApplicationInterface()

    input_thread = threading.Thread(target=stop_on_enter_keypress, args=(module,))
    input_thread.daemon = True
    input_thread.start()

    module.optical_character_recognition_data_store.OpticalCharacterRecognition.set_create_delegate(
        lambda id, _, collection: EasyOCROpticalCharacterRecognition(id, collection)
    )

    print("EasyOCR Optical Character Recognition started")
    print("Press Enter to stop...")
    module.run(30, lambda: tick(module))


if __name__ == "__main__":
    main()
    sys.exit(0)
