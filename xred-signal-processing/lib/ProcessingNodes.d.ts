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


import { AcceptsStartEvent, FiresDoneEvent, FiresEvent, ISignalNodeType, NonSignalNumericValue, NumericValue, SignalCurveType, SignalOutputDeviceType } from "./SignalProcessingTypes";
import { StringFilter } from "./StringFilter";
export declare function OutputDevice(params: {
    deviceName: StringFilter;
    source: ISignalNodeType;
    channelOffset?: number;
}): SignalOutputDeviceType;
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
export declare function SoftClip(node: ISignalNodeType): ISignalNodeType;
export declare function SelectChannel(signal: ISignalNodeType, channelIdx: number): ISignalNodeType;
export declare function StackChannels(signal0: ISignalNodeType, ...otherSignals: ISignalNodeType[]): ISignalNodeType;
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

