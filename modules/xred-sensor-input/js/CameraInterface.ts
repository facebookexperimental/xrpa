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


import { getPerceptionTypes } from "@xrpa/xred-perception-services";

import {
  bindExternalProgram,
  Collection,
  Instantiate,
  isDataflowForeignObjectInstantiation,
  ObjectField,
  Output,
  ProgramInput,
  ProgramOutput,
  String,
  XrpaProgramInterface,
} from "@xrpa/xrpa-orchestrator";
import { StringFilter } from "@xrpa/xrpa-utils";

import assert from "assert";
import path from "path";

export const XredCameraInterface = XrpaProgramInterface("Xred.Camera", path.join(__dirname, "../package.json"), () => {
  const {
    rgbMessage,
  } = getPerceptionTypes();

  ProgramOutput("CameraDevice", Collection({
    maxCount: 4,
    fields: {
      name: String,
    },
  }));

  ProgramInput("CameraFeed", Collection({
    maxCount: 4,
    fields: {
      cameraName: String("", "pseudo-regex, with just $ and ^ supported for now"),
      cameraImage: Output(rgbMessage),
    },
  }));
});

export function CameraFeed(params: {
  cameraName?: StringFilter;
}) {
  const dataflowNode = Instantiate(
    [bindExternalProgram(XredCameraInterface), "CameraFeed"],
    {},
  );
  assert(isDataflowForeignObjectInstantiation(dataflowNode));
  dataflowNode.fieldValues = {
    cameraName: params.cameraName ?? "",
  };

  return {
    cameraImage: ObjectField(dataflowNode, "cameraImage"),
  };
}
