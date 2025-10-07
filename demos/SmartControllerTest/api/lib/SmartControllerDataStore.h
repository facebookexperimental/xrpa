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
#include <xrpa-runtime/external_utils/UuidGen.h>
#include <xrpa-runtime/reconciler/DataStoreInterfaces.h>
#include <xrpa-runtime/reconciler/DataStoreReconciler.h>
#include <xrpa-runtime/reconciler/ObjectCollection.h>
#include <xrpa-runtime/transport/TransportStream.h>
#include <xrpa-runtime/transport/TransportStreamAccessor.h>
#include <xrpa-runtime/utils/MemoryAccessor.h>
#include <xrpa-runtime/utils/XrpaTypes.h>

namespace SmartControllerDataStore {

class SmartControllerDataStore;
class OutboundKnobControl;
class OutboundLightControl;

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
class OutboundKnobControl : public Xrpa::DataStoreObject {
 public:
  explicit OutboundKnobControl(const Xrpa::ObjectUuid& id) : Xrpa::DataStoreObject(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

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

  KnobControlMode getControlMode() const {
    return localControlMode_;
  }

  void setControlMode(KnobControlMode controlMode) {
    localControlMode_ = controlMode;
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

  int getPosition() const {
    return localPosition_;
  }

  void setPosition(int position) {
    localPosition_ = position;
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

  int getDetentCount() const {
    return localDetentCount_;
  }

  void setDetentCount(int detentCount) {
    localDetentCount_ = detentCount;
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
    KnobControlWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 29;
      changeByteCount_ = Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localIpAddress_) + 16;
      objAccessor = KnobControlWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = KnobControlWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    }
    if (objAccessor.isNull()) {
      return;
    }
    if (changeBits_ & 1) {
      objAccessor.setIpAddress(localIpAddress_);
    }
    if (changeBits_ & 4) {
      objAccessor.setControlMode(localControlMode_);
    }
    if (changeBits_ & 8) {
      objAccessor.setPosition(localPosition_);
    }
    if (changeBits_ & 16) {
      objAccessor.setDetentCount(localDetentCount_);
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    createWritten_ = false;
    changeBits_ = 29;
    changeByteCount_ = Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localIpAddress_) + 16;
    return createTimestamp_;
  }

  void processDSUpdate(KnobControlReader value, uint64_t fieldsChanged) {
    if (value.checkIsConnectedChanged(fieldsChanged)) {
      localIsConnected_ = value.getIsConnected();
    }
    handleXrpaFieldsChanged(fieldsChanged);
  }

  bool getIsConnected() const {
    return localIsConnected_;
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

  void onInputEvent(std::function<void(uint64_t, InputEventReader)> handler) {
    inputEventMessageHandler_ = handler;
  }

  void onPositionEvent(std::function<void(uint64_t, PositionEventReader)> handler) {
    positionEventMessageHandler_ = handler;
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
    if (messageType == 5) {
      if (inputEventMessageHandler_) {
        auto message = InputEventReader(messageData);
        inputEventMessageHandler_(msgTimestamp, message);
      }
    }
    if (messageType == 6) {
      if (positionEventMessageHandler_) {
        auto message = PositionEventReader(messageData);
        positionEventMessageHandler_(msgTimestamp, message);
      }
    }
  }

 protected:
  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) {
    if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(fieldsChanged); }
  }

  // IP address of the device to control
  std::string localIpAddress_ = "";

  KnobControlMode localControlMode_ = KnobControlMode::Disabled;

  // Position to set the knob to, when controlMode == Position
  int localPosition_ = 0;

  // Number of detents to set the knob to, when controlMode == Detent
  int localDetentCount_ = 10;

  uint64_t createTimestamp_;
  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;
  bool createWritten_ = false;

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;

  // Whether the device is connected
  bool localIsConnected_ = false;

  std::function<void(uint64_t, InputEventReader)> inputEventMessageHandler_ = nullptr;
  std::function<void(uint64_t, PositionEventReader)> positionEventMessageHandler_ = nullptr;
};

class OutboundLightControl : public Xrpa::DataStoreObject {
 public:
  explicit OutboundLightControl(const Xrpa::ObjectUuid& id) : Xrpa::DataStoreObject(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

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

  const std::vector<ColorSRGBA>& getLightColors() const {
    return localLightColors_;
  }

  void setLightColors(const std::vector<ColorSRGBA>& lightColors) {
    localLightColors_ = lightColors;
    if ((changeBits_ & 4) == 0) {
      changeBits_ |= 4;
      changeByteCount_ += 384;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 4);
    }
  }

  float getRotationOffset() const {
    return localRotationOffset_;
  }

  void setRotationOffset(float rotationOffset) {
    localRotationOffset_ = rotationOffset;
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

  float getRotationSpeed() const {
    return localRotationSpeed_;
  }

  void setRotationSpeed(float rotationSpeed) {
    localRotationSpeed_ = rotationSpeed;
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

  int getPriority() const {
    return localPriority_;
  }

  void setPriority(int priority) {
    localPriority_ = priority;
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

  void writeDSChanges(Xrpa::TransportStreamAccessor* accessor) {
    LightControlWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 61;
      changeByteCount_ = Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localIpAddress_) + 400;
      objAccessor = LightControlWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = LightControlWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    }
    if (objAccessor.isNull()) {
      return;
    }
    if (changeBits_ & 1) {
      objAccessor.setIpAddress(localIpAddress_);
    }
    if (changeBits_ & 4) {
      objAccessor.setLightColors(localLightColors_);
    }
    if (changeBits_ & 8) {
      objAccessor.setRotationOffset(localRotationOffset_);
    }
    if (changeBits_ & 16) {
      objAccessor.setRotationSpeed(localRotationSpeed_);
    }
    if (changeBits_ & 32) {
      objAccessor.setPriority(localPriority_);
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    createWritten_ = false;
    changeBits_ = 61;
    changeByteCount_ = Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localIpAddress_) + 400;
    return createTimestamp_;
  }

  void processDSUpdate(LightControlReader value, uint64_t fieldsChanged) {
    if (value.checkIsConnectedChanged(fieldsChanged)) {
      localIsConnected_ = value.getIsConnected();
    }
    handleXrpaFieldsChanged(fieldsChanged);
  }

  bool getIsConnected() const {
    return localIsConnected_;
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

 protected:
  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) {
    if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(fieldsChanged); }
  }

  // IP address of the device to control
  std::string localIpAddress_ = "";

  std::vector<ColorSRGBA> localLightColors_{ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}, ColorSRGBA{255, 255, 255, 255}};
  float localRotationOffset_ = 0.f;
  float localRotationSpeed_ = 0.f;

  // Priority of the light, lower values will be applied first, with higher values alpha-blended on top
  int localPriority_ = 0;

  uint64_t createTimestamp_;
  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;
  bool createWritten_ = false;

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;

  // Whether the device is connected
  bool localIsConnected_ = false;
};

// Object Collections
class OutboundKnobControlReaderCollection : public Xrpa::ObjectCollection<KnobControlReader, std::shared_ptr<OutboundKnobControl>> {
 public:
  explicit OutboundKnobControlReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<KnobControlReader, std::shared_ptr<OutboundKnobControl>>(reconciler, 0, 2, 0, true) {}

  void addObject(std::shared_ptr<OutboundKnobControl> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundKnobControl> createObject() {
    auto obj = std::make_shared<OutboundKnobControl>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
    addObjectInternal(obj);
    return obj;
  }

  void removeObject(const Xrpa::ObjectUuid& id) {
    removeObjectInternal(id);
  }
};

class OutboundLightControlReaderCollection : public Xrpa::ObjectCollection<LightControlReader, std::shared_ptr<OutboundLightControl>> {
 public:
  explicit OutboundLightControlReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<LightControlReader, std::shared_ptr<OutboundLightControl>>(reconciler, 1, 2, 0, true) {}

  void addObject(std::shared_ptr<OutboundLightControl> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundLightControl> createObject() {
    auto obj = std::make_shared<OutboundLightControl>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
    addObjectInternal(obj);
    return obj;
  }

  void removeObject(const Xrpa::ObjectUuid& id) {
    removeObjectInternal(id);
  }
};

// Data Store Implementation
class SmartControllerDataStore : public Xrpa::DataStoreReconciler {
 public:
  SmartControllerDataStore(std::weak_ptr<Xrpa::TransportStream> inboundTransport, std::weak_ptr<Xrpa::TransportStream> outboundTransport)
      : Xrpa::DataStoreReconciler(inboundTransport, outboundTransport, 1104) {
    KnobControl = std::make_shared<OutboundKnobControlReaderCollection>(this);
    registerCollection(KnobControl);
    LightControl = std::make_shared<OutboundLightControlReaderCollection>(this);
    registerCollection(LightControl);
  }

  std::shared_ptr<OutboundKnobControlReaderCollection> KnobControl;
  std::shared_ptr<OutboundLightControlReaderCollection> LightControl;
};

} // namespace SmartControllerDataStore
