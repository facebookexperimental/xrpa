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

#include <xrpa-runtime/reconciler/CollectionChangeTypes.h>
#include <xrpa-runtime/transport/TransportStreamAccessor.h>
#include <xrpa-runtime/utils/XrpaTypes.h>

#include <utility>

using namespace Xrpa;
using namespace std::chrono_literals;
using id_vector = std::vector<ObjectUuid>;

namespace TransportTest {

class FooTypeReader : public ObjectAccessorInterface {
 public:
  static constexpr uint64_t aChangedBit = 1;
  static constexpr uint64_t bChangedBit = 2;

  static constexpr int32_t aByteCount = 4;
  static constexpr int32_t bByteCount = 4;

  explicit FooTypeReader(MemoryAccessor memAccessor)
      : ObjectAccessorInterface(std::move(memAccessor)) {}

  int32_t getA() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  float getB() {
    return memAccessor_.readValue<float>(readOffset_);
  }

 private:
  MemoryOffset readOffset_;
};

class FooTypeWriter : public FooTypeReader {
 public:
  explicit FooTypeWriter(MemoryAccessor memAccessor) : FooTypeReader(std::move(memAccessor)) {}

  static FooTypeWriter create(
      TransportStreamAccessor* accessor,
      int32_t collectionId,
      const ObjectUuid& id,
      int32_t changeByteCount = aByteCount + bByteCount,
      uint64_t timestamp = 0) {
    auto changeEvent = accessor->writeChangeEvent<CollectionChangeEventAccessor>(
        CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return FooTypeWriter(changeEvent.accessChangeData());
  }

  static FooTypeWriter update(
      TransportStreamAccessor* accessor,
      int32_t collectionId,
      const ObjectUuid& id,
      uint64_t fieldsChanged,
      uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<CollectionUpdateChangeEventAccessor>(
        CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return FooTypeWriter(changeEvent.accessChangeData());
  }

  void setA(int32_t value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setB(float value) {
    memAccessor_.writeValue<float>(value, writeOffset_);
  }

 private:
  MemoryOffset writeOffset_;
};

class BarTypeReader : public ObjectAccessorInterface {
 public:
  static constexpr uint64_t cChangedBit = 1;
  static constexpr uint64_t strChangedBit = 2;

  static constexpr int32_t cByteCount = 8;

  explicit BarTypeReader(MemoryAccessor memAccessor)
      : ObjectAccessorInterface(std::move(memAccessor)) {}

  uint64_t getC() {
    return memAccessor_.readValue<uint64_t>(readOffset_);
  }

  [[nodiscard]] std::string getStr() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

 private:
  MemoryOffset readOffset_;
};

class BarTypeWriter : public BarTypeReader {
 public:
  explicit BarTypeWriter(MemoryAccessor memAccessor) : BarTypeReader(std::move(memAccessor)) {}

  static BarTypeWriter create(
      TransportStreamAccessor* accessor,
      int32_t collectionId,
      const ObjectUuid& id,
      int32_t changeByteCount,
      uint64_t timestamp = 0) {
    auto changeEvent = accessor->writeChangeEvent<CollectionChangeEventAccessor>(
        CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return BarTypeWriter(changeEvent.accessChangeData());
  }

  static BarTypeWriter update(
      TransportStreamAccessor* accessor,
      int32_t collectionId,
      const ObjectUuid& id,
      uint64_t fieldsChanged,
      uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<CollectionUpdateChangeEventAccessor>(
        CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return BarTypeWriter(changeEvent.accessChangeData());
  }

  void setC(uint64_t value) {
    memAccessor_.writeValue<uint64_t>(value, writeOffset_);
  }

  void setStr(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

 private:
  MemoryOffset writeOffset_;
};

static const ObjectUuid foo1ID = ObjectUuid(0, 100);
static const ObjectUuid foo2ID = ObjectUuid(0, 200);

static const ObjectUuid bar1ID = ObjectUuid(1, 100);

void RunTransportObjectTests(
    std::shared_ptr<TransportStream> inboundTransport,
    std::shared_ptr<TransportStream> outboundTransport) {
  auto readerIter = inboundTransport->createIterator();

  // create foo1
  outboundTransport->transact(1ms, [&](TransportStreamAccessor* writer) {
    auto foo1 = FooTypeWriter::create(writer, 0, foo1ID);
    EXPECT_EQ(foo1.isNull(), false);
    foo1.setA(10);
    foo1.setB(45.2);
  });
  inboundTransport->transact(1ms, [&](TransportStreamAccessor* reader) {
    auto entry = CollectionChangeEventAccessor(readerIter->getNextEntry(reader));
    EXPECT_EQ(entry.isNull(), false);
    EXPECT_EQ(entry.getChangeType(), CollectionChangeType::CreateObject);
    EXPECT_EQ(entry.getObjectId(), foo1ID);
    EXPECT_EQ(entry.getCollectionId(), 0);
    auto foo1 = FooTypeReader(entry.accessChangeData());
    EXPECT_EQ(foo1.getA(), 10);
    EXPECT_NEAR(foo1.getB(), 45.2, 0.01);
  });

  // create bar1
  outboundTransport->transact(1ms, [&](TransportStreamAccessor* writer) {
    std::string str = "Hello";
    auto bar1 = BarTypeWriter::create(
        writer, 1, bar1ID, BarTypeReader::cByteCount + 4 + MemoryAccessor::dynSizeOfValue(str));
    EXPECT_EQ(bar1.isNull(), false);
    bar1.setC(15);
    bar1.setStr(str);
  });
  inboundTransport->transact(1ms, [&](TransportStreamAccessor* reader) {
    auto entry = CollectionChangeEventAccessor(readerIter->getNextEntry(reader));
    EXPECT_EQ(entry.isNull(), false);
    EXPECT_EQ(entry.getChangeType(), CollectionChangeType::CreateObject);
    EXPECT_EQ(entry.getObjectId(), bar1ID);
    EXPECT_EQ(entry.getCollectionId(), 1);
    auto bar1 = BarTypeReader(entry.accessChangeData());
    EXPECT_EQ(bar1.getC(), 15);
    EXPECT_EQ(bar1.getStr(), "Hello");
  });

  // create foo2
  outboundTransport->transact(1ms, [&](TransportStreamAccessor* writer) {
    auto foo2 = FooTypeWriter::create(writer, 0, foo2ID);
    EXPECT_EQ(foo2.isNull(), false);
    foo2.setA(500);
    foo2.setB(17);
  });
  inboundTransport->transact(1ms, [&](TransportStreamAccessor* reader) {
    auto entry = CollectionChangeEventAccessor(readerIter->getNextEntry(reader));
    EXPECT_EQ(entry.isNull(), false);
    EXPECT_EQ(entry.getChangeType(), CollectionChangeType::CreateObject);
    EXPECT_EQ(entry.getObjectId(), foo2ID);
    EXPECT_EQ(entry.getCollectionId(), 0);
    auto foo1 = FooTypeReader(entry.accessChangeData());
    EXPECT_EQ(foo1.getA(), 500);
    EXPECT_EQ(foo1.getB(), 17);
  });
}

} // namespace TransportTest
