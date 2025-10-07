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
  CppStandalone,
  OvrCoordinateSystem,
  XrpaNativeCppProgram,
  setProgramInterface,
  useBuck,
  useCoordinateSystem,
  useEigenTypes,
} from "@xrpa/xrpa-orchestrator";

import { XredAriaInterface } from "../js";

const apidir = path.join(__dirname, "..", "Aria", "api");

export const AriaModule = XrpaNativeCppProgram("Aria", apidir, () => {
  useBuck({
    target: "//arvr/libraries/xred/xrpa/modules/xred-sensor-input/Aria:Aria",
    oncall: "xred_swes",
    modes: {
      windows: {
        debug: "@arvr/mode/win/clang/vs2022/dev",
        release: "@arvr/mode/win/clang/vs2022/release",
      },
      macos: {
        debug: "@arvr/mode/mac/dbg",
        release: "@arvr/mode/mac-arm/opt",
      },
    },
  });

  useCoordinateSystem(OvrCoordinateSystem);
  useEigenTypes();

  setProgramInterface(XredAriaInterface);
});

export const AriaStandalone = new CppStandalone(AriaModule, path.join(apidir, "standalone"), path.join(apidir, "manifest.gen.json"));

export async function doCodegen() {
  await AriaStandalone.doCodeGen().finalize(AriaStandalone.manifestFilename);
}

export async function doBuild() {
  const { runProcess } = await import("@xrpa/xrpa-file-utils");
  const mode = AriaStandalone.getBuckMode("debug");
  const target = await AriaStandalone.getStandaloneTarget();

  await runProcess({
    filename: "buck2",
    args: ["build", mode, target],
    onLineReceived: line => console.log(line),
  });
}

export async function doRun() {
  const { buckRun } = await import("@xrpa/xrpa-file-utils");

  await buckRun({
    mode: AriaStandalone.getBuckMode("debug"),
    target: await AriaStandalone.getStandaloneTarget(),
    resourceFilenames: (AriaStandalone as any).resourceFilenames || [],
  });
}

export async function doCodegenAndBuild() {
  await doCodegen();
  await doBuild();
}

export async function runStandalone() {
  await AriaStandalone.buckRunDebug();
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
