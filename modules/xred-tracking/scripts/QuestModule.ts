/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 */

import path from "path";
import {
  CppStandalone,
  OvrCoordinateSystem,
  Quaternion,
  Vector3,
  XrpaNativeCppProgram,
  addBuckDependency,
  mapType,
  setProgramInterface,
  useBuck,
  useCoordinateSystem,
} from "@xrpa/xrpa-orchestrator";

import { XredTrackingInterface } from "../js/TrackingInterface";

const apidir = path.join(__dirname, "..", "Quest", "api");

export const QuestModule = XrpaNativeCppProgram("Quest", apidir, () => {
  useBuck({
    target: "//arvr/libraries/xred/xrpa/modules/xred-tracking/Quest:Quest",
    oncall: "xred_swes",
    modes: {
      windows: {
        debug: "@arvr/mode/win/debug",
        release: "@arvr/mode/win/release",
      }
    }
  });

  useCoordinateSystem(OvrCoordinateSystem);

  addBuckDependency("//arvr/projects/pcsdk/LibOVR:LibOVR");
  mapType(Quaternion, {
    typename: "ovrQuatf",
    headerFile: "<OVR_CAPI.h>",
  });
  mapType(Vector3, {
    typename: "ovrVector3f",
    headerFile: "<OVR_CAPI.h>",
  });

  setProgramInterface(XredTrackingInterface);
});

export const QuestStandalone = new CppStandalone(QuestModule, path.join(apidir, "standalone"), path.join(apidir, "manifest.gen.json"));
