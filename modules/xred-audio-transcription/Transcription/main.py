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
import time
import traceback

import numpy as np
import torch
import xrpa_runtime
import xrpa_runtime.utils.xrpa_module
from silero_vad import load_silero_vad
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline
from xrpa.audio_transcription_data_store import ReconciledAudioTranscription
from xrpa.transcription_application_interface import TranscriptionApplicationInterface

TICK_RATE = 30
MODEL_ID = "openai/whisper-large-v3-turbo"
SAMPLE_RATE = 16000
BUFFER_SIZE_SECONDS = 30
VAD_SILENCE_THRESHOLD = 0.003
VAD_SILENCE_DURATION = 1.5
MIN_SPEECH_DURATION = 0.05


class AudioTranscription(ReconciledAudioTranscription):
    def __init__(self, id, collection):
        super().__init__(id, collection)
        self._audio_data_queue = queue.Queue(maxsize=100)
        self._transcription_results_queue = queue.Queue(maxsize=100)
        self._worker_thread = None
        self._stop_worker = False
        self._model = None
        self._processor = None
        self._pipe = None
        self._model_ready = False
        self._vad_model = None

        self._model_init_thread = threading.Thread(target=self._initialize_model)
        self._model_init_thread.daemon = True
        self._model_init_thread.start()

        self._worker_thread = threading.Thread(target=self._process_audio)
        self._worker_thread.daemon = True
        self._worker_thread.start()
        print("[DEBUG] Audio processing thread started")

        self.on_signal_data = self._handle_audio_signal

        try:
            self.on_audio_signal(self)
        except Exception as e:
            print(f"ERROR registering audio signal handler: {str(e)}")
            traceback.print_exc()

    def _initialize_model(self):
        try:
            device = "cuda:0" if torch.cuda.is_available() else "cpu"
            torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32

            self._model = AutoModelForSpeechSeq2Seq.from_pretrained(
                MODEL_ID,
                torch_dtype=torch_dtype,
                low_cpu_mem_usage=True,
                use_safetensors=True,
            )
            self._model.to(device)

            self._processor = AutoProcessor.from_pretrained(MODEL_ID)

            self._pipe = pipeline(
                "automatic-speech-recognition",
                model=self._model,
                tokenizer=self._processor.tokenizer,
                feature_extractor=self._processor.feature_extractor,
                torch_dtype=torch_dtype,
                chunk_length_s=30,
                batch_size=4,
                device=device,
                ignore_warning=True,
            )

            self._model_ready = True

            try:
                self._vad_model = load_silero_vad()
                print("SileroVAD loaded successfully")
            except Exception as vad_error:
                print(f"VAD model failed to load: {str(vad_error)}")
                self._vad_model = None

        except Exception as e:
            print(f"Error initializing Whisper model: {str(e)}")
            traceback.print_exc()

    def __del__(self):
        if hasattr(self, "_worker_thread") and self._worker_thread is not None:
            self._stop_worker = True
            if self._worker_thread.is_alive():
                self._worker_thread.join(timeout=1.0)

    def on_signal_data(self, timestamp: int, mem_accessor):
        try:
            if mem_accessor is None:
                return

            try:
                packet = xrpa_runtime.signals.signal_shared.SignalPacket(mem_accessor)

                frame_count = packet.get_frame_count()
                num_channels = packet.get_num_channels()
                frames_per_second = packet.get_frame_rate()

                if frame_count <= 0 or num_channels <= 0 or frames_per_second <= 0:
                    return

                channel_data = packet.access_channel_data("float")
                audio_data = np.zeros(frame_count, dtype=np.float32)

                if num_channels == 1:
                    channel_data.read_channel_data(0, audio_data, 0, frame_count)
                else:
                    temp_channel = np.zeros(frame_count, dtype=np.float32)
                    for i in range(num_channels):
                        channel_data.read_channel_data(i, temp_channel, 0, frame_count)
                        audio_data += temp_channel
                    audio_data /= num_channels

                self._audio_data_queue.put((audio_data, timestamp))

            except Exception as packet_error:
                print(f"ERROR creating SignalPacket: {str(packet_error)}")
                traceback.print_exc()
                return

        except Exception as e:
            print(f"ERROR handling audio signal: {str(e)}")
            traceback.print_exc()

    _handle_audio_signal = on_signal_data

    def _is_speech(self, audio_chunk):
        rms = np.sqrt(np.mean(np.square(audio_chunk)))

        if not self._vad_model:
            return False

        if len(audio_chunk) < 512:
            if rms > 0.001:
                print(
                    f"[DEBUG] Chunk too small ({len(audio_chunk)} samples). RMS: {rms:.6f}"
                )
            return False

        try:
            audio_tensor = torch.from_numpy(audio_chunk).float()
            speech_prob = self._vad_model(audio_tensor, SAMPLE_RATE).item()
            is_speech = speech_prob > 0.3

            return is_speech
        except Exception as e:
            print(f"[DEBUG] VAD error: {e}")
            return False

    def _process_audio(self):
        print("[DEBUG] Audio processing thread started - waiting for audio data")
        audio_buffer = np.array([], dtype=np.float32)
        buffer_timestamp = 0
        buffer_max_size = SAMPLE_RATE * BUFFER_SIZE_SECONDS

        silence_frames = 0
        speech_frames = 0
        actual_chunk_size = None
        silence_frames_threshold = None
        min_speech_frames = None
        is_speaking = False
        last_process_time = time.time()

        while not self._stop_worker:
            try:
                audio_data, timestamp = self._audio_data_queue.get(timeout=0.5)
            except queue.Empty:
                current_time = time.time()
                if (
                    is_speaking
                    and len(audio_buffer) > SAMPLE_RATE * MIN_SPEECH_DURATION
                    and (current_time - last_process_time) > 2.0
                ):
                    self._process_audio_buffer(audio_buffer, buffer_timestamp)
                    audio_buffer = np.array([], dtype=np.float32)
                    is_speaking = False
                    speech_frames = 0
                    silence_frames = 0
                    last_process_time = current_time
                continue

            try:
                if actual_chunk_size is None:
                    actual_chunk_size = len(audio_data)
                    silence_frames_threshold = int(
                        VAD_SILENCE_DURATION * SAMPLE_RATE / actual_chunk_size
                    )
                    min_speech_frames = int(
                        MIN_SPEECH_DURATION * SAMPLE_RATE / actual_chunk_size
                    )
                    print(
                        f"[DEBUG] First audio received! Chunk size: {actual_chunk_size}, silence_threshold: {silence_frames_threshold}, min_speech: {min_speech_frames}"
                    )

                if len(audio_buffer) == 0:
                    buffer_timestamp = timestamp

                audio_buffer = np.append(audio_buffer, audio_data)

                buffer_duration_ms = len(audio_buffer) / SAMPLE_RATE * 1000

                if len(audio_buffer) >= 512:
                    vad_chunk = (
                        audio_buffer[-512:] if len(audio_buffer) > 512 else audio_buffer
                    )
                    is_speech_detected = self._is_speech(vad_chunk)

                elif buffer_duration_ms < 80:
                    rms = np.sqrt(np.mean(np.square(audio_data)))
                    max_val = np.max(np.abs(audio_data))
                    is_speech_detected = rms > 0.001 or max_val > 0.005

                else:
                    rms = np.sqrt(np.mean(np.square(audio_data)))
                    max_val = np.max(np.abs(audio_data))
                    is_speech_detected = rms > 0.003 or max_val > 0.015

                if is_speech_detected:
                    silence_frames = 0
                    speech_frames += 1

                    if not is_speaking and speech_frames > 3:
                        is_speaking = True
                else:
                    silence_frames += 1

                    if (
                        not is_speaking
                        and silence_frames > 10
                        and speech_frames < min_speech_frames
                    ):
                        speech_frames = 0

                current_time = time.time()
                should_process = False

                if is_speaking and silence_frames >= silence_frames_threshold:
                    should_process = True
                elif len(audio_buffer) >= buffer_max_size:
                    should_process = True

                if should_process:
                    if speech_frames >= min_speech_frames:
                        self._process_audio_buffer(audio_buffer, buffer_timestamp)
                        last_process_time = current_time

                    audio_buffer = np.array([], dtype=np.float32)
                    is_speaking = False
                    speech_frames = 0
                    silence_frames = 0

                self._audio_data_queue.task_done()

            except Exception as e:
                print(f"Error in audio processing thread: {str(e)}")
                traceback.print_exc()

                audio_buffer = np.array([], dtype=np.float32)
                is_speaking = False
                speech_frames = 0
                silence_frames = 0

    def _process_audio_buffer(self, audio_buffer, buffer_timestamp):
        if len(audio_buffer) == 0:
            print("[DEBUG] Empty audio buffer - skipping")
            return

        rms = np.sqrt(np.mean(np.square(audio_buffer)))
        max_val = np.max(np.abs(audio_buffer))

        if rms > 0.001 or max_val > 0.005:
            transcription_text = self._transcribe_audio(audio_buffer)
            print(f"[DEBUG] Transcription result: '{transcription_text}'")

            if (
                transcription_text
                and transcription_text != "No speech detected"
                and transcription_text != "No audio data"
                and not transcription_text.startswith("Error")
            ):
                self._send_transcription_result(transcription_text, buffer_timestamp)

        else:
            print(
                f"[DEBUG] Audio too quiet - skipping transcription (RMS={rms:.6f} <= 0.001 and max={max_val:.6f} <= 0.005)"
            )

    def _transcribe_audio(self, audio_data):
        if not self._model_ready or self._pipe is None:
            return "Model initializing, please wait..."

        try:
            if audio_data is None or len(audio_data) == 0:
                return "No audio data"

            rms = np.sqrt(np.mean(np.square(audio_data)))
            max_val = np.max(np.abs(audio_data))

            if rms < 0.01 and max_val < 0.05:
                return "No speech detected"

            generate_kwargs = {
                "no_speech_threshold": 0.4,
                "logprob_threshold": -1.2,
                "compression_ratio_threshold": 2.4,
                "temperature": 0.3,
                "max_new_tokens": 128,
                "num_beams": 2,
                "language": "english",
            }

            result = self._pipe(audio_data, generate_kwargs=generate_kwargs)
            return result["text"].strip()
        except Exception as e:
            print(f"Error transcribing audio: {str(e)}")
            traceback.print_exc()
            return f"Error transcribing audio: {str(e)}"

    def _send_transcription_result(self, text, timestamp):
        try:
            self._transcription_results_queue.put((text, timestamp))
        except Exception as e:
            print(f"ERROR queuing transcription result: {str(e)}")
            traceback.print_exc()
            sys.stdout.flush()

    def tick(self):
        try:
            while not self._transcription_results_queue.empty():
                text, timestamp = self._transcription_results_queue.get(block=False)
                try:
                    self.send_transcription_result(text, timestamp, True, "")
                    sys.stdout.flush()
                except Exception as e:
                    print(f"ERROR sending transcription result: {str(e)}")
                    traceback.print_exc()
                    sys.stdout.flush()
                self._transcription_results_queue.task_done()
        except queue.Empty:
            pass
        except Exception as e:
            print(f"ERROR processing transcription results queue: {str(e)}")
            traceback.print_exc()
            sys.stdout.flush()


def tick(module: TranscriptionApplicationInterface):
    for (
        obj
    ) in module.audio_transcription_data_store.AudioTranscription.get_enumerator():
        obj.tick()


def stop_on_enter_keypress(module: xrpa_runtime.utils.xrpa_module.XrpaModule):
    while True:
        sys.stdin.readline()
        module.stop()


def main():
    module = TranscriptionApplicationInterface()

    input_thread = threading.Thread(target=stop_on_enter_keypress, args=(module,))
    input_thread.daemon = True
    input_thread.start()

    module.audio_transcription_data_store.AudioTranscription.set_create_delegate(
        lambda id, _, collection: AudioTranscription(id, collection)
    )

    module.run(TICK_RATE, lambda: tick(module))


if __name__ == "__main__":
    main()
    sys.exit(0)
