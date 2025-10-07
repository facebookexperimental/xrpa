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

#include "ocean/base/Base.h"
#include "ocean/base/Timestamp.h"
#include "ocean/base/WorkerPool.h"

#include "ocean/media/FrameMedium.h"
#include "ocean/media/Manager.h"

#include "ocean/cv/FrameConverter.h"
#include "ocean/cv/FrameConverterY8.h"
#include "ocean/cv/FrameFilterGaussian.h"
#include "ocean/cv/Histogram.h"

#include "ocean/cv/detector/qrcodes/QRCode.h"
#include "ocean/cv/detector/qrcodes/QRCodeDetector3D.h"

#include "ocean/io/image/Image.h"

using namespace Ocean;

class Usb3DCamera : public FiducialTracker {
 public:
  Usb3DCamera() {
    auto cameraProfile = PinholeCamera(1920, 1080, 117.5f * M_PI / 180.f);
    anyCameras_.reserve(2);
    anyCameras_.emplace_back(std::make_shared<AnyCameraPinhole>(cameraProfile));
    anyCameras_.emplace_back(std::make_shared<AnyCameraPinhole>(cameraProfile));

    device_T_cameras_.resize(2);
    device_T_cameras_[0].toIdentity();
    device_T_cameras_[0].setTranslation(Vector3(-0.03, 0, 0));
    device_T_cameras_[1].toIdentity();
    device_T_cameras_[1].setTranslation(Vector3(0.03, 0, 0));

    // let the consumer of the QR code data apply the device->world transformation
    world_T_device_.toIdentity();

    medium_ = Media::Manager::get().newMedium("3D USB Camera", Media::Medium::LIVE_VIDEO);
    if (medium_) {
      medium_->setPreferredFrameDimension(3840u, 1080u);
      medium_->setPreferredFrameFrequency(60.f);
      medium_->start();
    }

    // debugFrame_ = IO::Image::readImage("C:/open/debug4.jpg");
  }

  virtual bool processFrame(
      const Ocean::Frame& frame,
      const Ocean::SharedAnyCamera& /*camera*/,
      Ocean::Frame* /*debugFrame*/) override {
    // convert to y8
    Frame yFrame;
    if (!CV::FrameConverter::Comfort::convert(
            frame,
            FrameType::FORMAT_Y8,
            FrameType::ORIGIN_UPPER_LEFT,
            yFrame,
            CV::FrameConverter::CP_ALWAYS_COPY,
            WorkerPool::get().scopedWorker()())) {
      return false;
    }

    // split into left and right camera views
    Frames yFrames;
    yFrames.reserve(2);
    auto halfWidth = yFrame.width() / 2;
    auto frameHeight = yFrame.height();
    yFrames.emplace_back(subFrame(yFrame, 0, 0, halfWidth, frameHeight));
    yFrames.emplace_back(subFrame(yFrame, halfWidth, 0, halfWidth, frameHeight));

    // detect QR codes
    CV::Detector::QRCodes::QRCodes codes;
    HomogenousMatrices4 world_T_codes;
    Scalars codeSizes;
    if (!CV::Detector::QRCodes::QRCodeDetector3D::detectQRCodesWithPyramids(
            anyCameras_,
            yFrames,
            world_T_device_,
            device_T_cameras_,
            codes,
            world_T_codes,
            codeSizes,
            WorkerPool::get().scopedWorker()())) {
      std::cout << "QR code detection failed." << std::endl;
      return false;
    }

    fiducials.clear();
    for (size_t i = 0; i < codes.size(); ++i) {
      auto translation = world_T_codes[i].translation();
      auto rotation = world_T_codes[i].rotation();
      TrackingDataStore::Pose pose = {
          {static_cast<float>(translation.x()),
           static_cast<float>(translation.y()),
           static_cast<float>(translation.z())},
          {static_cast<float>(rotation.w()),
           static_cast<float>(rotation.x()),
           static_cast<float>(rotation.y()),
           static_cast<float>(rotation.z())}};
      fiducials.emplace(codes[i].dataString(), pose);
    }

    return true;
  }

 private:
  SharedAnyCameras anyCameras_;
  HomogenousMatrices4 device_T_cameras_;
  HomogenousMatrix4 world_T_device_;

  static Frame
  subFrame(const Frame& yFrame, uint32_t left, uint32_t top, uint32_t width, uint32_t height) {
    Frame ySubFrame =
        yFrame.subFrame(left, top, width, height, Ocean::Frame::CM_COPY_REMOVE_PADDING_LAYOUT);
    return ySubFrame;

    /*
    Frame equalizedFrame(ySubFrame.frameType());
    Ocean::CV::ContrastLimitedAdaptiveHistogram::equalization8BitPerChannel(
        ySubFrame.constdata<uint8_t>(),
        ySubFrame.width(),
        ySubFrame.height(),
        equalizedFrame.data<uint8_t>(),
        Ocean::Scalar(2.0),
        8u,
        8u,
        ySubFrame.paddingElements(),
        equalizedFrame.paddingElements(),
        WorkerPool::get().scopedWorker()());

    Frame blurredFrame(equalizedFrame.frameType());
    CV::FrameFilterGaussian::filter<uint8_t, uint32_t>(
        equalizedFrame.constdata<uint8_t>(),
        blurredFrame.data<uint8_t>(),
        equalizedFrame.width(),
        equalizedFrame.height(),
        equalizedFrame.channels(),
        equalizedFrame.paddingElements(),
        blurredFrame.paddingElements(),
        25,
        25,
        -1.0f,
        WorkerPool::get().scopedWorker()());

    return blurredFrame;
    */
  }
};
