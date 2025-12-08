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

#include "AudioInputDataStore.h"
#include "AudioInputTypes.h"
#include "AudioTranscriptionDataStore.h"
#include "CameraDataStore.h"
#include "ImageViewerDataStore.h"
#include "OpticalCharacterRecognitionDataStore.h"
#include <chrono>
#include <functional>
#include <string>
#include <xrpa-runtime/signals/InboundSignalForwarder.h>
#include <xrpa-runtime/utils/ImageTypes.h>

namespace XrpaDataflowPrograms {

class OcrTestProgram {
 public:
  OcrTestProgram(std::shared_ptr<AudioInputDataStore::AudioInputDataStore> datastoreAudioInput, std::shared_ptr<AudioTranscriptionDataStore::AudioTranscriptionDataStore> datastoreAudioTranscription, std::shared_ptr<CameraDataStore::CameraDataStore> datastoreCamera, std::shared_ptr<ImageViewerDataStore::ImageViewerDataStore> datastoreImageViewer, std::shared_ptr<OpticalCharacterRecognitionDataStore::OpticalCharacterRecognitionDataStore> datastoreOpticalCharacterRecognition) : datastoreAudioInput_(datastoreAudioInput), datastoreAudioTranscription_(datastoreAudioTranscription), datastoreCamera_(datastoreCamera), datastoreImageViewer_(datastoreImageViewer), datastoreOpticalCharacterRecognition_(datastoreOpticalCharacterRecognition) {
    createObjects();
  }

  ~OcrTestProgram() {
    destroyObjects();
  }

  std::function<void(bool)> onAudioActiveChanged = nullptr;
  std::function<void(std::string)> onAudioErrorMessageChanged = nullptr;

  int getOcrTriggerId() const {
    return paramOcrTriggerId_;
  }

  void setOcrTriggerId(int OcrTriggerId) {
    paramOcrTriggerId_ = OcrTriggerId;
    if (objOpticalCharacterRecognitionOpticalCharacterRecognition4_) {
      objOpticalCharacterRecognitionOpticalCharacterRecognition4_->setTriggerId(OcrTriggerId);
    }
  }

  // Whether audio input is currently active
  bool getAudioActive() const {
    return paramAudioActive_;
  }

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  inline bool checkAudioActiveChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  // Error message if audio input failed
  const std::string& getAudioErrorMessage() const {
    return paramAudioErrorMessage_;
  }

  inline bool checkAudioErrorMessageChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  void onCameraImage(std::function<void(uint64_t, const Xrpa::Image&)> handler) {
    paramCameraImage_ = handler;
  }

  void onOcrResult(std::function<void(uint64_t, const std::string&, std::chrono::nanoseconds, bool, const std::string&)> handler) {
    paramOcrResult_ = handler;
  }

  void onSpeechCommand(std::function<void(uint64_t, const std::string&, std::chrono::nanoseconds, bool, const std::string&)> handler) {
    paramSpeechCommand_ = handler;
  }

  void terminate() {
    destroyObjects();
  }

 private:
  void dispatchObjAudioInputAudioInputSource2_FieldsChanged(uint64_t fieldsChanged) {
    if ((fieldsChanged & 128) != 0) {
      paramAudioActive_ = objAudioInputAudioInputSource2_->getIsActive();
      if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(1); }
      if (onAudioActiveChanged) { onAudioActiveChanged(paramAudioActive_); }
    }
    if ((fieldsChanged & 256) != 0) {
      paramAudioErrorMessage_ = objAudioInputAudioInputSource2_->getErrorMessage();
      if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(2); }
      if (onAudioErrorMessageChanged) { onAudioErrorMessageChanged(paramAudioErrorMessage_); }
    }
  }

  void dispatchObjCameraCameraFeed0_CameraImage(uint64_t msgTimestamp, CameraDataStore::CameraImageReader msg) {
    auto image = msg.getImage();
    if (paramCameraImage_) {
      paramCameraImage_(msgTimestamp, image);
    }
    objOpticalCharacterRecognitionOpticalCharacterRecognition4_->sendImageInput(image);
    objImageViewerImageWindow1_->sendImage(image);
  }

  void dispatchObjOpticalCharacterRecognitionOpticalCharacterRecognition4_OcrResult(uint64_t msgTimestamp, OpticalCharacterRecognitionDataStore::OcrResultReader msg) {
    auto text = msg.getText();
    auto timestamp = msg.getTimestamp();
    auto success = msg.getSuccess();
    auto errorMessage = msg.getErrorMessage();
    if (paramOcrResult_) {
      paramOcrResult_(msgTimestamp, text, timestamp, success, errorMessage);
    }
  }

  void dispatchObjAudioTranscriptionAudioTranscription3_TranscriptionResult(uint64_t msgTimestamp, AudioTranscriptionDataStore::TranscriptionResultReader msg) {
    auto text = msg.getText();
    auto timestamp = msg.getTimestamp();
    auto success = msg.getSuccess();
    auto errorMessage = msg.getErrorMessage();
    if (paramSpeechCommand_) {
      paramSpeechCommand_(msgTimestamp, text, timestamp, success, errorMessage);
    }
  }

  void createObjects() {
    objCameraCameraFeed0_ = datastoreCamera_->CameraFeed->createObject();
    objAudioInputAudioInputSource2_ = datastoreAudioInput_->AudioInputSource->createObject();
    objAudioTranscriptionAudioTranscription3_ = datastoreAudioTranscription_->AudioTranscription->createObject();
    objOpticalCharacterRecognitionOpticalCharacterRecognition4_ = datastoreOpticalCharacterRecognition_->OpticalCharacterRecognition->createObject();
    objImageViewerImageWindow1_ = datastoreImageViewer_->ImageWindow->createObject();
    objCameraCameraFeed0_->setCameraName("");
    objAudioInputAudioInputSource2_->setBindTo(static_cast<AudioInputDataStore::DeviceBindingType>(2));
    objAudioInputAudioInputSource2_->setFrameRate(16000);
    objAudioInputAudioInputSource2_->setNumChannels(1);
    objAudioInputAudioInputSource2_AudioSignalForwarder_ = std::make_shared<Xrpa::InboundSignalForwarder>();
    objAudioInputAudioInputSource2_->onAudioSignal(objAudioInputAudioInputSource2_AudioSignalForwarder_);
    objAudioTranscriptionAudioTranscription3_->setAudioSignalForwarder<float>(objAudioInputAudioInputSource2_AudioSignalForwarder_);
    objOpticalCharacterRecognitionOpticalCharacterRecognition4_->setTriggerId(paramOcrTriggerId_);
    objImageViewerImageWindow1_->setName("Smart Speaker Camera");
    objAudioInputAudioInputSource2_->onXrpaFieldsChanged([this](auto p0) { dispatchObjAudioInputAudioInputSource2_FieldsChanged(p0); });
    objCameraCameraFeed0_->onCameraImage([this](auto p0, auto p1) { dispatchObjCameraCameraFeed0_CameraImage(p0, p1); });
    objOpticalCharacterRecognitionOpticalCharacterRecognition4_->onOcrResult([this](auto p0, auto p1) { dispatchObjOpticalCharacterRecognitionOpticalCharacterRecognition4_OcrResult(p0, p1); });
    objAudioTranscriptionAudioTranscription3_->onTranscriptionResult([this](auto p0, auto p1) { dispatchObjAudioTranscriptionAudioTranscription3_TranscriptionResult(p0, p1); });
  }

  void destroyObjects() {
    if (objImageViewerImageWindow1_) {
      datastoreImageViewer_->ImageWindow->removeObject(objImageViewerImageWindow1_->getXrpaId());
      objImageViewerImageWindow1_ = nullptr;
    }
    if (objOpticalCharacterRecognitionOpticalCharacterRecognition4_) {
      datastoreOpticalCharacterRecognition_->OpticalCharacterRecognition->removeObject(objOpticalCharacterRecognitionOpticalCharacterRecognition4_->getXrpaId());
      objOpticalCharacterRecognitionOpticalCharacterRecognition4_ = nullptr;
    }
    if (objAudioTranscriptionAudioTranscription3_) {
      datastoreAudioTranscription_->AudioTranscription->removeObject(objAudioTranscriptionAudioTranscription3_->getXrpaId());
      objAudioTranscriptionAudioTranscription3_ = nullptr;
    }
    if (objAudioInputAudioInputSource2_) {
      datastoreAudioInput_->AudioInputSource->removeObject(objAudioInputAudioInputSource2_->getXrpaId());
      objAudioInputAudioInputSource2_ = nullptr;
    }
    if (objCameraCameraFeed0_) {
      datastoreCamera_->CameraFeed->removeObject(objCameraCameraFeed0_->getXrpaId());
      objCameraCameraFeed0_ = nullptr;
    }
  }

  std::shared_ptr<AudioInputDataStore::AudioInputDataStore> datastoreAudioInput_;
  std::shared_ptr<AudioTranscriptionDataStore::AudioTranscriptionDataStore> datastoreAudioTranscription_;
  std::shared_ptr<CameraDataStore::CameraDataStore> datastoreCamera_;
  std::shared_ptr<ImageViewerDataStore::ImageViewerDataStore> datastoreImageViewer_;
  std::shared_ptr<OpticalCharacterRecognitionDataStore::OpticalCharacterRecognitionDataStore> datastoreOpticalCharacterRecognition_;
  int paramOcrTriggerId_ = 0;

  // Whether audio input is currently active
  bool paramAudioActive_ = false;

  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;

  // Error message if audio input failed
  std::string paramAudioErrorMessage_ = "";

  std::function<void(uint64_t, const Xrpa::Image&)> paramCameraImage_ = nullptr;
  std::function<void(uint64_t, const std::string&, std::chrono::nanoseconds, bool, const std::string&)> paramOcrResult_ = nullptr;
  std::function<void(uint64_t, const std::string&, std::chrono::nanoseconds, bool, const std::string&)> paramSpeechCommand_ = nullptr;
  std::shared_ptr<CameraDataStore::OutboundCameraFeed> objCameraCameraFeed0_;
  std::shared_ptr<AudioInputDataStore::OutboundAudioInputSource> objAudioInputAudioInputSource2_;
  std::shared_ptr<AudioTranscriptionDataStore::OutboundAudioTranscription> objAudioTranscriptionAudioTranscription3_;
  std::shared_ptr<OpticalCharacterRecognitionDataStore::OutboundOpticalCharacterRecognition> objOpticalCharacterRecognitionOpticalCharacterRecognition4_;
  std::shared_ptr<ImageViewerDataStore::OutboundImageWindow> objImageViewerImageWindow1_;
  std::shared_ptr<Xrpa::InboundSignalForwarder> objAudioInputAudioInputSource2_AudioSignalForwarder_;
};

} // namespace XrpaDataflowPrograms
