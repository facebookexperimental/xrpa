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

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.EigenTypeMap = void 0;
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
exports.EigenTypeMap = {
    Vector2: EigenVector2,
    UnitVector2: EigenVector2,
    Distance2: EigenVector2,
    Scale2: EigenVector2,
    Quaternion: EigenQuaternion,
    Vector3: EigenVector3,
    UnitVector3: EigenVector3,
    Distance3: EigenVector3,
    Scale3: EigenVector3,
};
//# sourceMappingURL=Eigen.js.map
