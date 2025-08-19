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

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XredTactilePressureInterface = void 0;
const xrpa_orchestrator_1 = require("@xrpa/xrpa-orchestrator");
const path_1 = __importDefault(require("path"));
exports.XredTactilePressureInterface = (0, xrpa_orchestrator_1.XrpaProgramInterface)("Xred.TactilePressure", path_1.default.join(__dirname, "../package.json"), () => {
    (0, xrpa_orchestrator_1.useCoordinateSystem)(xrpa_orchestrator_1.UnityCoordinateSystem);
    const Pose = (0, xrpa_orchestrator_1.Struct)("Pose", {
        position: xrpa_orchestrator_1.Vector3,
        orientation: xrpa_orchestrator_1.Quaternion,
    });
    const PoseTransform = (0, xrpa_orchestrator_1.ObjectTransform)({
        position: "position",
        rotation: "orientation",
    }, Pose);
    const Point = (0, xrpa_orchestrator_1.Struct)("Point", {
        position: xrpa_orchestrator_1.Vector3,
        normal: xrpa_orchestrator_1.UnitVector3,
    });
    const BoundingBox = (0, xrpa_orchestrator_1.Struct)("BoundingBox", {
        mid: xrpa_orchestrator_1.Vector3,
        dim: xrpa_orchestrator_1.Distance3,
    });
    (0, xrpa_orchestrator_1.ProgramInput)("TactileDeviceConfig", (0, xrpa_orchestrator_1.Collection)({
        maxCount: 20,
        fields: {
            filename: xrpa_orchestrator_1.String,
        },
    }));
    const TactileSurface = (0, xrpa_orchestrator_1.ProgramInput)("TactileSurface", (0, xrpa_orchestrator_1.Collection)({
        maxCount: 128,
        fields: {
            pose: PoseTransform,
            dimensions: xrpa_orchestrator_1.Distance3,
            // TODO height field data - array of floats? image file path?
            // TODO render method - enum?
        },
    }));
    const TactileCluster = (0, xrpa_orchestrator_1.ProgramOutput)("TactileCluster", (0, xrpa_orchestrator_1.Collection)({
        maxCount: 10,
        fields: {
            // constant:
            name: (0, xrpa_orchestrator_1.PrimaryKey)(xrpa_orchestrator_1.IfInput, xrpa_orchestrator_1.String),
            skeleton: xrpa_orchestrator_1.String,
            subskeleton: xrpa_orchestrator_1.String,
            bone: xrpa_orchestrator_1.String,
            boneSpaceBounds: BoundingBox,
            // dynamic:
            touchingSurface: (0, xrpa_orchestrator_1.ReferenceTo)(TactileSurface),
            // caller-specified:
            pose: (0, xrpa_orchestrator_1.Input)(PoseTransform),
        },
    }));
    (0, xrpa_orchestrator_1.ProgramOutput)("TactilePoint", (0, xrpa_orchestrator_1.GameComponentBindingsDisabled)((0, xrpa_orchestrator_1.Collection)({
        maxCount: 1024,
        fields: {
            // constant:
            location: xrpa_orchestrator_1.String,
            cluster: (0, xrpa_orchestrator_1.IndexKey)(xrpa_orchestrator_1.IfInput, (0, xrpa_orchestrator_1.ReferenceTo)(TactileCluster)),
            column: xrpa_orchestrator_1.Count,
            row: xrpa_orchestrator_1.Count,
            boneSpacePoint: Point,
            // dynamic:
            worldSpacePoint: Point,
            surfacePressure: (0, xrpa_orchestrator_1.Scalar)(0, "The rendered pressure based on colliding surfaces"),
            // caller-specified:
            pressureOffset: (0, xrpa_orchestrator_1.Input)((0, xrpa_orchestrator_1.Scalar)(0, "Custom offset to apply to the surface pressure")),
        },
    })));
});
//# sourceMappingURL=TactilePressureInterface.js.map
