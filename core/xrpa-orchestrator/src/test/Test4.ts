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
import { UnityProject, UppercaseCompanyName, bindExternalProgram } from "../index";

import { XredInteractionInterface } from "./InteractionInterface";
import { TestOutputPath } from "./TestHelpers";
import { XredTrackingInterface } from "./TrackingInterface";
import { InteractableCylinderDataflow } from "./TestDataflowPrograms";

const apidir = path.join(TestOutputPath, "Test4");

export async function test4() {
  await UnityProject(apidir, "test4", () => {
    bindExternalProgram(UppercaseCompanyName(XredInteractionInterface));
    bindExternalProgram(UppercaseCompanyName(XredTrackingInterface));
    bindExternalProgram(InteractableCylinderDataflow);
  });
}
