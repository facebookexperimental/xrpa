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

#include "EyeTrackingTypes.h"
#include <Eigen/Eigen>
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
#include <xrpa-runtime/utils/ImageTypes.h>
#include <xrpa-runtime/utils/MemoryAccessor.h>
#include <xrpa-runtime/utils/XrpaTypes.h>

namespace EyeTrackingDataStore {

class EyeTrackingDataStore;
class OutboundEyeTrackingDevice;

class SceneCameraReader : public Xrpa::ObjectAccessorInterface {
 public:
  SceneCameraReader() {}

  explicit SceneCameraReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  Xrpa::Image getImage() {
    return DSSceneImage::readValue(memAccessor_, readOffset_);
  }

  // Gaze position in scene camera pixels corresponding to this frame
  Eigen::Vector2f getGazePosition() {
    return DSVector2::readValue(memAccessor_, readOffset_);
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class SceneCameraWriter : public SceneCameraReader {
 public:
  SceneCameraWriter() {}

  explicit SceneCameraWriter(const Xrpa::MemoryAccessor& memAccessor) : SceneCameraReader(memAccessor) {}

  void setImage(const Xrpa::Image& value) {
    DSSceneImage::writeValue(value, memAccessor_, writeOffset_);
  }

  void setGazePosition(Eigen::Vector2f value) {
    DSVector2::writeValue(value, memAccessor_, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class ImuDataReader : public Xrpa::ObjectAccessorInterface {
 public:
  ImuDataReader() {}

  explicit ImuDataReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  // Timestamp of the IMU sample
  std::chrono::nanoseconds getTimestamp() {
    return Xrpa::reinterpretValue<std::chrono::nanoseconds, uint64_t>(memAccessor_.readValue<uint64_t>(readOffset_));
  }

  // Gyroscope data in deg/s (X-right, Y-forward, Z-up)
  Eigen::Vector3f getGyro() {
    return DSVector3::readValue(memAccessor_, readOffset_);
  }

  // Accelerometer data in m/s² (X-right, Y-forward, Z-up)
  Eigen::Vector3f getAccel() {
    return DSVector3::readValue(memAccessor_, readOffset_);
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class ImuDataWriter : public ImuDataReader {
 public:
  ImuDataWriter() {}

  explicit ImuDataWriter(const Xrpa::MemoryAccessor& memAccessor) : ImuDataReader(memAccessor) {}

  void setTimestamp(std::chrono::nanoseconds value) {
    memAccessor_.writeValue<uint64_t>(Xrpa::reinterpretValue<uint64_t, std::chrono::nanoseconds>(value), writeOffset_);
  }

  void setGyro(const Eigen::Vector3f& value) {
    DSVector3::writeValue(value, memAccessor_, writeOffset_);
  }

  void setAccel(const Eigen::Vector3f& value) {
    DSVector3::writeValue(value, memAccessor_, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class EyeEventReader : public Xrpa::ObjectAccessorInterface {
 public:
  EyeEventReader() {}

  explicit EyeEventReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  EyeEventType getEventType() {
    return static_cast<EyeEventType>(memAccessor_.readValue<uint32_t>(readOffset_));
  }

  // Event start timestamp
  std::chrono::nanoseconds getStartTime() {
    return Xrpa::reinterpretValue<std::chrono::nanoseconds, uint64_t>(memAccessor_.readValue<uint64_t>(readOffset_));
  }

  // Event end timestamp
  std::chrono::nanoseconds getEndTime() {
    return Xrpa::reinterpretValue<std::chrono::nanoseconds, uint64_t>(memAccessor_.readValue<uint64_t>(readOffset_));
  }

  // Mean gaze position in scene camera pixels
  Eigen::Vector2f getMeanGaze() {
    return DSVector2::readValue(memAccessor_, readOffset_);
  }

  // Event amplitude in degrees
  float getAmplitude() {
    return DSAngle::readValue(memAccessor_, readOffset_);
  }

  // Maximum velocity in pixels/degree
  float getMaxVelocity() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class EyeEventWriter : public EyeEventReader {
 public:
  EyeEventWriter() {}

  explicit EyeEventWriter(const Xrpa::MemoryAccessor& memAccessor) : EyeEventReader(memAccessor) {}

  void setEventType(EyeEventType value) {
    memAccessor_.writeValue<uint32_t>(static_cast<uint32_t>(value), writeOffset_);
  }

  void setStartTime(std::chrono::nanoseconds value) {
    memAccessor_.writeValue<uint64_t>(Xrpa::reinterpretValue<uint64_t, std::chrono::nanoseconds>(value), writeOffset_);
  }

  void setEndTime(std::chrono::nanoseconds value) {
    memAccessor_.writeValue<uint64_t>(Xrpa::reinterpretValue<uint64_t, std::chrono::nanoseconds>(value), writeOffset_);
  }

  void setMeanGaze(Eigen::Vector2f value) {
    DSVector2::writeValue(value, memAccessor_, writeOffset_);
  }

  void setAmplitude(float value) {
    DSAngle::writeValue(value, memAccessor_, writeOffset_);
  }

  void setMaxVelocity(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class EyeTrackingDeviceReader : public Xrpa::ObjectAccessorInterface {
 public:
  EyeTrackingDeviceReader() {}

  explicit EyeTrackingDeviceReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  // Network address or device name for discovery
  std::string getDeviceAddress() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  // Enable gaze data streaming
  bool getStreamGaze() {
    return (memAccessor_.readValue<int32_t>(readOffset_) == 1 ? true : false);
  }

  // Enable scene camera streaming
  bool getStreamSceneCamera() {
    return (memAccessor_.readValue<int32_t>(readOffset_) == 1 ? true : false);
  }

  // Enable IMU data streaming
  bool getStreamImu() {
    return (memAccessor_.readValue<int32_t>(readOffset_) == 1 ? true : false);
  }

  // Enable eye events (blinks, fixations, saccades)
  bool getStreamEyeEvents() {
    return (memAccessor_.readValue<int32_t>(readOffset_) == 1 ? true : false);
  }

  // Enable audio streaming
  bool getStreamAudio() {
    return (memAccessor_.readValue<int32_t>(readOffset_) == 1 ? true : false);
  }

  // Human-readable device name
  std::string getDeviceName() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  // Hardware version info
  std::string getHardwareVersion() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  // Device serial number
  std::string getSerialNumber() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  // Connection status
  bool getIsConnected() {
    return (memAccessor_.readValue<int32_t>(readOffset_) == 1 ? true : false);
  }

  // Camera calibration data (JSON format)
  std::string getCalibrationJson() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  // Last data update timestamp
  std::chrono::microseconds getLastUpdate() {
    return Xrpa::reinterpretValue<std::chrono::microseconds, uint64_t>(memAccessor_.readValue<uint64_t>(readOffset_));
  }

  // Head orientation (always updated)
  Eigen::Quaternionf getHeadOrientation() {
    return DSQuaternion::readValue(memAccessor_, readOffset_);
  }

  // Gaze direction in world space
  Eigen::Vector3f getGazeDirection() {
    return DSUnitVector3::readValue(memAccessor_, readOffset_);
  }

  // Whether glasses are worn
  bool getWorn() {
    return (memAccessor_.readValue<int32_t>(readOffset_) == 1 ? true : false);
  }

  // Left pupil diameter
  float getPupilDiameterLeft() {
    return DSDistance::readValue(memAccessor_, readOffset_);
  }

  // Right pupil diameter
  float getPupilDiameterRight() {
    return DSDistance::readValue(memAccessor_, readOffset_);
  }

  // Current scene camera frame rate
  int getSceneCameraFrameRate() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  inline bool checkDeviceAddressChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkStreamGazeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkStreamSceneCameraChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkStreamImuChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  inline bool checkStreamEyeEventsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 16;
  }

  inline bool checkStreamAudioChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 32;
  }

  inline bool checkDeviceNameChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 64;
  }

  inline bool checkHardwareVersionChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 128;
  }

  inline bool checkSerialNumberChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 256;
  }

  inline bool checkIsConnectedChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 512;
  }

  inline bool checkCalibrationJsonChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1024;
  }

  inline bool checkLastUpdateChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2048;
  }

  inline bool checkHeadOrientationChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4096;
  }

  inline bool checkGazeDirectionChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8192;
  }

  inline bool checkWornChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 16384;
  }

  inline bool checkPupilDiameterLeftChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 32768;
  }

  inline bool checkPupilDiameterRightChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 65536;
  }

  inline bool checkSceneCameraFrameRateChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 131072;
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class EyeTrackingDeviceWriter : public EyeTrackingDeviceReader {
 public:
  EyeTrackingDeviceWriter() {}

  explicit EyeTrackingDeviceWriter(const Xrpa::MemoryAccessor& memAccessor) : EyeTrackingDeviceReader(memAccessor) {}

  static EyeTrackingDeviceWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return EyeTrackingDeviceWriter(changeEvent.accessChangeData());
  }

  static EyeTrackingDeviceWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return EyeTrackingDeviceWriter(changeEvent.accessChangeData());
  }

  void setDeviceAddress(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

  void setStreamGaze(bool value) {
    memAccessor_.writeValue<int32_t>((value ? 1 : 0), writeOffset_);
  }

  void setStreamSceneCamera(bool value) {
    memAccessor_.writeValue<int32_t>((value ? 1 : 0), writeOffset_);
  }

  void setStreamImu(bool value) {
    memAccessor_.writeValue<int32_t>((value ? 1 : 0), writeOffset_);
  }

  void setStreamEyeEvents(bool value) {
    memAccessor_.writeValue<int32_t>((value ? 1 : 0), writeOffset_);
  }

  void setStreamAudio(bool value) {
    memAccessor_.writeValue<int32_t>((value ? 1 : 0), writeOffset_);
  }

  void setDeviceName(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

  void setHardwareVersion(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

  void setSerialNumber(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

  void setIsConnected(bool value) {
    memAccessor_.writeValue<int32_t>((value ? 1 : 0), writeOffset_);
  }

  void setCalibrationJson(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

  void setLastUpdate(std::chrono::microseconds value) {
    memAccessor_.writeValue<uint64_t>(Xrpa::reinterpretValue<uint64_t, std::chrono::microseconds>(value), writeOffset_);
  }

  void setHeadOrientation(const Eigen::Quaternionf& value) {
    DSQuaternion::writeValue(value, memAccessor_, writeOffset_);
  }

  void setGazeDirection(const Eigen::Vector3f& value) {
    DSUnitVector3::writeValue(value, memAccessor_, writeOffset_);
  }

  void setWorn(bool value) {
    memAccessor_.writeValue<int32_t>((value ? 1 : 0), writeOffset_);
  }

  void setPupilDiameterLeft(float value) {
    DSDistance::writeValue(value, memAccessor_, writeOffset_);
  }

  void setPupilDiameterRight(float value) {
    DSDistance::writeValue(value, memAccessor_, writeOffset_);
  }

  void setSceneCameraFrameRate(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

// Reconciled Types
class OutboundEyeTrackingDevice : public Xrpa::DataStoreObject {
 public:
  explicit OutboundEyeTrackingDevice(const Xrpa::ObjectUuid& id) : Xrpa::DataStoreObject(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  const std::string& getDeviceAddress() const {
    return localDeviceAddress_;
  }

  void setDeviceAddress(const std::string& deviceAddress) {
    localDeviceAddress_ = deviceAddress;
    if ((changeBits_ & 1) == 0) {
      changeBits_ |= 1;
      changeByteCount_ += 4;
    }
    changeByteCount_ += Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localDeviceAddress_);
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 1);
    }
  }

  bool getStreamGaze() const {
    return localStreamGaze_;
  }

  void setStreamGaze(bool streamGaze) {
    localStreamGaze_ = streamGaze;
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

  bool getStreamSceneCamera() const {
    return localStreamSceneCamera_;
  }

  void setStreamSceneCamera(bool streamSceneCamera) {
    localStreamSceneCamera_ = streamSceneCamera;
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

  bool getStreamImu() const {
    return localStreamImu_;
  }

  void setStreamImu(bool streamImu) {
    localStreamImu_ = streamImu;
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

  bool getStreamEyeEvents() const {
    return localStreamEyeEvents_;
  }

  void setStreamEyeEvents(bool streamEyeEvents) {
    localStreamEyeEvents_ = streamEyeEvents;
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

  bool getStreamAudio() const {
    return localStreamAudio_;
  }

  void setStreamAudio(bool streamAudio) {
    localStreamAudio_ = streamAudio;
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
    EyeTrackingDeviceWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 63;
      changeByteCount_ = Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localDeviceAddress_) + 24;
      objAccessor = EyeTrackingDeviceWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = EyeTrackingDeviceWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    }
    if (objAccessor.isNull()) {
      return;
    }
    if (changeBits_ & 1) {
      objAccessor.setDeviceAddress(localDeviceAddress_);
    }
    if (changeBits_ & 2) {
      objAccessor.setStreamGaze(localStreamGaze_);
    }
    if (changeBits_ & 4) {
      objAccessor.setStreamSceneCamera(localStreamSceneCamera_);
    }
    if (changeBits_ & 8) {
      objAccessor.setStreamImu(localStreamImu_);
    }
    if (changeBits_ & 16) {
      objAccessor.setStreamEyeEvents(localStreamEyeEvents_);
    }
    if (changeBits_ & 32) {
      objAccessor.setStreamAudio(localStreamAudio_);
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    createWritten_ = false;
    changeBits_ = 63;
    changeByteCount_ = Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localDeviceAddress_) + 24;
    return createTimestamp_;
  }

  void processDSUpdate(EyeTrackingDeviceReader value, uint64_t fieldsChanged) {
    if (value.checkDeviceNameChanged(fieldsChanged)) {
      localDeviceName_ = value.getDeviceName();
    }
    if (value.checkHardwareVersionChanged(fieldsChanged)) {
      localHardwareVersion_ = value.getHardwareVersion();
    }
    if (value.checkSerialNumberChanged(fieldsChanged)) {
      localSerialNumber_ = value.getSerialNumber();
    }
    if (value.checkIsConnectedChanged(fieldsChanged)) {
      localIsConnected_ = value.getIsConnected();
    }
    if (value.checkCalibrationJsonChanged(fieldsChanged)) {
      localCalibrationJson_ = value.getCalibrationJson();
    }
    if (value.checkLastUpdateChanged(fieldsChanged)) {
      localLastUpdate_ = value.getLastUpdate();
    }
    if (value.checkHeadOrientationChanged(fieldsChanged)) {
      localHeadOrientation_ = value.getHeadOrientation();
    }
    if (value.checkGazeDirectionChanged(fieldsChanged)) {
      localGazeDirection_ = value.getGazeDirection();
    }
    if (value.checkWornChanged(fieldsChanged)) {
      localWorn_ = value.getWorn();
    }
    if (value.checkPupilDiameterLeftChanged(fieldsChanged)) {
      localPupilDiameterLeft_ = value.getPupilDiameterLeft();
    }
    if (value.checkPupilDiameterRightChanged(fieldsChanged)) {
      localPupilDiameterRight_ = value.getPupilDiameterRight();
    }
    if (value.checkSceneCameraFrameRateChanged(fieldsChanged)) {
      localSceneCameraFrameRate_ = value.getSceneCameraFrameRate();
    }
    handleXrpaFieldsChanged(fieldsChanged);
  }

  const std::string& getDeviceName() const {
    return localDeviceName_;
  }

  const std::string& getHardwareVersion() const {
    return localHardwareVersion_;
  }

  const std::string& getSerialNumber() const {
    return localSerialNumber_;
  }

  bool getIsConnected() const {
    return localIsConnected_;
  }

  const std::string& getCalibrationJson() const {
    return localCalibrationJson_;
  }

  std::chrono::microseconds getLastUpdate() const {
    return localLastUpdate_;
  }

  const Eigen::Quaternionf& getHeadOrientation() const {
    return localHeadOrientation_;
  }

  const Eigen::Vector3f& getGazeDirection() const {
    return localGazeDirection_;
  }

  bool getWorn() const {
    return localWorn_;
  }

  float getPupilDiameterLeft() const {
    return localPupilDiameterLeft_;
  }

  float getPupilDiameterRight() const {
    return localPupilDiameterRight_;
  }

  int getSceneCameraFrameRate() const {
    return localSceneCameraFrameRate_;
  }

  inline bool checkDeviceAddressChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkStreamGazeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkStreamSceneCameraChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkStreamImuChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  inline bool checkStreamEyeEventsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 16;
  }

  inline bool checkStreamAudioChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 32;
  }

  inline bool checkDeviceNameChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 64;
  }

  inline bool checkHardwareVersionChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 128;
  }

  inline bool checkSerialNumberChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 256;
  }

  inline bool checkIsConnectedChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 512;
  }

  inline bool checkCalibrationJsonChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1024;
  }

  inline bool checkLastUpdateChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2048;
  }

  inline bool checkHeadOrientationChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4096;
  }

  inline bool checkGazeDirectionChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8192;
  }

  inline bool checkWornChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 16384;
  }

  inline bool checkPupilDiameterLeftChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 32768;
  }

  inline bool checkPupilDiameterRightChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 65536;
  }

  inline bool checkSceneCameraFrameRateChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 131072;
  }

  void onSceneCamera(std::function<void(uint64_t, SceneCameraReader)> handler) {
    sceneCameraMessageHandler_ = handler;
  }

  void onImuData(std::function<void(uint64_t, ImuDataReader)> handler) {
    imuDataMessageHandler_ = handler;
  }

  void onEyeEvent(std::function<void(uint64_t, EyeEventReader)> handler) {
    eyeEventMessageHandler_ = handler;
  }

  void onAudio(std::shared_ptr<Xrpa::InboundSignalDataInterface> handler) {
    audioSignalHandler_ = handler;
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
    if (messageType == 17) {
      if (sceneCameraMessageHandler_) {
        auto message = SceneCameraReader(messageData);
        sceneCameraMessageHandler_(msgTimestamp, message);
      }
    }
    if (messageType == 19) {
      if (imuDataMessageHandler_) {
        auto message = ImuDataReader(messageData);
        imuDataMessageHandler_(msgTimestamp, message);
      }
    }
    if (messageType == 20) {
      if (eyeEventMessageHandler_) {
        auto message = EyeEventReader(messageData);
        eyeEventMessageHandler_(msgTimestamp, message);
      }
    }
    if (messageType == 21) {
      if (audioSignalHandler_) {
        audioSignalHandler_->onSignalData(msgTimestamp, messageData);
      }
    }
  }

 protected:
  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) {
    if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(fieldsChanged); }
  }

  // Network address or device name for discovery
  std::string localDeviceAddress_ = "";

  // Enable gaze data streaming
  bool localStreamGaze_ = false;

  // Enable scene camera streaming
  bool localStreamSceneCamera_ = false;

  // Enable IMU data streaming
  bool localStreamImu_ = false;

  // Enable eye events (blinks, fixations, saccades)
  bool localStreamEyeEvents_ = false;

  // Enable audio streaming
  bool localStreamAudio_ = false;

  uint64_t createTimestamp_;
  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;
  bool createWritten_ = false;

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;

  // Human-readable device name
  std::string localDeviceName_ = "";

  // Hardware version info
  std::string localHardwareVersion_ = "";

  // Device serial number
  std::string localSerialNumber_ = "";

  // Connection status
  bool localIsConnected_ = false;

  // Camera calibration data (JSON format)
  std::string localCalibrationJson_ = "";

  // Last data update timestamp
  std::chrono::microseconds localLastUpdate_{0};

  // Head orientation (always updated)
  Eigen::Quaternionf localHeadOrientation_{1.f, 0.f, 0.f, 0.f};

  // Gaze direction in world space
  Eigen::Vector3f localGazeDirection_{0.f, 0.f, -1.f};

  // Whether glasses are worn
  bool localWorn_ = false;

  // Left pupil diameter
  float localPupilDiameterLeft_ = 0.f;

  // Right pupil diameter
  float localPupilDiameterRight_ = 0.f;

  // Current scene camera frame rate
  int localSceneCameraFrameRate_ = 0;

  std::function<void(uint64_t, SceneCameraReader)> sceneCameraMessageHandler_ = nullptr;
  std::function<void(uint64_t, ImuDataReader)> imuDataMessageHandler_ = nullptr;
  std::function<void(uint64_t, EyeEventReader)> eyeEventMessageHandler_ = nullptr;
  std::shared_ptr<Xrpa::InboundSignalDataInterface> audioSignalHandler_ = nullptr;
};

// Object Collections
class OutboundEyeTrackingDeviceReaderCollection : public Xrpa::ObjectCollection<EyeTrackingDeviceReader, std::shared_ptr<OutboundEyeTrackingDevice>> {
 public:
  explicit OutboundEyeTrackingDeviceReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<EyeTrackingDeviceReader, std::shared_ptr<OutboundEyeTrackingDevice>>(reconciler, 0, 262080, 0, true) {}

  void addObject(std::shared_ptr<OutboundEyeTrackingDevice> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundEyeTrackingDevice> createObject() {
    auto obj = std::make_shared<OutboundEyeTrackingDevice>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
    addObjectInternal(obj);
    return obj;
  }

  void removeObject(const Xrpa::ObjectUuid& id) {
    removeObjectInternal(id);
  }
};

// Data Store Implementation
class EyeTrackingDataStore : public Xrpa::DataStoreReconciler {
 public:
  EyeTrackingDataStore(std::weak_ptr<Xrpa::TransportStream> inboundTransport, std::weak_ptr<Xrpa::TransportStream> outboundTransport)
      : Xrpa::DataStoreReconciler(inboundTransport, outboundTransport, 34872064) {
    EyeTrackingDevice = std::make_shared<OutboundEyeTrackingDeviceReaderCollection>(this);
    registerCollection(EyeTrackingDevice);
  }

  std::shared_ptr<OutboundEyeTrackingDeviceReaderCollection> EyeTrackingDevice;
};

} // namespace EyeTrackingDataStore
