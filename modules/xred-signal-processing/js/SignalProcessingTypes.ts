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


import assert from "assert";
import {
  Count,
  Distance,
  Instantiate,
  ObjectField,
  Scalar,
  XrpaDataflowConnection,
  XrpaDataflowForeignObjectInstantiation,
  XrpaDataflowGraphNode,
  XrpaFieldValue,
  XrpaProgramParam,
  bindExternalProgram,
  isDataflowForeignObjectInstantiation,
  isXrpaProgramParam,
} from "@xrpa/xrpa-orchestrator";

import { XredSignalProcessingInterface } from "./SignalProcessingInterface";

export interface AcceptsStartEvent {
  setStartEvent(ev: FiresEvent | null, autoStart?: boolean): void;
}

export interface FiresDoneEvent {
  onDone(): SignalEventType;
}

export interface FiresEvent {
  onEvent(): SignalEventType;
}

export type NonSignalNumericValue =
  | XrpaProgramParam<ReturnType<typeof Count>>
  | XrpaProgramParam<ReturnType<typeof Scalar>>
  | XrpaProgramParam<ReturnType<typeof Distance>>
  | number
  ;

export type NumericValue = NonSignalNumericValue | ISignalNodeType;

type SPFieldValue = Exclude<XrpaFieldValue, XrpaDataflowGraphNode> | SPNode;

export function isSPNode(node: unknown): node is SPNode {
  return typeof node === "object" && node !== null && "__isSPNode" in node;
}

export function isISignalNodeType(node: unknown): node is ISignalNodeType {
  return typeof node === "object" && node !== null && "__isISignalNodeType" in node;
}

export function isSignalEventType(node: unknown): node is SignalEventType {
  return typeof node === "object" && node !== null && "__isSignalEventType" in node;
}

class SPNode {
  __isSPNode = true;
  dataflowNode: XrpaDataflowForeignObjectInstantiation;
  protected fieldValues: Record<string, SPFieldValue> = {};

  constructor(
    public readonly type: string,
    isBuffered = false,
  ) {
    const dataflowNode = Instantiate(
      [bindExternalProgram(XredSignalProcessingInterface), type],
      {},
    );
    assert(isDataflowForeignObjectInstantiation(dataflowNode));
    dataflowNode.isBuffered = isBuffered;
    this.dataflowNode = dataflowNode;
  }

  private setFieldValueInternal(fieldName: string, value: SPFieldValue) {
    this.fieldValues[fieldName] = value;
    if (isSPNode(value)) {
      this.dataflowNode.fieldValues[fieldName] = value.dataflowNode;
    } else {
      this.dataflowNode.fieldValues[fieldName] = value;
    }
  }

  setField(fieldName: string, value: SPFieldValue) {
    this.setFieldValueInternal(fieldName, value);
    if (isISignalNodeType(value)) {
      value.incrementOutputCount();
    }
  }

  setNumericField(fieldName: string, nodeFieldName: string | null, value: NumericValue | undefined) {
    if (value === undefined) {
      return;
    }
    if (isXrpaProgramParam(value)) {
      this.setFieldValueInternal(fieldName, value);
    } else if (isISignalNodeType(value)) {
      assert(nodeFieldName);
      this.setFieldValueInternal(nodeFieldName, value);
      value.incrementOutputCount();
    } else {
      this.setFieldValueInternal(fieldName, value);
    }
  }

  setEventField(fieldName: string, value: SignalEventType | undefined) {
    if (value === undefined) {
      return;
    }
    this.setFieldValueInternal(fieldName, value);

    if (value.extraDependency) {
      for (let i = 0; i < 100; ++i) {
        const depFieldName = `eventDependency${i}`;
        if (!(depFieldName in this.fieldValues)) {
          this.setFieldValueInternal(depFieldName, value.extraDependency);
          break;
        }
      }
    }
  }

  getOrCreateEventField(fieldName: string, eventDependency?: SPNode): SignalEventType {
    const existing = this.fieldValues[fieldName];
    if (isSignalEventType(existing)) {
      return existing;
    }

    const ev = new SignalEventType();
    this.setEventField(fieldName, ev);
    if (eventDependency) {
      ev.extraDependency = eventDependency;
    }
    return ev;
  }

  setStartEventField(startEvent: SignalEventType | undefined, autoStart: boolean | undefined) {
    this.setEventField("startEvent", startEvent);
    this.setField("autoStart", startEvent ? (autoStart ?? false) : true);
  }
}

///////////////////////////////////////////////////////////////////////////////

export enum WaveformTypeEnum {
  Sawtooth = 0,
  Square = 1,
  Triangle = 2,
  Sine = 3,
  WhiteNoise = 4,
}

export enum MathOperationEnum {
  Add = 0,
  Multiply = 1,
  Subtract = 2,
}

export enum DeviceHandednessFilterEnum {
  Any = 0,
  None = 1,
  Left = 2,
  Right = 3,
}

export enum EventCombinerParameterMode {
  Passthrough = 0,
  SrcIndex = 1,
  Constant = 2,
}

export enum FilterTypeEnum {
  Bypass = 0,
  Peak = 1,
  LowShelf = 2,
  HighShelf = 3,
  LowPass = 4,
  HighPass = 5,
  BandPass = 6,
}

export class SignalEventType extends SPNode implements FiresEvent {
  __isSignalEventType = true;
  extraDependency: SPNode | null = null;

  // FUTURE: readonly onEvent = new XrpaMessage({});
  constructor(
    // FUTURE: readonly sendEvent?: XrpaMessage,
  ) {
    super("SignalEvent");
  }

  onEvent(): SignalEventType {
    return this;
  }
}

export class SignalEventCombinerType extends SPNode implements FiresEvent {
  static MAX_INPUTS = 6;

  constructor(params: {
    inputs: Array<FiresEvent>,
    parameterMode?: EventCombinerParameterMode;
  }) {
    super("SignalEventCombiner");
    if (params.inputs.length > SignalEventCombinerType.MAX_INPUTS) {
      throw new Error("SignalEventCombinerType: too many inputs (" + params.inputs.length + " > " + SignalEventCombinerType.MAX_INPUTS + ")");
    }
    for (let i = 0; i < SignalEventCombinerType.MAX_INPUTS; i++) {
      this.setEventField("srcEvent" + i, params.inputs[i]?.onEvent());
    }
    this.setField("parameterMode", params.parameterMode);
  }

  onEvent(): SignalEventType {
    return this.getOrCreateEventField("onEvent", this);
  }
}

export class ISignalNodeType extends SPNode {
  __isISignalNodeType = true;
  protected numOutputs = 0;
  protected numOutputChannels = 0;

  public incrementOutputCount() {
    this.numOutputs++;
    this.setField("numOutputs", this.numOutputs);
  }

  public getNumChannels() {
    return this.numOutputChannels;
  }

  protected setOutputChannelsPassthrough(source: ISignalNodeType) {
    this.numOutputChannels = source.numOutputChannels;
  }

  protected setOutputChannelsToMaxInputChannels() {
    this.numOutputChannels = 0;
    for (const key in this.fieldValues) {
      const value = this.fieldValues[key];
      if (isISignalNodeType(value)) {
        this.numOutputChannels = Math.max(this.numOutputChannels, value.numOutputChannels);
      }
    }
  }

  protected setOutputChannelsToSumInputChannels() {
    this.numOutputChannels = 0;
    for (const key in this.fieldValues) {
      const value = this.fieldValues[key];
      if (isISignalNodeType(value)) {
        this.numOutputChannels += value.numOutputChannels;
      }
    }
  }
}

export class SignalSourceType extends ISignalNodeType {
  constructor(params: {
    numChannels: number;
    signal: XrpaDataflowConnection;
  }) {
    super("SignalSource");

    this.setField("numChannels", params.numChannels);
    this.setField("srcData", params.signal);
    this.numOutputChannels = params.numChannels;
  }
}

export class SignalSourceFileType extends ISignalNodeType {
  constructor(params: {
    filePath: string;
    autoPlay: boolean;
    numChannels: number;
  }) {
    super("SignalSourceFile");
    this.setField("filePath", params.filePath);
    this.setField("autoPlay", params.autoPlay);

    // note: there is no way to verify this is correct
    this.numOutputChannels = params.numChannels;
  }
}

export class SignalOscillatorType extends ISignalNodeType {
  constructor(params: {
    numChannels: number;
    waveformType: WaveformTypeEnum;
    frequency?: NumericValue;
    pulseWidth?: NumericValue;
  }) {
    super("SignalOscillator");
    this.setField("numChannels", params.numChannels);
    this.setField("waveformType", params.waveformType);
    this.setNumericField("frequency", "frequencyNode", params.frequency);
    this.setNumericField("pulseWidth", "pulseWidthNode", params.pulseWidth);
    this.numOutputChannels = params.numChannels;
  }
}

// routes a single input channel into a multi-channel output, panning between channels if a fractional value is provided
export class SignalChannelRouterType extends ISignalNodeType {
  constructor(params: {
    source: ISignalNodeType;
    channelSelect: NumericValue;
    numOutputChannels: number;
  }) {
    super("SignalChannelRouter");
    this.setField("srcNode", params.source);
    this.setNumericField("channelSelect", "channelSelectNode", params.channelSelect);
    this.numOutputChannels = params.numOutputChannels;
    this.setField("numChannels", this.numOutputChannels);
  }
}

// selects/extracts a subset of channels from an input signal
export class SignalChannelSelectType extends ISignalNodeType {
  constructor(params: {
    source: ISignalNodeType;
    channelIdx: NonSignalNumericValue;
    numChannels?: number;
  }) {
    super("SignalChannelSelect");
    this.setField("srcNode", params.source);
    this.setField("channelIdx", params.channelIdx);
    this.numOutputChannels = params.numChannels ?? 1;
    this.setField("numChannels", this.numOutputChannels);
  }
}

// stacks multiple input signals into a single multi-channel output signal
export class SignalChannelStackType extends ISignalNodeType {
  constructor(params: {
    sources: [ISignalNodeType] |
    [ISignalNodeType, ISignalNodeType] |
    [ISignalNodeType, ISignalNodeType, ISignalNodeType] |
    [ISignalNodeType, ISignalNodeType, ISignalNodeType, ISignalNodeType];
  }) {
    super("SignalChannelStack");
    for (let i = 0; i < 4; i++) {
      this.setField("srcNode" + i, params.sources[i]);
    }
    this.setOutputChannelsToSumInputChannels();
    this.setField("numChannels", this.numOutputChannels);
  }
}

export class SignalCurveType extends ISignalNodeType implements AcceptsStartEvent, FiresDoneEvent {
  static MAX_SEGMENTS = 6;
  constructor(params: {
    softCurve?: boolean;
    startValue: NonSignalNumericValue;
    segments: Array<{ timeLength: NonSignalNumericValue, endValue: NonSignalNumericValue }>;
    startEvent?: FiresEvent;
    autoStart?: boolean;
    autoLoop?: boolean;
  }) {
    super("SignalCurve");
    if (params.segments.length > SignalCurveType.MAX_SEGMENTS) {
      throw new Error("SignalCurveType: too many segments (" + params.segments.length + " > " + SignalCurveType.MAX_SEGMENTS + ")");
    }

    this.setField("softCurve", params.softCurve ?? false);
    this.setField("numSegments", Math.min(SignalCurveType.MAX_SEGMENTS, params.segments.length));
    this.setField("startValue", params.startValue);

    for (let i = 0; i < SignalCurveType.MAX_SEGMENTS; i++) {
      this.setField("segmentLength" + i, params.segments[i]?.timeLength);
      this.setField("segmentEndValue" + i, params.segments[i]?.endValue);
    }

    this.setStartEventField(params.startEvent?.onEvent(), params.autoStart);
    this.setField("autoLoop", params.autoLoop ?? false);

    this.numOutputChannels = 1;
  }

  setStartEvent(ev: FiresEvent | null, autoStart?: boolean) {
    this.setStartEventField(ev?.onEvent(), autoStart);
  }

  onDone(): SignalEventType {
    return this.getOrCreateEventField("onDoneEvent");
  }
}

export class SignalDelayType extends ISignalNodeType {
  constructor(params: {
    source: ISignalNodeType;
    delayTimeMs: NonSignalNumericValue;
  }) {
    super("SignalDelay");
    this.setField("srcNode", params.source);
    this.setNumericField("delayTimeMs", null, params.delayTimeMs);
    this.setOutputChannelsPassthrough(params.source);
    this.setField("numChannels", this.numOutputChannels);
  }
}

export class SignalFeedbackType extends ISignalNodeType {
  constructor() {
    super("SignalFeedback", true);
  }

  setSource(source: ISignalNodeType) {
    this.setField("srcNode", source);
    this.setOutputChannelsPassthrough(source);
    this.setField("numChannels", this.numOutputChannels);
  }
}

export class SignalParametricEqualizerType extends ISignalNodeType {
  static MAX_FILTERS = 5;
  static MAX_CHANNELS = 2;

  constructor(params: {
    source: ISignalNodeType;
    filters: Array<{
      type: FilterTypeEnum;
      frequency: NonSignalNumericValue;
      q: NonSignalNumericValue;
      gain: NonSignalNumericValue;
    }>;
    gainAdjust?: NonSignalNumericValue;
  }) {
    super("SignalParametricEqualizer");

    if (params.filters.length > SignalParametricEqualizerType.MAX_FILTERS) {
      throw new Error("SignalParametricEqualizerType: too many filters (" + params.filters.length + " > " + SignalParametricEqualizerType.MAX_FILTERS + ")");
    }

    this.setField("srcNode", params.source);
    for (let i = 0; i < SignalParametricEqualizerType.MAX_FILTERS; i++) {
      this.setField("filterType" + i, params.filters[i]?.type ?? FilterTypeEnum.Bypass);
      this.setField("frequency" + i, params.filters[i]?.frequency ?? 50);
      this.setField("quality" + i, params.filters[i]?.q ?? 0.7076);
      this.setField("gain" + i, params.filters[i]?.gain ?? 0);
    }
    this.setField("gainAdjust", params.gainAdjust ?? 0);
    this.setOutputChannelsPassthrough(params.source);
    this.setField("numChannels", this.numOutputChannels);
  }
}

export class SignalMathOpType extends ISignalNodeType {
  constructor(params: {
    operation: MathOperationEnum;
    operandA: NumericValue;
    operandB: NumericValue;
  }) {
    super("SignalMathOp");
    this.setField("operation", params.operation);
    this.setNumericField("operandA", "operandANode", params.operandA);
    this.setNumericField("operandB", "operandBNode", params.operandB);
    this.setOutputChannelsToMaxInputChannels();
    this.setField("numChannels", this.numOutputChannels);
  }
}

export class SignalMultiplexerType extends ISignalNodeType implements AcceptsStartEvent, FiresDoneEvent {
  static MAX_INPUTS = 6;

  constructor(params: {
    inputs: Array<ISignalNodeType>,
    incrementEvent?: FiresEvent;
    startEvent?: FiresEvent;
    autoStart?: boolean;
  }) {
    super("SignalMultiplexer");
    if (params.inputs.length > SignalMultiplexerType.MAX_INPUTS) {
      throw new Error("SignalMultiplexerType: too many inputs (" + params.inputs.length + " > " + SignalMultiplexerType.MAX_INPUTS + ")");
    }

    for (let i = 0; i < SignalMultiplexerType.MAX_INPUTS; i++) {
      this.setField("srcNode" + i, params.inputs[i]);
    }

    this.setEventField("incrementEvent", params.incrementEvent?.onEvent());
    this.setStartEventField(params.startEvent?.onEvent(), params.autoStart);

    this.setOutputChannelsToMaxInputChannels();
    this.setField("numChannels", this.numOutputChannels);
  }

  setStartEvent(ev: FiresEvent | null, autoStart?: boolean) {
    this.setStartEventField(ev?.onEvent(), autoStart);
  }

  onDone(): SignalEventType {
    return this.getOrCreateEventField("onDoneEvent");
  }
}

export class SignalPitchShiftType extends ISignalNodeType {
  constructor(params: {
    source: ISignalNodeType;
    pitchShiftSemitones: NonSignalNumericValue;
  }) {
    super("SignalPitchShift");
    this.setField("srcNode", params.source);
    this.setNumericField("pitchShiftSemitones", null, params.pitchShiftSemitones);
    this.setOutputChannelsPassthrough(params.source);
    this.setField("numChannels", this.numOutputChannels);

    if (this.numOutputChannels > 2) {
      throw new Error("SignalPitchShift: too many channels (" + this.numOutputChannels + " > 2)");
    }
  }
}

export class SignalSoftClipType extends ISignalNodeType {
  constructor(params: {
    source: ISignalNodeType;
  }) {
    super("SignalSoftClip");
    this.setField("srcNode", params.source);
    this.setOutputChannelsPassthrough(params.source);
    this.setField("numChannels", this.numOutputChannels);
  }
}

export class SignalOutputDataType extends SPNode {
  readonly data: XrpaDataflowConnection;

  constructor(params: {
    source: ISignalNodeType;
    frameRate: NonSignalNumericValue;
  }) {
    super("SignalOutputData");

    this.setField("srcNode", params.source);
    this.setField("numChannels", params.source.getNumChannels());
    this.setField("frameRate", params.frameRate);

    this.data = ObjectField(this.dataflowNode, "data");
  }
}

export class SignalOutputDeviceType extends SPNode {
  // FUTURE: readonly foundMatch = new XrpaBool(false);

  constructor(params: {
    source: ISignalNodeType;
    deviceNameFilter?: string;
    outputToSystemAudio?: boolean;
    channelOffset?: NonSignalNumericValue;
  }) {
    super("SignalOutputDevice");
    this.setField("srcNode", params.source);
    this.setField("deviceNameFilter", params.deviceNameFilter);
    this.setField("outputToSystemAudio", params.outputToSystemAudio);
    this.setField("channelOffset", params.channelOffset);
  }
}
