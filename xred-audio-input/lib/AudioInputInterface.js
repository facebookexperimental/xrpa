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
exports.XredAudioInputInterface = exports.DEFAULT_AUDIO_INPUT_MAX_COUNT = void 0;
exports.AudioInputSource = AudioInputSource;
exports.AvailableAudioDevices = AvailableAudioDevices;
const xrpa_orchestrator_1 = require("@xrpa/xrpa-orchestrator");
const assert_1 = __importDefault(require("assert"));
exports.DEFAULT_AUDIO_INPUT_MAX_COUNT = 4;
exports.XredAudioInputInterface = (0, xrpa_orchestrator_1.XrpaProgramInterface)("Xred.AudioInput", () => {
    (0, xrpa_orchestrator_1.ProgramInput)("AudioInputSource", (0, xrpa_orchestrator_1.Collection)({
        maxCount: exports.DEFAULT_AUDIO_INPUT_MAX_COUNT,
        fields: {
            deviceName: (0, xrpa_orchestrator_1.String)("default", "Audio input device name"),
            sampleRate: (0, xrpa_orchestrator_1.Count)(48000, "Sample rate for audio capture"),
            audioSignal: (0, xrpa_orchestrator_1.Output)(xrpa_orchestrator_1.Signal),
            isActive: (0, xrpa_orchestrator_1.Output)((0, xrpa_orchestrator_1.Boolean)(false, "Whether audio input is currently active")),
            errorMessage: (0, xrpa_orchestrator_1.Output)((0, xrpa_orchestrator_1.String)("", "Error message if audio input failed")),
        },
    }));
    (0, xrpa_orchestrator_1.ProgramOutput)("AvailableAudioDevices", (0, xrpa_orchestrator_1.Collection)({
        maxCount: 8,
        fields: {
            deviceName: (0, xrpa_orchestrator_1.String)("", "Human-readable device name"),
            isDefault: (0, xrpa_orchestrator_1.Boolean)(false, "Whether this is the default input device"),
        },
    }));
});
function AudioInputSource(params) {
    const dataflowNode = (0, xrpa_orchestrator_1.Instantiate)([(0, xrpa_orchestrator_1.bindExternalProgram)(exports.XredAudioInputInterface), "AudioInputSource"], {});
    (0, assert_1.default)((0, xrpa_orchestrator_1.isDataflowForeignObjectInstantiation)(dataflowNode));
    dataflowNode.fieldValues = {
        deviceName: params.deviceName || "default",
        sampleRate: params.sampleRate || 48000,
    };
    return {
        audioSignal: { numChannels: 2, signal: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "audioSignal") },
        isActive: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "isActive"),
        errorMessage: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "errorMessage"),
    };
}
function AvailableAudioDevices() {
    const dataflowNode = (0, xrpa_orchestrator_1.Instantiate)([(0, xrpa_orchestrator_1.bindExternalProgram)(exports.XredAudioInputInterface), "AvailableAudioDevices"], {});
    (0, assert_1.default)((0, xrpa_orchestrator_1.isDataflowForeignObjectInstantiation)(dataflowNode));
    return {
        deviceName: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "deviceName"),
        isDefault: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "isDefault"),
    };
}
//# sourceMappingURL=AudioInputInterface.js.map
