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
import { ImageWindow } from "@xrpa/xred-debug";
import { CameraFeed } from "@xrpa/xred-sensor-input";
import { VisualEmotionDetection } from "@xrpa/xred-visual-emotion-detection"

const apidir = path.join(__dirname, "..", "api");

const CameraDebugProgram = XrpaDataflowProgram("CameraDebugProgram", () => {
  const cameraFeed = CameraFeed({});

  ImageWindow({ windowTitle: "Camera", image: cameraFeed.cameraImage });

  const emotionDetection = VisualEmotionDetection({
    imageInput: cameraFeed.cameraImage,
    apiKey: "/Users/archanapradeep/Downloads/licence_online_meta.bskai",
  });

  ProgramOutput("emotionResult", emotionDetection.emotionResult);
});

//////////////////////////////////////////////////////////////////////////////

const CameraDebugModule = XrpaNativeCppProgram("CameraDebug", apidir, () => {
  useBuck({
    target: "//arvr/libraries/xred/xrpa/demos/CameraDebug:CameraDebug",
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

  bindExternalProgram(CameraDebugProgram);
});

async function main() {
  const standalone = new CppStandalone(CameraDebugModule, path.join(apidir, "standalone"), path.join(apidir, "manifest.gen.json"));
  await standalone.buckRunDebug();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).then(() => {
  process.exit(0);
});
