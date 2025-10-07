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
  Boolean,
  BuiltinType,
  Collection,
  Count,
  Instantiate,
  isDataflowForeignObjectInstantiation,
  ObjectField,
  ObjectTransform,
  Output,
  ProgramInput,
  Signal,
  String,
  Timestamp,
  XrpaDataType,
  XrpaProgramInterface,
  XrpaProgramParam,
} from "@xrpa/xrpa-orchestrator";

import assert from "assert";
import path from "path";

export const XredAriaInterface = XrpaProgramInterface("Xred.Aria", path.join(__dirname, "../package.json"), () => {
  const {
    pose,
    poseDynamicsMessage,
    rgbMessage,
    slamMessage,
  } = getPerceptionTypes();

  const PoseTransform = ObjectTransform({
    position: "position",
    rotation: "orientation",
  }, pose);

  ProgramInput("AriaGlasses", Collection({
    maxCount: 4,
    fields: {
      ipAddress: String,
      isFlashlight: Boolean,
      usbStreaming: Boolean,

      trackPose: Boolean(true),
      sendAudioOutput: Boolean(true),
      sendRgbOutput: Boolean(true),
      sendSlamOutputs: Boolean(true),

      calibrationJson: Output(String),
      isStreaming: Output(Boolean),
      lastUpdate: Output(Timestamp),

      audio: Output(Signal),
      rgbCamera: Output(rgbMessage),
      slamCamera1: Output(slamMessage),
      slamCamera2: Output(slamMessage),

      poseDynamics: Output(poseDynamicsMessage),

      pose: Output(PoseTransform),
      coordinateFrameId: Output(Count),
    },
  }));
});

export function AriaGlasses(params: {
  ipAddress: string | XrpaProgramParam<XrpaDataType<BuiltinType.String>>,
  isFlashlight?: boolean | XrpaProgramParam<XrpaDataType<BuiltinType.Boolean>>,
  usbStreaming?: boolean | XrpaProgramParam<XrpaDataType<BuiltinType.Boolean>>,
  trackPose?: boolean | XrpaProgramParam<XrpaDataType<BuiltinType.Boolean>>,
  sendAudioOutput?: boolean | XrpaProgramParam<XrpaDataType<BuiltinType.Boolean>>,
  sendRgbOutput?: boolean | XrpaProgramParam<XrpaDataType<BuiltinType.Boolean>>,
  sendSlamOutputs?: boolean | XrpaProgramParam<XrpaDataType<BuiltinType.Boolean>>,
}) {
  const dataflowNode = Instantiate(
    [bindExternalProgram(XredAriaInterface), "AriaGlasses"],
    {},
  );
  assert(isDataflowForeignObjectInstantiation(dataflowNode));
  dataflowNode.fieldValues = { ...params };

  return {
    calibrationJson: ObjectField(dataflowNode, "calibrationJson"),
    isStreaming: ObjectField(dataflowNode, "isStreaming"),
    lastUpdate: ObjectField(dataflowNode, "lastUpdate"),

    audio: { numChannels: 2, signal: ObjectField(dataflowNode, "audio") },
    rgbCamera: ObjectField(dataflowNode, "rgbCamera"),
    slamCamera1: ObjectField(dataflowNode, "slamCamera1"),
    slamCamera2: ObjectField(dataflowNode, "slamCamera2"),

    poseDynamics: ObjectField(dataflowNode, "poseDynamics"),
    pose: ObjectField(dataflowNode, "pose"),
    coordinateFrameId: ObjectField(dataflowNode, "coordinateFrameId"),
  };
}
