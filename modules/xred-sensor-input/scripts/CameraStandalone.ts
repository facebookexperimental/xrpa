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

import { XredCameraInterface } from "../js";

const apidir = path.join(__dirname, "..", "Camera", "api");

export const CameraModule = XrpaNativeCppProgram("Camera", apidir, () => {
  useBuck({
    target: "//arvr/libraries/xred/xrpa/modules/xred-sensor-input/Camera:Camera",
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

  setProgramInterface(XredCameraInterface);
});

export const CameraStandalone = new CppStandalone(CameraModule, path.join(apidir, "standalone"), path.join(apidir, "manifest.gen.json"));

if (require.main === module) {
  CameraStandalone.smartExecute().catch((e) => {
    console.error(e);
    process.exit(1);
  }).then(() => {
    process.exit(0);
  });
}
