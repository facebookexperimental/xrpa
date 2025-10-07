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
  Instantiate,
  isDataflowForeignObjectInstantiation,
  Message,
  ObjectField,
  Output,
  ProgramInput,
  String,
  XrpaDataflowConnection,
  XrpaProgramInterface,
} from "@xrpa/xrpa-orchestrator";

import { getPerceptionTypes } from "./Shared";
import assert from "assert";
import path from "path";

export const XredObjectRecognitionInterface = XrpaProgramInterface("Xred.ObjectRecognition", path.join(__dirname, "../package.json"), () => {
  const {
    rgbMessage,
  } = getPerceptionTypes();

  ProgramInput("ObjectRecognition", Collection({
    maxCount: 2,
    fields: {
      rgbImage: rgbMessage,

      objectDetction: Output(Message("ObjectDetection", {
        objectClass: String,
      })),
    },
  }));
});

export function ObjectRecognition(params: {
  rgbImage: XrpaDataflowConnection,
}): XrpaDataflowConnection {
  const dataflowNode = Instantiate(
    [bindExternalProgram(XredObjectRecognitionInterface), "ObjectRecognition"],
    {},
  );
  assert(isDataflowForeignObjectInstantiation(dataflowNode));
  dataflowNode.fieldValues.rgbImage = params.rgbImage;

  return ObjectField(dataflowNode, "objectDetction");
}
