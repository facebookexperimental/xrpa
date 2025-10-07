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

#include "AriaTypes.h"
#include <Eigen/Eigen>
#include <ImageTypes.h>
#include <chrono>
#include <functional>
#include <lib/ImageSelectorTypes.h>
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

namespace AriaDataStore {

class AriaDataStore;
class OutboundAriaGlasses;

class RgbCameraReader : public Xrpa::ObjectAccessorInterface {
 public:
  RgbCameraReader() {}

  explicit RgbCameraReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  ImageTypes::Image getImage() {
    return DSRgbImage::readValue(memAccessor_, readOffset_);
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class RgbCameraWriter : public RgbCameraReader {
 public:
  RgbCameraWriter() {}

  explicit RgbCameraWriter(const Xrpa::MemoryAccessor& memAccessor) : RgbCameraReader(memAccessor) {}

  void setImage(const ImageTypes::Image& value) {
    DSRgbImage::writeValue(value, memAccessor_, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class SlamCamera1Reader : public Xrpa::ObjectAccessorInterface {
 public:
  SlamCamera1Reader() {}

  explicit SlamCamera1Reader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  ImageTypes::Image getImage() {
    return DSSlamImage::readValue(memAccessor_, readOffset_);
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class SlamCamera1Writer : public SlamCamera1Reader {
 public:
  SlamCamera1Writer() {}

  explicit SlamCamera1Writer(const Xrpa::MemoryAccessor& memAccessor) : SlamCamera1Reader(memAccessor) {}

  void setImage(const ImageTypes::Image& value) {
    DSSlamImage::writeValue(value, memAccessor_, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class SlamCamera2Reader : public Xrpa::ObjectAccessorInterface {
 public:
  SlamCamera2Reader() {}

  explicit SlamCamera2Reader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  ImageTypes::Image getImage() {
    return DSSlamImage::readValue(memAccessor_, readOffset_);
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class SlamCamera2Writer : public SlamCamera2Reader {
 public:
  SlamCamera2Writer() {}

  explicit SlamCamera2Writer(const Xrpa::MemoryAccessor& memAccessor) : SlamCamera2Reader(memAccessor) {}

  void setImage(const ImageTypes::Image& value) {
    DSSlamImage::writeValue(value, memAccessor_, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class PoseDynamicsPoseDynamicsReader : public Xrpa::ObjectAccessorInterface {
 public:
  PoseDynamicsPoseDynamicsReader() {}

  explicit PoseDynamicsPoseDynamicsReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  ImageSelectorDataStore::DataPoseDynamics getData() {
    return DSDataPoseDynamics::readValue(memAccessor_, readOffset_);
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class PoseDynamicsPoseDynamicsWriter : public PoseDynamicsPoseDynamicsReader {
 public:
  PoseDynamicsPoseDynamicsWriter() {}

  explicit PoseDynamicsPoseDynamicsWriter(const Xrpa::MemoryAccessor& memAccessor) : PoseDynamicsPoseDynamicsReader(memAccessor) {}

  void setData(const ImageSelectorDataStore::DataPoseDynamics& value) {
    DSDataPoseDynamics::writeValue(value, memAccessor_, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class AriaGlassesReader : public Xrpa::ObjectAccessorInterface {
 public:
  AriaGlassesReader() {}

  explicit AriaGlassesReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  std::string getIpAddress() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  bool getIsFlashlight() {
    return (memAccessor_.readValue<int32_t>(readOffset_) == 1 ? true : false);
  }

  bool getUsbStreaming() {
    return (memAccessor_.readValue<int32_t>(readOffset_) == 1 ? true : false);
  }

  bool getTrackPose() {
    return (memAccessor_.readValue<int32_t>(readOffset_) == 1 ? true : false);
  }

  bool getSendAudioOutput() {
    return (memAccessor_.readValue<int32_t>(readOffset_) == 1 ? true : false);
  }

  bool getSendRgbOutput() {
    return (memAccessor_.readValue<int32_t>(readOffset_) == 1 ? true : false);
  }

  bool getSendSlamOutputs() {
    return (memAccessor_.readValue<int32_t>(readOffset_) == 1 ? true : false);
  }

  std::string getCalibrationJson() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  bool getIsStreaming() {
    return (memAccessor_.readValue<int32_t>(readOffset_) == 1 ? true : false);
  }

  std::chrono::microseconds getLastUpdate() {
    return Xrpa::reinterpretValue<std::chrono::microseconds, uint64_t>(memAccessor_.readValue<uint64_t>(readOffset_));
  }

  Pose getPose() {
    return DSPose::readValue(memAccessor_, readOffset_);
  }

  int getCoordinateFrameId() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  inline bool checkIpAddressChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkIsFlashlightChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkUsbStreamingChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkTrackPoseChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  inline bool checkSendAudioOutputChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 16;
  }

  inline bool checkSendRgbOutputChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 32;
  }

  inline bool checkSendSlamOutputsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 64;
  }

  inline bool checkCalibrationJsonChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 128;
  }

  inline bool checkIsStreamingChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 256;
  }

  inline bool checkLastUpdateChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 512;
  }

  inline bool checkPoseChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1024;
  }

  inline bool checkCoordinateFrameIdChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2048;
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class AriaGlassesWriter : public AriaGlassesReader {
 public:
  AriaGlassesWriter() {}

  explicit AriaGlassesWriter(const Xrpa::MemoryAccessor& memAccessor) : AriaGlassesReader(memAccessor) {}

  static AriaGlassesWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return AriaGlassesWriter(changeEvent.accessChangeData());
  }

  static AriaGlassesWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return AriaGlassesWriter(changeEvent.accessChangeData());
  }

  void setIpAddress(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

  void setIsFlashlight(bool value) {
    memAccessor_.writeValue<int32_t>((value ? 1 : 0), writeOffset_);
  }

  void setUsbStreaming(bool value) {
    memAccessor_.writeValue<int32_t>((value ? 1 : 0), writeOffset_);
  }

  void setTrackPose(bool value) {
    memAccessor_.writeValue<int32_t>((value ? 1 : 0), writeOffset_);
  }

  void setSendAudioOutput(bool value) {
    memAccessor_.writeValue<int32_t>((value ? 1 : 0), writeOffset_);
  }

  void setSendRgbOutput(bool value) {
    memAccessor_.writeValue<int32_t>((value ? 1 : 0), writeOffset_);
  }

  void setSendSlamOutputs(bool value) {
    memAccessor_.writeValue<int32_t>((value ? 1 : 0), writeOffset_);
  }

  void setCalibrationJson(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

  void setIsStreaming(bool value) {
    memAccessor_.writeValue<int32_t>((value ? 1 : 0), writeOffset_);
  }

  void setLastUpdate(std::chrono::microseconds value) {
    memAccessor_.writeValue<uint64_t>(Xrpa::reinterpretValue<uint64_t, std::chrono::microseconds>(value), writeOffset_);
  }

  void setPose(const Pose& value) {
    DSPose::writeValue(value, memAccessor_, writeOffset_);
  }

  void setCoordinateFrameId(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

// Reconciled Types
class OutboundAriaGlasses : public Xrpa::DataStoreObject {
 public:
  explicit OutboundAriaGlasses(const Xrpa::ObjectUuid& id) : Xrpa::DataStoreObject(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  const std::string& getIpAddress() const {
    return localIpAddress_;
  }

  void setIpAddress(const std::string& ipAddress) {
    localIpAddress_ = ipAddress;
    if ((changeBits_ & 1) == 0) {
      changeBits_ |= 1;
      changeByteCount_ += 4;
    }
    changeByteCount_ += Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localIpAddress_);
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 1);
    }
  }

  bool getIsFlashlight() const {
    return localIsFlashlight_;
  }

  void setIsFlashlight(bool isFlashlight) {
    localIsFlashlight_ = isFlashlight;
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

  bool getUsbStreaming() const {
    return localUsbStreaming_;
  }

  void setUsbStreaming(bool usbStreaming) {
    localUsbStreaming_ = usbStreaming;
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

  bool getTrackPose() const {
    return localTrackPose_;
  }

  void setTrackPose(bool trackPose) {
    localTrackPose_ = trackPose;
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

  bool getSendAudioOutput() const {
    return localSendAudioOutput_;
  }

  void setSendAudioOutput(bool sendAudioOutput) {
    localSendAudioOutput_ = sendAudioOutput;
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

  bool getSendRgbOutput() const {
    return localSendRgbOutput_;
  }

  void setSendRgbOutput(bool sendRgbOutput) {
    localSendRgbOutput_ = sendRgbOutput;
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

  bool getSendSlamOutputs() const {
    return localSendSlamOutputs_;
  }

  void setSendSlamOutputs(bool sendSlamOutputs) {
    localSendSlamOutputs_ = sendSlamOutputs;
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
    AriaGlassesWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 127;
      changeByteCount_ = Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localIpAddress_) + 28;
      objAccessor = AriaGlassesWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = AriaGlassesWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    }
    if (objAccessor.isNull()) {
      return;
    }
    if (changeBits_ & 1) {
      objAccessor.setIpAddress(localIpAddress_);
    }
    if (changeBits_ & 2) {
      objAccessor.setIsFlashlight(localIsFlashlight_);
    }
    if (changeBits_ & 4) {
      objAccessor.setUsbStreaming(localUsbStreaming_);
    }
    if (changeBits_ & 8) {
      objAccessor.setTrackPose(localTrackPose_);
    }
    if (changeBits_ & 16) {
      objAccessor.setSendAudioOutput(localSendAudioOutput_);
    }
    if (changeBits_ & 32) {
      objAccessor.setSendRgbOutput(localSendRgbOutput_);
    }
    if (changeBits_ & 64) {
      objAccessor.setSendSlamOutputs(localSendSlamOutputs_);
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    createWritten_ = false;
    changeBits_ = 127;
    changeByteCount_ = Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localIpAddress_) + 28;
    return createTimestamp_;
  }

  void processDSUpdate(AriaGlassesReader value, uint64_t fieldsChanged) {
    if (value.checkCalibrationJsonChanged(fieldsChanged)) {
      localCalibrationJson_ = value.getCalibrationJson();
    }
    if (value.checkIsStreamingChanged(fieldsChanged)) {
      localIsStreaming_ = value.getIsStreaming();
    }
    if (value.checkLastUpdateChanged(fieldsChanged)) {
      localLastUpdate_ = value.getLastUpdate();
    }
    if (value.checkPoseChanged(fieldsChanged)) {
      localPose_ = value.getPose();
    }
    if (value.checkCoordinateFrameIdChanged(fieldsChanged)) {
      localCoordinateFrameId_ = value.getCoordinateFrameId();
    }
    handleXrpaFieldsChanged(fieldsChanged);
  }

  const std::string& getCalibrationJson() const {
    return localCalibrationJson_;
  }

  bool getIsStreaming() const {
    return localIsStreaming_;
  }

  std::chrono::microseconds getLastUpdate() const {
    return localLastUpdate_;
  }

  const Pose& getPose() const {
    return localPose_;
  }

  int getCoordinateFrameId() const {
    return localCoordinateFrameId_;
  }

  inline bool checkIpAddressChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkIsFlashlightChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkUsbStreamingChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkTrackPoseChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  inline bool checkSendAudioOutputChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 16;
  }

  inline bool checkSendRgbOutputChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 32;
  }

  inline bool checkSendSlamOutputsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 64;
  }

  inline bool checkCalibrationJsonChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 128;
  }

  inline bool checkIsStreamingChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 256;
  }

  inline bool checkLastUpdateChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 512;
  }

  inline bool checkPoseChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1024;
  }

  inline bool checkCoordinateFrameIdChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2048;
  }

  void onRgbCamera(std::function<void(uint64_t, RgbCameraReader)> handler) {
    rgbCameraMessageHandler_ = handler;
  }

  void onSlamCamera1(std::function<void(uint64_t, SlamCamera1Reader)> handler) {
    slamCamera1MessageHandler_ = handler;
  }

  void onSlamCamera2(std::function<void(uint64_t, SlamCamera2Reader)> handler) {
    slamCamera2MessageHandler_ = handler;
  }

  void onPoseDynamics(std::function<void(uint64_t, PoseDynamicsPoseDynamicsReader)> handler) {
    poseDynamicsMessageHandler_ = handler;
  }

  void onAudio(std::shared_ptr<Xrpa::InboundSignalDataInterface> handler) {
    audioSignalHandler_ = handler;
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
    if (messageType == 11) {
      if (rgbCameraMessageHandler_) {
        auto message = RgbCameraReader(messageData);
        rgbCameraMessageHandler_(msgTimestamp, message);
      }
    }
    if (messageType == 12) {
      if (slamCamera1MessageHandler_) {
        auto message = SlamCamera1Reader(messageData);
        slamCamera1MessageHandler_(msgTimestamp, message);
      }
    }
    if (messageType == 13) {
      if (slamCamera2MessageHandler_) {
        auto message = SlamCamera2Reader(messageData);
        slamCamera2MessageHandler_(msgTimestamp, message);
      }
    }
    if (messageType == 14) {
      if (poseDynamicsMessageHandler_) {
        auto message = PoseDynamicsPoseDynamicsReader(messageData);
        poseDynamicsMessageHandler_(msgTimestamp, message);
      }
    }
    if (messageType == 10) {
      if (audioSignalHandler_) {
        audioSignalHandler_->onSignalData(msgTimestamp, messageData);
      }
    }
  }

 protected:
  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) {
    if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(fieldsChanged); }
  }

  std::string localIpAddress_ = "";
  bool localIsFlashlight_ = false;
  bool localUsbStreaming_ = false;
  bool localTrackPose_ = true;
  bool localSendAudioOutput_ = true;
  bool localSendRgbOutput_ = true;
  bool localSendSlamOutputs_ = true;
  uint64_t createTimestamp_;
  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;
  bool createWritten_ = false;

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;
  std::string localCalibrationJson_ = "";
  bool localIsStreaming_ = false;
  std::chrono::microseconds localLastUpdate_{0};
  Pose localPose_{Eigen::Vector3f{0.f, 0.f, 0.f}, Eigen::Quaternionf{1.f, 0.f, 0.f, 0.f}};
  int localCoordinateFrameId_ = 0;
  std::function<void(uint64_t, RgbCameraReader)> rgbCameraMessageHandler_ = nullptr;
  std::function<void(uint64_t, SlamCamera1Reader)> slamCamera1MessageHandler_ = nullptr;
  std::function<void(uint64_t, SlamCamera2Reader)> slamCamera2MessageHandler_ = nullptr;
  std::function<void(uint64_t, PoseDynamicsPoseDynamicsReader)> poseDynamicsMessageHandler_ = nullptr;
  std::shared_ptr<Xrpa::InboundSignalDataInterface> audioSignalHandler_ = nullptr;
};

// Object Collections
class OutboundAriaGlassesReaderCollection : public Xrpa::ObjectCollection<AriaGlassesReader, std::shared_ptr<OutboundAriaGlasses>> {
 public:
  explicit OutboundAriaGlassesReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<AriaGlassesReader, std::shared_ptr<OutboundAriaGlasses>>(reconciler, 0, 3968, 0, true) {}

  void addObject(std::shared_ptr<OutboundAriaGlasses> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundAriaGlasses> createObject() {
    auto obj = std::make_shared<OutboundAriaGlasses>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
    addObjectInternal(obj);
    return obj;
  }

  void removeObject(const Xrpa::ObjectUuid& id) {
    removeObjectInternal(id);
  }
};

// Data Store Implementation
class AriaDataStore : public Xrpa::DataStoreReconciler {
 public:
  AriaDataStore(std::weak_ptr<Xrpa::TransportStream> inboundTransport, std::weak_ptr<Xrpa::TransportStream> outboundTransport)
      : Xrpa::DataStoreReconciler(inboundTransport, outboundTransport, 15901776) {
    AriaGlasses = std::make_shared<OutboundAriaGlassesReaderCollection>(this);
    registerCollection(AriaGlasses);
  }

  std::shared_ptr<OutboundAriaGlassesReaderCollection> AriaGlasses;
};

} // namespace AriaDataStore
