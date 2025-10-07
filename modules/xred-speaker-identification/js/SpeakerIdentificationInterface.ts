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
  Count,
  GameComponentOwner,
  Instantiate,
  isDataflowForeignObjectInstantiation,
  ObjectField,
  Output,
  ProgramInput,
  ReferenceTo,
  Signal,
  String,
  XrpaDataflowConnection,
  XrpaProgramInterface,
  XrpaProgramParam,
} from "@xrpa/xrpa-orchestrator";

import assert from "assert";
import path from "path";

export const MAX_REFERENCE_SPEAKERS = 5;
export const MAX_AUDIO_FILES_PER_SPEAKER = 3;

export const XredSpeakerIdentificationInterface = XrpaProgramInterface("Xred.SpeakerIdentification", path.join(__dirname, "../package.json"), () => {
  const SpeakerIdentifier = ProgramInput("SpeakerIdentifier", Collection({
    maxCount: 1,
    fields: {
      audioSignal: Signal,

      identifiedSpeakerId: Output(String("", "ID of the identified speaker, empty if no match")),
      identifiedSpeakerName: Output(String("", "Name of the identified speaker, empty if no match")),
      confidenceScore: Output(Count(0, "Confidence score of the match (0-1)")),
      errorMessage: Output(String("", "Error message if identification failed")),
    },
  }));

  const ReferenceSpeaker = ProgramInput("ReferenceSpeaker", Collection({
    maxCount: MAX_REFERENCE_SPEAKERS,
    fields: {
      speakerId: String("", "Unique identifier for this speaker"),
      speakerName: String("", "Human-readable name for this speaker"),
      filePath: String("", "Path to the audio file containing the speaker's voice sample"),
      speakerIdentifier: GameComponentOwner(ReferenceTo(SpeakerIdentifier, "Reference back to the SpeakerIdentifier that this config belongs to")),
    },
  }));

  ProgramInput("ReferenceSpeakerAudioFile", Collection({
    maxCount: MAX_REFERENCE_SPEAKERS * MAX_AUDIO_FILES_PER_SPEAKER,
    fields: {
      filePath: String("", "Path to the audio file containing the speaker's voice sample"),
      speaker: ReferenceTo(ReferenceSpeaker, "Reference back to the speaker this audio file belongs to"),
    },
  }));
});

export interface ReferenceSpeakerParams {
  speakerId: string;
  speakerName: string;
  filePaths: string[];
}

export interface SpeakerIdentifierParams {
  audioSignal: XrpaDataflowConnection | XrpaProgramParam;
  speakers: ReferenceSpeakerParams[];
}

export function SpeakerIdentifier(params: SpeakerIdentifierParams) {
  const identifierNode = Instantiate(
    [bindExternalProgram(XredSpeakerIdentificationInterface), "SpeakerIdentifier"],
    {},
  );

  assert(isDataflowForeignObjectInstantiation(identifierNode));

  identifierNode.fieldValues = {
    audioSignal: params.audioSignal,
  };

  for (const speakerConfig of params.speakers) {
    const speakerNode = Instantiate(
      [bindExternalProgram(XredSpeakerIdentificationInterface), "ReferenceSpeaker"],
      {},
    );

    assert(isDataflowForeignObjectInstantiation(speakerNode));

    speakerNode.fieldValues = {
      speakerId: speakerConfig.speakerId,
      speakerName: speakerConfig.speakerName,
      speakerIdentifier: identifierNode,
      filePath: "",
    };

    for (const filePath of speakerConfig.filePaths) {
      if (!speakerNode.fieldValues.filePath) {
        speakerNode.fieldValues.filePath = filePath;
      } else {
        const audioFileNode = Instantiate(
          [bindExternalProgram(XredSpeakerIdentificationInterface), "ReferenceSpeakerAudioFile"],
          {},
        );

        assert(isDataflowForeignObjectInstantiation(audioFileNode));

        audioFileNode.fieldValues = {
          filePath: filePath,
          speaker: speakerNode,
        };
      }
    }
  }

  return {
    identifiedSpeakerId: ObjectField(identifierNode, "identifiedSpeakerId"),
    identifiedSpeakerName: ObjectField(identifierNode, "identifiedSpeakerName"),
    confidenceScore: ObjectField(identifierNode, "confidenceScore"),
    errorMessage: ObjectField(identifierNode, "errorMessage"),
  };
}
