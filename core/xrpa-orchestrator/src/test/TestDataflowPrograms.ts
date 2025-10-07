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
  bindExternalProgram,
  Distance,
  Instantiate,
  ObjectField,
  ProgramInput,
  ProgramOutput,
  String,
  XrpaDataflowProgram,
} from "../index";

import { XredInteractionInterface } from "./InteractionInterface";

export const InteractableCylinderDataflow = XrpaDataflowProgram("InteractableCylinder", () => {
  const interaction = bindExternalProgram(XredInteractionInterface);

  const node = Instantiate([interaction, "RayInteractable"], {
    tiebreakerScore: 50,
    SetConfiguration: ProgramInput("SetConfiguration"),
    surface: Instantiate([interaction, "CylinderSurface"], {
      radius: 0.5,
      height: ProgramInput("height", Distance(1)),
      tag: `Cylinder${ProgramInput("tag", String())}Tag`,
    }),
  });

  ProgramOutput("PointerChanged", ObjectField(node, "PointerEvent"));
  ProgramOutput("hasInteraction", ObjectField(node, "hasInteraction"));
  ProgramOutput("testString", `This string is a test of embeddings. ${ObjectField(node, "hasInteraction")} is the value of hasInteraction.`)
});
