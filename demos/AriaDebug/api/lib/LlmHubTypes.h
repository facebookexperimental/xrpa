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

#include <ImageTypes.h>
#include <chrono>
#include <utility>
#include <vector>
#include <xrpa-runtime/utils/MemoryAccessor.h>
#include <xrpa-runtime/utils/XrpaTypes.h>

namespace LlmHubDataStore {

static inline Xrpa::TransportConfig GenTransportConfig() {
  Xrpa::TransportConfig config;
  config.schemaHash = Xrpa::HashValue(0x60a69d994c0387a0, 0x370d54e425475aae, 0xee71a9202fbcf39f, 0x9ba8e9fdf265078c);
  config.changelogByteCount = 470080000;
  return config;
}

class McpServerSetReader;
class McpServerConfigReader;
class LlmQueryReader;
class LlmTriggeredQueryReader;
class LlmConversationReader;

enum class ApiProvider: uint32_t {
  MetaGenProxy = 0,
  LlamaAPI = 1,
  LocalLLM = 2,
};

enum class ModelSizeHint: uint32_t {
  Small = 0,
  Large = 1,
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

class DSRgbImage {
 public:
  static ImageTypes::Image readValue(const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {
    int32_t width = memAccessor.readValue<int32_t>(offset);
    int32_t height = memAccessor.readValue<int32_t>(offset);
    uint32_t format = memAccessor.readValue<uint32_t>(offset);
    uint32_t encoding = memAccessor.readValue<uint32_t>(offset);
    uint32_t orientation = memAccessor.readValue<uint32_t>(offset);
    float gain = DSScalar::readValue(memAccessor, offset);
    uint64_t exposureDuration = memAccessor.readValue<uint64_t>(offset);
    uint64_t timestamp = memAccessor.readValue<uint64_t>(offset);
    float captureFrameRate = DSScalar::readValue(memAccessor, offset);
    std::vector<uint8_t> data = memAccessor.readValue<std::vector<uint8_t>>(offset);
    return ImageTypes::Image{width, height, static_cast<ImageTypes::Format>(format), static_cast<ImageTypes::Encoding>(encoding), static_cast<ImageTypes::Orientation>(orientation), gain, Xrpa::reinterpretValue<std::chrono::nanoseconds, uint64_t>(exposureDuration), Xrpa::reinterpretValue<std::chrono::nanoseconds, uint64_t>(timestamp), captureFrameRate, std::move(data)};
  }

  static void writeValue(const ImageTypes::Image& val, const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {
    memAccessor.writeValue<int32_t>(val.width, offset);
    memAccessor.writeValue<int32_t>(val.height, offset);
    memAccessor.writeValue<uint32_t>(static_cast<uint32_t>(val.format), offset);
    memAccessor.writeValue<uint32_t>(static_cast<uint32_t>(val.encoding), offset);
    memAccessor.writeValue<uint32_t>(static_cast<uint32_t>(val.orientation), offset);
    DSScalar::writeValue(val.gain, memAccessor, offset);
    memAccessor.writeValue<uint64_t>(Xrpa::reinterpretValue<uint64_t, std::chrono::nanoseconds>(val.exposureDuration), offset);
    memAccessor.writeValue<uint64_t>(Xrpa::reinterpretValue<uint64_t, std::chrono::nanoseconds>(val.timestamp), offset);
    DSScalar::writeValue(val.captureFrameRate, memAccessor, offset);
    memAccessor.writeValue<std::vector<uint8_t>>(val.data, offset);
  }

  static int32_t dynSizeOfValue(const ImageTypes::Image& val) {
    return Xrpa::MemoryAccessor::dynSizeOfValue<std::vector<uint8_t>>(val.data);
  }
};

} // namespace LlmHubDataStore
