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
  Collection,
  Image,
  Message,
  ObjectTransform,
  Output,
  OvrCoordinateSystem,
  ProgramInput,
  Quaternion,
  Scalar,
  setProgramInterface,
  Spawnable,
  Struct,
  UnityCoordinateSystem,
  useCoordinateSystem,
  Vector3,
  XrpaNativeUnityProgram,
  XrpaProgramInterface,
  XrpaPythonApplication,
} from "@xrpa/xrpa-orchestrator";

const outdir = path.join(__dirname, "..", "..");

const SensoryStimulusInterface = XrpaProgramInterface("MSI.SensoryStimulus", path.join(__dirname, "../package.json"), () => {
  useCoordinateSystem(UnityCoordinateSystem);

  const Pose = Struct("Pose", {
    position: Vector3,
    orientation: Quaternion,
  });

  ProgramInput("Stimulus", Spawnable(Collection({
    maxCount: 128,
    fields: {
      pose: ObjectTransform({
        position: "position",
        rotation: "orientation",
      }, Pose),

      visualDelay: Scalar,
      audioDelay: Scalar,

      // TODO - add audio and visual stimulus types

      UserResponse: Output(Message("UserResponse")),
    },
  })));

  ProgramInput("PsychoPyWindow", Spawnable(Collection({
    maxCount: 4,
    fields: {
      display: Message({
        image: Image({
          expectedWidth: 640,
          expectedHeight: 480,
          expectedBytesPerPixel: 3,
        }),
      }),
    },
  })));
});

const UnityStimulusPackage = XrpaNativeUnityProgram("SensoryStimulus", outdir, () => {
  setProgramInterface(SensoryStimulusInterface);
});

const UnityModuleTest = XrpaPythonApplication("UnityModuleTest", outdir, () => {
  useCoordinateSystem(OvrCoordinateSystem);
  bindExternalProgram(SensoryStimulusInterface);
});

async function main() {
  const filesToWrite = UnityStimulusPackage.doCodeGen();
  filesToWrite.merge(UnityModuleTest.doCodeGen());
  await filesToWrite.finalize(path.join(__dirname, "..", "manifest.gen.json"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).then(() => {
  process.exit(0);
});
