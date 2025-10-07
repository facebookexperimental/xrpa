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
  Collection,
  Count,
  Instantiate,
  isDataflowForeignObjectInstantiation,
  ObjectField,
  Output,
  ProgramInput,
  XrpaDataflowConnection,
  XrpaProgramInterface,
} from "@xrpa/xrpa-orchestrator";

import { getPerceptionTypes } from "./Shared";
import assert from "assert";
import path from "path";

export const XredImageSelectorInterface = XrpaProgramInterface("Xred.ImageSelector", path.join(__dirname, "../package.json"), () => {
  const {
    poseDynamicsMessage,
    rgbMessage,
  } = getPerceptionTypes();

  ProgramInput("ImageSelector", Collection({
    maxCount: 2,
    fields: {
      pickOneEveryNBasedOnMotion: Count(1),
      rgbCamera: rgbMessage,
      poseDynamics: poseDynamicsMessage,

      rgbImage: Output(rgbMessage),
    },
  }));
});

export function ImageSelector(params: {
  pickOneEveryNBasedOnMotion: number | XrpaDataflowConnection,
  rgbCamera: XrpaDataflowConnection,
  poseDynamics: XrpaDataflowConnection,
}): XrpaDataflowConnection {
  const dataflowNode = Instantiate(
    [bindExternalProgram(XredImageSelectorInterface), "ImageSelector"],
    {},
  );
  assert(isDataflowForeignObjectInstantiation(dataflowNode));
  dataflowNode.fieldValues.pickOneEveryNBasedOnMotion = params.pickOneEveryNBasedOnMotion;
  dataflowNode.fieldValues.rgbCamera = params.rgbCamera;
  dataflowNode.fieldValues.poseDynamics = params.poseDynamics;

  return ObjectField(dataflowNode, "rgbImage");
}
