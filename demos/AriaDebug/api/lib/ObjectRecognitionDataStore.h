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

#include "ObjectRecognitionTypes.h"
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

namespace ObjectRecognitionDataStore {

class ObjectRecognitionDataStore;
class OutboundObjectRecognition;

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

class ObjectDetectionReader : public Xrpa::ObjectAccessorInterface {
 public:
  ObjectDetectionReader() {}

  explicit ObjectDetectionReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  std::string getObjectClass() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class ObjectDetectionWriter : public ObjectDetectionReader {
 public:
  ObjectDetectionWriter() {}

  explicit ObjectDetectionWriter(const Xrpa::MemoryAccessor& memAccessor) : ObjectDetectionReader(memAccessor) {}

  void setObjectClass(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class ObjectRecognitionReader : public Xrpa::ObjectAccessorInterface {
 public:
  ObjectRecognitionReader() {}

  explicit ObjectRecognitionReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

 private:
  Xrpa::MemoryOffset readOffset_;
};

class ObjectRecognitionWriter : public ObjectRecognitionReader {
 public:
  ObjectRecognitionWriter() {}

  explicit ObjectRecognitionWriter(const Xrpa::MemoryAccessor& memAccessor) : ObjectRecognitionReader(memAccessor) {}

  static ObjectRecognitionWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return ObjectRecognitionWriter(changeEvent.accessChangeData());
  }

  static ObjectRecognitionWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return ObjectRecognitionWriter(changeEvent.accessChangeData());
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

// Reconciled Types
class OutboundObjectRecognition : public Xrpa::DataStoreObject {
 public:
  explicit OutboundObjectRecognition(const Xrpa::ObjectUuid& id) : Xrpa::DataStoreObject(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  void writeDSChanges(Xrpa::TransportStreamAccessor* accessor) {
    ObjectRecognitionWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 0;
      changeByteCount_ = 0;
      objAccessor = ObjectRecognitionWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = ObjectRecognitionWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    }
    if (objAccessor.isNull()) {
      return;
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    createWritten_ = false;
    changeBits_ = 0;
    changeByteCount_ = 0;
    return createTimestamp_;
  }

  void processDSUpdate(ObjectRecognitionReader value, uint64_t fieldsChanged) {
    handleXrpaFieldsChanged(fieldsChanged);
  }

  void sendRgbImage(const ImageTypes::Image& image) {
    auto message = RgbImageRgbImageWriter(collection_->sendMessage(
        getXrpaId(),
        0,
        DSImageRgbImage::dynSizeOfValue(image) + 48));
    message.setImage(image);
  }

  void onObjectDetction(std::function<void(uint64_t, ObjectDetectionReader)> handler) {
    objectDetctionMessageHandler_ = handler;
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
    if (messageType == 1) {
      if (objectDetctionMessageHandler_) {
        auto message = ObjectDetectionReader(messageData);
        objectDetctionMessageHandler_(msgTimestamp, message);
      }
    }
  }

 protected:
  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) {
    if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(fieldsChanged); }
  }

  uint64_t createTimestamp_;
  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;
  bool createWritten_ = false;

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;
  std::function<void(uint64_t, ObjectDetectionReader)> objectDetctionMessageHandler_ = nullptr;
};

// Object Collections
class OutboundObjectRecognitionReaderCollection : public Xrpa::ObjectCollection<ObjectRecognitionReader, std::shared_ptr<OutboundObjectRecognition>> {
 public:
  explicit OutboundObjectRecognitionReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<ObjectRecognitionReader, std::shared_ptr<OutboundObjectRecognition>>(reconciler, 0, 0, 0, true) {}

  void addObject(std::shared_ptr<OutboundObjectRecognition> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundObjectRecognition> createObject() {
    auto obj = std::make_shared<OutboundObjectRecognition>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
    addObjectInternal(obj);
    return obj;
  }

  void removeObject(const Xrpa::ObjectUuid& id) {
    removeObjectInternal(id);
  }
};

// Data Store Implementation
class ObjectRecognitionDataStore : public Xrpa::DataStoreReconciler {
 public:
  ObjectRecognitionDataStore(std::weak_ptr<Xrpa::TransportStream> inboundTransport, std::weak_ptr<Xrpa::TransportStream> outboundTransport)
      : Xrpa::DataStoreReconciler(inboundTransport, outboundTransport, 5949312) {
    ObjectRecognition = std::make_shared<OutboundObjectRecognitionReaderCollection>(this);
    registerCollection(ObjectRecognition);
  }

  std::shared_ptr<OutboundObjectRecognitionReaderCollection> ObjectRecognition;
};

} // namespace ObjectRecognitionDataStore
