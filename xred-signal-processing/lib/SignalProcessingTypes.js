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

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignalGraph = exports.SignalOutputDeviceType = exports.SignalOutputDataType = exports.SignalSoftClipType = exports.SignalMultiplexerType = exports.SignalMathOpType = exports.SignalParametricEqualizerType = exports.SignalFeedbackType = exports.SignalDelayType = exports.SignalCurveType = exports.SignalChannelStackType = exports.SignalChannelSelectType = exports.SignalOscillatorType = exports.SignalSourceFileType = exports.ISignalNodeType = exports.SignalEventCombinerType = exports.SignalEventType = exports.FilterTypeEnum = exports.EventCombinerParameterMode = exports.DeviceHandednessFilterEnum = exports.SampleTypeEnum = exports.MathOperationEnum = exports.WaveformTypeEnum = exports.Vector3ParamType = exports.DistanceParamType = exports.FrequencyParamType = exports.ScalarParamType = exports.CountParamType = void 0;
const assert_1 = __importDefault(require("assert"));
const xrpa_orchestrator_1 = require("xrpa-orchestrator");
/* FUTURE:
class XrpaSignal {}

class XrpaMessage<T extends Record<string, unknown> = Record<string, never>> {
  constructor(public msgParams: T) {}
}

class XrpaBool {
  constructor(public value: boolean) {}
}
*/
///////////////////////////////////////////////////////////////////////////////
class CountParamType extends xrpa_orchestrator_1.XrpaParamDef {
    constructor(name, defaultValue, description) {
        super(name, {
            type: "Count",
            defaultValue,
            description,
        });
    }
}
exports.CountParamType = CountParamType;
class ScalarParamType extends xrpa_orchestrator_1.XrpaParamDef {
    constructor(name, defaultValue, description) {
        super(name, {
            type: "Scalar",
            defaultValue,
            description,
        });
    }
}
exports.ScalarParamType = ScalarParamType;
class FrequencyParamType extends xrpa_orchestrator_1.XrpaParamDef {
    constructor(name, defaultValue, description) {
        super(name, {
            type: "Scalar",
            defaultValue,
            description,
        });
    }
}
exports.FrequencyParamType = FrequencyParamType;
class DistanceParamType extends xrpa_orchestrator_1.XrpaParamDef {
    constructor(name, defaultValue, description) {
        super(name, {
            type: "Distance",
            defaultValue,
            description,
        });
    }
}
exports.DistanceParamType = DistanceParamType;
class Vector3ParamType extends xrpa_orchestrator_1.XrpaParamDef {
    constructor(name, description) {
        super(name, {
            type: "Vector3",
            defaultValue: [0, 0, 0],
            description,
        });
    }
}
exports.Vector3ParamType = Vector3ParamType;
function setField(fieldValues, fieldName, value) {
    fieldValues[fieldName] = value;
    if (value instanceof ISignalNodeType) {
        value.incrementOutputCount();
    }
}
function setNumericField(fieldValues, fieldName, nodeFieldName, value) {
    if (value === undefined) {
        return;
    }
    if (value instanceof xrpa_orchestrator_1.XrpaParamDef) {
        fieldValues[fieldName] = value;
    }
    else if (value instanceof ISignalNodeType) {
        (0, assert_1.default)(nodeFieldName);
        fieldValues[nodeFieldName] = value;
        value.incrementOutputCount();
    }
    else {
        fieldValues[fieldName] = value;
    }
}
function setEventField(fieldValues, fieldName, value) {
    if (value === undefined) {
        return;
    }
    fieldValues[fieldName] = value;
    if (value.extraDependency) {
        for (let i = 0; i < 100; ++i) {
            const depFieldName = `eventDependency${i}`;
            if (!(depFieldName in fieldValues)) {
                fieldValues[depFieldName] = value.extraDependency;
                break;
            }
        }
    }
}
function getOrCreateEventField(fieldValues, fieldName, eventDependency) {
    const existing = fieldValues[fieldName];
    if (existing instanceof SignalEventType) {
        return existing;
    }
    const ev = new SignalEventType();
    setEventField(fieldValues, fieldName, ev);
    if (eventDependency) {
        ev.extraDependency = eventDependency;
    }
    return ev;
}
function setStartEventField(fieldValues, startEvent, autoStart) {
    setEventField(fieldValues, "startEvent", startEvent);
    setField(fieldValues, "autoStart", startEvent ? (autoStart ?? false) : true);
}
///////////////////////////////////////////////////////////////////////////////
var WaveformTypeEnum;
(function (WaveformTypeEnum) {
    WaveformTypeEnum[WaveformTypeEnum["Sawtooth"] = 0] = "Sawtooth";
    WaveformTypeEnum[WaveformTypeEnum["Square"] = 1] = "Square";
    WaveformTypeEnum[WaveformTypeEnum["Triangle"] = 2] = "Triangle";
    WaveformTypeEnum[WaveformTypeEnum["Sine"] = 3] = "Sine";
    WaveformTypeEnum[WaveformTypeEnum["WhiteNoise"] = 4] = "WhiteNoise";
})(WaveformTypeEnum = exports.WaveformTypeEnum || (exports.WaveformTypeEnum = {}));
var MathOperationEnum;
(function (MathOperationEnum) {
    MathOperationEnum[MathOperationEnum["Add"] = 0] = "Add";
    MathOperationEnum[MathOperationEnum["Multiply"] = 1] = "Multiply";
})(MathOperationEnum = exports.MathOperationEnum || (exports.MathOperationEnum = {}));
var SampleTypeEnum;
(function (SampleTypeEnum) {
    SampleTypeEnum[SampleTypeEnum["Float"] = 0] = "Float";
    SampleTypeEnum[SampleTypeEnum["SignedInt32"] = 1] = "SignedInt32";
    SampleTypeEnum[SampleTypeEnum["UnsignedInt32"] = 2] = "UnsignedInt32";
})(SampleTypeEnum = exports.SampleTypeEnum || (exports.SampleTypeEnum = {}));
var DeviceHandednessFilterEnum;
(function (DeviceHandednessFilterEnum) {
    DeviceHandednessFilterEnum[DeviceHandednessFilterEnum["Any"] = 0] = "Any";
    DeviceHandednessFilterEnum[DeviceHandednessFilterEnum["None"] = 1] = "None";
    DeviceHandednessFilterEnum[DeviceHandednessFilterEnum["Left"] = 2] = "Left";
    DeviceHandednessFilterEnum[DeviceHandednessFilterEnum["Right"] = 3] = "Right";
})(DeviceHandednessFilterEnum = exports.DeviceHandednessFilterEnum || (exports.DeviceHandednessFilterEnum = {}));
var EventCombinerParameterMode;
(function (EventCombinerParameterMode) {
    EventCombinerParameterMode[EventCombinerParameterMode["Passthrough"] = 0] = "Passthrough";
    EventCombinerParameterMode[EventCombinerParameterMode["SrcIndex"] = 1] = "SrcIndex";
    EventCombinerParameterMode[EventCombinerParameterMode["Constant"] = 2] = "Constant";
})(EventCombinerParameterMode = exports.EventCombinerParameterMode || (exports.EventCombinerParameterMode = {}));
var FilterTypeEnum;
(function (FilterTypeEnum) {
    FilterTypeEnum[FilterTypeEnum["Bypass"] = 0] = "Bypass";
    FilterTypeEnum[FilterTypeEnum["Peak"] = 1] = "Peak";
    FilterTypeEnum[FilterTypeEnum["LowShelf"] = 2] = "LowShelf";
    FilterTypeEnum[FilterTypeEnum["HighShelf"] = 3] = "HighShelf";
    FilterTypeEnum[FilterTypeEnum["LowPass"] = 4] = "LowPass";
    FilterTypeEnum[FilterTypeEnum["HighPass"] = 5] = "HighPass";
    FilterTypeEnum[FilterTypeEnum["BandPass"] = 6] = "BandPass";
})(FilterTypeEnum = exports.FilterTypeEnum || (exports.FilterTypeEnum = {}));
class SignalEventType extends xrpa_orchestrator_1.XrpaObjectDef {
    // FUTURE: readonly onEvent = new XrpaMessage({});
    constructor(
    // FUTURE: readonly sendEvent?: XrpaMessage,
    ) {
        super("SignalEvent");
        this.extraDependency = null;
    }
    onEvent() {
        return this;
    }
}
exports.SignalEventType = SignalEventType;
class SignalEventCombinerType extends xrpa_orchestrator_1.XrpaObjectDef {
    constructor(params) {
        super("SignalEventCombiner");
        if (params.inputs.length > SignalEventCombinerType.MAX_INPUTS) {
            throw new Error("SignalEventCombinerType: too many inputs (" + params.inputs.length + " > " + SignalEventCombinerType.MAX_INPUTS + ")");
        }
        for (let i = 0; i < SignalEventCombinerType.MAX_INPUTS; i++) {
            setEventField(this.fieldValues, "srcEvent" + i, params.inputs[i]?.onEvent());
        }
        setField(this.fieldValues, "parameterMode", params.parameterMode);
    }
    onEvent() {
        return getOrCreateEventField(this.fieldValues, "onEvent", this);
    }
}
SignalEventCombinerType.MAX_INPUTS = 6;
exports.SignalEventCombinerType = SignalEventCombinerType;
class ISignalNodeType extends xrpa_orchestrator_1.XrpaObjectDef {
    constructor() {
        super(...arguments);
        this.numOutputs = 0;
        this.numOutputChannels = 0;
    }
    incrementOutputCount() {
        this.numOutputs++;
        setField(this.fieldValues, "numOutputs", this.numOutputs);
    }
    getNumChannels() {
        return this.numOutputChannels;
    }
    setOutputChannelsPassthrough(source) {
        this.numOutputChannels = source.numOutputChannels;
    }
    setOutputChannelsToMaxInputChannels() {
        this.numOutputChannels = 0;
        for (const key in this.fieldValues) {
            const value = this.fieldValues[key];
            if (value instanceof ISignalNodeType) {
                this.numOutputChannels = Math.max(this.numOutputChannels, value.numOutputChannels);
            }
        }
    }
    setOutputChannelsToSumInputChannels() {
        this.numOutputChannels = 0;
        for (const key in this.fieldValues) {
            const value = this.fieldValues[key];
            if (value instanceof ISignalNodeType) {
                this.numOutputChannels += value.numOutputChannels;
            }
        }
    }
}
exports.ISignalNodeType = ISignalNodeType;
/*
export class SignalSourceType extends ISignalNodeType {
  // TODO implement in FbaProcessor
  constructor(params: {
    srcData: XrpaSignal;
  }) {
    super("SignalSource");
    setField(this.fieldValues, "srcData", params.srcData);
  }
}
*/
class SignalSourceFileType extends ISignalNodeType {
    constructor(params) {
        super("SignalSourceFile");
        setField(this.fieldValues, "filePath", params.filePath);
        setField(this.fieldValues, "autoPlay", params.autoPlay);
        // note: there is no way to verify this is correct
        this.numOutputChannels = params.numChannels;
    }
}
exports.SignalSourceFileType = SignalSourceFileType;
class SignalOscillatorType extends ISignalNodeType {
    constructor(params) {
        super("SignalOscillator");
        setField(this.fieldValues, "numChannels", params.numChannels);
        setField(this.fieldValues, "waveformType", params.waveformType);
        setNumericField(this.fieldValues, "frequency", "frequencyNode", params.frequency);
        setNumericField(this.fieldValues, "pulseWidth", "pulseWidthNode", params.pulseWidth);
        this.numOutputChannels = params.numChannels;
    }
}
exports.SignalOscillatorType = SignalOscillatorType;
class SignalChannelSelectType extends ISignalNodeType {
    constructor(params) {
        super("SignalChannelSelect");
        setField(this.fieldValues, "srcNode", params.source);
        setField(this.fieldValues, "channelIdx", params.channelIdx);
        this.numOutputChannels = params.numChannels ?? 1;
        setField(this.fieldValues, "numChannels", this.numOutputChannels);
    }
}
exports.SignalChannelSelectType = SignalChannelSelectType;
class SignalChannelStackType extends ISignalNodeType {
    constructor(params) {
        super("SignalChannelStack");
        for (let i = 0; i < 4; i++) {
            setField(this.fieldValues, "srcNode" + i, params.sources[i]);
        }
        this.setOutputChannelsToSumInputChannels();
        setField(this.fieldValues, "numChannels", this.numOutputChannels);
    }
}
exports.SignalChannelStackType = SignalChannelStackType;
class SignalCurveType extends ISignalNodeType {
    constructor(params) {
        super("SignalCurve");
        if (params.segments.length > SignalCurveType.MAX_SEGMENTS) {
            throw new Error("SignalCurveType: too many segments (" + params.segments.length + " > " + SignalCurveType.MAX_SEGMENTS + ")");
        }
        setField(this.fieldValues, "softCurve", params.softCurve ?? false);
        setField(this.fieldValues, "numSegments", Math.min(SignalCurveType.MAX_SEGMENTS, params.segments.length));
        setField(this.fieldValues, "startValue", params.startValue);
        for (let i = 0; i < SignalCurveType.MAX_SEGMENTS; i++) {
            setField(this.fieldValues, "segmentLength" + i, params.segments[i]?.timeLength);
            setField(this.fieldValues, "segmentEndValue" + i, params.segments[i]?.endValue);
        }
        setStartEventField(this.fieldValues, params.startEvent?.onEvent(), params.autoStart);
        setField(this.fieldValues, "autoLoop", params.autoLoop ?? false);
        this.numOutputChannels = 1;
    }
    setStartEvent(ev, autoStart) {
        setStartEventField(this.fieldValues, ev?.onEvent(), autoStart);
    }
    onDone() {
        return getOrCreateEventField(this.fieldValues, "onDoneEvent");
    }
}
SignalCurveType.MAX_SEGMENTS = 6;
exports.SignalCurveType = SignalCurveType;
class SignalDelayType extends ISignalNodeType {
    constructor(params) {
        super("SignalDelay");
        setField(this.fieldValues, "srcNode", params.source);
        setNumericField(this.fieldValues, "delayTimeMs", null, params.delayTimeMs);
        this.setOutputChannelsPassthrough(params.source);
        setField(this.fieldValues, "numChannels", this.numOutputChannels);
    }
}
exports.SignalDelayType = SignalDelayType;
class SignalFeedbackType extends ISignalNodeType {
    constructor() {
        super("SignalFeedback", "", {}, true);
    }
    setSource(source) {
        setField(this.fieldValues, "srcNode", source);
        this.setOutputChannelsPassthrough(source);
        setField(this.fieldValues, "numChannels", this.numOutputChannels);
    }
}
exports.SignalFeedbackType = SignalFeedbackType;
class SignalParametricEqualizerType extends ISignalNodeType {
    constructor(params) {
        super("SignalParametricEqualizer");
        if (params.filters.length > SignalParametricEqualizerType.MAX_FILTERS) {
            throw new Error("SignalParametricEqualizerType: too many filters (" + params.filters.length + " > " + SignalParametricEqualizerType.MAX_FILTERS + ")");
        }
        setField(this.fieldValues, "srcNode", params.source);
        for (let i = 0; i < SignalParametricEqualizerType.MAX_FILTERS; i++) {
            setField(this.fieldValues, "filterType" + i, params.filters[i]?.type ?? FilterTypeEnum.Bypass);
            setField(this.fieldValues, "frequency" + i, params.filters[i]?.frequency ?? 50);
            setField(this.fieldValues, "quality" + i, params.filters[i]?.q ?? 0.7076);
            setField(this.fieldValues, "gain" + i, params.filters[i]?.gain ?? 0);
        }
        setField(this.fieldValues, "gainAdjust", params.gainAdjust ?? 0);
        this.setOutputChannelsPassthrough(params.source);
        setField(this.fieldValues, "numChannels", this.numOutputChannels);
    }
}
SignalParametricEqualizerType.MAX_FILTERS = 5;
SignalParametricEqualizerType.MAX_CHANNELS = 2;
exports.SignalParametricEqualizerType = SignalParametricEqualizerType;
class SignalMathOpType extends ISignalNodeType {
    constructor(params) {
        super("SignalMathOp");
        setField(this.fieldValues, "operation", params.operation);
        setNumericField(this.fieldValues, "operandA", "operandANode", params.operandA);
        setNumericField(this.fieldValues, "operandB", "operandBNode", params.operandB);
        this.setOutputChannelsToMaxInputChannels();
        setField(this.fieldValues, "numChannels", this.numOutputChannels);
    }
}
exports.SignalMathOpType = SignalMathOpType;
class SignalMultiplexerType extends ISignalNodeType {
    constructor(params) {
        super("SignalMultiplexer");
        if (params.inputs.length > SignalMultiplexerType.MAX_INPUTS) {
            throw new Error("SignalMultiplexerType: too many inputs (" + params.inputs.length + " > " + SignalMultiplexerType.MAX_INPUTS + ")");
        }
        for (let i = 0; i < SignalMultiplexerType.MAX_INPUTS; i++) {
            setField(this.fieldValues, "srcNode" + i, params.inputs[i]);
        }
        setEventField(this.fieldValues, "incrementEvent", params.incrementEvent?.onEvent());
        setStartEventField(this.fieldValues, params.startEvent?.onEvent(), params.autoStart);
        this.setOutputChannelsToMaxInputChannels();
        setField(this.fieldValues, "numChannels", this.numOutputChannels);
    }
    setStartEvent(ev, autoStart) {
        setStartEventField(this.fieldValues, ev?.onEvent(), autoStart);
    }
    onDone() {
        return getOrCreateEventField(this.fieldValues, "onDoneEvent");
    }
}
SignalMultiplexerType.MAX_INPUTS = 6;
exports.SignalMultiplexerType = SignalMultiplexerType;
class SignalSoftClipType extends ISignalNodeType {
    constructor(params) {
        super("SignalSoftClip");
        setField(this.fieldValues, "srcNode", params.source);
        this.setOutputChannelsPassthrough(params.source);
        setField(this.fieldValues, "numChannels", this.numOutputChannels);
    }
}
exports.SignalSoftClipType = SignalSoftClipType;
class SignalOutputDataType extends xrpa_orchestrator_1.XrpaObjectDef {
    // FUTURE: readonly data = new XrpaSignal();
    constructor(params) {
        super("SignalOutputData");
        setField(this.fieldValues, "srcNode", params.source);
        setField(this.fieldValues, "sampleType", params.sampleType);
        setField(this.fieldValues, "samplesPerChannelPerSec", params.samplesPerChannelPerSec);
    }
}
exports.SignalOutputDataType = SignalOutputDataType;
class SignalOutputDeviceType extends xrpa_orchestrator_1.XrpaObjectDef {
    // FUTURE: readonly foundMatch = new XrpaBool(false);
    constructor(params) {
        super("SignalOutputDevice");
        setField(this.fieldValues, "srcNode", params.source);
        setField(this.fieldValues, "deviceNameFilter", params.deviceNameFilter);
        setField(this.fieldValues, "deviceHandednessFilter", params.deviceHandednessFilter);
        setField(this.fieldValues, "channelOffset", params.channelOffset);
    }
}
exports.SignalOutputDeviceType = SignalOutputDeviceType;
class SignalGraph extends xrpa_orchestrator_1.XrpaSyntheticObject {
    constructor(params) {
        super(params.outputs, params.done ? {
            target: params.done?.onEvent(),
            fieldName: "receiveEvent",
        } : undefined);
    }
}
exports.SignalGraph = SignalGraph;
//# sourceMappingURL=SignalProcessingTypes.js.map
