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
exports.XredSignalOutput = void 0;
const xrpa_orchestrator_1 = require("xrpa-orchestrator");
function SignalOutputDataModel(datamodel) {
    datamodel.setStoredCoordinateSystem(xrpa_orchestrator_1.UnityCoordinateSystem);
    const DeviceHandedness = datamodel.addEnum("DeviceHandedness", ["None", "Left", "Right"]);
    const SampleType = datamodel.addEnum("SampleType", ["Float", "SignedInt", "UnsignedInt"]);
    const SampleSemantics = datamodel.addEnum("SampleSemantics", ["PCM", "Intensity"]);
    const SignalOutputDevice = datamodel.addCollection({
        name: "SignalOutputDevice",
        maxCount: 64,
        fields: {
            name: datamodel.addFixedString(64),
            channelName: datamodel.addFixedString(64),
            driverIdentifier: datamodel.addFixedString(64),
            driverPort: datamodel.addFixedString(64),
            handedness: DeviceHandedness,
            numChannels: datamodel.CountField(),
            sampleType: SampleType,
            sampleSemantics: SampleSemantics,
            bytesPerSample: datamodel.CountField(),
            samplesPerChannelPerSec: datamodel.CountField(),
            inputEvent: datamodel.addMessageStruct("InputEvent", {
                type: datamodel.addEnum("InputEventType", ["Release", "Press"]),
                source: datamodel.CountField(),
            }),
        },
    });
    datamodel.addCollection({
        name: "SignalOutputSource",
        maxCount: 128,
        fields: {
            device: SignalOutputDevice,
            signal: datamodel.SignalField(),
        },
    });
}
exports.XredSignalOutput = {
    name: "SignalOutput",
    companyName: "Xred",
    setupDataStore(moduleDef, binding) {
        const datastore = moduleDef.addDataStore({
            dataset: this.name,
            datamodel: SignalOutputDataModel,
        });
        if ((0, xrpa_orchestrator_1.isModuleBindingConfig)(binding)) {
            datastore.addOutputReconciler({
                type: "SignalOutputDevice",
            });
            datastore.addInputReconciler({
                type: "SignalOutputSource",
            });
        }
        else if ((0, xrpa_orchestrator_1.isCallerBindingConfig)(binding)) {
            datastore.addInputReconciler({
                type: "SignalOutputDevice",
                useGenericReconciledType: true,
            });
            datastore.addOutputReconciler({
                type: "SignalOutputSource",
            });
        }
    }
};
//# sourceMappingURL=SignalOutputDataModel.js.map
