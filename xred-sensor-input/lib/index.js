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
const xrpa_orchestrator_1 = require("@xrpa/xrpa-orchestrator");
const assert_1 = __importDefault(require("assert"));
exports.XredSensorInputInterface = (0, xrpa_orchestrator_1.XrpaProgramInterface)("Xred.SensorInput", () => {
    const slamImage = (0, xrpa_orchestrator_1.Image)("SlamImage", {
        expectedWidth: 480,
        expectedHeight: 640,
        expectedBytesPerPixel: 0.5, // jpeg compression
    });
    const rgbImage = (0, xrpa_orchestrator_1.Image)("RgbImage", {
        expectedWidth: 1408,
        expectedHeight: 1408,
        expectedBytesPerPixel: 1.5, // jpeg compression
    });
    (0, xrpa_orchestrator_1.ProgramInput)("AriaGlasses", (0, xrpa_orchestrator_1.GenericImpl)(xrpa_orchestrator_1.IfOutput, (0, xrpa_orchestrator_1.Collection)({
        maxCount: 4,
        fields: {
            name: xrpa_orchestrator_1.String,
            ipAddress: xrpa_orchestrator_1.String,
            isStreaming: (0, xrpa_orchestrator_1.Output)(xrpa_orchestrator_1.Boolean),
            lastUpdate: (0, xrpa_orchestrator_1.Output)(xrpa_orchestrator_1.Timestamp),
            audio: (0, xrpa_orchestrator_1.Output)(xrpa_orchestrator_1.Signal),
            rgbCamera: (0, xrpa_orchestrator_1.Output)((0, xrpa_orchestrator_1.MessageRate)(10, (0, xrpa_orchestrator_1.Message)({
                image: rgbImage,
            }))),
            slamCamera1: (0, xrpa_orchestrator_1.Output)((0, xrpa_orchestrator_1.MessageRate)(10, (0, xrpa_orchestrator_1.Message)({
                image: slamImage,
            }))),
            slamCamera2: (0, xrpa_orchestrator_1.Output)((0, xrpa_orchestrator_1.MessageRate)(10, (0, xrpa_orchestrator_1.Message)({
                image: slamImage,
            }))),
        },
    })));
});
function AriaGlasses(ipAddress) {
    const dataflowNode = (0, xrpa_orchestrator_1.Instantiate)([(0, xrpa_orchestrator_1.bindExternalProgram)(exports.XredSensorInputInterface), "AriaGlasses"], {});
    (0, assert_1.default)((0, xrpa_orchestrator_1.isDataflowForeignObjectInstantiation)(dataflowNode));
    dataflowNode.fieldValues.name = "AriaGlasses";
    dataflowNode.fieldValues.ipAddress = ipAddress;
    return {
        audio: { numChannels: 2, signal: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "audio") },
        rgbCamera: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "rgbCamera"),
        slamCamera1: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "slamCamera1"),
        slamCamera2: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "slamCamera2"),
    };
}
exports.AriaGlasses = AriaGlasses;
//# sourceMappingURL=index.js.map
