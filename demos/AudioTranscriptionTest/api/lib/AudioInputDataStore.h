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
#include <xrpa-runtime/signals/InboundSignalData.h>
#include <xrpa-runtime/transport/TransportStream.h>
#include <xrpa-runtime/transport/TransportStreamAccessor.h>
#include <xrpa-runtime/utils/MemoryAccessor.h>
#include <xrpa-runtime/utils/XrpaTypes.h>

namespace AudioInputDataStore {

class AudioInputDataStore;
class ReconciledAudioInputDevice;
class OutboundAudioInputSource;

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
class OutboundAudioInputSource : public Xrpa::DataStoreObject {
 public:
  explicit OutboundAudioInputSource(const Xrpa::ObjectUuid& id) : Xrpa::DataStoreObject(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  DeviceBindingType getBindTo() const {
    return localBindTo_;
  }

  void setBindTo(DeviceBindingType bindTo) {
    localBindTo_ = bindTo;
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

  const Xrpa::ObjectUuid& getDevice() const {
    return localDevice_;
  }

  void setDevice(const Xrpa::ObjectUuid& device) {
    localDevice_ = device;
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

  const std::string& getDeviceName() const {
    return localDeviceName_;
  }

  void setDeviceName(const std::string& deviceName) {
    localDeviceName_ = deviceName;
    if ((changeBits_ & 4) == 0) {
      changeBits_ |= 4;
      changeByteCount_ += 4;
    }
    changeByteCount_ += Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localDeviceName_);
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 4);
    }
  }

  const std::string& getHostname() const {
    return localHostname_;
  }

  void setHostname(const std::string& hostname) {
    localHostname_ = hostname;
    if ((changeBits_ & 8) == 0) {
      changeBits_ |= 8;
      changeByteCount_ += 4;
    }
    changeByteCount_ += Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localHostname_);
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 8);
    }
  }

  int getPort() const {
    return localPort_;
  }

  void setPort(int port) {
    localPort_ = port;
    if ((changeBits_ & 16) == 0) {
      changeBits_ |= 16;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 16);
    }
  }

  int getFrameRate() const {
    return localFrameRate_;
  }

  void setFrameRate(int frameRate) {
    localFrameRate_ = frameRate;
    if ((changeBits_ & 32) == 0) {
      changeBits_ |= 32;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 32);
    }
  }

  int getNumChannels() const {
    return localNumChannels_;
  }

  void setNumChannels(int numChannels) {
    localNumChannels_ = numChannels;
    if ((changeBits_ & 64) == 0) {
      changeBits_ |= 64;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 64);
    }
  }

  void writeDSChanges(Xrpa::TransportStreamAccessor* accessor) {
    AudioInputSourceWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 127;
      changeByteCount_ = Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localDeviceName_) + Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localHostname_) + 40;
      objAccessor = AudioInputSourceWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = AudioInputSourceWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    }
    if (objAccessor.isNull()) {
      return;
    }
    if (changeBits_ & 1) {
      objAccessor.setBindTo(localBindTo_);
    }
    if (changeBits_ & 2) {
      objAccessor.setDevice(localDevice_);
    }
    if (changeBits_ & 4) {
      objAccessor.setDeviceName(localDeviceName_);
    }
    if (changeBits_ & 8) {
      objAccessor.setHostname(localHostname_);
    }
    if (changeBits_ & 16) {
      objAccessor.setPort(localPort_);
    }
    if (changeBits_ & 32) {
      objAccessor.setFrameRate(localFrameRate_);
    }
    if (changeBits_ & 64) {
      objAccessor.setNumChannels(localNumChannels_);
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    createWritten_ = false;
    changeBits_ = 127;
    changeByteCount_ = Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localDeviceName_) + Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localHostname_) + 40;
    return createTimestamp_;
  }

  void processDSUpdate(AudioInputSourceReader value, uint64_t fieldsChanged) {
    if (value.checkIsActiveChanged(fieldsChanged)) {
      localIsActive_ = value.getIsActive();
    }
    if (value.checkErrorMessageChanged(fieldsChanged)) {
      localErrorMessage_ = value.getErrorMessage();
    }
    handleXrpaFieldsChanged(fieldsChanged);
  }

  bool getIsActive() const {
    return localIsActive_;
  }

  const std::string& getErrorMessage() const {
    return localErrorMessage_;
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

  void onAudioSignal(std::shared_ptr<Xrpa::InboundSignalDataInterface> handler) {
    audioSignalSignalHandler_ = handler;
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
    if (messageType == 7) {
      if (audioSignalSignalHandler_) {
        audioSignalSignalHandler_->onSignalData(msgTimestamp, messageData);
      }
    }
  }

 protected:
  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) {
    if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(fieldsChanged); }
  }

  DeviceBindingType localBindTo_ = DeviceBindingType::Device;
  Xrpa::ObjectUuid localDevice_{0ULL, 0ULL};
  std::string localDeviceName_ = "";
  std::string localHostname_ = "";
  int localPort_ = 0;

  // Frame rate for audio capture
  int localFrameRate_ = 48000;

  // Number of channels for audio capture
  int localNumChannels_ = 2;

  uint64_t createTimestamp_;
  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;
  bool createWritten_ = false;

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;

  // Whether audio input is currently active
  bool localIsActive_ = false;

  // Error message if audio input failed
  std::string localErrorMessage_ = "";

  std::shared_ptr<Xrpa::InboundSignalDataInterface> audioSignalSignalHandler_ = nullptr;
};

class ReconciledAudioInputDevice : public Xrpa::DataStoreObject {
 public:
  ReconciledAudioInputDevice(const Xrpa::ObjectUuid& id, Xrpa::IObjectCollection* collection) : Xrpa::DataStoreObject(id, collection) {}

  virtual ~ReconciledAudioInputDevice() = default;

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  virtual void handleXrpaDelete() {
    if (xrpaDeleteHandler_) { xrpaDeleteHandler_(); }
  }

  void onXrpaDelete(std::function<void()> handler) {
    xrpaDeleteHandler_ = handler;
  }

  void processDSUpdate(AudioInputDeviceReader value, uint64_t fieldsChanged) {
    if (value.checkDeviceNameChanged(fieldsChanged)) {
      localDeviceName_ = value.getDeviceName();
    }
    if (value.checkNumChannelsChanged(fieldsChanged)) {
      localNumChannels_ = value.getNumChannels();
    }
    if (value.checkFrameRateChanged(fieldsChanged)) {
      localFrameRate_ = value.getFrameRate();
    }
    if (value.checkIsSystemAudioInputChanged(fieldsChanged)) {
      localIsSystemAudioInput_ = value.getIsSystemAudioInput();
    }
    handleXrpaFieldsChanged(fieldsChanged);
  }

  static std::shared_ptr<ReconciledAudioInputDevice> create(const Xrpa::ObjectUuid& id, AudioInputDeviceReader obj, Xrpa::IObjectCollection* collection) {
    return std::make_shared<ReconciledAudioInputDevice>(id, collection);
  }

  const std::string& getDeviceName() const {
    return localDeviceName_;
  }

  int getNumChannels() const {
    return localNumChannels_;
  }

  int getFrameRate() const {
    return localFrameRate_;
  }

  bool getIsSystemAudioInput() const {
    return localIsSystemAudioInput_;
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

  // Human-readable device name
  std::string localDeviceName_ = "";

  // Number of channels available
  int localNumChannels_ = 2;

  // Default frame rate for audio capture
  int localFrameRate_ = 48000;

  // Whether this is the default input device
  bool localIsSystemAudioInput_ = false;
};

// Object Collections
class InboundAudioInputDeviceReaderCollection : public Xrpa::ObjectCollection<AudioInputDeviceReader, std::shared_ptr<ReconciledAudioInputDevice>> {
 public:
  explicit InboundAudioInputDeviceReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<AudioInputDeviceReader, std::shared_ptr<ReconciledAudioInputDevice>>(reconciler, 0, 15, 0, false) {
    setCreateDelegateInternal(ReconciledAudioInputDevice::create);
  }

  void setCreateDelegate(Xrpa::ObjectCollection<AudioInputDeviceReader, std::shared_ptr<ReconciledAudioInputDevice>>::CreateDelegateFunction createDelegate) {
    setCreateDelegateInternal(std::move(createDelegate));
  }
};

class OutboundAudioInputSourceReaderCollection : public Xrpa::ObjectCollection<AudioInputSourceReader, std::shared_ptr<OutboundAudioInputSource>> {
 public:
  explicit OutboundAudioInputSourceReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<AudioInputSourceReader, std::shared_ptr<OutboundAudioInputSource>>(reconciler, 1, 384, 0, true) {}

  void addObject(std::shared_ptr<OutboundAudioInputSource> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundAudioInputSource> createObject() {
    auto obj = std::make_shared<OutboundAudioInputSource>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
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
    AudioInputDevice = std::make_shared<InboundAudioInputDeviceReaderCollection>(this);
    registerCollection(AudioInputDevice);
    AudioInputSource = std::make_shared<OutboundAudioInputSourceReaderCollection>(this);
    registerCollection(AudioInputSource);
  }

  std::shared_ptr<InboundAudioInputDeviceReaderCollection> AudioInputDevice;
  std::shared_ptr<OutboundAudioInputSourceReaderCollection> AudioInputSource;
};

} // namespace AudioInputDataStore
