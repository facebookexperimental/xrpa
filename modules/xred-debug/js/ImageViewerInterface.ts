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
  Image,
  Instantiate,
  isDataflowForeignObjectInstantiation,
  Message,
  MessageRate,
  ProgramInput,
  String,
  XrpaDataflowConnection,
  XrpaProgramInterface,
} from "@xrpa/xrpa-orchestrator";
import assert from "assert";
import path from "path";

export const XredImageViewerInterface = XrpaProgramInterface("Xred.ImageViewer", path.join(__dirname, "../package.json"), () => {
  ProgramInput("ImageWindow", Collection({
    maxCount: 10,
    fields: {
      name: String,
      image: MessageRate(10, Message({
        image: Image("InputImage", {
          expectedWidth: 1600,
          expectedHeight: 1600,
          expectedBytesPerPixel: 3,
        }),
      })),
    },
  }));
});

export function ImageWindow(params: { windowTitle: string, image: XrpaDataflowConnection }) {
  const dataflowNode = Instantiate(
    [bindExternalProgram(XredImageViewerInterface), "ImageWindow"],
    {},
  );
  assert(isDataflowForeignObjectInstantiation(dataflowNode));
  dataflowNode.fieldValues.name = params.windowTitle;
  dataflowNode.fieldValues.image = params.image;
}
