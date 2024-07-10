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

#pragma once

#include <dataset/utils/MemoryAccessor.h>
#include <dataset/utils/PlacedMemoryAllocator.h>
#include <dataset/utils/PlacedRingBuffer.h>
#include <dataset/utils/PlacedSortedArray.h>
#include <chrono>
#include <cstdint>
#include <cstring>
#include <memory>
#include <ostream>
#include <sstream>
#include <string>

namespace Xrpa {

inline uint64_t getCurrentClockTimeMicroseconds() {
  auto duration = std::chrono::system_clock::now().time_since_epoch();
  return std::chrono::duration_cast<std::chrono::microseconds>(duration).count();
}

template <typename To, typename From>
inline To reinterpretValue(const From& value) {
  static_assert(sizeof(To) == sizeof(From));
  return *reinterpret_cast<const To*>(&value);
}

class DSHelpers {
 public:
  static constexpr float PI_CONST = 3.14159265358979323846f;
};

class ObjectAccessorInterface {
 public:
  ObjectAccessorInterface() {}
  explicit ObjectAccessorInterface(MemoryAccessor memAccessor) : memAccessor_(memAccessor) {}

  virtual ~ObjectAccessorInterface() {}

  bool isNull() {
    return memAccessor_.isNull();
  }

 protected:
  MemoryAccessor memAccessor_;
};

struct DSHashValue {
  uint64_t value0;
  uint64_t value1;
  uint64_t value2;
  uint64_t value3;

  constexpr DSHashValue() : value0(0), value1(0), value2(0), value3(0) {}

  constexpr DSHashValue(uint64_t part0, uint64_t part1, uint64_t part2, uint64_t part3)
      : value0(part0), value1(part1), value2(part2), value3(part3) {}

  bool operator==(const DSHashValue& other) const {
    return value0 == other.value0 && value1 == other.value1 && value2 == other.value2 &&
        value3 == other.value3;
  }

  bool operator!=(const DSHashValue& other) const {
    return value0 != other.value0 || value1 != other.value1 || value2 != other.value2 ||
        value3 != other.value3;
  }

  static DSHashValue readValue(MemoryAccessor memAccessor, int32_t offset) {
    return DSHashValue(
        memAccessor.readValue<uint64_t>(offset),
        memAccessor.readValue<uint64_t>(offset + 8),
        memAccessor.readValue<uint64_t>(offset + 16),
        memAccessor.readValue<uint64_t>(offset + 24));
  }

  static void writeValue(const DSHashValue& value, MemoryAccessor memAccessor, int32_t offset) {
    memAccessor.writeValue<uint64_t>(value.value0, offset);
    memAccessor.writeValue<uint64_t>(value.value1, offset + 8);
    memAccessor.writeValue<uint64_t>(value.value2, offset + 16);
    memAccessor.writeValue<uint64_t>(value.value3, offset + 24);
  }
};

struct DSHeader {
  int32_t datasetVersion;
  int32_t totalBytes;
  DSHashValue schemaHash;

  // System clock time in microseconds when the Dataset was initialized; all other timestamps are
  // relative to this value.
  // Also indicates that the dataset memory is initialized, as it is set last.
  uint64_t baseTimestamp;

  // memory offsets to the various region data structures
  int32_t objectHeadersRegion;
  int32_t memoryPoolRegion;
  int32_t changelogRegion;
  int32_t messageQueueRegion;

  // this is the monotonically increasing ID value for the last entry written to the changelog;
  // readers can check this without locking the mutex to see if there have been changes
  int32_t lastChangelogID;

  // this is the monotonically increasing ID value for the last entry written to the message queue;
  // readers can check this without locking the mutex to see if there have been changes
  int32_t lastMessageID;
};
static_assert(sizeof(DSHeader) == 72);

struct DSIdentifier {
  uint64_t id0;
  uint64_t id1;

  constexpr DSIdentifier() : id0(0), id1(0) {}

  constexpr DSIdentifier(uint64_t part0, uint64_t part1) : id0(part0), id1(part1) {}

  constexpr DSIdentifier(uint32_t A, uint32_t B, uint32_t C, uint32_t D)
      : id0((((uint64_t)A) << 32) | B), id1((((uint64_t)C) << 32) | D) {}

  template <typename T>
  explicit DSIdentifier(const T& value) {
    uint32_t A = value[0];
    uint32_t B = value[1];
    uint32_t C = value[2];
    uint32_t D = value[3];
    id0 = (((uint64_t)A) << 32) | B;
    id1 = (((uint64_t)C) << 32) | D;
  }

  void clear() {
    id0 = 0;
    id1 = 0;
  }

  bool isEmpty() const {
    return id0 == 0 && id1 == 0;
  }

  bool operator==(const DSIdentifier& other) const {
    return id0 == other.id0 && id1 == other.id1;
  }

  bool operator!=(const DSIdentifier& other) const {
    return id0 != other.id0 || id1 != other.id1;
  }

  operator std::string() const;

  int compare(const DSIdentifier& other) const {
    if (id0 == other.id0) {
      if (id1 == other.id1) {
        return 0;
      }
      return id1 < other.id1 ? -1 : 1;
    }
    return id0 < other.id0 ? -1 : 1;
  }

  static DSIdentifier readValue(MemoryAccessor memAccessor, int32_t offset) {
    return DSIdentifier(
        memAccessor.readValue<uint64_t>(offset), memAccessor.readValue<uint64_t>(offset + 8));
  }

  static void writeValue(const DSIdentifier& value, MemoryAccessor memAccessor, int32_t offset) {
    memAccessor.writeValue<uint64_t>(value.id0, offset);
    memAccessor.writeValue<uint64_t>(value.id1, offset + 8);
  }
};

struct DSObjectHeader {
  DSIdentifier id;
  int32_t type;
  int32_t poolOffset;
  int32_t createTimestamp;

  static int compare(const DSObjectHeader& a, const DSObjectHeader& b) {
    return a.id.compare(b.id);
  }

  static int compare(const DSObjectHeader& a, const DSIdentifier& id) {
    return a.id.compare(id);
  }
};
static_assert(sizeof(DSObjectHeader) == 32);
static_assert(offsetof(DSObjectHeader, type) == 16);

enum class DSChangeType : int32_t {
  CreateObject = 0,
  DeleteObject = 1,
  UpdateObject = 2,
};

class DSChangeEventAccessor : public ObjectAccessorInterface {
 public:
  static constexpr int32_t DS_SIZE = 32;

  explicit DSChangeEventAccessor(MemoryAccessor memAccessor)
      : ObjectAccessorInterface(memAccessor) {}

  DSIdentifier getTargetID() {
    return DSIdentifier::readValue(memAccessor_, 0);
  }

  void setTargetID(const DSIdentifier& id) {
    DSIdentifier::writeValue(id, memAccessor_, 0);
  }

  int32_t getTargetType() {
    return memAccessor_.readValue<int32_t>(16);
  }

  void setTargetType(int32_t type) {
    memAccessor_.writeValue<int32_t>(type, 16);
  }

  int32_t getTargetPoolOffset() {
    return memAccessor_.readValue<int32_t>(20);
  }

  void setTargetPoolOffset(int32_t poolOffset) {
    memAccessor_.writeValue<int32_t>(poolOffset, 20);
  }

  void setTarget(const DSObjectHeader& target) {
    setTargetID(target.id);
    setTargetType(target.type);
    setTargetPoolOffset(target.poolOffset);
  }

  void clearPoolOffsetIfMatch(int32_t poolOffset) {
    int32_t curPoolOffset = getTargetPoolOffset();
    if (curPoolOffset == poolOffset) {
      setTargetPoolOffset(0);
    }
  }

  DSChangeType getChangeType() {
    return memAccessor_.readValue<DSChangeType>(24);
  }

  void setChangeType(DSChangeType type) {
    memAccessor_.writeValue<DSChangeType>(type, 24);
  }

  int32_t getTimestamp() {
    return memAccessor_.readValue<int32_t>(28);
  }

  void setTimestamp(int32_t timestamp) {
    memAccessor_.writeValue<int32_t>(timestamp, 28);
  }

  uint64_t getChangedFields() {
    return memAccessor_.readValue<uint64_t>(32);
  }

  void setChangedFields(uint64_t fieldMask) {
    memAccessor_.writeValue<uint64_t>(fieldMask, 32);
  }
};

class DSMessageAccessor : public ObjectAccessorInterface {
 public:
  static constexpr int32_t DS_SIZE = 28;

  explicit DSMessageAccessor(MemoryAccessor memAccessor) : ObjectAccessorInterface(memAccessor) {}

  DSIdentifier getTargetID() {
    return DSIdentifier::readValue(memAccessor_, 0);
  }

  void setTargetID(const DSIdentifier& id) {
    DSIdentifier::writeValue(id, memAccessor_, 0);
  }

  int32_t getTargetType() {
    return memAccessor_.readValue<int32_t>(16);
  }

  void setTargetType(int32_t type) {
    memAccessor_.writeValue<int32_t>(type, 16);
  }

  void setTarget(const DSObjectHeader& target) {
    setTargetID(target.id);
    setTargetType(target.type);
  }

  int32_t getMessageType() {
    return memAccessor_.readValue<int32_t>(20);
  }

  void setMessageType(int32_t type) {
    memAccessor_.writeValue<int32_t>(type, 20);
  }

  int32_t getTimestamp() {
    return memAccessor_.readValue<int32_t>(24);
  }

  void setTimestamp(int32_t timestamp) {
    memAccessor_.writeValue<int32_t>(timestamp, 24);
  }

  MemoryAccessor accessMessageData() {
    return memAccessor_.slice(28);
  }
};

using DSObjectHeaderArray = PlacedSortedArray<DSObjectHeader>;

} // namespace Xrpa

// specialize std::hash for DSIdentifier
template <>
struct std::hash<Xrpa::DSIdentifier> {
  std::size_t operator()(const Xrpa::DSIdentifier& k) const {
    return ((std::hash<uint64_t>()(k.id0) ^ (std::hash<uint64_t>()(k.id1) << 1)) >> 1);
  }
};

// specialize std::ostream for DSIdentifier
inline std::ostream& operator<<(std::ostream& os, const Xrpa::DSIdentifier& k) {
  uint32_t A = (k.id0 >> 32) & 0xFFFFFFFF;
  uint32_t B = (k.id0) & 0xFFFFFFFF;
  uint32_t C = (k.id1 >> 32) & 0xFFFFFFFF;
  uint32_t D = (k.id1) & 0xFFFFFFFF;
  return os << A << "-" << B << "-" << C << "-" << D;
}

inline Xrpa::DSIdentifier::operator std::string() const {
  std::ostringstream oss;
  oss << *this;
  return oss.str();
}
