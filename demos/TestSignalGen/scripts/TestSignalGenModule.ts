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

import path from "path";

import {
  bindExternalProgram,
  CppStandalone,
  ProgramInput,
  Scalar,
  UnityCoordinateSystem,
  useBuck,
  useCoordinateSystem,
  useEigenTypes,
  XrpaDataflowProgram,
  XrpaNativeCppProgram,
} from "@xrpa/xrpa-orchestrator";

import { OutputToSmartSpeaker } from "@xrpa/xred-device-input";

import {
  Add,
  AudioStream,
  CustomWave,
  Delay,
  DoneWhen,
  Feedback,
  HighPassFilter,
  LowPassFilter,
  Multiply,
  MultiplyAdd,
  OutputToDevice,
  PitchShift,
  RouteToChannel,
  Sequence,
  SineWave,
  SoftClip,
  strContains,
  Subtract,
  TrapezoidCurve,
} from "@xrpa/xred-signal-processing";

const apidir = path.join(__dirname, "..", "api");

const TestSignal1 = XrpaDataflowProgram("TestSignal1", () => {
  const audioWaveform = SineWave({
    channelCount: 2,
    frequency: TrapezoidCurve({
      softCurve: true,
      lowValue: ProgramInput("audioFrequency1", Scalar(120, "Low frequency, in Hz")),
      highValue: ProgramInput("audioFrequency2", Scalar(330, "High frequency, in Hz")),
      initialHoldTime: 1,
      rampUpTime: 1,
      highHoldTime: 1,
      rampDownTime: 1,
    }),
    amplitude: 0.25,
  });

  const hapticWaveform = SineWave({
    channelCount: 1,
    frequency: 170,
    amplitude: 0.5,
  });

  const buzzWaveform = CustomWave({
    channelCount: 1,
    frequency: 100,
    waveShape: [
      { time: 0, value: 0 },
      { time: 0.499, value: 1 },
      { time: 0.5, value: 0 },
      { time: 1, value: 0 },
    ],
  });

  const buzzSignal = RouteToChannel({
    source: buzzWaveform,
    channelSelect: SineWave({
      channelCount: 1,
      frequency: 0.5,
      bias: 0.5,
      amplitude: 0.5,
    }),
    numOutputChannels: 2,
  });

  const gainCurve = Sequence({
    elements: [
      TrapezoidCurve({
        softCurve: true,
        lowValue: 0,
        highValue: 1,
        rampUpTime: 0.5,
        highHoldTime: 2,
        rampDownTime: 1.5,
        finalHoldTime: 0.5,
      }),
      TrapezoidCurve({
        softCurve: true,
        lowValue: 0,
        highValue: 1,
        rampUpTime: 1.5,
        highHoldTime: 0,
        rampDownTime: 1.5,
      }),
    ],
  });

  DoneWhen(gainCurve.onDone());

  OutputToDevice({
    deviceName: strContains("Headphones"),
    source: SoftClip(Multiply(audioWaveform, gainCurve, 3)),
  });

  OutputToDevice({
    deviceName: strContains("BuzzDuino"),
    source: Multiply(buzzSignal, Subtract(1, gainCurve)),
  });

  OutputToDevice({
    deviceName: strContains("Sundial"),
    source: Multiply(hapticWaveform, gainCurve),
  });
});

const TestSignal2 = XrpaDataflowProgram("TestSignal2", () => {
  const amplitudeCurve = TrapezoidCurve({
    softCurve: true,
    lowValue: 0,
    highValue: 1,
    rampUpTime: 0.25,
    rampDownTime: 0.25,
    finalHoldTime: 2,
  });
  amplitudeCurve.setStartEvent(amplitudeCurve.onDone(), true);

  const sinePulse = SineWave({ frequency: 450, amplitude: amplitudeCurve });

  const feedback = Feedback();
  const outputSignal = MultiplyAdd(feedback, 0.25, sinePulse);
  feedback.setSource(Delay(outputSignal, 500));

  OutputToDevice({
    deviceName: strContains("Headphones"),
    source: outputSignal,
  });

  OutputToSmartSpeaker({
    ipAddress: "192.168.68.80",
    audioSignal: SoftClip(outputSignal),
  })
});

const TestSignal3 = XrpaDataflowProgram("TestSignal3", () => {
  const audioWaveform = AudioStream(
    path.resolve(__dirname, "..", "assets", "test.wav"),
    {
      numChannels: 2,
    },
  );

  const feedback = Feedback();
  const outputSignal = MultiplyAdd(feedback, 0.25, HighPassFilter(audioWaveform, 1000));
  feedback.setSource(Delay(LowPassFilter(outputSignal, 500), 250));

  const shiftedSignal = Add(PitchShift(outputSignal, 0), PitchShift(outputSignal, 4), PitchShift(outputSignal, -5));

  OutputToDevice({
    deviceName: strContains("Headphones"),
    source: shiftedSignal,
  });

  OutputToSmartSpeaker({
    ipAddress: "192.168.68.80",
    audioSignal: SoftClip(shiftedSignal),
  })
});

export const TestSignalGenModule = XrpaNativeCppProgram("TestSignalGen", apidir, () => {
  useBuck({
    target: "//arvr/libraries/xred/xrpa/demos/TestSignalGen:TestSignalGen",
    oncall: "xred_swes",
    modes: {
      windows: {
        debug: "@arvr/mode/win/debug",
        release: "@arvr/mode/win/release",
      },
      macos: {
        debug: "@arvr/mode/mac/dbg",
        release: "@arvr/mode/mac-arm/opt",
      },
    },
  });

  useCoordinateSystem(UnityCoordinateSystem);
  useEigenTypes();

  bindExternalProgram(TestSignal1);
  bindExternalProgram(TestSignal2);
  bindExternalProgram(TestSignal3);
});

export const TestSignalGenStandalone = new CppStandalone(TestSignalGenModule, path.join(apidir, "standalone"), path.join(apidir, "manifest.gen.json"));
