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
#include "Engine.h"

// std::hash specialization for FString
namespace std {
template <>
struct hash<FString> {
  size_t operator()(const FString& s) const noexcept {
    return std::hash<std::wstring>{}(*s);
  }
};
} // namespace std

// Adaptor class for converting between FString and std::string
// note: this is intended to be used ONLY inline, do not keep a copy around as it just stores a raw
// string pointer
class FStringAdaptor {
 public:
  FStringAdaptor(const std::string& str) : str_(str.c_str()) {}
  FStringAdaptor(const FString& str) : str_(TCHAR_TO_UTF8(*str)) {}

  operator std::string() const {
    return std::string(str_);
  }

  operator FString() const {
    return FString(str_);
  }

 private:
  const char* str_;
};
