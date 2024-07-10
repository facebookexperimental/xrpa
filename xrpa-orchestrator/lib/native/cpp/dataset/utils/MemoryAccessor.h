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

#include <dataset/utils/XrpaUtils.h>

#include <cstdint>
#include <cstring>
#include <string>

namespace Xrpa {

class MemoryAccessor {
 public:
  MemoryAccessor() {}

  MemoryAccessor(void* memPtr, int32_t offset, int32_t size)
      : memPtr_(static_cast<uint8_t*>(memPtr)), offset_(offset), size_(size) {}

  MemoryAccessor(const MemoryAccessor& other) noexcept {
    memPtr_ = other.memPtr_;
    offset_ = other.offset_;
    size_ = other.size_;
  }

  MemoryAccessor& operator=(const MemoryAccessor& other) noexcept {
    memPtr_ = other.memPtr_;
    offset_ = other.offset_;
    size_ = other.size_;
    return *this;
  }

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

  [[nodiscard]] MemoryAccessor slice(int32_t offset, int32_t size = -1) {
    if (size < 0 || size > size_ - offset) {
      size = size_ - offset;
    }
    if (size < 0) {
      size = 0;
    }
    xrpaDebugBoundsAssert(offset, size, 0, size_);
    return {memPtr_, offset_ + offset, size};
  }

  bool isNull() const {
    return memPtr_ == nullptr || size_ == 0;
  }

  int32_t getOffset() const {
    return offset_;
  }

  int32_t getSize() const {
    return size_;
  }

  void writeToZeros() {
    for (int32_t pos = 0; pos < size_;) {
      if (size_ - pos >= 8) {
        writeValue<uint64_t>(0, pos);
        pos += 8;
      } else if (size_ - pos >= 4) {
        writeValue<uint32_t>(0, pos);
        pos += 4;
      } else {
        writeValue<uint8_t>(0, pos);
        pos += 1;
      }
    }
  }

  void copyFrom(MemoryAccessor other) {
    if (other.isNull()) {
      return;
    }
    int32_t size = other.size_ < size_ ? other.size_ : size_;
    for (int32_t pos = 0; pos < size;) {
      if (size - pos >= 8) {
        writeValue<uint64_t>(other.readValue<uint64_t>(pos), pos);
        pos += 8;
      } else if (size - pos >= 4) {
        writeValue<uint32_t>(other.readValue<uint32_t>(pos), pos);
        pos += 4;
      } else {
        writeValue<uint8_t>(other.readValue<uint8_t>(pos), pos);
        pos += 1;
      }
    }
  }

  void copyFrom(void* ptr) {
    if (ptr == nullptr) {
      return;
    }
    uint8_t* src = reinterpret_cast<uint8_t*>(ptr);
    for (int32_t pos = 0; pos < size_;) {
      if (size_ - pos >= 8) {
        writeValue<uint64_t>(*reinterpret_cast<uint64_t*>(src + pos), pos);
        pos += 8;
      } else if (size_ - pos >= 4) {
        writeValue<uint32_t>(*reinterpret_cast<uint32_t*>(src + pos), pos);
        pos += 4;
      } else {
        writeValue<uint8_t>(*reinterpret_cast<uint8_t*>(src + pos), pos);
        pos += 1;
      }
    }
  }

  template <typename T>
  [[nodiscard]] T readValue(int32_t pos) const {
    xrpaDebugBoundsAssert(pos, sizeof(T), 0, size_);
    return *reinterpret_cast<T*>(memPtr_ + offset_ + pos);
  }

  template <typename T>
  [[nodiscard]] T readValue(int32_t /*pos*/, int32_t /*maxBytes*/) const {
    // this is not implemented generically, it is just for strings right now
    // (this used to be a static_assert but some compilers compile this anyway for some reason and
    // the static assert fires)
    xrpaDebugAssert(false);
  }

  template <>
  [[nodiscard]] std::string readValue<std::string>(int32_t pos, int32_t maxBytes) const {
    auto byteCount = readValue<int32_t>(pos);
    xrpaDebugAssert(byteCount <= maxBytes);
    pos += 4;

    xrpaDebugBoundsAssert(pos, maxBytes, 0, size_);
    return std::string(reinterpret_cast<char*>(memPtr_ + offset_ + pos), byteCount);
  }

  template <typename T>
  void writeValue(const T& val, int32_t pos) {
    xrpaDebugBoundsAssert(pos, sizeof(T), 0, size_);
    *reinterpret_cast<T*>(memPtr_ + offset_ + pos) = val;
  }

  template <typename T>
  void writeValue(const T& /*val*/, int32_t /*pos*/, int32_t /*maxBytes*/) {
    // this is not implemented generically, it is just for strings right now
    // (this used to be a static_assert but some compilers compile this anyway for some reason and
    // the static assert fires)
    xrpaDebugAssert(false);
  }

  template <>
  void writeValue<std::string>(const std::string& val, int32_t pos, int32_t maxBytes) {
    int32_t byteCount = val.size();
    // truncate string to fit in the buffer
    byteCount = std::min(maxBytes, byteCount);
    writeValue<int32_t>(byteCount, pos);
    pos += 4;

    xrpaDebugBoundsAssert(pos, maxBytes, 0, size_);
    std::memcpy(memPtr_ + offset_ + pos, val.data(), byteCount);
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

} // namespace Xrpa
