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

#include "OpticalCharacterRecognitionTypes.h"
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

namespace OpticalCharacterRecognitionDataStore {

class OpticalCharacterRecognitionDataStore;
class OutboundOpticalCharacterRecognition;

class ImageInputReader : public Xrpa::ObjectAccessorInterface {
 public:
  ImageInputReader() {}

  explicit ImageInputReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  Xrpa::Image getImage() {
    return DSOcrImage::readValue(memAccessor_, readOffset_);
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class ImageInputWriter : public ImageInputReader {
 public:
  ImageInputWriter() {}

  explicit ImageInputWriter(const Xrpa::MemoryAccessor& memAccessor) : ImageInputReader(memAccessor) {}

  void setImage(const Xrpa::Image& value) {
    DSOcrImage::writeValue(value, memAccessor_, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class OcrResultReader : public Xrpa::ObjectAccessorInterface {
 public:
  OcrResultReader() {}

  explicit OcrResultReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  // Transcribed text from the image
  std::string getText() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  // Timestamp of when input image was captured
  std::chrono::nanoseconds getTimestamp() {
    return Xrpa::reinterpretValue<std::chrono::nanoseconds, uint64_t>(memAccessor_.readValue<uint64_t>(readOffset_));
  }

  // Whether OCR processing completed successfully
  bool getSuccess() {
    return (memAccessor_.readValue<int32_t>(readOffset_) == 1 ? true : false);
  }

  // Error message if OCR processing failed
  std::string getErrorMessage() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class OcrResultWriter : public OcrResultReader {
 public:
  OcrResultWriter() {}

  explicit OcrResultWriter(const Xrpa::MemoryAccessor& memAccessor) : OcrResultReader(memAccessor) {}

  void setText(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

  void setTimestamp(std::chrono::nanoseconds value) {
    memAccessor_.writeValue<uint64_t>(Xrpa::reinterpretValue<uint64_t, std::chrono::nanoseconds>(value), writeOffset_);
  }

  void setSuccess(bool value) {
    memAccessor_.writeValue<int32_t>((value ? 1 : 0), writeOffset_);
  }

  void setErrorMessage(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class OpticalCharacterRecognitionReader : public Xrpa::ObjectAccessorInterface {
 public:
  OpticalCharacterRecognitionReader() {}

  explicit OpticalCharacterRecognitionReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  // Increment this value to trigger OCR processing
  int getTriggerId() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  // Whether to use immediate mode (true) or triggered mode (false)
  bool getImmediateMode() {
    return (memAccessor_.readValue<int32_t>(readOffset_) == 1 ? true : false);
  }

  inline bool checkTriggerIdChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkImmediateModeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class OpticalCharacterRecognitionWriter : public OpticalCharacterRecognitionReader {
 public:
  OpticalCharacterRecognitionWriter() {}

  explicit OpticalCharacterRecognitionWriter(const Xrpa::MemoryAccessor& memAccessor) : OpticalCharacterRecognitionReader(memAccessor) {}

  static OpticalCharacterRecognitionWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return OpticalCharacterRecognitionWriter(changeEvent.accessChangeData());
  }

  static OpticalCharacterRecognitionWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return OpticalCharacterRecognitionWriter(changeEvent.accessChangeData());
  }

  void setTriggerId(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setImmediateMode(bool value) {
    memAccessor_.writeValue<int32_t>((value ? 1 : 0), writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

// Reconciled Types
class OutboundOpticalCharacterRecognition : public Xrpa::DataStoreObject {
 public:
  explicit OutboundOpticalCharacterRecognition(const Xrpa::ObjectUuid& id) : Xrpa::DataStoreObject(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  int getTriggerId() const {
    return localTriggerId_;
  }

  void setTriggerId(int triggerId) {
    localTriggerId_ = triggerId;
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

  bool getImmediateMode() const {
    return localImmediateMode_;
  }

  void setImmediateMode(bool immediateMode) {
    localImmediateMode_ = immediateMode;
    if ((changeBits_ & 2) == 0) {
      changeBits_ |= 2;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 2);
    }
  }

  void writeDSChanges(Xrpa::TransportStreamAccessor* accessor) {
    OpticalCharacterRecognitionWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 3;
      changeByteCount_ = 8;
      objAccessor = OpticalCharacterRecognitionWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = OpticalCharacterRecognitionWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    }
    if (objAccessor.isNull()) {
      return;
    }
    if (changeBits_ & 1) {
      objAccessor.setTriggerId(localTriggerId_);
    }
    if (changeBits_ & 2) {
      objAccessor.setImmediateMode(localImmediateMode_);
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    createWritten_ = false;
    changeBits_ = 3;
    changeByteCount_ = 8;
    return createTimestamp_;
  }

  void processDSUpdate(OpticalCharacterRecognitionReader value, uint64_t fieldsChanged) {
    handleXrpaFieldsChanged(fieldsChanged);
  }

  inline bool checkTriggerIdChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkImmediateModeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  void sendImageInput(const Xrpa::Image& image) {
    auto message = ImageInputWriter(collection_->sendMessage(
        getXrpaId(),
        0,
        DSOcrImage::dynSizeOfValue(image) + 48));
    message.setImage(image);
  }

  void onOcrResult(std::function<void(uint64_t, OcrResultReader)> handler) {
    ocrResultMessageHandler_ = handler;
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
    if (messageType == 3) {
      if (ocrResultMessageHandler_) {
        auto message = OcrResultReader(messageData);
        ocrResultMessageHandler_(msgTimestamp, message);
      }
    }
  }

 protected:
  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) {
    if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(fieldsChanged); }
  }

  // Increment this value to trigger OCR processing
  int localTriggerId_ = 0;

  // Whether to use immediate mode (true) or triggered mode (false)
  bool localImmediateMode_ = false;

  uint64_t createTimestamp_;
  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;
  bool createWritten_ = false;

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;
  std::function<void(uint64_t, OcrResultReader)> ocrResultMessageHandler_ = nullptr;
};

// Object Collections
class OutboundOpticalCharacterRecognitionReaderCollection : public Xrpa::ObjectCollection<OpticalCharacterRecognitionReader, std::shared_ptr<OutboundOpticalCharacterRecognition>> {
 public:
  explicit OutboundOpticalCharacterRecognitionReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<OpticalCharacterRecognitionReader, std::shared_ptr<OutboundOpticalCharacterRecognition>>(reconciler, 0, 0, 0, true) {}

  void addObject(std::shared_ptr<OutboundOpticalCharacterRecognition> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundOpticalCharacterRecognition> createObject() {
    auto obj = std::make_shared<OutboundOpticalCharacterRecognition>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
    addObjectInternal(obj);
    return obj;
  }

  void removeObject(const Xrpa::ObjectUuid& id) {
    removeObjectInternal(id);
  }
};

// Data Store Implementation
class OpticalCharacterRecognitionDataStore : public Xrpa::DataStoreReconciler {
 public:
  OpticalCharacterRecognitionDataStore(std::weak_ptr<Xrpa::TransportStream> inboundTransport, std::weak_ptr<Xrpa::TransportStream> outboundTransport)
      : Xrpa::DataStoreReconciler(inboundTransport, outboundTransport, 5316148) {
    OpticalCharacterRecognition = std::make_shared<OutboundOpticalCharacterRecognitionReaderCollection>(this);
    registerCollection(OpticalCharacterRecognition);
  }

  std::shared_ptr<OutboundOpticalCharacterRecognitionReaderCollection> OpticalCharacterRecognition;
};

} // namespace OpticalCharacterRecognitionDataStore
