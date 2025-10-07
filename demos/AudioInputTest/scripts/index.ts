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
import { InputFromSmartMicrophone } from "@xrpa/xred-device-input";

import {
  OutputToDevice,
  SignalStream,
  StackChannels,
  strContains,
} from "@xrpa/xred-signal-processing";

const apidir = path.join(__dirname, "..", "api");

const AudioInputTestProgram = XrpaDataflowProgram("AudioInputTestProgram", () => {
  const audioInput = InputFromSmartMicrophone({
    ipAddress: "192.168.68.80",
  });

  ProgramOutput("isActive", audioInput.isActive);
  ProgramOutput("errorMessage", audioInput.errorMessage);

  const audioNode = SignalStream(audioInput.audioSignal);
  OutputToDevice({
    deviceName: strContains("Headphones"), //Speakers give an echo so use headphones/earphones
    source: StackChannels(audioNode, audioNode),
  });
});

//////////////////////////////////////////////////////////////////////////////

const AudioInputTestModule = XrpaNativeCppProgram("AudioInputTest", apidir, () => {
  useBuck({
    target: "//arvr/libraries/xred/xrpa/demos/AudioInputTest:AudioInputTest",
    oncall: "xred_swes",
    modes: {
      windows: {
        debug: "@arvr/mode/win/debug",
        release: "@arvr/mode/win/opt"
      },
      macos: {
        debug: "@arvr/mode/mac/dbg",
        release: "@arvr/mode/mac/opt"
      }
    }
  });

  useCoordinateSystem(UnityCoordinateSystem);
  useEigenTypes();

  bindExternalProgram(AudioInputTestProgram);
});

const AudioInputTestStandalone = new CppStandalone(AudioInputTestModule, path.join(apidir, "standalone"), path.join(apidir, "manifest.gen.json"));

AudioInputTestStandalone.smartExecute().catch((e) => {
  console.error(e);
  process.exit(1);
}).then(() => {
  process.exit(0);
});
