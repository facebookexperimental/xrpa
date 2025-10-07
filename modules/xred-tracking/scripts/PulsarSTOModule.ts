/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
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
