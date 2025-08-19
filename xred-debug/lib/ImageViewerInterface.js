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
exports.ImageWindow = exports.XredImageViewerInterface = void 0;
const xrpa_orchestrator_1 = require("@xrpa/xrpa-orchestrator");
const assert_1 = __importDefault(require("assert"));
const path_1 = __importDefault(require("path"));
exports.XredImageViewerInterface = (0, xrpa_orchestrator_1.XrpaProgramInterface)("Xred.ImageViewer", path_1.default.join(__dirname, "../package.json"), () => {
    (0, xrpa_orchestrator_1.ProgramInput)("ImageWindow", (0, xrpa_orchestrator_1.Collection)({
        maxCount: 10,
        fields: {
            name: xrpa_orchestrator_1.String,
            image: (0, xrpa_orchestrator_1.MessageRate)(10, (0, xrpa_orchestrator_1.Message)({
                image: (0, xrpa_orchestrator_1.Image)("InputImage", {
                    expectedWidth: 1600,
                    expectedHeight: 1600,
                    expectedBytesPerPixel: 3,
                }),
            })),
        },
    }));
});
function ImageWindow(params) {
    const dataflowNode = (0, xrpa_orchestrator_1.Instantiate)([(0, xrpa_orchestrator_1.bindExternalProgram)(exports.XredImageViewerInterface), "ImageWindow"], {});
    (0, assert_1.default)((0, xrpa_orchestrator_1.isDataflowForeignObjectInstantiation)(dataflowNode));
    dataflowNode.fieldValues.name = params.windowTitle;
    dataflowNode.fieldValues.image = params.image;
}
exports.ImageWindow = ImageWindow;
//# sourceMappingURL=ImageViewerInterface.js.map
