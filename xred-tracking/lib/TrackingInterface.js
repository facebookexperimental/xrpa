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
exports.XredTrackingInterface = void 0;
const xrpa_orchestrator_1 = require("@xrpa/xrpa-orchestrator");
exports.XredTrackingInterface = (0, xrpa_orchestrator_1.XrpaProgramInterface)("Xred.Tracking", () => {
    (0, xrpa_orchestrator_1.useCoordinateSystem)(xrpa_orchestrator_1.UnityCoordinateSystem);
    const Pose = (0, xrpa_orchestrator_1.Struct)("Pose", {
        position: xrpa_orchestrator_1.Vector3,
        orientation: xrpa_orchestrator_1.Quaternion,
    });
    const PoseTransform = (0, xrpa_orchestrator_1.ObjectTransform)({
        position: "position",
        rotation: "orientation",
    }, Pose);
    (0, xrpa_orchestrator_1.ProgramOutput)("TrackedObject", (0, xrpa_orchestrator_1.Collection)({
        maxCount: 128,
        fields: {
            name: (0, xrpa_orchestrator_1.PrimaryKey)(xrpa_orchestrator_1.IfGameEngine, xrpa_orchestrator_1.String),
            pose: PoseTransform,
            rootPose: Pose,
            absolutePose: Pose,
            lastUpdate: xrpa_orchestrator_1.Timestamp,
            // sets the rootPose to the absolutePose, so the relative pose is now identity
            ResetPose: (0, xrpa_orchestrator_1.Input)((0, xrpa_orchestrator_1.Message)("ResetPose")),
        },
    }));
});
//# sourceMappingURL=TrackingInterface.js.map
