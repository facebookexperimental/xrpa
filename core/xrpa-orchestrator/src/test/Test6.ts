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
  OvrCoordinateSystem,
  ProgramInput,
  String,
  useCoordinateSystem,
  XrpaProgramInterface,
  XrpaPythonApplication,
} from "../index";

import { XredInteractionInterface } from "./InteractionInterface";
import { TestOutputPath } from "./TestHelpers";

const apidir = path.join(TestOutputPath, "Test6");

const SensoryStimulusInterface = XrpaProgramInterface("MSI.SensoryStimulus", "", () => {
  useCoordinateSystem(OvrCoordinateSystem);

  ProgramInput("PsychoPyWindow", Collection({
    maxCount: 4,
    fields: {
      name: String,

      display: Message({
        image: Image({
          expectedWidth: 640,
          expectedHeight: 480,
          expectedBytesPerPixel: 3,
        }),
      }),
    },
  }));
});

const Test6App = XrpaPythonApplication("Test6", {
  codegenDir: apidir,
  condaEnvFile: "",
  pythonEntryPoint: "",
}, () => {
  useCoordinateSystem(OvrCoordinateSystem);
  bindExternalProgram(XredInteractionInterface);
  bindExternalProgram(SensoryStimulusInterface);
});

export async function test6() {
  await Test6App.doCodeGen().finalize(path.join(apidir, "manifest.gen.json"));
}
