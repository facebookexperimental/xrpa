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
using System.Diagnostics;
using System.IO;
using System.IO.MemoryMappedFiles;
using System.Runtime.InteropServices;
using Xrpa;

[TestFixture]
public class XrpaTypesTest
{
    [Test]
    public void TestObjectUuid()
    {
        Assert.AreEqual(new ObjectUuid(0, 100), new ObjectUuid(0, 100));
        Assert.AreNotEqual(new ObjectUuid(0, 100), new ObjectUuid(1, 100));
        Assert.AreNotEqual(new ObjectUuid(0, 100), new ObjectUuid(0, 200));

        var g = new ObjectUuid(new System.Guid("936DA01F-9ABD-4d9d-80C7-02AF85C822A8"));
        Assert.AreEqual(g.ID0, 2278941892758117709); // 1FA06D93BD9A9D4D (yes, guid strings are in a weird order)
        Assert.AreEqual(g.ID1, 9279388510107214504); // 80C702AF85C822A8
    }
}
