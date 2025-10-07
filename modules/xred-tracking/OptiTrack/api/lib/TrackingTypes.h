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
#include <xrpa-runtime/utils/MemoryAccessor.h>
#include <xrpa-runtime/utils/XrpaTypes.h>

namespace TrackingDataStore {

static inline Xrpa::TransportConfig GenTransportConfig() {
  Xrpa::TransportConfig config;
  config.schemaHash = Xrpa::HashValue(0x5aefb4b03a9f08d5, 0x8c7c69fd38506dfd, 0xa44c6de4bec411b9, 0xd576c90e503ed94e);
  config.changelogByteCount = 112128;
  return config;
}

class TrackedObjectReader;

class Pose {
 public:
  Eigen::Vector3f position;
  Eigen::Quaternionf orientation;
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

class DSPose {
 public:
  static Pose readValue(const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {
    Eigen::Vector3f position = DSVector3::readValue(memAccessor, offset);
    Eigen::Quaternionf orientation = DSQuaternion::readValue(memAccessor, offset);
    return Pose{position, orientation};
  }

  static void writeValue(const Pose& val, const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {
    DSVector3::writeValue(val.position, memAccessor, offset);
    DSQuaternion::writeValue(val.orientation, memAccessor, offset);
  }
};

} // namespace TrackingDataStore
