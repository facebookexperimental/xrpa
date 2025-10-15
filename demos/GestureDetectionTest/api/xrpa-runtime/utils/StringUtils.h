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

#include <string>

namespace Xrpa {

inline bool strStartsWith(const std::string& fullString, const std::string& prefixString) {
  auto fLength = fullString.length();
  auto pLength = prefixString.length();
  if (fLength < pLength) {
    return false;
  }
  return fullString.compare(0, pLength, prefixString) == 0;
}

inline bool strEndsWith(const std::string& fullString, const std::string& suffixString) {
  auto fLength = fullString.length();
  auto sLength = suffixString.length();
  if (fLength < sLength) {
    return false;
  }
  return fullString.compare(fLength - sLength, sLength, suffixString) == 0;
}

class SimpleStringFilter {
 public:
  SimpleStringFilter& operator=(const std::string& nameFilter) {
    matchNone_ = false;
    exactMatch_ = false;
    prefixMatch_ = false;
    suffixMatch_ = false;
    containsMatch_ = false;

    if (nameFilter.empty()) {
      matchNone_ = true;
    } else if (nameFilter.at(0) == '^') {
      if (nameFilter.at(nameFilter.size() - 1) == '$') {
        exactMatch_ = true;
        str_ = nameFilter.substr(1, nameFilter.size() - 2);
      } else {
        prefixMatch_ = true;
        str_ = nameFilter.substr(1);
      }
    } else if (nameFilter.at(nameFilter.size() - 1) == '$') {
      suffixMatch_ = true;
      str_ = nameFilter.substr(0, nameFilter.size() - 1);
    } else {
      containsMatch_ = true;
      str_ = nameFilter;
    }

    return *this;
  }

  [[nodiscard]] bool match(const std::string& str) const {
    if (exactMatch_) {
      return str == str_;
    }
    if (prefixMatch_) {
      return strStartsWith(str, str_);
    }
    if (suffixMatch_) {
      return strEndsWith(str, str_);
    }
    if (containsMatch_) {
      return str.find(str_) != std::string::npos;
    }
    return false;
  }

 private:
  std::string str_;
  bool matchNone_ = true;
  bool exactMatch_ = false;
  bool prefixMatch_ = false;
  bool suffixMatch_ = false;
  bool containsMatch_ = false;
};

} // namespace Xrpa
