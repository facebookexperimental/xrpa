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
exports.InputFromDevice = InputFromDevice;
exports.InputFromMatchingDevice = InputFromMatchingDevice;
exports.InputFromSystemAudio = InputFromSystemAudio;
exports.InputFromTcpStream = InputFromTcpStream;
const assert_1 = __importDefault(require("assert"));
const path_1 = __importDefault(require("path"));
const xrpa_orchestrator_1 = require("@xrpa/xrpa-orchestrator");
exports.DEFAULT_AUDIO_INPUT_MAX_COUNT = 16;
exports.XredAudioInputInterface = (0, xrpa_orchestrator_1.XrpaProgramInterface)("Xred.AudioInput", path_1.default.join(__dirname, "../package.json"), () => {
    const AudioInputDevice = (0, xrpa_orchestrator_1.ProgramOutput)("AudioInputDevice", (0, xrpa_orchestrator_1.Collection)({
        maxCount: 32,
        fields: {
            deviceName: (0, xrpa_orchestrator_1.String)("", "Human-readable device name"),
            numChannels: (0, xrpa_orchestrator_1.Count)(2, "Number of channels available"),
            frameRate: (0, xrpa_orchestrator_1.Count)(48000, "Default frame rate for audio capture"),
            isSystemAudioInput: (0, xrpa_orchestrator_1.Boolean)(false, "Whether this is the default input device"),
        },
    }));
    (0, xrpa_orchestrator_1.ProgramInput)("AudioInputSource", (0, xrpa_orchestrator_1.Collection)({
        maxCount: exports.DEFAULT_AUDIO_INPUT_MAX_COUNT,
        fields: {
            bindTo: (0, xrpa_orchestrator_1.Enum)("DeviceBindingType", ["Device", "DeviceByName", "SystemAudio", "TcpStream"]),
            device: (0, xrpa_orchestrator_1.ReferenceTo)(AudioInputDevice),
            deviceName: xrpa_orchestrator_1.String,
            hostname: xrpa_orchestrator_1.String,
            port: xrpa_orchestrator_1.Count,
            frameRate: (0, xrpa_orchestrator_1.Count)(48000, "Frame rate for audio capture"),
            numChannels: (0, xrpa_orchestrator_1.Count)(2, "Number of channels for audio capture"),
            audioSignal: (0, xrpa_orchestrator_1.Output)(xrpa_orchestrator_1.Signal),
            isActive: (0, xrpa_orchestrator_1.Output)((0, xrpa_orchestrator_1.Boolean)(false, "Whether audio input is currently active")),
            errorMessage: (0, xrpa_orchestrator_1.Output)((0, xrpa_orchestrator_1.String)("", "Error message if audio input failed")),
        },
    }));
});
function InputFromDevice(params) {
    const numChannels = params.numChannels ?? 2;
    const dataflowNode = (0, xrpa_orchestrator_1.Instantiate)([(0, xrpa_orchestrator_1.bindExternalProgram)(exports.XredAudioInputInterface), "AudioInputSource"], {});
    (0, assert_1.default)((0, xrpa_orchestrator_1.isDataflowForeignObjectInstantiation)(dataflowNode));
    dataflowNode.fieldValues = {
        bindTo: 0,
        device: params.device,
        frameRate: params.frameRate ?? 48000,
        numChannels,
    };
    return {
        audioSignal: { numChannels, signal: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "audioSignal") },
        isActive: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "isActive"),
        errorMessage: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "errorMessage"),
    };
}
function InputFromMatchingDevice(params) {
    const numChannels = params.numChannels ?? 2;
    const dataflowNode = (0, xrpa_orchestrator_1.Instantiate)([(0, xrpa_orchestrator_1.bindExternalProgram)(exports.XredAudioInputInterface), "AudioInputSource"], {});
    (0, assert_1.default)((0, xrpa_orchestrator_1.isDataflowForeignObjectInstantiation)(dataflowNode));
    dataflowNode.fieldValues = {
        bindTo: 1,
        deviceName: params.name,
        frameRate: params.frameRate ?? 48000,
        numChannels,
    };
    return {
        audioSignal: { numChannels, signal: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "audioSignal") },
        isActive: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "isActive"),
        errorMessage: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "errorMessage"),
    };
}
function InputFromSystemAudio(params) {
    const numChannels = params.numChannels ?? 2;
    const dataflowNode = (0, xrpa_orchestrator_1.Instantiate)([(0, xrpa_orchestrator_1.bindExternalProgram)(exports.XredAudioInputInterface), "AudioInputSource"], {});
    (0, assert_1.default)((0, xrpa_orchestrator_1.isDataflowForeignObjectInstantiation)(dataflowNode));
    dataflowNode.fieldValues = {
        bindTo: 2,
        frameRate: params.frameRate ?? 48000,
        numChannels,
    };
    return {
        audioSignal: { numChannels, signal: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "audioSignal") },
        isActive: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "isActive"),
        errorMessage: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "errorMessage"),
    };
}
function InputFromTcpStream(params) {
    const numChannels = params.numChannels ?? 2;
    const dataflowNode = (0, xrpa_orchestrator_1.Instantiate)([(0, xrpa_orchestrator_1.bindExternalProgram)(exports.XredAudioInputInterface), "AudioInputSource"], {});
    (0, assert_1.default)((0, xrpa_orchestrator_1.isDataflowForeignObjectInstantiation)(dataflowNode));
    dataflowNode.fieldValues = {
        bindTo: 3,
        hostname: params.hostname,
        port: params.port,
        frameRate: params.frameRate ?? 48000,
        numChannels,
    };
    return {
        audioSignal: { numChannels, signal: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "audioSignal") },
        isActive: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "isActive"),
        errorMessage: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "errorMessage"),
    };
}
//# sourceMappingURL=AudioInputInterface.js.map
