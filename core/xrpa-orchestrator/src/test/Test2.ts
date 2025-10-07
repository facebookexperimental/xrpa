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
  mapInterfaceType,
  mapType,
  OvrCoordinateSystem,
  Quaternion,
  useBuck,
  useCoordinateSystem,
  Vector3,
  XrpaNativeCppProgram,
} from "../index";

import { XredInteractionInterface } from "./InteractionInterface";
import { TestBuckTargetPath, TestOutputPath } from "./TestHelpers";

const apidir = path.join(TestOutputPath, "Test2");

const Test2Module = XrpaNativeCppProgram("Test2", apidir, () => {
  useBuck({
    target: `${TestBuckTargetPath}/Test2:Test2`,
    oncall: "xred_swes",
    modes: {
      windows: {
        debug: "",
        release: "",
      },
    },
  });

  useCoordinateSystem(OvrCoordinateSystem);

  bindExternalProgram(XredInteractionInterface);

  mapType(Quaternion, {
    typename: "OVR::Quatf",
    headerFile: "<OVR_Math.h>",
  });
  mapType(Vector3, {
    typename: "OVR::Vector3f",
    headerFile: "<OVR_Math.h>",
  });

  mapInterfaceType(XredInteractionInterface, "Pose", {
    typename: "OVR::Posef",
    headerFile: "<OVR_Math.h>",
    fieldMap: {
      Rotation: "orientation",
      Translation: "position",
    },
  });
});

export async function test2() {
  const gen = new CppStandalone(Test2Module, path.join(apidir, "standalone"), path.join(apidir, "manifest.gen.json"));
  await gen.doCodeGen().finalize(gen.manifestFilename);
}
