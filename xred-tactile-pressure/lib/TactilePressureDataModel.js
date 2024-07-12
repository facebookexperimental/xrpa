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
exports.XredTactilePressure = void 0;
const xrpa_orchestrator_1 = require("@xrpa/xrpa-orchestrator");
function TactilePressureDataModel(datamodel) {
    datamodel.setStoredCoordinateSystem(xrpa_orchestrator_1.UnityCoordinateSystem);
    const Pose = datamodel.addStruct("Pose", {
        position: xrpa_orchestrator_1.BuiltinType.Vector3,
        orientation: xrpa_orchestrator_1.BuiltinType.Quaternion,
    });
    const Point = datamodel.addStruct("Point", {
        position: xrpa_orchestrator_1.BuiltinType.Vector3,
        normal: xrpa_orchestrator_1.BuiltinType.UnitVector3,
    });
    const BoundingBox = datamodel.addStruct("BoundingBox", {
        mid: xrpa_orchestrator_1.BuiltinType.Vector3,
        dim: xrpa_orchestrator_1.BuiltinType.Distance3,
    });
    // caller-created
    datamodel.addCollection({
        name: "TactileDeviceConfig",
        maxCount: 20,
        fields: {
            filename: datamodel.addFixedString(512),
        },
    });
    // caller-created
    const TactileSurface = datamodel.addCollection({
        name: "TactileSurface",
        maxCount: 128,
        fields: {
            pose: Pose,
            dimensions: xrpa_orchestrator_1.BuiltinType.Distance3,
            // TODO height field data - array of floats? image file path?
            // TODO render method - enum?
        },
    });
    // module-created
    const TactileCluster = datamodel.addCollection({
        name: "TactileCluster",
        maxCount: 10,
        fields: {
            // constant:
            name: datamodel.addFixedString(64),
            skeleton: datamodel.addFixedString(64),
            subskeleton: datamodel.addFixedString(32),
            bone: datamodel.addFixedString(32),
            boneSpaceBounds: BoundingBox,
            // dynamic:
            touchingSurface: TactileSurface,
            // caller-specified:
            pose: Pose,
        },
    });
    // module-created
    datamodel.addCollection({
        name: "TactilePoint",
        maxCount: 1024,
        fields: {
            // constant:
            location: datamodel.addFixedString(16),
            cluster: TactileCluster,
            column: datamodel.CountField(),
            row: datamodel.CountField(),
            boneSpacePoint: Point,
            // dynamic:
            worldSpacePoint: Point,
            surfacePressure: datamodel.ScalarField(0, "The rendered pressure based on colliding surfaces"),
            // caller-specified:
            pressureOffset: datamodel.ScalarField(0, "Custom offset to apply to the surface pressure"),
        },
    });
}
exports.XredTactilePressure = {
    name: "TactilePressure",
    companyName: "Xred",
    setupDataStore(moduleDef, binding) {
        const datastore = moduleDef.addDataStore({
            dataset: this.name,
            datamodel: TactilePressureDataModel,
        });
        if ((0, xrpa_orchestrator_1.isModuleBindingConfig)(binding)) {
            datastore.addInputReconciler({
                type: "TactileDeviceConfig",
            });
            datastore.addInputReconciler({
                type: "TactileSurface",
            });
            datastore.addOutputReconciler({
                type: "TactileCluster",
                inboundFields: ["pose"],
            });
            datastore.addOutputReconciler({
                type: "TactilePoint",
                inboundFields: ["pressureOffset"],
            });
        }
        else if ((0, xrpa_orchestrator_1.isGameEngineBindingConfig)(binding)) {
            const poseToComponentTransform = {
                position: binding.intrinsicPositionProperty,
                orientation: binding.intrinsicRotationProperty,
            };
            datastore.addOutputReconciler({
                type: "TactileDeviceConfig",
                componentProps: {
                    basetype: binding.componentBaseClass,
                },
            });
            datastore.addOutputReconciler({
                type: "TactileSurface",
                componentProps: {
                    basetype: binding.componentBaseClass,
                    fieldToPropertyBindings: {
                        pose: poseToComponentTransform,
                    },
                },
            });
            datastore.addInputReconciler({
                type: "TactileCluster",
                outboundFields: ["pose"],
                indexes: [{
                        indexFieldName: "name",
                        boundClassName: "",
                    }],
                componentProps: {
                    basetype: binding.componentBaseClass,
                    fieldToPropertyBindings: {
                        pose: poseToComponentTransform,
                    },
                },
            });
            datastore.addInputReconciler({
                type: "TactilePoint",
                outboundFields: ["pressureOffset"],
                useGenericReconciledType: true,
                indexes: [{
                        indexFieldName: "cluster",
                    }],
            });
        }
        else if ((0, xrpa_orchestrator_1.isCallerBindingConfig)(binding)) {
            datastore.addOutputReconciler({
                type: "TactileDeviceConfig",
            });
            datastore.addOutputReconciler({
                type: "TactileSurface",
            });
            datastore.addInputReconciler({
                type: "TactileCluster",
                outboundFields: ["pose"],
                useGenericReconciledType: true,
                indexes: [{
                        indexFieldName: "name",
                    }],
            });
            datastore.addInputReconciler({
                type: "TactilePoint",
                outboundFields: ["pressureOffset"],
                useGenericReconciledType: true,
                indexes: [{
                        indexFieldName: "cluster",
                    }],
            });
        }
    }
};
//# sourceMappingURL=TactilePressureDataModel.js.map
