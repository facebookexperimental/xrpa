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

#pragma once

#include <OVRSession.h>
#include <iostream>
#include <memory>

template <typename HeadType>
class QuestTracker {
 public:
  QuestTracker(std::shared_ptr<OVRSession>& session, std::shared_ptr<HeadType>& head)
      : session_(session), head_(head) {
    ovr_SetTrackingOriginType(session_->get(), ovrTrackingOrigin_FloorLevel);

    auto resetTrackingOrigin = [this](int32_t timestamp) {
      ovr_RecenterTrackingOrigin(session_->get());
    };
    head->onResetPose(resetTrackingOrigin);
    head->setName("Head");
  }

  void pollHmd() {
    // read tracking state from HMD and write it into the data store
    auto trackingState = ovr_GetTrackingState(session_->get(), 0.0, false);
    if (!(trackingState.StatusFlags & (ovrStatus_PositionValid | ovrStatus_OrientationValid))) {
      return;
    }

    auto head = head_.lock();
    if (head == nullptr) {
      return;
    }

    head->setLastUpdate();

    auto pose = head->getPose();
    if (trackingState.StatusFlags & ovrStatus_PositionValid) {
      pose.position = trackingState.HeadPose.ThePose.Position;
      // TODO include velocity and acceleration?
    }
    if (trackingState.StatusFlags & ovrStatus_OrientationValid) {
      pose.orientation = trackingState.HeadPose.ThePose.Orientation;
      // TODO include angular velocity and acceleration?
    }
    head->setPose(pose);
    head->setAbsolutePose(pose);
  }

 private:
  std::shared_ptr<OVRSession> session_;
  std::weak_ptr<HeadType> head_;
};
