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

#include "AudioInputTypes.h"
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

namespace AudioInputDataStore {

class AudioInputDataStore;
class OutboundAudioInputDevice;
class ReconciledAudioInputSource;

class AudioInputDeviceReader : public Xrpa::ObjectAccessorInterface {
 public:
  AudioInputDeviceReader() {}

  explicit AudioInputDeviceReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  // Human-readable device name
  std::string getDeviceName() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  // Number of channels available
  int getNumChannels() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  // Default frame rate for audio capture
  int getFrameRate() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  // Whether this is the default input device
  bool getIsSystemAudioInput() {
    return (memAccessor_.readValue<int32_t>(readOffset_) == 1 ? true : false);
  }

  inline bool checkDeviceNameChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkNumChannelsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkFrameRateChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkIsSystemAudioInputChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class AudioInputDeviceWriter : public AudioInputDeviceReader {
 public:
  AudioInputDeviceWriter() {}

  explicit AudioInputDeviceWriter(const Xrpa::MemoryAccessor& memAccessor) : AudioInputDeviceReader(memAccessor) {}

  static AudioInputDeviceWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return AudioInputDeviceWriter(changeEvent.accessChangeData());
  }

  static AudioInputDeviceWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return AudioInputDeviceWriter(changeEvent.accessChangeData());
  }

  void setDeviceName(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

  void setNumChannels(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setFrameRate(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setIsSystemAudioInput(bool value) {
    memAccessor_.writeValue<int32_t>((value ? 1 : 0), writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class AudioInputSourceReader : public Xrpa::ObjectAccessorInterface {
 public:
  AudioInputSourceReader() {}

  explicit AudioInputSourceReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  DeviceBindingType getBindTo() {
    return static_cast<DeviceBindingType>(memAccessor_.readValue<uint32_t>(readOffset_));
  }

  Xrpa::ObjectUuid getDevice() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  std::string getDeviceName() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  std::string getHostname() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  int getPort() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  // Frame rate for audio capture
  int getFrameRate() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  // Number of channels for audio capture
  int getNumChannels() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  // Whether audio input is currently active
  bool getIsActive() {
    return (memAccessor_.readValue<int32_t>(readOffset_) == 1 ? true : false);
  }

  // Error message if audio input failed
  std::string getErrorMessage() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  inline bool checkBindToChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkDeviceChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkDeviceNameChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkHostnameChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  inline bool checkPortChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 16;
  }

  inline bool checkFrameRateChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 32;
  }

  inline bool checkNumChannelsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 64;
  }

  inline bool checkIsActiveChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 128;
  }

  inline bool checkErrorMessageChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 256;
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class AudioInputSourceWriter : public AudioInputSourceReader {
 public:
  AudioInputSourceWriter() {}

  explicit AudioInputSourceWriter(const Xrpa::MemoryAccessor& memAccessor) : AudioInputSourceReader(memAccessor) {}

  static AudioInputSourceWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return AudioInputSourceWriter(changeEvent.accessChangeData());
  }

  static AudioInputSourceWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return AudioInputSourceWriter(changeEvent.accessChangeData());
  }

  void setBindTo(DeviceBindingType value) {
    memAccessor_.writeValue<uint32_t>(static_cast<uint32_t>(value), writeOffset_);
  }

  void setDevice(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

  void setDeviceName(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

  void setHostname(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

  void setPort(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setFrameRate(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setNumChannels(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setIsActive(bool value) {
    memAccessor_.writeValue<int32_t>((value ? 1 : 0), writeOffset_);
  }

  void setErrorMessage(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

// Reconciled Types
class OutboundAudioInputDevice : public Xrpa::DataStoreObject {
 public:
  explicit OutboundAudioInputDevice(const Xrpa::ObjectUuid& id) : Xrpa::DataStoreObject(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  const std::string& getDeviceName() const {
    return localDeviceName_;
  }

  void setDeviceName(const std::string& deviceName) {
    localDeviceName_ = deviceName;
    if ((changeBits_ & 1) == 0) {
      changeBits_ |= 1;
      changeByteCount_ += 4;
    }
    changeByteCount_ += Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localDeviceName_);
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 1);
    }
  }

  int getNumChannels() const {
    return localNumChannels_;
  }

  void setNumChannels(int numChannels) {
    localNumChannels_ = numChannels;
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

  int getFrameRate() const {
    return localFrameRate_;
  }

  void setFrameRate(int frameRate) {
    localFrameRate_ = frameRate;
    if ((changeBits_ & 4) == 0) {
      changeBits_ |= 4;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 4);
    }
  }

  bool getIsSystemAudioInput() const {
    return localIsSystemAudioInput_;
  }

  void setIsSystemAudioInput(bool isSystemAudioInput) {
    localIsSystemAudioInput_ = isSystemAudioInput;
    if ((changeBits_ & 8) == 0) {
      changeBits_ |= 8;
      changeByteCount_ += 4;
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
    AudioInputDeviceWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 15;
      changeByteCount_ = Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localDeviceName_) + 16;
      objAccessor = AudioInputDeviceWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = AudioInputDeviceWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    }
    if (objAccessor.isNull()) {
      return;
    }
    if (changeBits_ & 1) {
      objAccessor.setDeviceName(localDeviceName_);
    }
    if (changeBits_ & 2) {
      objAccessor.setNumChannels(localNumChannels_);
    }
    if (changeBits_ & 4) {
      objAccessor.setFrameRate(localFrameRate_);
    }
    if (changeBits_ & 8) {
      objAccessor.setIsSystemAudioInput(localIsSystemAudioInput_);
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    createWritten_ = false;
    changeBits_ = 15;
    changeByteCount_ = Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localDeviceName_) + 16;
    return createTimestamp_;
  }

  void processDSUpdate(AudioInputDeviceReader value, uint64_t fieldsChanged) {
    handleXrpaFieldsChanged(fieldsChanged);
  }

  inline bool checkDeviceNameChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkNumChannelsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkFrameRateChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkIsSystemAudioInputChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
  }

 protected:
  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) {
    if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(fieldsChanged); }
  }

  // Human-readable device name
  std::string localDeviceName_ = "";

  // Number of channels available
  int localNumChannels_ = 2;

  // Default frame rate for audio capture
  int localFrameRate_ = 48000;

  // Whether this is the default input device
  bool localIsSystemAudioInput_ = false;

  uint64_t createTimestamp_;
  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;
  bool createWritten_ = false;

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;
};

class ReconciledAudioInputSource : public Xrpa::DataStoreObject {
 public:
  ReconciledAudioInputSource(const Xrpa::ObjectUuid& id, Xrpa::IObjectCollection* collection) : Xrpa::DataStoreObject(id, collection) {}

  virtual ~ReconciledAudioInputSource() = default;

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  virtual void handleXrpaDelete() {
    if (xrpaDeleteHandler_) { xrpaDeleteHandler_(); }
  }

  void onXrpaDelete(std::function<void()> handler) {
    xrpaDeleteHandler_ = handler;
  }

  bool getIsActive() const {
    return localIsActive_;
  }

  void setIsActive(bool isActive) {
    localIsActive_ = isActive;
    if ((changeBits_ & 128) == 0) {
      changeBits_ |= 128;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 128);
    }
  }

  const std::string& getErrorMessage() const {
    return localErrorMessage_;
  }

  void setErrorMessage(const std::string& errorMessage) {
    localErrorMessage_ = errorMessage;
    if ((changeBits_ & 256) == 0) {
      changeBits_ |= 256;
      changeByteCount_ += 4;
    }
    changeByteCount_ += Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localErrorMessage_);
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 256);
    }
  }

  void processDSUpdate(AudioInputSourceReader value, uint64_t fieldsChanged) {
    if (value.checkBindToChanged(fieldsChanged)) {
      localBindTo_ = value.getBindTo();
    }
    if (value.checkDeviceChanged(fieldsChanged)) {
      localDevice_ = value.getDevice();
    }
    if (value.checkDeviceNameChanged(fieldsChanged)) {
      localDeviceName_ = value.getDeviceName();
    }
    if (value.checkHostnameChanged(fieldsChanged)) {
      localHostname_ = value.getHostname();
    }
    if (value.checkPortChanged(fieldsChanged)) {
      localPort_ = value.getPort();
    }
    if (value.checkFrameRateChanged(fieldsChanged)) {
      localFrameRate_ = value.getFrameRate();
    }
    if (value.checkNumChannelsChanged(fieldsChanged)) {
      localNumChannels_ = value.getNumChannels();
    }
    handleXrpaFieldsChanged(fieldsChanged);
  }

  static std::shared_ptr<ReconciledAudioInputSource> create(const Xrpa::ObjectUuid& id, AudioInputSourceReader obj, Xrpa::IObjectCollection* collection) {
    return std::make_shared<ReconciledAudioInputSource>(id, collection);
  }

  DeviceBindingType getBindTo() const {
    return localBindTo_;
  }

  const Xrpa::ObjectUuid& getDevice() const {
    return localDevice_;
  }

  const std::string& getDeviceName() const {
    return localDeviceName_;
  }

  const std::string& getHostname() const {
    return localHostname_;
  }

  int getPort() const {
    return localPort_;
  }

  int getFrameRate() const {
    return localFrameRate_;
  }

  int getNumChannels() const {
    return localNumChannels_;
  }

  inline bool checkBindToChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkDeviceChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkDeviceNameChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkHostnameChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  inline bool checkPortChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 16;
  }

  inline bool checkFrameRateChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 32;
  }

  inline bool checkNumChannelsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 64;
  }

  inline bool checkIsActiveChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 128;
  }

  inline bool checkErrorMessageChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 256;
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
    localAudioSignal_.setRecipient(id, collection_, 7);
    localAudioSignal_.tick();
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
  }

  void writeDSChanges(Xrpa::TransportStreamAccessor* accessor) {
    if (changeBits_ == 0) {
      return;
    }
    auto objAccessor = AudioInputSourceWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    if (objAccessor.isNull()) {
      return;
    }
    if (changeBits_ & 128) {
      objAccessor.setIsActive(localIsActive_);
    }
    if (changeBits_ & 256) {
      objAccessor.setErrorMessage(localErrorMessage_);
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    changeBits_ = 384;
    changeByteCount_ = Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localErrorMessage_) + 8;
    return 1;
  }

 protected:
  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) {
    if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(fieldsChanged); }
  }

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;
  std::function<void()> xrpaDeleteHandler_ = nullptr;

  // Whether audio input is currently active
  bool localIsActive_ = false;

  // Error message if audio input failed
  std::string localErrorMessage_ = "";

  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;
  DeviceBindingType localBindTo_ = DeviceBindingType::Device;
  Xrpa::ObjectUuid localDevice_{0ULL, 0ULL};
  std::string localDeviceName_ = "";
  std::string localHostname_ = "";
  int localPort_ = 0;

  // Frame rate for audio capture
  int localFrameRate_ = 48000;

  // Number of channels for audio capture
  int localNumChannels_ = 2;

  Xrpa::OutboundSignalData localAudioSignal_{};
};

// Object Collections
class InboundAudioInputSourceReaderCollection : public Xrpa::ObjectCollection<AudioInputSourceReader, std::shared_ptr<ReconciledAudioInputSource>> {
 public:
  explicit InboundAudioInputSourceReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<AudioInputSourceReader, std::shared_ptr<ReconciledAudioInputSource>>(reconciler, 1, 127, 0, false) {
    setCreateDelegateInternal(ReconciledAudioInputSource::create);
  }

  void setCreateDelegate(Xrpa::ObjectCollection<AudioInputSourceReader, std::shared_ptr<ReconciledAudioInputSource>>::CreateDelegateFunction createDelegate) {
    setCreateDelegateInternal(std::move(createDelegate));
  }
};

class OutboundAudioInputDeviceReaderCollection : public Xrpa::ObjectCollection<AudioInputDeviceReader, std::shared_ptr<OutboundAudioInputDevice>> {
 public:
  explicit OutboundAudioInputDeviceReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<AudioInputDeviceReader, std::shared_ptr<OutboundAudioInputDevice>>(reconciler, 0, 0, 0, true) {}

  void addObject(std::shared_ptr<OutboundAudioInputDevice> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundAudioInputDevice> createObject() {
    auto obj = std::make_shared<OutboundAudioInputDevice>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
    addObjectInternal(obj);
    return obj;
  }

  void removeObject(const Xrpa::ObjectUuid& id) {
    removeObjectInternal(id);
  }
};

// Data Store Implementation
class AudioInputDataStore : public Xrpa::DataStoreReconciler {
 public:
  AudioInputDataStore(std::weak_ptr<Xrpa::TransportStream> inboundTransport, std::weak_ptr<Xrpa::TransportStream> outboundTransport)
      : Xrpa::DataStoreReconciler(inboundTransport, outboundTransport, 1237120) {
    AudioInputSource = std::make_shared<InboundAudioInputSourceReaderCollection>(this);
    registerCollection(AudioInputSource);
    AudioInputDevice = std::make_shared<OutboundAudioInputDeviceReaderCollection>(this);
    registerCollection(AudioInputDevice);
  }

  std::shared_ptr<InboundAudioInputSourceReaderCollection> AudioInputSource;
  std::shared_ptr<OutboundAudioInputDeviceReaderCollection> AudioInputDevice;
};

template <typename SampleType>
inline void ReconciledAudioInputSource::setAudioSignalCallback(Xrpa::SignalProducerCallback<SampleType> signalCallback, int32_t numChannels, int32_t framesPerSecond, int32_t framesPerPacket) {
  localAudioSignal_.setSignalSource(signalCallback, numChannels, framesPerSecond, framesPerPacket);
}

template <typename SampleType>
inline void ReconciledAudioInputSource::setAudioSignalRingBuffer(Xrpa::SignalRingBuffer<SampleType>* signalRingBuffer, int32_t numChannels, int32_t framesPerSecond, int32_t framesPerPacket) {
  localAudioSignal_.setSignalSource(signalRingBuffer, numChannels, framesPerSecond, framesPerPacket);
}

template <typename SampleType>
inline void ReconciledAudioInputSource::setAudioSignalForwarder(std::shared_ptr<Xrpa::InboundSignalForwarder> signalForwarder) {
  localAudioSignal_.setRecipient(getXrpaId(), collection_, 7);
  signalForwarder->addRecipient(localAudioSignal_);
}

template <typename SampleType>
inline Xrpa::SignalPacket ReconciledAudioInputSource::sendAudioSignal(int32_t frameCount, int32_t numChannels, int32_t framesPerSecond) {
  int32_t sampleType = Xrpa::SignalTypeInference::inferSampleType<SampleType>();
  localAudioSignal_.setRecipient(getXrpaId(), collection_, 7);
  return localAudioSignal_.sendSignalPacket(Xrpa::MemoryUtils::getTypeSize<SampleType>(), frameCount, sampleType, numChannels, framesPerSecond);
}

} // namespace AudioInputDataStore
