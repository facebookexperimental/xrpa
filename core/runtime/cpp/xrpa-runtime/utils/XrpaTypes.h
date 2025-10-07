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
#include <xrpa-runtime/utils/TimeUtils.h>
#include <cstdint>
#include <cstring>
#include <ostream>
#include <sstream>
#include <string>
#include <utility>

namespace Xrpa {

template <typename To, typename From>
inline To reinterpretValue(const From& value) {
  static_assert(sizeof(To) == sizeof(From));
  return *reinterpret_cast<const To*>(&value);
}

class XrpaConstants {
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
};

struct HashValue {
  uint64_t value0;
  uint64_t value1;
  uint64_t value2;
  uint64_t value3;

  constexpr HashValue() : value0(0), value1(0), value2(0), value3(0) {}

  constexpr HashValue(uint64_t part0, uint64_t part1, uint64_t part2, uint64_t part3)
      : value0(part0), value1(part1), value2(part2), value3(part3) {}

  bool operator==(const HashValue& other) const {
    return value0 == other.value0 && value1 == other.value1 && value2 == other.value2 &&
        value3 == other.value3;
  }

  bool operator!=(const HashValue& other) const {
    return value0 != other.value0 || value1 != other.value1 || value2 != other.value2 ||
        value3 != other.value3;
  }

  static HashValue readValue(const MemoryAccessor& memAccessor, MemoryOffset& offset) {
    auto v0 = memAccessor.readValue<uint64_t>(offset);
    auto v1 = memAccessor.readValue<uint64_t>(offset);
    auto v2 = memAccessor.readValue<uint64_t>(offset);
    auto v3 = memAccessor.readValue<uint64_t>(offset);
    return {v0, v1, v2, v3};
  }

  static void
  writeValue(const HashValue& value, const MemoryAccessor& memAccessor, MemoryOffset& offset) {
    memAccessor.writeValue<uint64_t>(value.value0, offset);
    memAccessor.writeValue<uint64_t>(value.value1, offset);
    memAccessor.writeValue<uint64_t>(value.value2, offset);
    memAccessor.writeValue<uint64_t>(value.value3, offset);
  }
};

struct TransportConfig {
  HashValue schemaHash;
  int changelogByteCount{};
};

struct ObjectUuid {
  uint64_t id0;
  uint64_t id1;

  constexpr ObjectUuid() : id0(0), id1(0) {}

  constexpr ObjectUuid(uint64_t part0, uint64_t part1) : id0(part0), id1(part1) {}

  constexpr ObjectUuid(uint32_t A, uint32_t B, uint32_t C, uint32_t D)
      : id0((((uint64_t)A) << 32) | B), id1((((uint64_t)C) << 32) | D) {}

  template <typename T>
  explicit ObjectUuid(const T& value) {
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

  bool operator==(const ObjectUuid& other) const {
    return id0 == other.id0 && id1 == other.id1;
  }

  bool operator!=(const ObjectUuid& other) const {
    return id0 != other.id0 || id1 != other.id1;
  }

  // @lint-ignore CLANGTIDY hicpp-explicit-conversions
  operator std::string() const;

  [[nodiscard]] int compare(const ObjectUuid& other) const {
    if (id0 == other.id0) {
      if (id1 == other.id1) {
        return 0;
      }
      return id1 < other.id1 ? -1 : 1;
    }
    return id0 < other.id0 ? -1 : 1;
  }

  static ObjectUuid readValue(const MemoryAccessor& memAccessor, MemoryOffset& offset) {
    auto v0 = memAccessor.readValue<uint64_t>(offset);
    auto v1 = memAccessor.readValue<uint64_t>(offset);
    return {v0, v1};
  }

  static void
  writeValue(const ObjectUuid& value, const MemoryAccessor& memAccessor, MemoryOffset& offset) {
    memAccessor.writeValue<uint64_t>(value.id0, offset);
    memAccessor.writeValue<uint64_t>(value.id1, offset);
  }
};

} // namespace Xrpa

// specialize std::hash for ObjectUuid
template <>
struct std::hash<Xrpa::ObjectUuid> {
  std::size_t operator()(const Xrpa::ObjectUuid& k) const {
    return ((std::hash<uint64_t>()(k.id0) ^ (std::hash<uint64_t>()(k.id1) << 1)) >> 1);
  }
};

// specialize std::ostream for ObjectUuid
inline std::ostream& operator<<(std::ostream& os, const Xrpa::ObjectUuid& k) {
  uint32_t A = (k.id0 >> 32) & 0xFFFFFFFF;
  uint32_t B = (k.id0) & 0xFFFFFFFF;
  uint32_t C = (k.id1 >> 32) & 0xFFFFFFFF;
  uint32_t D = (k.id1) & 0xFFFFFFFF;
  return os << A << "-" << B << "-" << C << "-" << D;
}

inline Xrpa::ObjectUuid::operator std::string() const {
  std::ostringstream oss;
  oss << *this;
  return oss.str();
}
