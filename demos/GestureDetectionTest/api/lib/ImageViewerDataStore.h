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

#include "ImageViewerTypes.h"
#include <ImageTypes.h>
#include <functional>
#include <memory>
#include <string>
#include <xrpa-runtime/external_utils/UuidGen.h>
#include <xrpa-runtime/reconciler/DataStoreInterfaces.h>
#include <xrpa-runtime/reconciler/DataStoreReconciler.h>
#include <xrpa-runtime/reconciler/ObjectCollection.h>
#include <xrpa-runtime/transport/TransportStream.h>
#include <xrpa-runtime/transport/TransportStreamAccessor.h>
#include <xrpa-runtime/utils/MemoryAccessor.h>
#include <xrpa-runtime/utils/XrpaTypes.h>

namespace ImageViewerDataStore {

class ImageViewerDataStore;
class OutboundImageWindow;

class ImageReader : public Xrpa::ObjectAccessorInterface {
 public:
  ImageReader() {}

  explicit ImageReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  ImageTypes::Image getImage() {
    return DSInputImage::readValue(memAccessor_, readOffset_);
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class ImageWriter : public ImageReader {
 public:
  ImageWriter() {}

  explicit ImageWriter(const Xrpa::MemoryAccessor& memAccessor) : ImageReader(memAccessor) {}

  void setImage(const ImageTypes::Image& value) {
    DSInputImage::writeValue(value, memAccessor_, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class ImageWindowReader : public Xrpa::ObjectAccessorInterface {
 public:
  ImageWindowReader() {}

  explicit ImageWindowReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  std::string getName() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  inline bool checkNameChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class ImageWindowWriter : public ImageWindowReader {
 public:
  ImageWindowWriter() {}

  explicit ImageWindowWriter(const Xrpa::MemoryAccessor& memAccessor) : ImageWindowReader(memAccessor) {}

  static ImageWindowWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return ImageWindowWriter(changeEvent.accessChangeData());
  }

  static ImageWindowWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return ImageWindowWriter(changeEvent.accessChangeData());
  }

  void setName(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

// Reconciled Types
class OutboundImageWindow : public Xrpa::DataStoreObject {
 public:
  explicit OutboundImageWindow(const Xrpa::ObjectUuid& id) : Xrpa::DataStoreObject(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

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
    ImageWindowWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 1;
      changeByteCount_ = Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localName_) + 4;
      objAccessor = ImageWindowWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = ImageWindowWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
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

  void processDSUpdate(ImageWindowReader value, uint64_t fieldsChanged) {
    handleXrpaFieldsChanged(fieldsChanged);
  }

  inline bool checkNameChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  void sendImage(const ImageTypes::Image& image) {
    auto message = ImageWriter(collection_->sendMessage(
        getXrpaId(),
        1,
        DSInputImage::dynSizeOfValue(image) + 48));
    message.setImage(image);
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

// Object Collections
class OutboundImageWindowReaderCollection : public Xrpa::ObjectCollection<ImageWindowReader, std::shared_ptr<OutboundImageWindow>> {
 public:
  explicit OutboundImageWindowReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<ImageWindowReader, std::shared_ptr<OutboundImageWindow>>(reconciler, 0, 0, 0, true) {}

  void addObject(std::shared_ptr<OutboundImageWindow> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundImageWindow> createObject() {
    auto obj = std::make_shared<OutboundImageWindow>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
    addObjectInternal(obj);
    return obj;
  }

  void removeObject(const Xrpa::ObjectUuid& id) {
    removeObjectInternal(id);
  }
};

// Data Store Implementation
class ImageViewerDataStore : public Xrpa::DataStoreReconciler {
 public:
  ImageViewerDataStore(std::weak_ptr<Xrpa::TransportStream> inboundTransport, std::weak_ptr<Xrpa::TransportStream> outboundTransport)
      : Xrpa::DataStoreReconciler(inboundTransport, outboundTransport, 76800840) {
    ImageWindow = std::make_shared<OutboundImageWindowReaderCollection>(this);
    registerCollection(ImageWindow);
  }

  std::shared_ptr<OutboundImageWindowReaderCollection> ImageWindow;
};

} // namespace ImageViewerDataStore
