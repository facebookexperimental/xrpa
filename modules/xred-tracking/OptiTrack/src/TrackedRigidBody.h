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

#include <NatNetCAPI.h>
#include <NatNetClient.h>
#include <NatNetTypes.h>
#include <Eigen/Eigen>
#include <string>

class TrackedRigidBody {
 public:
  explicit TrackedRigidBody(const std::string& id) : id_(id) {}

  bool isValid() const {
    return isValid_;
  }

  const Eigen::Vector3f& getPosition() const {
    return position_;
  }

  Eigen::Quaternionf getOrientation() const {
    return orientation_;
  }

  void update(const sRigidBodyData& trackedBody) {
    isValid_ = trackedBody.params & 0x01;
    if (isValid_) {
      position_ = Eigen::Vector3f{trackedBody.x, trackedBody.y, trackedBody.z};
      orientation_ =
          Eigen::Quaternionf{trackedBody.qx, trackedBody.qy, trackedBody.qz, trackedBody.qw};
    }
  }

 private:
  std::string id_;
  bool isValid_ = false;
  Eigen::Vector3f position_{0, 0, 0};
  Eigen::Quaternionf orientation_{0, 0, 0, 1};
};
