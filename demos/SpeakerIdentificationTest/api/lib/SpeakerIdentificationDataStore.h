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

namespace SpeakerIdentificationDataStore {

class SpeakerIdentificationDataStore;
class OutboundSpeakerIdentifier;
class OutboundReferenceSpeaker;
class OutboundReferenceSpeakerAudioFile;

class SpeakerIdentifierReader : public Xrpa::ObjectAccessorInterface {
 public:
  SpeakerIdentifierReader() {}

  explicit SpeakerIdentifierReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  // Enable manual recording mode - set true to start, false to stop and process
  bool getManualRecordingEnabled() {
    return (memAccessor_.readValue<int32_t>(readOffset_) == 1 ? true : false);
  }

  // ID of the identified speaker, empty if no match
  std::string getIdentifiedSpeakerId() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  // Name of the identified speaker, empty if no match
  std::string getIdentifiedSpeakerName() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  // Confidence score of the match (0-1)
  int getConfidenceScore() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  // Error message if identification failed
  std::string getErrorMessage() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  inline bool checkManualRecordingEnabledChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkIdentifiedSpeakerIdChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkIdentifiedSpeakerNameChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkConfidenceScoreChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  inline bool checkErrorMessageChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 16;
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class SpeakerIdentifierWriter : public SpeakerIdentifierReader {
 public:
  SpeakerIdentifierWriter() {}

  explicit SpeakerIdentifierWriter(const Xrpa::MemoryAccessor& memAccessor) : SpeakerIdentifierReader(memAccessor) {}

  static SpeakerIdentifierWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return SpeakerIdentifierWriter(changeEvent.accessChangeData());
  }

  static SpeakerIdentifierWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return SpeakerIdentifierWriter(changeEvent.accessChangeData());
  }

  void setManualRecordingEnabled(bool value) {
    memAccessor_.writeValue<int32_t>((value ? 1 : 0), writeOffset_);
  }

  void setIdentifiedSpeakerId(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

  void setIdentifiedSpeakerName(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

  void setConfidenceScore(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setErrorMessage(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class ReferenceSpeakerReader : public Xrpa::ObjectAccessorInterface {
 public:
  ReferenceSpeakerReader() {}

  explicit ReferenceSpeakerReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  // Unique identifier for this speaker
  std::string getSpeakerId() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  // Human-readable name for this speaker
  std::string getSpeakerName() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  // Path to the audio file containing the speaker's voice sample
  std::string getFilePath() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  // Reference back to the SpeakerIdentifier that this config belongs to
  Xrpa::ObjectUuid getSpeakerIdentifier() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  inline bool checkSpeakerIdChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkSpeakerNameChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkFilePathChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkSpeakerIdentifierChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class ReferenceSpeakerWriter : public ReferenceSpeakerReader {
 public:
  ReferenceSpeakerWriter() {}

  explicit ReferenceSpeakerWriter(const Xrpa::MemoryAccessor& memAccessor) : ReferenceSpeakerReader(memAccessor) {}

  static ReferenceSpeakerWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return ReferenceSpeakerWriter(changeEvent.accessChangeData());
  }

  static ReferenceSpeakerWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return ReferenceSpeakerWriter(changeEvent.accessChangeData());
  }

  void setSpeakerId(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

  void setSpeakerName(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

  void setFilePath(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

  void setSpeakerIdentifier(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class ReferenceSpeakerAudioFileReader : public Xrpa::ObjectAccessorInterface {
 public:
  ReferenceSpeakerAudioFileReader() {}

  explicit ReferenceSpeakerAudioFileReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  // Path to the audio file containing the speaker's voice sample
  std::string getFilePath() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  // Reference back to the speaker this audio file belongs to
  Xrpa::ObjectUuid getSpeaker() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  inline bool checkFilePathChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkSpeakerChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class ReferenceSpeakerAudioFileWriter : public ReferenceSpeakerAudioFileReader {
 public:
  ReferenceSpeakerAudioFileWriter() {}

  explicit ReferenceSpeakerAudioFileWriter(const Xrpa::MemoryAccessor& memAccessor) : ReferenceSpeakerAudioFileReader(memAccessor) {}

  static ReferenceSpeakerAudioFileWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return ReferenceSpeakerAudioFileWriter(changeEvent.accessChangeData());
  }

  static ReferenceSpeakerAudioFileWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return ReferenceSpeakerAudioFileWriter(changeEvent.accessChangeData());
  }

  void setFilePath(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

  void setSpeaker(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

// Reconciled Types
class OutboundSpeakerIdentifier : public Xrpa::DataStoreObject {
 public:
  explicit OutboundSpeakerIdentifier(const Xrpa::ObjectUuid& id) : Xrpa::DataStoreObject(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  bool getManualRecordingEnabled() const {
    return localManualRecordingEnabled_;
  }

  void setManualRecordingEnabled(bool manualRecordingEnabled) {
    localManualRecordingEnabled_ = manualRecordingEnabled;
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
    SpeakerIdentifierWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 1;
      changeByteCount_ = 4;
      objAccessor = SpeakerIdentifierWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = SpeakerIdentifierWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    }
    if (objAccessor.isNull()) {
      return;
    }
    if (changeBits_ & 1) {
      objAccessor.setManualRecordingEnabled(localManualRecordingEnabled_);
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

  void processDSUpdate(SpeakerIdentifierReader value, uint64_t fieldsChanged) {
    if (value.checkIdentifiedSpeakerIdChanged(fieldsChanged)) {
      localIdentifiedSpeakerId_ = value.getIdentifiedSpeakerId();
    }
    if (value.checkIdentifiedSpeakerNameChanged(fieldsChanged)) {
      localIdentifiedSpeakerName_ = value.getIdentifiedSpeakerName();
    }
    if (value.checkConfidenceScoreChanged(fieldsChanged)) {
      localConfidenceScore_ = value.getConfidenceScore();
    }
    if (value.checkErrorMessageChanged(fieldsChanged)) {
      localErrorMessage_ = value.getErrorMessage();
    }
    handleXrpaFieldsChanged(fieldsChanged);
  }

  const std::string& getIdentifiedSpeakerId() const {
    return localIdentifiedSpeakerId_;
  }

  const std::string& getIdentifiedSpeakerName() const {
    return localIdentifiedSpeakerName_;
  }

  int getConfidenceScore() const {
    return localConfidenceScore_;
  }

  const std::string& getErrorMessage() const {
    return localErrorMessage_;
  }

  inline bool checkManualRecordingEnabledChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkIdentifiedSpeakerIdChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkIdentifiedSpeakerNameChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkConfidenceScoreChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  inline bool checkErrorMessageChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 16;
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
  }

 protected:
  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) {
    if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(fieldsChanged); }
  }

  // Enable manual recording mode - set true to start, false to stop and process
  bool localManualRecordingEnabled_ = false;

  uint64_t createTimestamp_;
  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;
  bool createWritten_ = false;

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;

  // ID of the identified speaker, empty if no match
  std::string localIdentifiedSpeakerId_ = "";

  // Name of the identified speaker, empty if no match
  std::string localIdentifiedSpeakerName_ = "";

  // Confidence score of the match (0-1)
  int localConfidenceScore_ = 0;

  // Error message if identification failed
  std::string localErrorMessage_ = "";

  Xrpa::OutboundSignalData localAudioSignal_{};
};

class OutboundReferenceSpeaker : public Xrpa::DataStoreObject {
 public:
  explicit OutboundReferenceSpeaker(const Xrpa::ObjectUuid& id) : Xrpa::DataStoreObject(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  const std::string& getSpeakerId() const {
    return localSpeakerId_;
  }

  void setSpeakerId(const std::string& speakerId) {
    localSpeakerId_ = speakerId;
    if ((changeBits_ & 1) == 0) {
      changeBits_ |= 1;
      changeByteCount_ += 4;
    }
    changeByteCount_ += Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localSpeakerId_);
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 1);
    }
  }

  const std::string& getSpeakerName() const {
    return localSpeakerName_;
  }

  void setSpeakerName(const std::string& speakerName) {
    localSpeakerName_ = speakerName;
    if ((changeBits_ & 2) == 0) {
      changeBits_ |= 2;
      changeByteCount_ += 4;
    }
    changeByteCount_ += Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localSpeakerName_);
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 2);
    }
  }

  const std::string& getFilePath() const {
    return localFilePath_;
  }

  void setFilePath(const std::string& filePath) {
    localFilePath_ = filePath;
    if ((changeBits_ & 4) == 0) {
      changeBits_ |= 4;
      changeByteCount_ += 4;
    }
    changeByteCount_ += Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localFilePath_);
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 4);
    }
  }

  const Xrpa::ObjectUuid& getSpeakerIdentifier() const {
    return localSpeakerIdentifier_;
  }

  void setSpeakerIdentifier(const Xrpa::ObjectUuid& speakerIdentifier) {
    localSpeakerIdentifier_ = speakerIdentifier;
    if ((changeBits_ & 8) == 0) {
      changeBits_ |= 8;
      changeByteCount_ += 16;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 8);
    }
  }

  void writeDSChanges(Xrpa::TransportStreamAccessor* accessor) {
    ReferenceSpeakerWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 15;
      changeByteCount_ = Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localSpeakerId_) + Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localSpeakerName_) + Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localFilePath_) + 28;
      objAccessor = ReferenceSpeakerWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = ReferenceSpeakerWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    }
    if (objAccessor.isNull()) {
      return;
    }
    if (changeBits_ & 1) {
      objAccessor.setSpeakerId(localSpeakerId_);
    }
    if (changeBits_ & 2) {
      objAccessor.setSpeakerName(localSpeakerName_);
    }
    if (changeBits_ & 4) {
      objAccessor.setFilePath(localFilePath_);
    }
    if (changeBits_ & 8) {
      objAccessor.setSpeakerIdentifier(localSpeakerIdentifier_);
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    createWritten_ = false;
    changeBits_ = 15;
    changeByteCount_ = Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localSpeakerId_) + Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localSpeakerName_) + Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localFilePath_) + 28;
    return createTimestamp_;
  }

  void processDSUpdate(ReferenceSpeakerReader value, uint64_t fieldsChanged) {
    handleXrpaFieldsChanged(fieldsChanged);
  }

  inline bool checkSpeakerIdChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkSpeakerNameChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkFilePathChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkSpeakerIdentifierChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
  }

 protected:
  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) {
    if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(fieldsChanged); }
  }

  // Unique identifier for this speaker
  std::string localSpeakerId_ = "";

  // Human-readable name for this speaker
  std::string localSpeakerName_ = "";

  // Path to the audio file containing the speaker's voice sample
  std::string localFilePath_ = "";

  // Reference back to the SpeakerIdentifier that this config belongs to
  Xrpa::ObjectUuid localSpeakerIdentifier_{0ULL, 0ULL};

  uint64_t createTimestamp_;
  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;
  bool createWritten_ = false;

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;
};

class OutboundReferenceSpeakerAudioFile : public Xrpa::DataStoreObject {
 public:
  explicit OutboundReferenceSpeakerAudioFile(const Xrpa::ObjectUuid& id) : Xrpa::DataStoreObject(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  const std::string& getFilePath() const {
    return localFilePath_;
  }

  void setFilePath(const std::string& filePath) {
    localFilePath_ = filePath;
    if ((changeBits_ & 1) == 0) {
      changeBits_ |= 1;
      changeByteCount_ += 4;
    }
    changeByteCount_ += Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localFilePath_);
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 1);
    }
  }

  const Xrpa::ObjectUuid& getSpeaker() const {
    return localSpeaker_;
  }

  void setSpeaker(const Xrpa::ObjectUuid& speaker) {
    localSpeaker_ = speaker;
    if ((changeBits_ & 2) == 0) {
      changeBits_ |= 2;
      changeByteCount_ += 16;
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
    ReferenceSpeakerAudioFileWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 3;
      changeByteCount_ = Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localFilePath_) + 20;
      objAccessor = ReferenceSpeakerAudioFileWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = ReferenceSpeakerAudioFileWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    }
    if (objAccessor.isNull()) {
      return;
    }
    if (changeBits_ & 1) {
      objAccessor.setFilePath(localFilePath_);
    }
    if (changeBits_ & 2) {
      objAccessor.setSpeaker(localSpeaker_);
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    createWritten_ = false;
    changeBits_ = 3;
    changeByteCount_ = Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localFilePath_) + 20;
    return createTimestamp_;
  }

  void processDSUpdate(ReferenceSpeakerAudioFileReader value, uint64_t fieldsChanged) {
    handleXrpaFieldsChanged(fieldsChanged);
  }

  inline bool checkFilePathChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkSpeakerChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
  }

 protected:
  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) {
    if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(fieldsChanged); }
  }

  // Path to the audio file containing the speaker's voice sample
  std::string localFilePath_ = "";

  // Reference back to the speaker this audio file belongs to
  Xrpa::ObjectUuid localSpeaker_{0ULL, 0ULL};

  uint64_t createTimestamp_;
  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;
  bool createWritten_ = false;

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;
};

// Object Collections
class OutboundSpeakerIdentifierReaderCollection : public Xrpa::ObjectCollection<SpeakerIdentifierReader, std::shared_ptr<OutboundSpeakerIdentifier>> {
 public:
  explicit OutboundSpeakerIdentifierReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<SpeakerIdentifierReader, std::shared_ptr<OutboundSpeakerIdentifier>>(reconciler, 0, 30, 0, true) {}

  void addObject(std::shared_ptr<OutboundSpeakerIdentifier> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundSpeakerIdentifier> createObject() {
    auto obj = std::make_shared<OutboundSpeakerIdentifier>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
    addObjectInternal(obj);
    return obj;
  }

  void removeObject(const Xrpa::ObjectUuid& id) {
    removeObjectInternal(id);
  }
};

class OutboundReferenceSpeakerReaderCollection : public Xrpa::ObjectCollection<ReferenceSpeakerReader, std::shared_ptr<OutboundReferenceSpeaker>> {
 public:
  explicit OutboundReferenceSpeakerReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<ReferenceSpeakerReader, std::shared_ptr<OutboundReferenceSpeaker>>(reconciler, 1, 0, 0, true) {}

  void addObject(std::shared_ptr<OutboundReferenceSpeaker> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundReferenceSpeaker> createObject() {
    auto obj = std::make_shared<OutboundReferenceSpeaker>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
    addObjectInternal(obj);
    return obj;
  }

  void removeObject(const Xrpa::ObjectUuid& id) {
    removeObjectInternal(id);
  }
};

class OutboundReferenceSpeakerAudioFileReaderCollection : public Xrpa::ObjectCollection<ReferenceSpeakerAudioFileReader, std::shared_ptr<OutboundReferenceSpeakerAudioFile>> {
 public:
  explicit OutboundReferenceSpeakerAudioFileReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<ReferenceSpeakerAudioFileReader, std::shared_ptr<OutboundReferenceSpeakerAudioFile>>(reconciler, 2, 0, 0, true) {}

  void addObject(std::shared_ptr<OutboundReferenceSpeakerAudioFile> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundReferenceSpeakerAudioFile> createObject() {
    auto obj = std::make_shared<OutboundReferenceSpeakerAudioFile>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
    addObjectInternal(obj);
    return obj;
  }

  void removeObject(const Xrpa::ObjectUuid& id) {
    removeObjectInternal(id);
  }
};

// Data Store Implementation
class SpeakerIdentificationDataStore : public Xrpa::DataStoreReconciler {
 public:
  SpeakerIdentificationDataStore(std::weak_ptr<Xrpa::TransportStream> inboundTransport, std::weak_ptr<Xrpa::TransportStream> outboundTransport)
      : Xrpa::DataStoreReconciler(inboundTransport, outboundTransport, 77320) {
    SpeakerIdentifier = std::make_shared<OutboundSpeakerIdentifierReaderCollection>(this);
    registerCollection(SpeakerIdentifier);
    ReferenceSpeaker = std::make_shared<OutboundReferenceSpeakerReaderCollection>(this);
    registerCollection(ReferenceSpeaker);
    ReferenceSpeakerAudioFile = std::make_shared<OutboundReferenceSpeakerAudioFileReaderCollection>(this);
    registerCollection(ReferenceSpeakerAudioFile);
  }

  std::shared_ptr<OutboundSpeakerIdentifierReaderCollection> SpeakerIdentifier;
  std::shared_ptr<OutboundReferenceSpeakerReaderCollection> ReferenceSpeaker;
  std::shared_ptr<OutboundReferenceSpeakerAudioFileReaderCollection> ReferenceSpeakerAudioFile;
};

template <typename SampleType>
inline void OutboundSpeakerIdentifier::setAudioSignalCallback(Xrpa::SignalProducerCallback<SampleType> signalCallback, int32_t numChannels, int32_t framesPerSecond, int32_t framesPerPacket) {
  localAudioSignal_.setSignalSource(signalCallback, numChannels, framesPerSecond, framesPerPacket);
}

template <typename SampleType>
inline void OutboundSpeakerIdentifier::setAudioSignalRingBuffer(Xrpa::SignalRingBuffer<SampleType>* signalRingBuffer, int32_t numChannels, int32_t framesPerSecond, int32_t framesPerPacket) {
  localAudioSignal_.setSignalSource(signalRingBuffer, numChannels, framesPerSecond, framesPerPacket);
}

template <typename SampleType>
inline void OutboundSpeakerIdentifier::setAudioSignalForwarder(std::shared_ptr<Xrpa::InboundSignalForwarder> signalForwarder) {
  localAudioSignal_.setRecipient(getXrpaId(), collection_, 0);
  signalForwarder->addRecipient(localAudioSignal_);
}

template <typename SampleType>
inline Xrpa::SignalPacket OutboundSpeakerIdentifier::sendAudioSignal(int32_t frameCount, int32_t numChannels, int32_t framesPerSecond) {
  int32_t sampleType = Xrpa::SignalTypeInference::inferSampleType<SampleType>();
  localAudioSignal_.setRecipient(getXrpaId(), collection_, 0);
  return localAudioSignal_.sendSignalPacket(Xrpa::MemoryUtils::getTypeSize<SampleType>(), frameCount, sampleType, numChannels, framesPerSecond);
}

} // namespace SpeakerIdentificationDataStore
