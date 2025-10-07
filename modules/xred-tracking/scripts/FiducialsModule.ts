/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 */

import path from "path";
import {
  Boolean,
  CppStandalone,
  Float3,
  OvrCoordinateSystem,
  Scalar,
  XrpaNativeCppProgram,
  addSetting,
  setProgramInterface,
  useBuck,
  useCoordinateSystem,
  useEigenTypes,
} from "@xrpa/xrpa-orchestrator";

import { XredTrackingInterface } from "../js/TrackingInterface";

const apidir = path.join(__dirname, "..", "Fiducials", "api");

export const FiducialsModule = XrpaNativeCppProgram("Fiducials", apidir, () => {
  useBuck({
    target: "//arvr/libraries/xred/xrpa/modules/xred-tracking/Fiducials:Fiducials",
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

  addSetting("codeSizeCm", Scalar(19, "Size of the fiducial code in centimeters, including the white border"));
  addSetting("showDebugWindow", Boolean(false, "Set to 1 to show the video feed in a separate window"));
  addSetting("cameraTranslation", Float3([0.0, 7.6, -2.3], "The translation offset of the camera from the HMD origin, in centimeters, x-right, y-up, z-forward"));
  addSetting("cameraRotationYPR", Float3([0, -15, 0], "The rotation offset of the camera from the HMD coordinate frame, in degrees, using Euler angles YPR"));
});

export const FiducialsStandalone = new CppStandalone(FiducialsModule, path.join(apidir, "standalone"), path.join(apidir, "manifest.gen.json"));

FiducialsStandalone.addResourceFile(path.join(__dirname, "..", "Fiducials", "cameracalibration.occ"));
