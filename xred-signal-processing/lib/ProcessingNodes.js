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

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioStream = exports.AdsrEnvelope = exports.TrapezoidCurve = exports.StackChannels = exports.SelectChannel = exports.SoftClip = exports.WhiteNoise = exports.SquareWave = exports.TriangleWave = exports.SawtoothWave = exports.SineWave = exports.SignalEvent = exports.OutputDevice = void 0;
const path = __importStar(require("path"));
const MathOps_1 = require("./MathOps");
const SignalProcessingTypes_1 = require("./SignalProcessingTypes");
function OutputDevice(params) {
    return new SignalProcessingTypes_1.SignalOutputDeviceType({
        source: params.source,
        deviceNameFilter: params.deviceName,
        channelOffset: params.channelOffset ?? 0,
    });
}
exports.OutputDevice = OutputDevice;
function SignalEvent() {
    return new SignalProcessingTypes_1.SignalEventType();
}
exports.SignalEvent = SignalEvent;
function SignalGen(params) {
    const fullParams = {
        channelCount: 1,
        frequency: 440,
        amplitude: 1,
        bias: 0,
        pulseWidth: 0.5,
        ...params,
    };
    return (0, MathOps_1.MultiplyAdd)(new SignalProcessingTypes_1.SignalOscillatorType({
        numChannels: fullParams.channelCount,
        waveformType: fullParams.waveformType,
        frequency: fullParams.frequency,
        pulseWidth: fullParams.pulseWidth,
    }), fullParams.amplitude, fullParams.bias);
}
function SineWave(params) {
    return SignalGen({
        waveformType: SignalProcessingTypes_1.WaveformTypeEnum.Sine,
        ...params,
    });
}
exports.SineWave = SineWave;
function SawtoothWave(params) {
    return SignalGen({
        waveformType: SignalProcessingTypes_1.WaveformTypeEnum.Sawtooth,
        ...params,
    });
}
exports.SawtoothWave = SawtoothWave;
function TriangleWave(params) {
    return SignalGen({
        waveformType: SignalProcessingTypes_1.WaveformTypeEnum.Triangle,
        ...params,
    });
}
exports.TriangleWave = TriangleWave;
function SquareWave(params) {
    return SignalGen({
        waveformType: SignalProcessingTypes_1.WaveformTypeEnum.Square,
        ...params,
    });
}
exports.SquareWave = SquareWave;
function WhiteNoise(params) {
    return SignalGen({
        waveformType: SignalProcessingTypes_1.WaveformTypeEnum.WhiteNoise,
        ...params,
    });
}
exports.WhiteNoise = WhiteNoise;
function SoftClip(node) {
    return new SignalProcessingTypes_1.SignalSoftClipType({
        source: node,
    });
}
exports.SoftClip = SoftClip;
function SelectChannel(signal, channelIdx) {
    return new SignalProcessingTypes_1.SignalChannelSelectType({
        source: signal,
        channelIdx,
    });
}
exports.SelectChannel = SelectChannel;
function StackChannels(signal0, ...otherSignals) {
    let node = signal0;
    for (let i = 0; i < otherSignals.length; i += 3) {
        node = new SignalProcessingTypes_1.SignalChannelStackType({
            sources: [node, otherSignals[i], otherSignals[i + 1], otherSignals[i + 2]],
        });
    }
    return node;
}
exports.StackChannels = StackChannels;
function TrapezoidCurve(params) {
    const fullParams = {
        softCurve: false,
        lowValue: 0,
        highValue: 1,
        initialHoldTime: 0,
        rampUpTime: 0.25,
        highHoldTime: 0.5,
        rampDownTime: 0.25,
        finalHoldTime: 0,
        ...params,
    };
    return new SignalProcessingTypes_1.SignalCurveType({
        softCurve: fullParams.softCurve,
        startValue: fullParams.lowValue,
        segments: [
            { endValue: fullParams.lowValue, timeLength: fullParams.initialHoldTime },
            { endValue: fullParams.highValue, timeLength: fullParams.rampUpTime },
            { endValue: fullParams.highValue, timeLength: fullParams.highHoldTime },
            { endValue: fullParams.lowValue, timeLength: fullParams.rampDownTime },
            { endValue: fullParams.lowValue, timeLength: fullParams.finalHoldTime },
        ],
        startEvent: params.startEvent,
        onDoneEvent: params.onDoneEvent,
    });
}
exports.TrapezoidCurve = TrapezoidCurve;
function AdsrEnvelope(params) {
    const fullParams = {
        attackTime: 0,
        decayTime: 0.25,
        sustainLevel: 0.8,
        sustainTime: 0.5,
        releaseTime: 0.25,
        ...params,
    };
    return new SignalProcessingTypes_1.SignalCurveType({
        startValue: 0,
        segments: [
            { endValue: 1, timeLength: fullParams.attackTime },
            { endValue: fullParams.sustainLevel, timeLength: fullParams.decayTime },
            { endValue: fullParams.sustainLevel, timeLength: fullParams.sustainTime },
            { endValue: 0, timeLength: fullParams.releaseTime },
        ],
        startEvent: params.startEvent,
        onDoneEvent: params.onDoneEvent,
    });
}
exports.AdsrEnvelope = AdsrEnvelope;
function AudioStream(filename, params) {
    return new SignalProcessingTypes_1.SignalSourceFileType({
        filePath: path.resolve(path.dirname(process.execPath), filename),
        autoPlay: params?.autoPlay ?? true,
        numChannels: params?.numChannels ?? 1,
    });
}
exports.AudioStream = AudioStream;
/*
export function LowPassFilter(signal: ISignalNodeType, cutoffFrequency: NumericValue): ISignalNodeType {
  return new SignalLowPassFilterType({
    source: signal,
    cutoffFrequency,
  });
}

export function PitchAdjust(signal: ISignalNodeType, pitchMultiplier: NumericValue): ISignalNodeType {
  return new SignalPitchAdjustType({
    source: signal,
    pitchMultiplier,
  });
}

export function SpatializeAudio(signal: ISignalNodeType, position: Vector3ParamType): ISignalNodeType {
  return new SignalAudioSpatializer({
    source: signal,
    position,
  });
}
*/
//# sourceMappingURL=ProcessingNodes.js.map
