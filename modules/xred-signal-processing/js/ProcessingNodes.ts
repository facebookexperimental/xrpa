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


import * as path from "path";
import { SelfTerminateOn, XrpaDataflowConnection } from "@xrpa/xrpa-orchestrator";
import { StringFilter } from "@xrpa/xrpa-utils";

import { Multiply, MultiplyAdd } from "./MathOps";
import {
  AcceptsStartEvent,
  FilterTypeEnum,
  FiresDoneEvent,
  FiresEvent,
  ISignalNodeType,
  NonSignalNumericValue,
  NumericValue,
  SignalChannelRouterType,
  SignalChannelSelectType,
  SignalChannelStackType,
  SignalCurveType,
  SignalDelayType,
  SignalEventCombinerType,
  SignalFeedbackType,
  SignalMultiplexerType,
  SignalOscillatorType,
  SignalOutputDataType,
  SignalOutputDeviceType,
  SignalParametricEqualizerType,
  SignalPitchShiftType,
  SignalSoftClipType,
  SignalSourceType,
  SignalSourceFileType,
  WaveformTypeEnum,
} from "./SignalProcessingTypes";

export function OutputSignal(params: {
  source: ISignalNodeType;
  frameRate: NonSignalNumericValue;
}) {
  const node = new SignalOutputDataType({
    source: params.source,
    frameRate: params.frameRate,
  });
  return node.data;
}

export function OutputToDevice(params: {
  deviceName: StringFilter;
  source: ISignalNodeType;
  channelOffset?: number;
}) {
  return new SignalOutputDeviceType({
    source: params.source,
    deviceNameFilter: params.deviceName as unknown as string,
    channelOffset: params.channelOffset ?? 0,
  });
}

export function OutputToSystemAudio(params: {
  source: ISignalNodeType;
  channelOffset?: number;
}) {
  return new SignalOutputDeviceType({
    source: params.source,
    outputToSystemAudio: true,
    channelOffset: params.channelOffset ?? 0,
  });
}

export function DoneWhen(done: FiresEvent) {
  SelfTerminateOn({
    targetNode: done.onEvent().dataflowNode,
    targetPort: "receiveEvent",
  });
}

function SignalGen(params: {
  waveformType: WaveformTypeEnum;
  channelCount?: number;
  frequency?: NumericValue;
  amplitude?: NumericValue;
  bias?: NumericValue;
  pulseWidth?: NumericValue;
}): ISignalNodeType {
  const fullParams = {
    channelCount: 1,
    frequency: 440,
    amplitude: 1,
    bias: 0,
    pulseWidth: 0.5,
    ...params,
  };

  return MultiplyAdd(new SignalOscillatorType({
    numChannels: fullParams.channelCount,
    waveformType: fullParams.waveformType,
    frequency: fullParams.frequency,
    pulseWidth: fullParams.pulseWidth,
  }), fullParams.amplitude, fullParams.bias);
}

export function SineWave(params: {
  channelCount?: number;
  frequency?: NumericValue;
  amplitude?: NumericValue;
  bias?: NumericValue;
}): ISignalNodeType {
  return SignalGen({
    waveformType: WaveformTypeEnum.Sine,
    ...params,
  });
}

export function SawtoothWave(params: {
  channelCount?: number;
  frequency?: NumericValue;
  amplitude?: NumericValue;
  bias?: NumericValue;
}): ISignalNodeType {
  return SignalGen({
    waveformType: WaveformTypeEnum.Sawtooth,
    ...params,
  });
}

export function TriangleWave(params: {
  channelCount?: number;
  frequency?: NumericValue;
  amplitude?: NumericValue;
  bias?: NumericValue;
}): ISignalNodeType {
  return SignalGen({
    waveformType: WaveformTypeEnum.Triangle,
    ...params,
  });
}

export function SquareWave(params: {
  channelCount?: number;
  frequency?: NumericValue;
  pulseWidth?: NumericValue;
  amplitude?: NumericValue;
  bias?: NumericValue;
}): ISignalNodeType {
  return SignalGen({
    waveformType: WaveformTypeEnum.Square,
    ...params,
  });
}

export function WhiteNoise(params: {
  channelCount?: number;
  amplitude?: NumericValue;
  bias?: NumericValue;
}): ISignalNodeType {
  return SignalGen({
    waveformType: WaveformTypeEnum.WhiteNoise,
    ...params,
  });
}

export function CustomWave(params: {
  channelCount?: number;
  frequency?: number;
  amplitude?: number;
  waveShape: Array<{
    time: number;
    value: number;
  }>;
  softShape?: boolean;
}): ISignalNodeType {
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

  let node: ISignalNodeType = new SignalCurveType({
    softCurve: params.softShape ?? false,
    startValue,
    segments,
    autoLoop: true,
  });

  if (params.amplitude !== undefined && params.amplitude !== 1) {
    node = Multiply(node, params.amplitude);
  }

  if (params.channelCount !== undefined && params.channelCount > 1) {
    node = RepeatAndStack(node, params.channelCount);
  }

  return node;
}

export function SoftClip(node: ISignalNodeType): ISignalNodeType {
  return new SignalSoftClipType({
    source: node,
  });
}

export function RouteToChannel(params: {
  source: ISignalNodeType;
  channelSelect: NumericValue;
  numOutputChannels: number;
}): ISignalNodeType {
  return new SignalChannelRouterType(params);
}

export function SelectChannel(signal: ISignalNodeType, channelIdx: number): ISignalNodeType {
  return new SignalChannelSelectType({
    source: signal,
    channelIdx,
  });
}

export function StackChannels(signal0: ISignalNodeType, ...otherSignals: ISignalNodeType[]): ISignalNodeType {
  let node = signal0;
  for (let i = 0; i < otherSignals.length; i += 3) {
    node = new SignalChannelStackType({
      sources: [node, otherSignals[i], otherSignals[i + 1], otherSignals[i + 2]],
    });
  }
  return node;
}

export function RepeatAndStack(signal: ISignalNodeType, count: number): ISignalNodeType {
  if (count <= 1) {
    return signal;
  }
  return StackChannels(signal, ...Array(count - 1).fill(signal));
}

export function ClickPulse(params: {
  preDelay?: NonSignalNumericValue;
  pulseWidth?: NonSignalNumericValue;
  startEvent?: FiresEvent;
}): SignalCurveType {
  return new SignalCurveType({
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

export function TrapezoidCurve(params: {
  softCurve?: boolean;

  lowValue?: NonSignalNumericValue;
  highValue?: NonSignalNumericValue;

  initialHoldTime?: NonSignalNumericValue;
  rampUpTime?: NonSignalNumericValue;
  highHoldTime?: NonSignalNumericValue;
  rampDownTime?: NonSignalNumericValue;
  finalHoldTime?: NonSignalNumericValue;

  startEvent?: FiresEvent;
}) {
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
  return new SignalCurveType({
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

export function AdsrEnvelope(params: {
  attackTime?: NonSignalNumericValue;
  decayTime?: NonSignalNumericValue;
  sustainLevel?: NonSignalNumericValue;
  sustainTime?: NonSignalNumericValue;
  releaseTime?: NonSignalNumericValue;

  startEvent?: FiresEvent;
}) {
  const fullParams = {
    attackTime: 0,
    decayTime: 0.25,
    sustainLevel: 0.8,
    sustainTime: 0.5,
    releaseTime: 0.25,
    ...params,
  };
  return new SignalCurveType({
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

export function SignalStream(params: {
  numChannels: number;
  signal: XrpaDataflowConnection;
}): ISignalNodeType {
  return new SignalSourceType(params);
}

export function AudioStream(filename: string, params?: { autoPlay?: boolean, numChannels?: number }): ISignalNodeType {
  return new SignalSourceFileType({
    filePath: path.resolve(path.dirname(process.execPath), filename),
    autoPlay: params?.autoPlay ?? true,
    numChannels: params?.numChannels ?? 1,
  });
}

export function Sequence(params: {
  elements: Array<ISignalNodeType & AcceptsStartEvent & FiresDoneEvent>;
  // TODO holdLastValue?: boolean;
  loop?: boolean;
  startEvent?: FiresEvent;
  autoStart?: boolean;
}): ISignalNodeType & FiresDoneEvent {
  // each element starts when its predecessor is done
  for (let i = 1; i < params.elements.length; ++i) {
    params.elements[i].setStartEvent(params.elements[i - 1].onDone());
  }

  // multiplexer needs to switch between the signal inputs when an input fires the done event
  const incrementEvent = new SignalEventCombinerType({
    inputs: params.elements.map(value => value.onDone()),
  });

  // choose a single input to pipe to the output at a time
  const multiplexer = new SignalMultiplexerType({
    inputs: params.elements,
    incrementEvent: incrementEvent,
  });

  if (params.loop || params.startEvent) {
    const events: FiresEvent[] = [];
    if (params.loop) {
      events.push(multiplexer.onDone());
    }
    if (params.startEvent) {
      events.push(params.startEvent);
    }
    const startEvent = events.length > 1 ? (new SignalEventCombinerType({
      inputs: events,
    })) : events[0];

    const autoStart = params.autoStart ?? !params.startEvent;
    params.elements[0].setStartEvent(startEvent, autoStart);
    multiplexer.setStartEvent(startEvent, autoStart);
  }

  return multiplexer;
}

export function Delay(source: ISignalNodeType, delayTimeMs: NonSignalNumericValue): ISignalNodeType {
  return new SignalDelayType({
    source,
    delayTimeMs,
  });
}

export function Feedback() {
  return new SignalFeedbackType();
}

// splits a multichannel signal up into subgroups to process in parallel, then recombines them into the same number of channels as the input
function parallelChannelProcessing(signal: ISignalNodeType, maxChannelsPerProcess: number, process: (signal: ISignalNodeType) => ISignalNodeType): ISignalNodeType {
  const numChannels = signal.getNumChannels();
  const splits = Math.ceil(numChannels / maxChannelsPerProcess);
  if (splits <= 1) {
    return process(signal);
  }

  const nodes: ISignalNodeType[] = [];
  for (let i = 0; i < splits; i++) {
    const selectNode = new SignalChannelSelectType({
      source: signal,
      channelIdx: i * maxChannelsPerProcess,
      numChannels: Math.min(numChannels - i * maxChannelsPerProcess, maxChannelsPerProcess),
    });
    nodes.push(process(selectNode));
  }
  return StackChannels(nodes[0], ...nodes.slice(1));
}

export function ParametricEqualizer(params: {
  source: ISignalNodeType;
  filters: Array<{
    type: FilterTypeEnum;
    frequency: NonSignalNumericValue;
    q: NonSignalNumericValue;
    gain: NonSignalNumericValue;
  }>;
  gainAdjust?: NonSignalNumericValue;
}): ISignalNodeType {
  return parallelChannelProcessing(params.source, SignalParametricEqualizerType.MAX_CHANNELS, (source: ISignalNodeType) => new SignalParametricEqualizerType({
    source,
    filters: params.filters,
    gainAdjust: params.gainAdjust,
  }));
}

export function LowPassFilter(signal: ISignalNodeType, cutoffFrequency: NonSignalNumericValue): ISignalNodeType {
  return ParametricEqualizer({
    source: signal,
    filters: [{
      type: FilterTypeEnum.LowPass,
      frequency: cutoffFrequency,
      q: 1,
      gain: 0,
    }],
  });
}

export function HighPassFilter(signal: ISignalNodeType, cutoffFrequency: NonSignalNumericValue): ISignalNodeType {
  return ParametricEqualizer({
    source: signal,
    filters: [{
      type: FilterTypeEnum.HighPass,
      frequency: cutoffFrequency,
      q: 1,
      gain: 0,
    }],
  });
}

export function BandPassFilter(signal: ISignalNodeType, centerFrequency: NonSignalNumericValue, q: NonSignalNumericValue = 6): ISignalNodeType {
  return ParametricEqualizer({
    source: signal,
    filters: [{
      type: FilterTypeEnum.BandPass,
      frequency: centerFrequency,
      q,
      gain: 0,
    }],
  });
}

export function PitchShift(signal: ISignalNodeType, semitones: NonSignalNumericValue): ISignalNodeType {
  return new SignalPitchShiftType({
    source: signal,
    pitchShiftSemitones: semitones,
  });
}
