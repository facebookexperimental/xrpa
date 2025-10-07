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

#include "SmartControllerTypes.h"
#include <functional>
#include <memory>
#include <string>
#include <vector>
#include <xrpa-runtime/reconciler/DataStoreInterfaces.h>
#include <xrpa-runtime/reconciler/DataStoreReconciler.h>
#include <xrpa-runtime/reconciler/ObjectCollection.h>
#include <xrpa-runtime/transport/TransportStream.h>
#include <xrpa-runtime/transport/TransportStreamAccessor.h>
#include <xrpa-runtime/utils/MemoryAccessor.h>
#include <xrpa-runtime/utils/XrpaTypes.h>

namespace SmartControllerDataStore {

class SmartControllerDataStore;
class ReconciledKnobControl;
class ReconciledLightControl;

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

class PositionEventReader : public Xrpa::ObjectAccessorInterface {
 public:
  PositionEventReader() {}

  explicit PositionEventReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  int getPosition() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  int getAbsolutePosition() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  int getDetentPosition() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class PositionEventWriter : public PositionEventReader {
 public:
  PositionEventWriter() {}

  explicit PositionEventWriter(const Xrpa::MemoryAccessor& memAccessor) : PositionEventReader(memAccessor) {}

  void setPosition(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setAbsolutePosition(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setDetentPosition(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class KnobControlReader : public Xrpa::ObjectAccessorInterface {
 public:
  KnobControlReader() {}

  explicit KnobControlReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  // IP address of the device to control
  std::string getIpAddress() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  // Whether the device is connected
  bool getIsConnected() {
    return (memAccessor_.readValue<int32_t>(readOffset_) == 1 ? true : false);
  }

  KnobControlMode getControlMode() {
    return static_cast<KnobControlMode>(memAccessor_.readValue<uint32_t>(readOffset_));
  }

  // Position to set the knob to, when controlMode == Position
  int getPosition() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  // Number of detents to set the knob to, when controlMode == Detent
  int getDetentCount() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  inline bool checkIpAddressChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkIsConnectedChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkControlModeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkPositionChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  inline bool checkDetentCountChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 16;
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class KnobControlWriter : public KnobControlReader {
 public:
  KnobControlWriter() {}

  explicit KnobControlWriter(const Xrpa::MemoryAccessor& memAccessor) : KnobControlReader(memAccessor) {}

  static KnobControlWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return KnobControlWriter(changeEvent.accessChangeData());
  }

  static KnobControlWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return KnobControlWriter(changeEvent.accessChangeData());
  }

  void setIpAddress(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

  void setIsConnected(bool value) {
    memAccessor_.writeValue<int32_t>((value ? 1 : 0), writeOffset_);
  }

  void setControlMode(KnobControlMode value) {
    memAccessor_.writeValue<uint32_t>(static_cast<uint32_t>(value), writeOffset_);
  }

  void setPosition(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setDetentCount(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class LightControlReader : public Xrpa::ObjectAccessorInterface {
 public:
  LightControlReader() {}

  explicit LightControlReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  // IP address of the device to control
  std::string getIpAddress() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  // Whether the device is connected
  bool getIsConnected() {
    return (memAccessor_.readValue<int32_t>(readOffset_) == 1 ? true : false);
  }

  std::vector<ColorSRGBA> getLightColors() {
    return DSColorSRGBA_24::readValue(memAccessor_, readOffset_);
  }

  float getRotationOffset() {
    return DSAngle::readValue(memAccessor_, readOffset_);
  }

  float getRotationSpeed() {
    return DSAngle::readValue(memAccessor_, readOffset_);
  }

  // Priority of the light, lower values will be applied first, with higher values alpha-blended on top
  int getPriority() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  inline bool checkIpAddressChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkIsConnectedChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkLightColorsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkRotationOffsetChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  inline bool checkRotationSpeedChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 16;
  }

  inline bool checkPriorityChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 32;
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class LightControlWriter : public LightControlReader {
 public:
  LightControlWriter() {}

  explicit LightControlWriter(const Xrpa::MemoryAccessor& memAccessor) : LightControlReader(memAccessor) {}

  static LightControlWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return LightControlWriter(changeEvent.accessChangeData());
  }

  static LightControlWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return LightControlWriter(changeEvent.accessChangeData());
  }

  void setIpAddress(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

  void setIsConnected(bool value) {
    memAccessor_.writeValue<int32_t>((value ? 1 : 0), writeOffset_);
  }

  void setLightColors(const std::vector<ColorSRGBA>& value) {
    DSColorSRGBA_24::writeValue(value, memAccessor_, writeOffset_);
  }

  void setRotationOffset(float value) {
    DSAngle::writeValue(value, memAccessor_, writeOffset_);
  }

  void setRotationSpeed(float value) {
    DSAngle::writeValue(value, memAccessor_, writeOffset_);
  }

  void setPriority(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

// Reconciled Types
class ReconciledKnobControl : public Xrpa::DataStoreObject {
 public:
  ReconciledKnobControl(const Xrpa::ObjectUuid& id, Xrpa::IObjectCollection* collection) : Xrpa::DataStoreObject(id, collection) {}

  virtual ~ReconciledKnobControl() = default;

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  virtual void handleXrpaDelete() {
    if (xrpaDeleteHandler_) { xrpaDeleteHandler_(); }
  }

  void onXrpaDelete(std::function<void()> handler) {
    xrpaDeleteHandler_ = handler;
  }

  bool getIsConnected() const {
    return localIsConnected_;
  }

  void setIsConnected(bool isConnected) {
    localIsConnected_ = isConnected;
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

  void processDSUpdate(KnobControlReader value, uint64_t fieldsChanged) {
    if (value.checkIpAddressChanged(fieldsChanged)) {
      localIpAddress_ = value.getIpAddress();
    }
    if (value.checkControlModeChanged(fieldsChanged)) {
      localControlMode_ = value.getControlMode();
    }
    if (value.checkPositionChanged(fieldsChanged)) {
      localPosition_ = value.getPosition();
    }
    if (value.checkDetentCountChanged(fieldsChanged)) {
      localDetentCount_ = value.getDetentCount();
    }
    handleXrpaFieldsChanged(fieldsChanged);
  }

  static std::shared_ptr<ReconciledKnobControl> create(const Xrpa::ObjectUuid& id, KnobControlReader obj, Xrpa::IObjectCollection* collection) {
    return std::make_shared<ReconciledKnobControl>(id, collection);
  }

  const std::string& getIpAddress() const {
    return localIpAddress_;
  }

  KnobControlMode getControlMode() const {
    return localControlMode_;
  }

  int getPosition() const {
    return localPosition_;
  }

  int getDetentCount() const {
    return localDetentCount_;
  }

  inline bool checkIpAddressChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkIsConnectedChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkControlModeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkPositionChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  inline bool checkDetentCountChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 16;
  }

  void sendInputEvent(InputEventType type, int source) {
    auto message = InputEventWriter(collection_->sendMessage(
        getXrpaId(),
        5,
        8));
    message.setType(type);
    message.setSource(source);
  }

  void sendPositionEvent(int position, int absolutePosition, int detentPosition) {
    auto message = PositionEventWriter(collection_->sendMessage(
        getXrpaId(),
        6,
        12));
    message.setPosition(position);
    message.setAbsolutePosition(absolutePosition);
    message.setDetentPosition(detentPosition);
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
  }

  void writeDSChanges(Xrpa::TransportStreamAccessor* accessor) {
    if (changeBits_ == 0) {
      return;
    }
    auto objAccessor = KnobControlWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    if (objAccessor.isNull()) {
      return;
    }
    if (changeBits_ & 2) {
      objAccessor.setIsConnected(localIsConnected_);
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    changeBits_ = 2;
    changeByteCount_ = 4;
    return 1;
  }

 protected:
  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) {
    if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(fieldsChanged); }
  }

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;
  std::function<void()> xrpaDeleteHandler_ = nullptr;

  // Whether the device is connected
  bool localIsConnected_ = false;

  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;

  // IP address of the device to control
  std::string localIpAddress_ = "";

  KnobControlMode localControlMode_ = KnobControlMode::Disabled;

  // Position to set the knob to, when controlMode == Position
  int localPosition_ = 0;

  // Number of detents to set the knob to, when controlMode == Detent
  int localDetentCount_ = 10;
};

class ReconciledLightControl : public Xrpa::DataStoreObject {
 public:
  ReconciledLightControl(const Xrpa::ObjectUuid& id, Xrpa::IObjectCollection* collection) : Xrpa::DataStoreObject(id, collection) {}

  virtual ~ReconciledLightControl() = default;

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  virtual void handleXrpaDelete() {
    if (xrpaDeleteHandler_) { xrpaDeleteHandler_(); }
  }

  void onXrpaDelete(std::function<void()> handler) {
    xrpaDeleteHandler_ = handler;
  }

  bool getIsConnected() const {
    return localIsConnected_;
  }

  void setIsConnected(bool isConnected) {
    localIsConnected_ = isConnected;
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

  void processDSUpdate(LightControlReader value, uint64_t fieldsChanged) {
    if (value.checkIpAddressChanged(fieldsChanged)) {
      localIpAddress_ = value.getIpAddress();
    }
    if (value.checkLightColorsChanged(fieldsChanged)) {
      localLightColors_ = value.getLightColors();
    }
    if (value.checkRotationOffsetChanged(fieldsChanged)) {
      localRotationOffset_ = value.getRotationOffset();
    }
    if (value.checkRotationSpeedChanged(fieldsChanged)) {
      localRotationSpeed_ = value.getRotationSpeed();
    }
    if (value.checkPriorityChanged(fieldsChanged)) {
      localPriority_ = value.getPriority();
    }
    handleXrpaFieldsChanged(fieldsChanged);
  }

  static std::shared_ptr<ReconciledLightControl> create(const Xrpa::ObjectUuid& id, LightControlReader obj, Xrpa::IObjectCollection* collection) {
    return std::make_shared<ReconciledLightControl>(id, collection);
  }

  const std::string& getIpAddress() const {
    return localIpAddress_;
  }

  const std::vector<ColorSRGBA>& getLightColors() const {
    return localLightColors_;
  }

  float getRotationOffset() const {
    return localRotationOffset_;
  }

  float getRotationSpeed() const {
    return localRotationSpeed_;
  }

  int getPriority() const {
    return localPriority_;
  }

  inline bool checkIpAddressChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkIsConnectedChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkLightColorsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkRotationOffsetChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  inline bool checkRotationSpeedChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 16;
  }

  inline bool checkPriorityChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 32;
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
  }

  void writeDSChanges(Xrpa::TransportStreamAccessor* accessor) {
    if (changeBits_ == 0) {
      return;
    }
    auto objAccessor = LightControlWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    if (objAccessor.isNull()) {
      return;
    }
    if (changeBits_ & 2) {
      objAccessor.setIsConnected(localIsConnected_);
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    changeBits_ = 2;
    changeByteCount_ = 4;
    return 1;
  }

 protected:
  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) {
    if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(fieldsChanged); }
  }

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;
  std::function<void()> xrpaDeleteHandler_ = nullptr;

  // Whether the device is connected
  bool localIsConnected_ = false;

  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;

  // IP address of the device to control
  std::string localIpAddress_ = "";

  std::vector<ColorSRGBA> localLightColors_{ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}};
  float localRotationOffset_ = 0.f;
  float localRotationSpeed_ = 0.f;

  // Priority of the light, lower values will be applied first, with higher values alpha-blended on top
  int localPriority_ = 0;
};

// Object Collections
class InboundKnobControlReaderCollection : public Xrpa::ObjectCollection<KnobControlReader, std::shared_ptr<ReconciledKnobControl>> {
 public:
  explicit InboundKnobControlReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<KnobControlReader, std::shared_ptr<ReconciledKnobControl>>(reconciler, 0, 29, 0, false) {
    setCreateDelegateInternal(ReconciledKnobControl::create);
  }

  void setCreateDelegate(Xrpa::ObjectCollection<KnobControlReader, std::shared_ptr<ReconciledKnobControl>>::CreateDelegateFunction createDelegate) {
    setCreateDelegateInternal(std::move(createDelegate));
  }
};

class InboundLightControlReaderCollection : public Xrpa::ObjectCollection<LightControlReader, std::shared_ptr<ReconciledLightControl>> {
 public:
  explicit InboundLightControlReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<LightControlReader, std::shared_ptr<ReconciledLightControl>>(reconciler, 1, 61, 0, false) {
    setCreateDelegateInternal(ReconciledLightControl::create);
  }

  void setCreateDelegate(Xrpa::ObjectCollection<LightControlReader, std::shared_ptr<ReconciledLightControl>>::CreateDelegateFunction createDelegate) {
    setCreateDelegateInternal(std::move(createDelegate));
  }
};

// Data Store Implementation
class SmartControllerDataStore : public Xrpa::DataStoreReconciler {
 public:
  SmartControllerDataStore(std::weak_ptr<Xrpa::TransportStream> inboundTransport, std::weak_ptr<Xrpa::TransportStream> outboundTransport)
      : Xrpa::DataStoreReconciler(inboundTransport, outboundTransport, 1104) {
    KnobControl = std::make_shared<InboundKnobControlReaderCollection>(this);
    registerCollection(KnobControl);
    LightControl = std::make_shared<InboundLightControlReaderCollection>(this);
    registerCollection(LightControl);
  }

  std::shared_ptr<InboundKnobControlReaderCollection> KnobControl;
  std::shared_ptr<InboundLightControlReaderCollection> LightControl;
};

} // namespace SmartControllerDataStore
