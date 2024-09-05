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
exports.useEigenTypes = void 0;
const ConvenienceWrappers_1 = require("./ConvenienceWrappers");
const Coordinates_1 = require("./Coordinates");
const RuntimeEnvironment_1 = require("./RuntimeEnvironment");
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
function useEigenTypes() {
    (0, ConvenienceWrappers_1.addBuckDependency)("//arvr/third-party/eigen:eigen3");
    (0, RuntimeEnvironment_1.mapType)(Coordinates_1.Vector2, EigenVector2);
    (0, RuntimeEnvironment_1.mapType)(Coordinates_1.UnitVector2, EigenVector2);
    (0, RuntimeEnvironment_1.mapType)(Coordinates_1.Distance2, EigenVector2);
    (0, RuntimeEnvironment_1.mapType)(Coordinates_1.Scale2, EigenVector2);
    (0, RuntimeEnvironment_1.mapType)(Coordinates_1.Quaternion, EigenQuaternion);
    (0, RuntimeEnvironment_1.mapType)(Coordinates_1.Vector3, EigenVector3);
    (0, RuntimeEnvironment_1.mapType)(Coordinates_1.UnitVector3, EigenVector3);
    (0, RuntimeEnvironment_1.mapType)(Coordinates_1.Distance3, EigenVector3);
    (0, RuntimeEnvironment_1.mapType)(Coordinates_1.Scale3, EigenVector3);
}
exports.useEigenTypes = useEigenTypes;
//# sourceMappingURL=Eigen.js.map
