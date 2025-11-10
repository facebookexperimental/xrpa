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
import torch

import xrpa_runtime.utils.xrpa_module
from PIL import Image as PilImage
from transformers import AutoImageProcessor, DeformableDetrForObjectDetection
from xrpa.object_recognition_application_interface import (
    ObjectRecognitionApplicationInterface,
)
from xrpa.object_recognition_data_store import ReconciledObjectRecognition
from xrpa_runtime.utils.image_types import Image as XrpaImage
from xrpa_runtime.utils.image_utils import convert_to_pil


# Device configuration
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("Using device:", "cuda" if torch.cuda.is_available() else "cpu")

# Load model
processor = AutoImageProcessor.from_pretrained("facebook/deformable-detr-detic")
model = DeformableDetrForObjectDetection.from_pretrained(
    "facebook/deformable-detr-detic"
)


def run_object_detection(image: PilImage):
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

    def set_image(self, image: XrpaImage):
        self._last_image = image

    def tick(self):
        if self._last_image is None:
            return

        pil_image = convert_to_pil(self._last_image)

        # run the object detection model
        run_object_detection(pil_image)

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
