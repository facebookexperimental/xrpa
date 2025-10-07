/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


import {
  bindExternalProgram,
  Boolean,
  Collection,
  HiResTimestamp,
  Instantiate,
  isDataflowForeignObjectInstantiation,
  Message,
  ObjectField,
  Output,
  ProgramInput,
  Signal,
  String,
  XrpaDataflowConnection,
  XrpaProgramInterface,
  XrpaProgramParam,
} from "@xrpa/xrpa-orchestrator";

import assert from "assert";
import path from "path";

export const DEFAULT_TRANSCRIPTION_MAX_COUNT = 4;

function createAudioTranscriptionInterface() {
  return XrpaProgramInterface("Xred.AudioTranscription", path.join(__dirname, "../package.json"), () => {
    const TranscriptionResult = Message("TranscriptionResult", {
      text: String("", "Transcribed text from audio"),
      timestamp: HiResTimestamp("Timestamp of the start of the audio segment from which the transcription is generated"),
      success: Boolean(false, "Whether transcription completed successfully"),
      errorMessage: String("", "Error message if transcription failed"),
    });

    ProgramInput("AudioTranscription", Collection({
      maxCount: DEFAULT_TRANSCRIPTION_MAX_COUNT,
      fields: {
        audioSignal: Signal,

        transcriptionResult: Output(TranscriptionResult),
      },
    }));
  });
}

export const XredAudioTranscriptionInterface = createAudioTranscriptionInterface();

export function AudioTranscription(params: {
  audioSignal: XrpaDataflowConnection | XrpaProgramParam;
}) {
  const dataflowNode = Instantiate(
    [bindExternalProgram(XredAudioTranscriptionInterface), "AudioTranscription"],
    {},
  );

  assert(isDataflowForeignObjectInstantiation(dataflowNode));

  dataflowNode.fieldValues = {
    audioSignal: params.audioSignal,
  };

  return {
    transcriptionResult: ObjectField(dataflowNode, "transcriptionResult"),
  };
}
