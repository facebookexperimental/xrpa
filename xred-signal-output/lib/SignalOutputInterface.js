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
exports.OutputToTcpStream = exports.OutputToSystemAudio = exports.OutputToMatchingDevice = exports.OutputToDevice = exports.XredSignalOutputInterface = void 0;
const assert_1 = __importDefault(require("assert"));
const xrpa_orchestrator_1 = require("@xrpa/xrpa-orchestrator");
const path_1 = __importDefault(require("path"));
exports.XredSignalOutputInterface = (0, xrpa_orchestrator_1.XrpaProgramInterface)("Xred.SignalOutput", path_1.default.join(__dirname, "../package.json"), () => {
    (0, xrpa_orchestrator_1.useCoordinateSystem)(xrpa_orchestrator_1.UnityCoordinateSystem);
    const SignalOutputDevice = (0, xrpa_orchestrator_1.ProgramOutput)("SignalOutputDevice", (0, xrpa_orchestrator_1.Collection)({
        maxCount: 64,
        fields: {
            name: (0, xrpa_orchestrator_1.PrimaryKey)(xrpa_orchestrator_1.IfGameEngine, xrpa_orchestrator_1.String),
            deviceType: (0, xrpa_orchestrator_1.Enum)("SignalOutputDeviceType", ["Audio", "Haptics"]),
            numChannels: xrpa_orchestrator_1.Count,
            frameRate: xrpa_orchestrator_1.Count,
            isSystemAudioOutput: xrpa_orchestrator_1.Boolean,
            inputEvent: (0, xrpa_orchestrator_1.Message)("InputEvent", {
                type: (0, xrpa_orchestrator_1.Enum)("InputEventType", ["Release", "Press"]),
                source: xrpa_orchestrator_1.Count,
            }),
        },
    }));
    (0, xrpa_orchestrator_1.ProgramInput)("SignalOutputSource", (0, xrpa_orchestrator_1.GameComponentBindingsDisabled)((0, xrpa_orchestrator_1.Collection)({
        maxCount: 128,
        fields: {
            bindTo: (0, xrpa_orchestrator_1.Enum)("DeviceBindingType", ["Device", "DeviceByName", "SystemAudio", "TcpStream"]),
            device: (0, xrpa_orchestrator_1.ReferenceTo)(SignalOutputDevice),
            deviceName: xrpa_orchestrator_1.String,
            hostname: xrpa_orchestrator_1.String,
            port: xrpa_orchestrator_1.Count,
            signal: xrpa_orchestrator_1.Signal,
            isConnected: (0, xrpa_orchestrator_1.Output)(xrpa_orchestrator_1.Boolean),
        },
    })));
});
function OutputToDevice(params) {
    const dataflowNode = (0, xrpa_orchestrator_1.Instantiate)([(0, xrpa_orchestrator_1.bindExternalProgram)(exports.XredSignalOutputInterface), "SignalOutputSource"], {});
    (0, assert_1.default)((0, xrpa_orchestrator_1.isDataflowForeignObjectInstantiation)(dataflowNode));
    dataflowNode.fieldValues.bindTo = 0;
    dataflowNode.fieldValues.device = params.device;
    dataflowNode.fieldValues.signal = params.signal;
    return {
        isConnected: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "isConnected"),
    };
}
exports.OutputToDevice = OutputToDevice;
function OutputToMatchingDevice(params) {
    const dataflowNode = (0, xrpa_orchestrator_1.Instantiate)([(0, xrpa_orchestrator_1.bindExternalProgram)(exports.XredSignalOutputInterface), "SignalOutputSource"], {});
    (0, assert_1.default)((0, xrpa_orchestrator_1.isDataflowForeignObjectInstantiation)(dataflowNode));
    dataflowNode.fieldValues.bindTo = 1;
    dataflowNode.fieldValues.deviceName = params.name;
    dataflowNode.fieldValues.signal = params.signal;
    return {
        isConnected: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "isConnected"),
    };
}
exports.OutputToMatchingDevice = OutputToMatchingDevice;
function OutputToSystemAudio(params) {
    const dataflowNode = (0, xrpa_orchestrator_1.Instantiate)([(0, xrpa_orchestrator_1.bindExternalProgram)(exports.XredSignalOutputInterface), "SignalOutputSource"], {});
    (0, assert_1.default)((0, xrpa_orchestrator_1.isDataflowForeignObjectInstantiation)(dataflowNode));
    dataflowNode.fieldValues.bindTo = 2;
    dataflowNode.fieldValues.signal = params.signal;
    return {
        isConnected: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "isConnected"),
    };
}
exports.OutputToSystemAudio = OutputToSystemAudio;
function OutputToTcpStream(params) {
    const dataflowNode = (0, xrpa_orchestrator_1.Instantiate)([(0, xrpa_orchestrator_1.bindExternalProgram)(exports.XredSignalOutputInterface), "SignalOutputSource"], {});
    (0, assert_1.default)((0, xrpa_orchestrator_1.isDataflowForeignObjectInstantiation)(dataflowNode));
    dataflowNode.fieldValues.bindTo = 3;
    dataflowNode.fieldValues.hostname = params.hostname;
    dataflowNode.fieldValues.port = params.port;
    dataflowNode.fieldValues.signal = params.signal;
    return {
        isConnected: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "isConnected"),
    };
}
exports.OutputToTcpStream = OutputToTcpStream;
//# sourceMappingURL=SignalOutputInterface.js.map
