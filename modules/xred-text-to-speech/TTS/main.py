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
import traceback

import numpy as np
import torch
import xrpa_runtime
import xrpa_runtime.utils.xrpa_module
from xrpa.text_to_speech_application_interface import TextToSpeechApplicationInterface
from xrpa.text_to_speech_data_store import ReconciledTextToSpeech, TextRequestReader

try:
    from chatterbox.tts import ChatterboxTTS

    CHATTERBOX_AVAILABLE = True
except ImportError:
    CHATTERBOX_AVAILABLE = False

FRAME_COUNT = 1024
NUM_CHANNELS = 2
DEVICE_PRIORITY = ["cuda", "mps", "cpu"]
TICK_RATE = 30

_shared_model = None
_instance_count = 0
_instance_lock = threading.Lock()


class TextToSpeech(ReconciledTextToSpeech):
    def __init__(self, id, collection):
        global _instance_count
        super().__init__(id, collection)
        self._audio_data = None
        self._audio_callback_setup = False
        self._request_queue = queue.Queue(maxsize=100)
        self._audio_queue = queue.Queue(maxsize=100)
        self._worker_thread = None
        self._stop_worker = False
        self._current_request_id = None
        self._current_timestamp = None

        with _instance_lock:
            _instance_count += 1

        self.on_text_request(self._handle_text_request_message)

        self._worker_thread = threading.Thread(target=self._process_queue)
        self._worker_thread.daemon = True
        self._worker_thread.start()

    def __del__(self):
        if hasattr(self, "_worker_thread") and self._worker_thread is not None:
            self._stop_worker = True
            if self._worker_thread.is_alive():
                self._worker_thread.join(timeout=1.0)

    def _audio_callback(self, channel_data, frames_per_second, cur_read_pos):
        frames_written = 0

        try:
            if self._audio_data is None and not self._audio_queue.empty():
                queue_item = self._audio_queue.get()

                if len(queue_item) == 4:
                    _, request_id, timestamp, error_msg = queue_item
                    self.send_tts_response(request_id, False, error_msg, timestamp)
                    self._audio_data = None
                else:
                    self._audio_data, request_id, timestamp = queue_item
                    self._current_request_id = request_id
                    self._current_timestamp = timestamp

            if self._audio_data is not None:
                frames_to_send = min(FRAME_COUNT, len(self._audio_data))

                if frames_to_send > 0:
                    audio_segment = self._audio_data[:frames_to_send]

                    try:
                        for channel in range(NUM_CHANNELS):
                            channel_data.write_channel_data(
                                channel, audio_segment, frames_to_send
                            )
                        frames_written = frames_to_send
                    except Exception as e:
                        print(f"Error writing to channel data: {str(e)}")
                        traceback.print_exc()

                    if frames_to_send >= len(self._audio_data):
                        self._audio_data = None
                        if (
                            self._current_request_id is not None
                            and self._current_timestamp is not None
                        ):
                            self.send_tts_response(
                                self._current_request_id,
                                True,
                                "",
                                self._current_timestamp,
                            )
                            self._current_request_id = None
                            self._current_timestamp = None
                    else:
                        self._audio_data = self._audio_data[frames_to_send:]

                    return

            silence = np.zeros(FRAME_COUNT - frames_written, dtype=np.float32)
            for channel in range(NUM_CHANNELS):
                channel_data.write_channel_data(
                    channel, silence, FRAME_COUNT - frames_written
                )
        except Exception as e:
            print(f"Error in audio callback: {str(e)}")
            traceback.print_exc()

    def _process_queue(self):
        while not self._stop_worker:
            try:
                try:
                    request = self._request_queue.get(timeout=1.0)
                except queue.Empty:
                    continue

                text, request_id, timestamp = request
                self._generate_speech(text, request_id, timestamp)

                self._request_queue.task_done()

            except Exception as e:
                print(f"Error in queue processing thread: {str(e)}")
                traceback.print_exc()

    def _handle_text_request_message(self, timestamp: int, message: TextRequestReader):
        text = message.get_text().strip()
        request_id = message.get_id()

        if len(text) == 0:
            self._audio_queue.put(
                (
                    np.array([], dtype=np.float32),
                    request_id,
                    timestamp,
                    "No text provided",
                )
            )
            return

        if not CHATTERBOX_AVAILABLE:
            self._audio_queue.put(
                (
                    np.array([], dtype=np.float32),
                    request_id,
                    timestamp,
                    "ChatterboxTTS not available",
                )
            )
            return

        print(f"Queueing text request: '{text}' (id: {request_id})")
        self._request_queue.put((text, request_id, timestamp))

        print(f"Request queued, current queue size: {self._request_queue.qsize()}")

    def tick(self):
        pass

    def _generate_speech(self, text: str, request_id: int, timestamp: int):
        global _shared_model
        try:
            print(f"Processing text: '{text}'")

            with _instance_lock:
                if _shared_model is None:
                    device = next(
                        (
                            d
                            for d in DEVICE_PRIORITY
                            if (d == "cuda" and torch.cuda.is_available())
                            or (d == "mps" and torch.backends.mps.is_available())
                            or d == "cpu"
                        ),
                        "cpu",
                    )

                    print(f"Loading ChatterboxTTS model on device: {device}")
                    _shared_model = ChatterboxTTS.from_pretrained(device=device)

            if not self._audio_callback_setup:
                model_sample_rate = int(_shared_model.sr)
                self.set_audio_callback(
                    self._audio_callback,
                    "float",
                    NUM_CHANNELS,
                    model_sample_rate,
                    FRAME_COUNT,
                )
                self._audio_callback_setup = True

            wav = _shared_model.generate(text)

            if hasattr(wav, "cpu"):
                audio_numpy = wav.cpu().numpy()
            else:
                audio_numpy = wav

            if len(audio_numpy.shape) > 1:
                audio_numpy = audio_numpy.flatten()

            audio_data = audio_numpy.astype(np.float32) * 5.0

            max_val = np.max(np.abs(audio_data))
            if max_val > 0:
                audio_data = audio_data / max_val * 0.9

            audio_data = np.clip(audio_data, -1.0, 1.0)

            self._audio_queue.put((audio_data, request_id, timestamp))

            model_sample_rate = int(_shared_model.sr)
            duration = len(audio_numpy) / model_sample_rate
            print(
                f"Audio generated: {len(audio_numpy)} frames, {duration:.2f}s duration"
            )

        except Exception as e:
            error_msg = str(e)
            print(f"Error generating speech: {error_msg}")
            traceback.print_exc()
            self._audio_queue.put(
                (np.array([], dtype=np.float32), request_id, timestamp, error_msg)
            )


def tick(module: TextToSpeechApplicationInterface):
    for obj in module.text_to_speech_data_store.TextToSpeech.get_enumerator():
        obj.tick()


def stop_on_enter_keypress(module: xrpa_runtime.utils.xrpa_module.XrpaModule):
    while True:
        sys.stdin.readline()
        module.stop()


def main():
    module = TextToSpeechApplicationInterface()

    input_thread = threading.Thread(target=stop_on_enter_keypress, args=(module,))
    input_thread.daemon = True
    input_thread.start()

    module.text_to_speech_data_store.TextToSpeech.set_create_delegate(
        lambda id, _, collection: TextToSpeech(id, collection)
    )

    module.run(TICK_RATE, lambda: tick(module))


if __name__ == "__main__":
    main()
    sys.exit(0)
