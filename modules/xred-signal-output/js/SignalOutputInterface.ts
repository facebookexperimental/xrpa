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

import {
  Boolean,
  Collection,
  Count,
  Enum,
  GameComponentBindingsDisabled,
  IfGameEngine,
  Instantiate,
  Message,
  ObjectField,
  Output,
  PrimaryKey,
  ProgramInput,
  ProgramOutput,
  ReferenceTo,
  Signal,
  String,
  UnityCoordinateSystem,
  XrpaDataflowConnection,
  XrpaDataflowGraphNode,
  XrpaProgramInterface,
  XrpaProgramParam,
  bindExternalProgram,
  isDataflowForeignObjectInstantiation,
  useCoordinateSystem,
} from "@xrpa/xrpa-orchestrator";
import { StringFilter } from "@xrpa/xrpa-utils";
import path from "path";

export const XredSignalOutputInterface = XrpaProgramInterface("Xred.SignalOutput", path.join(__dirname, "../package.json"), () => {
  useCoordinateSystem(UnityCoordinateSystem);

  const SignalOutputDevice = ProgramOutput("SignalOutputDevice", Collection({
    maxCount: 64,
    fields: {
      name: PrimaryKey(IfGameEngine, String),
      deviceType: Enum("SignalOutputDeviceType", ["Audio", "Haptics"]),

      numChannels: Count,
      frameRate: Count,
      isSystemAudioOutput: Boolean,

      inputEvent: Message("InputEvent", {
        type: Enum("InputEventType", ["Release", "Press"]), // in this order so release=0 and press=1
        source: Count,
      }),
    },
  }));

  ProgramInput("SignalOutputSource", GameComponentBindingsDisabled(Collection({
    maxCount: 128,
    fields: {
      bindTo: Enum("DeviceBindingType", ["Device", "DeviceByName", "SystemAudio", "TcpStream"]),

      device: ReferenceTo(SignalOutputDevice),
      deviceName: String,

      hostname: String,
      port: Count,

      signal: Signal,

      isConnected: Output(Boolean),
    },
  })));
});

export function OutputToDevice(params: {
  device: XrpaProgramParam | XrpaDataflowGraphNode;
  signal: XrpaProgramParam | XrpaDataflowConnection;
}) {
  const dataflowNode = Instantiate(
    [bindExternalProgram(XredSignalOutputInterface), "SignalOutputSource"],
    {},
  );
  assert(isDataflowForeignObjectInstantiation(dataflowNode));
  dataflowNode.fieldValues.bindTo = 0;
  dataflowNode.fieldValues.device = params.device;
  dataflowNode.fieldValues.signal = params.signal;

  return {
    isConnected: ObjectField(dataflowNode, "isConnected"),
  };
}

export function OutputToMatchingDevice(params: {
  name: StringFilter;
  signal: XrpaProgramParam | XrpaDataflowConnection;
}) {
  const dataflowNode = Instantiate(
    [bindExternalProgram(XredSignalOutputInterface), "SignalOutputSource"],
    {},
  );
  assert(isDataflowForeignObjectInstantiation(dataflowNode));
  dataflowNode.fieldValues.bindTo = 1;
  dataflowNode.fieldValues.deviceName = params.name;
  dataflowNode.fieldValues.signal = params.signal;

  return {
    isConnected: ObjectField(dataflowNode, "isConnected"),
  };
}

export function OutputToSystemAudio(params: {
  signal: XrpaProgramParam | XrpaDataflowConnection;
}) {
  const dataflowNode = Instantiate(
    [bindExternalProgram(XredSignalOutputInterface), "SignalOutputSource"],
    {},
  );
  assert(isDataflowForeignObjectInstantiation(dataflowNode));
  dataflowNode.fieldValues.bindTo = 2;
  dataflowNode.fieldValues.signal = params.signal;

  return {
    isConnected: ObjectField(dataflowNode, "isConnected"),
  };
}

export function OutputToTcpStream(params: {
  hostname: string | XrpaProgramParam | XrpaDataflowConnection;
  port: number | XrpaProgramParam | XrpaDataflowConnection;
  signal: XrpaProgramParam | XrpaDataflowConnection;
}) {
  const dataflowNode = Instantiate(
    [bindExternalProgram(XredSignalOutputInterface), "SignalOutputSource"],
    {},
  );
  assert(isDataflowForeignObjectInstantiation(dataflowNode));
  dataflowNode.fieldValues.bindTo = 3;
  dataflowNode.fieldValues.hostname = params.hostname;
  dataflowNode.fieldValues.port = params.port;
  dataflowNode.fieldValues.signal = params.signal;

  return {
    isConnected: ObjectField(dataflowNode, "isConnected"),
  };
}
