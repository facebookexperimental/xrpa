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
exports.OutputToSmartSpeaker = exports.InputFromSmartMicrophone = exports.LightControl = exports.KnobControl = exports.XredSmartControllerInterface = exports.KnobControlMode = void 0;
const xrpa_orchestrator_1 = require("@xrpa/xrpa-orchestrator");
const xred_audio_input_1 = require("@xrpa/xred-audio-input");
const xred_signal_output_1 = require("@xrpa/xred-signal-output");
const xred_signal_processing_1 = require("@xrpa/xred-signal-processing");
const assert_1 = __importDefault(require("assert"));
const path_1 = __importDefault(require("path"));
const MIC_PORT = 12345;
const SPEAKER_PORT = 12346;
var KnobControlMode;
(function (KnobControlMode) {
    KnobControlMode[KnobControlMode["Disabled"] = 0] = "Disabled";
    KnobControlMode[KnobControlMode["Position"] = 1] = "Position";
    KnobControlMode[KnobControlMode["Detent"] = 2] = "Detent";
})(KnobControlMode = exports.KnobControlMode || (exports.KnobControlMode = {}));
exports.XredSmartControllerInterface = (0, xrpa_orchestrator_1.XrpaProgramInterface)("Xred.SmartController", path_1.default.join(__dirname, "../package.json"), () => {
    const KnobControlModeType = (0, xrpa_orchestrator_1.Enum)("KnobControlMode", ["Disabled", "Position", "Detent"]);
    (0, xrpa_orchestrator_1.ProgramInput)("KnobControl", (0, xrpa_orchestrator_1.Collection)({
        maxCount: 4,
        fields: {
            ipAddress: (0, xrpa_orchestrator_1.String)("", "IP address of the device to control"),
            isConnected: (0, xrpa_orchestrator_1.Output)((0, xrpa_orchestrator_1.Boolean)(false, "Whether the device is connected")),
            controlMode: KnobControlModeType,
            position: (0, xrpa_orchestrator_1.Count)(0, "Position to set the knob to, when controlMode == Position"),
            detentCount: (0, xrpa_orchestrator_1.Count)(10, "Number of detents to set the knob to, when controlMode == Detent"),
            inputEvent: (0, xrpa_orchestrator_1.Output)((0, xrpa_orchestrator_1.Message)("InputEvent", {
                type: (0, xrpa_orchestrator_1.Enum)("InputEventType", ["Release", "Press"]),
                source: xrpa_orchestrator_1.Count,
            })),
            positionEvent: (0, xrpa_orchestrator_1.Output)((0, xrpa_orchestrator_1.Message)("PositionEvent", {
                position: xrpa_orchestrator_1.Count,
                absolutePosition: xrpa_orchestrator_1.Count,
                detentPosition: xrpa_orchestrator_1.Count,
            })),
        },
    }));
    (0, xrpa_orchestrator_1.ProgramInput)("LightControl", (0, xrpa_orchestrator_1.Collection)({
        maxCount: 64,
        fields: {
            ipAddress: (0, xrpa_orchestrator_1.String)("", "IP address of the device to control"),
            isConnected: (0, xrpa_orchestrator_1.Output)((0, xrpa_orchestrator_1.Boolean)(false, "Whether the device is connected")),
            lightColors: (0, xrpa_orchestrator_1.FixedArray)(xrpa_orchestrator_1.ColorSRGBA, 24),
            rotationOffset: xrpa_orchestrator_1.Angle,
            rotationSpeed: xrpa_orchestrator_1.Angle,
            priority: (0, xrpa_orchestrator_1.Count)(0, "Priority of the light, lower values will be applied first, with higher values alpha-blended on top"),
        },
    }));
});
function KnobControl(params) {
    const dataflowNode = (0, xrpa_orchestrator_1.Instantiate)([(0, xrpa_orchestrator_1.bindExternalProgram)(exports.XredSmartControllerInterface), "KnobControl"], {});
    (0, assert_1.default)((0, xrpa_orchestrator_1.isDataflowForeignObjectInstantiation)(dataflowNode));
    dataflowNode.fieldValues.ipAddress = params.ipAddress;
    dataflowNode.fieldValues.controlMode = params.controlMode;
    dataflowNode.fieldValues.position = params.position ?? 0;
    dataflowNode.fieldValues.detentCount = params.detentCount ?? 10;
    return {
        isConnected: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "isConnected"),
        inputEvent: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "inputEvent"),
        positionEvent: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "positionEvent"),
    };
}
exports.KnobControl = KnobControl;
function LightControl(params) {
    const dataflowNode = (0, xrpa_orchestrator_1.Instantiate)([(0, xrpa_orchestrator_1.bindExternalProgram)(exports.XredSmartControllerInterface), "LightControl"], {});
    (0, assert_1.default)((0, xrpa_orchestrator_1.isDataflowForeignObjectInstantiation)(dataflowNode));
    dataflowNode.fieldValues.ipAddress = params.ipAddress;
    dataflowNode.fieldValues.lightColors = params.lightColors; // TODO: fix this
    dataflowNode.fieldValues.rotationOffset = params.rotationOffset ?? 0;
    dataflowNode.fieldValues.rotationSpeed = params.rotationSpeed ?? 0;
    dataflowNode.fieldValues.priority = params.priority ?? 0;
    return {
        isConnected: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "isConnected"),
    };
}
exports.LightControl = LightControl;
function InputFromSmartMicrophone(params) {
    return (0, xred_audio_input_1.InputFromTcpStream)({
        hostname: params.ipAddress,
        port: MIC_PORT,
        frameRate: 16000,
        numChannels: 1,
    });
}
exports.InputFromSmartMicrophone = InputFromSmartMicrophone;
function OutputToSmartSpeaker(params) {
    let signal = params.audioSignal;
    if ((0, xred_signal_processing_1.isISignalNodeType)(signal)) {
        // pull signal data out of the SignalProcessing graph at the correct frame rate
        signal = (0, xred_signal_processing_1.OutputSignal)({
            source: signal,
            frameRate: 16000,
        });
    }
    return (0, xred_signal_output_1.OutputToTcpStream)({
        hostname: params.ipAddress,
        port: SPEAKER_PORT,
        signal,
    });
}
exports.OutputToSmartSpeaker = OutputToSmartSpeaker;
//# sourceMappingURL=index.js.map
