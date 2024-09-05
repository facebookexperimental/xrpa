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
    const SignalOutputDevice = (0, xrpa_orchestrator_1.ProgramOutput)("SignalOutputDevice", (0, xrpa_orchestrator_1.Augment)((0, xrpa_orchestrator_1.Collection)({
        maxCount: 64,
        fields: {
            name: (0, xrpa_orchestrator_1.PrimaryKey)(xrpa_orchestrator_1.IfGameEngine, (0, xrpa_orchestrator_1.FixedString)(64)),
            channelName: (0, xrpa_orchestrator_1.FixedString)(64),
            driverIdentifier: (0, xrpa_orchestrator_1.FixedString)(64),
            driverPort: (0, xrpa_orchestrator_1.FixedString)(64),
            handedness: DeviceHandedness,
            numChannels: xrpa_orchestrator_1.Count,
            sampleType: SampleType,
            sampleSemantics: SampleSemantics,
            bytesPerSample: xrpa_orchestrator_1.Count,
            samplesPerChannelPerSec: xrpa_orchestrator_1.Count,
            inputEvent: (0, xrpa_orchestrator_1.Message)("InputEvent", {
                type: (0, xrpa_orchestrator_1.Enum)("InputEventType", ["Release", "Press"]),
                source: xrpa_orchestrator_1.Count,
            }),
        },
    }), (0, xrpa_orchestrator_1.GenericImpl)(xrpa_orchestrator_1.IfInput)));
    (0, xrpa_orchestrator_1.ProgramInput)("SignalOutputSource", (0, xrpa_orchestrator_1.Augment)((0, xrpa_orchestrator_1.Collection)({
        maxCount: 128,
        fields: {
            device: (0, xrpa_orchestrator_1.ReferenceTo)(SignalOutputDevice),
            signal: xrpa_orchestrator_1.Signal,
        },
    }), (0, xrpa_orchestrator_1.GenericImpl)(xrpa_orchestrator_1.IfOutput)));
});
//# sourceMappingURL=SignalOutputInterface.js.map
