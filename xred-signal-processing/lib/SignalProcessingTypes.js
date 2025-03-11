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
exports.SignalOutputDeviceType = exports.SignalOutputDataType = exports.SignalSoftClipType = exports.SignalPitchShiftType = exports.SignalMultiplexerType = exports.SignalMathOpType = exports.SignalParametricEqualizerType = exports.SignalFeedbackType = exports.SignalDelayType = exports.SignalCurveType = exports.SignalChannelStackType = exports.SignalChannelSelectType = exports.SignalChannelRouterType = exports.SignalOscillatorType = exports.SignalSourceFileType = exports.SignalSourceType = exports.ISignalNodeType = exports.SignalEventCombinerType = exports.SignalEventType = exports.FilterTypeEnum = exports.EventCombinerParameterMode = exports.DeviceHandednessFilterEnum = exports.SampleTypeEnum = exports.MathOperationEnum = exports.WaveformTypeEnum = void 0;
const assert_1 = __importDefault(require("assert"));
const xrpa_orchestrator_1 = require("@xrpa/xrpa-orchestrator");
const SignalProcessingInterface_1 = require("./SignalProcessingInterface");
class SPNode {
    constructor(type, isBuffered = false) {
        this.type = type;
        this.fieldValues = {};
        const dataflowNode = (0, xrpa_orchestrator_1.Instantiate)([(0, xrpa_orchestrator_1.bindExternalProgram)(SignalProcessingInterface_1.XredSignalProcessingInterface), type], {});
        (0, assert_1.default)((0, xrpa_orchestrator_1.isDataflowForeignObjectInstantiation)(dataflowNode));
        dataflowNode.isBuffered = isBuffered;
        this.dataflowNode = dataflowNode;
    }
    setFieldValueInternal(fieldName, value) {
        this.fieldValues[fieldName] = value;
        if (value instanceof SPNode) {
            this.dataflowNode.fieldValues[fieldName] = value.dataflowNode;
        }
        else {
            this.dataflowNode.fieldValues[fieldName] = value;
        }
    }
    setField(fieldName, value) {
        this.setFieldValueInternal(fieldName, value);
        if (value instanceof ISignalNodeType) {
            value.incrementOutputCount();
        }
    }
    setNumericField(fieldName, nodeFieldName, value) {
        if (value === undefined) {
            return;
        }
        if ((0, xrpa_orchestrator_1.isXrpaProgramParam)(value)) {
            this.setFieldValueInternal(fieldName, value);
        }
        else if (value instanceof ISignalNodeType) {
            (0, assert_1.default)(nodeFieldName);
            this.setFieldValueInternal(nodeFieldName, value);
            value.incrementOutputCount();
        }
        else {
            this.setFieldValueInternal(fieldName, value);
        }
    }
    setEventField(fieldName, value) {
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
    getOrCreateEventField(fieldName, eventDependency) {
        const existing = this.fieldValues[fieldName];
        if (existing instanceof SignalEventType) {
            return existing;
        }
        const ev = new SignalEventType();
        this.setEventField(fieldName, ev);
        if (eventDependency) {
            ev.extraDependency = eventDependency;
        }
        return ev;
    }
    setStartEventField(startEvent, autoStart) {
        this.setEventField("startEvent", startEvent);
        this.setField("autoStart", startEvent ? (autoStart ?? false) : true);
    }
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
    MathOperationEnum[MathOperationEnum["Subtract"] = 2] = "Subtract";
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
class SignalEventType extends SPNode {
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
class SignalEventCombinerType extends SPNode {
    constructor(params) {
        super("SignalEventCombiner");
        if (params.inputs.length > SignalEventCombinerType.MAX_INPUTS) {
            throw new Error("SignalEventCombinerType: too many inputs (" + params.inputs.length + " > " + SignalEventCombinerType.MAX_INPUTS + ")");
        }
        for (let i = 0; i < SignalEventCombinerType.MAX_INPUTS; i++) {
            this.setEventField("srcEvent" + i, params.inputs[i]?.onEvent());
        }
        this.setField("parameterMode", params.parameterMode);
    }
    onEvent() {
        return this.getOrCreateEventField("onEvent", this);
    }
}
SignalEventCombinerType.MAX_INPUTS = 6;
exports.SignalEventCombinerType = SignalEventCombinerType;
class ISignalNodeType extends SPNode {
    constructor() {
        super(...arguments);
        this.numOutputs = 0;
        this.numOutputChannels = 0;
    }
    incrementOutputCount() {
        this.numOutputs++;
        this.setField("numOutputs", this.numOutputs);
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
class SignalSourceType extends ISignalNodeType {
    constructor(params) {
        super("SignalSource");
        this.setField("numChannels", params.numChannels);
        this.setField("srcData", params.signal);
        this.numOutputChannels = params.numChannels;
    }
}
exports.SignalSourceType = SignalSourceType;
class SignalSourceFileType extends ISignalNodeType {
    constructor(params) {
        super("SignalSourceFile");
        this.setField("filePath", params.filePath);
        this.setField("autoPlay", params.autoPlay);
        // note: there is no way to verify this is correct
        this.numOutputChannels = params.numChannels;
    }
}
exports.SignalSourceFileType = SignalSourceFileType;
class SignalOscillatorType extends ISignalNodeType {
    constructor(params) {
        super("SignalOscillator");
        this.setField("numChannels", params.numChannels);
        this.setField("waveformType", params.waveformType);
        this.setNumericField("frequency", "frequencyNode", params.frequency);
        this.setNumericField("pulseWidth", "pulseWidthNode", params.pulseWidth);
        this.numOutputChannels = params.numChannels;
    }
}
exports.SignalOscillatorType = SignalOscillatorType;
// routes a single input channel into a multi-channel output, panning between channels if a fractional value is provided
class SignalChannelRouterType extends ISignalNodeType {
    constructor(params) {
        super("SignalChannelRouter");
        this.setField("srcNode", params.source);
        this.setNumericField("channelSelect", "channelSelectNode", params.channelSelect);
        this.numOutputChannels = params.numOutputChannels;
        this.setField("numChannels", this.numOutputChannels);
    }
}
exports.SignalChannelRouterType = SignalChannelRouterType;
// selects/extracts a subset of channels from an input signal
class SignalChannelSelectType extends ISignalNodeType {
    constructor(params) {
        super("SignalChannelSelect");
        this.setField("srcNode", params.source);
        this.setField("channelIdx", params.channelIdx);
        this.numOutputChannels = params.numChannels ?? 1;
        this.setField("numChannels", this.numOutputChannels);
    }
}
exports.SignalChannelSelectType = SignalChannelSelectType;
// stacks multiple input signals into a single multi-channel output signal
class SignalChannelStackType extends ISignalNodeType {
    constructor(params) {
        super("SignalChannelStack");
        for (let i = 0; i < 4; i++) {
            this.setField("srcNode" + i, params.sources[i]);
        }
        this.setOutputChannelsToSumInputChannels();
        this.setField("numChannels", this.numOutputChannels);
    }
}
exports.SignalChannelStackType = SignalChannelStackType;
class SignalCurveType extends ISignalNodeType {
    constructor(params) {
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
    setStartEvent(ev, autoStart) {
        this.setStartEventField(ev?.onEvent(), autoStart);
    }
    onDone() {
        return this.getOrCreateEventField("onDoneEvent");
    }
}
SignalCurveType.MAX_SEGMENTS = 6;
exports.SignalCurveType = SignalCurveType;
class SignalDelayType extends ISignalNodeType {
    constructor(params) {
        super("SignalDelay");
        this.setField("srcNode", params.source);
        this.setNumericField("delayTimeMs", null, params.delayTimeMs);
        this.setOutputChannelsPassthrough(params.source);
        this.setField("numChannels", this.numOutputChannels);
    }
}
exports.SignalDelayType = SignalDelayType;
class SignalFeedbackType extends ISignalNodeType {
    constructor() {
        super("SignalFeedback", true);
    }
    setSource(source) {
        this.setField("srcNode", source);
        this.setOutputChannelsPassthrough(source);
        this.setField("numChannels", this.numOutputChannels);
    }
}
exports.SignalFeedbackType = SignalFeedbackType;
class SignalParametricEqualizerType extends ISignalNodeType {
    constructor(params) {
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
SignalParametricEqualizerType.MAX_FILTERS = 5;
SignalParametricEqualizerType.MAX_CHANNELS = 2;
exports.SignalParametricEqualizerType = SignalParametricEqualizerType;
class SignalMathOpType extends ISignalNodeType {
    constructor(params) {
        super("SignalMathOp");
        this.setField("operation", params.operation);
        this.setNumericField("operandA", "operandANode", params.operandA);
        this.setNumericField("operandB", "operandBNode", params.operandB);
        this.setOutputChannelsToMaxInputChannels();
        this.setField("numChannels", this.numOutputChannels);
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
            this.setField("srcNode" + i, params.inputs[i]);
        }
        this.setEventField("incrementEvent", params.incrementEvent?.onEvent());
        this.setStartEventField(params.startEvent?.onEvent(), params.autoStart);
        this.setOutputChannelsToMaxInputChannels();
        this.setField("numChannels", this.numOutputChannels);
    }
    setStartEvent(ev, autoStart) {
        this.setStartEventField(ev?.onEvent(), autoStart);
    }
    onDone() {
        return this.getOrCreateEventField("onDoneEvent");
    }
}
SignalMultiplexerType.MAX_INPUTS = 6;
exports.SignalMultiplexerType = SignalMultiplexerType;
class SignalPitchShiftType extends ISignalNodeType {
    constructor(params) {
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
exports.SignalPitchShiftType = SignalPitchShiftType;
class SignalSoftClipType extends ISignalNodeType {
    constructor(params) {
        super("SignalSoftClip");
        this.setField("srcNode", params.source);
        this.setOutputChannelsPassthrough(params.source);
        this.setField("numChannels", this.numOutputChannels);
    }
}
exports.SignalSoftClipType = SignalSoftClipType;
class SignalOutputDataType extends SPNode {
    // FUTURE: readonly data = new XrpaSignal();
    constructor(params) {
        super("SignalOutputData");
        this.setField("srcNode", params.source);
        this.setField("sampleType", params.sampleType);
        this.setField("samplesPerChannelPerSec", params.samplesPerChannelPerSec);
    }
}
exports.SignalOutputDataType = SignalOutputDataType;
class SignalOutputDeviceType extends SPNode {
    // FUTURE: readonly foundMatch = new XrpaBool(false);
    constructor(params) {
        super("SignalOutputDevice");
        this.setField("srcNode", params.source);
        this.setField("deviceNameFilter", params.deviceNameFilter);
        this.setField("deviceHandednessFilter", params.deviceHandednessFilter);
        this.setField("channelOffset", params.channelOffset);
    }
}
exports.SignalOutputDeviceType = SignalOutputDeviceType;
//# sourceMappingURL=SignalProcessingTypes.js.map
