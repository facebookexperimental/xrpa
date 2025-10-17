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

import path from "path";

import {
  bindExternalProgram,
  CppStandalone,
  ProgramOutput,
  UnityCoordinateSystem,
  useBuck,
  useCoordinateSystem,
  useEigenTypes,
  XrpaDataflowProgram,
  XrpaNativeCppProgram,
} from "@xrpa/xrpa-orchestrator";

import { InputFromSystemAudio } from "@xrpa/xred-audio-input";
import { SpeakerIdentifier } from "@xrpa/xred-speaker-identification";

const apidir = path.join(__dirname, "..", "api");

const SpeakerIdentificationTestProgram = XrpaDataflowProgram("SpeakerIdentificationTestProgram", () => {
  const audioInput = InputFromSystemAudio({
    frameRate: 16000,
    numChannels: 1,
  });

  const identifier = SpeakerIdentifier({
    audioSignal: audioInput.audioSignal.signal,
    speakers: [
      {
        speakerId: "speaker1",
        speakerName: "Speaker 1",
        filePaths: [path.join(__dirname, "..", "samples", "sample_1.wav")],
      },
      {
        speakerId: "speaker2",
        speakerName: "Speaker 2",
        filePaths: [path.join(__dirname, "..", "samples", "sample_2.wav")],
      },
      {
        speakerId: "speaker3",
        speakerName: "Kid Speaker",
        filePaths: [path.join(__dirname, "..", "samples", "sample_3_kid.wav")],
      },
      {
        speakerId: "speaker6",
        speakerName: "Speaker 6",
        filePaths: [
          path.join(__dirname, "..", "samples", "sample_6_excited.wav"),
          path.join(__dirname, "..", "samples", "sample_6_neutral.wav"),
        ],
      },
    ],
  });

  ProgramOutput("isActive", audioInput.isActive);
  ProgramOutput("audioErrorMessage", audioInput.errorMessage);

  ProgramOutput("identifiedSpeakerId", identifier.identifiedSpeakerId);
  ProgramOutput("identifiedSpeakerName", identifier.identifiedSpeakerName);
  ProgramOutput("confidenceScore", identifier.confidenceScore);
  ProgramOutput("errorMessage", identifier.errorMessage);
});

//////////////////////////////////////////////////////////////////////////////

const SpeakerIdentificationTestModule = XrpaNativeCppProgram("SpeakerIdentificationTest", apidir, () => {
  useBuck({
    target: "//arvr/libraries/xred/xrpa/demos/SpeakerIdentificationTest:SpeakerIdentificationTest",
    oncall: "xred_swes",
    modes: {
      windows: {
        debug: "@arvr/mode/win/debug",
        release: "@arvr/mode/win/release",
      },
      macos: {
        debug: "@arvr/mode/mac/dbg",
        release: "@arvr/mode/mac-arm/opt",
      },
    },
  });

  useCoordinateSystem(UnityCoordinateSystem);
  useEigenTypes();

  bindExternalProgram(SpeakerIdentificationTestProgram);
});

const SpeakerIdentificationTestStandalone = new CppStandalone(
  SpeakerIdentificationTestModule,
  path.join(apidir, "standalone"),
  path.join(apidir, "manifest.gen.json")
);

if (require.main === module) {
  SpeakerIdentificationTestStandalone.smartExecute().catch((e) => {
    console.error(e);
    process.exit(1);
  }).then(() => {
    process.exit(0);
  });
}
