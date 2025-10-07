/*
// @generated
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

#include <xrpa-runtime/utils/XrpaUtils.h>

#include <cstdint>
#include <cstring>
#include <string>
#include <vector>

namespace Xrpa {

class MemoryUtils {
 public:
  template <typename T>
  static constexpr int getTypeSize() {
    return sizeof(T);
  }
};

class MemoryOffset {
 public:
  explicit MemoryOffset(int32_t offset = 0) : offset_(offset) {}

  int32_t advance(int32_t numBytes) {
    auto pos = offset_;
    offset_ += numBytes;
    return pos;
  }

  int32_t offset_;
};

class MemoryAccessor {
 public:
  MemoryAccessor() = default;

  MemoryAccessor(void* memPtr, int32_t offset, int32_t size)
      : memPtr_(static_cast<uint8_t*>(memPtr)), offset_(offset), size_(size) {}

  MemoryAccessor(const MemoryAccessor& other) noexcept {
    memPtr_ = other.memPtr_;
    offset_ = other.offset_;
    size_ = other.size_;
  }

  MemoryAccessor& operator=(const MemoryAccessor& other) noexcept = default;

  MemoryAccessor(MemoryAccessor&& other) noexcept {
    memPtr_ = other.memPtr_;
    offset_ = other.offset_;
    size_ = other.size_;
  }

  MemoryAccessor& operator=(MemoryAccessor&& other) noexcept {
    memPtr_ = other.memPtr_;
    offset_ = other.offset_;
    size_ = other.size_;
    return *this;
  }

  [[nodiscard]] MemoryAccessor slice(int32_t offset, int32_t size = -1) const {
    if (size < 0 || size > size_ - offset) {
      size = size_ - offset;
    }
    if (size < 0) {
      size = 0;
    }
    xrpaDebugBoundsAssert(offset, size, 0, size_);
    return {memPtr_, offset_ + offset, size};
  }

  [[nodiscard]] bool isNull() const {
    return memPtr_ == nullptr || size_ == 0;
  }

  [[nodiscard]] int32_t getOffset() const {
    return offset_;
  }

  [[nodiscard]] int32_t getSize() const {
    return size_;
  }

  void writeToZeros() {
    MemoryOffset writePos;
    while (writePos.offset_ < size_) {
      if (size_ - writePos.offset_ >= 8) {
        writeValue<uint64_t>(0, writePos);
      } else if (size_ - writePos.offset_ >= 4) {
        writeValue<uint32_t>(0, writePos);
      } else {
        writeValue<uint8_t>(0, writePos);
      }
    }
  }

  void copyFrom(const MemoryAccessor& other) {
    if (other.isNull()) {
      return;
    }
    int32_t size = other.size_ < size_ ? other.size_ : size_;
    MemoryOffset readPos;
    MemoryOffset writePos;
    while (readPos.offset_ < size) {
      if (size - readPos.offset_ >= 8) {
        writeValue<uint64_t>(other.readValue<uint64_t>(readPos), writePos);
      } else if (size - readPos.offset_ >= 4) {
        writeValue<uint32_t>(other.readValue<uint32_t>(readPos), writePos);
      } else {
        writeValue<uint8_t>(other.readValue<uint8_t>(readPos), writePos);
      }
    }
  }

  void copyFrom(void* ptr) {
    if (ptr == nullptr) {
      return;
    }
    auto* src = reinterpret_cast<uint8_t*>(ptr);
    MemoryOffset readPos;
    MemoryOffset writePos;
    while (readPos.offset_ < size_) {
      if (size_ - readPos.offset_ >= 8) {
        writeValue<uint64_t>(*reinterpret_cast<uint64_t*>(src + readPos.advance(8)), writePos);
      } else if (size_ - readPos.offset_ >= 4) {
        writeValue<uint32_t>(*reinterpret_cast<uint32_t*>(src + readPos.advance(4)), writePos);
      } else {
        writeValue<uint8_t>(*reinterpret_cast<uint8_t*>(src + readPos.advance(1)), writePos);
      }
    }
  }

  template <typename T>
  [[nodiscard]] T readValue(MemoryOffset& pos) const {
    xrpaDebugBoundsAssert(pos.offset_, sizeof(T), 0, size_);
    return *reinterpret_cast<T*>(memPtr_ + offset_ + pos.advance(sizeof(T)));
  }

  template <>
  [[nodiscard]] std::string readValue<std::string>(MemoryOffset& pos) const {
    auto byteCount = readValue<int32_t>(pos);

    xrpaDebugBoundsAssert(pos.offset_, byteCount, 0, size_);
    return std::string(
        reinterpret_cast<char*>(memPtr_ + offset_ + pos.advance(byteCount)), byteCount);
  }

  template <>
  [[nodiscard]] std::vector<uint8_t> readValue<std::vector<uint8_t>>(MemoryOffset& pos) const {
    auto byteCount = readValue<int32_t>(pos);

    xrpaDebugBoundsAssert(pos.offset_, byteCount, 0, size_);
    auto ret = std::vector<uint8_t>(byteCount);
    std::memcpy(ret.data(), memPtr_ + offset_ + pos.advance(byteCount), byteCount);
    return ret;
  }

  template <typename T>
  void writeValue(const T& val, MemoryOffset& pos) const {
    xrpaDebugBoundsAssert(pos.offset_, sizeof(T), 0, size_);
    *reinterpret_cast<T*>(memPtr_ + offset_ + pos.advance(sizeof(T))) = val;
  }

  template <>
  void writeValue<std::string>(const std::string& val, MemoryOffset& pos) const {
    int32_t byteCount = val.size();
    writeValue<int32_t>(byteCount, pos);

    xrpaDebugBoundsAssert(pos.offset_, byteCount, 0, size_);
    std::memcpy(memPtr_ + offset_ + pos.advance(byteCount), val.data(), byteCount);
  }

  template <>
  void writeValue<std::vector<uint8_t>>(const std::vector<uint8_t>& val, MemoryOffset& pos) const {
    int32_t byteCount = val.size();
    writeValue<int32_t>(byteCount, pos);

    xrpaDebugBoundsAssert(pos.offset_, byteCount, 0, size_);
    std::memcpy(memPtr_ + offset_ + pos.advance(byteCount), val.data(), byteCount);
  }

  template <typename T>
  [[nodiscard]] static int32_t dynSizeOfValue(const T& /*val*/) {
    return 0;
  }

  void* getRawPointer(int32_t pos, int32_t maxBytes) {
    xrpaDebugBoundsAssert(pos, maxBytes, 0, size_);
    return memPtr_ + offset_ + pos;
  }

 private:
  uint8_t* memPtr_ = nullptr;
  int32_t offset_ = 0;
  int32_t size_ = 0;
};

template <>
[[nodiscard]] inline int32_t MemoryAccessor::dynSizeOfValue<std::string>(const std::string& val) {
  return val.size();
}

template <>
[[nodiscard]] inline int32_t MemoryAccessor::dynSizeOfValue<std::vector<uint8_t>>(
    const std::vector<uint8_t>& val) {
  return val.size();
}

} // namespace Xrpa
