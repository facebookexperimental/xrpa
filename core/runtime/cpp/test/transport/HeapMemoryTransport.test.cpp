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
#include <random>
#include <string>

#include <xrpa-runtime/transport/HeapMemoryTransportStream.h>
#include <xrpa-runtime/utils/XrpaTypes.h>

#include "./DataStoreReconciler.test.h"
#include "./Transport.test.h"

using namespace Xrpa;

TransportConfig genConfig(int changelogByteCount = 8192) {
  TransportConfig config;
  config.schemaHash =
      HashValue(0x1111111111111111, 0x2222222222222222, 0x3333333333333333, 0x4444444444444444);
  config.changelogByteCount = changelogByteCount;
  return config;
}

static std::string randomName(int length = 16) {
  const std::string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  std::random_device rd;
  std::mt19937 engine(rd());
  std::uniform_int_distribution<> dist(0, chars.size() - 1);

  std::string result;
  result.reserve(length);

  for (int i = 0; i < length; ++i) {
    result += chars[dist(engine)];
  }

  return result;
}

TEST(HeapMemoryTransportStream, object_tests) {
  auto config = genConfig();
  auto name = randomName();

  auto readerTransport = std::make_shared<HeapMemoryTransportStream>(name, config);
  auto writerTransport =
      std::make_shared<HeapMemoryTransportStream>(name, config, readerTransport->getRawMemory());
  TransportTest::RunTransportObjectTests(readerTransport, writerTransport);
}

TEST(HeapMemoryTransportStream, reader_tests) {
  // intentionally small changelog
  auto config = genConfig(512);
  auto name = randomName();

  auto writerInboundTransport =
      std::make_shared<HeapMemoryTransportStream>(name + "Inbound", config);
  auto writerOutboundTransport =
      std::make_shared<HeapMemoryTransportStream>(name + "Outbound", config);

  auto readerInboundTransport = std::make_shared<HeapMemoryTransportStream>(
      name + "Outbound", config, writerOutboundTransport->getRawMemory());
  auto readerOutboundTransport = std::make_shared<HeapMemoryTransportStream>(
      name + "Inbound", config, writerInboundTransport->getRawMemory());

  DataStoreReconcilerTest::RunReadReconcilerTests(
      readerInboundTransport,
      readerOutboundTransport,
      writerInboundTransport,
      writerOutboundTransport);
}

TEST(HeapMemoryTransportStream, writer_tests) {
  auto config = genConfig();
  auto name = randomName();

  auto writerInboundTransport =
      std::make_shared<HeapMemoryTransportStream>(name + "Inbound", config);
  auto writerOutboundTransport =
      std::make_shared<HeapMemoryTransportStream>(name + "Outbound", config);

  auto readerInboundTransport = std::make_shared<HeapMemoryTransportStream>(
      name + "Outbound", config, writerOutboundTransport->getRawMemory());
  auto readerOutboundTransport = std::make_shared<HeapMemoryTransportStream>(
      name + "Inbound", config, writerInboundTransport->getRawMemory());

  DataStoreReconcilerTest::RunWriteReconcilerTests(
      readerInboundTransport,
      readerOutboundTransport,
      writerInboundTransport,
      writerOutboundTransport);
}

TEST(HeapMemoryTransportStream, reverse_field_tests) {
  auto config = genConfig();
  auto name = randomName();

  auto writerInboundTransport =
      std::make_shared<HeapMemoryTransportStream>(name + "Inbound", config);
  auto writerOutboundTransport =
      std::make_shared<HeapMemoryTransportStream>(name + "Outbound", config);

  auto readerInboundTransport = std::make_shared<HeapMemoryTransportStream>(
      name + "Outbound", config, writerOutboundTransport->getRawMemory());
  auto readerOutboundTransport = std::make_shared<HeapMemoryTransportStream>(
      name + "Inbound", config, writerInboundTransport->getRawMemory());

  DataStoreReconcilerTest::RunReverseReconciledFieldsTests(
      readerInboundTransport,
      readerOutboundTransport,
      writerInboundTransport,
      writerOutboundTransport);
}

TEST(HeapMemoryTransportStream, signal_transport_tests) {
  auto config = genConfig();
  auto name = randomName();

  auto writerInboundTransport =
      std::make_shared<HeapMemoryTransportStream>(name + "Inbound", config);
  auto writerOutboundTransport =
      std::make_shared<HeapMemoryTransportStream>(name + "Outbound", config);

  auto readerInboundTransport = std::make_shared<HeapMemoryTransportStream>(
      name + "Outbound", config, writerOutboundTransport->getRawMemory());
  auto readerOutboundTransport = std::make_shared<HeapMemoryTransportStream>(
      name + "Inbound", config, writerInboundTransport->getRawMemory());

  DataStoreReconcilerTest::RunSignalTransportTests(
      readerInboundTransport,
      readerOutboundTransport,
      writerInboundTransport,
      writerOutboundTransport,
      false);
}

TEST(HeapMemoryTransportStream, signal_ring_buffer_transport_tests) {
  auto config = genConfig();
  auto name = randomName();

  auto writerInboundTransport =
      std::make_shared<HeapMemoryTransportStream>(name + "Inbound", config);
  auto writerOutboundTransport =
      std::make_shared<HeapMemoryTransportStream>(name + "Outbound", config);

  auto readerInboundTransport = std::make_shared<HeapMemoryTransportStream>(
      name + "Outbound", config, writerOutboundTransport->getRawMemory());
  auto readerOutboundTransport = std::make_shared<HeapMemoryTransportStream>(
      name + "Inbound", config, writerInboundTransport->getRawMemory());

  DataStoreReconcilerTest::RunSignalTransportTests(
      readerInboundTransport,
      readerOutboundTransport,
      writerInboundTransport,
      writerOutboundTransport,
      true);
}

TEST(HeapMemoryTransportStream, indexing_tests) {
  auto config = genConfig();
  auto name = randomName();

  auto writerInboundTransport =
      std::make_shared<HeapMemoryTransportStream>(name + "Inbound", config);
  auto writerOutboundTransport =
      std::make_shared<HeapMemoryTransportStream>(name + "Outbound", config);

  auto readerInboundTransport = std::make_shared<HeapMemoryTransportStream>(
      name + "Outbound", config, writerOutboundTransport->getRawMemory());
  auto readerOutboundTransport = std::make_shared<HeapMemoryTransportStream>(
      name + "Inbound", config, writerInboundTransport->getRawMemory());

  DataStoreReconcilerTest::RunIndexingTests(
      readerInboundTransport,
      readerOutboundTransport,
      writerInboundTransport,
      writerOutboundTransport);
}
