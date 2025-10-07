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


import {
  Boolean,
  Collection,
  Count,
  Enum,
  GameComponentBindingsDisabled,
  Interface,
  Message,
  Output,
  ProgramInput,
  ReferenceTo,
  Scalar,
  Signal,
  String,
  UnityCoordinateSystem,
  XrpaProgramInterface,
  useCoordinateSystem,
} from "@xrpa/xrpa-orchestrator";
import path from "path";

export const XredSignalProcessingInterface = XrpaProgramInterface("Xred.SignalProcessing", path.join(__dirname, "../package.json"), () => {
  useCoordinateSystem(UnityCoordinateSystem);

  GameComponentBindingsDisabled();

  const SignalEvent = ProgramInput("SignalEvent", Collection({
    maxCount: 64,
    fields: {
      triggerEvent: Message("TriggerEventMessage", {
        payload: Scalar,
      }),
      receiveEvent: Output(Message("ReceiveEventMessage", {
        payload: Scalar,
      })),
    },
  }));

  ProgramInput("SignalEventCombiner", Collection({
    maxCount: 128,
    fields: {
      srcEvent0: ReferenceTo(SignalEvent),
      srcEvent1: ReferenceTo(SignalEvent),
      srcEvent2: ReferenceTo(SignalEvent),
      srcEvent3: ReferenceTo(SignalEvent),
      srcEvent4: ReferenceTo(SignalEvent),
      srcEvent5: ReferenceTo(SignalEvent),

      parameterMode: Enum("ParameterMode", ["Passthrough", "SrcIndex", "Constant"]),

      onEvent: ReferenceTo(SignalEvent),
    },
  }));

  const ISignalNode = Interface("ISignalNode");

  ProgramInput("SignalSource", Collection({
    interfaceType: ISignalNode,
    maxCount: 64,
    fields: {
      numOutputs: Count(1),
      numChannels: Count(1),
      srcData: Signal(),
    },
  }));

  ProgramInput("SignalSourceFile", Collection({
    interfaceType: ISignalNode,
    maxCount: 64,
    fields: {
      numOutputs: Count(1),
      filePath: String,
      autoPlay: Boolean(true),
    },
  }));

  ProgramInput("SignalOscillator", Collection({
    interfaceType: ISignalNode,
    maxCount: 128,
    fields: {
      numOutputs: Count(1),
      numChannels: Count(1),
      waveformType: Enum("WaveformType", ["Sawtooth", "Square", "Triangle", "Sine", "WhiteNoise"]),
      frequency: Scalar(440), // TODO add a frequency semantic type
      frequencyNode: ReferenceTo(ISignalNode),
      pulseWidth: Scalar(0.5),
      pulseWidthNode: ReferenceTo(ISignalNode),
    },
  }));

  ProgramInput("SignalChannelRouter", Collection({
    interfaceType: ISignalNode,
    maxCount: 256,
    fields: {
      numOutputs: Count(1),
      numChannels: Count(1),
      channelSelect: Scalar(0.5),
      channelSelectNode: ReferenceTo(ISignalNode),
      srcNode: ReferenceTo(ISignalNode),
    },
  }));

  ProgramInput("SignalChannelSelect", Collection({
    interfaceType: ISignalNode,
    maxCount: 256,
    fields: {
      numOutputs: Count(1),
      numChannels: Count(1),
      channelIdx: Count(0),
      srcNode: ReferenceTo(ISignalNode),
    },
  }));

  ProgramInput("SignalChannelStack", Collection({
    interfaceType: ISignalNode,
    maxCount: 256,
    fields: {
      numOutputs: Count(1),
      numChannels: Count(1),
      srcNode0: ReferenceTo(ISignalNode),
      srcNode1: ReferenceTo(ISignalNode),
      srcNode2: ReferenceTo(ISignalNode),
      srcNode3: ReferenceTo(ISignalNode),
    },
  }));

  ProgramInput("SignalCurve", Collection({
    interfaceType: ISignalNode,
    maxCount: 256,
    fields: {
      numOutputs: Count(1),

      softCurve: Boolean(false),

      numSegments: Count(1),

      startValue: Scalar,

      segmentLength0: Scalar,
      segmentEndValue0: Scalar,

      segmentLength1: Scalar,
      segmentEndValue1: Scalar,

      segmentLength2: Scalar,
      segmentEndValue2: Scalar,

      segmentLength3: Scalar,
      segmentEndValue3: Scalar,

      segmentLength4: Scalar,
      segmentEndValue4: Scalar,

      segmentLength5: Scalar,
      segmentEndValue5: Scalar,

      startEvent: ReferenceTo(SignalEvent),
      autoStart: Boolean(true),

      onDoneEvent: ReferenceTo(SignalEvent),
      autoLoop: Boolean(false),
    },
  }));

  ProgramInput("SignalDelay", Collection({
    interfaceType: ISignalNode,
    maxCount: 256,
    fields: {
      numOutputs: Count(1),
      numChannels: Count(1),
      srcNode: ReferenceTo(ISignalNode),
      delayTimeMs: Scalar,
    },
  }));

  ProgramInput("SignalFeedback", Collection({
    interfaceType: ISignalNode,
    maxCount: 256,
    fields: {
      numOutputs: Count(1),
      numChannels: Count(1),
      srcNode: ReferenceTo(ISignalNode),
    },
  }));

  ProgramInput("SignalMathOp", Collection({
    interfaceType: ISignalNode,
    maxCount: 256,
    fields: {
      numOutputs: Count(1),
      numChannels: Count(1),
      operation: Enum("MathOperation", ["Add", "Multiply", "Subtract"]),

      operandA: Scalar,
      operandANode: ReferenceTo(ISignalNode),

      operandB: Scalar,
      operandBNode: ReferenceTo(ISignalNode),
    },
  }));

  ProgramInput("SignalMultiplexer", Collection({
    interfaceType: ISignalNode,
    maxCount: 256,
    fields: {
      numOutputs: Count(1),
      numChannels: Count(1),

      srcNode0: ReferenceTo(ISignalNode),
      srcNode1: ReferenceTo(ISignalNode),
      srcNode2: ReferenceTo(ISignalNode),
      srcNode3: ReferenceTo(ISignalNode),
      srcNode4: ReferenceTo(ISignalNode),
      srcNode5: ReferenceTo(ISignalNode),

      incrementEvent: ReferenceTo(SignalEvent),

      startEvent: ReferenceTo(SignalEvent),
      autoStart: Boolean(true),

      onDoneEvent: ReferenceTo(SignalEvent),
    },
  }));

  const FilterType = Enum("FilterType", ["Bypass", "Peak", "LowShelf", "HighShelf", "LowPass", "HighPass", "BandPass"]);

  ProgramInput("SignalParametricEqualizer", Collection({
    interfaceType: ISignalNode,
    maxCount: 256,
    fields: {
      numOutputs: Count(1),
      numChannels: Count(1), // max is 2 for this node

      srcNode: ReferenceTo(ISignalNode),

      // band0
      filterType0: FilterType,
      frequency0: Scalar(50),
      quality0: Scalar(0.707106),
      gain0: Scalar(0),

      // band1
      filterType1: FilterType,
      frequency1: Scalar(50),
      quality1: Scalar(0.707106),
      gain1: Scalar(0),

      // band2
      filterType2: FilterType,
      frequency2: Scalar(50),
      quality2: Scalar(0.707106),
      gain2: Scalar(0),

      // band3
      filterType3: FilterType,
      frequency3: Scalar(50),
      quality3: Scalar(0.707106),
      gain3: Scalar(0),

      // band4
      filterType4: FilterType,
      frequency4: Scalar(50),
      quality4: Scalar(0.707106),
      gain4: Scalar(0),

      // gain
      gainAdjust: Scalar(0),
    },
  }));

  ProgramInput("SignalPitchShift", Collection({
    interfaceType: ISignalNode,
    maxCount: 256,
    fields: {
      numOutputs: Count(1),
      numChannels: Count(1),
      srcNode: ReferenceTo(ISignalNode),
      pitchShiftSemitones: Count(0),
    },
  }));

  ProgramInput("SignalSoftClip", Collection({
    interfaceType: ISignalNode,
    maxCount: 256,
    fields: {
      numOutputs: Count(1),
      numChannels: Count(1),
      srcNode: ReferenceTo(ISignalNode),
    },
  }));

  ProgramInput("SignalOutputData", Collection({
    maxCount: 64,
    fields: {
      srcNode: ReferenceTo(ISignalNode),

      numChannels: Count(1),
      frameRate: Count,

      data: Output(Signal),
    },
  }));

  ProgramInput("SignalOutputDevice", Collection({
    maxCount: 64,
    fields: {
      srcNode: ReferenceTo(ISignalNode),
      channelOffset: Count(0),

      deviceNameFilter: String("", "pseudo-regex, with just $ and ^ supported for now"),
      outputToSystemAudio: Boolean,

      // TODO channelName, driverIdentifier, driverPort filters?

      foundMatch: Output(Boolean(false, "Set to true if a matching device was found")),
    },
  }));
});
