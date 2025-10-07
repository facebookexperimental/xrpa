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
  Distance3,
  GameComponentBindingsDisabled,
  IfInput,
  IndexKey,
  Input,
  ObjectTransform,
  PrimaryKey,
  ProgramInput,
  ProgramOutput,
  Quaternion,
  ReferenceTo,
  Scalar,
  String,
  Struct,
  UnitVector3,
  UnityCoordinateSystem,
  Vector3,
  XrpaProgramInterface,
  useCoordinateSystem,
} from "@xrpa/xrpa-orchestrator";
import path from "path";

export const XredTactilePressureInterface = XrpaProgramInterface("Xred.TactilePressure", path.join(__dirname, "../package.json"), () => {
  useCoordinateSystem(UnityCoordinateSystem);

  const Pose = Struct("Pose", {
    position: Vector3,
    orientation: Quaternion,
  });

  const PoseTransform = ObjectTransform({
    position: "position",
    rotation: "orientation",
  }, Pose);

  const Point = Struct("Point", {
    position: Vector3,
    normal: UnitVector3,
  });

  const BoundingBox = Struct("BoundingBox", {
    mid: Vector3,
    dim: Distance3,
  });

  ProgramInput("TactileDeviceConfig", Collection({
    maxCount: 20,
    fields: {
      filename: String,
    },
  }));

  const TactileSurface = ProgramInput("TactileSurface", Collection({
    maxCount: 128,
    fields: {
      pose: PoseTransform,
      dimensions: Distance3,
      // TODO height field data - array of floats? image file path?
      // TODO render method - enum?
    },
  }));

  const TactileCluster = ProgramOutput("TactileCluster", Collection({
    maxCount: 10,
    fields: {
      // constant:
      name: PrimaryKey(IfInput, String),
      skeleton: String,
      subskeleton: String,
      bone: String,
      boneSpaceBounds: BoundingBox,

      // dynamic:
      touchingSurface: ReferenceTo(TactileSurface),

      // caller-specified:
      pose: Input(PoseTransform),
    },
  }));

  ProgramOutput("TactilePoint", GameComponentBindingsDisabled(Collection({
    maxCount: 1024,
    fields: {
      // constant:
      location: String,
      cluster: IndexKey(IfInput, ReferenceTo(TactileCluster)),
      column: Count,
      row: Count,
      boneSpacePoint: Point,

      // dynamic:
      worldSpacePoint: Point,
      surfacePressure: Scalar(0, "The rendered pressure based on colliding surfaces"),

      // caller-specified:
      pressureOffset: Input(Scalar(0, "Custom offset to apply to the surface pressure")),
    },
  })));
});
