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
#include "ImageViewerDataStore.h"
#include "VisualEmotionDetectionDataStore.h"
#include "VisualEmotionDetectionTypes.h"
#include <chrono>
#include <functional>
#include <string>

namespace XrpaDataflowPrograms {

class CameraDebugProgram {
 public:
  CameraDebugProgram(std::shared_ptr<CameraDataStore::CameraDataStore> datastoreCamera, std::shared_ptr<ImageViewerDataStore::ImageViewerDataStore> datastoreImageViewer, std::shared_ptr<VisualEmotionDetectionDataStore::VisualEmotionDetectionDataStore> datastoreVisualEmotionDetection) : datastoreCamera_(datastoreCamera), datastoreImageViewer_(datastoreImageViewer), datastoreVisualEmotionDetection_(datastoreVisualEmotionDetection) {
    createObjects();
  }

  ~CameraDebugProgram() {
    destroyObjects();
  }

  void onEmotionResult(std::function<void(uint64_t, std::chrono::nanoseconds, VisualEmotionDetectionDataStore::EmotionType, bool, float, float, float)> handler) {
    paramEmotionResult_ = handler;
  }

  void terminate() {
    destroyObjects();
  }

 private:
  void dispatchObjVisualEmotionDetectionVisualEmotionDetection2_EmotionResult(uint64_t msgTimestamp, VisualEmotionDetectionDataStore::EmotionResultReader msg) {
    auto timestamp = msg.getTimestamp();
    auto emotion = msg.getEmotion();
    auto faceDetected = msg.getFaceDetected();
    auto confidence = msg.getConfidence();
    auto valence = msg.getValence();
    auto arousal = msg.getArousal();
    if (paramEmotionResult_) {
      paramEmotionResult_(msgTimestamp, timestamp, emotion, faceDetected, confidence, valence, arousal);
    }
  }

  void dispatchObjCameraCameraFeed0_CameraImage(uint64_t msgTimestamp, CameraDataStore::CameraImageReader msg) {
    auto image = msg.getImage();
    objVisualEmotionDetectionVisualEmotionDetection2_->sendImageInput(image);
    objImageViewerImageWindow1_->sendImage(image);
  }

  void createObjects() {
    objCameraCameraFeed0_ = datastoreCamera_->CameraFeed->createObject();
    objVisualEmotionDetectionVisualEmotionDetection2_ = datastoreVisualEmotionDetection_->VisualEmotionDetection->createObject();
    objImageViewerImageWindow1_ = datastoreImageViewer_->ImageWindow->createObject();
    objCameraCameraFeed0_->setCameraName("");
    objCameraCameraFeed0_->onCameraImage([this](auto p0, auto p1) { dispatchObjCameraCameraFeed0_CameraImage(p0, p1); });
    objVisualEmotionDetectionVisualEmotionDetection2_->setApiKey("/Users/archanapradeep/Downloads/licence_online_meta.bskai");
    objImageViewerImageWindow1_->setName("Camera");
    objVisualEmotionDetectionVisualEmotionDetection2_->onEmotionResult([this](auto p0, auto p1) { dispatchObjVisualEmotionDetectionVisualEmotionDetection2_EmotionResult(p0, p1); });
  }

  void destroyObjects() {
    if (objImageViewerImageWindow1_) {
      datastoreImageViewer_->ImageWindow->removeObject(objImageViewerImageWindow1_->getXrpaId());
      objImageViewerImageWindow1_ = nullptr;
    }
    if (objVisualEmotionDetectionVisualEmotionDetection2_) {
      datastoreVisualEmotionDetection_->VisualEmotionDetection->removeObject(objVisualEmotionDetectionVisualEmotionDetection2_->getXrpaId());
      objVisualEmotionDetectionVisualEmotionDetection2_ = nullptr;
    }
    if (objCameraCameraFeed0_) {
      datastoreCamera_->CameraFeed->removeObject(objCameraCameraFeed0_->getXrpaId());
      objCameraCameraFeed0_ = nullptr;
    }
  }

  std::shared_ptr<CameraDataStore::CameraDataStore> datastoreCamera_;
  std::shared_ptr<ImageViewerDataStore::ImageViewerDataStore> datastoreImageViewer_;
  std::shared_ptr<VisualEmotionDetectionDataStore::VisualEmotionDetectionDataStore> datastoreVisualEmotionDetection_;
  std::function<void(uint64_t, std::chrono::nanoseconds, VisualEmotionDetectionDataStore::EmotionType, bool, float, float, float)> paramEmotionResult_ = nullptr;
  std::shared_ptr<CameraDataStore::OutboundCameraFeed> objCameraCameraFeed0_;
  std::shared_ptr<VisualEmotionDetectionDataStore::OutboundVisualEmotionDetection> objVisualEmotionDetectionVisualEmotionDetection2_;
  std::shared_ptr<ImageViewerDataStore::OutboundImageWindow> objImageViewerImageWindow1_;
};

} // namespace XrpaDataflowPrograms
