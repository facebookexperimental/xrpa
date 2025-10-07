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
  Angle,
  bindExternalProgram,
  Boolean,
  Collection,
  ColorSRGBA,
  Count,
  Enum,
  FixedArray,
  Instantiate,
  isDataflowForeignObjectInstantiation,
  Message,
  ObjectField,
  Output,
  ProgramInput,
  String,
  XrpaDataflowConnection,
  XrpaFieldValue,
  XrpaProgramInterface,
  XrpaProgramParam,
} from "@xrpa/xrpa-orchestrator";

import { InputFromTcpStream } from "@xrpa/xred-audio-input";
import { OutputToTcpStream } from "@xrpa/xred-signal-output";
import { ISignalNodeType, isISignalNodeType, OutputSignal } from "@xrpa/xred-signal-processing";

import assert from "assert";
import path from "path";

const MIC_PORT = 12345;
const SPEAKER_PORT = 12346;

export enum KnobControlMode {
  Disabled = 0,
  Position = 1,
  Detent = 2,
}

export type ColorSRGBA = [number, number, number, number];

export const XredSmartControllerInterface = XrpaProgramInterface("Xred.SmartController", path.join(__dirname, "../package.json"), () => {
  const KnobControlModeType = Enum("KnobControlMode", ["Disabled", "Position", "Detent"]);

  ProgramInput("KnobControl", Collection({
    maxCount: 4,
    fields: {
      ipAddress: String("", "IP address of the device to control"),
      isConnected: Output(Boolean(false, "Whether the device is connected")),

      controlMode: KnobControlModeType,
      position: Count(0, "Position to set the knob to, when controlMode == Position"),
      detentCount: Count(10, "Number of detents to set the knob to, when controlMode == Detent"),

      inputEvent: Output(Message("InputEvent", {
        type: Enum("InputEventType", ["Release", "Press"]), // in this order so release=0 and press=1
        source: Count,
      })),

      positionEvent: Output(Message("PositionEvent", {
        position: Count,
        absolutePosition: Count,
        detentPosition: Count,
      })),
    },
  }));

  ProgramInput("LightControl", Collection({
    maxCount: 64,
    fields: {
      ipAddress: String("", "IP address of the device to control"),
      isConnected: Output(Boolean(false, "Whether the device is connected")),

      lightColors: FixedArray(ColorSRGBA, 24),
      rotationOffset: Angle,
      rotationSpeed: Angle,
      priority: Count(0, "Priority of the light, lower values will be applied first, with higher values alpha-blended on top"),
    },
  }));
});

export function KnobControl(params: {
  ipAddress: string | XrpaProgramParam | XrpaDataflowConnection;
  controlMode: KnobControlMode | XrpaProgramParam | XrpaDataflowConnection;
  position?: number | XrpaProgramParam | XrpaDataflowConnection;
  detentCount?: number | XrpaProgramParam | XrpaDataflowConnection;
}) {
  const dataflowNode = Instantiate(
    [bindExternalProgram(XredSmartControllerInterface), "KnobControl"],
    {},
  );
  assert(isDataflowForeignObjectInstantiation(dataflowNode));
  dataflowNode.fieldValues.ipAddress = params.ipAddress;
  dataflowNode.fieldValues.controlMode = params.controlMode;
  dataflowNode.fieldValues.position = params.position ?? 0;
  dataflowNode.fieldValues.detentCount = params.detentCount ?? 10;

  return {
    isConnected: ObjectField(dataflowNode, "isConnected"),
    inputEvent: ObjectField(dataflowNode, "inputEvent"),
    positionEvent: ObjectField(dataflowNode, "positionEvent"),
  };
}

export function LightControl(params: {
  ipAddress: string | XrpaProgramParam | XrpaDataflowConnection;
  lightColors: Array<ColorSRGBA> | XrpaProgramParam | XrpaDataflowConnection;
  rotationOffset?: number | XrpaProgramParam | XrpaDataflowConnection;
  rotationSpeed?: number | XrpaProgramParam | XrpaDataflowConnection;
  priority?: number | XrpaProgramParam | XrpaDataflowConnection;
}) {
  const dataflowNode = Instantiate(
    [bindExternalProgram(XredSmartControllerInterface), "LightControl"],
    {},
  );
  assert(isDataflowForeignObjectInstantiation(dataflowNode));
  dataflowNode.fieldValues.ipAddress = params.ipAddress;
  dataflowNode.fieldValues.lightColors = params.lightColors as unknown as XrpaFieldValue; // TODO: fix this
  dataflowNode.fieldValues.rotationOffset = params.rotationOffset ?? 0;
  dataflowNode.fieldValues.rotationSpeed = params.rotationSpeed ?? 0;
  dataflowNode.fieldValues.priority = params.priority ?? 0;

  return {
    isConnected: ObjectField(dataflowNode, "isConnected"),
  };
}

export function InputFromSmartMicrophone(params: {
  ipAddress: string | XrpaProgramParam | XrpaDataflowConnection;
}) {
  return InputFromTcpStream({
    hostname: params.ipAddress,
    port: MIC_PORT,
    frameRate: 16000,
    numChannels: 1,
  });
}

export function OutputToSmartSpeaker(params: {
  ipAddress: string | XrpaProgramParam | XrpaDataflowConnection;
  audioSignal: XrpaProgramParam | XrpaDataflowConnection | ISignalNodeType;
}) {
  let signal = params.audioSignal;
  if (isISignalNodeType(signal)) {
    // pull signal data out of the SignalProcessing graph at the correct frame rate
    signal = OutputSignal({
      source: signal,
      frameRate: 16000,
    });
  }
  return OutputToTcpStream({
    hostname: params.ipAddress,
    port: SPEAKER_PORT,
    signal,
  });
}
