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
  OvrCoordinateSystem,
  useCoordinateSystem,
  XrpaPythonApplication,
} from "../index";

import { XredInteractionInterface } from "./InteractionInterface";
import { TestOutputPath } from "./TestHelpers";
import { InteractableCylinderDataflow } from "./TestDataflowPrograms";

const apidir = path.join(TestOutputPath, "Test8");

const Test8App = XrpaPythonApplication("Test8", {
  codegenDir: apidir,
  condaEnvFile: "",
  pythonEntryPoint: "",
}, () => {
  useCoordinateSystem(OvrCoordinateSystem);
  bindExternalProgram(XredInteractionInterface);
  bindExternalProgram(InteractableCylinderDataflow);
});

export async function test8() {
  await Test8App.doCodeGen().finalize(path.join(apidir, "manifest.gen.json"));
}
