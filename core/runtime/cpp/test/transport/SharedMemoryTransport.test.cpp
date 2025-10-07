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

#include <xrpa-runtime/transport/SharedMemoryTransportStream.h>

#include "./DataStoreReconciler.test.h"
#include "./Transport.test.h"

using namespace Xrpa;

static TransportConfig genConfig(int changelogByteCount = 8192) {
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

TEST(SharedMemoryTransportStream, object_tests) {
  auto config = genConfig();
  auto name = randomName();

  auto writerTransport = std::make_shared<SharedMemoryTransportStream>(name, config);
  auto readerTransport = std::make_shared<SharedMemoryTransportStream>(name, config);

  TransportTest::RunTransportObjectTests(readerTransport, writerTransport);
}

TEST(SharedMemoryTransportStream, reader_tests) {
  auto config = genConfig(512); // intentionally small changelog
  auto name = randomName();

  auto writerInboundTransport =
      std::make_shared<SharedMemoryTransportStream>(name + "Inbound", config);
  auto writerOutboundTransport =
      std::make_shared<SharedMemoryTransportStream>(name + "Outbound", config);

  auto readerInboundTransport =
      std::make_shared<SharedMemoryTransportStream>(name + "Outbound", config);
  auto readerOutboundTransport =
      std::make_shared<SharedMemoryTransportStream>(name + "Inbound", config);

  DataStoreReconcilerTest::RunReadReconcilerTests(
      readerInboundTransport,
      readerOutboundTransport,
      writerInboundTransport,
      writerOutboundTransport);
}

TEST(SharedMemoryTransportStream, writer_tests) {
  auto config = genConfig();
  auto name = randomName();

  auto writerInboundTransport =
      std::make_shared<SharedMemoryTransportStream>(name + "Inbound", config);
  auto writerOutboundTransport =
      std::make_shared<SharedMemoryTransportStream>(name + "Outbound", config);

  auto readerInboundTransport =
      std::make_shared<SharedMemoryTransportStream>(name + "Outbound", config);
  auto readerOutboundTransport =
      std::make_shared<SharedMemoryTransportStream>(name + "Inbound", config);

  DataStoreReconcilerTest::RunWriteReconcilerTests(
      readerInboundTransport,
      readerOutboundTransport,
      writerInboundTransport,
      writerOutboundTransport);
}

TEST(SharedMemoryTransportStream, reader_before_writer) {
  auto config = genConfig();
  auto name = randomName();

  auto readerTransport = std::make_shared<SharedMemoryTransportStream>(name, config);
  auto writerTransport = std::make_shared<SharedMemoryTransportStream>(name, config);

  TransportTest::RunTransportObjectTests(readerTransport, writerTransport);
}

TEST(SharedMemoryTransportStream, reader_before_writer_reconciler) {
  auto config = genConfig(512); // intentionally small changelog
  auto name = randomName();

  auto readerInboundTransport =
      std::make_shared<SharedMemoryTransportStream>(name + "Outbound", config);
  auto readerOutboundTransport =
      std::make_shared<SharedMemoryTransportStream>(name + "Inbound", config);

  auto writerInboundTransport =
      std::make_shared<SharedMemoryTransportStream>(name + "Inbound", config);
  auto writerOutboundTransport =
      std::make_shared<SharedMemoryTransportStream>(name + "Outbound", config);

  DataStoreReconcilerTest::RunReadReconcilerTests(
      readerInboundTransport,
      readerOutboundTransport,
      writerInboundTransport,
      writerOutboundTransport);
}

TEST(SharedMemoryTransportStream, changed_writer) {
  auto config = genConfig(512); // intentionally small changelog
  auto name = randomName();

  auto readerInboundTransport =
      std::make_shared<SharedMemoryTransportStream>(name + "Outbound", config);
  auto readerOutboundTransport =
      std::make_shared<SharedMemoryTransportStream>(name + "Inbound", config);

  DataStoreReconcilerTest::RunReadReconcilerInterruptTests(
      readerInboundTransport, readerOutboundTransport, [&]() {
        auto writerInboundTransport =
            std::make_shared<SharedMemoryTransportStream>(name + "Inbound", config);
        auto writerOutboundTransport =
            std::make_shared<SharedMemoryTransportStream>(name + "Outbound", config);

        return std::pair{writerInboundTransport, writerOutboundTransport};
      });
}

TEST(SharedMemoryTransportStream, reverse_field_tests) {
  auto config = genConfig();
  auto name = randomName();

  auto writerInboundTransport =
      std::make_shared<SharedMemoryTransportStream>(name + "Inbound", config);
  auto writerOutboundTransport =
      std::make_shared<SharedMemoryTransportStream>(name + "Outbound", config);

  auto readerInboundTransport =
      std::make_shared<SharedMemoryTransportStream>(name + "Outbound", config);
  auto readerOutboundTransport =
      std::make_shared<SharedMemoryTransportStream>(name + "Inbound", config);

  DataStoreReconcilerTest::RunReverseReconciledFieldsTests(
      readerInboundTransport,
      readerOutboundTransport,
      writerInboundTransport,
      writerOutboundTransport);
}

TEST(SharedMemoryTransportStream, signal_transport_tests) {
  auto config = genConfig();
  auto name = randomName();

  auto writerInboundTransport =
      std::make_shared<SharedMemoryTransportStream>(name + "Inbound", config);
  auto writerOutboundTransport =
      std::make_shared<SharedMemoryTransportStream>(name + "Outbound", config);

  auto readerInboundTransport =
      std::make_shared<SharedMemoryTransportStream>(name + "Outbound", config);
  auto readerOutboundTransport =
      std::make_shared<SharedMemoryTransportStream>(name + "Inbound", config);

  DataStoreReconcilerTest::RunSignalTransportTests(
      readerInboundTransport,
      readerOutboundTransport,
      writerInboundTransport,
      writerOutboundTransport,
      false);
}

TEST(SharedMemoryTransportStream, signal_ring_buffer_transport_tests) {
  auto config = genConfig();
  auto name = randomName();

  auto writerInboundTransport =
      std::make_shared<SharedMemoryTransportStream>(name + "Inbound", config);
  auto writerOutboundTransport =
      std::make_shared<SharedMemoryTransportStream>(name + "Outbound", config);

  auto readerInboundTransport =
      std::make_shared<SharedMemoryTransportStream>(name + "Outbound", config);
  auto readerOutboundTransport =
      std::make_shared<SharedMemoryTransportStream>(name + "Inbound", config);

  DataStoreReconcilerTest::RunSignalTransportTests(
      readerInboundTransport,
      readerOutboundTransport,
      writerInboundTransport,
      writerOutboundTransport,
      true);
}

TEST(SharedMemoryTransportStream, indexing_tests) {
  auto config = genConfig();
  auto name = randomName();

  auto writerInboundTransport =
      std::make_shared<SharedMemoryTransportStream>(name + "Inbound", config);
  auto writerOutboundTransport =
      std::make_shared<SharedMemoryTransportStream>(name + "Outbound", config);

  auto readerInboundTransport =
      std::make_shared<SharedMemoryTransportStream>(name + "Outbound", config);
  auto readerOutboundTransport =
      std::make_shared<SharedMemoryTransportStream>(name + "Inbound", config);

  DataStoreReconcilerTest::RunIndexingTests(
      readerInboundTransport,
      readerOutboundTransport,
      writerInboundTransport,
      writerOutboundTransport);
}
