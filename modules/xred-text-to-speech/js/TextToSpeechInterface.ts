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
  Collection,
  Boolean,
  Count,
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

export const DEFAULT_TTS_REQUEST_MAX_COUNT = 16;

export const XredTextToSpeechInterface = XrpaProgramInterface("Xred.TextToSpeech", path.join(__dirname, "../package.json"), () => {
  ProgramInput("TextToSpeech", Collection({
    maxCount: DEFAULT_TTS_REQUEST_MAX_COUNT,
    fields: {
      TextRequest: Message("TextRequest", {
        text: String("", "Text to convert to speech"),
        id: Count(0, "Optional ID. If sent with a text request, the response will have the same ID."),
      }),

      audio: Output(Signal),
      TtsResponse: Output(Message("TtsResponse", {
        id: Count(0, "Request ID that matches the original text request"),
        success: Boolean(false, "Whether synthesis completed successfully"),
        errorMessage: String("", "Error message if processing failed"),
        playbackStartTimestamp: HiResTimestamp("Timestamp when audio playback started"),
      })),
    },
  }));
});

export function TtsRequest(params: {
  TextRequest: XrpaDataflowConnection | XrpaProgramParam;
}) {
  const dataflowNode = Instantiate(
    [bindExternalProgram(XredTextToSpeechInterface), "TextToSpeech"],
    {},
  );

  assert(isDataflowForeignObjectInstantiation(dataflowNode));

  dataflowNode.fieldValues.TextRequest = params.TextRequest;

  return {
    audio: { numChannels: 2, signal: ObjectField(dataflowNode, "audio") },
    TtsResponse: ObjectField(dataflowNode, "TtsResponse"),
  };
}
