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
import { PluginDeps, UnrealProject, UppercaseCompanyName, bindExternalProgram } from "../index";

import { XredInteractionInterface } from "./InteractionInterface";
import { TestOutputPath } from "./TestHelpers";
import { XredTrackingInterface } from "./TrackingInterface";
import { InteractableCylinderDataflow } from "./TestDataflowPrograms";

const apidir = path.join(TestOutputPath, "Test3");

export async function test3() {
  await UnrealProject(apidir, "test3", () => {
    PluginDeps(bindExternalProgram(UppercaseCompanyName(XredInteractionInterface)), [
      ["", "HeadMountedDisplay"],
      ["OculusVR", "OculusInput"],
    ]);

    bindExternalProgram(UppercaseCompanyName(XredTrackingInterface));

    bindExternalProgram(InteractableCylinderDataflow);
  });
}
