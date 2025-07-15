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
exports.XredVisualEmotionDetectionInterface = exports.EmotionType = void 0;
exports.getVisualEmotionDetectionTypes = getVisualEmotionDetectionTypes;
exports.VisualEmotionDetection = VisualEmotionDetection;
const xrpa_orchestrator_1 = require("@xrpa/xrpa-orchestrator");
const assert_1 = __importDefault(require("assert"));
var EmotionType;
(function (EmotionType) {
    EmotionType[EmotionType["Neutral"] = 0] = "Neutral";
    EmotionType[EmotionType["Happy"] = 1] = "Happy";
    EmotionType[EmotionType["Ecstatic"] = 2] = "Ecstatic";
    EmotionType[EmotionType["Surprised"] = 3] = "Surprised";
    EmotionType[EmotionType["Shocked"] = 4] = "Shocked";
    EmotionType[EmotionType["Horrified"] = 5] = "Horrified";
    EmotionType[EmotionType["Angry"] = 6] = "Angry";
    EmotionType[EmotionType["Sad"] = 7] = "Sad";
})(EmotionType || (exports.EmotionType = EmotionType = {}));
function getVisualEmotionDetectionTypes(width = 1920, height = 1080, bytesPerPixel = 4) {
    const emotionImage = (0, xrpa_orchestrator_1.Image)("EmotionImage", {
        expectedWidth: width,
        expectedHeight: height,
        expectedBytesPerPixel: bytesPerPixel,
    });
    return {
        emotionImage,
    };
}
function createVisualEmotionDetectionInterface(width = 1920, height = 1080, bytesPerPixel = 4) {
    return (0, xrpa_orchestrator_1.XrpaProgramInterface)("Xred.VisualEmotionDetection", () => {
        const EmotionTypeEnum = (0, xrpa_orchestrator_1.Enum)("EmotionType", [
            "Neutral",
            "Happy",
            "Ecstatic",
            "Surprised",
            "Shocked",
            "Horrified",
            "Angry",
            "Sad"
        ]);
        const { emotionImage } = getVisualEmotionDetectionTypes(width, height, bytesPerPixel);
        (0, xrpa_orchestrator_1.ProgramInput)("VisualEmotionDetection", (0, xrpa_orchestrator_1.Collection)({
            maxCount: 1,
            fields: {
                imageInput: (0, xrpa_orchestrator_1.Message)("ImageInput", {
                    image: emotionImage,
                }),
                apiKey: xrpa_orchestrator_1.String,
                emotionResult: (0, xrpa_orchestrator_1.Output)((0, xrpa_orchestrator_1.Message)("EmotionResult", {
                    timestamp: xrpa_orchestrator_1.HiResTimestamp,
                    emotion: EmotionTypeEnum,
                    faceDetected: xrpa_orchestrator_1.Boolean,
                    confidence: xrpa_orchestrator_1.Scalar,
                })),
            },
        }));
    });
}
exports.XredVisualEmotionDetectionInterface = createVisualEmotionDetectionInterface();
function VisualEmotionDetection(params) {
    const dataflowNode = (0, xrpa_orchestrator_1.Instantiate)([(0, xrpa_orchestrator_1.bindExternalProgram)(exports.XredVisualEmotionDetectionInterface), "VisualEmotionDetection"], {});
    (0, assert_1.default)((0, xrpa_orchestrator_1.isDataflowForeignObjectInstantiation)(dataflowNode));
    dataflowNode.fieldValues.imageInput = params.imageInput;
    dataflowNode.fieldValues.apiKey = params.apiKey;
    return {
        emotionResult: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "emotionResult"),
    };
}
//# sourceMappingURL=VisualEmotionDetectionInterface.js.map
