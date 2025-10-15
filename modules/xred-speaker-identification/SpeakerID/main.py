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
from pathlib import Path

import numpy as np
import torch
import torchaudio
import xrpa_runtime
import xrpa_runtime.utils.xrpa_module
from silero_vad import load_silero_vad
from speechbrain.inference.speaker import EncoderClassifier
from xrpa.speaker_id_application_interface import SpeakerIDApplicationInterface
from xrpa.speaker_identification_data_store import (
    ReconciledSpeakerIdentifier,
    SpeakerIdentificationDataStore,
)

TICK_RATE = 30
SAMPLE_RATE = 16000
BUFFER_SIZE_SECONDS = 3.0
MIN_AUDIO_LENGTH = 1.0


class SpeakerIdentification(ReconciledSpeakerIdentifier):
    def __init__(
        self,
        id,
        collection,
        speaker_identification_data_store: SpeakerIdentificationDataStore,
    ):
        super().__init__(id, collection)
        self._speaker_identification_data_store = speaker_identification_data_store
        self._model = None
        self._vad_model = None
        self._model_ready = False
        self._file_embeddings = {}
        self._audio_data_queue = queue.Queue(maxsize=100)
        self._results_queue = queue.Queue(maxsize=100)
        self._worker_thread = None
        self._stop_worker = False

        self._speakers_by_id = {}

        self._model_init_thread = threading.Thread(target=self._initialize_models)
        self._model_init_thread.daemon = True
        self._model_init_thread.start()

        self._worker_thread = threading.Thread(target=self._process_audio)
        self._worker_thread.daemon = True
        self._worker_thread.start()

        self._file_processing_queue = queue.Queue(maxsize=100)
        self._file_processing_thread = threading.Thread(
            target=self._process_audio_files
        )
        self._file_processing_thread.daemon = True
        self._file_processing_thread.start()

        self.on_signal_data = self._handle_audio_signal
        self.on_audio_signal(self)

    def _initialize_models(self):
        try:
            self._model = EncoderClassifier.from_hparams(
                source="speechbrain/spkrec-ecapa-voxceleb",
                savedir="pretrained_models/spkrec-ecapa-voxceleb",
            )
            print("[SpeakerID]: SpeechBrain ECAPA model loaded successfully")

            self._vad_model = load_silero_vad()
            print("[SpeakerID]: Silero VAD model loaded successfully")

            self._model_ready = True
        except Exception as e:
            print(f"[SpeakerID]: Error loading models: {str(e)}")

    def _get_file_embedding(self, file_path):
        if file_path not in self._file_embeddings:
            # enqueue the file path for processing
            self._file_embeddings[file_path] = None
            self._file_processing_queue.put(file_path)

        return self._file_embeddings[file_path]

    def _process_audio_files(self):
        while not self._stop_worker:
            if not self._model_ready:
                time.sleep(0.5)
                continue
            try:
                file_path = self._file_processing_queue.get(timeout=1.0)
                self._file_embeddings[file_path] = self._process_audio_file(file_path)
                self._file_processing_queue.task_done()
            except queue.Empty:
                continue

    def _process_audio_file(self, file_path):
        try:
            if not Path(file_path).exists():
                print(f"[SpeakerID]: Reference speaker file not found: {file_path}")
                return None

            waveform, sample_rate = torchaudio.load(file_path)

            if sample_rate != SAMPLE_RATE:
                resampler = torchaudio.transforms.Resample(sample_rate, SAMPLE_RATE)
                waveform = resampler(waveform)

            if waveform.shape[0] > 1:
                waveform = torch.mean(waveform, dim=0, keepdim=True)

            with torch.no_grad():
                embedding = self._model.encode_batch(waveform, normalize=True)
                ref_embedding = embedding.squeeze().cpu().numpy()
                epsilon = 1e-12
                ref_embedding = ref_embedding / (
                    np.linalg.norm(ref_embedding) + epsilon
                )

            print(f"[SpeakerID]: Reference speaker embedding computed for {file_path}")

            return ref_embedding

        except Exception as e:
            print(
                f"[SpeakerID]: Error processing reference speaker file {file_path}: {str(e)}"
            )
            return None

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

                try:
                    self._audio_data_queue.put((audio_data, timestamp), block=False)
                except queue.Full:
                    pass

            except Exception as packet_error:
                print(f"ERROR creating SignalPacket: {str(packet_error)}")
                return

        except Exception as e:
            print(f"ERROR handling audio signal: {str(e)}")

    _handle_audio_signal = on_signal_data

    def _process_audio(self):
        audio_buffer = np.array([], dtype=np.float32)
        buffer_timestamp = 0
        buffer_max_size = int(SAMPLE_RATE * BUFFER_SIZE_SECONDS)
        min_buffer_size = int(SAMPLE_RATE * MIN_AUDIO_LENGTH)

        silence_frames = 0
        speech_frames = 0
        silence_threshold = 0.003
        silence_frames_threshold = int(1.5 * SAMPLE_RATE / 256)
        is_speaking = False
        last_process_time = time.time()

        while not self._stop_worker:
            try:
                try:
                    audio_data, timestamp = self._audio_data_queue.get(timeout=0.5)
                except queue.Empty:
                    current_time = time.time()
                    if (
                        is_speaking
                        and len(audio_buffer) >= min_buffer_size
                        and (current_time - last_process_time) > 3.0
                    ):
                        self._process_audio_buffer(audio_buffer, buffer_timestamp)
                        audio_buffer = np.array([], dtype=np.float32)
                        is_speaking = False
                        speech_frames = 0
                        silence_frames = 0
                        last_process_time = current_time
                    continue

                if len(audio_buffer) == 0:
                    buffer_timestamp = timestamp

                audio_buffer = np.append(audio_buffer, audio_data)

                rms = np.sqrt(np.mean(np.square(audio_data)))
                max_val = np.max(np.abs(audio_data))

                if rms > silence_threshold or max_val > 0.01:
                    silence_frames = 0
                    speech_frames += 1
                    if not is_speaking and speech_frames > 3:
                        is_speaking = True
                else:
                    silence_frames += 1

                current_time = time.time()
                should_process = False

                if is_speaking and silence_frames >= silence_frames_threshold:
                    should_process = True
                elif len(audio_buffer) >= buffer_max_size:
                    should_process = True

                if should_process:
                    if len(audio_buffer) >= min_buffer_size:
                        self._process_audio_buffer(audio_buffer, buffer_timestamp)
                        last_process_time = current_time

                    audio_buffer = np.array([], dtype=np.float32)
                    is_speaking = False
                    speech_frames = 0
                    silence_frames = 0

                self._audio_data_queue.task_done()

            except Exception as e:
                print(f"Error in audio processing thread: {str(e)}")
                audio_buffer = np.array([], dtype=np.float32)
                is_speaking = False
                speech_frames = 0
                silence_frames = 0

    def _run_vad(self, audio_buffer):
        if self._vad_model is None:
            return 0.0

        try:
            audio_tensor = torch.from_numpy(audio_buffer)
            speech_probability = self._vad_model(audio_tensor, SAMPLE_RATE).item()
            return speech_probability
        except Exception as e:
            print(f"[SpeakerID]: Error in VAD: {str(e)}")
            return 0.0

    def _process_audio_buffer(self, audio_buffer, buffer_timestamp):
        if not self._model_ready or self._model is None or self._vad_model is None:
            print("[SpeakerID]: Models not ready, skipping processing")
            return

        if len(audio_buffer) == 0:
            return

        try:
            chunk_size = 512
            speech_chunks = []

            for i in range(0, len(audio_buffer), chunk_size):
                chunk = audio_buffer[i : i + chunk_size]
                if len(chunk) == chunk_size:
                    speech_prob = self._run_vad(chunk)
                    if speech_prob >= 0.7:
                        speech_chunks.append(chunk)

            if len(speech_chunks) == 0:
                return

            speech_audio = np.concatenate(speech_chunks)
            speech_ratio = len(speech_audio) / len(audio_buffer)

            if speech_ratio < 0.3 or len(speech_audio) < int(0.5 * SAMPLE_RATE):
                print("[SpeakerID]: Insufficient speech content, skipping processing")
                return

            audio_tensor = torch.tensor(speech_audio).unsqueeze(0)

            with torch.no_grad():
                embedding = self._model.encode_batch(audio_tensor, normalize=True)
                query_embedding = embedding.squeeze().cpu().numpy()
                epsilon = 1e-12
                query_embedding = query_embedding / (
                    np.linalg.norm(query_embedding) + epsilon
                )

            best_match_speaker_id = None
            best_match_speaker_name = None
            best_similarity = -1.0
            similarities = {}

            for speaker_data in self._speakers_by_id.values():
                speaker_id = speaker_data["id"]
                speaker_name = speaker_data["name"]
                speaker_embeddings = speaker_data["embeddings"]
                speaker_similarities = []

                for ref_embedding in speaker_embeddings:
                    similarity = np.dot(query_embedding, ref_embedding)
                    speaker_similarities.append(similarity)

                max_similarity = max(speaker_similarities)
                similarities[speaker_id] = max_similarity

                sample_count = len(speaker_similarities)
                print(
                    f"[SpeakerID]: Similarity with {speaker_name} (best of {sample_count} samples): {max_similarity:.3f}"
                )

                if max_similarity > best_similarity:
                    best_similarity = max_similarity
                    best_match_speaker_id = speaker_id
                    best_match_speaker_name = speaker_name

            lower_threshold = 0.4
            higher_threshold = 0.7

            sorted_similarities = sorted(similarities.values(), reverse=True)
            gap = 0.0
            if len(sorted_similarities) >= 2:
                gap = sorted_similarities[0] - sorted_similarities[1]

            if best_similarity < lower_threshold:
                self._results_queue.put(
                    {
                        "speaker_id": "",
                        "speaker_name": "",
                        "confidence_score": 0,
                        "timestamp": buffer_timestamp,
                    }
                )
            elif best_similarity > higher_threshold:
                confidence_score = int(min(best_similarity * 100, 99))

                self._results_queue.put(
                    {
                        "speaker_id": best_match_speaker_id,
                        "speaker_name": best_match_speaker_name,
                        "confidence_score": confidence_score,
                        "timestamp": buffer_timestamp,
                    }
                )
            else:
                if gap > 0.15:
                    confidence_score = int(min((best_similarity + gap * 0.5) * 100, 99))

                    self._results_queue.put(
                        {
                            "speaker_id": best_match_speaker_id,
                            "speaker_name": best_match_speaker_name,
                            "confidence_score": confidence_score,
                            "timestamp": buffer_timestamp,
                        }
                    )
                else:
                    self._results_queue.put(
                        {
                            "speaker_id": "",
                            "speaker_name": "",
                            "confidence_score": 0,
                            "timestamp": buffer_timestamp,
                        }
                    )

        except Exception as e:
            print(f"[SpeakerID]: Error processing audio buffer: {str(e)}")

    def _get_speakers_by_id(self):
        speaker_identifier_id = self.get_xrpa_id()
        speakers_by_id = {}
        for (
            speaker_obj
        ) in self._speaker_identification_data_store.ReferenceSpeaker.get_enumerator():
            if speaker_obj.get_speaker_identifier() == speaker_identifier_id:
                speaker_id = speaker_obj.get_speaker_id()
                speaker_name = speaker_obj.get_speaker_name()
                speaker_file_path = speaker_obj.get_file_path()
                speaker_obj_id = speaker_obj.get_xrpa_id()
                speakers_by_id[speaker_obj_id] = {
                    "id": speaker_id,
                    "name": speaker_name,
                    "embeddings": [],
                }

                if speaker_file_path:
                    ref_embedding = self._get_file_embedding(speaker_file_path)
                    if ref_embedding is not None:
                        speakers_by_id[speaker_obj_id]["embeddings"].append(
                            ref_embedding
                        )

        for audio_file_obj in self._speaker_identification_data_store.ReferenceSpeakerAudioFile.get_enumerator():
            speaker_ref = audio_file_obj.get_speaker()
            if speaker_ref in speakers_by_id:
                file_path = audio_file_obj.get_file_path()
                ref_embedding = self._get_file_embedding(file_path)
                if ref_embedding is not None:
                    speakers_by_id[speaker_ref]["embeddings"].append(ref_embedding)

        return speakers_by_id

    def tick(self):
        self._speakers_by_id = self._get_speakers_by_id()
        try:
            while not self._results_queue.empty():
                try:
                    result = self._results_queue.get(block=False)

                    self.set_identified_speaker_id(result["speaker_id"])
                    self.set_identified_speaker_name(result["speaker_name"])
                    self.set_confidence_score(result["confidence_score"])

                    print(
                        f"[SpeakerID]: Sent identification result: {result['speaker_name']} ({result['confidence_score']}%)"
                    )

                    self._results_queue.task_done()

                except Exception as e:
                    print(f"ERROR sending speaker identification result: {str(e)}")

        except queue.Empty:
            pass
        except Exception as e:
            print(f"ERROR processing results queue: {str(e)}")


def tick(module: SpeakerIDApplicationInterface):
    for (
        obj
    ) in module.speaker_identification_data_store.SpeakerIdentifier.get_enumerator():
        obj.tick()


def stop_on_enter_keypress(module: xrpa_runtime.utils.xrpa_module.XrpaModule):
    while True:
        sys.stdin.readline()
        module.stop()


def main():
    module = SpeakerIDApplicationInterface()

    input_thread = threading.Thread(target=stop_on_enter_keypress, args=(module,))
    input_thread.daemon = True
    input_thread.start()

    module.speaker_identification_data_store.SpeakerIdentifier.set_create_delegate(
        lambda id, _, collection: SpeakerIdentification(
            id, collection, module.speaker_identification_data_store
        )
    )

    module.run(TICK_RATE, lambda: tick(module))


if __name__ == "__main__":
    main()
    sys.exit(0)
