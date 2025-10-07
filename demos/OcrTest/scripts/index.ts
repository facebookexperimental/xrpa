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
  Count,
  bindExternalProgram,
  CppStandalone,
  ProgramInput,
  ProgramOutput,
  UnityCoordinateSystem,
  useBuck,
  useCoordinateSystem,
  useEigenTypes,
  XrpaDataflowProgram,
  XrpaNativeCppProgram,
} from "@xrpa/xrpa-orchestrator";

import { ImageWindow } from "@xrpa/xred-debug";
import { CameraFeed } from "@xrpa/xred-sensor-input";
import { InputFromSystemAudio } from "@xrpa/xred-audio-input";
import { AudioTranscription } from "@xrpa/xred-audio-transcription";
import { OpticalCharacterRecognition } from "@xrpa/xred-optical-character-recognition";

const apidir = path.join(__dirname, "..", "api");

const OcrTestProgram = XrpaDataflowProgram("OcrTestProgram", () => {
  const cameraFeed = CameraFeed({});

  ImageWindow({ windowTitle: "Smart Speaker Camera", image: cameraFeed.cameraImage });

  const audioInput = InputFromSystemAudio({
    frameRate: 16000,
    numChannels: 1,
  });

  const speechToText = AudioTranscription({
    audioSignal: audioInput.audioSignal.signal,
  });

  const ocrResult = OpticalCharacterRecognition({
    imageInput: cameraFeed.cameraImage,
    triggerId: ProgramInput("OcrTriggerId", Count()),
  });

  ProgramOutput("audioActive", audioInput.isActive);
  ProgramOutput("audioErrorMessage", audioInput.errorMessage);
  ProgramOutput("speechCommand", speechToText.transcriptionResult);
  ProgramOutput("ocrResult", ocrResult.ocrResult);
  ProgramOutput("cameraImage", cameraFeed.cameraImage);
});

//////////////////////////////////////////////////////////////////////////////

const OcrTestModule = XrpaNativeCppProgram("OcrTest", apidir, () => {
  useBuck({
    target: "//arvr/libraries/xred/xrpa/demos/OcrTest:OcrTest",
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

  bindExternalProgram(OcrTestProgram);
});

const OcrTestStandalone = new CppStandalone(OcrTestModule, path.join(apidir, "standalone"), path.join(apidir, "manifest.gen.json"));

OcrTestStandalone.smartExecute().catch((e) => {
  console.error(e);
  process.exit(1);
}).then(() => {
  process.exit(0);
});
