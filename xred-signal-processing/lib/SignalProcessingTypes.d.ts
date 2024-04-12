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


import { XrpaObjectDef, XrpaParamDef, XrpaSyntheticObject } from "xrpa-orchestrator";
export declare class CountParamType extends XrpaParamDef {
    constructor(name: string, defaultValue?: number, description?: string);
}
export declare class ScalarParamType extends XrpaParamDef {
    constructor(name: string, defaultValue?: number, description?: string);
}
export declare class FrequencyParamType extends XrpaParamDef {
    constructor(name: string, defaultValue?: number, description?: string);
}
export declare class DistanceParamType extends XrpaParamDef {
    constructor(name: string, defaultValue?: number, description?: string);
}
export declare class Vector3ParamType extends XrpaParamDef {
    constructor(name: string, description?: string);
}
export type NonSignalNumericValue = CountParamType | ScalarParamType | FrequencyParamType | DistanceParamType | number;
export type NumericValue = NonSignalNumericValue | ISignalNodeType;
export declare enum WaveformTypeEnum {
    Sawtooth = 0,
    Square = 1,
    Triangle = 2,
    Sine = 3,
    WhiteNoise = 4
}
export declare enum MathOperationEnum {
    Add = 0,
    Multiply = 1
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
export declare class SignalEventType extends XrpaObjectDef {
    constructor();
}
export declare class ISignalNodeType extends XrpaObjectDef {
    protected numOutputChannels: number;
    protected setOutputChannelsPassthrough(source: ISignalNodeType): void;
    protected setOutputChannelsToMaxInputChannels(): void;
    protected setOutputChannelsToSumInputChannels(): void;
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
export declare class SignalChannelSelectType extends ISignalNodeType {
    constructor(params: {
        source: ISignalNodeType;
        channelIdx: NonSignalNumericValue;
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
export declare class SignalCurveType extends ISignalNodeType {
    static MAX_SEGMENTS: number;
    constructor(params: {
        softCurve?: boolean;
        startValue: NonSignalNumericValue;
        segments: Array<{
            timeLength: NonSignalNumericValue;
            endValue: NonSignalNumericValue;
        }>;
        startEvent?: SignalEventType;
        onDoneEvent?: SignalEventType;
    });
}
export declare class SignalMathOpType extends ISignalNodeType {
    constructor(params: {
        operation: MathOperationEnum;
        operandA: NumericValue;
        operandB: NumericValue;
    });
}
export declare class SignalSoftClipType extends ISignalNodeType {
    constructor(params: {
        source: ISignalNodeType;
    });
}
export declare class SignalOutputDataType extends XrpaObjectDef {
    constructor(params: {
        source: ISignalNodeType;
        sampleType: SampleTypeEnum;
        samplesPerChannelPerSec: NonSignalNumericValue;
    });
}
export declare class SignalOutputDeviceType extends XrpaObjectDef {
    constructor(params: {
        source: ISignalNodeType;
        deviceNameFilter: string;
        deviceHandednessFilter?: DeviceHandednessFilterEnum;
        channelOffset?: NonSignalNumericValue;
    });
}
type SignalOut = SignalOutputDataType | SignalOutputDeviceType;
export declare class SignalGraph extends XrpaSyntheticObject {
    constructor(params: {
        outputs: SignalOut[];
        done?: SignalEventType;
    });
}
export {};

