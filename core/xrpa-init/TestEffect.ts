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

import { XrpaDataflowProgram } from "@xrpa/xrpa-orchestrator";

import {
  CustomWave,
  Delay,
  DoneWhen,
  Multiply,
  OutputToDevice,
  Sequence,
  StackChannels,
  strContains,
  TrapezoidCurve,
} from "@xrpa/xred-signal-processing";

export const TestEffect = XrpaDataflowProgram("TestEffect", () => {
  // create a sawtooth wave that takes up half the period (which is 10ms)
  const buzzWaveform = CustomWave({
    channelCount: 1,
    frequency: 100,
    waveShape: [
      {time: 0, value: 0},
      {time: 0.499, value: 1},
      {time: 0.5, value: 0},
      {time: 1, value: 0},
    ],
  });

  // stack the sawtooth waveform with a delayed version of itself, so that the sawtooth ping pongs between fingers
  const buzzSignal = StackChannels(
    buzzWaveform,
    Delay(buzzWaveform, 5), // Delay by 5ms, which is half of the wavelength of buzzWaveform
  );

  // create a gain curve that ramps up and down twice
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
    deviceName: strContains("HDK-1"),
    source: Multiply(buzzSignal, gainCurve),
  });
});
