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

#include "ImageSelectorTypes.h"
#include <ImageTypes.h>
#include <functional>
#include <memory>
#include <xrpa-runtime/external_utils/UuidGen.h>
#include <xrpa-runtime/reconciler/DataStoreInterfaces.h>
#include <xrpa-runtime/reconciler/DataStoreReconciler.h>
#include <xrpa-runtime/reconciler/ObjectCollection.h>
#include <xrpa-runtime/transport/TransportStream.h>
#include <xrpa-runtime/transport/TransportStreamAccessor.h>
#include <xrpa-runtime/utils/MemoryAccessor.h>
#include <xrpa-runtime/utils/XrpaTypes.h>

namespace ImageSelectorDataStore {

class ImageSelectorDataStore;
class OutboundImageSelector;

class RgbCameraReader : public Xrpa::ObjectAccessorInterface {
 public:
  RgbCameraReader() {}

  explicit RgbCameraReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  ImageTypes::Image getImage() {
    return DSImageRgbImage::readValue(memAccessor_, readOffset_);
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class RgbCameraWriter : public RgbCameraReader {
 public:
  RgbCameraWriter() {}

  explicit RgbCameraWriter(const Xrpa::MemoryAccessor& memAccessor) : RgbCameraReader(memAccessor) {}

  void setImage(const ImageTypes::Image& value) {
    DSImageRgbImage::writeValue(value, memAccessor_, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class PoseDynamicsPoseDynamicsReader : public Xrpa::ObjectAccessorInterface {
 public:
  PoseDynamicsPoseDynamicsReader() {}

  explicit PoseDynamicsPoseDynamicsReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  DataPoseDynamics getData() {
    return DSDataPoseDynamics::readValue(memAccessor_, readOffset_);
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class PoseDynamicsPoseDynamicsWriter : public PoseDynamicsPoseDynamicsReader {
 public:
  PoseDynamicsPoseDynamicsWriter() {}

  explicit PoseDynamicsPoseDynamicsWriter(const Xrpa::MemoryAccessor& memAccessor) : PoseDynamicsPoseDynamicsReader(memAccessor) {}

  void setData(const DataPoseDynamics& value) {
    DSDataPoseDynamics::writeValue(value, memAccessor_, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class RgbImageRgbImageReader : public Xrpa::ObjectAccessorInterface {
 public:
  RgbImageRgbImageReader() {}

  explicit RgbImageRgbImageReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  ImageTypes::Image getImage() {
    return DSImageRgbImage::readValue(memAccessor_, readOffset_);
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class RgbImageRgbImageWriter : public RgbImageRgbImageReader {
 public:
  RgbImageRgbImageWriter() {}

  explicit RgbImageRgbImageWriter(const Xrpa::MemoryAccessor& memAccessor) : RgbImageRgbImageReader(memAccessor) {}

  void setImage(const ImageTypes::Image& value) {
    DSImageRgbImage::writeValue(value, memAccessor_, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class ImageSelectorReader : public Xrpa::ObjectAccessorInterface {
 public:
  ImageSelectorReader() {}

  explicit ImageSelectorReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  int getPickOneEveryNBasedOnMotion() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  inline bool checkPickOneEveryNBasedOnMotionChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class ImageSelectorWriter : public ImageSelectorReader {
 public:
  ImageSelectorWriter() {}

  explicit ImageSelectorWriter(const Xrpa::MemoryAccessor& memAccessor) : ImageSelectorReader(memAccessor) {}

  static ImageSelectorWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return ImageSelectorWriter(changeEvent.accessChangeData());
  }

  static ImageSelectorWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return ImageSelectorWriter(changeEvent.accessChangeData());
  }

  void setPickOneEveryNBasedOnMotion(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

// Reconciled Types
class OutboundImageSelector : public Xrpa::DataStoreObject {
 public:
  explicit OutboundImageSelector(const Xrpa::ObjectUuid& id) : Xrpa::DataStoreObject(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  int getPickOneEveryNBasedOnMotion() const {
    return localPickOneEveryNBasedOnMotion_;
  }

  void setPickOneEveryNBasedOnMotion(int pickOneEveryNBasedOnMotion) {
    localPickOneEveryNBasedOnMotion_ = pickOneEveryNBasedOnMotion;
    if ((changeBits_ & 1) == 0) {
      changeBits_ |= 1;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 1);
    }
  }

  void writeDSChanges(Xrpa::TransportStreamAccessor* accessor) {
    ImageSelectorWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 1;
      changeByteCount_ = 4;
      objAccessor = ImageSelectorWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = ImageSelectorWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    }
    if (objAccessor.isNull()) {
      return;
    }
    if (changeBits_ & 1) {
      objAccessor.setPickOneEveryNBasedOnMotion(localPickOneEveryNBasedOnMotion_);
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    createWritten_ = false;
    changeBits_ = 1;
    changeByteCount_ = 4;
    return createTimestamp_;
  }

  void processDSUpdate(ImageSelectorReader value, uint64_t fieldsChanged) {
    handleXrpaFieldsChanged(fieldsChanged);
  }

  inline bool checkPickOneEveryNBasedOnMotionChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  void sendRgbCamera(const ImageTypes::Image& image) {
    auto message = RgbCameraWriter(collection_->sendMessage(
        getXrpaId(),
        1,
        DSImageRgbImage::dynSizeOfValue(image) + 48));
    message.setImage(image);
  }

  void sendPoseDynamics(const DataPoseDynamics& data) {
    auto message = PoseDynamicsPoseDynamicsWriter(collection_->sendMessage(
        getXrpaId(),
        2,
        76));
    message.setData(data);
  }

  void onRgbImage(std::function<void(uint64_t, RgbImageRgbImageReader)> handler) {
    rgbImageMessageHandler_ = handler;
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
    if (messageType == 3) {
      if (rgbImageMessageHandler_) {
        auto message = RgbImageRgbImageReader(messageData);
        rgbImageMessageHandler_(msgTimestamp, message);
      }
    }
  }

 protected:
  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) {
    if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(fieldsChanged); }
  }

  int localPickOneEveryNBasedOnMotion_ = 1;
  uint64_t createTimestamp_;
  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;
  bool createWritten_ = false;

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;
  std::function<void(uint64_t, RgbImageRgbImageReader)> rgbImageMessageHandler_ = nullptr;
};

// Object Collections
class OutboundImageSelectorReaderCollection : public Xrpa::ObjectCollection<ImageSelectorReader, std::shared_ptr<OutboundImageSelector>> {
 public:
  explicit OutboundImageSelectorReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<ImageSelectorReader, std::shared_ptr<OutboundImageSelector>>(reconciler, 0, 0, 0, true) {}

  void addObject(std::shared_ptr<OutboundImageSelector> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundImageSelector> createObject() {
    auto obj = std::make_shared<OutboundImageSelector>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
    addObjectInternal(obj);
    return obj;
  }

  void removeObject(const Xrpa::ObjectUuid& id) {
    removeObjectInternal(id);
  }
};

// Data Store Implementation
class ImageSelectorDataStore : public Xrpa::DataStoreReconciler {
 public:
  ImageSelectorDataStore(std::weak_ptr<Xrpa::TransportStream> inboundTransport, std::weak_ptr<Xrpa::TransportStream> outboundTransport)
      : Xrpa::DataStoreReconciler(inboundTransport, outboundTransport, 11899600) {
    ImageSelector = std::make_shared<OutboundImageSelectorReaderCollection>(this);
    registerCollection(ImageSelector);
  }

  std::shared_ptr<OutboundImageSelectorReaderCollection> ImageSelector;
};

} // namespace ImageSelectorDataStore
