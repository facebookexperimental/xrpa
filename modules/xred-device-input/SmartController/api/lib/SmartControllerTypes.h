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

#include <vector>
#include <xrpa-runtime/utils/MemoryAccessor.h>
#include <xrpa-runtime/utils/XrpaTypes.h>

namespace SmartControllerDataStore {

static inline Xrpa::TransportConfig GenTransportConfig() {
  Xrpa::TransportConfig config;
  config.schemaHash = Xrpa::HashValue(0x4480c388d74b0802, 0xffe72f0db7b3cba2, 0x9d29c9f5dfff0151, 0xbe2b2e4700b4be6a);
  config.changelogByteCount = 92144;
  return config;
}

class KnobControlReader;
class LightControlReader;

enum class KnobControlMode: uint32_t {
  Disabled = 0,
  Position = 1,
  Detent = 2,
};

enum class InputEventType: uint32_t {
  Release = 0,
  Press = 1,
};

class ColorSRGBA {
 public:
  uint8_t r;
  uint8_t g;
  uint8_t b;
  uint8_t a;
};

class DSColorSRGBA {
 public:
  static ColorSRGBA readValue(const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {
    uint8_t r = memAccessor.readValue<uint8_t>(offset);
    uint8_t g = memAccessor.readValue<uint8_t>(offset);
    uint8_t b = memAccessor.readValue<uint8_t>(offset);
    uint8_t a = memAccessor.readValue<uint8_t>(offset);
    return ColorSRGBA{r, g, b, a};
  }

  static void writeValue(const ColorSRGBA& val, const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {
    memAccessor.writeValue<uint8_t>(val.r, offset);
    memAccessor.writeValue<uint8_t>(val.g, offset);
    memAccessor.writeValue<uint8_t>(val.b, offset);
    memAccessor.writeValue<uint8_t>(val.a, offset);
  }
};

class DSColorSRGBA_24 {
 public:
  static std::vector<ColorSRGBA> readValue(const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {
    ColorSRGBA value0 = DSColorSRGBA::readValue(memAccessor, offset);
    ColorSRGBA value1 = DSColorSRGBA::readValue(memAccessor, offset);
    ColorSRGBA value2 = DSColorSRGBA::readValue(memAccessor, offset);
    ColorSRGBA value3 = DSColorSRGBA::readValue(memAccessor, offset);
    ColorSRGBA value4 = DSColorSRGBA::readValue(memAccessor, offset);
    ColorSRGBA value5 = DSColorSRGBA::readValue(memAccessor, offset);
    ColorSRGBA value6 = DSColorSRGBA::readValue(memAccessor, offset);
    ColorSRGBA value7 = DSColorSRGBA::readValue(memAccessor, offset);
    ColorSRGBA value8 = DSColorSRGBA::readValue(memAccessor, offset);
    ColorSRGBA value9 = DSColorSRGBA::readValue(memAccessor, offset);
    ColorSRGBA value10 = DSColorSRGBA::readValue(memAccessor, offset);
    ColorSRGBA value11 = DSColorSRGBA::readValue(memAccessor, offset);
    ColorSRGBA value12 = DSColorSRGBA::readValue(memAccessor, offset);
    ColorSRGBA value13 = DSColorSRGBA::readValue(memAccessor, offset);
    ColorSRGBA value14 = DSColorSRGBA::readValue(memAccessor, offset);
    ColorSRGBA value15 = DSColorSRGBA::readValue(memAccessor, offset);
    ColorSRGBA value16 = DSColorSRGBA::readValue(memAccessor, offset);
    ColorSRGBA value17 = DSColorSRGBA::readValue(memAccessor, offset);
    ColorSRGBA value18 = DSColorSRGBA::readValue(memAccessor, offset);
    ColorSRGBA value19 = DSColorSRGBA::readValue(memAccessor, offset);
    ColorSRGBA value20 = DSColorSRGBA::readValue(memAccessor, offset);
    ColorSRGBA value21 = DSColorSRGBA::readValue(memAccessor, offset);
    ColorSRGBA value22 = DSColorSRGBA::readValue(memAccessor, offset);
    ColorSRGBA value23 = DSColorSRGBA::readValue(memAccessor, offset);
    return std::vector<ColorSRGBA>{value0, value1, value2, value3, value4, value5, value6, value7, value8, value9, value10, value11, value12, value13, value14, value15, value16, value17, value18, value19, value20, value21, value22, value23};
  }

  static void writeValue(const std::vector<ColorSRGBA>& val, const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {
    DSColorSRGBA::writeValue(val[0], memAccessor, offset);
    DSColorSRGBA::writeValue(val[1], memAccessor, offset);
    DSColorSRGBA::writeValue(val[2], memAccessor, offset);
    DSColorSRGBA::writeValue(val[3], memAccessor, offset);
    DSColorSRGBA::writeValue(val[4], memAccessor, offset);
    DSColorSRGBA::writeValue(val[5], memAccessor, offset);
    DSColorSRGBA::writeValue(val[6], memAccessor, offset);
    DSColorSRGBA::writeValue(val[7], memAccessor, offset);
    DSColorSRGBA::writeValue(val[8], memAccessor, offset);
    DSColorSRGBA::writeValue(val[9], memAccessor, offset);
    DSColorSRGBA::writeValue(val[10], memAccessor, offset);
    DSColorSRGBA::writeValue(val[11], memAccessor, offset);
    DSColorSRGBA::writeValue(val[12], memAccessor, offset);
    DSColorSRGBA::writeValue(val[13], memAccessor, offset);
    DSColorSRGBA::writeValue(val[14], memAccessor, offset);
    DSColorSRGBA::writeValue(val[15], memAccessor, offset);
    DSColorSRGBA::writeValue(val[16], memAccessor, offset);
    DSColorSRGBA::writeValue(val[17], memAccessor, offset);
    DSColorSRGBA::writeValue(val[18], memAccessor, offset);
    DSColorSRGBA::writeValue(val[19], memAccessor, offset);
    DSColorSRGBA::writeValue(val[20], memAccessor, offset);
    DSColorSRGBA::writeValue(val[21], memAccessor, offset);
    DSColorSRGBA::writeValue(val[22], memAccessor, offset);
    DSColorSRGBA::writeValue(val[23], memAccessor, offset);
  }
};

class DSAngle {
 public:
  static float readValue(const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {
    float value = memAccessor.readValue<float>(offset);
    return value;
  }

  static void writeValue(float val, const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {
    memAccessor.writeValue<float>(val, offset);
  }
};

} // namespace SmartControllerDataStore
