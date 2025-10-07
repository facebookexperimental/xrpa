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

#include <xrpa-runtime/utils/StringEmbedding.h>

using namespace Xrpa;

TEST(StringEmbedding, test) {
  StringEmbedding strEmbed("Test {{{a}}} {{{b}}} {{{a}}}");

  int changeCount = 0;
  strEmbed.onXrpaFieldsChanged([&changeCount](uint64_t) { changeCount++; });

  strEmbed.setEmbeddingValue("{{{a}}}", "testA");
  strEmbed.setEmbeddingValue("{{{b}}}", "testB");

  EXPECT_EQ(changeCount, 2);
  EXPECT_EQ(strEmbed.getValue(), "Test testA testB testA");

  strEmbed.setEmbeddingValue("{{{a}}}", 2);
  EXPECT_EQ(changeCount, 3);
  EXPECT_EQ(strEmbed.getValue(), "Test 2 testB 2");

  strEmbed.setEmbeddingValue("{{{b}}}", true);
  EXPECT_EQ(changeCount, 4);
  EXPECT_EQ(strEmbed.getValue(), "Test 2 true 2");
}
