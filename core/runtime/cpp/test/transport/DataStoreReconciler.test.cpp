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

#include <xrpa-runtime/reconciler/DataStoreReconciler.h>
#include <xrpa-runtime/reconciler/ObjectCollection.h>
#include <xrpa-runtime/reconciler/ObjectCollectionIndex.h>
#include <xrpa-runtime/reconciler/ObjectCollectionIndexedBinding.h>
#include <xrpa-runtime/signals/InboundSignalData.h>
#include <xrpa-runtime/signals/OutboundSignalData.h>
#include <xrpa-runtime/transport/TransportStreamAccessor.h>
#include <xrpa-runtime/utils/XrpaTypes.h>
#include <cmath>
#include <string>
#include <utility>

using namespace Xrpa;
using namespace std::chrono_literals;
using id_vector = std::vector<ObjectUuid>;

constexpr int NUM_CHANNELS = 2;
constexpr int SAMPLE_RATE = 48000;
constexpr int SAMPLES_PER_CALLBACK = 256;

namespace DataStoreReconcilerTest {

class DSFooType_NumericMessage : public ObjectAccessorInterface {
 public:
  explicit DSFooType_NumericMessage(MemoryAccessor memAccessor)
      : ObjectAccessorInterface(std::move(memAccessor)) {}

  int32_t getNumber() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  void setNumber(int32_t value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

 private:
  MemoryOffset readOffset_;
  MemoryOffset writeOffset_;
};

class DSFooType_ResetMessage : public ObjectAccessorInterface {
 public:
  explicit DSFooType_ResetMessage(MemoryAccessor memAccessor)
      : ObjectAccessorInterface(std::move(memAccessor)) {}
};

class FooTypeReader : public ObjectAccessorInterface {
 public:
  static constexpr uint64_t aChangedBit = 1;
  static constexpr uint64_t bChangedBit = 2;
  static constexpr uint64_t revAChangedBit = 4;
  static constexpr uint64_t revBChangedBit = 8;

  static constexpr uint32_t aByteCount = 4;
  static constexpr uint32_t bByteCount = 4;
  static constexpr uint32_t revAByteCount = 4;
  static constexpr uint32_t revBByteCount = 4;

  static constexpr int32_t AddMessage = 0;
  static constexpr int32_t ResetMessage = 1;
  static constexpr int32_t BounceMessage = 2;
  static constexpr int32_t SignalMessage = 3;

  FooTypeReader() = default;
  explicit FooTypeReader(MemoryAccessor memAccessor)
      : ObjectAccessorInterface(std::move(memAccessor)) {}

  int32_t getA() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  float getB() {
    return memAccessor_.readValue<float>(readOffset_);
  }

  int32_t getRevA() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  float getRevB() {
    return memAccessor_.readValue<float>(readOffset_);
  }

 private:
  MemoryOffset readOffset_;
};

class FooTypeWriter : public FooTypeReader {
 public:
  FooTypeWriter() = default;
  explicit FooTypeWriter(MemoryAccessor memAccessor) : FooTypeReader(std::move(memAccessor)) {}

  static FooTypeWriter create(
      TransportStreamAccessor* accessor,
      int32_t collectionId,
      const ObjectUuid& id,
      uint32_t changeByteCount = aByteCount + bByteCount,
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

  void setRevA(int32_t value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setRevB(float value) {
    memAccessor_.writeValue<float>(value, writeOffset_);
  }

 private:
  MemoryOffset writeOffset_;
};

class BarTypeReader : public ObjectAccessorInterface {
 public:
  static constexpr int32_t cChangedBit = 1;
  static constexpr int32_t strChangedBit = 2;

  static constexpr uint32_t cByteCount = 8;

  BarTypeReader() = default;
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
  BarTypeWriter() = default;
  explicit BarTypeWriter(MemoryAccessor memAccessor) : BarTypeReader(std::move(memAccessor)) {}

  static BarTypeWriter create(
      TransportStreamAccessor* accessor,
      int32_t collectionId,
      const ObjectUuid& id,
      uint32_t changeByteCount,
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

class FooTypeLocal : public Xrpa::DataStoreObject {
 public:
  FooTypeLocal(const ObjectUuid& id, IObjectCollection* collection, FooTypeReader& value)
      : Xrpa::DataStoreObject(id, collection) {
    processDSUpdate(value, ~0);
    signalData_ = std::make_shared<Xrpa::InboundSignalData<uint32_t>>(NUM_CHANNELS, SAMPLE_RATE);
    onSignal(signalData_);
  }

  static constexpr uint64_t INBOUND_FIELDS =
      FooTypeReader::aChangedBit | FooTypeReader::bChangedBit;

  int a_{};
  float b_{};

  int myVal_ = 0;
  int resetCount_ = 0;
  int tickCount_ = 0;

  std::shared_ptr<Xrpa::InboundSignalData<uint32_t>> signalData_;

  void tickXrpa() {
    tickCount_++;
  }

  void processDSUpdate(FooTypeReader& value, uint64_t fieldsChanged) {
    if (fieldsChanged & FooTypeReader::aChangedBit) {
      a_ = value.getA();
    }
    if (fieldsChanged & FooTypeReader::bChangedBit) {
      b_ = value.getB();
    }
  }

  void setRevA(int a) {
    localRevA = a;
    if ((changeBits_ & FooTypeReader::revAChangedBit) == 0) {
      changeBits_ |= FooTypeReader::revAChangedBit;
      changeByteCount_ += FooTypeReader::revAByteCount;
    }
    if (!hasNotifiedNeedsWrite_) {
      collection_->notifyObjectNeedsWrite(getXrpaId());
      hasNotifiedNeedsWrite_ = true;
    }
    collection_->setDirty(getXrpaId(), FooTypeReader::revAChangedBit);
  }

  void setRevB(float b) {
    localRevB = b;
    if ((changeBits_ & FooTypeReader::revBChangedBit) == 0) {
      changeBits_ |= FooTypeReader::revBChangedBit;
      changeByteCount_ += FooTypeReader::revBByteCount;
    }
    if (!hasNotifiedNeedsWrite_) {
      collection_->notifyObjectNeedsWrite(getXrpaId());
      hasNotifiedNeedsWrite_ = true;
    }
    collection_->setDirty(getXrpaId(), FooTypeReader::revBChangedBit);
  }

  int getRevA() {
    return localRevA;
  }

  float getRevB() {
    return localRevB;
  }

  void sendAddMessage(int32_t number) {
    auto msg = DSFooType_NumericMessage(
        collection_->sendMessage(getXrpaId(), FooTypeReader::AddMessage, 4));
    msg.setNumber(number);
  }

  void sendResetMessage() {
    collection_->sendMessage(getXrpaId(), FooTypeReader::ResetMessage, 0);
  }

  void writeDSChanges(TransportStreamAccessor* accessor) {
    FooTypeWriter objAccessor = FooTypeWriter::update(
        accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    if (objAccessor.isNull()) {
      return;
    }
    if (changeBits_ & FooTypeReader::revAChangedBit) {
      objAccessor.setRevA(localRevA);
    }
    if (changeBits_ & FooTypeReader::revBChangedBit) {
      objAccessor.setRevB(localRevB);
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    changeBits_ = FooTypeReader::revAChangedBit | FooTypeReader::revBChangedBit;
    changeByteCount_ = FooTypeReader::revAByteCount + FooTypeReader::revBByteCount;
    return 1;
  }

  void onSignal(std::shared_ptr<Xrpa::InboundSignalDataInterface> handler) {
    signalSignalHandler_ = handler;
  }

  void
  processDSMessage(int32_t messageType, uint64_t timestamp, const MemoryAccessor& messageData) {
    if (messageType == FooTypeReader::AddMessage) {
      auto msg = DSFooType_NumericMessage(messageData);
      myVal_ += msg.getNumber();
    }
    if (messageType == FooTypeReader::ResetMessage) {
      myVal_ = 0;
      resetCount_++;
    }
    if (messageType == FooTypeReader::BounceMessage) {
      auto msg = DSFooType_NumericMessage(
          collection_->sendMessage(getXrpaId(), FooTypeReader::BounceMessage, 4));
      msg.setNumber(-1);
    }
    if (messageType == FooTypeReader::SignalMessage && signalSignalHandler_) {
      signalSignalHandler_->onSignalData(timestamp, messageData);
    }
  }

 private:
  int localRevA = 0;
  float localRevB = 0;
  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;
  std::shared_ptr<Xrpa::InboundSignalDataInterface> signalSignalHandler_ = nullptr;
};

class BarTypeLocal : public Xrpa::DataStoreObject {
 public:
  BarTypeLocal(const ObjectUuid& id, IObjectCollection* collection, BarTypeReader& value)
      : Xrpa::DataStoreObject(id, collection) /*, reconciler_(reconciler)*/ {
    processDSUpdate(value, ~0);
  }

  static constexpr uint64_t INBOUND_FIELDS =
      BarTypeReader::cChangedBit | BarTypeReader::strChangedBit;

  uint64_t c_ = 0;
  std::string str_;

  void processDSUpdate(BarTypeReader& value, uint64_t fieldsChanged) {
    if (fieldsChanged & BarTypeReader::cChangedBit) {
      c_ = value.getC();
    }
    if (fieldsChanged & BarTypeReader::strChangedBit) {
      str_ = value.getStr();
    }
  }

  void writeDSChanges(TransportStreamAccessor* accessor) {}

  static uint64_t prepDSFullUpdate() {
    return 0;
  }

  void
  processDSMessage(int32_t messageType, uint64_t timestamp, const MemoryAccessor& messageAccessor) {
    // no message handlers
  }
};

class FooTypeLocalBinding {
 public:
  bool addXrpaBinding(const std::shared_ptr<FooTypeLocal>& reconciledObj) {
    if (reconciledObj_ == nullptr) {
      reconciledObj_ = reconciledObj;
      return true;
    }
    return false;
  }

  void removeXrpaBinding(const std::shared_ptr<FooTypeLocal>& reconciledObj) {
    if (reconciledObj_ == reconciledObj) {
      reconciledObj_ = nullptr;
    }
  }

  std::shared_ptr<FooTypeLocal> reconciledObj_;
};

class FooInboundCollection : public ObjectCollection<FooTypeReader, std::shared_ptr<FooTypeLocal>> {
 public:
  explicit FooInboundCollection(DataStoreReconciler* reconciler)
      : ObjectCollection(
            reconciler,
            0,
            FooTypeLocal::INBOUND_FIELDS,
            ~0, // indexed field mask, needs to be all bits so the indexed-binding receives all
                // field changes
            false) {}

  void setCreateDelegate(
      ObjectCollection<FooTypeReader, std::shared_ptr<FooTypeLocal>>::CreateDelegateFunction
          createDelegate) {
    setCreateDelegateInternal(std::move(createDelegate));
  }

  void addIndexedBinding(int indexValue, std::shared_ptr<FooTypeLocalBinding> localObj) {
    indexBinding_.addLocalObject(indexValue, localObj);
  }

  void removeIndexedBinding(int indexValue, std::shared_ptr<FooTypeLocalBinding> localObj) {
    indexBinding_.removeLocalObject(indexValue, localObj);
  }

  ObjectCollectionIndex<std::shared_ptr<FooTypeLocal>, int> FooIndexedByA;

 protected:
  ObjectCollectionIndexedBinding<
      std::shared_ptr<FooTypeLocal>,
      int,
      std::shared_ptr<FooTypeLocalBinding>>
      indexBinding_;

  void indexNotifyCreate(std::shared_ptr<FooTypeLocal> obj) override {
    FooIndexedByA.onCreate(obj, obj->a_);
    indexBinding_.onCreate(obj, obj->a_);
  }

  void indexNotifyUpdate(std::shared_ptr<FooTypeLocal> obj, uint64_t fieldsChanged) override {
    if (fieldsChanged & FooTypeReader::aChangedBit) {
      FooIndexedByA.onUpdate(obj, obj->a_);
      indexBinding_.onUpdate(obj, obj->a_);
    }
  }

  void indexNotifyDelete(std::shared_ptr<FooTypeLocal> obj) override {
    FooIndexedByA.onDelete(obj, obj->a_);
    indexBinding_.onDelete(obj, obj->a_);
  }
};

class BarInboundCollection : public ObjectCollection<BarTypeReader, std::shared_ptr<BarTypeLocal>> {
 public:
  explicit BarInboundCollection(DataStoreReconciler* reconciler)
      : ObjectCollection(
            reconciler,
            1,
            BarTypeLocal::INBOUND_FIELDS,
            0, // indexed field mask
            false) {}

  void setCreateDelegate(
      ObjectCollection<BarTypeReader, std::shared_ptr<BarTypeLocal>>::CreateDelegateFunction
          createDelegate) {
    setCreateDelegateInternal(std::move(createDelegate));
  }
};

static const ObjectUuid theBarID = ObjectUuid(1, 200);

class ReadTestDataStore : public DataStoreReconciler {
 public:
  explicit ReadTestDataStore(
      std::shared_ptr<TransportStream> inboundTransport,
      std::shared_ptr<TransportStream> outboundTransport)
      : DataStoreReconciler(inboundTransport, outboundTransport, 4096) {
    FooType = std::make_shared<FooInboundCollection>(this);
    registerCollection(FooType);
    BarType = std::make_shared<BarInboundCollection>(this);
    registerCollection(BarType);
    FooType->setCreateDelegate(
        [&](const ObjectUuid& id, FooTypeReader& source, IObjectCollection* collection) {
          return std::make_shared<FooTypeLocal>(id, collection, source);
        });

    BarType->setCreateDelegate(
        [&](const ObjectUuid& id,
            BarTypeReader& source,
            IObjectCollection* collection) -> std::shared_ptr<BarTypeLocal> {
          if (id != theBarID) {
            return nullptr;
          }
          return std::make_shared<BarTypeLocal>(id, collection, source);
        });
  }

  std::shared_ptr<FooInboundCollection> FooType;
  std::shared_ptr<BarInboundCollection> BarType;
};

class OutboundFooType : public Xrpa::DataStoreObject {
 public:
  explicit OutboundFooType(const ObjectUuid& id)
      : Xrpa::DataStoreObject(id), createTimestamp_(getCurrentClockTimeMicroseconds()) {}

  static constexpr uint64_t INBOUND_FIELDS =
      FooTypeReader::revAChangedBit | FooTypeReader::revBChangedBit;

  int revA_ = 0;
  float revB_ = 0;
  int tickCount_ = 0;

  void setA(int a) {
    localA = a;
    if ((changeBits_ & FooTypeReader::aChangedBit) == 0) {
      changeBits_ |= FooTypeReader::aChangedBit;
      changeByteCount_ += FooTypeReader::aByteCount;
    }
    if (!hasNotifiedNeedsWrite_) {
      collection_->notifyObjectNeedsWrite(getXrpaId());
      hasNotifiedNeedsWrite_ = true;
    }
    collection_->setDirty(getXrpaId(), FooTypeReader::aChangedBit);
  }

  void setB(float b) {
    localB = b;
    if ((changeBits_ & FooTypeReader::bChangedBit) == 0) {
      changeBits_ |= FooTypeReader::bChangedBit;
      changeByteCount_ += FooTypeReader::bByteCount;
    }
    if (!hasNotifiedNeedsWrite_) {
      collection_->notifyObjectNeedsWrite(getXrpaId());
      hasNotifiedNeedsWrite_ = true;
    }
    collection_->setDirty(getXrpaId(), FooTypeReader::bChangedBit);
  }

  int getA() {
    return localA;
  }

  float getB() {
    return localB;
  }

  void sendAddMessage(int32_t number) {
    auto msg = DSFooType_NumericMessage(
        collection_->sendMessage(getXrpaId(), FooTypeReader::AddMessage, 4));
    msg.setNumber(number);
  }

  void sendResetMessage() {
    collection_->sendMessage(getXrpaId(), FooTypeReader::ResetMessage, 0);
  }

  template <typename SampleType>
  void setSignal(
      Xrpa::SignalProducerCallback<SampleType> signalCallback,
      int32_t numChannels,
      int32_t framesPerSecond,
      int32_t framesPerPacket) {
    localSignal_.setSignalSource(signalCallback, numChannels, framesPerSecond, framesPerPacket);
  }

  template <typename SampleType>
  void setSignal(
      Xrpa::SignalRingBuffer<SampleType>* signalRingBuffer,
      int32_t numChannels,
      int32_t framesPerSecond,
      int32_t framesPerPacket) {
    localSignal_.setSignalSource(signalRingBuffer, numChannels, framesPerSecond, framesPerPacket);
  }

  void tickXrpa() {
    tickCount_++;
    auto id = getXrpaId();
    localSignal_.setRecipient(id, collection_, FooTypeReader::SignalMessage);
    localSignal_.tick();
  }

  void writeDSChanges(TransportStreamAccessor* accessor) {
    FooTypeWriter objAccessor;
    if (!createWritten_) {
      createWritten_ = true;
      objAccessor = FooTypeWriter::create(
          accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
    }
    if (objAccessor.isNull()) {
      objAccessor = FooTypeWriter::update(
          accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    }
    if (changeBits_ & FooTypeReader::aChangedBit) {
      objAccessor.setA(localA);
    }
    if (changeBits_ & FooTypeReader::bChangedBit) {
      objAccessor.setB(localB);
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    createWritten_ = false;
    changeBits_ = FooTypeReader::aChangedBit | FooTypeReader::bChangedBit;
    changeByteCount_ = FooTypeReader::aByteCount + FooTypeReader::bByteCount;
    return createTimestamp_;
  }

  void processDSUpdate(FooTypeReader& value, uint64_t fieldsChanged) {
    if (fieldsChanged & FooTypeReader::revAChangedBit) {
      revA_ = value.getRevA();
    }
    if (fieldsChanged & FooTypeReader::revBChangedBit) {
      revB_ = value.getRevB();
    }
  }

  void
  processDSMessage(int32_t messageType, uint64_t /*timestamp*/, MemoryAccessor messageAccessor) {
    if (messageType == FooTypeReader::AddMessage) {
      setA(localA + DSFooType_NumericMessage(std::move(messageAccessor)).getNumber());
    } else if (messageType == FooTypeReader::ResetMessage) {
      setA(0);
    }
  }

 protected:
  int localA = 0;
  float localB = 0;
  Xrpa::OutboundSignalData localSignal_;
  uint64_t createTimestamp_;
  uint64_t changeBits_ = FooTypeReader::aChangedBit | FooTypeReader::bChangedBit;
  int32_t changeByteCount_ = FooTypeReader::aByteCount + FooTypeReader::bByteCount;
  bool createWritten_ = false;
};

class FooOutboundCollection
    : public ObjectCollection<FooTypeReader, std::shared_ptr<OutboundFooType>> {
 public:
  explicit FooOutboundCollection(DataStoreReconciler* reconciler)
      : ObjectCollection(
            reconciler,
            0,
            OutboundFooType::INBOUND_FIELDS,
            FooTypeReader::aChangedBit, // indexed field mask
            true) {}

  void addObject(std::shared_ptr<OutboundFooType> obj) {
    addObjectInternal(obj);
  }

  void removeObject(const ObjectUuid& id) {
    removeObjectInternal(id);
  }

  ObjectCollectionIndex<std::shared_ptr<OutboundFooType>, int> FooIndexedByA;

 protected:
  void indexNotifyCreate(std::shared_ptr<OutboundFooType> obj) override {
    FooIndexedByA.onCreate(obj, obj->getA());
  }

  void indexNotifyUpdate(std::shared_ptr<OutboundFooType> obj, uint64_t fieldsChanged) override {
    if (fieldsChanged & FooTypeReader::aChangedBit) {
      FooIndexedByA.onUpdate(obj, obj->getA());
    }
  }

  void indexNotifyDelete(std::shared_ptr<OutboundFooType> obj) override {
    FooIndexedByA.onDelete(obj, obj->getA());
  }
};

class OutboundBarType : public Xrpa::DataStoreObject {
 public:
  explicit OutboundBarType(const ObjectUuid& id)
      : Xrpa::DataStoreObject(id), createTimestamp_(getCurrentClockTimeMicroseconds()) {}

  static constexpr uint64_t INBOUND_FIELDS = 0;

  void setC(uint64_t value) {
    localC = value;
    if ((changeBits_ & BarTypeReader::cChangedBit) == 0) {
      changeBits_ |= BarTypeReader::cChangedBit;
      changeByteCount_ += BarTypeReader::cByteCount;
    }
    if (!hasNotifiedNeedsWrite_) {
      collection_->notifyObjectNeedsWrite(getXrpaId());
      hasNotifiedNeedsWrite_ = true;
    }
    collection_->setDirty(getXrpaId(), BarTypeReader::cChangedBit);
  }

  void setStr(const std::string& value) {
    localStr = value;
    if ((changeBits_ & BarTypeReader::strChangedBit) == 0) {
      changeBits_ |= BarTypeReader::strChangedBit;
      changeByteCount_ += 4;
    }
    changeByteCount_ += MemoryAccessor::dynSizeOfValue(localStr);
    if (!hasNotifiedNeedsWrite_) {
      collection_->notifyObjectNeedsWrite(getXrpaId());
      hasNotifiedNeedsWrite_ = true;
    }
    collection_->setDirty(getXrpaId(), BarTypeReader::strChangedBit);
  }

  uint64_t getC() {
    return localC;
  }

  std::string getStr() {
    return localStr;
  }

  void writeDSChanges(TransportStreamAccessor* accessor) {
    BarTypeWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = BarTypeReader::cChangedBit | BarTypeReader::strChangedBit;
      changeByteCount_ = BarTypeReader::cByteCount + 4 + MemoryAccessor::dynSizeOfValue(localStr);
      objAccessor = BarTypeWriter::create(
          accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    }
    if (objAccessor.isNull()) {
      objAccessor = BarTypeWriter::update(
          accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    }
    if (changeBits_ & BarTypeReader::cChangedBit) {
      objAccessor.setC(localC);
    }
    if (changeBits_ & BarTypeReader::strChangedBit) {
      objAccessor.setStr(localStr);
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    createWritten_ = false;
    changeBits_ = BarTypeReader::cChangedBit | BarTypeReader::strChangedBit;
    changeByteCount_ = BarTypeReader::cByteCount + 4 + MemoryAccessor::dynSizeOfValue(localStr);
    return createTimestamp_;
  }

  void processDSUpdate(BarTypeReader& value, uint64_t fieldsChanged) {}

  void processDSMessage(
      int32_t /*messageType*/,
      uint64_t /*timestamp*/,
      const MemoryAccessor& /*messageAccessor*/) {}

 protected:
  uint64_t localC = 0;
  std::string localStr;
  uint64_t createTimestamp_;
  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;
  bool createWritten_ = false;
};

class BarOutboundCollection
    : public ObjectCollection<BarTypeReader, std::shared_ptr<OutboundBarType>> {
 public:
  explicit BarOutboundCollection(DataStoreReconciler* reconciler)
      : ObjectCollection(
            reconciler,
            1,
            OutboundBarType::INBOUND_FIELDS,
            0, // indexed field mask
            true) {}

  void addObject(std::shared_ptr<OutboundBarType> obj) {
    addObjectInternal(obj);
  }

  void removeObject(const ObjectUuid& id) {
    removeObjectInternal(id);
  }
};

class WriteTestDataStore : public DataStoreReconciler {
 public:
  explicit WriteTestDataStore(
      std::shared_ptr<TransportStream> inboundTransport,
      std::shared_ptr<TransportStream> outboundTransport)
      : DataStoreReconciler(inboundTransport, outboundTransport, 4096) {
    FooType = std::make_shared<FooOutboundCollection>(this);
    registerCollection(FooType);
    BarType = std::make_shared<BarOutboundCollection>(this);
    registerCollection(BarType);
  }

  std::shared_ptr<FooOutboundCollection> FooType;
  std::shared_ptr<BarOutboundCollection> BarType;
};

static const ObjectUuid foo1ID = ObjectUuid(0, 100);
static const ObjectUuid foo2ID = ObjectUuid(0, 200);
static const ObjectUuid foo3ID = ObjectUuid(0, 300);
static const ObjectUuid myFooID = ObjectUuid(0, 5000);

static const ObjectUuid bar1ID = ObjectUuid(1, 100);

void RunReadReconcilerTests(
    std::shared_ptr<TransportStream> readerInboundTransport,
    std::shared_ptr<TransportStream> readerOutboundTransport,
    std::shared_ptr<TransportStream> writerInboundTransport,
    std::shared_ptr<TransportStream> writerOutboundTransport) {
  auto reader =
      std::make_shared<ReadTestDataStore>(readerInboundTransport, readerOutboundTransport);
  auto writer =
      std::make_shared<WriteTestDataStore>(writerInboundTransport, writerOutboundTransport);

  // create objects
  {
    writer->tickInbound();

    auto foo1 = std::make_shared<OutboundFooType>(foo1ID);
    writer->FooType->addObject(foo1);
    foo1->setA(10);
    foo1->setB(45.5);

    auto bar1 = std::make_shared<OutboundBarType>(bar1ID);
    writer->BarType->addObject(bar1);
    bar1->setC(15);
    bar1->setStr("Hello World!");

    writer->tickOutbound();
  }

  // tick reader, verify InboundFooReconciler received only the foo1 create
  {
    reader->tickInbound();
    EXPECT_EQ(reader->FooType->size(), 1);
    EXPECT_EQ(reader->FooType->getObject(foo1ID)->a_, 10);
    EXPECT_EQ(reader->FooType->getObject(foo1ID)->b_, 45.5);
    EXPECT_EQ(reader->BarType->size(), 0);
    reader->tickOutbound();
  }

  // update objects
  {
    writer->tickInbound();

    auto foo1 = writer->FooType->getObject(foo1ID);
    foo1->setB(75);

    auto bar1 = writer->BarType->getObject(bar1ID);
    bar1->setC(32);

    writer->tickOutbound();
  }

  // tick reader, verify InboundFooReconciler received the foo1 update
  {
    reader->tickInbound();
    EXPECT_EQ(reader->FooType->size(), 1);
    EXPECT_EQ(reader->FooType->getObject(foo1ID)->a_, 10);
    EXPECT_EQ(reader->FooType->getObject(foo1ID)->b_, 75);
    EXPECT_EQ(reader->FooType->getObject(foo1ID)->tickCount_, 1);
    EXPECT_EQ(reader->BarType->size(), 0);
    reader->tickOutbound();
  }

  // create TheBar
  {
    writer->tickInbound();

    auto TheBar = std::make_shared<OutboundBarType>(theBarID);
    writer->BarType->addObject(TheBar);
    TheBar->setC(92);
    TheBar->setStr("Hello World!");

    writer->tickOutbound();
  }

  // tick reader, verify TheBarReconciler got the update
  {
    reader->tickInbound();
    EXPECT_EQ(reader->FooType->size(), 1);
    EXPECT_EQ(reader->FooType->getObject(foo1ID)->a_, 10);
    EXPECT_EQ(reader->FooType->getObject(foo1ID)->b_, 75);
    EXPECT_EQ(reader->FooType->getObject(foo1ID)->tickCount_, 2);
    EXPECT_EQ(reader->BarType->size(), 1);
    EXPECT_EQ(reader->BarType->getObject(theBarID)->c_, 92);
    EXPECT_EQ(reader->BarType->getObject(theBarID)->str_, "Hello World!");
    reader->tickOutbound();
  }

  // update TheBar
  {
    writer->tickInbound();

    auto TheBar = writer->BarType->getObject(theBarID);
    TheBar->setC(92);

    // try a long string
    TheBar->setStr("1234567890123456789012345678901234567890123456789012345678901234567890");

    writer->tickOutbound();
  }

  // tick reader, verify TheBarReconciler got the update
  {
    reader->tickInbound();
    EXPECT_EQ(reader->FooType->size(), 1);
    EXPECT_EQ(reader->FooType->getObject(foo1ID)->a_, 10);
    EXPECT_EQ(reader->FooType->getObject(foo1ID)->b_, 75);
    EXPECT_EQ(reader->FooType->getObject(foo1ID)->tickCount_, 3);
    EXPECT_EQ(reader->BarType->size(), 1);
    EXPECT_EQ(reader->BarType->getObject(theBarID)->c_, 92);
    EXPECT_EQ(
        reader->BarType->getObject(theBarID)->str_,
        "1234567890123456789012345678901234567890123456789012345678901234567890");
    reader->tickOutbound();
  }

  // delete objects
  {
    writer->tickInbound();

    writer->FooType->removeObject(foo1ID);
    writer->BarType->removeObject(bar1ID);
    writer->BarType->removeObject(theBarID);

    writer->tickOutbound();
  }

  // tick reader, verify reconcilers saw the deletes properly
  {
    reader->tickInbound();
    EXPECT_EQ(reader->FooType->size(), 0);
    EXPECT_EQ(reader->BarType->size(), 0);
    reader->tickOutbound();
  }

  // put some objects back in, for testing index-reconciliation mark/sweep
  {
    writer->tickInbound();

    auto foo1 = std::make_shared<OutboundFooType>(foo1ID);
    writer->FooType->addObject(foo1);

    auto foo2 = std::make_shared<OutboundFooType>(foo2ID);
    writer->FooType->addObject(foo2);

    auto foo3 = std::make_shared<OutboundFooType>(foo3ID);
    writer->FooType->addObject(foo3);
    foo3->setA(15);

    auto TheBar = std::make_shared<OutboundBarType>(theBarID);
    writer->BarType->addObject(TheBar);
    TheBar->setC(17);

    writer->tickOutbound();
  }

  {
    reader->tickInbound();
    EXPECT_EQ(reader->FooType->size(), 3);
    EXPECT_NE(reader->FooType->getObject(foo1ID).get(), nullptr);
    EXPECT_NE(reader->FooType->getObject(foo2ID).get(), nullptr);
    EXPECT_NE(reader->FooType->getObject(foo3ID).get(), nullptr);
    EXPECT_EQ(reader->BarType->size(), 1);
    EXPECT_EQ(reader->BarType->getObject(theBarID)->c_, 17);
    reader->tickOutbound();
  }

  // write some changes but don't consume them from the reader yet
  {
    writer->tickInbound();

    EXPECT_EQ(writer->FooType->size(), 3);

    writer->FooType->removeObject(foo1ID);
    writer->FooType->removeObject(foo2ID);

    auto TheBar = writer->BarType->getObject(theBarID);
    TheBar->setC(25);

    writer->tickOutbound();
  }

  // write lots of stuff, overflowing the changelog ring buffer
  writerOutboundTransport->transact(1ms, [&](TransportStreamAccessor* writer) {
    auto writerIter = writerOutboundTransport->createIterator();
    EXPECT_EQ(writerIter->hasMissedEntries(writer), true);

    // make sure the writes above this get pushed out of the ring buffer, so that they are forced to
    // be reconciled through a FullUpdate
    for (int i = 0; !writerIter->hasMissedEntries(writer); ++i) {
      auto obj = FooTypeWriter::create(writer, 0, ObjectUuid(3, i));
      EXPECT_EQ(obj.isNull(), false);
    }
  });
  {
    auto foo3 = writer->FooType->getObject(foo3ID);
    foo3->setB(20);
    writer->tickOutbound();
  }

  // tick reader to trigger RequestFullUpdate, then tick writer to send the full update
  {
    reader->tickInbound();
    reader->tickOutbound();
    writer->tickInbound();
    writer->tickOutbound();
  }

  // verify the reader applies the full update (including the changes that were written but
  // overflowed out of the changelog)
  {
    reader->tickInbound();
    EXPECT_EQ(reader->FooType->size(), 1);
    EXPECT_EQ(reader->FooType->getObject(foo1ID).get(), nullptr);
    EXPECT_EQ(reader->FooType->getObject(foo2ID).get(), nullptr);
    EXPECT_NE(reader->FooType->getObject(foo3ID).get(), nullptr);
    EXPECT_EQ(reader->FooType->getObject(foo3ID)->a_, 15);
    EXPECT_EQ(reader->FooType->getObject(foo3ID)->b_, 20);
    EXPECT_EQ(reader->BarType->size(), 1);
    EXPECT_EQ(reader->BarType->getObject(theBarID)->c_, 25);
    reader->tickOutbound();
  }

  // write a create, update, and delete to the same object
  {
    writer->tickInbound();

    auto myFoo = std::make_shared<OutboundFooType>(myFooID);
    writer->FooType->addObject(myFoo);
    myFoo->setB(75);
    writer->FooType->removeObject(myFooID);

    writer->tickOutbound();
  }

  // tick reader, verify it handled the deleted object properly during the create/update
  // reconciliation
  {
    reader->tickInbound();
    EXPECT_EQ(reader->FooType->size(), 1);
    EXPECT_EQ(reader->FooType->getObject(foo1ID).get(), nullptr);
    EXPECT_EQ(reader->FooType->getObject(foo2ID).get(), nullptr);
    EXPECT_NE(reader->FooType->getObject(foo3ID).get(), nullptr);
    EXPECT_EQ(reader->FooType->getObject(foo3ID)->a_, 15);
    EXPECT_EQ(reader->FooType->getObject(foo3ID)->b_, 20);
    EXPECT_EQ(reader->FooType->getObject(myFooID).get(), nullptr);
    EXPECT_EQ(reader->BarType->size(), 1);
    EXPECT_EQ(reader->BarType->getObject(theBarID)->c_, 25);
    reader->tickOutbound();
  }

  // send some messages
  {
    writer->tickInbound();

    auto foo1 = std::make_shared<OutboundFooType>(foo1ID);
    writer->FooType->addObject(foo1);

    auto foo2 = std::make_shared<OutboundFooType>(foo2ID);
    writer->FooType->addObject(foo2);

    auto foo3 = writer->FooType->getObject(foo3ID);

    foo1->sendAddMessage(1);
    foo2->sendAddMessage(2);
    foo3->sendAddMessage(3);
    foo3->sendResetMessage();

    writer->tickOutbound();
  }

  // tick reader, verify messages were handled
  {
    reader->tickInbound();
    EXPECT_NE(reader->FooType->getObject(foo1ID).get(), nullptr);
    EXPECT_NE(reader->FooType->getObject(foo2ID).get(), nullptr);
    EXPECT_NE(reader->FooType->getObject(foo3ID).get(), nullptr);
    EXPECT_EQ(reader->FooType->getObject(foo1ID)->myVal_, 1);
    EXPECT_EQ(reader->FooType->getObject(foo2ID)->myVal_, 2);
    EXPECT_EQ(reader->FooType->getObject(foo3ID)->myVal_, 0);
    reader->tickOutbound();
  }
}

void RunReadReconcilerInterruptTests(
    std::shared_ptr<Xrpa::TransportStream> readerInboundTransport,
    std::shared_ptr<Xrpa::TransportStream> readerOutboundTransport,
    const std::function<std::pair<
        std::shared_ptr<Xrpa::TransportStream>,
        std::shared_ptr<Xrpa::TransportStream>>()>& makeWriterDataset) {
  auto writerDatasets = makeWriterDataset();
  auto writer = std::make_shared<WriteTestDataStore>(writerDatasets.first, writerDatasets.second);
  writer->tickInbound();
  writer->tickOutbound();

  auto reader =
      std::make_shared<ReadTestDataStore>(readerInboundTransport, readerOutboundTransport);

  // create objects
  {
    writer->tickInbound();

    auto foo1 = std::make_shared<OutboundFooType>(foo1ID);
    writer->FooType->addObject(foo1);
    foo1->setA(10);
    foo1->setB(45.5);

    writer->tickOutbound();
  }

  // tick reader, verify fooReconciler received the foo1 create
  {
    reader->tickInbound();
    EXPECT_EQ(reader->FooType->size(), 1);
    EXPECT_NE(reader->FooType->getObject(foo1ID).get(), nullptr);
    EXPECT_EQ(reader->FooType->getObject(foo1ID)->a_, 10);
    EXPECT_EQ(reader->FooType->getObject(foo1ID)->b_, 45.5);
    reader->tickOutbound();
  }

  // shutdown writer
  writer.reset();
  writerDatasets.first.reset();
  writerDatasets.second.reset();

  // create new writer
  writerDatasets = makeWriterDataset();
  writer = std::make_shared<WriteTestDataStore>(writerDatasets.first, writerDatasets.second);
  writer->tickInbound();
  writer->tickOutbound();

  // tick reader, verify the writer cleared all Foo objects out
  reader->tickInbound();
  EXPECT_EQ(reader->FooType->size(), 0);
  reader->tickOutbound();
}

void RunWriteReconcilerTests(
    std::shared_ptr<TransportStream> readerInboundTransport,
    std::shared_ptr<TransportStream> readerOutboundTransport,
    std::shared_ptr<TransportStream> writerInboundTransport,
    std::shared_ptr<TransportStream> writerOutboundTransport) {
  auto reader =
      std::make_shared<ReadTestDataStore>(readerInboundTransport, readerOutboundTransport);
  auto writer =
      std::make_shared<WriteTestDataStore>(writerInboundTransport, writerOutboundTransport);

  {
    writer->tickInbound();
    auto foo1 = std::make_shared<OutboundFooType>(foo1ID);
    writer->FooType->addObject(foo1);
    foo1->setA(10);
    foo1->setB(15);
    auto foo2 = std::make_shared<OutboundFooType>(foo2ID);
    writer->FooType->addObject(foo2);
    foo2->setA(5);
    foo2->setB(37);
    writer->tickOutbound();
  }

  {
    reader->tickInbound();
    EXPECT_EQ(reader->FooType->size(), 2);
    EXPECT_EQ(reader->FooType->getObject(foo1ID)->a_, 10);
    EXPECT_EQ(reader->FooType->getObject(foo1ID)->b_, 15);
    EXPECT_EQ(reader->FooType->getObject(foo2ID)->a_, 5);
    EXPECT_EQ(reader->FooType->getObject(foo2ID)->b_, 37);

    reader->FooType->getObject(foo1ID)->sendAddMessage(10);

    reader->tickOutbound();
  }

  {
    writer->tickInbound();
    writer->FooType->removeObject(foo2ID);
    writer->tickOutbound();
  }

  {
    reader->tickInbound();
    EXPECT_EQ(reader->FooType->size(), 1);
    EXPECT_EQ(reader->FooType->getObject(foo1ID)->a_, 20);
    EXPECT_EQ(reader->FooType->getObject(foo1ID)->b_, 15);
    EXPECT_EQ(reader->FooType->getObject(foo2ID).get(), nullptr);
  }
}

void RunReverseReconciledFieldsTests(
    std::shared_ptr<TransportStream> readerInboundTransport,
    std::shared_ptr<TransportStream> readerOutboundTransport,
    std::shared_ptr<TransportStream> writerInboundTransport,
    std::shared_ptr<TransportStream> writerOutboundTransport) {
  auto writer =
      std::make_shared<WriteTestDataStore>(writerInboundTransport, writerOutboundTransport);
  auto reader =
      std::make_shared<ReadTestDataStore>(readerInboundTransport, readerOutboundTransport);

  auto foo1 = std::make_shared<OutboundFooType>(foo1ID);
  writer->FooType->addObject(foo1);
  foo1->setA(10);
  foo1->setB(15);
  EXPECT_EQ(foo1->tickCount_, 0);
  writer->tickInbound();
  writer->tickOutbound();
  EXPECT_EQ(foo1->tickCount_, 1);

  reader->tickInbound();
  reader->tickOutbound();
  EXPECT_EQ(reader->FooType->size(), 1);
  EXPECT_EQ(reader->FooType->getObject(foo1ID)->a_, 10);
  EXPECT_EQ(reader->FooType->getObject(foo1ID)->b_, 15);
  reader->FooType->getObject(foo1ID)->setRevA(-4);
  reader->FooType->getObject(foo1ID)->setRevB(-25);
  reader->tickInbound();
  reader->tickOutbound();

  writer->tickInbound();
  writer->tickOutbound();
  EXPECT_EQ(foo1->revA_, -4);
  EXPECT_EQ(foo1->revB_, -25);
  EXPECT_EQ(foo1->tickCount_, 2);

  reader->FooType->getObject(foo1ID)->setRevA(72);
  reader->FooType->getObject(foo1ID)->setRevB(-15);
  reader->tickInbound();
  reader->tickOutbound();

  writer->tickInbound();
  writer->tickOutbound();
  EXPECT_EQ(foo1->revA_, 72);
  EXPECT_EQ(foo1->revB_, -15);
  EXPECT_EQ(foo1->tickCount_, 3);
}

static void
signalGen(SignalChannelData<uint32_t> dataOut, int32_t /*sampleRate*/, uint64_t startSamplePos) {
  int frameCount = dataOut.getFrameCount();
  for (int i = 0; i < dataOut.getNumChannels(); ++i) {
    auto* channelData = dataOut.accessChannelBuffer(i);
    for (int j = 0; j < frameCount; ++j) {
      channelData[j] = startSamplePos + j;
    }
  }
}

static void signalGenRingBuffer(SignalRingBuffer<uint32_t>& ringBuffer, int frameCount) {
  std::vector<uint32_t> interleavedSamples(frameCount * NUM_CHANNELS);
  auto* outPtr = interleavedSamples.data();
  for (int frameIdx = 0; frameIdx < frameCount; ++frameIdx) {
    for (int channelIdx = 0; channelIdx < NUM_CHANNELS; ++channelIdx) {
      *outPtr = frameIdx;
      outPtr++;
    }
  }

  ringBuffer.initialize(SAMPLE_RATE, 0, NUM_CHANNELS);
  ringBuffer.writeInterleavedData(interleavedSamples.data(), frameCount);
}

void RunSignalTransportTests(
    std::shared_ptr<TransportStream> readerInboundTransport,
    std::shared_ptr<TransportStream> readerOutboundTransport,
    std::shared_ptr<TransportStream> writerInboundTransport,
    std::shared_ptr<TransportStream> writerOutboundTransport,
    bool fromRingBuffer) {
  auto writer =
      std::make_shared<WriteTestDataStore>(writerInboundTransport, writerOutboundTransport);
  auto reader =
      std::make_shared<ReadTestDataStore>(readerInboundTransport, readerOutboundTransport);

  auto foo1 = std::make_shared<OutboundFooType>(foo1ID);
  writer->FooType->addObject(foo1);
  SignalRingBuffer<uint32_t> ringBuffer;
  if (fromRingBuffer) {
    signalGenRingBuffer(ringBuffer, SAMPLES_PER_CALLBACK * 2);
    foo1->setSignal<uint32_t>(&ringBuffer, NUM_CHANNELS, SAMPLE_RATE, SAMPLES_PER_CALLBACK);
  } else {
    foo1->setSignal<uint32_t>(signalGen, NUM_CHANNELS, SAMPLE_RATE, SAMPLES_PER_CALLBACK);
  }
  EXPECT_EQ(foo1->tickCount_, 0);
  writer->tickInbound();
  writer->tickOutbound();
  EXPECT_EQ(foo1->tickCount_, 1);

  reader->tickInbound();
  reader->tickOutbound();
  EXPECT_EQ(reader->FooType->size(), 1);

  auto signalDataPtr = reader->FooType->getObject(foo1ID)->signalData_;
  auto frameCount = signalDataPtr->getReadFramesAvailable();
  std::vector<uint32_t> data(frameCount * NUM_CHANNELS);
  signalDataPtr->readInterleavedData(data.data(), frameCount);
  EXPECT_GE(frameCount, SAMPLES_PER_CALLBACK);
  for (int i = 0; i < data.size(); ++i) {
    EXPECT_EQ(data[i], floor(i / 2.f));
  }
}

void RunIndexingTests(
    std::shared_ptr<TransportStream> readerInboundTransport,
    std::shared_ptr<TransportStream> readerOutboundTransport,
    std::shared_ptr<TransportStream> writerInboundTransport,
    std::shared_ptr<TransportStream> writerOutboundTransport) {
  auto writer =
      std::make_shared<WriteTestDataStore>(writerInboundTransport, writerOutboundTransport);
  auto reader =
      std::make_shared<ReadTestDataStore>(readerInboundTransport, readerOutboundTransport);

  // add a binding before the target exists
  auto fooBind1 = std::make_shared<FooTypeLocalBinding>();
  reader->FooType->addIndexedBinding(4, fooBind1);
  EXPECT_EQ(fooBind1->reconciledObj_, nullptr);

  // add objects
  auto foo1 = std::make_shared<OutboundFooType>(foo1ID);
  writer->FooType->addObject(foo1);
  foo1->setA(4);
  auto foo2 = std::make_shared<OutboundFooType>(foo2ID);
  writer->FooType->addObject(foo2);
  foo2->setA(4);
  auto foo3 = std::make_shared<OutboundFooType>(foo3ID);
  writer->FooType->addObject(foo3);
  foo3->setA(2);

  // verify they indexed correctly
  EXPECT_EQ(writer->FooType->FooIndexedByA.getIndexedObjects(4).size(), 2);
  EXPECT_EQ(writer->FooType->FooIndexedByA.getIndexedObjects(2).size(), 1);
  EXPECT_EQ(writer->FooType->FooIndexedByA.getIndexedObjects(1).size(), 0);
  writer->tickInbound();
  writer->tickOutbound();
  reader->tickInbound();
  reader->tickOutbound();
  EXPECT_EQ(reader->FooType->size(), 3);
  EXPECT_EQ(reader->FooType->FooIndexedByA.getIndexedObjects(4).size(), 2);
  EXPECT_EQ(reader->FooType->FooIndexedByA.getIndexedObjects(2).size(), 1);
  EXPECT_EQ(reader->FooType->FooIndexedByA.getIndexedObjects(1).size(), 0);
  EXPECT_NE(fooBind1->reconciledObj_, nullptr);
  EXPECT_EQ(fooBind1->reconciledObj_->getXrpaId(), foo1ID);

  // add a new binding after the target exists
  auto fooBind2 = std::make_shared<FooTypeLocalBinding>();
  reader->FooType->addIndexedBinding(4, fooBind2);
  EXPECT_NE(fooBind2->reconciledObj_, nullptr);
  EXPECT_EQ(fooBind2->reconciledObj_->getXrpaId(), foo1ID);

  // change an indexed value
  foo1->setA(2);

  // verify the object reindexed
  EXPECT_EQ(writer->FooType->FooIndexedByA.getIndexedObjects(4).size(), 1);
  EXPECT_EQ(writer->FooType->FooIndexedByA.getIndexedObjects(2).size(), 2);
  EXPECT_EQ(writer->FooType->FooIndexedByA.getIndexedObjects(2)[1]->getXrpaId(), foo1ID);
  writer->tickInbound();
  writer->tickOutbound();
  reader->tickInbound();
  reader->tickOutbound();
  EXPECT_EQ(reader->FooType->size(), 3);
  EXPECT_EQ(reader->FooType->FooIndexedByA.getIndexedObjects(4).size(), 1);
  EXPECT_EQ(reader->FooType->FooIndexedByA.getIndexedObjects(2).size(), 2);
  EXPECT_EQ(reader->FooType->FooIndexedByA.getIndexedObjects(2)[1]->getXrpaId(), foo1ID);
  EXPECT_EQ(fooBind1->reconciledObj_, nullptr);
  EXPECT_EQ(fooBind2->reconciledObj_, nullptr);

  // delete an indexed object
  writer->FooType->removeObject(foo2ID);

  // verify the object reindexed
  EXPECT_EQ(writer->FooType->FooIndexedByA.getIndexedObjects(4).size(), 0);
  EXPECT_EQ(writer->FooType->FooIndexedByA.getIndexedObjects(2).size(), 2);
  writer->tickInbound();
  writer->tickOutbound();
  reader->tickInbound();
  reader->tickOutbound();
  EXPECT_EQ(reader->FooType->size(), 2);
  EXPECT_EQ(reader->FooType->FooIndexedByA.getIndexedObjects(4).size(), 0);
  EXPECT_EQ(reader->FooType->FooIndexedByA.getIndexedObjects(2).size(), 2);
}

} // namespace DataStoreReconcilerTest
