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
exports.PitchShift = exports.BandPassFilter = exports.HighPassFilter = exports.LowPassFilter = exports.ParametricEqualizer = exports.Feedback = exports.Delay = exports.Sequence = exports.AudioStream = exports.AdsrEnvelope = exports.TrapezoidCurve = exports.ClickPulse = exports.RepeatAndStack = exports.StackChannels = exports.SelectChannel = exports.RouteToChannel = exports.SoftClip = exports.CustomWave = exports.WhiteNoise = exports.SquareWave = exports.TriangleWave = exports.SawtoothWave = exports.SineWave = exports.OutputDevice = void 0;
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
function CustomWave(params) {
    const waveShape = params.waveShape.slice().sort((a, b) => a.time - b.time);
    const startValue = waveShape[0].value;
    const endTime = waveShape[waveShape.length - 1].time;
    const timeScale = endTime === 0 ? 1 : (1 / (endTime * (params.frequency ?? 1)));
    let prevTime = 0;
    const segments = [];
    for (let i = 0; i < waveShape.length; i++) {
        const point = waveShape[i];
        const segmentDuration = point.time - prevTime;
        prevTime = point.time;
        if (segmentDuration === 0 && i === 0) {
            continue;
        }
        segments.push({
            endValue: point.value,
            timeLength: segmentDuration * timeScale,
        });
    }
    let node = new SignalProcessingTypes_1.SignalCurveType({
        softCurve: params.softShape ?? false,
        startValue,
        segments,
        autoLoop: true,
    });
    if (params.amplitude !== undefined && params.amplitude !== 1) {
        node = (0, MathOps_1.Multiply)(node, params.amplitude);
    }
    if (params.channelCount !== undefined && params.channelCount > 1) {
        node = RepeatAndStack(node, params.channelCount);
    }
    return node;
}
exports.CustomWave = CustomWave;
function SoftClip(node) {
    return new SignalProcessingTypes_1.SignalSoftClipType({
        source: node,
    });
}
exports.SoftClip = SoftClip;
function RouteToChannel(params) {
    return new SignalProcessingTypes_1.SignalChannelRouterType(params);
}
exports.RouteToChannel = RouteToChannel;
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
function RepeatAndStack(signal, count) {
    if (count <= 1) {
        return signal;
    }
    return StackChannels(signal, ...Array(count - 1).fill(signal));
}
exports.RepeatAndStack = RepeatAndStack;
function ClickPulse(params) {
    return new SignalProcessingTypes_1.SignalCurveType({
        startEvent: params.startEvent,
        startValue: 0,
        segments: [{
                endValue: 0,
                timeLength: params.preDelay ?? 0,
            }, {
                endValue: 1,
                timeLength: 0,
            }, {
                endValue: 1,
                timeLength: params.pulseWidth ?? 0.05,
            }, {
                endValue: 0,
                timeLength: 0,
            }],
    });
}
exports.ClickPulse = ClickPulse;
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
function Sequence(params) {
    // each element starts when its predecessor is done
    for (let i = 1; i < params.elements.length; ++i) {
        params.elements[i].setStartEvent(params.elements[i - 1].onDone());
    }
    // multiplexer needs to switch between the signal inputs when an input fires the done event
    const incrementEvent = new SignalProcessingTypes_1.SignalEventCombinerType({
        inputs: params.elements.map(value => value.onDone()),
    });
    // choose a single input to pipe to the output at a time
    const multiplexer = new SignalProcessingTypes_1.SignalMultiplexerType({
        inputs: params.elements,
        incrementEvent: incrementEvent,
    });
    if (params.loop || params.startEvent) {
        const events = [];
        if (params.loop) {
            events.push(multiplexer.onDone());
        }
        if (params.startEvent) {
            events.push(params.startEvent);
        }
        const startEvent = events.length > 1 ? (new SignalProcessingTypes_1.SignalEventCombinerType({
            inputs: events,
        })) : events[0];
        const autoStart = params.autoStart ?? !params.startEvent;
        params.elements[0].setStartEvent(startEvent, autoStart);
        multiplexer.setStartEvent(startEvent, autoStart);
    }
    return multiplexer;
}
exports.Sequence = Sequence;
function Delay(source, delayTimeMs) {
    return new SignalProcessingTypes_1.SignalDelayType({
        source,
        delayTimeMs,
    });
}
exports.Delay = Delay;
function Feedback() {
    return new SignalProcessingTypes_1.SignalFeedbackType();
}
exports.Feedback = Feedback;
// splits a multichannel signal up into subgroups to process in parallel, then recombines them into the same number of channels as the input
function parallelChannelProcessing(signal, maxChannelsPerProcess, process) {
    const numChannels = signal.getNumChannels();
    const splits = Math.ceil(numChannels / maxChannelsPerProcess);
    if (splits <= 1) {
        return process(signal);
    }
    const nodes = [];
    for (let i = 0; i < splits; i++) {
        const selectNode = new SignalProcessingTypes_1.SignalChannelSelectType({
            source: signal,
            channelIdx: i * maxChannelsPerProcess,
            numChannels: Math.min(numChannels - i * maxChannelsPerProcess, maxChannelsPerProcess),
        });
        nodes.push(process(selectNode));
    }
    return StackChannels(nodes[0], ...nodes.slice(1));
}
function ParametricEqualizer(params) {
    return parallelChannelProcessing(params.source, SignalProcessingTypes_1.SignalParametricEqualizerType.MAX_CHANNELS, (source) => new SignalProcessingTypes_1.SignalParametricEqualizerType({
        source,
        filters: params.filters,
        gainAdjust: params.gainAdjust,
    }));
}
exports.ParametricEqualizer = ParametricEqualizer;
function LowPassFilter(signal, cutoffFrequency) {
    return ParametricEqualizer({
        source: signal,
        filters: [{
                type: SignalProcessingTypes_1.FilterTypeEnum.LowPass,
                frequency: cutoffFrequency,
                q: 1,
                gain: 0,
            }],
    });
}
exports.LowPassFilter = LowPassFilter;
function HighPassFilter(signal, cutoffFrequency) {
    return ParametricEqualizer({
        source: signal,
        filters: [{
                type: SignalProcessingTypes_1.FilterTypeEnum.HighPass,
                frequency: cutoffFrequency,
                q: 1,
                gain: 0,
            }],
    });
}
exports.HighPassFilter = HighPassFilter;
function BandPassFilter(signal, centerFrequency, q = 6) {
    return ParametricEqualizer({
        source: signal,
        filters: [{
                type: SignalProcessingTypes_1.FilterTypeEnum.BandPass,
                frequency: centerFrequency,
                q,
                gain: 0,
            }],
    });
}
exports.BandPassFilter = BandPassFilter;
function PitchShift(signal, semitones) {
    return new SignalProcessingTypes_1.SignalPitchShiftType({
        source: signal,
        pitchShiftSemitones: semitones,
    });
}
exports.PitchShift = PitchShift;
//# sourceMappingURL=ProcessingNodes.js.map
