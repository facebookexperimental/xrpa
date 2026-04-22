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

#include <gtest/gtest.h>

#include <BleInterface.h>

#include <string>

// ============================================================================
// wstringConvert Tests
// ============================================================================

TEST(WstringConvertTest, ConvertsAsciiString) {
  std::string result = wstringConvert(L"Hello, World!");
  EXPECT_EQ(result, "Hello, World!");
}

TEST(WstringConvertTest, ConvertsEmptyString) {
  std::string result = wstringConvert(L"");
  EXPECT_TRUE(result.empty());
}

TEST(WstringConvertTest, ConvertsBackslashesInDevicePaths) {
  // Simulates a typical Windows BLE device path with backslashes and braces
  std::string result = wstringConvert(L"\\\\?\\BTHLE#Dev_{781aee18-7733-4ce4}");
  EXPECT_EQ(result, "\\\\?\\BTHLE#Dev_{781aee18-7733-4ce4}");
}

TEST(WstringConvertTest, ConvertsMultiByteUnicodeToUtf8) {
  // Euro sign (U+20AC) encodes to 3 bytes in UTF-8: 0xE2 0x82 0xAC
  std::string result = wstringConvert(L"\u20AC");

  const std::string expected = {
      static_cast<char>(0xE2), static_cast<char>(0x82), static_cast<char>(0xAC)};
  EXPECT_EQ(result, expected);
}

TEST(WstringConvertTest, ConvertsTwoByteUnicodeToUtf8) {
  // Latin small letter u with diaeresis (U+00FC, "ü") encodes to 2 bytes
  // in UTF-8: 0xC3 0xBC
  std::string result = wstringConvert(L"\u00FC");

  const std::string expected = {static_cast<char>(0xC3), static_cast<char>(0xBC)};
  EXPECT_EQ(result, expected);
}

TEST(WstringConvertTest, ConvertsMixedAsciiAndUnicode) {
  // "price: £100" - pound sign (U+00A3) is a 2-byte UTF-8 character
  std::string result = wstringConvert(L"price: \u00A3100");

  // Verify the ASCII prefix is intact
  EXPECT_EQ(result.substr(0, 7), "price: ");
  // Verify the trailing ASCII digits are present after the multi-byte char
  EXPECT_NE(result.find("100"), std::string::npos);
  // Total length: 7 ASCII + 2 bytes for £ + 3 ASCII = 12
  EXPECT_EQ(result.size(), 12u);
}
