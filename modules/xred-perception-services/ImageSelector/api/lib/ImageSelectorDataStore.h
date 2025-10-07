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
#include <xrpa-runtime/reconciler/DataStoreInterfaces.h>
#include <xrpa-runtime/reconciler/DataStoreReconciler.h>
#include <xrpa-runtime/reconciler/ObjectCollection.h>
#include <xrpa-runtime/transport/TransportStream.h>
#include <xrpa-runtime/transport/TransportStreamAccessor.h>
#include <xrpa-runtime/utils/MemoryAccessor.h>
#include <xrpa-runtime/utils/XrpaTypes.h>

namespace ImageSelectorDataStore {

class ImageSelectorDataStore;
class ReconciledImageSelector;

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
class ReconciledImageSelector : public Xrpa::DataStoreObject {
 public:
  ReconciledImageSelector(const Xrpa::ObjectUuid& id, Xrpa::IObjectCollection* collection) : Xrpa::DataStoreObject(id, collection) {}

  virtual ~ReconciledImageSelector() = default;

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  virtual void handleXrpaDelete() {
    if (xrpaDeleteHandler_) { xrpaDeleteHandler_(); }
  }

  void onXrpaDelete(std::function<void()> handler) {
    xrpaDeleteHandler_ = handler;
  }

  void processDSUpdate(ImageSelectorReader value, uint64_t fieldsChanged) {
    if (value.checkPickOneEveryNBasedOnMotionChanged(fieldsChanged)) {
      localPickOneEveryNBasedOnMotion_ = value.getPickOneEveryNBasedOnMotion();
    }
    handleXrpaFieldsChanged(fieldsChanged);
  }

  static std::shared_ptr<ReconciledImageSelector> create(const Xrpa::ObjectUuid& id, ImageSelectorReader obj, Xrpa::IObjectCollection* collection) {
    return std::make_shared<ReconciledImageSelector>(id, collection);
  }

  int getPickOneEveryNBasedOnMotion() const {
    return localPickOneEveryNBasedOnMotion_;
  }

  inline bool checkPickOneEveryNBasedOnMotionChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  void onRgbCamera(std::function<void(uint64_t, RgbCameraReader)> handler) {
    rgbCameraMessageHandler_ = handler;
  }

  void onPoseDynamics(std::function<void(uint64_t, PoseDynamicsPoseDynamicsReader)> handler) {
    poseDynamicsMessageHandler_ = handler;
  }

  void sendRgbImage(const ImageTypes::Image& image) {
    auto message = RgbImageRgbImageWriter(collection_->sendMessage(
        getXrpaId(),
        3,
        DSImageRgbImage::dynSizeOfValue(image) + 48));
    message.setImage(image);
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
    if (messageType == 1) {
      if (rgbCameraMessageHandler_) {
        auto message = RgbCameraReader(messageData);
        rgbCameraMessageHandler_(msgTimestamp, message);
      }
    }
    if (messageType == 2) {
      if (poseDynamicsMessageHandler_) {
        auto message = PoseDynamicsPoseDynamicsReader(messageData);
        poseDynamicsMessageHandler_(msgTimestamp, message);
      }
    }
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
  int localPickOneEveryNBasedOnMotion_ = 1;
  std::function<void(uint64_t, RgbCameraReader)> rgbCameraMessageHandler_ = nullptr;
  std::function<void(uint64_t, PoseDynamicsPoseDynamicsReader)> poseDynamicsMessageHandler_ = nullptr;
};

// Object Collections
class InboundImageSelectorReaderCollection : public Xrpa::ObjectCollection<ImageSelectorReader, std::shared_ptr<ReconciledImageSelector>> {
 public:
  explicit InboundImageSelectorReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<ImageSelectorReader, std::shared_ptr<ReconciledImageSelector>>(reconciler, 0, 1, 0, false) {
    setCreateDelegateInternal(ReconciledImageSelector::create);
  }

  void setCreateDelegate(Xrpa::ObjectCollection<ImageSelectorReader, std::shared_ptr<ReconciledImageSelector>>::CreateDelegateFunction createDelegate) {
    setCreateDelegateInternal(std::move(createDelegate));
  }
};

// Data Store Implementation
class ImageSelectorDataStore : public Xrpa::DataStoreReconciler {
 public:
  ImageSelectorDataStore(std::weak_ptr<Xrpa::TransportStream> inboundTransport, std::weak_ptr<Xrpa::TransportStream> outboundTransport)
      : Xrpa::DataStoreReconciler(inboundTransport, outboundTransport, 11899600) {
    ImageSelector = std::make_shared<InboundImageSelectorReaderCollection>(this);
    registerCollection(ImageSelector);
  }

  std::shared_ptr<InboundImageSelectorReaderCollection> ImageSelector;
};

} // namespace ImageSelectorDataStore
