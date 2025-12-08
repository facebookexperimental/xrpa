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

#include "GestureDetectionTypes.h"
#include <chrono>
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

namespace GestureDetectionDataStore {

class GestureDetectionDataStore;
class OutboundGestureDetection;

class ImageInputReader : public Xrpa::ObjectAccessorInterface {
 public:
  ImageInputReader() {}

  explicit ImageInputReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  Xrpa::Image getImage() {
    return DSGestureImage::readValue(memAccessor_, readOffset_);
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class ImageInputWriter : public ImageInputReader {
 public:
  ImageInputWriter() {}

  explicit ImageInputWriter(const Xrpa::MemoryAccessor& memAccessor) : ImageInputReader(memAccessor) {}

  void setImage(const Xrpa::Image& value) {
    DSGestureImage::writeValue(value, memAccessor_, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class GestureResultReader : public Xrpa::ObjectAccessorInterface {
 public:
  GestureResultReader() {}

  explicit GestureResultReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  // Timestamp of when input image was captured
  std::chrono::nanoseconds getTimestamp() {
    return Xrpa::reinterpretValue<std::chrono::nanoseconds, uint64_t>(memAccessor_.readValue<uint64_t>(readOffset_));
  }

  GestureType getGestureType() {
    return static_cast<GestureType>(memAccessor_.readValue<uint32_t>(readOffset_));
  }

  // Confidence score for the detected gesture (0.0 - 1.0)
  float getConfidence() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

  // Whether a hand was detected in the frame
  bool getHandDetected() {
    return (memAccessor_.readValue<int32_t>(readOffset_) == 1 ? true : false);
  }

  // Error message if gesture processing failed
  std::string getErrorMessage() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  MotionDirection getMotionDirection() {
    return static_cast<MotionDirection>(memAccessor_.readValue<uint32_t>(readOffset_));
  }

  // Distance/magnitude of motion (0.0 = no movement, 1.0 = significant movement)
  float getMotionOffset() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class GestureResultWriter : public GestureResultReader {
 public:
  GestureResultWriter() {}

  explicit GestureResultWriter(const Xrpa::MemoryAccessor& memAccessor) : GestureResultReader(memAccessor) {}

  void setTimestamp(std::chrono::nanoseconds value) {
    memAccessor_.writeValue<uint64_t>(Xrpa::reinterpretValue<uint64_t, std::chrono::nanoseconds>(value), writeOffset_);
  }

  void setGestureType(GestureType value) {
    memAccessor_.writeValue<uint32_t>(static_cast<uint32_t>(value), writeOffset_);
  }

  void setConfidence(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

  void setHandDetected(bool value) {
    memAccessor_.writeValue<int32_t>((value ? 1 : 0), writeOffset_);
  }

  void setErrorMessage(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

  void setMotionDirection(MotionDirection value) {
    memAccessor_.writeValue<uint32_t>(static_cast<uint32_t>(value), writeOffset_);
  }

  void setMotionOffset(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class GestureDetectionReader : public Xrpa::ObjectAccessorInterface {
 public:
  GestureDetectionReader() {}

  explicit GestureDetectionReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

 private:
  Xrpa::MemoryOffset readOffset_;
};

class GestureDetectionWriter : public GestureDetectionReader {
 public:
  GestureDetectionWriter() {}

  explicit GestureDetectionWriter(const Xrpa::MemoryAccessor& memAccessor) : GestureDetectionReader(memAccessor) {}

  static GestureDetectionWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return GestureDetectionWriter(changeEvent.accessChangeData());
  }

  static GestureDetectionWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return GestureDetectionWriter(changeEvent.accessChangeData());
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

// Reconciled Types
class OutboundGestureDetection : public Xrpa::DataStoreObject {
 public:
  explicit OutboundGestureDetection(const Xrpa::ObjectUuid& id) : Xrpa::DataStoreObject(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  void writeDSChanges(Xrpa::TransportStreamAccessor* accessor) {
    GestureDetectionWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 0;
      changeByteCount_ = 0;
      objAccessor = GestureDetectionWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = GestureDetectionWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
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

  void processDSUpdate(GestureDetectionReader value, uint64_t fieldsChanged) {
    handleXrpaFieldsChanged(fieldsChanged);
  }

  void sendImageInput(const Xrpa::Image& image) {
    auto message = ImageInputWriter(collection_->sendMessage(
        getXrpaId(),
        0,
        DSGestureImage::dynSizeOfValue(image) + 48));
    message.setImage(image);
  }

  void onGestureResult(std::function<void(uint64_t, GestureResultReader)> handler) {
    gestureResultMessageHandler_ = handler;
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
    if (messageType == 1) {
      if (gestureResultMessageHandler_) {
        auto message = GestureResultReader(messageData);
        gestureResultMessageHandler_(msgTimestamp, message);
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
  std::function<void(uint64_t, GestureResultReader)> gestureResultMessageHandler_ = nullptr;
};

// Object Collections
class OutboundGestureDetectionReaderCollection : public Xrpa::ObjectCollection<GestureDetectionReader, std::shared_ptr<OutboundGestureDetection>> {
 public:
  explicit OutboundGestureDetectionReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<GestureDetectionReader, std::shared_ptr<OutboundGestureDetection>>(reconciler, 0, 0, 0, true) {}

  void addObject(std::shared_ptr<OutboundGestureDetection> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundGestureDetection> createObject() {
    auto obj = std::make_shared<OutboundGestureDetection>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
    addObjectInternal(obj);
    return obj;
  }

  void removeObject(const Xrpa::ObjectUuid& id) {
    removeObjectInternal(id);
  }
};

// Data Store Implementation
class GestureDetectionDataStore : public Xrpa::DataStoreReconciler {
 public:
  GestureDetectionDataStore(std::weak_ptr<Xrpa::TransportStream> inboundTransport, std::weak_ptr<Xrpa::TransportStream> outboundTransport)
      : Xrpa::DataStoreReconciler(inboundTransport, outboundTransport, 37327224) {
    GestureDetection = std::make_shared<OutboundGestureDetectionReaderCollection>(this);
    registerCollection(GestureDetection);
  }

  std::shared_ptr<OutboundGestureDetectionReaderCollection> GestureDetection;
};

} // namespace GestureDetectionDataStore
