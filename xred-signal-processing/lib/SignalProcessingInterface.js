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
exports.XredSignalProcessingInterface = void 0;
const xrpa_orchestrator_1 = require("@xrpa/xrpa-orchestrator");
exports.XredSignalProcessingInterface = (0, xrpa_orchestrator_1.XrpaProgramInterface)("Xred.SignalProcessing", () => {
    (0, xrpa_orchestrator_1.useCoordinateSystem)(xrpa_orchestrator_1.UnityCoordinateSystem);
    (0, xrpa_orchestrator_1.GameComponentBindingsDisabled)();
    const SignalEvent = (0, xrpa_orchestrator_1.ProgramInput)("SignalEvent", (0, xrpa_orchestrator_1.Collection)({
        maxCount: 64,
        fields: {
            triggerEvent: (0, xrpa_orchestrator_1.Message)("TriggerEventMessage", {
                payload: xrpa_orchestrator_1.Scalar,
            }),
            receiveEvent: (0, xrpa_orchestrator_1.Output)((0, xrpa_orchestrator_1.Message)("ReceiveEventMessage", {
                payload: xrpa_orchestrator_1.Scalar,
            })),
        },
    }));
    (0, xrpa_orchestrator_1.ProgramInput)("SignalEventCombiner", (0, xrpa_orchestrator_1.Collection)({
        maxCount: 128,
        fields: {
            srcEvent0: (0, xrpa_orchestrator_1.ReferenceTo)(SignalEvent),
            srcEvent1: (0, xrpa_orchestrator_1.ReferenceTo)(SignalEvent),
            srcEvent2: (0, xrpa_orchestrator_1.ReferenceTo)(SignalEvent),
            srcEvent3: (0, xrpa_orchestrator_1.ReferenceTo)(SignalEvent),
            srcEvent4: (0, xrpa_orchestrator_1.ReferenceTo)(SignalEvent),
            srcEvent5: (0, xrpa_orchestrator_1.ReferenceTo)(SignalEvent),
            parameterMode: (0, xrpa_orchestrator_1.Enum)("ParameterMode", ["Passthrough", "SrcIndex", "Constant"]),
            onEvent: (0, xrpa_orchestrator_1.ReferenceTo)(SignalEvent),
        },
    }));
    const ISignalNode = (0, xrpa_orchestrator_1.Interface)("ISignalNode");
    (0, xrpa_orchestrator_1.ProgramInput)("SignalSource", (0, xrpa_orchestrator_1.Collection)({
        interfaceType: ISignalNode,
        maxCount: 64,
        fields: {
            numOutputs: (0, xrpa_orchestrator_1.Count)(1),
            numChannels: (0, xrpa_orchestrator_1.Count)(1),
            srcData: (0, xrpa_orchestrator_1.Signal)(),
        },
    }));
    (0, xrpa_orchestrator_1.ProgramInput)("SignalSourceFile", (0, xrpa_orchestrator_1.Collection)({
        interfaceType: ISignalNode,
        maxCount: 64,
        fields: {
            numOutputs: (0, xrpa_orchestrator_1.Count)(1),
            filePath: xrpa_orchestrator_1.String,
            autoPlay: (0, xrpa_orchestrator_1.Boolean)(true),
        },
    }));
    (0, xrpa_orchestrator_1.ProgramInput)("SignalOscillator", (0, xrpa_orchestrator_1.Collection)({
        interfaceType: ISignalNode,
        maxCount: 128,
        fields: {
            numOutputs: (0, xrpa_orchestrator_1.Count)(1),
            numChannels: (0, xrpa_orchestrator_1.Count)(1),
            waveformType: (0, xrpa_orchestrator_1.Enum)("WaveformType", ["Sawtooth", "Square", "Triangle", "Sine", "WhiteNoise"]),
            frequency: (0, xrpa_orchestrator_1.Scalar)(440),
            frequencyNode: (0, xrpa_orchestrator_1.ReferenceTo)(ISignalNode),
            pulseWidth: (0, xrpa_orchestrator_1.Scalar)(0.5),
            pulseWidthNode: (0, xrpa_orchestrator_1.ReferenceTo)(ISignalNode),
        },
    }));
    (0, xrpa_orchestrator_1.ProgramInput)("SignalChannelRouter", (0, xrpa_orchestrator_1.Collection)({
        interfaceType: ISignalNode,
        maxCount: 256,
        fields: {
            numOutputs: (0, xrpa_orchestrator_1.Count)(1),
            numChannels: (0, xrpa_orchestrator_1.Count)(1),
            channelSelect: (0, xrpa_orchestrator_1.Scalar)(0.5),
            channelSelectNode: (0, xrpa_orchestrator_1.ReferenceTo)(ISignalNode),
            srcNode: (0, xrpa_orchestrator_1.ReferenceTo)(ISignalNode),
        },
    }));
    (0, xrpa_orchestrator_1.ProgramInput)("SignalChannelSelect", (0, xrpa_orchestrator_1.Collection)({
        interfaceType: ISignalNode,
        maxCount: 256,
        fields: {
            numOutputs: (0, xrpa_orchestrator_1.Count)(1),
            numChannels: (0, xrpa_orchestrator_1.Count)(1),
            channelIdx: (0, xrpa_orchestrator_1.Count)(0),
            srcNode: (0, xrpa_orchestrator_1.ReferenceTo)(ISignalNode),
        },
    }));
    (0, xrpa_orchestrator_1.ProgramInput)("SignalChannelStack", (0, xrpa_orchestrator_1.Collection)({
        interfaceType: ISignalNode,
        maxCount: 256,
        fields: {
            numOutputs: (0, xrpa_orchestrator_1.Count)(1),
            numChannels: (0, xrpa_orchestrator_1.Count)(1),
            srcNode0: (0, xrpa_orchestrator_1.ReferenceTo)(ISignalNode),
            srcNode1: (0, xrpa_orchestrator_1.ReferenceTo)(ISignalNode),
            srcNode2: (0, xrpa_orchestrator_1.ReferenceTo)(ISignalNode),
            srcNode3: (0, xrpa_orchestrator_1.ReferenceTo)(ISignalNode),
        },
    }));
    (0, xrpa_orchestrator_1.ProgramInput)("SignalCurve", (0, xrpa_orchestrator_1.Collection)({
        interfaceType: ISignalNode,
        maxCount: 256,
        fields: {
            numOutputs: (0, xrpa_orchestrator_1.Count)(1),
            softCurve: (0, xrpa_orchestrator_1.Boolean)(false),
            numSegments: (0, xrpa_orchestrator_1.Count)(1),
            startValue: xrpa_orchestrator_1.Scalar,
            segmentLength0: xrpa_orchestrator_1.Scalar,
            segmentEndValue0: xrpa_orchestrator_1.Scalar,
            segmentLength1: xrpa_orchestrator_1.Scalar,
            segmentEndValue1: xrpa_orchestrator_1.Scalar,
            segmentLength2: xrpa_orchestrator_1.Scalar,
            segmentEndValue2: xrpa_orchestrator_1.Scalar,
            segmentLength3: xrpa_orchestrator_1.Scalar,
            segmentEndValue3: xrpa_orchestrator_1.Scalar,
            segmentLength4: xrpa_orchestrator_1.Scalar,
            segmentEndValue4: xrpa_orchestrator_1.Scalar,
            segmentLength5: xrpa_orchestrator_1.Scalar,
            segmentEndValue5: xrpa_orchestrator_1.Scalar,
            startEvent: (0, xrpa_orchestrator_1.ReferenceTo)(SignalEvent),
            autoStart: (0, xrpa_orchestrator_1.Boolean)(true),
            onDoneEvent: (0, xrpa_orchestrator_1.ReferenceTo)(SignalEvent),
            autoLoop: (0, xrpa_orchestrator_1.Boolean)(false),
        },
    }));
    (0, xrpa_orchestrator_1.ProgramInput)("SignalDelay", (0, xrpa_orchestrator_1.Collection)({
        interfaceType: ISignalNode,
        maxCount: 256,
        fields: {
            numOutputs: (0, xrpa_orchestrator_1.Count)(1),
            numChannels: (0, xrpa_orchestrator_1.Count)(1),
            srcNode: (0, xrpa_orchestrator_1.ReferenceTo)(ISignalNode),
            delayTimeMs: xrpa_orchestrator_1.Scalar,
        },
    }));
    (0, xrpa_orchestrator_1.ProgramInput)("SignalFeedback", (0, xrpa_orchestrator_1.Collection)({
        interfaceType: ISignalNode,
        maxCount: 256,
        fields: {
            numOutputs: (0, xrpa_orchestrator_1.Count)(1),
            numChannels: (0, xrpa_orchestrator_1.Count)(1),
            srcNode: (0, xrpa_orchestrator_1.ReferenceTo)(ISignalNode),
        },
    }));
    (0, xrpa_orchestrator_1.ProgramInput)("SignalMathOp", (0, xrpa_orchestrator_1.Collection)({
        interfaceType: ISignalNode,
        maxCount: 256,
        fields: {
            numOutputs: (0, xrpa_orchestrator_1.Count)(1),
            numChannels: (0, xrpa_orchestrator_1.Count)(1),
            operation: (0, xrpa_orchestrator_1.Enum)("MathOperation", ["Add", "Multiply", "Subtract"]),
            operandA: xrpa_orchestrator_1.Scalar,
            operandANode: (0, xrpa_orchestrator_1.ReferenceTo)(ISignalNode),
            operandB: xrpa_orchestrator_1.Scalar,
            operandBNode: (0, xrpa_orchestrator_1.ReferenceTo)(ISignalNode),
        },
    }));
    (0, xrpa_orchestrator_1.ProgramInput)("SignalMultiplexer", (0, xrpa_orchestrator_1.Collection)({
        interfaceType: ISignalNode,
        maxCount: 256,
        fields: {
            numOutputs: (0, xrpa_orchestrator_1.Count)(1),
            numChannels: (0, xrpa_orchestrator_1.Count)(1),
            srcNode0: (0, xrpa_orchestrator_1.ReferenceTo)(ISignalNode),
            srcNode1: (0, xrpa_orchestrator_1.ReferenceTo)(ISignalNode),
            srcNode2: (0, xrpa_orchestrator_1.ReferenceTo)(ISignalNode),
            srcNode3: (0, xrpa_orchestrator_1.ReferenceTo)(ISignalNode),
            srcNode4: (0, xrpa_orchestrator_1.ReferenceTo)(ISignalNode),
            srcNode5: (0, xrpa_orchestrator_1.ReferenceTo)(ISignalNode),
            incrementEvent: (0, xrpa_orchestrator_1.ReferenceTo)(SignalEvent),
            startEvent: (0, xrpa_orchestrator_1.ReferenceTo)(SignalEvent),
            autoStart: (0, xrpa_orchestrator_1.Boolean)(true),
            onDoneEvent: (0, xrpa_orchestrator_1.ReferenceTo)(SignalEvent),
        },
    }));
    const FilterType = (0, xrpa_orchestrator_1.Enum)("FilterType", ["Bypass", "Peak", "LowShelf", "HighShelf", "LowPass", "HighPass", "BandPass"]);
    (0, xrpa_orchestrator_1.ProgramInput)("SignalParametricEqualizer", (0, xrpa_orchestrator_1.Collection)({
        interfaceType: ISignalNode,
        maxCount: 256,
        fields: {
            numOutputs: (0, xrpa_orchestrator_1.Count)(1),
            numChannels: (0, xrpa_orchestrator_1.Count)(1),
            srcNode: (0, xrpa_orchestrator_1.ReferenceTo)(ISignalNode),
            // band0
            filterType0: FilterType,
            frequency0: (0, xrpa_orchestrator_1.Scalar)(50),
            quality0: (0, xrpa_orchestrator_1.Scalar)(0.707106),
            gain0: (0, xrpa_orchestrator_1.Scalar)(0),
            // band1
            filterType1: FilterType,
            frequency1: (0, xrpa_orchestrator_1.Scalar)(50),
            quality1: (0, xrpa_orchestrator_1.Scalar)(0.707106),
            gain1: (0, xrpa_orchestrator_1.Scalar)(0),
            // band2
            filterType2: FilterType,
            frequency2: (0, xrpa_orchestrator_1.Scalar)(50),
            quality2: (0, xrpa_orchestrator_1.Scalar)(0.707106),
            gain2: (0, xrpa_orchestrator_1.Scalar)(0),
            // band3
            filterType3: FilterType,
            frequency3: (0, xrpa_orchestrator_1.Scalar)(50),
            quality3: (0, xrpa_orchestrator_1.Scalar)(0.707106),
            gain3: (0, xrpa_orchestrator_1.Scalar)(0),
            // band4
            filterType4: FilterType,
            frequency4: (0, xrpa_orchestrator_1.Scalar)(50),
            quality4: (0, xrpa_orchestrator_1.Scalar)(0.707106),
            gain4: (0, xrpa_orchestrator_1.Scalar)(0),
            // gain
            gainAdjust: (0, xrpa_orchestrator_1.Scalar)(0),
        },
    }));
    (0, xrpa_orchestrator_1.ProgramInput)("SignalPitchShift", (0, xrpa_orchestrator_1.Collection)({
        interfaceType: ISignalNode,
        maxCount: 256,
        fields: {
            numOutputs: (0, xrpa_orchestrator_1.Count)(1),
            numChannels: (0, xrpa_orchestrator_1.Count)(1),
            srcNode: (0, xrpa_orchestrator_1.ReferenceTo)(ISignalNode),
            pitchShiftSemitones: (0, xrpa_orchestrator_1.Count)(0),
        },
    }));
    (0, xrpa_orchestrator_1.ProgramInput)("SignalSoftClip", (0, xrpa_orchestrator_1.Collection)({
        interfaceType: ISignalNode,
        maxCount: 256,
        fields: {
            numOutputs: (0, xrpa_orchestrator_1.Count)(1),
            numChannels: (0, xrpa_orchestrator_1.Count)(1),
            srcNode: (0, xrpa_orchestrator_1.ReferenceTo)(ISignalNode),
        },
    }));
    const SampleType = (0, xrpa_orchestrator_1.Enum)("SampleType", ["Float", "SignedInt32", "UnsignedInt32"]);
    (0, xrpa_orchestrator_1.ProgramInput)("SignalOutputData", (0, xrpa_orchestrator_1.Collection)({
        maxCount: 64,
        fields: {
            srcNode: (0, xrpa_orchestrator_1.ReferenceTo)(ISignalNode),
            numChannels: (0, xrpa_orchestrator_1.Count)(1),
            sampleType: SampleType,
            samplesPerChannelPerSec: xrpa_orchestrator_1.Count,
            data: (0, xrpa_orchestrator_1.Output)(xrpa_orchestrator_1.Signal),
        },
    }));
    (0, xrpa_orchestrator_1.ProgramInput)("SignalOutputDevice", (0, xrpa_orchestrator_1.Collection)({
        maxCount: 64,
        fields: {
            srcNode: (0, xrpa_orchestrator_1.ReferenceTo)(ISignalNode),
            channelOffset: (0, xrpa_orchestrator_1.Count)(0),
            deviceNameFilter: (0, xrpa_orchestrator_1.String)("", "pseudo-regex, with just $ and ^ supported for now"),
            deviceHandednessFilter: (0, xrpa_orchestrator_1.Enum)("DeviceHandednessFilter", ["Any", "None", "Left", "Right"]),
            outputToSystemAudio: xrpa_orchestrator_1.Boolean,
            // TODO channelName, driverIdentifier, driverPort filters?
            foundMatch: (0, xrpa_orchestrator_1.Output)((0, xrpa_orchestrator_1.Boolean)(false, "Set to true if a matching device was found")),
        },
    }));
});
//# sourceMappingURL=SignalProcessingInterface.js.map
