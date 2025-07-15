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

Object.defineProperty(exports, "__esModule", { value: true });
exports.XredSignalOutputInterface = void 0;
const xrpa_orchestrator_1 = require("@xrpa/xrpa-orchestrator");
exports.XredSignalOutputInterface = (0, xrpa_orchestrator_1.XrpaProgramInterface)("Xred.SignalOutput", () => {
    (0, xrpa_orchestrator_1.useCoordinateSystem)(xrpa_orchestrator_1.UnityCoordinateSystem);
    const DeviceHandedness = (0, xrpa_orchestrator_1.Enum)("DeviceHandedness", ["None", "Left", "Right"]);
    const SampleType = (0, xrpa_orchestrator_1.Enum)("SampleType", ["Float", "SignedInt", "UnsignedInt"]);
    const SampleSemantics = (0, xrpa_orchestrator_1.Enum)("SampleSemantics", ["PCM", "Intensity"]);
    const SignalOutputDevice = (0, xrpa_orchestrator_1.ProgramOutput)("SignalOutputDevice", (0, xrpa_orchestrator_1.Collection)({
        maxCount: 64,
        fields: {
            name: (0, xrpa_orchestrator_1.PrimaryKey)(xrpa_orchestrator_1.IfGameEngine, xrpa_orchestrator_1.String),
            channelName: xrpa_orchestrator_1.String,
            driverIdentifier: xrpa_orchestrator_1.String,
            driverPort: xrpa_orchestrator_1.String,
            handedness: DeviceHandedness,
            numChannels: xrpa_orchestrator_1.Count,
            sampleType: SampleType,
            sampleSemantics: SampleSemantics,
            bytesPerSample: xrpa_orchestrator_1.Count,
            samplesPerChannelPerSec: xrpa_orchestrator_1.Count,
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
            device: (0, xrpa_orchestrator_1.ReferenceTo)(SignalOutputDevice),
            outputToSystemAudio: xrpa_orchestrator_1.Boolean,
            signal: xrpa_orchestrator_1.Signal,
        },
    })));
});
//# sourceMappingURL=SignalOutputInterface.js.map
