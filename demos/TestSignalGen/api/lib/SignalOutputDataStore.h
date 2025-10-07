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

#include "SignalOutputTypes.h"
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

namespace SignalOutputDataStore {

class SignalOutputDataStore;
class ReconciledSignalOutputDevice;
class OutboundSignalOutputSource;

class InputEventReader : public Xrpa::ObjectAccessorInterface {
 public:
  InputEventReader() {}

  explicit InputEventReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  InputEventType getType() {
    return static_cast<InputEventType>(memAccessor_.readValue<uint32_t>(readOffset_));
  }

  int getSource() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class InputEventWriter : public InputEventReader {
 public:
  InputEventWriter() {}

  explicit InputEventWriter(const Xrpa::MemoryAccessor& memAccessor) : InputEventReader(memAccessor) {}

  void setType(InputEventType value) {
    memAccessor_.writeValue<uint32_t>(static_cast<uint32_t>(value), writeOffset_);
  }

  void setSource(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class SignalOutputDeviceReader : public Xrpa::ObjectAccessorInterface {
 public:
  SignalOutputDeviceReader() {}

  explicit SignalOutputDeviceReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  std::string getName() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  SignalOutputDeviceType getDeviceType() {
    return static_cast<SignalOutputDeviceType>(memAccessor_.readValue<uint32_t>(readOffset_));
  }

  int getNumChannels() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  int getFrameRate() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  bool getIsSystemAudioOutput() {
    return (memAccessor_.readValue<int32_t>(readOffset_) == 1 ? true : false);
  }

  inline bool checkNameChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkDeviceTypeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkNumChannelsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkFrameRateChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  inline bool checkIsSystemAudioOutputChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 16;
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class SignalOutputDeviceWriter : public SignalOutputDeviceReader {
 public:
  SignalOutputDeviceWriter() {}

  explicit SignalOutputDeviceWriter(const Xrpa::MemoryAccessor& memAccessor) : SignalOutputDeviceReader(memAccessor) {}

  static SignalOutputDeviceWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return SignalOutputDeviceWriter(changeEvent.accessChangeData());
  }

  static SignalOutputDeviceWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return SignalOutputDeviceWriter(changeEvent.accessChangeData());
  }

  void setName(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

  void setDeviceType(SignalOutputDeviceType value) {
    memAccessor_.writeValue<uint32_t>(static_cast<uint32_t>(value), writeOffset_);
  }

  void setNumChannels(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setFrameRate(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setIsSystemAudioOutput(bool value) {
    memAccessor_.writeValue<int32_t>((value ? 1 : 0), writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class SignalOutputSourceReader : public Xrpa::ObjectAccessorInterface {
 public:
  SignalOutputSourceReader() {}

  explicit SignalOutputSourceReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

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

  bool getIsConnected() {
    return (memAccessor_.readValue<int32_t>(readOffset_) == 1 ? true : false);
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

  inline bool checkIsConnectedChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 32;
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class SignalOutputSourceWriter : public SignalOutputSourceReader {
 public:
  SignalOutputSourceWriter() {}

  explicit SignalOutputSourceWriter(const Xrpa::MemoryAccessor& memAccessor) : SignalOutputSourceReader(memAccessor) {}

  static SignalOutputSourceWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return SignalOutputSourceWriter(changeEvent.accessChangeData());
  }

  static SignalOutputSourceWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return SignalOutputSourceWriter(changeEvent.accessChangeData());
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

  void setIsConnected(bool value) {
    memAccessor_.writeValue<int32_t>((value ? 1 : 0), writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

// Reconciled Types
class OutboundSignalOutputSource : public Xrpa::DataStoreObject {
 public:
  explicit OutboundSignalOutputSource(const Xrpa::ObjectUuid& id) : Xrpa::DataStoreObject(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

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

  void writeDSChanges(Xrpa::TransportStreamAccessor* accessor) {
    SignalOutputSourceWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 31;
      changeByteCount_ = Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localDeviceName_) + Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localHostname_) + 32;
      objAccessor = SignalOutputSourceWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = SignalOutputSourceWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
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
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    createWritten_ = false;
    changeBits_ = 31;
    changeByteCount_ = Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localDeviceName_) + Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localHostname_) + 32;
    return createTimestamp_;
  }

  void processDSUpdate(SignalOutputSourceReader value, uint64_t fieldsChanged) {
    if (value.checkIsConnectedChanged(fieldsChanged)) {
      localIsConnected_ = value.getIsConnected();
    }
    handleXrpaFieldsChanged(fieldsChanged);
  }

  bool getIsConnected() const {
    return localIsConnected_;
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

  inline bool checkIsConnectedChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 32;
  }

  template <typename SampleType>
  void setSignalCallback(Xrpa::SignalProducerCallback<SampleType> signalCallback, int32_t numChannels, int32_t framesPerSecond, int32_t framesPerPacket);

  template <typename SampleType>
  void setSignalRingBuffer(Xrpa::SignalRingBuffer<SampleType>* signalRingBuffer, int32_t numChannels, int32_t framesPerSecond, int32_t framesPerPacket);

  template <typename SampleType>
  void setSignalForwarder(std::shared_ptr<Xrpa::InboundSignalForwarder> signalForwarder);

  template <typename SampleType>
  Xrpa::SignalPacket sendSignal(int32_t frameCount, int32_t numChannels, int32_t framesPerSecond);

  void tickXrpa() {
    auto id = getXrpaId();
    localSignal_.setRecipient(id, collection_, 5);
    localSignal_.tick();
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
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
  uint64_t createTimestamp_;
  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;
  bool createWritten_ = false;

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;
  bool localIsConnected_ = false;
  Xrpa::OutboundSignalData localSignal_{};
};

class ReconciledSignalOutputDevice : public Xrpa::DataStoreObject {
 public:
  ReconciledSignalOutputDevice(const Xrpa::ObjectUuid& id, Xrpa::IObjectCollection* collection) : Xrpa::DataStoreObject(id, collection) {}

  virtual ~ReconciledSignalOutputDevice() = default;

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  virtual void handleXrpaDelete() {
    if (xrpaDeleteHandler_) { xrpaDeleteHandler_(); }
  }

  void onXrpaDelete(std::function<void()> handler) {
    xrpaDeleteHandler_ = handler;
  }

  void processDSUpdate(SignalOutputDeviceReader value, uint64_t fieldsChanged) {
    if (value.checkNameChanged(fieldsChanged)) {
      localName_ = value.getName();
    }
    if (value.checkDeviceTypeChanged(fieldsChanged)) {
      localDeviceType_ = value.getDeviceType();
    }
    if (value.checkNumChannelsChanged(fieldsChanged)) {
      localNumChannels_ = value.getNumChannels();
    }
    if (value.checkFrameRateChanged(fieldsChanged)) {
      localFrameRate_ = value.getFrameRate();
    }
    if (value.checkIsSystemAudioOutputChanged(fieldsChanged)) {
      localIsSystemAudioOutput_ = value.getIsSystemAudioOutput();
    }
    handleXrpaFieldsChanged(fieldsChanged);
  }

  static std::shared_ptr<ReconciledSignalOutputDevice> create(const Xrpa::ObjectUuid& id, SignalOutputDeviceReader obj, Xrpa::IObjectCollection* collection) {
    return std::make_shared<ReconciledSignalOutputDevice>(id, collection);
  }

  const std::string& getName() const {
    return localName_;
  }

  SignalOutputDeviceType getDeviceType() const {
    return localDeviceType_;
  }

  int getNumChannels() const {
    return localNumChannels_;
  }

  int getFrameRate() const {
    return localFrameRate_;
  }

  bool getIsSystemAudioOutput() const {
    return localIsSystemAudioOutput_;
  }

  inline bool checkNameChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkDeviceTypeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkNumChannelsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkFrameRateChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  inline bool checkIsSystemAudioOutputChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 16;
  }

  void onInputEvent(std::function<void(uint64_t, InputEventReader)> handler) {
    inputEventMessageHandler_ = handler;
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
    if (messageType == 5) {
      if (inputEventMessageHandler_) {
        auto message = InputEventReader(messageData);
        inputEventMessageHandler_(msgTimestamp, message);
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
  std::string localName_ = "";
  SignalOutputDeviceType localDeviceType_ = SignalOutputDeviceType::Audio;
  int localNumChannels_ = 0;
  int localFrameRate_ = 0;
  bool localIsSystemAudioOutput_ = false;
  std::function<void(uint64_t, InputEventReader)> inputEventMessageHandler_ = nullptr;
};

// Object Collections
class InboundSignalOutputDeviceReaderCollection : public Xrpa::ObjectCollection<SignalOutputDeviceReader, std::shared_ptr<ReconciledSignalOutputDevice>> {
 public:
  explicit InboundSignalOutputDeviceReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<SignalOutputDeviceReader, std::shared_ptr<ReconciledSignalOutputDevice>>(reconciler, 0, 31, 0, false) {
    setCreateDelegateInternal(ReconciledSignalOutputDevice::create);
  }

  void setCreateDelegate(Xrpa::ObjectCollection<SignalOutputDeviceReader, std::shared_ptr<ReconciledSignalOutputDevice>>::CreateDelegateFunction createDelegate) {
    setCreateDelegateInternal(std::move(createDelegate));
  }
};

class OutboundSignalOutputSourceReaderCollection : public Xrpa::ObjectCollection<SignalOutputSourceReader, std::shared_ptr<OutboundSignalOutputSource>> {
 public:
  explicit OutboundSignalOutputSourceReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<SignalOutputSourceReader, std::shared_ptr<OutboundSignalOutputSource>>(reconciler, 1, 32, 0, true) {}

  void addObject(std::shared_ptr<OutboundSignalOutputSource> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundSignalOutputSource> createObject() {
    auto obj = std::make_shared<OutboundSignalOutputSource>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
    addObjectInternal(obj);
    return obj;
  }

  void removeObject(const Xrpa::ObjectUuid& id) {
    removeObjectInternal(id);
  }
};

// Data Store Implementation
class SignalOutputDataStore : public Xrpa::DataStoreReconciler {
 public:
  SignalOutputDataStore(std::weak_ptr<Xrpa::TransportStream> inboundTransport, std::weak_ptr<Xrpa::TransportStream> outboundTransport)
      : Xrpa::DataStoreReconciler(inboundTransport, outboundTransport, 9905408) {
    SignalOutputDevice = std::make_shared<InboundSignalOutputDeviceReaderCollection>(this);
    registerCollection(SignalOutputDevice);
    SignalOutputSource = std::make_shared<OutboundSignalOutputSourceReaderCollection>(this);
    registerCollection(SignalOutputSource);
  }

  std::shared_ptr<InboundSignalOutputDeviceReaderCollection> SignalOutputDevice;
  std::shared_ptr<OutboundSignalOutputSourceReaderCollection> SignalOutputSource;
};

template <typename SampleType>
inline void OutboundSignalOutputSource::setSignalCallback(Xrpa::SignalProducerCallback<SampleType> signalCallback, int32_t numChannels, int32_t framesPerSecond, int32_t framesPerPacket) {
  localSignal_.setSignalSource(signalCallback, numChannels, framesPerSecond, framesPerPacket);
}

template <typename SampleType>
inline void OutboundSignalOutputSource::setSignalRingBuffer(Xrpa::SignalRingBuffer<SampleType>* signalRingBuffer, int32_t numChannels, int32_t framesPerSecond, int32_t framesPerPacket) {
  localSignal_.setSignalSource(signalRingBuffer, numChannels, framesPerSecond, framesPerPacket);
}

template <typename SampleType>
inline void OutboundSignalOutputSource::setSignalForwarder(std::shared_ptr<Xrpa::InboundSignalForwarder> signalForwarder) {
  localSignal_.setRecipient(getXrpaId(), collection_, 5);
  signalForwarder->addRecipient(localSignal_);
}

template <typename SampleType>
inline Xrpa::SignalPacket OutboundSignalOutputSource::sendSignal(int32_t frameCount, int32_t numChannels, int32_t framesPerSecond) {
  int32_t sampleType = Xrpa::SignalTypeInference::inferSampleType<SampleType>();
  localSignal_.setRecipient(getXrpaId(), collection_, 5);
  return localSignal_.sendSignalPacket(Xrpa::MemoryUtils::getTypeSize<SampleType>(), frameCount, sampleType, numChannels, framesPerSecond);
}

} // namespace SignalOutputDataStore
