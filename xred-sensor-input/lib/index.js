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
exports.AriaGlasses = exports.XredSensorInputInterface = void 0;
const xred_perception_services_1 = require("@xrpa/xred-perception-services");
const xrpa_orchestrator_1 = require("@xrpa/xrpa-orchestrator");
const assert_1 = __importDefault(require("assert"));
exports.XredSensorInputInterface = (0, xrpa_orchestrator_1.XrpaProgramInterface)("Xred.SensorInput", () => {
    const { pose, poseDynamicsMessage, rgbMessage, slamMessage, } = (0, xred_perception_services_1.getPerceptionTypes)();
    const PoseTransform = (0, xrpa_orchestrator_1.ObjectTransform)({
        position: "position",
        rotation: "orientation",
    }, pose);
    (0, xrpa_orchestrator_1.ProgramInput)("AriaGlasses", (0, xrpa_orchestrator_1.Collection)({
        maxCount: 4,
        fields: {
            ipAddress: xrpa_orchestrator_1.String,
            isFlashlight: xrpa_orchestrator_1.Boolean,
            usbStreaming: xrpa_orchestrator_1.Boolean,
            trackPose: (0, xrpa_orchestrator_1.Boolean)(true),
            sendAudioOutput: (0, xrpa_orchestrator_1.Boolean)(true),
            sendRgbOutput: (0, xrpa_orchestrator_1.Boolean)(true),
            sendSlamOutputs: (0, xrpa_orchestrator_1.Boolean)(true),
            calibrationJson: (0, xrpa_orchestrator_1.Output)(xrpa_orchestrator_1.String),
            isStreaming: (0, xrpa_orchestrator_1.Output)(xrpa_orchestrator_1.Boolean),
            lastUpdate: (0, xrpa_orchestrator_1.Output)(xrpa_orchestrator_1.Timestamp),
            audio: (0, xrpa_orchestrator_1.Output)(xrpa_orchestrator_1.Signal),
            rgbCamera: (0, xrpa_orchestrator_1.Output)(rgbMessage),
            slamCamera1: (0, xrpa_orchestrator_1.Output)(slamMessage),
            slamCamera2: (0, xrpa_orchestrator_1.Output)(slamMessage),
            poseDynamics: (0, xrpa_orchestrator_1.Output)(poseDynamicsMessage),
            pose: (0, xrpa_orchestrator_1.Output)(PoseTransform),
            coordinateFrameId: (0, xrpa_orchestrator_1.Output)(xrpa_orchestrator_1.Count),
        },
    }));
});
function AriaGlasses(params) {
    const dataflowNode = (0, xrpa_orchestrator_1.Instantiate)([(0, xrpa_orchestrator_1.bindExternalProgram)(exports.XredSensorInputInterface), "AriaGlasses"], {});
    (0, assert_1.default)((0, xrpa_orchestrator_1.isDataflowForeignObjectInstantiation)(dataflowNode));
    dataflowNode.fieldValues = { ...params };
    return {
        calibrationJson: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "calibrationJson"),
        isStreaming: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "isStreaming"),
        lastUpdate: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "lastUpdate"),
        audio: { numChannels: 2, signal: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "audio") },
        rgbCamera: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "rgbCamera"),
        slamCamera1: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "slamCamera1"),
        slamCamera2: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "slamCamera2"),
        poseDynamics: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "poseDynamics"),
        pose: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "pose"),
        coordinateFrameId: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "coordinateFrameId"),
    };
}
exports.AriaGlasses = AriaGlasses;
//# sourceMappingURL=index.js.map
