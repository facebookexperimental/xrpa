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
  Count,
  Image,
  Input,
  Message,
  ObjectTransform,
  PrimaryKey,
  ProgramInput,
  ProgramOutput,
  Quaternion,
  ReferenceTo,
  Signal,
  String,
  Struct,
  UnityCoordinateSystem,
  Vector3,
  XrpaProgramInterface,
  useCoordinateSystem,
} from "../index";

export const XredTrackingInterface = XrpaProgramInterface("Xred.Tracking", "", () => {
  useCoordinateSystem(UnityCoordinateSystem);

  const Pose = Struct("Pose", {
    position: Vector3,
    orientation: Quaternion,
  });

  const TrackedObject = ProgramOutput("TrackedObject", Collection({
    maxCount: 128,
    fields: {
      name: PrimaryKey(String),

      pose: ObjectTransform({
        position: "position",
        rotation: "orientation",
      }, Pose),

      someSetting: Input(Count(5)),

      ResetPose: Input(Message()),

      TrackingLost: Message({
        bar: Vector3,
      }),

      micAudio: Signal,
      lastSeenImage: Image({ expectedWidth: 640, expectedHeight: 480, expectedBytesPerPixel: 3 }),
    },
  }));

  ProgramInput("ObjectRef", Collection({
    maxCount: 128,
    fields: {
      ref: ReferenceTo(TrackedObject),
    },
  }));
});
