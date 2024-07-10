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
exports.setupSignalProcessingDataStore = exports.SignalProcessingDataModel = void 0;
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
    datamodel.addCollection({
        name: "SignalEventCombiner",
        maxCount: 128,
        fields: {
            srcEvent0: SignalEvent,
            srcEvent1: SignalEvent,
            srcEvent2: SignalEvent,
            srcEvent3: SignalEvent,
            srcEvent4: SignalEvent,
            srcEvent5: SignalEvent,
            parameterMode: datamodel.addEnum("ParameterMode", ["Passthrough", "SrcIndex", "Constant"]),
            onEvent: SignalEvent,
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
            numOutputs: datamodel.CountField(1),
            srcData: datamodel.SignalField(),
        },
    });
    datamodel.addCollection({
        name: "SignalSourceFile",
        interfaceType: ISignalNode,
        maxCount: 64,
        fields: {
            numOutputs: datamodel.CountField(1),
            filePath: datamodel.addFixedString(256),
            autoPlay: datamodel.BooleanField(true),
        },
    });
    datamodel.addCollection({
        name: "SignalOscillator",
        interfaceType: ISignalNode,
        maxCount: 128,
        fields: {
            numOutputs: datamodel.CountField(1),
            numChannels: datamodel.CountField(1),
            waveformType: datamodel.addEnum("WaveformType", ["Sawtooth", "Square", "Triangle", "Sine", "WhiteNoise"]),
            frequency: datamodel.ScalarField(440),
            frequencyNode: ISignalNode,
            pulseWidth: datamodel.ScalarField(0.5),
            pulseWidthNode: ISignalNode,
        },
    });
    datamodel.addCollection({
        name: "SignalChannelRouter",
        interfaceType: ISignalNode,
        maxCount: 256,
        fields: {
            numOutputs: datamodel.CountField(1),
            numChannels: datamodel.CountField(1),
            channelSelect: datamodel.ScalarField(0.5),
            channelSelectNode: ISignalNode,
            srcNode: ISignalNode,
        },
    });
    datamodel.addCollection({
        name: "SignalChannelSelect",
        interfaceType: ISignalNode,
        maxCount: 256,
        fields: {
            numOutputs: datamodel.CountField(1),
            numChannels: datamodel.CountField(1),
            channelIdx: datamodel.CountField(0),
            srcNode: ISignalNode,
        },
    });
    datamodel.addCollection({
        name: "SignalChannelStack",
        interfaceType: ISignalNode,
        maxCount: 256,
        fields: {
            numOutputs: datamodel.CountField(1),
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
            numOutputs: datamodel.CountField(1),
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
            autoStart: datamodel.BooleanField(true),
            onDoneEvent: SignalEvent,
            autoLoop: datamodel.BooleanField(false),
        },
    });
    datamodel.addCollection({
        name: "SignalDelay",
        interfaceType: ISignalNode,
        maxCount: 256,
        fields: {
            numOutputs: datamodel.CountField(1),
            numChannels: datamodel.CountField(1),
            srcNode: ISignalNode,
            delayTimeMs: datamodel.ScalarField(),
        },
    });
    datamodel.addCollection({
        name: "SignalFeedback",
        interfaceType: ISignalNode,
        maxCount: 256,
        fields: {
            numOutputs: datamodel.CountField(1),
            numChannels: datamodel.CountField(1),
            srcNode: ISignalNode,
        },
    });
    datamodel.addCollection({
        name: "SignalMathOp",
        interfaceType: ISignalNode,
        maxCount: 256,
        fields: {
            numOutputs: datamodel.CountField(1),
            numChannels: datamodel.CountField(1),
            operation: datamodel.addEnum("MathOperation", ["Add", "Multiply", "Subtract"]),
            operandA: datamodel.ScalarField(),
            operandANode: ISignalNode,
            operandB: datamodel.ScalarField(),
            operandBNode: ISignalNode,
        },
    });
    datamodel.addCollection({
        name: "SignalMultiplexer",
        interfaceType: ISignalNode,
        maxCount: 256,
        fields: {
            numOutputs: datamodel.CountField(1),
            numChannels: datamodel.CountField(1),
            srcNode0: ISignalNode,
            srcNode1: ISignalNode,
            srcNode2: ISignalNode,
            srcNode3: ISignalNode,
            srcNode4: ISignalNode,
            srcNode5: ISignalNode,
            incrementEvent: SignalEvent,
            startEvent: SignalEvent,
            autoStart: datamodel.BooleanField(true),
            onDoneEvent: SignalEvent,
        },
    });
    const FilterType = datamodel.addEnum("FilterType", ["Bypass", "Peak", "LowShelf", "HighShelf", "LowPass", "HighPass", "BandPass"]);
    datamodel.addCollection({
        name: "SignalParametricEqualizer",
        interfaceType: ISignalNode,
        maxCount: 256,
        fields: {
            numOutputs: datamodel.CountField(1),
            numChannels: datamodel.CountField(1),
            srcNode: ISignalNode,
            // band0
            filterType0: FilterType,
            frequency0: datamodel.ScalarField(50),
            quality0: datamodel.ScalarField(0.707106),
            gain0: datamodel.ScalarField(0),
            // band1
            filterType1: FilterType,
            frequency1: datamodel.ScalarField(50),
            quality1: datamodel.ScalarField(0.707106),
            gain1: datamodel.ScalarField(0),
            // band2
            filterType2: FilterType,
            frequency2: datamodel.ScalarField(50),
            quality2: datamodel.ScalarField(0.707106),
            gain2: datamodel.ScalarField(0),
            // band3
            filterType3: FilterType,
            frequency3: datamodel.ScalarField(50),
            quality3: datamodel.ScalarField(0.707106),
            gain3: datamodel.ScalarField(0),
            // band4
            filterType4: FilterType,
            frequency4: datamodel.ScalarField(50),
            quality4: datamodel.ScalarField(0.707106),
            gain4: datamodel.ScalarField(0),
            // gain
            gainAdjust: datamodel.ScalarField(0),
        },
    });
    datamodel.addCollection({
        name: "SignalPitchShift",
        interfaceType: ISignalNode,
        maxCount: 256,
        fields: {
            numOutputs: datamodel.CountField(1),
            numChannels: datamodel.CountField(1),
            srcNode: ISignalNode,
            pitchShiftSemitones: datamodel.CountField(0),
        },
    });
    datamodel.addCollection({
        name: "SignalSoftClip",
        interfaceType: ISignalNode,
        maxCount: 256,
        fields: {
            numOutputs: datamodel.CountField(1),
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
// this is a hacky temporary fix until we have proper direcionality in the data model
function setupSignalProcessingDataStore(datastore) {
    datastore.addOutputReconciler({
        type: "SignalEvent",
        inboundFields: ["receiveEvent"],
    });
    datastore.addOutputReconciler({
        type: "SignalEventCombiner",
    });
    datastore.addOutputReconciler({
        type: "SignalSource",
    });
    datastore.addOutputReconciler({
        type: "SignalSourceFile",
    });
    datastore.addOutputReconciler({
        type: "SignalChannelRouter",
    });
    datastore.addOutputReconciler({
        type: "SignalChannelSelect",
    });
    datastore.addOutputReconciler({
        type: "SignalChannelStack",
    });
    datastore.addOutputReconciler({
        type: "SignalCurve",
    });
    datastore.addOutputReconciler({
        type: "SignalDelay",
    });
    datastore.addOutputReconciler({
        type: "SignalFeedback",
    });
    datastore.addOutputReconciler({
        type: "SignalMathOp",
    });
    datastore.addOutputReconciler({
        type: "SignalMultiplexer",
    });
    datastore.addOutputReconciler({
        type: "SignalOscillator",
    });
    datastore.addOutputReconciler({
        type: "SignalParametricEqualizer",
    });
    datastore.addOutputReconciler({
        type: "SignalPitchShift",
    });
    datastore.addOutputReconciler({
        type: "SignalSoftClip",
    });
    datastore.addOutputReconciler({
        type: "SignalOutputData",
    });
    datastore.addOutputReconciler({
        type: "SignalOutputDevice",
    });
}
exports.setupSignalProcessingDataStore = setupSignalProcessingDataStore;
//# sourceMappingURL=SignalProcessingDataModel.js.map
