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

#include <folly/portability/GTest.h>

#include <xrpa-runtime/utils/StringUtils.h>

using namespace Xrpa;

TEST(StringUtils, strStartsWith) {
  EXPECT_EQ(strStartsWith("somestring", "some"), true);
  EXPECT_EQ(strStartsWith("somestring", "so"), true);
  EXPECT_EQ(strStartsWith("somestring", "ome"), false);
  EXPECT_EQ(strStartsWith("somestring", "string"), false);
}

TEST(StringUtils, strEndsWith) {
  EXPECT_EQ(strEndsWith("somestring", "some"), false);
  EXPECT_EQ(strEndsWith("somestring", "so"), false);
  EXPECT_EQ(strEndsWith("somestring", "ome"), false);
  EXPECT_EQ(strEndsWith("somestring", "string"), true);
  EXPECT_EQ(strEndsWith("somestring", "ing"), true);
  EXPECT_EQ(strEndsWith("somestring", "str"), false);
}

TEST(StringUtils, SimpleStringFilter) {
  SimpleStringFilter filter;

  // none
  filter = "";
  EXPECT_EQ(filter.match("foo"), false);
  EXPECT_EQ(filter.match("bar"), false);
  EXPECT_EQ(filter.match(""), false);

  // contains
  filter = "foo";
  EXPECT_EQ(filter.match("foo"), true);
  EXPECT_EQ(filter.match("myfoo"), true);
  EXPECT_EQ(filter.match("fooever"), true);
  EXPECT_EQ(filter.match("bar"), false);
  EXPECT_EQ(filter.match(""), false);

  // prefix
  filter = "^foo";
  EXPECT_EQ(filter.match("foo"), true);
  EXPECT_EQ(filter.match("myfoo"), false);
  EXPECT_EQ(filter.match("fooever"), true);
  EXPECT_EQ(filter.match("bar"), false);
  EXPECT_EQ(filter.match(""), false);

  // suffix
  filter = "foo$";
  EXPECT_EQ(filter.match("foo"), true);
  EXPECT_EQ(filter.match("myfoo"), true);
  EXPECT_EQ(filter.match("fooever"), false);
  EXPECT_EQ(filter.match("bar"), false);
  EXPECT_EQ(filter.match(""), false);

  // exact
  filter = "^foo$";
  EXPECT_EQ(filter.match("foo"), true);
  EXPECT_EQ(filter.match("myfoo"), false);
  EXPECT_EQ(filter.match("fooever"), false);
  EXPECT_EQ(filter.match("bar"), false);
  EXPECT_EQ(filter.match(""), false);
}
