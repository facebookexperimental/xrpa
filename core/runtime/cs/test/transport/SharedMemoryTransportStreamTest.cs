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
using System.Security.Cryptography;
using System.Text;
using Xrpa;

[TestFixture]
public class SharedMemoryTransportStreamTest
{
    private static TransportConfig GenConfig(int changelogByteCount = 8192)
    {
        TransportConfig config = new TransportConfig();
        config.SchemaHash = new HashValue(0x1111111111111111, 0x2222222222222222, 0x3333333333333333, 0x4444444444444444);
        config.ChangelogByteCount = changelogByteCount;
        return config;
    }

    private static string RandomName(int length = 16)
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder result = new StringBuilder(length);
        using (RandomNumberGenerator rng = RandomNumberGenerator.Create())
        {
            byte[] uintBuffer = new byte[sizeof(uint)];
            for (int i = 0; i < length; ++i)
            {
                rng.GetBytes(uintBuffer);
                uint num = BitConverter.ToUInt32(uintBuffer, 0);
                result.Append(chars[(int)(num % (uint)chars.Length)]);
            }
        }
        return result.ToString();
    }

    private TransportTest.TransportTest _transportTest;
    private DataStoreReconcilerTest.DataStoreReconcilerTest _reconcilerTest;

    [OneTimeSetUp]
    public void SetUp()
    {
        _transportTest = new();
        _reconcilerTest = new();
    }

    [Test]
    public void TestObjectTests()
    {
        var config = GenConfig();
        var name = RandomName();

        var writerTransport = new SharedMemoryTransportStream(name, config);
        var readerTransport = new SharedMemoryTransportStream(name, config);

        _transportTest.RunTransportObjectTests(readerTransport, writerTransport);

        readerTransport.Dispose();
        writerTransport.Dispose();
    }

    [Test]
    public void TestReaderTests()
    {
        var config = GenConfig(512); // intentionally small changelog
        var name = RandomName();

        var writerInboundTransport = new SharedMemoryTransportStream(name + "Inbound", config);
        var writerOutboundTransport = new SharedMemoryTransportStream(name + "Outbound", config);

        var readerInboundTransport = new SharedMemoryTransportStream(name + "Outbound", config);
        var readerOutboundTransport = new SharedMemoryTransportStream(name + "Inbound", config);

        _reconcilerTest.RunReadReconcilerTests(readerInboundTransport, readerOutboundTransport, writerInboundTransport, writerOutboundTransport);

        readerOutboundTransport.Dispose();
        readerInboundTransport.Dispose();
        writerOutboundTransport.Dispose();
        writerInboundTransport.Dispose();
    }

    [Test]
    public void TestWriterTests()
    {
        var config = GenConfig();
        var name = RandomName();

        var writerInboundTransport = new SharedMemoryTransportStream(name + "Inbound", config);
        var writerOutboundTransport = new SharedMemoryTransportStream(name + "Outbound", config);

        var readerInboundTransport = new SharedMemoryTransportStream(name + "Outbound", config);
        var readerOutboundTransport = new SharedMemoryTransportStream(name + "Inbound", config);

        _reconcilerTest.RunWriteReconcilerTests(readerInboundTransport, readerOutboundTransport, writerInboundTransport, writerOutboundTransport);

        readerOutboundTransport.Dispose();
        readerInboundTransport.Dispose();
        writerOutboundTransport.Dispose();
        writerInboundTransport.Dispose();
    }

    [Test]
    public void TestReaderBeforeWriter()
    {
        var config = GenConfig();
        var name = RandomName();

        var readerTransport = new SharedMemoryTransportStream(name, config);
        var writerTransport = new SharedMemoryTransportStream(name, config);

        _transportTest.RunTransportObjectTests(readerTransport, writerTransport);

        writerTransport.Dispose();
        readerTransport.Dispose();
    }

    [Test]
    public void TestReaderBeforeWriterReconciler()
    {
        var config = GenConfig(512); // intentionally small changelog
        var name = RandomName();

        var readerInboundTransport = new SharedMemoryTransportStream(name + "Outbound", config);
        var readerOutboundTransport = new SharedMemoryTransportStream(name + "Inbound", config);

        var writerInboundTransport = new SharedMemoryTransportStream(name + "Inbound", config);
        var writerOutboundTransport = new SharedMemoryTransportStream(name + "Outbound", config);

        _reconcilerTest.RunReadReconcilerTests(readerInboundTransport, readerOutboundTransport, writerInboundTransport, writerOutboundTransport);

        readerOutboundTransport.Dispose();
        readerInboundTransport.Dispose();
        writerOutboundTransport.Dispose();
        writerInboundTransport.Dispose();
    }

    [Test]
    public void TestChangedWriter()
    {
        var config = GenConfig(512); // intentionally small changelog
        var name = RandomName();

        var readerInboundTransport = new SharedMemoryTransportStream(name + "Outbound", config);
        var readerOutboundTransport = new SharedMemoryTransportStream(name + "Inbound", config);

        _reconcilerTest.RunReadReconcilerInterruptTests(readerInboundTransport, readerOutboundTransport, () =>
        {
            var writerInboundTransport = new SharedMemoryTransportStream(name + "Inbound", config);
            var writerOutboundTransport = new SharedMemoryTransportStream(name + "Outbound", config);

            return new Tuple<TransportStream, TransportStream>(writerInboundTransport, writerOutboundTransport);
        });

        readerOutboundTransport.Dispose();
        readerInboundTransport.Dispose();
    }

    [Test]
    public void TestReverseFieldTests()
    {
        var config = GenConfig();
        var name = RandomName();

        var writerInboundTransport = new SharedMemoryTransportStream(name + "Inbound", config);
        var writerOutboundTransport = new SharedMemoryTransportStream(name + "Outbound", config);

        var readerInboundTransport = new SharedMemoryTransportStream(name + "Outbound", config);
        var readerOutboundTransport = new SharedMemoryTransportStream(name + "Inbound", config);

        _reconcilerTest.RunReverseReconciledFieldsTests(readerInboundTransport, readerOutboundTransport, writerInboundTransport, writerOutboundTransport);

        readerOutboundTransport.Dispose();
        readerInboundTransport.Dispose();
        writerOutboundTransport.Dispose();
        writerInboundTransport.Dispose();
    }

    [Test]
    public void TestSignalTransportTests()
    {
        var config = GenConfig();
        var name = RandomName();

        var writerInboundTransport = new SharedMemoryTransportStream(name + "Inbound", config);
        var writerOutboundTransport = new SharedMemoryTransportStream(name + "Outbound", config);

        var readerInboundTransport = new SharedMemoryTransportStream(name + "Outbound", config);
        var readerOutboundTransport = new SharedMemoryTransportStream(name + "Inbound", config);

        _reconcilerTest.RunSignalTransportTests(readerInboundTransport, readerOutboundTransport, writerInboundTransport, writerOutboundTransport, false);

        readerOutboundTransport.Dispose();
        readerInboundTransport.Dispose();
        writerOutboundTransport.Dispose();
        writerInboundTransport.Dispose();
    }

    [Test]
    public void TestSignalRingBufferTransportTests()
    {
        var config = GenConfig();
        var name = RandomName();

        var writerInboundTransport = new SharedMemoryTransportStream(name + "Inbound", config);
        var writerOutboundTransport = new SharedMemoryTransportStream(name + "Outbound", config);

        var readerInboundTransport = new SharedMemoryTransportStream(name + "Outbound", config);
        var readerOutboundTransport = new SharedMemoryTransportStream(name + "Inbound", config);

        _reconcilerTest.RunSignalTransportTests(readerInboundTransport, readerOutboundTransport, writerInboundTransport, writerOutboundTransport, true);

        readerOutboundTransport.Dispose();
        readerInboundTransport.Dispose();
        writerOutboundTransport.Dispose();
        writerInboundTransport.Dispose();
    }

    [Test]
    public void TestIndexingTests()
    {
        var config = GenConfig();
        var name = RandomName();

        var writerInboundTransport = new SharedMemoryTransportStream(name + "Inbound", config);
        var writerOutboundTransport = new SharedMemoryTransportStream(name + "Outbound", config);

        var readerInboundTransport = new SharedMemoryTransportStream(name + "Outbound", config);
        var readerOutboundTransport = new SharedMemoryTransportStream(name + "Inbound", config);

        _reconcilerTest.RunIndexingTests(readerInboundTransport, readerOutboundTransport, writerInboundTransport, writerOutboundTransport);

        readerOutboundTransport.Dispose();
        readerInboundTransport.Dispose();
        writerOutboundTransport.Dispose();
        writerInboundTransport.Dispose();
    }
}
