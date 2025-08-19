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
exports.ImageSelector = exports.XredImageSelectorInterface = void 0;
const xrpa_orchestrator_1 = require("@xrpa/xrpa-orchestrator");
const Shared_1 = require("./Shared");
const assert_1 = __importDefault(require("assert"));
const path_1 = __importDefault(require("path"));
exports.XredImageSelectorInterface = (0, xrpa_orchestrator_1.XrpaProgramInterface)("Xred.ImageSelector", path_1.default.join(__dirname, "../package.json"), () => {
    const { poseDynamicsMessage, rgbMessage, } = (0, Shared_1.getPerceptionTypes)();
    (0, xrpa_orchestrator_1.ProgramInput)("ImageSelector", (0, xrpa_orchestrator_1.Collection)({
        maxCount: 2,
        fields: {
            pickOneEveryNBasedOnMotion: (0, xrpa_orchestrator_1.Count)(1),
            rgbCamera: rgbMessage,
            poseDynamics: poseDynamicsMessage,
            rgbImage: (0, xrpa_orchestrator_1.Output)(rgbMessage),
        },
    }));
});
function ImageSelector(params) {
    const dataflowNode = (0, xrpa_orchestrator_1.Instantiate)([(0, xrpa_orchestrator_1.bindExternalProgram)(exports.XredImageSelectorInterface), "ImageSelector"], {});
    (0, assert_1.default)((0, xrpa_orchestrator_1.isDataflowForeignObjectInstantiation)(dataflowNode));
    dataflowNode.fieldValues.pickOneEveryNBasedOnMotion = params.pickOneEveryNBasedOnMotion;
    dataflowNode.fieldValues.rgbCamera = params.rgbCamera;
    dataflowNode.fieldValues.poseDynamics = params.poseDynamics;
    return (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "rgbImage");
}
exports.ImageSelector = ImageSelector;
//# sourceMappingURL=ImageSelectorInterface.js.map
