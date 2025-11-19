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

#include <lib/FiducialsModule.h>

#include <Eigen/Eigen>
#include <cmath>
#include <iostream>
#include <memory>
#include <string>
#include <unordered_map>

#include "ocean/base/Base.h"
#include "ocean/base/Timestamp.h"
#include "ocean/base/WorkerPool.h"

#include "ocean/cv/FrameConverter.h"

#include "ocean/io/LegacyCameraCalibrationManager.h"

#include "ocean/media/FrameMedium.h"
#include "ocean/media/Manager.h"

#include "ocean/platform/win/BitmapWindow.h"

class FiducialTracker {
 public:
  virtual ~FiducialTracker() {
    medium_.release();
  }

  bool tick(Ocean::Platform::Win::BitmapWindow* debugWindow) {
    if (!medium_) {
      return false;
    }

    // get the next frame
    Ocean::FrameRef frameRef = medium_->frame(&anyCamera_);

    if (anyCamera_ == nullptr || !anyCamera_->isValid()) {
      if (!frameRef || !*frameRef) {
        frameRef = medium_->frame();
      }
      if (!frameRef || !*frameRef) {
        return false;
      }
      anyCamera_ = std::make_shared<Ocean::AnyCameraPinhole>(
          Ocean::IO::LegacyCameraCalibrationManager::get().camera(
              medium_->url(),
              frameRef->width(),
              frameRef->height(),
              nullptr,
              Ocean::Numeric::deg2rad(60)));
    }

    if (!frameRef || !*frameRef) {
      return false;
    }

    // only process new frames
    auto timestamp = frameRef->timestamp();
    if (timestamp == lastFrameTimestamp_) {
      return false;
    }
    lastFrameTimestamp_ = frameRef->timestamp();

    Ocean::Frame rgbFrame;
    if (debugWindow) {
      Ocean::CV::FrameConverter::Comfort::convert(
          *frameRef,
          Ocean::FrameType::FORMAT_RGB24,
          Ocean::FrameType::ORIGIN_UPPER_LEFT,
          rgbFrame,
          Ocean::CV::FrameConverter::CP_ALWAYS_COPY,
          Ocean::WorkerPool::get().scopedWorker()());
    }

    auto ret = processFrame(
        debugFrame_.isValid() ? debugFrame_ : *frameRef,
        anyCamera_,
        debugWindow ? &rgbFrame : nullptr);

    if (debugWindow) {
      debugWindow->setFrame(rgbFrame);
      debugWindow->repaint();
    }

    return ret;
  }

  virtual bool processFrame(
      const Ocean::Frame& frame,
      const Ocean::SharedAnyCamera& camera,
      Ocean::Frame* debugFrame) = 0;

  std::unordered_map<std::string, TrackingDataStore::Pose> fiducials;

 protected:
  Ocean::Media::FrameMediumRef medium_;
  Ocean::Timestamp lastFrameTimestamp_;
  Ocean::SharedAnyCamera anyCamera_;

  Ocean::Frame debugFrame_;
};
