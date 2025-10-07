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


using NUnit.Framework;
using System;
using System.Collections.Generic;
using Xrpa;

[TestFixture]
public class StringEmbeddingTest
{
    [Test]
    public void TestStringEmbedding()
    {
        var strEmbed = new StringEmbedding("Test {{{a}}} {{{b}}} {{{a}}}");

        int changeCount = 0;
        strEmbed.OnXrpaFieldsChanged((ulong _) => changeCount++);

        strEmbed.SetEmbeddingValue("{{{a}}}", "testA");
        strEmbed.SetEmbeddingValue("{{{b}}}", "testB");

        Assert.AreEqual(2, changeCount);
        Assert.AreEqual("Test testA testB testA", strEmbed.GetValue());

        strEmbed.SetEmbeddingValue("{{{a}}}", 2);
        Assert.AreEqual(3, changeCount);
        Assert.AreEqual("Test 2 testB 2", strEmbed.GetValue());

        strEmbed.SetEmbeddingValue("{{{b}}}", true);
        Assert.AreEqual(4, changeCount);
        Assert.AreEqual("Test 2 true 2", strEmbed.GetValue());
    }
}
