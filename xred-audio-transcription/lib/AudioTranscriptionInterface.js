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
exports.XredAudioTranscriptionInterface = exports.DEFAULT_TRANSCRIPTION_MAX_COUNT = void 0;
exports.AudioTranscription = AudioTranscription;
const xrpa_orchestrator_1 = require("@xrpa/xrpa-orchestrator");
const assert_1 = __importDefault(require("assert"));
exports.DEFAULT_TRANSCRIPTION_MAX_COUNT = 4;
function createAudioTranscriptionInterface() {
    return (0, xrpa_orchestrator_1.XrpaProgramInterface)("Xred.AudioTranscription", () => {
        const TranscriptionResult = (0, xrpa_orchestrator_1.Message)("TranscriptionResult", {
            text: (0, xrpa_orchestrator_1.String)("", "Transcribed text from audio"),
            timestamp: (0, xrpa_orchestrator_1.HiResTimestamp)("Timestamp of the start of the audio segment from which the transcription is generated"),
            success: (0, xrpa_orchestrator_1.Boolean)(false, "Whether transcription completed successfully"),
            errorMessage: (0, xrpa_orchestrator_1.String)("", "Error message if transcription failed"),
        });
        (0, xrpa_orchestrator_1.ProgramInput)("AudioTranscription", (0, xrpa_orchestrator_1.Collection)({
            maxCount: exports.DEFAULT_TRANSCRIPTION_MAX_COUNT,
            fields: {
                audioSignal: xrpa_orchestrator_1.Signal,
                transcriptionResult: (0, xrpa_orchestrator_1.Output)(TranscriptionResult),
            },
        }));
    });
}
exports.XredAudioTranscriptionInterface = createAudioTranscriptionInterface();
function AudioTranscription(params) {
    const dataflowNode = (0, xrpa_orchestrator_1.Instantiate)([(0, xrpa_orchestrator_1.bindExternalProgram)(exports.XredAudioTranscriptionInterface), "AudioTranscription"], {});
    (0, assert_1.default)((0, xrpa_orchestrator_1.isDataflowForeignObjectInstantiation)(dataflowNode));
    dataflowNode.fieldValues = {
        audioSignal: params.audioSignal,
    };
    return {
        transcriptionResult: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "transcriptionResult"),
    };
}
//# sourceMappingURL=AudioTranscriptionInterface.js.map
