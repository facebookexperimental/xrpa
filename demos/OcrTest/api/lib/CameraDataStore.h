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
class ReconciledCameraDevice;
class OutboundCameraFeed;

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
class OutboundCameraFeed : public Xrpa::DataStoreObject {
 public:
  explicit OutboundCameraFeed(const Xrpa::ObjectUuid& id) : Xrpa::DataStoreObject(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  const std::string& getCameraName() const {
    return localCameraName_;
  }

  void setCameraName(const std::string& cameraName) {
    localCameraName_ = cameraName;
    if ((changeBits_ & 1) == 0) {
      changeBits_ |= 1;
      changeByteCount_ += 4;
    }
    changeByteCount_ += Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localCameraName_);
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 1);
    }
  }

  void writeDSChanges(Xrpa::TransportStreamAccessor* accessor) {
    CameraFeedWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 1;
      changeByteCount_ = Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localCameraName_) + 4;
      objAccessor = CameraFeedWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = CameraFeedWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    }
    if (objAccessor.isNull()) {
      return;
    }
    if (changeBits_ & 1) {
      objAccessor.setCameraName(localCameraName_);
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    createWritten_ = false;
    changeBits_ = 1;
    changeByteCount_ = Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localCameraName_) + 4;
    return createTimestamp_;
  }

  void processDSUpdate(CameraFeedReader value, uint64_t fieldsChanged) {
    handleXrpaFieldsChanged(fieldsChanged);
  }

  inline bool checkCameraNameChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  void onCameraImage(std::function<void(uint64_t, CameraImageReader)> handler) {
    cameraImageMessageHandler_ = handler;
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
    if (messageType == 1) {
      if (cameraImageMessageHandler_) {
        auto message = CameraImageReader(messageData);
        cameraImageMessageHandler_(msgTimestamp, message);
      }
    }
  }

 protected:
  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) {
    if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(fieldsChanged); }
  }

  // pseudo-regex, with just $ and ^ supported for now
  std::string localCameraName_ = "";

  uint64_t createTimestamp_;
  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;
  bool createWritten_ = false;

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;
  std::function<void(uint64_t, CameraImageReader)> cameraImageMessageHandler_ = nullptr;
};

class ReconciledCameraDevice : public Xrpa::DataStoreObject {
 public:
  ReconciledCameraDevice(const Xrpa::ObjectUuid& id, Xrpa::IObjectCollection* collection) : Xrpa::DataStoreObject(id, collection) {}

  virtual ~ReconciledCameraDevice() = default;

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  virtual void handleXrpaDelete() {
    if (xrpaDeleteHandler_) { xrpaDeleteHandler_(); }
  }

  void onXrpaDelete(std::function<void()> handler) {
    xrpaDeleteHandler_ = handler;
  }

  void processDSUpdate(CameraDeviceReader value, uint64_t fieldsChanged) {
    if (value.checkNameChanged(fieldsChanged)) {
      localName_ = value.getName();
    }
    handleXrpaFieldsChanged(fieldsChanged);
  }

  static std::shared_ptr<ReconciledCameraDevice> create(const Xrpa::ObjectUuid& id, CameraDeviceReader obj, Xrpa::IObjectCollection* collection) {
    return std::make_shared<ReconciledCameraDevice>(id, collection);
  }

  const std::string& getName() const {
    return localName_;
  }

  inline bool checkNameChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
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
  std::string localName_ = "";
};

// Object Collections
class InboundCameraDeviceReaderCollection : public Xrpa::ObjectCollection<CameraDeviceReader, std::shared_ptr<ReconciledCameraDevice>> {
 public:
  explicit InboundCameraDeviceReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<CameraDeviceReader, std::shared_ptr<ReconciledCameraDevice>>(reconciler, 0, 1, 0, false) {
    setCreateDelegateInternal(ReconciledCameraDevice::create);
  }

  void setCreateDelegate(Xrpa::ObjectCollection<CameraDeviceReader, std::shared_ptr<ReconciledCameraDevice>>::CreateDelegateFunction createDelegate) {
    setCreateDelegateInternal(std::move(createDelegate));
  }
};

class OutboundCameraFeedReaderCollection : public Xrpa::ObjectCollection<CameraFeedReader, std::shared_ptr<OutboundCameraFeed>> {
 public:
  explicit OutboundCameraFeedReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<CameraFeedReader, std::shared_ptr<OutboundCameraFeed>>(reconciler, 1, 0, 0, true) {}

  void addObject(std::shared_ptr<OutboundCameraFeed> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundCameraFeed> createObject() {
    auto obj = std::make_shared<OutboundCameraFeed>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
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
    CameraDevice = std::make_shared<InboundCameraDeviceReaderCollection>(this);
    registerCollection(CameraDevice);
    CameraFeed = std::make_shared<OutboundCameraFeedReaderCollection>(this);
    registerCollection(CameraFeed);
  }

  std::shared_ptr<InboundCameraDeviceReaderCollection> CameraDevice;
  std::shared_ptr<OutboundCameraFeedReaderCollection> CameraFeed;
};

} // namespace CameraDataStore
