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

#include <xrpa-runtime/utils/MemoryAccessor.h>
#include <xrpa-runtime/utils/PlacedMemoryAllocator.h>
#include <xrpa-runtime/utils/PlacedRingBuffer.h>
#include <xrpa-runtime/utils/PlacedSortedArray.h>
#include <chrono>
#include <cstdint>
#include <cstring>
#include <memory>
#include <ostream>
#include <sstream>
#include <string>
#include <utility>

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
  ObjectAccessorInterface() = default;
  explicit ObjectAccessorInterface(MemoryAccessor memAccessor)
      : memAccessor_(std::move(memAccessor)) {}

  virtual ~ObjectAccessorInterface() = default;

  bool isNull() {
    return memAccessor_.isNull();
  }

 protected:
  MemoryAccessor memAccessor_;
  int32_t curReadPos_ = 0;
  int32_t curWritePos_ = 0;

  int32_t advanceReadPos(int32_t numBytes) {
    auto pos = curReadPos_;
    curReadPos_ += numBytes;
    return pos;
  }

  int32_t advanceWritePos(int32_t numBytes) {
    auto pos = curWritePos_;
    curWritePos_ += numBytes;
    return pos;
  }
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

  static DSHashValue readValue(const MemoryAccessor& memAccessor, int32_t offset) {
    return {
        memAccessor.readValue<uint64_t>(offset),
        memAccessor.readValue<uint64_t>(offset + 8),
        memAccessor.readValue<uint64_t>(offset + 16),
        memAccessor.readValue<uint64_t>(offset + 24)};
  }

  static void writeValue(const DSHashValue& value, MemoryAccessor memAccessor, int32_t offset) {
    memAccessor.writeValue<uint64_t>(value.value0, offset);
    memAccessor.writeValue<uint64_t>(value.value1, offset + 8);
    memAccessor.writeValue<uint64_t>(value.value2, offset + 16);
    memAccessor.writeValue<uint64_t>(value.value3, offset + 24);
  }
};

class DSHeaderAccessor : public ObjectAccessorInterface {
 public:
  static constexpr int32_t DS_SIZE = 52;

  explicit DSHeaderAccessor(void* memPtr)
      : ObjectAccessorInterface(MemoryAccessor(memPtr, 0, DS_SIZE)) {}

  int32_t getDatasetVersion() {
    return memAccessor_.readValue<int32_t>(0);
  }

  void setDatasetVersion(int32_t type) {
    memAccessor_.writeValue<int32_t>(type, 0);
  }

  int32_t getTotalBytes() {
    return memAccessor_.readValue<int32_t>(4);
  }

  void setTotalBytes(int32_t type) {
    memAccessor_.writeValue<int32_t>(type, 4);
  }

  DSHashValue getSchemaHash() {
    return DSHashValue::readValue(memAccessor_, 8);
  }

  void setSchemaHash(const DSHashValue& hash) {
    DSHashValue::writeValue(hash, memAccessor_, 8);
  }

  uint64_t getBaseTimestamp() {
    return memAccessor_.readValue<uint64_t>(40);
  }

  void setBaseTimestamp(uint64_t timestamp) {
    memAccessor_.writeValue<uint64_t>(timestamp, 40);
  }

  int32_t getLastChangelogID() {
    return memAccessor_.readValue<int32_t>(48);
  }

  void setLastChangelogID(int32_t id) {
    memAccessor_.writeValue<int32_t>(id, 48);
  }

  PlacedRingBuffer* getChangelog(int32_t numBytes = 0) {
    auto* changelog = static_cast<PlacedRingBuffer*>(memAccessor_.getRawPointer(DS_SIZE, 0));
    if (numBytes > 0) {
      changelog->init(numBytes);
    }
    return changelog;
  }

  void setNull() {
    memAccessor_ = MemoryAccessor();
  }
};

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

  [[nodiscard]] bool isEmpty() const {
    return id0 == 0 && id1 == 0;
  }

  bool operator==(const DSIdentifier& other) const {
    return id0 == other.id0 && id1 == other.id1;
  }

  bool operator!=(const DSIdentifier& other) const {
    return id0 != other.id0 || id1 != other.id1;
  }

  // @lint-ignore CLANGTIDY hicpp-explicit-conversions
  operator std::string() const;

  [[nodiscard]] int compare(const DSIdentifier& other) const {
    if (id0 == other.id0) {
      if (id1 == other.id1) {
        return 0;
      }
      return id1 < other.id1 ? -1 : 1;
    }
    return id0 < other.id0 ? -1 : 1;
  }

  static DSIdentifier readValue(const MemoryAccessor& memAccessor, int32_t offset) {
    return {memAccessor.readValue<uint64_t>(offset), memAccessor.readValue<uint64_t>(offset + 8)};
  }

  static void writeValue(const DSIdentifier& value, MemoryAccessor memAccessor, int32_t offset) {
    memAccessor.writeValue<uint64_t>(value.id0, offset);
    memAccessor.writeValue<uint64_t>(value.id1, offset + 8);
  }
};

class DSChangeEventAccessor : public ObjectAccessorInterface {
 public:
  static constexpr int32_t DS_SIZE = 8;

  explicit DSChangeEventAccessor(MemoryAccessor memAccessor)
      : ObjectAccessorInterface(std::move(memAccessor)) {}

  int32_t getChangeType() {
    return memAccessor_.readValue<int32_t>(0);
  }

  void setChangeType(int32_t type) {
    memAccessor_.writeValue<int32_t>(type, 0);
  }

  int32_t getTimestamp() {
    return memAccessor_.readValue<int32_t>(4);
  }

  void setTimestamp(int32_t timestamp) {
    memAccessor_.writeValue<int32_t>(timestamp, 4);
  }
};

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
