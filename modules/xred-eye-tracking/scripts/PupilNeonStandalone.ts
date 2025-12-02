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
  CoordAxis,
  SpatialUnitType,
  XrpaPythonStandalone,
  setProgramInterface,
  useCoordinateSystem,
} from "@xrpa/xrpa-orchestrator";

import { XredEyeTrackingInterface } from "../js/EyeTrackingInterface";

const apidir = path.join(__dirname, "..", "PupilNeon");

const PupilNeonModule = XrpaPythonStandalone("PupilNeon", {
  codegenDir: apidir,
  condaEnvFile: path.join(apidir, "environment.yaml"),
  pythonEntryPoint: path.join(apidir, "main.py"),
}, () => {
  setProgramInterface(XredEyeTrackingInterface);

  useCoordinateSystem({
    up: CoordAxis.posZ,
    forward: CoordAxis.posY,
    right: CoordAxis.posX,
    spatialUnit: SpatialUnitType.centimeter,
    angularUnit: AngularUnitType.degree,
  });
});

if (require.main === module) {
  PupilNeonModule.smartExecute().catch((e) => {
    console.error(e);
    process.exit(1);
  }).then(() => {
    process.exit(0);
  });
}
