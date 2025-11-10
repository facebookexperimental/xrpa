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

import queue
import sys
import threading

import pyglet
from PIL import Image as PilImage
from xrpa.image_viewer_application_interface import ImageViewerApplicationInterface
from xrpa.image_viewer_data_store import ReconciledImageWindow
from xrpa_runtime.utils.image_utils import convert_to_pil

FRAME_RATE = 120

_window_requests = queue.Queue()
_image_updates = queue.Queue()
_active_windows = {}
_module_running = True


class ImageDebugWindow(pyglet.window.Window):
    def __init__(self, name, width, height):
        super().__init__(
            width=width,
            height=height,
            caption=f"ImageViewer - {name}",
            resizable=True,
        )
        self.image_sprite = None
        self.original_image_size = None

    def on_draw(self):
        self.clear()
        if hasattr(self, "image_sprite") and self.image_sprite:
            self.image_sprite.draw()
        elif hasattr(self, "waiting_text") and self.waiting_text:
            self.waiting_text.draw()

    def on_resize(self, width, height):
        super().on_resize(width, height)
        if hasattr(self, "waiting_text") and self.waiting_text:
            self.waiting_text.x = width // 2
            self.waiting_text.y = height // 2

        self._update_sprite_scale()

    def update_image(self, pil_image):
        try:
            pil_image = pil_image.transpose(PilImage.FLIP_LEFT_RIGHT)
            self.original_image_size = (pil_image.width, pil_image.height)
            self.image_sprite = self._create_sprite(pil_image)
            self._update_sprite_scale()
        except Exception as e:
            print(f"Error processing image: {e}")

    def _create_sprite(self, pil_image: PilImage):
        image_bytes = pil_image.tobytes()
        pyglet_image = pyglet.image.ImageData(
            pil_image.width,
            pil_image.height,
            "RGBA",
            image_bytes,
            pitch=-pil_image.width * 4,
        )
        return pyglet.sprite.Sprite(pyglet_image)

    def _update_sprite_scale(self):
        if (
            not hasattr(self, "image_sprite")
            or not self.image_sprite
            or not hasattr(self, "original_image_size")
            or not self.original_image_size
        ):
            return

        orig_width, orig_height = self.original_image_size

        scale_x = self.width / orig_width
        scale_y = self.height / orig_height
        scale = min(scale_x, scale_y)

        self.image_sprite.scale = scale
        scaled_width = orig_width * scale
        scaled_height = orig_height * scale
        self.image_sprite.x = (self.width - scaled_width) // 2
        self.image_sprite.y = (self.height - scaled_height) // 2


class ImageWindow(ReconciledImageWindow):
    def __init__(self, id, collection, source):
        super().__init__(id, collection)
        self.window_id = str(id)
        self.on_image(
            lambda _, image: _image_updates.put(
                (
                    self.window_id,
                    self.get_name(),
                    convert_to_pil(image.get_image(), "RGBA"),
                )
            )
        )
        self.on_xrpa_delete(self.close)

    def close(self):
        _window_requests.put(("close", self.window_id, None))


def _handle_window_requests():
    try:
        while True:
            action, window_id, _ = _window_requests.get_nowait()
            if action == "close":
                if window_id in _active_windows:
                    _active_windows[window_id].close()
                    del _active_windows[window_id]
    except queue.Empty:
        pass


def _handle_image_updates():
    try:
        while True:
            window_id, window_name, pil_image = _image_updates.get_nowait()

            if window_id not in _active_windows and pil_image is not None:
                _active_windows[window_id] = ImageDebugWindow(
                    window_name, pil_image.width, pil_image.height
                )

            if window_id in _active_windows:
                _active_windows[window_id].update_image(pil_image)
    except queue.Empty:
        pass


def _process_requests(dt):
    _handle_window_requests()
    _handle_image_updates()
    if not _module_running:
        pyglet.app.exit()


def _tick(module):
    for _ in module.image_viewer_data_store.ImageWindow.get_enumerator():
        pass


def _monitor_shutdown(module):
    global _module_running
    while True:
        sys.stdin.readline()
        print("Shutting down...")
        module.stop()
        _module_running = False
        break


def _run_module(module):
    global _module_running
    try:
        module.run(FRAME_RATE, lambda: _tick(module))
    finally:
        _module_running = False


def main():
    module = ImageViewerApplicationInterface()

    threading.Thread(target=_monitor_shutdown, args=(module,), daemon=True).start()

    module.image_viewer_data_store.ImageWindow.set_create_delegate(
        lambda id, source, collection: ImageWindow(id, collection, source)
    )

    print("ImageViewer started")
    print("Waiting for image data from other modules...")
    print("Press Enter to shut down")

    threading.Thread(target=_run_module, args=(module,), daemon=True).start()
    pyglet.clock.schedule_interval(_process_requests, 1.0 / FRAME_RATE)
    pyglet.app.run()


if __name__ == "__main__":
    main()
    sys.exit(0)
