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

#include <chrono>
#include <functional>
#include <memory>
#include <string>
#include <xrpa-runtime/external_utils/UuidGen.h>
#include <xrpa-runtime/reconciler/DataStoreInterfaces.h>
#include <xrpa-runtime/reconciler/DataStoreReconciler.h>
#include <xrpa-runtime/reconciler/ObjectCollection.h>
#include <xrpa-runtime/signals/InboundSignalData.h>
#include <xrpa-runtime/transport/TransportStream.h>
#include <xrpa-runtime/transport/TransportStreamAccessor.h>
#include <xrpa-runtime/utils/MemoryAccessor.h>
#include <xrpa-runtime/utils/XrpaTypes.h>

namespace TextToSpeechDataStore {

class TextToSpeechDataStore;
class OutboundTextToSpeech;

class TextRequestReader : public Xrpa::ObjectAccessorInterface {
 public:
  TextRequestReader() {}

  explicit TextRequestReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  // Text to convert to speech
  std::string getText() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  // Optional ID. If sent with a text request, the response will have the same ID.
  int getId() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class TextRequestWriter : public TextRequestReader {
 public:
  TextRequestWriter() {}

  explicit TextRequestWriter(const Xrpa::MemoryAccessor& memAccessor) : TextRequestReader(memAccessor) {}

  void setText(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

  void setId(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class TtsResponseReader : public Xrpa::ObjectAccessorInterface {
 public:
  TtsResponseReader() {}

  explicit TtsResponseReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  // Request ID that matches the original text request
  int getId() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  // Whether synthesis completed successfully
  bool getSuccess() {
    return (memAccessor_.readValue<int32_t>(readOffset_) == 1 ? true : false);
  }

  // Error message if processing failed
  std::string getErrorMessage() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  // Timestamp when audio playback started
  std::chrono::nanoseconds getPlaybackStartTimestamp() {
    return Xrpa::reinterpretValue<std::chrono::nanoseconds, uint64_t>(memAccessor_.readValue<uint64_t>(readOffset_));
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class TtsResponseWriter : public TtsResponseReader {
 public:
  TtsResponseWriter() {}

  explicit TtsResponseWriter(const Xrpa::MemoryAccessor& memAccessor) : TtsResponseReader(memAccessor) {}

  void setId(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setSuccess(bool value) {
    memAccessor_.writeValue<int32_t>((value ? 1 : 0), writeOffset_);
  }

  void setErrorMessage(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

  void setPlaybackStartTimestamp(std::chrono::nanoseconds value) {
    memAccessor_.writeValue<uint64_t>(Xrpa::reinterpretValue<uint64_t, std::chrono::nanoseconds>(value), writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class TextToSpeechReader : public Xrpa::ObjectAccessorInterface {
 public:
  TextToSpeechReader() {}

  explicit TextToSpeechReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

 private:
  Xrpa::MemoryOffset readOffset_;
};

class TextToSpeechWriter : public TextToSpeechReader {
 public:
  TextToSpeechWriter() {}

  explicit TextToSpeechWriter(const Xrpa::MemoryAccessor& memAccessor) : TextToSpeechReader(memAccessor) {}

  static TextToSpeechWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return TextToSpeechWriter(changeEvent.accessChangeData());
  }

  static TextToSpeechWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return TextToSpeechWriter(changeEvent.accessChangeData());
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

// Reconciled Types
class OutboundTextToSpeech : public Xrpa::DataStoreObject {
 public:
  explicit OutboundTextToSpeech(const Xrpa::ObjectUuid& id) : Xrpa::DataStoreObject(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  void writeDSChanges(Xrpa::TransportStreamAccessor* accessor) {
    TextToSpeechWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 0;
      changeByteCount_ = 0;
      objAccessor = TextToSpeechWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = TextToSpeechWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
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

  void processDSUpdate(TextToSpeechReader value, uint64_t fieldsChanged) {
    handleXrpaFieldsChanged(fieldsChanged);
  }

  void sendTextRequest(const std::string& text, int id) {
    auto message = TextRequestWriter(collection_->sendMessage(
        getXrpaId(),
        0,
        Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(text) + 8));
    message.setText(text);
    message.setId(id);
  }

  void onTtsResponse(std::function<void(uint64_t, TtsResponseReader)> handler) {
    TtsResponseMessageHandler_ = handler;
  }

  void onAudio(std::shared_ptr<Xrpa::InboundSignalDataInterface> handler) {
    audioSignalHandler_ = handler;
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
    if (messageType == 2) {
      if (TtsResponseMessageHandler_) {
        auto message = TtsResponseReader(messageData);
        TtsResponseMessageHandler_(msgTimestamp, message);
      }
    }
    if (messageType == 1) {
      if (audioSignalHandler_) {
        audioSignalHandler_->onSignalData(msgTimestamp, messageData);
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
  std::function<void(uint64_t, TtsResponseReader)> TtsResponseMessageHandler_ = nullptr;
  std::shared_ptr<Xrpa::InboundSignalDataInterface> audioSignalHandler_ = nullptr;
};

// Object Collections
class OutboundTextToSpeechReaderCollection : public Xrpa::ObjectCollection<TextToSpeechReader, std::shared_ptr<OutboundTextToSpeech>> {
 public:
  explicit OutboundTextToSpeechReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<TextToSpeechReader, std::shared_ptr<OutboundTextToSpeech>>(reconciler, 0, 0, 0, true) {}

  void addObject(std::shared_ptr<OutboundTextToSpeech> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundTextToSpeech> createObject() {
    auto obj = std::make_shared<OutboundTextToSpeech>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
    addObjectInternal(obj);
    return obj;
  }

  void removeObject(const Xrpa::ObjectUuid& id) {
    removeObjectInternal(id);
  }
};

// Data Store Implementation
class TextToSpeechDataStore : public Xrpa::DataStoreReconciler {
 public:
  TextToSpeechDataStore(std::weak_ptr<Xrpa::TransportStream> inboundTransport, std::weak_ptr<Xrpa::TransportStream> outboundTransport)
      : Xrpa::DataStoreReconciler(inboundTransport, outboundTransport, 1266112) {
    TextToSpeech = std::make_shared<OutboundTextToSpeechReaderCollection>(this);
    registerCollection(TextToSpeech);
  }

  std::shared_ptr<OutboundTextToSpeechReaderCollection> TextToSpeech;
};

} // namespace TextToSpeechDataStore
