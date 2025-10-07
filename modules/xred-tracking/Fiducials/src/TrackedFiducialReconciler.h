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

#include <lib/FiducialsModule.h>
#include <xrpa-runtime/external_utils/UuidGen.h>
#include <xrpa-runtime/utils/SimpleReconciler.h>

#include <iostream>
#include <memory>
#include <string>
#include <unordered_map>

class TrackedFiducialReconciler
    : public Xrpa::SimpleReconciler<std::string, TrackingDataStore::Pose> {
 public:
  explicit TrackedFiducialReconciler(
      std::shared_ptr<TrackingDataStore::TrackingDataStore>& trackingDataStore)
      : trackingDataStore_(trackingDataStore) {}

 protected:
  virtual void onCreate(const std::string& name, TrackingDataStore::Pose& pose) override {
    std::cout << "Found fiducial: " << name << std::endl;
    auto id = getTrackerIdentifier(name);
    auto trackedObject = std::make_shared<TrackingDataStore::OutboundTrackedObject>(id);
    trackingDataStore_->TrackedObject->addObject(trackedObject);
    trackedObject->setName(name);

    trackedObject->onResetPose([&](int32_t timestamp) {
      trackedObject->setRootPose(trackedObject->getAbsolutePose());
      trackedObject->setPose(
          TrackingDataStore::Pose{Eigen::Vector3f::Zero(), Eigen::Quaternionf::Identity()});
      trackedObject->setLastUpdate();
    });
  }

  virtual void onUpdate(const std::string& name, const TrackingDataStore::Pose& pose) override {
    auto id = getTrackerIdentifier(name);
    auto trackedObject = trackingDataStore_->TrackedObject->getObject(id);
    if (trackedObject == nullptr) {
      return;
    }

    trackedObject->setLastUpdate();
    trackedObject->setAbsolutePose(pose);

    auto rootPose = trackedObject->getRootPose();
    TrackingDataStore::Pose localPose;
    localPose.position = rootPose.orientation * (pose.position - rootPose.position);
    localPose.orientation = pose.orientation * rootPose.orientation.inverse();
    trackedObject->setPose(localPose);
  }

  virtual void onDelete(const std::string& name, TrackingDataStore::Pose& pose) override {
    std::cout << "Lost fiducial: " << name << std::endl;
    auto id = getTrackerIdentifier(name);
    trackingDataStore_->TrackedObject->removeObject(id);
  }

  Xrpa::ObjectUuid getTrackerIdentifier(const std::string& name) {
    auto iter = trackerIdentifiers_.find(name);
    if (iter == trackerIdentifiers_.end()) {
      auto identifier = Xrpa::generateUuid();
      trackerIdentifiers_.emplace(name, identifier);
      return identifier;
    }
    return iter->second;
  }

 private:
  std::shared_ptr<TrackingDataStore::TrackingDataStore> trackingDataStore_;
  std::unordered_map<std::string, Xrpa::ObjectUuid> trackerIdentifiers_;
};
