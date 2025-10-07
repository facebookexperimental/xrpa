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

#include "CameraFeed.h"

#include <xrpa-runtime/utils/StringUtils.h>

#include "ocean/base/Base.h"
#include "ocean/media/Manager.h"

#include "ImageConversion.h"

constexpr int QUEUE_SIZE_SECONDS = 1;
constexpr int RGB_WIDTH = 1024;
constexpr int RGB_HEIGHT = 768;
constexpr int RGB_FPS = 30;
constexpr int RGB_QUEUE_SIZE = RGB_WIDTH * RGB_HEIGHT * 3 * RGB_FPS * QUEUE_SIZE_SECONDS;

CameraFeed::CameraFeed(
    OceanSetup* oceanSetup,
    const Xrpa::ObjectUuid& id,
    Xrpa::IObjectCollection* collection)
    : CameraDataStore::ReconciledCameraFeed(id, collection),
      oceanSetup_(oceanSetup),
      rgbQueue_(RGB_QUEUE_SIZE) {
  // nothing to do here
}

CameraFeed::~CameraFeed() {
  shutdown();
}

void CameraFeed::handleXrpaFieldsChanged(uint64_t fieldsChanged) {
  if (checkCameraNameChanged(fieldsChanged)) {
    shutdown();

    std::string cameraName = getCameraName();
    std::string mediumName;

    // TODO find matching camera if cameraName is not empty
    if (cameraName.empty()) {
      mediumName = "LiveVideoId:0";
    } else {
      Xrpa::SimpleStringFilter cameraNameFilter;
      cameraNameFilter = cameraName;
      auto mediaList = oceanSetup_->getMedia();
      for (const auto& media : mediaList) {
        if (cameraNameFilter.match(media.url())) {
          mediumName = media.url();
          break;
        }
      }
    }

    if (!mediumName.empty()) {
      medium_ = Ocean::Media::Manager::get().newMedium(mediumName);
      if (medium_) {
        std::cout << "CameraFeed " << mediumName << " started streaming" << std::endl;
        frameSubscription_ = medium_->addFrameCallback(
            [this](const Ocean::Frame& frame, const Ocean::SharedAnyCamera& camera) {
              float captureFrameRate = static_cast<float>(medium_->frameFrequency());
              rgbQueue_.write(ImageUtils::convertOceanFrameToImage(frame, captureFrameRate));
            });
        medium_->start();
      }
    }
  }
}

void CameraFeed::tick() {
  while (rgbQueue_.read(tempRgbImage_)) {
    sendCameraImage(tempRgbImage_);
  }
}

void CameraFeed::shutdown() {
  frameSubscription_.release();
  medium_.release();
}
