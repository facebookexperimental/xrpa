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


import { Count, Distance, Scalar, XrpaDataflowConnection, XrpaDataflowForeignObjectInstantiation, XrpaDataflowGraphNode, XrpaFieldValue, XrpaProgramParam } from "@xrpa/xrpa-orchestrator";
export interface AcceptsStartEvent {
    setStartEvent(ev: FiresEvent | null, autoStart?: boolean): void;
}
export interface FiresDoneEvent {
    onDone(): SignalEventType;
}
export interface FiresEvent {
    onEvent(): SignalEventType;
}
export type NonSignalNumericValue = XrpaProgramParam<ReturnType<typeof Count>> | XrpaProgramParam<ReturnType<typeof Scalar>> | XrpaProgramParam<ReturnType<typeof Distance>> | number;
export type NumericValue = NonSignalNumericValue | ISignalNodeType;
type SPFieldValue = Exclude<XrpaFieldValue, XrpaDataflowGraphNode> | SPNode;
declare class SPNode {
    readonly type: string;
    dataflowNode: XrpaDataflowForeignObjectInstantiation;
    protected fieldValues: Record<string, SPFieldValue>;
    constructor(type: string, isBuffered?: boolean);
    private setFieldValueInternal;
    setField(fieldName: string, value: SPFieldValue): void;
    setNumericField(fieldName: string, nodeFieldName: string | null, value: NumericValue | undefined): void;
    setEventField(fieldName: string, value: SignalEventType | undefined): void;
    getOrCreateEventField(fieldName: string, eventDependency?: SPNode): SignalEventType;
    setStartEventField(startEvent: SignalEventType | undefined, autoStart: boolean | undefined): void;
}
export declare enum WaveformTypeEnum {
    Sawtooth = 0,
    Square = 1,
    Triangle = 2,
    Sine = 3,
    WhiteNoise = 4
}
export declare enum MathOperationEnum {
    Add = 0,
    Multiply = 1,
    Subtract = 2
}
export declare enum SampleTypeEnum {
    Float = 0,
    SignedInt32 = 1,
    UnsignedInt32 = 2
}
export declare enum DeviceHandednessFilterEnum {
    Any = 0,
    None = 1,
    Left = 2,
    Right = 3
}
export declare enum EventCombinerParameterMode {
    Passthrough = 0,
    SrcIndex = 1,
    Constant = 2
}
export declare enum FilterTypeEnum {
    Bypass = 0,
    Peak = 1,
    LowShelf = 2,
    HighShelf = 3,
    LowPass = 4,
    HighPass = 5,
    BandPass = 6
}
export declare class SignalEventType extends SPNode implements FiresEvent {
    extraDependency: SPNode | null;
    constructor();
    onEvent(): SignalEventType;
}
export declare class SignalEventCombinerType extends SPNode implements FiresEvent {
    static MAX_INPUTS: number;
    constructor(params: {
        inputs: Array<FiresEvent>;
        parameterMode?: EventCombinerParameterMode;
    });
    onEvent(): SignalEventType;
}
export declare class ISignalNodeType extends SPNode {
    protected numOutputs: number;
    protected numOutputChannels: number;
    incrementOutputCount(): void;
    getNumChannels(): number;
    protected setOutputChannelsPassthrough(source: ISignalNodeType): void;
    protected setOutputChannelsToMaxInputChannels(): void;
    protected setOutputChannelsToSumInputChannels(): void;
}
export declare class SignalSourceType extends ISignalNodeType {
    constructor(params: {
        numChannels: number;
        signal: XrpaDataflowConnection;
    });
}
export declare class SignalSourceFileType extends ISignalNodeType {
    constructor(params: {
        filePath: string;
        autoPlay: boolean;
        numChannels: number;
    });
}
export declare class SignalOscillatorType extends ISignalNodeType {
    constructor(params: {
        numChannels: number;
        waveformType: WaveformTypeEnum;
        frequency?: NumericValue;
        pulseWidth?: NumericValue;
    });
}
export declare class SignalChannelRouterType extends ISignalNodeType {
    constructor(params: {
        source: ISignalNodeType;
        channelSelect: NumericValue;
        numOutputChannels: number;
    });
}
export declare class SignalChannelSelectType extends ISignalNodeType {
    constructor(params: {
        source: ISignalNodeType;
        channelIdx: NonSignalNumericValue;
        numChannels?: number;
    });
}
export declare class SignalChannelStackType extends ISignalNodeType {
    constructor(params: {
        sources: [ISignalNodeType] | [
            ISignalNodeType,
            ISignalNodeType
        ] | [
            ISignalNodeType,
            ISignalNodeType,
            ISignalNodeType
        ] | [
            ISignalNodeType,
            ISignalNodeType,
            ISignalNodeType,
            ISignalNodeType
        ];
    });
}
export declare class SignalCurveType extends ISignalNodeType implements AcceptsStartEvent, FiresDoneEvent {
    static MAX_SEGMENTS: number;
    constructor(params: {
        softCurve?: boolean;
        startValue: NonSignalNumericValue;
        segments: Array<{
            timeLength: NonSignalNumericValue;
            endValue: NonSignalNumericValue;
        }>;
        startEvent?: FiresEvent;
        autoStart?: boolean;
        autoLoop?: boolean;
    });
    setStartEvent(ev: FiresEvent | null, autoStart?: boolean): void;
    onDone(): SignalEventType;
}
export declare class SignalDelayType extends ISignalNodeType {
    constructor(params: {
        source: ISignalNodeType;
        delayTimeMs: NonSignalNumericValue;
    });
}
export declare class SignalFeedbackType extends ISignalNodeType {
    constructor();
    setSource(source: ISignalNodeType): void;
}
export declare class SignalParametricEqualizerType extends ISignalNodeType {
    static MAX_FILTERS: number;
    static MAX_CHANNELS: number;
    constructor(params: {
        source: ISignalNodeType;
        filters: Array<{
            type: FilterTypeEnum;
            frequency: NonSignalNumericValue;
            q: NonSignalNumericValue;
            gain: NonSignalNumericValue;
        }>;
        gainAdjust?: NonSignalNumericValue;
    });
}
export declare class SignalMathOpType extends ISignalNodeType {
    constructor(params: {
        operation: MathOperationEnum;
        operandA: NumericValue;
        operandB: NumericValue;
    });
}
export declare class SignalMultiplexerType extends ISignalNodeType implements AcceptsStartEvent, FiresDoneEvent {
    static MAX_INPUTS: number;
    constructor(params: {
        inputs: Array<ISignalNodeType>;
        incrementEvent?: FiresEvent;
        startEvent?: FiresEvent;
        autoStart?: boolean;
    });
    setStartEvent(ev: FiresEvent | null, autoStart?: boolean): void;
    onDone(): SignalEventType;
}
export declare class SignalPitchShiftType extends ISignalNodeType {
    constructor(params: {
        source: ISignalNodeType;
        pitchShiftSemitones: NonSignalNumericValue;
    });
}
export declare class SignalSoftClipType extends ISignalNodeType {
    constructor(params: {
        source: ISignalNodeType;
    });
}
export declare class SignalOutputDataType extends SPNode {
    constructor(params: {
        source: ISignalNodeType;
        sampleType: SampleTypeEnum;
        samplesPerChannelPerSec: NonSignalNumericValue;
    });
}
export declare class SignalOutputDeviceType extends SPNode {
    constructor(params: {
        source: ISignalNodeType;
        deviceNameFilter?: string;
        deviceHandednessFilter?: DeviceHandednessFilterEnum;
        outputToSystemAudio?: boolean;
        channelOffset?: NonSignalNumericValue;
    });
}
export {};

