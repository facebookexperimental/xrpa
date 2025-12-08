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

#include <cstdint>
#include <cstdlib>
#include <cstring>
#include <iterator>
#include <memory>
#include <utility>

namespace Xrpa {

// ByteVector: A byte array type that avoids zero-initialization overhead.
// Unlike std::vector<uint8_t>, this type does not zero-initialize memory on construction,
// making it significantly faster for large allocations that will be immediately overwritten.
class ByteVector {
 public:
  using value_type = uint8_t;
  using size_type = int32_t;
  using iterator = uint8_t*;
  using const_iterator = const uint8_t*;

  ByteVector() = default;
  ~ByteVector() = default;

  explicit ByteVector(size_type size) : data_(allocate(size)), size_(size) {}

  ByteVector(const uint8_t* src, size_type size) : data_(allocate(size)), size_(size) {
    std::memcpy(data_.get(), src, size);
  }

  template <typename InputIt>
  ByteVector(InputIt first, InputIt last) {
    size_ = static_cast<size_type>(std::distance(first, last));
    data_ = allocate(size_);
    std::copy(first, last, data_.get());
  }

  ByteVector(const ByteVector& other) : data_(allocate(other.size_)), size_(other.size_) {
    std::memcpy(data_.get(), other.data_.get(), size_);
  }

  ByteVector& operator=(const ByteVector& other) {
    if (this != &other) {
      data_ = allocate(other.size_);
      size_ = other.size_;
      std::memcpy(data_.get(), other.data_.get(), size_);
    }
    return *this;
  }

  ByteVector(ByteVector&&) noexcept = default;
  ByteVector& operator=(ByteVector&&) noexcept = default;

  [[nodiscard]] uint8_t* data() noexcept {
    return data_.get();
  }

  [[nodiscard]] const uint8_t* data() const noexcept {
    return data_.get();
  }

  [[nodiscard]] size_type size() const noexcept {
    return size_;
  }

  [[nodiscard]] bool empty() const noexcept {
    return size_ == 0;
  }

  uint8_t& operator[](size_type index) noexcept {
    return data_[index];
  }

  const uint8_t& operator[](size_type index) const noexcept {
    return data_[index];
  }

  // Iterator support
  [[nodiscard]] iterator begin() noexcept {
    return data_.get();
  }

  [[nodiscard]] const_iterator begin() const noexcept {
    return data_.get();
  }

  [[nodiscard]] iterator end() noexcept {
    return data_.get() + size_;
  }

  [[nodiscard]] const_iterator end() const noexcept {
    return data_.get() + size_;
  }

  [[nodiscard]] const_iterator cbegin() const noexcept {
    return data_.get();
  }

  [[nodiscard]] const_iterator cend() const noexcept {
    return data_.get() + size_;
  }

  // Resize the buffer (does NOT preserve existing data, does NOT zero-initialize)
  void resize(size_type newSize) {
    if (newSize != size_) {
      data_ = allocate(newSize);
      size_ = newSize;
    }
  }

  // Clear the buffer
  void clear() noexcept {
    data_.reset();
    size_ = 0;
  }

 private:
  static std::unique_ptr<uint8_t[]> allocate(size_type size) {
    if (size <= 0) {
      return nullptr;
    }
    return std::unique_ptr<uint8_t[]>(new uint8_t[size]);
  }

  std::unique_ptr<uint8_t[]> data_;
  size_type size_ = 0;
};

} // namespace Xrpa
