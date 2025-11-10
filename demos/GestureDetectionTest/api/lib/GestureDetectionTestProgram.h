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

#include "CameraDataStore.h"
#include "GestureDetectionDataStore.h"
#include "GestureDetectionTypes.h"
#include "ImageViewerDataStore.h"
#include <chrono>
#include <functional>
#include <string>

namespace XrpaDataflowPrograms {

class GestureDetectionTestProgram {
 public:
  GestureDetectionTestProgram(std::shared_ptr<CameraDataStore::CameraDataStore> datastoreCamera, std::shared_ptr<GestureDetectionDataStore::GestureDetectionDataStore> datastoreGestureDetection, std::shared_ptr<ImageViewerDataStore::ImageViewerDataStore> datastoreImageViewer) : datastoreCamera_(datastoreCamera), datastoreGestureDetection_(datastoreGestureDetection), datastoreImageViewer_(datastoreImageViewer) {
    createObjects();
  }

  ~GestureDetectionTestProgram() {
    destroyObjects();
  }

  void onGestureResult(std::function<void(uint64_t, std::chrono::nanoseconds, GestureDetectionDataStore::GestureType, float, bool, const std::string&, GestureDetectionDataStore::MotionDirection, float)> handler) {
    paramGestureResult_ = handler;
  }

  void terminate() {
    destroyObjects();
  }

 private:
  void dispatchObjGestureDetectionGestureDetection2_GestureResult(uint64_t msgTimestamp, GestureDetectionDataStore::GestureResultReader msg) {
    auto timestamp = msg.getTimestamp();
    auto gestureType = msg.getGestureType();
    auto confidence = msg.getConfidence();
    auto handDetected = msg.getHandDetected();
    auto errorMessage = msg.getErrorMessage();
    auto motionDirection = msg.getMotionDirection();
    auto motionOffset = msg.getMotionOffset();
    if (paramGestureResult_) {
      paramGestureResult_(msgTimestamp, timestamp, gestureType, confidence, handDetected, errorMessage, motionDirection, motionOffset);
    }
  }

  void dispatchObjCameraCameraFeed0_CameraImage(uint64_t msgTimestamp, CameraDataStore::CameraImageReader msg) {
    auto image = msg.getImage();
    objGestureDetectionGestureDetection2_->sendImageInput(image);
    objImageViewerImageWindow1_->sendImage(image);
  }

  void createObjects() {
    objCameraCameraFeed0_ = datastoreCamera_->CameraFeed->createObject();
    objGestureDetectionGestureDetection2_ = datastoreGestureDetection_->GestureDetection->createObject();
    objImageViewerImageWindow1_ = datastoreImageViewer_->ImageWindow->createObject();
    objCameraCameraFeed0_->setCameraName("");
    objCameraCameraFeed0_->onCameraImage([this](auto p0, auto p1) { dispatchObjCameraCameraFeed0_CameraImage(p0, p1); });
    objImageViewerImageWindow1_->setName("Camera");
    objImageViewerImageWindow1_->setFlipHorizontal(true);
    objGestureDetectionGestureDetection2_->onGestureResult([this](auto p0, auto p1) { dispatchObjGestureDetectionGestureDetection2_GestureResult(p0, p1); });
  }

  void destroyObjects() {
    if (objImageViewerImageWindow1_) {
      datastoreImageViewer_->ImageWindow->removeObject(objImageViewerImageWindow1_->getXrpaId());
      objImageViewerImageWindow1_ = nullptr;
    }
    if (objGestureDetectionGestureDetection2_) {
      datastoreGestureDetection_->GestureDetection->removeObject(objGestureDetectionGestureDetection2_->getXrpaId());
      objGestureDetectionGestureDetection2_ = nullptr;
    }
    if (objCameraCameraFeed0_) {
      datastoreCamera_->CameraFeed->removeObject(objCameraCameraFeed0_->getXrpaId());
      objCameraCameraFeed0_ = nullptr;
    }
  }

  std::shared_ptr<CameraDataStore::CameraDataStore> datastoreCamera_;
  std::shared_ptr<GestureDetectionDataStore::GestureDetectionDataStore> datastoreGestureDetection_;
  std::shared_ptr<ImageViewerDataStore::ImageViewerDataStore> datastoreImageViewer_;
  std::function<void(uint64_t, std::chrono::nanoseconds, GestureDetectionDataStore::GestureType, float, bool, const std::string&, GestureDetectionDataStore::MotionDirection, float)> paramGestureResult_ = nullptr;
  std::shared_ptr<CameraDataStore::OutboundCameraFeed> objCameraCameraFeed0_;
  std::shared_ptr<GestureDetectionDataStore::OutboundGestureDetection> objGestureDetectionGestureDetection2_;
  std::shared_ptr<ImageViewerDataStore::OutboundImageWindow> objImageViewerImageWindow1_;
};

} // namespace XrpaDataflowPrograms
