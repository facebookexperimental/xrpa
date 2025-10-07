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

import {
  addSetting,
  bindExternalProgram,
  CppStandalone,
  OvrCoordinateSystem,
  ProgramInput,
  ProgramOutput,
  String,
  useBuck,
  useCoordinateSystem,
  XrpaDataflowProgram,
  XrpaNativeCppProgram,
} from "@xrpa/xrpa-orchestrator";

import { KnobControl, KnobControlMode, LightControl } from "@xrpa/xred-device-input";


const apidir = path.join(__dirname, "..", "api");

const SmartControllerProgram = XrpaDataflowProgram("SmartControllerProgram", () => {
  const ipAddress = ProgramInput("ipAddress", String());

  const knob = KnobControl({
    ipAddress,
    controlMode: KnobControlMode.Detent,
    detentCount: 20,
  });

  ProgramOutput("knobChanged", knob.positionEvent);

  LightControl({
    ipAddress,
    priority: 0,
    lightColors: ProgramInput("baseLightColors"),
  });

  LightControl({
    ipAddress,
    priority: 0,
    lightColors: ProgramInput("overlayLightColors"),
    rotationSpeed: ProgramInput("overlayLightRotationSpeed"),
  });
});

//////////////////////////////////////////////////////////////////////////////

const SmartControllerTestModule = XrpaNativeCppProgram("SmartControllerTest", apidir, () => {
  useBuck({
    target: "//arvr/libraries/xred/xrpa/demos/SmartControllerTest:SmartControllerTest",
    oncall: "xred_swes",
    modes: {
      windows: {
        debug: "@arvr/mode/win/debug",
        release: "@arvr/mode/win/release",
      },
      macos: {
        debug: "@arvr/mode/mac/dbg",
        release: "@arvr/mode/mac-arm/opt",
      },
    },
  });

  useCoordinateSystem(OvrCoordinateSystem);

  bindExternalProgram(SmartControllerProgram);

  addSetting("ipAddress", String("", "IP address of the smart controller"));
});

const SmartControllerTestStandalone = new CppStandalone(SmartControllerTestModule, path.join(apidir, "standalone"), path.join(apidir, "manifest.gen.json"));

SmartControllerTestStandalone.smartExecute().catch((e) => {
  console.error(e);
  process.exit(1);
}).then(() => {
  process.exit(0);
});
