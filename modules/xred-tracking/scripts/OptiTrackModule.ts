/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 */

import path from "path";
import {
  CppStandalone,
  OvrCoordinateSystem,
  XrpaNativeCppProgram,
  setProgramInterface,
  useBuck,
  useCoordinateSystem,
  useEigenTypes,
} from "@xrpa/xrpa-orchestrator";

import { XredTrackingInterface } from "../js/TrackingInterface";

const apidir = path.join(__dirname, "..", "OptiTrack", "api");

export const OptiTrackModule = XrpaNativeCppProgram("OptiTrack", apidir, () => {
  useBuck({
    target: "//arvr/libraries/xred/xrpa/modules/xred-tracking/OptiTrack:OptiTrack",
    oncall: "xred_swes",
    modes: {
      windows: {
        debug: "@arvr/mode/win/debug",
        release: "@arvr/mode/win/release",
      },
    },
  });

  useCoordinateSystem(OvrCoordinateSystem);
  useEigenTypes();

  setProgramInterface(XredTrackingInterface);
});

export const OptiTrackStandalone = new CppStandalone(OptiTrackModule, path.join(apidir, "standalone"), path.join(apidir, "manifest.gen.json"));
