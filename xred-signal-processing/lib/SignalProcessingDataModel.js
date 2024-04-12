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
exports.SignalProcessingDataModel = void 0;
const xrpa_orchestrator_1 = require("xrpa-orchestrator");
function SignalProcessingDataModel(datamodel) {
    datamodel.setStoredCoordinateSystem(xrpa_orchestrator_1.UnityCoordinateSystem);
    const SignalEvent = datamodel.addCollection({
        name: "SignalEvent",
        maxCount: 64,
        fields: {
            triggerEvent: datamodel.addMessageStruct("TriggerEventMessage", {
                payload: datamodel.ScalarField(),
            }),
            receiveEvent: datamodel.addMessageStruct("ReceiveEventMessage", {
                payload: datamodel.ScalarField(),
            }),
        },
    });
    const ISignalNode = datamodel.addInterface({
        name: "ISignalNode",
    });
    datamodel.addCollection({
        name: "SignalSource",
        interfaceType: ISignalNode,
        maxCount: 64,
        fields: {
            srcData: datamodel.SignalField(),
        },
    });
    datamodel.addCollection({
        name: "SignalSourceFile",
        interfaceType: ISignalNode,
        maxCount: 64,
        fields: {
            filePath: datamodel.addFixedString(256),
            autoPlay: datamodel.BooleanField(true),
        },
    });
    datamodel.addCollection({
        name: "SignalOscillator",
        interfaceType: ISignalNode,
        maxCount: 128,
        fields: {
            numChannels: datamodel.CountField(1),
            waveformType: datamodel.addEnum("WaveformType", ["Sawtooth", "Square", "Triangle", "Sine", "WhiteNoise"]),
            frequency: datamodel.ScalarField(440),
            frequencyNode: ISignalNode,
            pulseWidth: datamodel.ScalarField(0.5),
            pulseWidthNode: ISignalNode,
        },
    });
    datamodel.addCollection({
        name: "SignalChannelSelect",
        interfaceType: ISignalNode,
        maxCount: 256,
        fields: {
            channelIdx: datamodel.CountField(0),
            srcNode: ISignalNode,
        },
    });
    datamodel.addCollection({
        name: "SignalChannelStack",
        interfaceType: ISignalNode,
        maxCount: 256,
        fields: {
            numChannels: datamodel.CountField(1),
            srcNode0: ISignalNode,
            srcNode1: ISignalNode,
            srcNode2: ISignalNode,
            srcNode3: ISignalNode,
        },
    });
    datamodel.addCollection({
        name: "SignalCurve",
        interfaceType: ISignalNode,
        maxCount: 256,
        fields: {
            softCurve: datamodel.BooleanField(false),
            numSegments: datamodel.CountField(1),
            startValue: datamodel.ScalarField(),
            segmentLength0: datamodel.ScalarField(),
            segmentEndValue0: datamodel.ScalarField(),
            segmentLength1: datamodel.ScalarField(),
            segmentEndValue1: datamodel.ScalarField(),
            segmentLength2: datamodel.ScalarField(),
            segmentEndValue2: datamodel.ScalarField(),
            segmentLength3: datamodel.ScalarField(),
            segmentEndValue3: datamodel.ScalarField(),
            segmentLength4: datamodel.ScalarField(),
            segmentEndValue4: datamodel.ScalarField(),
            segmentLength5: datamodel.ScalarField(),
            segmentEndValue5: datamodel.ScalarField(),
            startEvent: SignalEvent,
            onDoneEvent: SignalEvent,
        },
    });
    datamodel.addCollection({
        name: "SignalMathOp",
        interfaceType: ISignalNode,
        maxCount: 256,
        fields: {
            numChannels: datamodel.CountField(1),
            operation: datamodel.addEnum("MathOperation", ["Add", "Multiply"]),
            operandA: datamodel.ScalarField(),
            operandANode: ISignalNode,
            operandB: datamodel.ScalarField(),
            operandBNode: ISignalNode,
        },
    });
    datamodel.addCollection({
        name: "SignalSoftClip",
        interfaceType: ISignalNode,
        maxCount: 256,
        fields: {
            numChannels: datamodel.CountField(1),
            srcNode: ISignalNode,
        },
    });
    const SampleType = datamodel.addEnum("SampleType", ["Float", "SignedInt32", "UnsignedInt32"]);
    datamodel.addCollection({
        name: "SignalOutputData",
        maxCount: 64,
        fields: {
            srcNode: ISignalNode,
            numChannels: datamodel.CountField(1),
            sampleType: SampleType,
            samplesPerChannelPerSec: datamodel.CountField(),
            data: datamodel.SignalField(),
        },
    });
    datamodel.addCollection({
        name: "SignalOutputDevice",
        maxCount: 64,
        fields: {
            srcNode: ISignalNode,
            channelOffset: datamodel.CountField(0),
            deviceNameFilter: {
                type: datamodel.addFixedString(128),
                description: "pseudo-regex, with just $ and ^ supported for now",
            },
            deviceHandednessFilter: datamodel.addEnum("DeviceHandednessFilter", ["Any", "None", "Left", "Right"]),
            // TODO channelName, driverIdentifier, driverPort filters?
            foundMatch: datamodel.BooleanField(false, "Set to true if a matching device was found"),
        },
    });
}
exports.SignalProcessingDataModel = SignalProcessingDataModel;
//# sourceMappingURL=SignalProcessingDataModel.js.map
