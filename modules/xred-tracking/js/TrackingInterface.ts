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
  Collection,
  IfGameEngine,
  Input,
  Message,
  ObjectTransform,
  PrimaryKey,
  ProgramOutput,
  Quaternion,
  String,
  Struct,
  Timestamp,
  UnityCoordinateSystem,
  Vector3,
  XrpaProgramInterface,
  useCoordinateSystem,
} from "@xrpa/xrpa-orchestrator";
import path from "path";

export const XredTrackingInterface = XrpaProgramInterface("Xred.Tracking", path.join(__dirname, "../package.json"), () => {
  useCoordinateSystem(UnityCoordinateSystem);

  const Pose = Struct("Pose", {
    position: Vector3,
    orientation: Quaternion,
  });

  const PoseTransform = ObjectTransform({
    position: "position",
    rotation: "orientation",
  }, Pose);

  ProgramOutput("TrackedObject", Collection({
    maxCount: 128,
    fields: {
      name: PrimaryKey(IfGameEngine, String),
      pose: PoseTransform,
      rootPose: Pose,
      absolutePose: Pose,
      lastUpdate: Timestamp,

      // sets the rootPose to the absolutePose, so the relative pose is now identity
      ResetPose: Input(Message("ResetPose")),
    },
  }));
});
