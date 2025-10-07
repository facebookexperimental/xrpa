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

#include "FiducialTracker.h"

#include <algorithm>

#include "ocean/base/Base.h"
#include "ocean/base/WorkerPool.h"

#include "ocean/media/FrameMedium.h"
#include "ocean/media/Manager.h"

#include "ocean/cv/FrameConverter.h"
#include "ocean/cv/FrameConverterY8.h"

#include "ocean/cv/detector/qrcodes/QRCode.h"
#include "ocean/cv/detector/qrcodes/QRCodeDetector2D.h"
#include "ocean/cv/detector/qrcodes/QRCodeEncoder.h"
#include "ocean/cv/detector/qrcodes/Utilities.h"

#include "ocean/io/image/Image.h"

#include "ocean/tracking/Utilities.h"
#include "ocean/tracking/VisualTracker.h"
#include "ocean/tracking/orb/FeatureTracker6DOF.h"
#include "ocean/tracking/pattern/PatternTracker6DOF.h"

#include <OVRSession.h>

using namespace Ocean;

class SingleCameraQRTracker : public FiducialTracker {
  static constexpr unsigned int kCodeImageSize = 512;

 public:
  explicit SingleCameraQRTracker(FiducialsModule* moduleData)
      : codeSizeCm_(moduleData->settings.codeSizeCm),
        hmdTranslation_(false),
        hmdOrientation_(true),
        hmd_T_camera_(true) {
    medium_ = Media::Manager::get().newMedium("HD Pro Webcam C920");
    if (!medium_) {
      medium_ = Media::Manager::get().newMedium("LiveVideoId:0");
    }
    if (medium_) {
      std::cout << "Tracking live video" << std::endl;
      medium_->start();
    }

    try {
      ovrSession_ = std::make_unique<OVRSession>();
    } catch (const std::exception& e) {
      std::cout << "Proceeding without HMD tracking." << std::endl;
    }

    if (ovrSession_) {
      ovr_SetTrackingOriginType(ovrSession_->get(), ovrTrackingOrigin_FloorLevel);

      Vector3 cameraTranslation = {
          moduleData->settings.cameraTranslation[0] * 0.01f,
          moduleData->settings.cameraTranslation[1] * 0.01f,
          moduleData->settings.cameraTranslation[2] * 0.01f};
      Euler cameraEuler = Euler(
          Numeric::deg2rad(moduleData->settings.cameraRotationYPR[0]),
          Numeric::deg2rad(moduleData->settings.cameraRotationYPR[1]),
          Numeric::deg2rad(moduleData->settings.cameraRotationYPR[2]));
      hmd_T_camera_ = HomogenousMatrix4(cameraTranslation, Quaternion(cameraEuler));
    }

    visualTracker_ = std::make_unique<Tracking::Pattern::PatternTracker6DOF>();
    visualTracker_->setMaxConcurrentlyVisiblePattern(8);

    // debugFrame_ = IO::Image::readImage("C:/open/single1.jpg");
  }

  virtual bool processFrame(
      const Ocean::Frame& srcFrame,
      const Ocean::SharedAnyCamera& camera,
      Ocean::Frame* debugFrame) override {
    // convert to y8
    Frame yFrame;
    if (!CV::FrameConverter::Comfort::convert(
            srcFrame,
            FrameType::FORMAT_Y8,
            FrameType::ORIGIN_UPPER_LEFT,
            yFrame,
            CV::FrameConverter::CP_ALWAYS_COPY,
            WorkerPool::get().scopedWorker()())) {
      return false;
    }

    // read updated pose from the HMD
    if (ovrSession_) {
      // thankfully, Ocean already uses the OVR coordinate system, so no need for conversion
      auto trackingState = ovr_GetTrackingState(ovrSession_->get(), 0.0, false);
      if (trackingState.StatusFlags & ovrStatus_OrientationValid) {
        hmdOrientation_.x() = trackingState.HeadPose.ThePose.Orientation.x;
        hmdOrientation_.y() = trackingState.HeadPose.ThePose.Orientation.y;
        hmdOrientation_.z() = trackingState.HeadPose.ThePose.Orientation.z;
        hmdOrientation_.w() = trackingState.HeadPose.ThePose.Orientation.w;
      }
      if (trackingState.StatusFlags & ovrStatus_PositionValid) {
        hmdTranslation_.x() = trackingState.HeadPose.ThePose.Position.x;
        hmdTranslation_.y() = trackingState.HeadPose.ThePose.Position.y;
        hmdTranslation_.z() = trackingState.HeadPose.ThePose.Position.z;
      }
    }

    // detect QR codes
    CV::Detector::QRCodes::QRCodes codes =
        CV::Detector::QRCodes::QRCodeDetector2D::detectQRCodes(*camera, yFrame);

    // for any untracked codes, generate an image and tracker state
    for (size_t i = 0; i < codes.size(); ++i) {
      if (cachedQRCodes_.find(codes[i].dataString()) == cachedQRCodes_.end()) {
        cacheQRCode(codes[i]);
      }
    }

    // now do the pose tracking
    HomogenousMatrix4 world_T_hmd = HomogenousMatrix4(hmdTranslation_, hmdOrientation_);
    HomogenousMatrix4 world_T_camera = world_T_hmd * hmd_T_camera_;
    Quaternion cameraOrientation = world_T_camera.rotation();

    fiducials.clear();
    Tracking::VisualTracker::TransformationSamples resultingTransformationSamples;
    auto pinholeCamera = std::dynamic_pointer_cast<const AnyCameraPinhole>(camera);
    if (!visualTracker_->determinePoses(
            yFrame,
            pinholeCamera->actualCamera(),
            false,
            resultingTransformationSamples,
            cameraOrientation,
            WorkerPool::get().scopedWorker()())) {
      return true;
    }
    if (resultingTransformationSamples.empty()) {
      return true;
    }

    for (auto& [dataString, patternId] : cachedQRCodes_) {
      const auto foundSampleIter = std::find_if(
          resultingTransformationSamples.begin(),
          resultingTransformationSamples.end(),
          [patternId = patternId](const auto& sample) { return sample.id() == patternId; });
      if (foundSampleIter == resultingTransformationSamples.end()) {
        continue;
      }

      // the resulting pose transforms points defined in the coordinate system of the camera to
      // points defined in the coordinate system of the world (the pattern)
      const HomogenousMatrix4& object_T_camera = foundSampleIter->transformation();

      // debug draw the bounding box
      if (debugFrame) {
        const HomogenousMatrix4 resultingPoseIF(
            PinholeCamera::standard2InvertedFlipped(object_T_camera));
        const uint8_t* const bgColor = CV::Canvas::black(debugFrame->pixelFormat());
        const uint8_t* const fgColor = CV::Canvas::red(debugFrame->pixelFormat());
        auto objectDimension = Box3(
            Vector3(0, 0, 0),
            Vector3(
                Scalar(codeSizeCm_ * 0.01f),
                Scalar(codeSizeCm_ * 0.002f),
                Scalar(codeSizeCm_ * 0.01f)));
        Tracking::Utilities::paintBoundingBoxIF(
            *debugFrame, resultingPoseIF, *camera, objectDimension, fgColor, bgColor);
      }

      // convert to pose
      HomogenousMatrix4 camera_T_object = object_T_camera.inverted();
      HomogenousMatrix4 world_T_object = world_T_camera * camera_T_object;
      auto translation = world_T_object.translation();
      auto rotation = world_T_object.rotation();
      TrackingDataStore::Pose pose = {
          {static_cast<float>(translation.x()),
           static_cast<float>(translation.y()),
           static_cast<float>(translation.z())},
          {static_cast<float>(rotation.w()),
           static_cast<float>(rotation.x()),
           static_cast<float>(rotation.y()),
           static_cast<float>(rotation.z())}};

      // offset the pose to the center of the code
      Eigen::Vector3f midpointOffset = {codeSizeCm_ * 0.005f, 0.f, codeSizeCm_ * 0.005f};
      pose.position += pose.orientation * midpointOffset;

      fiducials.emplace(dataString, pose);
    }

    return true;
  }

 private:
  float codeSizeCm_;
  std::unique_ptr<Tracking::Pattern::PatternTracker6DOF> visualTracker_;
  std::unordered_map<std::string, int> cachedQRCodes_;

  std::unique_ptr<OVRSession> ovrSession_;
  Vector3 hmdTranslation_;
  Quaternion hmdOrientation_;
  HomogenousMatrix4 hmd_T_camera_;

  void cacheQRCode(const CV::Detector::QRCodes::QRCode& code) {
    const Frame patternFrame = CV::Detector::QRCodes::Utilities::draw(
        code,
        kCodeImageSize,
        /* allowTrueMultiple */ true,
        /* border */ 4u,
        WorkerPool::get().scopedWorker()());

    ocean_assert(patternFrame.isValid());

    const Vector2 patternDimension = Vector2(codeSizeCm_ * 0.01f, codeSizeCm_ * 0.01f);

    int patternId = visualTracker_->addPattern(
        patternFrame, patternDimension, WorkerPool::get().scopedWorker()());
    if (patternId != -1) {
      cachedQRCodes_.emplace(code.dataString(), patternId);
    }
  }
};
