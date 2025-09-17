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
exports.XredOpticalCharacterRecognitionInterface = exports.DEFAULT_OCR_MAX_COUNT = void 0;
exports.getOpticalCharacterRecognitionTypes = getOpticalCharacterRecognitionTypes;
exports.OpticalCharacterRecognition = OpticalCharacterRecognition;
const xrpa_orchestrator_1 = require("@xrpa/xrpa-orchestrator");
const assert_1 = __importDefault(require("assert"));
const path_1 = __importDefault(require("path"));
exports.DEFAULT_OCR_MAX_COUNT = 4;
function getOpticalCharacterRecognitionTypes(width = 384, height = 384, bytesPerPixel = 3) {
    const ocrImage = (0, xrpa_orchestrator_1.Image)("OcrImage", {
        expectedWidth: width,
        expectedHeight: height,
        expectedBytesPerPixel: bytesPerPixel,
    });
    return {
        ocrImage,
    };
}
function createOpticalCharacterRecognitionInterface(width = 384, height = 384, bytesPerPixel = 3) {
    return (0, xrpa_orchestrator_1.XrpaProgramInterface)("Xred.OpticalCharacterRecognition", path_1.default.join(__dirname, "../package.json"), () => {
        const { ocrImage } = getOpticalCharacterRecognitionTypes(width, height, bytesPerPixel);
        const OcrResult = (0, xrpa_orchestrator_1.Message)("OcrResult", {
            text: (0, xrpa_orchestrator_1.String)("", "Transcribed text from the image"),
            timestamp: (0, xrpa_orchestrator_1.HiResTimestamp)("Timestamp of when input image was captured"),
            success: (0, xrpa_orchestrator_1.Boolean)(false, "Whether OCR processing completed successfully"),
            errorMessage: (0, xrpa_orchestrator_1.String)("", "Error message if OCR processing failed"),
        });
        (0, xrpa_orchestrator_1.ProgramInput)("OpticalCharacterRecognition", (0, xrpa_orchestrator_1.Collection)({
            maxCount: exports.DEFAULT_OCR_MAX_COUNT,
            fields: {
                imageInput: (0, xrpa_orchestrator_1.Message)("ImageInput", {
                    image: ocrImage,
                }),
                triggerId: (0, xrpa_orchestrator_1.Count)(0, "Increment this value to trigger OCR processing"),
                immediateMode: (0, xrpa_orchestrator_1.Boolean)(false, "Whether to use immediate mode (true) or triggered mode (false)"),
                ocrResult: (0, xrpa_orchestrator_1.Output)(OcrResult),
            },
        }));
    });
}
exports.XredOpticalCharacterRecognitionInterface = createOpticalCharacterRecognitionInterface();
function OpticalCharacterRecognition(params) {
    const dataflowNode = (0, xrpa_orchestrator_1.Instantiate)([(0, xrpa_orchestrator_1.bindExternalProgram)(exports.XredOpticalCharacterRecognitionInterface), "OpticalCharacterRecognition"], {});
    (0, assert_1.default)((0, xrpa_orchestrator_1.isDataflowForeignObjectInstantiation)(dataflowNode));
    dataflowNode.fieldValues.imageInput = params.imageInput;
    if (params.triggerId) {
        dataflowNode.fieldValues.triggerId = params.triggerId;
    }
    dataflowNode.fieldValues.immediateMode = params.immediateMode;
    return {
        ocrResult: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "ocrResult"),
    };
}
//# sourceMappingURL=OpticalCharacterRecognitionInterface.js.map
