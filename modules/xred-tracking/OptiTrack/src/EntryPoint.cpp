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

#include <lib/OptiTrackModule.h>
#include <xrpa-runtime/utils/SimpleReconciler.h>
#include <chrono>
#include <string>
#include <thread>

#include "OptiTrackConnection.h"
#include "TrackedRigidBody.h"
#include "lib/TrackingTypes.h"

using namespace Xrpa;

static ObjectUuid HeadIdentifier(100, 100);

class TrackedRigidBodyReconciler : public SimpleReconciler<std::string, TrackedRigidBody> {
 public:
  explicit TrackedRigidBodyReconciler(
      std::shared_ptr<TrackingDataStore::TrackingDataStore>& trackingDataStore)
      : trackingDataStore_(trackingDataStore) {}

 protected:
  virtual void onCreate(const std::string& trackerID, TrackedRigidBody& value) override {
    auto id = getTrackerIdentifier(trackerID);
    auto trackedObject = std::make_shared<TrackingDataStore::OutboundTrackedObject>(id);
    trackingDataStore_->TrackedObject->addObject(trackedObject);

    trackedObject->setName(trackerID);

    trackedObject->onResetPose([&](int32_t timestamp) {
      trackedObject->setRootPose(trackedObject->getAbsolutePose());
      trackedObject->setPose(
          TrackingDataStore::Pose{Eigen::Vector3f::Zero(), Eigen::Quaternionf::Identity()});
      trackedObject->setLastUpdate();
    });
  }

  virtual void onUpdate(const std::string& trackerID, const TrackedRigidBody& value) override {
    if (!value.isValid()) {
      return;
    }
    auto id = getTrackerIdentifier(trackerID);
    auto trackedObject = trackingDataStore_->TrackedObject->getObject(id);
    if (trackedObject == nullptr) {
      return;
    }

    TrackingDataStore::Pose absolutePose{value.getPosition(), value.getOrientation()};
    trackedObject->setLastUpdate();
    trackedObject->setAbsolutePose(absolutePose);

    auto rootPose = trackedObject->getRootPose();
    TrackingDataStore::Pose localPose;
    localPose.position = rootPose.orientation * (absolutePose.position - rootPose.position);
    localPose.orientation = absolutePose.orientation * rootPose.orientation.inverse();
    trackedObject->setPose(localPose);
  }

  virtual void onDelete(const std::string& trackerID, TrackedRigidBody& value) override {
    auto id = getTrackerIdentifier(trackerID);
    trackingDataStore_->TrackedObject->removeObject(id);
  }

  virtual void onReconcileComplete() override {
    trackingDataStore_->tickInbound();
    trackingDataStore_->tickOutbound();
  }

  ObjectUuid getTrackerIdentifier(const std::string& trackerID) {
    if (trackerID == "Head") {
      return HeadIdentifier;
    }

    auto iter = trackerIdentifiers_.find(trackerID);
    if (iter == trackerIdentifiers_.end()) {
      ObjectUuid identifier(1, ++trackerCounter);
      trackerIdentifiers_.emplace(trackerID, identifier);
      return identifier;
    }
    return iter->second;
  }

 private:
  std::shared_ptr<TrackingDataStore::TrackingDataStore> trackingDataStore_;
  std::unordered_map<std::string, ObjectUuid> trackerIdentifiers_;
  uint64_t trackerCounter = 0;
};

void EntryPoint(OptiTrackModule* moduleData) {
  auto rigidBodyReconciler =
      std::make_unique<TrackedRigidBodyReconciler>(moduleData->trackingDataStore);
  auto optiTrack = std::make_unique<OptiTrackConnection>(rigidBodyReconciler.get());

  while (moduleData->isRunning()) {
    using namespace std::chrono_literals;
    std::this_thread::sleep_for(500ms);
  }
}
