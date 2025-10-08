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
  AngularUnitType,
  Boolean,
  CoordAxis,
  CppStandalone,
  SpatialUnitType,
  XrpaNativeCppProgram,
  addSetting,
  setProgramInterface,
  useBuck,
  useCoordinateSystem,
  useEigenTypes,
} from "@xrpa/xrpa-orchestrator";

import { XredTrackingInterface } from "../js/TrackingInterface";

const apidir = path.join(__dirname, "..", "PulsarSTO", "api");

export const PulsarSTOModule = XrpaNativeCppProgram("PulsarSTO", apidir, () => {
  useBuck({
    target: "//arvr/libraries/xred/xrpa/modules/xred-tracking/PulsarSTO:PulsarSTO",
    oncall: "xred_swes",
    modes: {
      windows: {
        debug: "@arvr/mode/win/debug",
        release: "@arvr/mode/win/release",
      },
    },
  });

  useCoordinateSystem({
    up: CoordAxis.posY,
    right: CoordAxis.posX,
    forward: CoordAxis.negZ,
    spatialUnit: SpatialUnitType.meter,
    angularUnit: AngularUnitType.radian,
  });
  useEigenTypes();

  addSetting("olympus", Boolean(false, "Treat trackers as Olympus controllers instead of Marrowstone pucks"));

  setProgramInterface(XredTrackingInterface);
});

export const PulsarSTOStandalone = new CppStandalone(PulsarSTOModule, path.join(apidir, "standalone"), path.join(apidir, "manifest.gen.json"));
