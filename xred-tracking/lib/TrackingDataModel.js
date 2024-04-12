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
exports.TrackingDataModel = void 0;
const xrpa_orchestrator_1 = require("xrpa-orchestrator");
function TrackingDataModel(datamodel) {
    datamodel.setStoredCoordinateSystem(xrpa_orchestrator_1.UnityCoordinateSystem);
    const Pose = datamodel.addStruct("Pose", {
        position: xrpa_orchestrator_1.BuiltinType.Vector3,
        orientation: xrpa_orchestrator_1.BuiltinType.Quaternion,
    });
    datamodel.addCollection({
        name: "TrackedObject",
        maxCount: 128,
        fields: {
            name: datamodel.addFixedString(64),
            pose: Pose,
            rootPose: Pose,
            absolutePose: Pose,
            lastUpdate: xrpa_orchestrator_1.BuiltinType.Timestamp,
            // sets the rootPose to the absolutePose, so the relative pose is now identity
            ResetPose: datamodel.addMessageStruct("ResetPose", {}),
        },
    });
}
exports.TrackingDataModel = TrackingDataModel;
//# sourceMappingURL=TrackingDataModel.js.map
