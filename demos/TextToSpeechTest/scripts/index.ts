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
  ProgramInput,
  ProgramOutput,
  UnityCoordinateSystem,
  useBuck,
  useCoordinateSystem,
  useEigenTypes,
  XrpaDataflowProgram,
  XrpaNativeCppProgram,
} from "@xrpa/xrpa-orchestrator";

import { TtsRequest } from "@xrpa/xred-text-to-speech";

import {
  OutputToDevice,
  SignalStream,
  strContains,
} from "@xrpa/xred-signal-processing";

const apidir = path.join(__dirname, "..", "api");

const TextToSpeechTestProgram = XrpaDataflowProgram("TextToSpeechTestProgram", () => {
  const tts = TtsRequest({
    TextRequest: ProgramInput("Text")
  });

  ProgramOutput("TtsResponse", tts.TtsResponse);

  OutputToDevice({
    deviceName: strContains("MacBook Pro Speakers"),
    source: SignalStream(tts.audio),
  });
});

//////////////////////////////////////////////////////////////////////////////

const TextToSpeechTestModule = XrpaNativeCppProgram("TextToSpeechTest", apidir, () => {
  useBuck({
    target: "//arvr/libraries/xred/xrpa/demos/TextToSpeechTest:TextToSpeechTest",
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

  bindExternalProgram(TextToSpeechTestProgram);
});

const TextToSpeechTestStandalone = new CppStandalone(TextToSpeechTestModule, path.join(apidir, "standalone"), path.join(apidir, "manifest.gen.json"));

TextToSpeechTestStandalone.smartExecute().catch((e) => {
  console.error(e);
  process.exit(1);
}).then(() => {
  process.exit(0);
});
