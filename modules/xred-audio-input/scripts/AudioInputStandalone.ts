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
  CppStandalone,
  OvrCoordinateSystem,
  XrpaNativeCppProgram,
  setProgramInterface,
  useBuck,
  useCoordinateSystem,
} from "@xrpa/xrpa-orchestrator";
import path from "path";

import { XredAudioInputInterface } from "../js/AudioInputInterface";

const apidir = path.join(__dirname, "..", "AudioInput", "api");

export const AudioInputModule = XrpaNativeCppProgram("AudioInput", apidir, () => {
  useBuck({
    target: "//arvr/libraries/xred/xrpa/modules/xred-audio-input/AudioInput:AudioInput",
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

  useCoordinateSystem(OvrCoordinateSystem);

  setProgramInterface(XredAudioInputInterface);
});

export const AudioInputStandalone = new CppStandalone(AudioInputModule, path.join(apidir, "standalone"), path.join(apidir, "manifest.gen.json"));

export async function doCodegen() {
  await AudioInputStandalone.doCodeGen().finalize(AudioInputStandalone.manifestFilename);
}

export async function doBuild() {
  const { runProcess } = await import("@xrpa/xrpa-file-utils");
  const mode = AudioInputStandalone.getBuckMode("debug");
  const target = await AudioInputStandalone.getStandaloneTarget();

  await runProcess({
    filename: "buck2",
    args: ["build", mode, target],
    onLineReceived: line => console.log(line),
  });
}

export async function doRun() {
  const { buckRun } = await import("@xrpa/xrpa-file-utils");

  await buckRun({
    mode: AudioInputStandalone.getBuckMode("debug"),
    target: await AudioInputStandalone.getStandaloneTarget(),
    resourceFilenames: (AudioInputStandalone as any).resourceFilenames || [],
  });
}

export async function doCodegenAndBuild() {
  await doCodegen();
  await doBuild();
}

export async function runStandalone() {
  await AudioInputStandalone.buckRunDebug();
}

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--codegen-only')) {
    doCodegen().catch((e) => {
      console.error(e);
      process.exit(1);
    }).then(() => {
      process.exit(0);
    });
  } else if (args.includes('--build-only')) {
    doBuild().catch((e) => {
      console.error(e);
      process.exit(1);
    }).then(() => {
      process.exit(0);
    });
  } else if (args.includes('--run-only')) {
    doRun().catch((e) => {
      console.error(e);
      process.exit(1);
    }).then(() => {
      process.exit(0);
    });
  } else if (args.includes('--codegen-and-build')) {
    doCodegenAndBuild().catch((e) => {
      console.error(e);
      process.exit(1);
    }).then(() => {
      process.exit(0);
    });
  } else {
    runStandalone().catch((e) => {
      console.error(e);
      process.exit(1);
    }).then(() => {
      process.exit(0);
    });
  }
}
