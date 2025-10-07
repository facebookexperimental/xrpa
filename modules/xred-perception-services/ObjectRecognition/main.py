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

import cv2
import numpy as np
import torch

import xrpa_runtime.utils.xrpa_module
from PIL import Image
from transformers import AutoImageProcessor, DeformableDetrForObjectDetection
from xrpa.object_recognition_application_interface import (
    ObjectRecognitionApplicationInterface,
)
from xrpa.object_recognition_data_store import ReconciledObjectRecognition
from xrpa.object_recognition_types import ImageOrientation, ImageRgbImage


# Device configuration
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("Using device:", "cuda" if torch.cuda.is_available() else "cpu")

# Load model
processor = AutoImageProcessor.from_pretrained("facebook/deformable-detr-detic")
model = DeformableDetrForObjectDetection.from_pretrained(
    "facebook/deformable-detr-detic"
)


def run_object_detection(image_bgr):
    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    image = Image.fromarray(image_rgb)

    inputs = processor(images=image, return_tensors="pt")
    outputs = model(**inputs)

    target_sizes = torch.tensor([image.size[::-1]])
    results = processor.post_process_object_detection(
        outputs, target_sizes=target_sizes, threshold=0.5
    )[0]

    ret = []
    for label, box in zip(results["labels"], results["boxes"]):
        box = [round(i) for i in box.tolist()]
        ret.append((model.config.id2label[label.item()], box))

    return ret


class ObjectRecognition(ReconciledObjectRecognition):
    def __init__(self, id, collection):
        super().__init__(id, collection)
        self._last_image = None
        self.on_rgb_image(lambda _, reader: self.set_image(reader.get_image()))

    def set_image(self, image: ImageRgbImage):
        self._last_image = image

    def tick(self):
        if self._last_image is None:
            return

        # decompress the jpeg image data
        jpeg_np = np.frombuffer(self._last_image.data, dtype=np.uint8)
        bgr_frame = cv2.imdecode(jpeg_np, cv2.IMREAD_COLOR)

        # rotate the image to the correct orientation
        if self._last_image.orientation == ImageOrientation.RotatedCW:
            bgr_frame = cv2.rotate(bgr_frame, cv2.ROTATE_90_COUNTERCLOCKWISE)
        elif self._last_image.orientation == ImageOrientation.RotatedCCW:
            bgr_frame = cv2.rotate(bgr_frame, cv2.ROTATE_90_CLOCKWISE)
        elif self._last_image.orientation == ImageOrientation.Rotated180:
            bgr_frame = cv2.rotate(bgr_frame, cv2.ROTATE_180)

        # run the object detection model
        results = run_object_detection(bgr_frame)

        for label, box in results:
            x_min, y_min, x_max, y_max = box

            # Draw the bounding box and label on the image
            cv2.rectangle(bgr_frame, (x_min, y_min), (x_max, y_max), (0, 255, 0), 2)
            cv2.putText(
                bgr_frame,
                label,
                (x_min, y_min - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (0, 255, 0),
                2,
            )

        # ==== Show output ====
        cv2.imshow("Object Detection", bgr_frame)

        # clear the image var so it does not get processed again
        self._last_image = None


def tick(module: ObjectRecognitionApplicationInterface):
    for (
        object_recognition
    ) in module.object_recognition_data_store.ObjectRecognition.get_enumerator():
        object_recognition.tick()

    # check for keyboard input in the cv2 window
    key = cv2.waitKey(1)
    if key == 27:
        module.stop()


def stop_on_enter_keypress(module: xrpa_runtime.utils.xrpa_module.XrpaModule):
    while True:
        sys.stdin.readline()
        module.stop()


def main():
    module = ObjectRecognitionApplicationInterface()

    input_thread = threading.Thread(target=stop_on_enter_keypress, args=(module,))
    input_thread.daemon = True
    input_thread.start()

    module.object_recognition_data_store.ObjectRecognition.set_create_delegate(
        lambda id, _, collection: ObjectRecognition(id, collection)
    )
    module.run(100, lambda: tick(module))
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
    sys.exit(0)
