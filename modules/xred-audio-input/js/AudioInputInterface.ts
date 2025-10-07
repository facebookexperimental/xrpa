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


import assert from "assert";
import path from "path";

import {
  bindExternalProgram,
  Collection,
  Boolean,
  Count,
  Instantiate,
  isDataflowForeignObjectInstantiation,
  ObjectField,
  Output,
  ProgramInput,
  ProgramOutput,
  Signal,
  String,
  XrpaDataflowConnection,
  XrpaDataType,
  XrpaProgramInterface,
  XrpaProgramParam,
  ReferenceTo,
  Enum,
  XrpaDataflowGraphNode,
} from "@xrpa/xrpa-orchestrator";
import { StringFilter } from "@xrpa/xrpa-utils";

export const DEFAULT_AUDIO_INPUT_MAX_COUNT = 16;

export const XredAudioInputInterface = XrpaProgramInterface("Xred.AudioInput", path.join(__dirname, "../package.json"), () => {
  const AudioInputDevice = ProgramOutput("AudioInputDevice", Collection({
    maxCount: 32,
    fields: {
      deviceName: String("", "Human-readable device name"),
      numChannels: Count(2, "Number of channels available"),
      frameRate: Count(48000, "Default frame rate for audio capture"),
      isSystemAudioInput: Boolean(false, "Whether this is the default input device"),
    },
  }));

  ProgramInput("AudioInputSource", Collection({
    maxCount: DEFAULT_AUDIO_INPUT_MAX_COUNT,
    fields: {
      bindTo: Enum("DeviceBindingType", ["Device", "DeviceByName", "SystemAudio", "TcpStream"]),

      device: ReferenceTo(AudioInputDevice),
      deviceName: String,

      hostname: String,
      port: Count,

      frameRate: Count(48000, "Frame rate for audio capture"),
      numChannels: Count(2, "Number of channels for audio capture"),

      audioSignal: Output(Signal),
      isActive: Output(Boolean(false, "Whether audio input is currently active")),
      errorMessage: Output(String("", "Error message if audio input failed")),
    },
  }));
});

export function InputFromDevice(params: {
  device: XrpaProgramParam | XrpaDataflowGraphNode;
  frameRate?: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"Count">> | number;
  numChannels?: number;
}) {
  const numChannels = params.numChannels ?? 2;

  const dataflowNode = Instantiate(
    [bindExternalProgram(XredAudioInputInterface), "AudioInputSource"],
    {},
  );

  assert(isDataflowForeignObjectInstantiation(dataflowNode));

  dataflowNode.fieldValues = {
    bindTo: 0,
    device: params.device,
    frameRate: params.frameRate ?? 48000,
    numChannels,
  };

  return {
    audioSignal: { numChannels, signal: ObjectField(dataflowNode, "audioSignal") },
    isActive: ObjectField(dataflowNode, "isActive"),
    errorMessage: ObjectField(dataflowNode, "errorMessage"),
  };
}

export function InputFromMatchingDevice(params: {
  name: StringFilter;
  frameRate?: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"Count">> | number;
  numChannels?: number;
}) {
  const numChannels = params.numChannels ?? 2;

  const dataflowNode = Instantiate(
    [bindExternalProgram(XredAudioInputInterface), "AudioInputSource"],
    {},
  );

  assert(isDataflowForeignObjectInstantiation(dataflowNode));

  dataflowNode.fieldValues = {
    bindTo: 1,
    deviceName: params.name,
    frameRate: params.frameRate ?? 48000,
    numChannels,
  };

  return {
    audioSignal: { numChannels, signal: ObjectField(dataflowNode, "audioSignal") },
    isActive: ObjectField(dataflowNode, "isActive"),
    errorMessage: ObjectField(dataflowNode, "errorMessage"),
  };
}

export function InputFromSystemAudio(params: {
  frameRate?: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"Count">> | number;
  numChannels?: number;
}) {
  const numChannels = params.numChannels ?? 2;

  const dataflowNode = Instantiate(
    [bindExternalProgram(XredAudioInputInterface), "AudioInputSource"],
    {},
  );

  assert(isDataflowForeignObjectInstantiation(dataflowNode));

  dataflowNode.fieldValues = {
    bindTo: 2,
    frameRate: params.frameRate ?? 48000,
    numChannels,
  };

  return {
    audioSignal: { numChannels, signal: ObjectField(dataflowNode, "audioSignal") },
    isActive: ObjectField(dataflowNode, "isActive"),
    errorMessage: ObjectField(dataflowNode, "errorMessage"),
  };
}

export function InputFromTcpStream(params: {
  hostname: string | XrpaProgramParam | XrpaDataflowConnection;
  port: number | XrpaProgramParam | XrpaDataflowConnection;
  frameRate?: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"Count">> | number;
  numChannels?: number;
}) {
  const numChannels = params.numChannels ?? 2;

  const dataflowNode = Instantiate(
    [bindExternalProgram(XredAudioInputInterface), "AudioInputSource"],
    {},
  );

  assert(isDataflowForeignObjectInstantiation(dataflowNode));

  dataflowNode.fieldValues = {
    bindTo: 3,
    hostname: params.hostname,
    port: params.port,
    frameRate: params.frameRate ?? 48000,
    numChannels,
  };

  return {
    audioSignal: { numChannels, signal: ObjectField(dataflowNode, "audioSignal") },
    isActive: ObjectField(dataflowNode, "isActive"),
    errorMessage: ObjectField(dataflowNode, "errorMessage"),
  };
}
