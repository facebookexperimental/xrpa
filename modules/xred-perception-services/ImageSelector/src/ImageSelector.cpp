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

#include "ImageSelector.h"

constexpr double kPixelPerDegree8Mp = 2880 / 110.f;
constexpr double kPixelPerDegree2Mp = kPixelPerDegree8Mp / 2.f;

ImageSelector::ImageSelector(const Xrpa::ObjectUuid& id, Xrpa::IObjectCollection* collection)
    : ImageSelectorDataStore::ReconciledImageSelector(id, collection) {
  onRgbCamera([this](int32_t timestamp, auto reader) {
    auto image = reader.getImage();
    images_.emplace_back(std::move(image));

    // remove old images
    int32_t N = getPickOneEveryNBasedOnMotion();
    int imageMaxBufferSize = 4 * N + 1;
    while (images_.size() > imageMaxBufferSize) {
      // just pick one to send, since we apparently don't have pose data for them
      sendRgbImage(images_[0]);
      images_.erase(images_.begin(), images_.begin() + N);
    }
  });

  onPoseDynamics([this](int32_t timestamp, auto reader) {
    auto pose = reader.getData();
    poses_.emplace_back(std::move(pose));

    int poseMaxBufferSize = 400;
    while (poses_.size() > poseMaxBufferSize) {
      poses_.pop_front();
    }

    while (pickImage()) {
    }
  });
}

bool ImageSelector::pickImage() {
  int32_t N = getPickOneEveryNBasedOnMotion();
  if (images_.size() < N) {
    return false;
  }

  auto oldestPoseTimestamp = poses_.front().timestamp;
  auto newestPoseTimestamp = poses_.back().timestamp;
  auto oldestImageTimestamp = images_.front().timestamp;
  if (newestPoseTimestamp <= images_[N - 1].timestamp) {
    return false;
  }
  if (oldestImageTimestamp <= oldestPoseTimestamp) {
    return false;
  }

  // each image must have a corresponding pose now
  double minBlurPixel = std::numeric_limits<double>::max();
  int selectedImageIdx = -1;
  for (int i = 0; i < N; ++i) {
    const auto& image = images_[i];
    const int64_t timestampNs = image.timestamp.count();
    const double exposureTimeS = static_cast<double>(image.exposureDuration.count()) / 1e9;
    auto it = std::lower_bound(
        poses_.begin(), poses_.end(), timestampNs, [](const auto& pose, const auto& timestampNs) {
          return pose.timestamp.count() < timestampNs;
        });
    // both it and it - 1 must be valid
    assert(it != poses_.end());
    assert(it != poses_.begin());
    const auto vel0 = (it - 1)->deviceRotationalVelocity;
    const auto t0 = (it - 1)->timestamp.count();
    const auto vel1 = it->deviceRotationalVelocity;
    const auto t1 = it->timestamp.count();
    assert(t1 >= timestampNs);
    assert(timestampNs >= t0);
    assert(t1 > t0);
    const auto vel =
        double(t1 - timestampNs) / (t1 - t0) * vel0 + double(timestampNs - t0) / (t1 - t0) * vel1;

    // using blur pixel rather than angular velocity
    const auto anglesRad = vel * exposureTimeS;

    const double angleDeg = anglesRad.norm() * 180 / M_PI;
    const double blurPixel = angleDeg * kPixelPerDegree2Mp;
    if (blurPixel < minBlurPixel) {
      selectedImageIdx = i;
      minBlurPixel = blurPixel;
    }
  }

  if (selectedImageIdx >= 0) {
    sendRgbImage(images_[selectedImageIdx]);
    images_.erase(images_.begin(), images_.begin() + N);
    return true;
  }

  return false;
}
