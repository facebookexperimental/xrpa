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

namespace ImageSelectorDataStore {

static inline Xrpa::TransportConfig GenTransportConfig() {
  Xrpa::TransportConfig config;
  config.schemaHash = Xrpa::HashValue(0x1fba5585da1d7859, 0x2b006eddd0bf0dc1, 0xe54ea54a1cf81bb0, 0x608287b4e515c00e);
  config.changelogByteCount = 11899760;
  return config;
}

class ImageSelectorReader;

class DataPoseDynamics {
 public:
  std::chrono::nanoseconds timestamp;
  int localFrameId;
  Eigen::Quaternionf localFromDeviceRotation;
  Eigen::Vector3f localFromDeviceTranslation;
  Eigen::Vector3f localLinearVelocity;
  Eigen::Vector3f deviceRotationalVelocity;
  Eigen::Vector3f localGravityDirection;
};

class PoseDynamics {
 public:
  DataPoseDynamics data;
};

class RgbImage {
 public:
  Xrpa::Image image;
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

class DSImageRgbImage {
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

class DSQuaternion {
 public:
  static Eigen::Quaternionf readValue(const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {
    float x = memAccessor.readValue<float>(offset);
    float y = memAccessor.readValue<float>(offset);
    float z = memAccessor.readValue<float>(offset);
    float w = memAccessor.readValue<float>(offset);
    return Eigen::Quaternionf{w, x, y, z};
  }

  static void writeValue(const Eigen::Quaternionf& val, const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {
    memAccessor.writeValue<float>(val.x(), offset);
    memAccessor.writeValue<float>(val.y(), offset);
    memAccessor.writeValue<float>(val.z(), offset);
    memAccessor.writeValue<float>(val.w(), offset);
  }
};

class DSVector3 {
 public:
  static Eigen::Vector3f readValue(const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {
    float x = memAccessor.readValue<float>(offset);
    float y = memAccessor.readValue<float>(offset);
    float z = memAccessor.readValue<float>(offset);
    return Eigen::Vector3f{x, y, z};
  }

  static void writeValue(const Eigen::Vector3f& val, const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {
    memAccessor.writeValue<float>(val.x(), offset);
    memAccessor.writeValue<float>(val.y(), offset);
    memAccessor.writeValue<float>(val.z(), offset);
  }
};

class DSUnitVector3 {
 public:
  static Eigen::Vector3f readValue(const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {
    float x = memAccessor.readValue<float>(offset);
    float y = memAccessor.readValue<float>(offset);
    float z = memAccessor.readValue<float>(offset);
    return Eigen::Vector3f{x, y, z};
  }

  static void writeValue(const Eigen::Vector3f& val, const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {
    memAccessor.writeValue<float>(val.x(), offset);
    memAccessor.writeValue<float>(val.y(), offset);
    memAccessor.writeValue<float>(val.z(), offset);
  }
};

class DSDataPoseDynamics {
 public:
  static DataPoseDynamics readValue(const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {
    uint64_t timestamp = memAccessor.readValue<uint64_t>(offset);
    int32_t localFrameId = memAccessor.readValue<int32_t>(offset);
    Eigen::Quaternionf localFromDeviceRotation = DSQuaternion::readValue(memAccessor, offset);
    Eigen::Vector3f localFromDeviceTranslation = DSVector3::readValue(memAccessor, offset);
    Eigen::Vector3f localLinearVelocity = DSVector3::readValue(memAccessor, offset);
    Eigen::Vector3f deviceRotationalVelocity = DSVector3::readValue(memAccessor, offset);
    Eigen::Vector3f localGravityDirection = DSUnitVector3::readValue(memAccessor, offset);
    return DataPoseDynamics{Xrpa::reinterpretValue<std::chrono::nanoseconds, uint64_t>(timestamp), localFrameId, localFromDeviceRotation, localFromDeviceTranslation, localLinearVelocity, deviceRotationalVelocity, localGravityDirection};
  }

  static void writeValue(const DataPoseDynamics& val, const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {
    memAccessor.writeValue<uint64_t>(Xrpa::reinterpretValue<uint64_t, std::chrono::nanoseconds>(val.timestamp), offset);
    memAccessor.writeValue<int32_t>(val.localFrameId, offset);
    DSQuaternion::writeValue(val.localFromDeviceRotation, memAccessor, offset);
    DSVector3::writeValue(val.localFromDeviceTranslation, memAccessor, offset);
    DSVector3::writeValue(val.localLinearVelocity, memAccessor, offset);
    DSVector3::writeValue(val.deviceRotationalVelocity, memAccessor, offset);
    DSUnitVector3::writeValue(val.localGravityDirection, memAccessor, offset);
  }
};

class DSPoseDynamics {
 public:
  static PoseDynamics readValue(const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {
    DataPoseDynamics data = DSDataPoseDynamics::readValue(memAccessor, offset);
    return PoseDynamics{data};
  }

  static void writeValue(const PoseDynamics& val, const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {
    DSDataPoseDynamics::writeValue(val.data, memAccessor, offset);
  }
};

class DSRgbImage {
 public:
  static RgbImage readValue(const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {
    Xrpa::Image image = DSImageRgbImage::readValue(memAccessor, offset);
    return RgbImage{std::move(image)};
  }

  static void writeValue(const RgbImage& val, const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {
    DSImageRgbImage::writeValue(val.image, memAccessor, offset);
  }

  static int32_t dynSizeOfValue(const RgbImage& val) {
    return DSImageRgbImage::dynSizeOfValue(val.image);
  }
};

} // namespace ImageSelectorDataStore
