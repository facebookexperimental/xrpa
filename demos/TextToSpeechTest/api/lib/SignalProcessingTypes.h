/*
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

// @generated

#pragma once

#include <xrpa-runtime/utils/MemoryAccessor.h>
#include <xrpa-runtime/utils/XrpaTypes.h>

namespace SignalProcessingDataStore {

static inline Xrpa::TransportConfig GenTransportConfig() {
  Xrpa::TransportConfig config;
  config.schemaHash = Xrpa::HashValue(0x02e109435c1e428d, 0x1d18f647535d29fe, 0x67efb3cde035009d, 0x0ba57b305e1640c2);
  config.changelogByteCount = 10615808;
  return config;
}

class SignalEventReader;
class SignalEventCombinerReader;
class SignalSourceReader;
class SignalSourceFileReader;
class SignalOscillatorReader;
class SignalChannelRouterReader;
class SignalChannelSelectReader;
class SignalChannelStackReader;
class SignalCurveReader;
class SignalDelayReader;
class SignalFeedbackReader;
class SignalMathOpReader;
class SignalMultiplexerReader;
class SignalParametricEqualizerReader;
class SignalPitchShiftReader;
class SignalSoftClipReader;
class SignalOutputDataReader;
class SignalOutputDeviceReader;

enum class ParameterMode: uint32_t {
  Passthrough = 0,
  SrcIndex = 1,
  Constant = 2,
};

enum class WaveformType: uint32_t {
  Sawtooth = 0,
  Square = 1,
  Triangle = 2,
  Sine = 3,
  WhiteNoise = 4,
};

enum class MathOperation: uint32_t {
  Add = 0,
  Multiply = 1,
  Subtract = 2,
};

enum class FilterType: uint32_t {
  Bypass = 0,
  Peak = 1,
  LowShelf = 2,
  HighShelf = 3,
  LowPass = 4,
  HighPass = 5,
  BandPass = 6,
};

class DSScalar {
 public:
  static float readValue(const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {
    float value = memAccessor.readValue<float>(offset);
    return value;
  }

  static void writeValue(float val, const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {
    memAccessor.writeValue<float>(val, offset);
  }
};

} // namespace SignalProcessingDataStore
