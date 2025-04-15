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
exports.ObjectRecognition = exports.XredObjectRecognitionInterface = void 0;
const xrpa_orchestrator_1 = require("@xrpa/xrpa-orchestrator");
const Shared_1 = require("./Shared");
const assert_1 = __importDefault(require("assert"));
exports.XredObjectRecognitionInterface = (0, xrpa_orchestrator_1.XrpaProgramInterface)("Xred.ObjectRecognition", () => {
    const { rgbMessage, } = (0, Shared_1.getPerceptionTypes)();
    (0, xrpa_orchestrator_1.ProgramInput)("ObjectRecognition", (0, xrpa_orchestrator_1.Collection)({
        maxCount: 2,
        fields: {
            rgbImage: rgbMessage,
            objectDetction: (0, xrpa_orchestrator_1.Output)((0, xrpa_orchestrator_1.Message)("ObjectDetection", {
                objectClass: xrpa_orchestrator_1.String,
            })),
        },
    }));
});
function ObjectRecognition(params) {
    const dataflowNode = (0, xrpa_orchestrator_1.Instantiate)([(0, xrpa_orchestrator_1.bindExternalProgram)(exports.XredObjectRecognitionInterface), "ObjectRecognition"], {});
    (0, assert_1.default)((0, xrpa_orchestrator_1.isDataflowForeignObjectInstantiation)(dataflowNode));
    dataflowNode.fieldValues.rgbImage = params.rgbImage;
    return (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "objectDetction");
}
exports.ObjectRecognition = ObjectRecognition;
//# sourceMappingURL=ObjectRecognitionInterface.js.map
