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


import { addBuckDependency } from "./ConvenienceWrappers";
import {
  Distance2,
  Distance3,
  Quaternion,
  Scale2,
  Scale3,
  UnitVector2,
  UnitVector3,
  Vector2,
  Vector3,
} from "./Coordinates";
import { mapType } from "./RuntimeEnvironment";

const EigenVector2 = {
  typename: "Eigen::Vector2f",
  headerFile: "<Eigen/Eigen>",
  fieldMap: {
    "x()": "x",
    "y()": "y",
  },
};

const EigenVector3 = {
  typename: "Eigen::Vector3f",
  headerFile: "<Eigen/Eigen>",
  fieldMap: {
    "x()": "x",
    "y()": "y",
    "z()": "z",
  },
};

const EigenQuaternion = {
  typename: "Eigen::Quaternionf",
  headerFile: "<Eigen/Eigen>",
  fieldMap: {
    "w()": "w",
    "x()": "x",
    "y()": "y",
    "z()": "z",
  },
};

export function useEigenTypes() {
  addBuckDependency("//arvr/third-party/eigen:eigen3");

  mapType(Vector2, EigenVector2);
  mapType(UnitVector2, EigenVector2);
  mapType(Distance2, EigenVector2);
  mapType(Scale2, EigenVector2);
  mapType(Quaternion, EigenQuaternion);
  mapType(Vector3, EigenVector3);
  mapType(UnitVector3, EigenVector3);
  mapType(Distance3, EigenVector3);
  mapType(Scale3, EigenVector3);
}
