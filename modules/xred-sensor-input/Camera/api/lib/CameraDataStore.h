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

// @generated

#pragma once

#include "CameraTypes.h"
#include <functional>
#include <memory>
#include <string>
#include <xrpa-runtime/external_utils/UuidGen.h>
#include <xrpa-runtime/reconciler/DataStoreInterfaces.h>
#include <xrpa-runtime/reconciler/DataStoreReconciler.h>
#include <xrpa-runtime/reconciler/ObjectCollection.h>
#include <xrpa-runtime/transport/TransportStream.h>
#include <xrpa-runtime/transport/TransportStreamAccessor.h>
#include <xrpa-runtime/utils/ImageTypes.h>
#include <xrpa-runtime/utils/MemoryAccessor.h>
#include <xrpa-runtime/utils/XrpaTypes.h>

namespace CameraDataStore {

class CameraDataStore;
class OutboundCameraDevice;
class ReconciledCameraFeed;

class CameraDeviceReader : public Xrpa::ObjectAccessorInterface {
 public:
  CameraDeviceReader() {}

  explicit CameraDeviceReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  std::string getName() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  inline bool checkNameChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class CameraDeviceWriter : public CameraDeviceReader {
 public:
  CameraDeviceWriter() {}

  explicit CameraDeviceWriter(const Xrpa::MemoryAccessor& memAccessor) : CameraDeviceReader(memAccessor) {}

  static CameraDeviceWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return CameraDeviceWriter(changeEvent.accessChangeData());
  }

  static CameraDeviceWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return CameraDeviceWriter(changeEvent.accessChangeData());
  }

  void setName(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class CameraImageReader : public Xrpa::ObjectAccessorInterface {
 public:
  CameraImageReader() {}

  explicit CameraImageReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  Xrpa::Image getImage() {
    return DSRgbImage::readValue(memAccessor_, readOffset_);
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class CameraImageWriter : public CameraImageReader {
 public:
  CameraImageWriter() {}

  explicit CameraImageWriter(const Xrpa::MemoryAccessor& memAccessor) : CameraImageReader(memAccessor) {}

  void setImage(const Xrpa::Image& value) {
    DSRgbImage::writeValue(value, memAccessor_, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class CameraFeedReader : public Xrpa::ObjectAccessorInterface {
 public:
  CameraFeedReader() {}

  explicit CameraFeedReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  // pseudo-regex, with just $ and ^ supported for now
  std::string getCameraName() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  inline bool checkCameraNameChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class CameraFeedWriter : public CameraFeedReader {
 public:
  CameraFeedWriter() {}

  explicit CameraFeedWriter(const Xrpa::MemoryAccessor& memAccessor) : CameraFeedReader(memAccessor) {}

  static CameraFeedWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return CameraFeedWriter(changeEvent.accessChangeData());
  }

  static CameraFeedWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return CameraFeedWriter(changeEvent.accessChangeData());
  }

  void setCameraName(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

// Reconciled Types
class OutboundCameraDevice : public Xrpa::DataStoreObject {
 public:
  explicit OutboundCameraDevice(const Xrpa::ObjectUuid& id) : Xrpa::DataStoreObject(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  const std::string& getName() const {
    return localName_;
  }

  void setName(const std::string& name) {
    localName_ = name;
    if ((changeBits_ & 1) == 0) {
      changeBits_ |= 1;
      changeByteCount_ += 4;
    }
    changeByteCount_ += Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localName_);
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 1);
    }
  }

  void writeDSChanges(Xrpa::TransportStreamAccessor* accessor) {
    CameraDeviceWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 1;
      changeByteCount_ = Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localName_) + 4;
      objAccessor = CameraDeviceWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = CameraDeviceWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    }
    if (objAccessor.isNull()) {
      return;
    }
    if (changeBits_ & 1) {
      objAccessor.setName(localName_);
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    createWritten_ = false;
    changeBits_ = 1;
    changeByteCount_ = Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localName_) + 4;
    return createTimestamp_;
  }

  void processDSUpdate(CameraDeviceReader value, uint64_t fieldsChanged) {
    handleXrpaFieldsChanged(fieldsChanged);
  }

  inline bool checkNameChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
  }

 protected:
  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) {
    if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(fieldsChanged); }
  }

  std::string localName_ = "";
  uint64_t createTimestamp_;
  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;
  bool createWritten_ = false;

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;
};

class ReconciledCameraFeed : public Xrpa::DataStoreObject {
 public:
  ReconciledCameraFeed(const Xrpa::ObjectUuid& id, Xrpa::IObjectCollection* collection) : Xrpa::DataStoreObject(id, collection) {}

  virtual ~ReconciledCameraFeed() = default;

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  virtual void handleXrpaDelete() {
    if (xrpaDeleteHandler_) { xrpaDeleteHandler_(); }
  }

  void onXrpaDelete(std::function<void()> handler) {
    xrpaDeleteHandler_ = handler;
  }

  void processDSUpdate(CameraFeedReader value, uint64_t fieldsChanged) {
    if (value.checkCameraNameChanged(fieldsChanged)) {
      localCameraName_ = value.getCameraName();
    }
    handleXrpaFieldsChanged(fieldsChanged);
  }

  static std::shared_ptr<ReconciledCameraFeed> create(const Xrpa::ObjectUuid& id, CameraFeedReader obj, Xrpa::IObjectCollection* collection) {
    return std::make_shared<ReconciledCameraFeed>(id, collection);
  }

  const std::string& getCameraName() const {
    return localCameraName_;
  }

  inline bool checkCameraNameChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  void sendCameraImage(const Xrpa::Image& image) {
    auto message = CameraImageWriter(collection_->sendMessage(
        getXrpaId(),
        1,
        DSRgbImage::dynSizeOfValue(image) + 48));
    message.setImage(image);
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
  }

  void writeDSChanges(Xrpa::TransportStreamAccessor* accessor) {
  }

  uint64_t prepDSFullUpdate() {
    return 0;
  }

 protected:
  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) {
    if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(fieldsChanged); }
  }

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;
  std::function<void()> xrpaDeleteHandler_ = nullptr;

  // pseudo-regex, with just $ and ^ supported for now
  std::string localCameraName_ = "";
};

// Object Collections
class InboundCameraFeedReaderCollection : public Xrpa::ObjectCollection<CameraFeedReader, std::shared_ptr<ReconciledCameraFeed>> {
 public:
  explicit InboundCameraFeedReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<CameraFeedReader, std::shared_ptr<ReconciledCameraFeed>>(reconciler, 1, 1, 0, false) {
    setCreateDelegateInternal(ReconciledCameraFeed::create);
  }

  void setCreateDelegate(Xrpa::ObjectCollection<CameraFeedReader, std::shared_ptr<ReconciledCameraFeed>>::CreateDelegateFunction createDelegate) {
    setCreateDelegateInternal(std::move(createDelegate));
  }
};

class OutboundCameraDeviceReaderCollection : public Xrpa::ObjectCollection<CameraDeviceReader, std::shared_ptr<OutboundCameraDevice>> {
 public:
  explicit OutboundCameraDeviceReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<CameraDeviceReader, std::shared_ptr<OutboundCameraDevice>>(reconciler, 0, 0, 0, true) {}

  void addObject(std::shared_ptr<OutboundCameraDevice> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundCameraDevice> createObject() {
    auto obj = std::make_shared<OutboundCameraDevice>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
    addObjectInternal(obj);
    return obj;
  }

  void removeObject(const Xrpa::ObjectUuid& id) {
    removeObjectInternal(id);
  }
};

// Data Store Implementation
class CameraDataStore : public Xrpa::DataStoreReconciler {
 public:
  CameraDataStore(std::weak_ptr<Xrpa::TransportStream> inboundTransport, std::weak_ptr<Xrpa::TransportStream> outboundTransport)
      : Xrpa::DataStoreReconciler(inboundTransport, outboundTransport, 11895120) {
    CameraFeed = std::make_shared<InboundCameraFeedReaderCollection>(this);
    registerCollection(CameraFeed);
    CameraDevice = std::make_shared<OutboundCameraDeviceReaderCollection>(this);
    registerCollection(CameraDevice);
  }

  std::shared_ptr<InboundCameraFeedReaderCollection> CameraFeed;
  std::shared_ptr<OutboundCameraDeviceReaderCollection> CameraDevice;
};

} // namespace CameraDataStore
