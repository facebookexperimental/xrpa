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

#include "TrackingTypes.h"
#include <OVR_CAPI.h>
#include <chrono>
#include <functional>
#include <memory>
#include <string>
#include <xrpa-runtime/external_utils/UuidGen.h>
#include <xrpa-runtime/reconciler/DataStoreInterfaces.h>
#include <xrpa-runtime/reconciler/DataStoreReconciler.h>
#include <xrpa-runtime/reconciler/ObjectCollection.h>
#include <xrpa-runtime/transport/TransportStream.h>
#include <xrpa-runtime/transport/TransportStreamAccessor.h>
#include <xrpa-runtime/utils/MemoryAccessor.h>
#include <xrpa-runtime/utils/XrpaTypes.h>

namespace TrackingDataStore {

class TrackingDataStore;
class OutboundTrackedObject;

class TrackedObjectReader : public Xrpa::ObjectAccessorInterface {
 public:
  TrackedObjectReader() {}

  explicit TrackedObjectReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  std::string getName() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  Pose getPose() {
    return DSPose::readValue(memAccessor_, readOffset_);
  }

  Pose getRootPose() {
    return DSPose::readValue(memAccessor_, readOffset_);
  }

  Pose getAbsolutePose() {
    return DSPose::readValue(memAccessor_, readOffset_);
  }

  std::chrono::microseconds getLastUpdate() {
    return Xrpa::reinterpretValue<std::chrono::microseconds, uint64_t>(memAccessor_.readValue<uint64_t>(readOffset_));
  }

  inline bool checkNameChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkPoseChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkRootPoseChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkAbsolutePoseChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  inline bool checkLastUpdateChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 16;
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class TrackedObjectWriter : public TrackedObjectReader {
 public:
  TrackedObjectWriter() {}

  explicit TrackedObjectWriter(const Xrpa::MemoryAccessor& memAccessor) : TrackedObjectReader(memAccessor) {}

  static TrackedObjectWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return TrackedObjectWriter(changeEvent.accessChangeData());
  }

  static TrackedObjectWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return TrackedObjectWriter(changeEvent.accessChangeData());
  }

  void setName(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

  void setPose(const Pose& value) {
    DSPose::writeValue(value, memAccessor_, writeOffset_);
  }

  void setRootPose(const Pose& value) {
    DSPose::writeValue(value, memAccessor_, writeOffset_);
  }

  void setAbsolutePose(const Pose& value) {
    DSPose::writeValue(value, memAccessor_, writeOffset_);
  }

  void setLastUpdate(std::chrono::microseconds value) {
    memAccessor_.writeValue<uint64_t>(Xrpa::reinterpretValue<uint64_t, std::chrono::microseconds>(value), writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

// Reconciled Types
class OutboundTrackedObject : public Xrpa::DataStoreObject {
 public:
  explicit OutboundTrackedObject(const Xrpa::ObjectUuid& id) : Xrpa::DataStoreObject(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  const std::string& getName() const {
    return localName_;
  }

  void setName(const std::string& name) {
    localName_ = name;
    if ((changeBits_ & 1) == 0) {
      changeBits_ |= 1;
      changeByteCount_ += 4;
    }
    changeByteCount_ += Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localName_);
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 1);
    }
  }

  const Pose& getPose() const {
    return localPose_;
  }

  void setPose(const Pose& pose) {
    localPose_ = pose;
    if ((changeBits_ & 2) == 0) {
      changeBits_ |= 2;
      changeByteCount_ += 28;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 2);
    }
  }

  const Pose& getRootPose() const {
    return localRootPose_;
  }

  void setRootPose(const Pose& rootPose) {
    localRootPose_ = rootPose;
    if ((changeBits_ & 4) == 0) {
      changeBits_ |= 4;
      changeByteCount_ += 28;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 4);
    }
  }

  const Pose& getAbsolutePose() const {
    return localAbsolutePose_;
  }

  void setAbsolutePose(const Pose& absolutePose) {
    localAbsolutePose_ = absolutePose;
    if ((changeBits_ & 8) == 0) {
      changeBits_ |= 8;
      changeByteCount_ += 28;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 8);
    }
  }

  std::chrono::microseconds getLastUpdate() const {
    return localLastUpdate_;
  }

  void setLastUpdate() {
    localLastUpdate_ = Xrpa::reinterpretValue<std::chrono::microseconds, uint64_t>(Xrpa::getCurrentClockTimeMicroseconds());
    if ((changeBits_ & 16) == 0) {
      changeBits_ |= 16;
      changeByteCount_ += 8;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 16);
    }
  }

  void clearLastUpdate() {
    std::chrono::microseconds clearValue{0};
    if (localLastUpdate_ != clearValue) {
      localLastUpdate_ = clearValue;
      if ((changeBits_ & 16) == 0) {
        changeBits_ |= 16;
        changeByteCount_ += 8;
      }
      if (collection_) {
        if (!hasNotifiedNeedsWrite_) {
          collection_->notifyObjectNeedsWrite(getXrpaId());
          hasNotifiedNeedsWrite_ = true;
        }
        collection_->setDirty(getXrpaId(), 16);
      }
    }
  }

  void writeDSChanges(Xrpa::TransportStreamAccessor* accessor) {
    TrackedObjectWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 31;
      changeByteCount_ = Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localName_) + 96;
      objAccessor = TrackedObjectWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = TrackedObjectWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    }
    if (objAccessor.isNull()) {
      return;
    }
    if (changeBits_ & 1) {
      objAccessor.setName(localName_);
    }
    if (changeBits_ & 2) {
      objAccessor.setPose(localPose_);
    }
    if (changeBits_ & 4) {
      objAccessor.setRootPose(localRootPose_);
    }
    if (changeBits_ & 8) {
      objAccessor.setAbsolutePose(localAbsolutePose_);
    }
    if (changeBits_ & 16) {
      objAccessor.setLastUpdate(localLastUpdate_);
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    createWritten_ = false;
    changeBits_ = 31;
    changeByteCount_ = Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localName_) + 96;
    return createTimestamp_;
  }

  void processDSUpdate(TrackedObjectReader value, uint64_t fieldsChanged) {
    handleXrpaFieldsChanged(fieldsChanged);
  }

  inline bool checkNameChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkPoseChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkRootPoseChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkAbsolutePoseChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  inline bool checkLastUpdateChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 16;
  }

  void onResetPose(std::function<void(uint64_t)> handler) {
    ResetPoseMessageHandler_ = handler;
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
    if (messageType == 5) {
      if (ResetPoseMessageHandler_) {
        ResetPoseMessageHandler_(msgTimestamp);
      }
    }
  }

 protected:
  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) {
    if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(fieldsChanged); }
  }

  std::string localName_ = "";
  Pose localPose_{ovrVector3f{0.f, 0.f, 0.f}, ovrQuatf{0.f, 0.f, 0.f, 1.f}};
  Pose localRootPose_{ovrVector3f{0.f, 0.f, 0.f}, ovrQuatf{0.f, 0.f, 0.f, 1.f}};
  Pose localAbsolutePose_{ovrVector3f{0.f, 0.f, 0.f}, ovrQuatf{0.f, 0.f, 0.f, 1.f}};
  std::chrono::microseconds localLastUpdate_{0};
  uint64_t createTimestamp_;
  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;
  bool createWritten_ = false;

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;
  std::function<void(uint64_t)> ResetPoseMessageHandler_ = nullptr;
};

// Object Collections
class OutboundTrackedObjectReaderCollection : public Xrpa::ObjectCollection<TrackedObjectReader, std::shared_ptr<OutboundTrackedObject>> {
 public:
  explicit OutboundTrackedObjectReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<TrackedObjectReader, std::shared_ptr<OutboundTrackedObject>>(reconciler, 0, 0, 0, true) {}

  void addObject(std::shared_ptr<OutboundTrackedObject> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundTrackedObject> createObject() {
    auto obj = std::make_shared<OutboundTrackedObject>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
    addObjectInternal(obj);
    return obj;
  }

  void removeObject(const Xrpa::ObjectUuid& id) {
    removeObjectInternal(id);
  }
};

// Data Store Implementation
class TrackingDataStore : public Xrpa::DataStoreReconciler {
 public:
  TrackingDataStore(std::weak_ptr<Xrpa::TransportStream> inboundTransport, std::weak_ptr<Xrpa::TransportStream> outboundTransport)
      : Xrpa::DataStoreReconciler(inboundTransport, outboundTransport, 13824) {
    TrackedObject = std::make_shared<OutboundTrackedObjectReaderCollection>(this);
    registerCollection(TrackedObject);
  }

  std::shared_ptr<OutboundTrackedObjectReaderCollection> TrackedObject;
};

} // namespace TrackingDataStore
