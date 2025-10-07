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

#include <functional>
#include <string>
#include <unordered_map>
#include <utility>

namespace Xrpa {

class StringEmbedding {
 public:
  explicit StringEmbedding(const std::string& str) : srcString_(str) {}

  template <typename T>
  void setEmbeddingValue(const std::string& key, const T& value) {
    setEmbeddingValue(key, std::to_string(value));
  }

  void setEmbeddingValue(const std::string& key, const char* value) {
    setEmbeddingValue(key, std::string(value));
  }

  void setEmbeddingValue(const std::string& key, bool value) {
    setEmbeddingValue(key, value ? "true" : "false");
  }

  void setEmbeddingValue(const std::string& key, const std::string& value) {
    auto it = embeddedValues_.find(key);
    if (it == embeddedValues_.end() || it->second != value) {
      embeddedValues_[key] = value;
      isDirty_ = true;
      if (xrpaFieldsChangedHandler_) {
        xrpaFieldsChangedHandler_(1);
      }
    }
  }

  std::string getValue() {
    if (isDirty_) {
      std::string result = srcString_;
      for (const auto& [key, value] : embeddedValues_) {
        size_t pos = 0;
        while ((pos = result.find(key, pos)) != std::string::npos) {
          result.replace(pos, key.length(), value);
          pos += value.length();
        }
      }
      processedString_ = result;
      isDirty_ = false;
    }
    return processedString_;
  }

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = std::move(handler);
    if (isDirty_ && xrpaFieldsChangedHandler_) {
      xrpaFieldsChangedHandler_(1);
    }
  }

 private:
  std::string srcString_;
  std::string processedString_;
  std::unordered_map<std::string, std::string> embeddedValues_;
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;
  bool isDirty_ = false;
};

} // namespace Xrpa
