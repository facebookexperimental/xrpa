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
  Boolean,
  Collection,
  Count,
  Distance,
  Distance3,
  FixedArray,
  Output,
  ProgramInput,
  ProgramOutput,
  Quaternion,
  ReferenceTo,
  String,
  Struct,
  Timestamp,
  UnitVector3,
  UnityCoordinateSystem,
  useCoordinateSystem,
  Vector3,
  XrpaProgramInterface,
} from "@xrpa/xrpa-orchestrator";

import path from "path";

export const XredLiveStackInterface = XrpaProgramInterface("Xred.LiveStack", path.join(__dirname, "../package.json"), () => {
  useCoordinateSystem(UnityCoordinateSystem);

  const Pose = Struct("Pose", {
    position: Vector3,
    orientation: Quaternion,
  });

  const LiveStackInstance = ProgramInput("LiveStackInstance", Collection({
    maxCount: 4,
    fields: {
      ipAddress: String,
      port: Count(5047),
      subscribeToObjects: Boolean(true),
      subscribeToRooms: Boolean(true),
      subscribeToDoors: Boolean(true),
      subscribeToHands: Boolean(true),
      subscribeToEyeGaze: Boolean(true),
      subscribeToBodyPoses: Boolean(true),
      subscribeToAnchors: Boolean(true),

      // outputs
      connectionStatus: Output(String),
      lastHeartbeat: Output(Timestamp),
      serverVersion: Output(String),
    },
  }));

  const LiveStackAnchor = ProgramOutput("LiveStackAnchor", Collection({
    maxCount: 1024,
    fields: {
      liveStackInstance: ReferenceTo(LiveStackInstance),
      islandId: String,
      poseInIsland: Pose,
      gravityDirection: UnitVector3,
      lastUpdateTimestamp: Timestamp,
    },
  }));

  const LiveStackRoom = ProgramOutput("LiveStackRoom", Collection({
    maxCount: 256,
    fields: {
      liveStackInstance: ReferenceTo(LiveStackInstance),
      liveStackRoomId: String,
      floorId: String,
      anchor: ReferenceTo(LiveStackAnchor),
      pose: Pose,
      floorHeight: Distance,
      ceilingHeight: Distance,
      polygonVertices: FixedArray(Vector3, 64),
      lastUpdateTimestamp: Timestamp,
    },
  }));

  ProgramOutput("LiveStackObject", Collection({
    maxCount: 2048,
    fields: {
      liveStackInstance: ReferenceTo(LiveStackInstance),
      liveStackUuid: String,
      label: String,
      category: Count,
      pose: Pose,
      size: Distance3,
      anchor: ReferenceTo(LiveStackAnchor),
      room: ReferenceTo(LiveStackRoom),
      numInlierPoints: Count,
      lastUpdateTimestamp: Timestamp,
    },
  }));

  ProgramOutput("LiveStackDoor", Collection({
    maxCount: 256,
    fields: {
      liveStackInstance: ReferenceTo(LiveStackInstance),
      liveStackDoorId: String,
      frontRoom: ReferenceTo(LiveStackRoom),
      backRoom: ReferenceTo(LiveStackRoom),
      anchor: ReferenceTo(LiveStackAnchor),
      pose: Pose,
      width: Distance,
      height: Distance,
      lastUpdateTimestamp: Timestamp,
    },
  }));

  ProgramOutput("LiveStackBodyPose", Collection({
    maxCount: 64,
    fields: {
      liveStackInstance: ReferenceTo(LiveStackInstance),
      liveStackPersonId: Count,
      liveStackHumanUuid: String,
      anchor: ReferenceTo(LiveStackAnchor),
      rootPose: Pose,
      jointPoses: FixedArray(Pose, 24),
      lastUpdateTimestamp: Timestamp,
    },
  }));

  ProgramOutput("LiveStackHands", Collection({
    maxCount: 4,
    fields: {
      liveStackInstance: ReferenceTo(LiveStackInstance),
      anchor: ReferenceTo(LiveStackAnchor),
      isLeftHandTracked: Boolean,
      isRightHandTracked: Boolean,
      leftHandLandmarks: FixedArray(Vector3, 21),
      rightHandLandmarks: FixedArray(Vector3, 21),
      lastUpdateTimestamp: Timestamp,
    },
  }));

  ProgramOutput("LiveStackEyeGaze", Collection({
    maxCount: 4,
    fields: {
      liveStackInstance: ReferenceTo(LiveStackInstance),
      anchor: ReferenceTo(LiveStackAnchor),
      gazeOrigin: Vector3,
      gazeDirection: UnitVector3,
      lastUpdateTimestamp: Timestamp,
    },
  }));
});
