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

#include <Eigen/Eigen>
#include <chrono>
#include <utility>
#include <xrpa-runtime/utils/ByteVector.h>
#include <xrpa-runtime/utils/ImageTypes.h>
#include <xrpa-runtime/utils/MemoryAccessor.h>
#include <xrpa-runtime/utils/XrpaTypes.h>

namespace EyeTrackingDataStore {

static inline Xrpa::TransportConfig GenTransportConfig() {
  Xrpa::TransportConfig config;
  config.schemaHash = Xrpa::HashValue(0x2c6f556bae2a2d8f, 0x97550f7bc9cc0736, 0x7ec8ce9c8fb2e0a7, 0xf7fa50df2f8c2c47);
  config.changelogByteCount = 34883200;
  return config;
}

class EyeTrackingDeviceReader;

enum class EyeEventType: uint32_t {
  Blink = 0,
  Fixation = 1,
  Saccade = 2,
  FixationOnset = 3,
  SaccadeOnset = 4,
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

class DSSceneImage {
 public:
  static Xrpa::Image readValue(const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {
    int32_t width = memAccessor.readValue<int32_t>(offset);
    int32_t height = memAccessor.readValue<int32_t>(offset);
    uint32_t format = memAccessor.readValue<uint32_t>(offset);
    uint32_t encoding = memAccessor.readValue<uint32_t>(offset);
    uint32_t orientation = memAccessor.readValue<uint32_t>(offset);
    float gain = DSScalar::readValue(memAccessor, offset);
    uint64_t exposureDuration = memAccessor.readValue<uint64_t>(offset);
    uint64_t timestamp = memAccessor.readValue<uint64_t>(offset);
    float captureFrameRate = DSScalar::readValue(memAccessor, offset);
    Xrpa::ByteVector data = memAccessor.readValue<Xrpa::ByteVector>(offset);
    return Xrpa::Image{width, height, static_cast<Xrpa::ImageFormat>(format), static_cast<Xrpa::ImageEncoding>(encoding), static_cast<Xrpa::ImageOrientation>(orientation), gain, Xrpa::reinterpretValue<std::chrono::nanoseconds, uint64_t>(exposureDuration), Xrpa::reinterpretValue<std::chrono::nanoseconds, uint64_t>(timestamp), captureFrameRate, std::move(data)};
  }

  static void writeValue(const Xrpa::Image& val, const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {
    memAccessor.writeValue<int32_t>(val.width, offset);
    memAccessor.writeValue<int32_t>(val.height, offset);
    memAccessor.writeValue<uint32_t>(static_cast<uint32_t>(val.format), offset);
    memAccessor.writeValue<uint32_t>(static_cast<uint32_t>(val.encoding), offset);
    memAccessor.writeValue<uint32_t>(static_cast<uint32_t>(val.orientation), offset);
    DSScalar::writeValue(val.gain, memAccessor, offset);
    memAccessor.writeValue<uint64_t>(Xrpa::reinterpretValue<uint64_t, std::chrono::nanoseconds>(val.exposureDuration), offset);
    memAccessor.writeValue<uint64_t>(Xrpa::reinterpretValue<uint64_t, std::chrono::nanoseconds>(val.timestamp), offset);
    DSScalar::writeValue(val.captureFrameRate, memAccessor, offset);
    memAccessor.writeValue<Xrpa::ByteVector>(val.data, offset);
  }

  static int32_t dynSizeOfValue(const Xrpa::Image& val) {
    return Xrpa::MemoryAccessor::dynSizeOfValue<Xrpa::ByteVector>(val.data);
  }
};

class DSScale2 {
 public:
  static Eigen::Vector2f readValue(const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {
    float x = memAccessor.readValue<float>(offset);
    float y = memAccessor.readValue<float>(offset);
    return Eigen::Vector2f{x, y};
  }

  static void writeValue(Eigen::Vector2f val, const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {
    memAccessor.writeValue<float>(val.x(), offset);
    memAccessor.writeValue<float>(val.y(), offset);
  }
};

class DSVector3 {
 public:
  static Eigen::Vector3f readValue(const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {
    float x = memAccessor.readValue<float>(offset);
    float y = memAccessor.readValue<float>(offset);
    float z = memAccessor.readValue<float>(offset);
    return Eigen::Vector3f{x, y, -z};
  }

  static void writeValue(const Eigen::Vector3f& val, const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {
    memAccessor.writeValue<float>(val.x(), offset);
    memAccessor.writeValue<float>(val.y(), offset);
    memAccessor.writeValue<float>(-val.z(), offset);
  }
};

class DSAngle {
 public:
  static float readValue(const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {
    float value = memAccessor.readValue<float>(offset);
    return value * 180.f / Xrpa::XrpaConstants::PI_CONST;
  }

  static void writeValue(float val, const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {
    memAccessor.writeValue<float>(val * Xrpa::XrpaConstants::PI_CONST / 180.f, offset);
  }
};

class DSQuaternion {
 public:
  static Eigen::Quaternionf readValue(const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {
    float x = memAccessor.readValue<float>(offset);
    float y = memAccessor.readValue<float>(offset);
    float z = memAccessor.readValue<float>(offset);
    float w = memAccessor.readValue<float>(offset);
    return Eigen::Quaternionf{w, -x, -y, z};
  }

  static void writeValue(const Eigen::Quaternionf& val, const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {
    memAccessor.writeValue<float>(-val.x(), offset);
    memAccessor.writeValue<float>(-val.y(), offset);
    memAccessor.writeValue<float>(val.z(), offset);
    memAccessor.writeValue<float>(val.w(), offset);
  }
};

class DSUnitVector3 {
 public:
  static Eigen::Vector3f readValue(const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {
    float x = memAccessor.readValue<float>(offset);
    float y = memAccessor.readValue<float>(offset);
    float z = memAccessor.readValue<float>(offset);
    return Eigen::Vector3f{x, y, -z};
  }

  static void writeValue(const Eigen::Vector3f& val, const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {
    memAccessor.writeValue<float>(val.x(), offset);
    memAccessor.writeValue<float>(val.y(), offset);
    memAccessor.writeValue<float>(-val.z(), offset);
  }
};

class DSDistance {
 public:
  static float readValue(const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {
    float value = memAccessor.readValue<float>(offset);
    return value;
  }

  static void writeValue(float val, const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {
    memAccessor.writeValue<float>(val, offset);
  }
};

} // namespace EyeTrackingDataStore
