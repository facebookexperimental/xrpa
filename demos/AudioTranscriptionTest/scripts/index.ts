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
import { AudioTranscription } from "@xrpa/xred-audio-transcription";

const apidir = path.join(__dirname, "..", "api");

const AudioTranscriptionTestProgram = XrpaDataflowProgram("AudioTranscriptionTestProgram", () => {
  const audioInput = InputFromSystemAudio({
    frameRate: 16000,
    numChannels: 1,
  });

  const transcription = AudioTranscription({
    audioSignal: audioInput.audioSignal.signal,
  });

  ProgramOutput("isActive", audioInput.isActive);
  ProgramOutput("audioErrorMessage", audioInput.errorMessage);

  ProgramOutput("transcriptionResult", transcription.transcriptionResult);
});

//////////////////////////////////////////////////////////////////////////////

const AudioTranscriptionTestModule = XrpaNativeCppProgram("AudioTranscriptionTest", apidir, () => {
  useBuck({
    target: "//arvr/libraries/xred/xrpa/demos/AudioTranscriptionTest:AudioTranscriptionTest",
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

  bindExternalProgram(AudioTranscriptionTestProgram);
});

const AudioTranscriptionTestStandalone = new CppStandalone(
  AudioTranscriptionTestModule,
  path.join(apidir, "standalone"),
  path.join(apidir, "manifest.gen.json")
);

if (require.main === module) {
  AudioTranscriptionTestStandalone.smartExecute().catch((e) => {
    console.error(e);
    process.exit(1);
  }).then(() => {
    process.exit(0);
  });
}
