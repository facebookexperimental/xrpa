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

#include "VisualEmotionDetectionTypes.h"
#include <ImageTypes.h>
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
#include <xrpa-runtime/utils/MemoryAccessor.h>
#include <xrpa-runtime/utils/XrpaTypes.h>

namespace VisualEmotionDetectionDataStore {

class VisualEmotionDetectionDataStore;
class OutboundVisualEmotionDetection;

class ImageInputReader : public Xrpa::ObjectAccessorInterface {
 public:
  ImageInputReader() {}

  explicit ImageInputReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  ImageTypes::Image getImage() {
    return DSEmotionImage::readValue(memAccessor_, readOffset_);
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class ImageInputWriter : public ImageInputReader {
 public:
  ImageInputWriter() {}

  explicit ImageInputWriter(const Xrpa::MemoryAccessor& memAccessor) : ImageInputReader(memAccessor) {}

  void setImage(const ImageTypes::Image& value) {
    DSEmotionImage::writeValue(value, memAccessor_, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class EmotionResultReader : public Xrpa::ObjectAccessorInterface {
 public:
  EmotionResultReader() {}

  explicit EmotionResultReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  std::chrono::nanoseconds getTimestamp() {
    return Xrpa::reinterpretValue<std::chrono::nanoseconds, uint64_t>(memAccessor_.readValue<uint64_t>(readOffset_));
  }

  EmotionType getEmotion() {
    return static_cast<EmotionType>(memAccessor_.readValue<uint32_t>(readOffset_));
  }

  bool getFaceDetected() {
    return (memAccessor_.readValue<int32_t>(readOffset_) == 1 ? true : false);
  }

  float getConfidence() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class EmotionResultWriter : public EmotionResultReader {
 public:
  EmotionResultWriter() {}

  explicit EmotionResultWriter(const Xrpa::MemoryAccessor& memAccessor) : EmotionResultReader(memAccessor) {}

  void setTimestamp(std::chrono::nanoseconds value) {
    memAccessor_.writeValue<uint64_t>(Xrpa::reinterpretValue<uint64_t, std::chrono::nanoseconds>(value), writeOffset_);
  }

  void setEmotion(EmotionType value) {
    memAccessor_.writeValue<uint32_t>(static_cast<uint32_t>(value), writeOffset_);
  }

  void setFaceDetected(bool value) {
    memAccessor_.writeValue<int32_t>((value ? 1 : 0), writeOffset_);
  }

  void setConfidence(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class VisualEmotionDetectionReader : public Xrpa::ObjectAccessorInterface {
 public:
  VisualEmotionDetectionReader() {}

  explicit VisualEmotionDetectionReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  std::string getApiKey() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  inline bool checkApiKeyChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class VisualEmotionDetectionWriter : public VisualEmotionDetectionReader {
 public:
  VisualEmotionDetectionWriter() {}

  explicit VisualEmotionDetectionWriter(const Xrpa::MemoryAccessor& memAccessor) : VisualEmotionDetectionReader(memAccessor) {}

  static VisualEmotionDetectionWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return VisualEmotionDetectionWriter(changeEvent.accessChangeData());
  }

  static VisualEmotionDetectionWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return VisualEmotionDetectionWriter(changeEvent.accessChangeData());
  }

  void setApiKey(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

// Reconciled Types
class OutboundVisualEmotionDetection : public Xrpa::DataStoreObject {
 public:
  explicit OutboundVisualEmotionDetection(const Xrpa::ObjectUuid& id) : Xrpa::DataStoreObject(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  const std::string& getApiKey() const {
    return localApiKey_;
  }

  void setApiKey(const std::string& apiKey) {
    localApiKey_ = apiKey;
    if ((changeBits_ & 1) == 0) {
      changeBits_ |= 1;
      changeByteCount_ += 4;
    }
    changeByteCount_ += Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localApiKey_);
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 1);
    }
  }

  void writeDSChanges(Xrpa::TransportStreamAccessor* accessor) {
    VisualEmotionDetectionWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 1;
      changeByteCount_ = Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localApiKey_) + 4;
      objAccessor = VisualEmotionDetectionWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = VisualEmotionDetectionWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    }
    if (objAccessor.isNull()) {
      return;
    }
    if (changeBits_ & 1) {
      objAccessor.setApiKey(localApiKey_);
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    createWritten_ = false;
    changeBits_ = 1;
    changeByteCount_ = Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localApiKey_) + 4;
    return createTimestamp_;
  }

  void processDSUpdate(VisualEmotionDetectionReader value, uint64_t fieldsChanged) {
    handleXrpaFieldsChanged(fieldsChanged);
  }

  inline bool checkApiKeyChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  void sendImageInput(const ImageTypes::Image& image) {
    auto message = ImageInputWriter(collection_->sendMessage(
        getXrpaId(),
        0,
        DSEmotionImage::dynSizeOfValue(image) + 48));
    message.setImage(image);
  }

  void onEmotionResult(std::function<void(uint64_t, EmotionResultReader)> handler) {
    emotionResultMessageHandler_ = handler;
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
    if (messageType == 2) {
      if (emotionResultMessageHandler_) {
        auto message = EmotionResultReader(messageData);
        emotionResultMessageHandler_(msgTimestamp, message);
      }
    }
  }

 protected:
  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) {
    if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(fieldsChanged); }
  }

  std::string localApiKey_ = "";
  uint64_t createTimestamp_;
  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;
  bool createWritten_ = false;

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;
  std::function<void(uint64_t, EmotionResultReader)> emotionResultMessageHandler_ = nullptr;
};

// Object Collections
class OutboundVisualEmotionDetectionReaderCollection : public Xrpa::ObjectCollection<VisualEmotionDetectionReader, std::shared_ptr<OutboundVisualEmotionDetection>> {
 public:
  explicit OutboundVisualEmotionDetectionReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<VisualEmotionDetectionReader, std::shared_ptr<OutboundVisualEmotionDetection>>(reconciler, 0, 0, 0, true) {}

  void addObject(std::shared_ptr<OutboundVisualEmotionDetection> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundVisualEmotionDetection> createObject() {
    auto obj = std::make_shared<OutboundVisualEmotionDetection>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
    addObjectInternal(obj);
    return obj;
  }

  void removeObject(const Xrpa::ObjectUuid& id) {
    removeObjectInternal(id);
  }
};

// Data Store Implementation
class VisualEmotionDetectionDataStore : public Xrpa::DataStoreReconciler {
 public:
  VisualEmotionDetectionDataStore(std::weak_ptr<Xrpa::TransportStream> inboundTransport, std::weak_ptr<Xrpa::TransportStream> outboundTransport)
      : Xrpa::DataStoreReconciler(inboundTransport, outboundTransport, 24883620) {
    VisualEmotionDetection = std::make_shared<OutboundVisualEmotionDetectionReaderCollection>(this);
    registerCollection(VisualEmotionDetection);
  }

  std::shared_ptr<OutboundVisualEmotionDetectionReaderCollection> VisualEmotionDetection;
};

} // namespace VisualEmotionDetectionDataStore
