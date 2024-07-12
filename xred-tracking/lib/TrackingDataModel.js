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
exports.XredTracking = void 0;
const xrpa_orchestrator_1 = require("@xrpa/xrpa-orchestrator");
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
exports.XredTracking = {
    name: "Tracking",
    companyName: "Xred",
    setupDataStore(moduleDef, binding) {
        const datastore = moduleDef.addDataStore({
            dataset: this.name,
            datamodel: TrackingDataModel,
        });
        if ((0, xrpa_orchestrator_1.isModuleBindingConfig)(binding)) {
            datastore.addOutputReconciler({
                type: "TrackedObject",
                inboundFields: ["ResetPose"],
            });
        }
        else if ((0, xrpa_orchestrator_1.isGameEngineBindingConfig)(binding)) {
            const poseFromComponentTransform = {
                position: binding.intrinsicPositionProperty,
                orientation: binding.intrinsicRotationProperty,
            };
            datastore.addInputReconciler({
                type: "TrackedObject",
                outboundFields: ["ResetPose"],
                indexes: [{
                        indexFieldName: "name",
                        boundClassName: "",
                    }],
                componentProps: {
                    basetype: binding.componentBaseClass,
                    fieldToPropertyBindings: {
                        pose: poseFromComponentTransform,
                    },
                },
            });
        }
        else if ((0, xrpa_orchestrator_1.isCallerBindingConfig)(binding)) {
            datastore.addInputReconciler({
                type: "TrackedObject",
                outboundFields: ["ResetPose"],
            });
        }
    }
};
//# sourceMappingURL=TrackingDataModel.js.map
