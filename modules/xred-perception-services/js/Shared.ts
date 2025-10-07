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
  Count,
  HiResTimestamp,
  Image,
  Message,
  MessageRate,
  Quaternion,
  Struct,
  UnitVector3,
  Vector3,
} from "@xrpa/xrpa-orchestrator";

export function getPerceptionTypes() {
  const slamImage = Image("SlamImage", {
    expectedWidth: 480,
    expectedHeight: 640,
    expectedBytesPerPixel: 0.5, // jpeg compression
  });

  const rgbImage = Image("RgbImage", {
    expectedWidth: 1408,
    expectedHeight: 1408,
    expectedBytesPerPixel: 1.5, // jpeg compression
  });

  const pose = Struct("Pose", {
    position: Vector3,
    orientation: Quaternion,
  });

  const poseDynamics = Struct("PoseDynamics", {
    timestamp: HiResTimestamp,
    localFrameId: Count,
    localFromDeviceRotation: Quaternion,
    localFromDeviceTranslation: Vector3,
    localLinearVelocity: Vector3,
    deviceRotationalVelocity: Vector3,
    localGravityDirection: UnitVector3,
  });

  return {
    slamImage,
    rgbImage,
    pose,
    poseDynamics,

    slamMessage: MessageRate(30, Message({
      image: slamImage,
    })),

    rgbMessage: MessageRate(10, Message({
      image: rgbImage,
    })),

    poseDynamicsMessage: MessageRate(200, Message({
      data: poseDynamics,
    })),
  };
}
