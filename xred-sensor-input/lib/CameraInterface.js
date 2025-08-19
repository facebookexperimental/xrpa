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
exports.CameraFeed = exports.XredCameraInterface = void 0;
const xred_perception_services_1 = require("@xrpa/xred-perception-services");
const xrpa_orchestrator_1 = require("@xrpa/xrpa-orchestrator");
const assert_1 = __importDefault(require("assert"));
const path_1 = __importDefault(require("path"));
exports.XredCameraInterface = (0, xrpa_orchestrator_1.XrpaProgramInterface)("Xred.Camera", path_1.default.join(__dirname, "../package.json"), () => {
    const { rgbMessage, } = (0, xred_perception_services_1.getPerceptionTypes)();
    (0, xrpa_orchestrator_1.ProgramOutput)("CameraDevice", (0, xrpa_orchestrator_1.Collection)({
        maxCount: 4,
        fields: {
            name: xrpa_orchestrator_1.String,
        },
    }));
    (0, xrpa_orchestrator_1.ProgramInput)("CameraFeed", (0, xrpa_orchestrator_1.Collection)({
        maxCount: 4,
        fields: {
            cameraName: (0, xrpa_orchestrator_1.String)("", "pseudo-regex, with just $ and ^ supported for now"),
            cameraImage: (0, xrpa_orchestrator_1.Output)(rgbMessage),
        },
    }));
});
function CameraFeed(params) {
    const dataflowNode = (0, xrpa_orchestrator_1.Instantiate)([(0, xrpa_orchestrator_1.bindExternalProgram)(exports.XredCameraInterface), "CameraFeed"], {});
    (0, assert_1.default)((0, xrpa_orchestrator_1.isDataflowForeignObjectInstantiation)(dataflowNode));
    dataflowNode.fieldValues = {
        cameraName: params.cameraName ?? "",
    };
    return {
        cameraImage: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "cameraImage"),
    };
}
exports.CameraFeed = CameraFeed;
//# sourceMappingURL=CameraInterface.js.map
