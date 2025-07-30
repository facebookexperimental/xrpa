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
exports.XredTextToSpeechInterface = exports.DEFAULT_TTS_REQUEST_MAX_COUNT = void 0;
exports.TtsRequest = TtsRequest;
const xrpa_orchestrator_1 = require("@xrpa/xrpa-orchestrator");
const assert_1 = __importDefault(require("assert"));
exports.DEFAULT_TTS_REQUEST_MAX_COUNT = 16;
exports.XredTextToSpeechInterface = (0, xrpa_orchestrator_1.XrpaProgramInterface)("Xred.TextToSpeech", () => {
    const TextRequest = (0, xrpa_orchestrator_1.Message)("TextRequest", {
        text: (0, xrpa_orchestrator_1.String)("", "Text to convert to speech"),
        modelName: (0, xrpa_orchestrator_1.String)("chatterbox", "ChatterboxTTS model name"),
        id: (0, xrpa_orchestrator_1.Count)(0, "Optional ID. If sent with a text request, the response will have the same ID."),
    });
    const TtsResponse = (0, xrpa_orchestrator_1.Message)("TtsResponse", {
        id: (0, xrpa_orchestrator_1.Count)(0, "Request ID that matches the original text request"),
        success: (0, xrpa_orchestrator_1.Boolean)(false, "Whether synthesis completed successfully"),
        errorMessage: (0, xrpa_orchestrator_1.String)("", "Error message if processing failed"),
        playbackStartTimestamp: (0, xrpa_orchestrator_1.HiResTimestamp)("Timestamp when audio playback started"),
    });
    (0, xrpa_orchestrator_1.ProgramInput)("TextToSpeech", (0, xrpa_orchestrator_1.Collection)({
        maxCount: exports.DEFAULT_TTS_REQUEST_MAX_COUNT,
        fields: {
            textRequest: TextRequest,
            audio: (0, xrpa_orchestrator_1.Output)(xrpa_orchestrator_1.Signal),
            ttsResponse: (0, xrpa_orchestrator_1.Output)(TtsResponse),
        },
    }));
});
function TtsRequest(params) {
    const dataflowNode = (0, xrpa_orchestrator_1.Instantiate)([(0, xrpa_orchestrator_1.bindExternalProgram)(exports.XredTextToSpeechInterface), "TextToSpeech"], {});
    (0, assert_1.default)((0, xrpa_orchestrator_1.isDataflowForeignObjectInstantiation)(dataflowNode));
    dataflowNode.fieldValues.textRequest = params.textRequest;
    return {
        audio: { numChannels: 2, signal: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "audio") },
        ttsResponse: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "ttsResponse"),
    };
}
//# sourceMappingURL=TextToSpeechInterface.js.map
