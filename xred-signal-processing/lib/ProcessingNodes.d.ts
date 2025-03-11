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


import { XrpaDataflowConnection } from "@xrpa/xrpa-orchestrator";
import { AcceptsStartEvent, FilterTypeEnum, FiresDoneEvent, FiresEvent, ISignalNodeType, NonSignalNumericValue, NumericValue, SignalCurveType, SignalFeedbackType, SignalOutputDeviceType } from "./SignalProcessingTypes";
import { StringFilter } from "./StringFilter";
export declare function OutputToDevice(params: {
    deviceName: StringFilter;
    source: ISignalNodeType;
    channelOffset?: number;
}): SignalOutputDeviceType;
export declare function DoneWhen(done: FiresEvent): void;
export declare function SineWave(params: {
    channelCount?: number;
    frequency?: NumericValue;
    amplitude?: NumericValue;
    bias?: NumericValue;
}): ISignalNodeType;
export declare function SawtoothWave(params: {
    channelCount?: number;
    frequency?: NumericValue;
    amplitude?: NumericValue;
    bias?: NumericValue;
}): ISignalNodeType;
export declare function TriangleWave(params: {
    channelCount?: number;
    frequency?: NumericValue;
    amplitude?: NumericValue;
    bias?: NumericValue;
}): ISignalNodeType;
export declare function SquareWave(params: {
    channelCount?: number;
    frequency?: NumericValue;
    pulseWidth?: NumericValue;
    amplitude?: NumericValue;
    bias?: NumericValue;
}): ISignalNodeType;
export declare function WhiteNoise(params: {
    channelCount?: number;
    amplitude?: NumericValue;
    bias?: NumericValue;
}): ISignalNodeType;
export declare function CustomWave(params: {
    channelCount?: number;
    frequency?: number;
    amplitude?: number;
    waveShape: Array<{
        time: number;
        value: number;
    }>;
    softShape?: boolean;
}): ISignalNodeType;
export declare function SoftClip(node: ISignalNodeType): ISignalNodeType;
export declare function RouteToChannel(params: {
    source: ISignalNodeType;
    channelSelect: NumericValue;
    numOutputChannels: number;
}): ISignalNodeType;
export declare function SelectChannel(signal: ISignalNodeType, channelIdx: number): ISignalNodeType;
export declare function StackChannels(signal0: ISignalNodeType, ...otherSignals: ISignalNodeType[]): ISignalNodeType;
export declare function RepeatAndStack(signal: ISignalNodeType, count: number): ISignalNodeType;
export declare function ClickPulse(params: {
    preDelay?: NonSignalNumericValue;
    pulseWidth?: NonSignalNumericValue;
    startEvent?: FiresEvent;
}): SignalCurveType;
export declare function TrapezoidCurve(params: {
    softCurve?: boolean;
    lowValue?: NonSignalNumericValue;
    highValue?: NonSignalNumericValue;
    initialHoldTime?: NonSignalNumericValue;
    rampUpTime?: NonSignalNumericValue;
    highHoldTime?: NonSignalNumericValue;
    rampDownTime?: NonSignalNumericValue;
    finalHoldTime?: NonSignalNumericValue;
    startEvent?: FiresEvent;
}): SignalCurveType;
export declare function AdsrEnvelope(params: {
    attackTime?: NonSignalNumericValue;
    decayTime?: NonSignalNumericValue;
    sustainLevel?: NonSignalNumericValue;
    sustainTime?: NonSignalNumericValue;
    releaseTime?: NonSignalNumericValue;
    startEvent?: FiresEvent;
}): SignalCurveType;
export declare function SignalStream(params: {
    numChannels: number;
    signal: XrpaDataflowConnection;
}): ISignalNodeType;
export declare function AudioStream(filename: string, params?: {
    autoPlay?: boolean;
    numChannels?: number;
}): ISignalNodeType;
export declare function Sequence(params: {
    elements: Array<ISignalNodeType & AcceptsStartEvent & FiresDoneEvent>;
    loop?: boolean;
    startEvent?: FiresEvent;
    autoStart?: boolean;
}): ISignalNodeType & FiresDoneEvent;
export declare function Delay(source: ISignalNodeType, delayTimeMs: NonSignalNumericValue): ISignalNodeType;
export declare function Feedback(): SignalFeedbackType;
export declare function ParametricEqualizer(params: {
    source: ISignalNodeType;
    filters: Array<{
        type: FilterTypeEnum;
        frequency: NonSignalNumericValue;
        q: NonSignalNumericValue;
        gain: NonSignalNumericValue;
    }>;
    gainAdjust?: NonSignalNumericValue;
}): ISignalNodeType;
export declare function LowPassFilter(signal: ISignalNodeType, cutoffFrequency: NonSignalNumericValue): ISignalNodeType;
export declare function HighPassFilter(signal: ISignalNodeType, cutoffFrequency: NonSignalNumericValue): ISignalNodeType;
export declare function BandPassFilter(signal: ISignalNodeType, centerFrequency: NonSignalNumericValue, q?: NonSignalNumericValue): ISignalNodeType;
export declare function PitchShift(signal: ISignalNodeType, semitones: NonSignalNumericValue): ISignalNodeType;

