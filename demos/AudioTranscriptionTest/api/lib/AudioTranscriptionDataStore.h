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
#include <xrpa-runtime/signals/InboundSignalForwarder.h>
#include <xrpa-runtime/signals/OutboundSignalData.h>
#include <xrpa-runtime/signals/SignalRingBuffer.h>
#include <xrpa-runtime/signals/SignalShared.h>
#include <xrpa-runtime/transport/TransportStream.h>
#include <xrpa-runtime/transport/TransportStreamAccessor.h>
#include <xrpa-runtime/utils/MemoryAccessor.h>
#include <xrpa-runtime/utils/XrpaTypes.h>

namespace AudioTranscriptionDataStore {

class AudioTranscriptionDataStore;
class OutboundAudioTranscription;

class TranscriptionResultReader : public Xrpa::ObjectAccessorInterface {
 public:
  TranscriptionResultReader() {}

  explicit TranscriptionResultReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  // Transcribed text from audio
  std::string getText() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  // Timestamp of the start of the audio segment from which the transcription is generated
  std::chrono::nanoseconds getTimestamp() {
    return Xrpa::reinterpretValue<std::chrono::nanoseconds, uint64_t>(memAccessor_.readValue<uint64_t>(readOffset_));
  }

  // Whether transcription completed successfully
  bool getSuccess() {
    return (memAccessor_.readValue<int32_t>(readOffset_) == 1 ? true : false);
  }

  // Error message if transcription failed
  std::string getErrorMessage() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class TranscriptionResultWriter : public TranscriptionResultReader {
 public:
  TranscriptionResultWriter() {}

  explicit TranscriptionResultWriter(const Xrpa::MemoryAccessor& memAccessor) : TranscriptionResultReader(memAccessor) {}

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

class AudioTranscriptionReader : public Xrpa::ObjectAccessorInterface {
 public:
  AudioTranscriptionReader() {}

  explicit AudioTranscriptionReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

 private:
  Xrpa::MemoryOffset readOffset_;
};

class AudioTranscriptionWriter : public AudioTranscriptionReader {
 public:
  AudioTranscriptionWriter() {}

  explicit AudioTranscriptionWriter(const Xrpa::MemoryAccessor& memAccessor) : AudioTranscriptionReader(memAccessor) {}

  static AudioTranscriptionWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return AudioTranscriptionWriter(changeEvent.accessChangeData());
  }

  static AudioTranscriptionWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return AudioTranscriptionWriter(changeEvent.accessChangeData());
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

// Reconciled Types
class OutboundAudioTranscription : public Xrpa::DataStoreObject {
 public:
  explicit OutboundAudioTranscription(const Xrpa::ObjectUuid& id) : Xrpa::DataStoreObject(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  void writeDSChanges(Xrpa::TransportStreamAccessor* accessor) {
    AudioTranscriptionWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 0;
      changeByteCount_ = 0;
      objAccessor = AudioTranscriptionWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = AudioTranscriptionWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
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

  void processDSUpdate(AudioTranscriptionReader value, uint64_t fieldsChanged) {
    handleXrpaFieldsChanged(fieldsChanged);
  }

  void onTranscriptionResult(std::function<void(uint64_t, TranscriptionResultReader)> handler) {
    transcriptionResultMessageHandler_ = handler;
  }

  template <typename SampleType>
  void setAudioSignalCallback(Xrpa::SignalProducerCallback<SampleType> signalCallback, int32_t numChannels, int32_t framesPerSecond, int32_t framesPerPacket);

  template <typename SampleType>
  void setAudioSignalRingBuffer(Xrpa::SignalRingBuffer<SampleType>* signalRingBuffer, int32_t numChannels, int32_t framesPerSecond, int32_t framesPerPacket);

  template <typename SampleType>
  void setAudioSignalForwarder(std::shared_ptr<Xrpa::InboundSignalForwarder> signalForwarder);

  template <typename SampleType>
  Xrpa::SignalPacket sendAudioSignal(int32_t frameCount, int32_t numChannels, int32_t framesPerSecond);

  void tickXrpa() {
    auto id = getXrpaId();
    localAudioSignal_.setRecipient(id, collection_, 0);
    localAudioSignal_.tick();
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
    if (messageType == 1) {
      if (transcriptionResultMessageHandler_) {
        auto message = TranscriptionResultReader(messageData);
        transcriptionResultMessageHandler_(msgTimestamp, message);
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
  std::function<void(uint64_t, TranscriptionResultReader)> transcriptionResultMessageHandler_ = nullptr;
  Xrpa::OutboundSignalData localAudioSignal_{};
};

// Object Collections
class OutboundAudioTranscriptionReaderCollection : public Xrpa::ObjectCollection<AudioTranscriptionReader, std::shared_ptr<OutboundAudioTranscription>> {
 public:
  explicit OutboundAudioTranscriptionReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<AudioTranscriptionReader, std::shared_ptr<OutboundAudioTranscription>>(reconciler, 0, 0, 0, true) {}

  void addObject(std::shared_ptr<OutboundAudioTranscription> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundAudioTranscription> createObject() {
    auto obj = std::make_shared<OutboundAudioTranscription>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
    addObjectInternal(obj);
    return obj;
  }

  void removeObject(const Xrpa::ObjectUuid& id) {
    removeObjectInternal(id);
  }
};

// Data Store Implementation
class AudioTranscriptionDataStore : public Xrpa::DataStoreReconciler {
 public:
  AudioTranscriptionDataStore(std::weak_ptr<Xrpa::TransportStream> inboundTransport, std::weak_ptr<Xrpa::TransportStream> outboundTransport)
      : Xrpa::DataStoreReconciler(inboundTransport, outboundTransport, 316000) {
    AudioTranscription = std::make_shared<OutboundAudioTranscriptionReaderCollection>(this);
    registerCollection(AudioTranscription);
  }

  std::shared_ptr<OutboundAudioTranscriptionReaderCollection> AudioTranscription;
};

template <typename SampleType>
inline void OutboundAudioTranscription::setAudioSignalCallback(Xrpa::SignalProducerCallback<SampleType> signalCallback, int32_t numChannels, int32_t framesPerSecond, int32_t framesPerPacket) {
  localAudioSignal_.setSignalSource(signalCallback, numChannels, framesPerSecond, framesPerPacket);
}

template <typename SampleType>
inline void OutboundAudioTranscription::setAudioSignalRingBuffer(Xrpa::SignalRingBuffer<SampleType>* signalRingBuffer, int32_t numChannels, int32_t framesPerSecond, int32_t framesPerPacket) {
  localAudioSignal_.setSignalSource(signalRingBuffer, numChannels, framesPerSecond, framesPerPacket);
}

template <typename SampleType>
inline void OutboundAudioTranscription::setAudioSignalForwarder(std::shared_ptr<Xrpa::InboundSignalForwarder> signalForwarder) {
  localAudioSignal_.setRecipient(getXrpaId(), collection_, 0);
  signalForwarder->addRecipient(localAudioSignal_);
}

template <typename SampleType>
inline Xrpa::SignalPacket OutboundAudioTranscription::sendAudioSignal(int32_t frameCount, int32_t numChannels, int32_t framesPerSecond) {
  int32_t sampleType = Xrpa::SignalTypeInference::inferSampleType<SampleType>();
  localAudioSignal_.setRecipient(getXrpaId(), collection_, 0);
  return localAudioSignal_.sendSignalPacket(Xrpa::MemoryUtils::getTypeSize<SampleType>(), frameCount, sampleType, numChannels, framesPerSecond);
}

} // namespace AudioTranscriptionDataStore
