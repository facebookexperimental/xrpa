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

#include "AriaDataStore.h"
#include "AriaTypes.h"
#include "ImageSelectorDataStore.h"
#include "ImageViewerDataStore.h"
#include "LlmHubDataStore.h"
#include "LlmHubTypes.h"
#include "ObjectRecognitionDataStore.h"
#include "SignalProcessingDataStore.h"
#include <Eigen/Eigen>
#include <functional>
#include <string>
#include <xrpa-runtime/signals/InboundSignalForwarder.h>

namespace XrpaDataflowPrograms {

class AriaDebugProgram {
 public:
  AriaDebugProgram(std::shared_ptr<AriaDataStore::AriaDataStore> datastoreAria, std::shared_ptr<ImageSelectorDataStore::ImageSelectorDataStore> datastoreImageSelector, std::shared_ptr<ImageViewerDataStore::ImageViewerDataStore> datastoreImageViewer, std::shared_ptr<LlmHubDataStore::LlmHubDataStore> datastoreLlmHub, std::shared_ptr<ObjectRecognitionDataStore::ObjectRecognitionDataStore> datastoreObjectRecognition, std::shared_ptr<SignalProcessingDataStore::SignalProcessingDataStore> datastoreSignalProcessing) : datastoreAria_(datastoreAria), datastoreImageSelector_(datastoreImageSelector), datastoreImageViewer_(datastoreImageViewer), datastoreLlmHub_(datastoreLlmHub), datastoreObjectRecognition_(datastoreObjectRecognition), datastoreSignalProcessing_(datastoreSignalProcessing) {
    createObjects();
  }

  ~AriaDebugProgram() {
    destroyObjects();
  }

  std::function<void(int)> onCoordinateFrameIdChanged = nullptr;
  std::function<void(AriaDataStore::Pose)> onPoseChanged = nullptr;

  const std::string& getApiKey() const {
    return paramApiKey_;
  }

  void setApiKey(const std::string& apiKey) {
    paramApiKey_ = apiKey;
    if (objLlmHubLlmTriggeredQuery3_) {
      objLlmHubLlmTriggeredQuery3_->setApiKey(apiKey);
    }
  }

  const std::string& getIpAddress() const {
    return paramIpAddress_;
  }

  void setIpAddress(const std::string& ipAddress) {
    paramIpAddress_ = ipAddress;
    if (objAriaAriaGlasses0_) {
      objAriaAriaGlasses0_->setIpAddress(ipAddress);
    }
  }

  int getQueryId() const {
    return paramQueryId_;
  }

  void setQueryId(int queryId) {
    paramQueryId_ = queryId;
    if (objLlmHubLlmTriggeredQuery3_) {
      objLlmHubLlmTriggeredQuery3_->setTriggerId(queryId);
    }
  }

  int getCoordinateFrameId() const {
    return paramCoordinateFrameId_;
  }

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  inline bool checkCoordinateFrameIdChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  void onObjectDetection(std::function<void(uint64_t, const std::string&)> handler) {
    paramObjectDetection_ = handler;
  }

  const AriaDataStore::Pose& getPose() const {
    return paramPose_;
  }

  inline bool checkPoseChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  void onQueryResponse(std::function<void(uint64_t, const std::string&, int)> handler) {
    paramQueryResponse_ = handler;
  }

  void terminate() {
    destroyObjects();
  }

 private:
  void dispatchObjAriaAriaGlasses0_FieldsChanged(uint64_t fieldsChanged) {
    if ((fieldsChanged & 2048) != 0) {
      paramCoordinateFrameId_ = objAriaAriaGlasses0_->getCoordinateFrameId();
      if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(1); }
      if (onCoordinateFrameIdChanged) { onCoordinateFrameIdChanged(paramCoordinateFrameId_); }
    }
    if ((fieldsChanged & 1024) != 0) {
      paramPose_ = objAriaAriaGlasses0_->getPose();
      if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(2); }
      if (onPoseChanged) { onPoseChanged(paramPose_); }
    }
  }

  void dispatchObjObjectRecognitionObjectRecognition2_ObjectDetction(uint64_t msgTimestamp, ObjectRecognitionDataStore::ObjectDetectionReader msg) {
    auto objectClass = msg.getObjectClass();
    if (paramObjectDetection_) {
      paramObjectDetection_(msgTimestamp, objectClass);
    }
  }

  void dispatchObjLlmHubLlmTriggeredQuery3_Response(uint64_t msgTimestamp, LlmHubDataStore::LlmChatResponseReader msg) {
    auto data = msg.getData();
    auto id = msg.getId();
    if (paramQueryResponse_) {
      paramQueryResponse_(msgTimestamp, data, id);
    }
  }

  void dispatchObjAriaAriaGlasses0_RgbCamera(uint64_t msgTimestamp, AriaDataStore::RgbCameraReader msg) {
    auto image = msg.getImage();
    objImageSelectorImageSelector1_->sendRgbCamera(image);
    objImageViewerImageWindow4_->sendImage(image);
  }

  void dispatchObjAriaAriaGlasses0_PoseDynamics(uint64_t msgTimestamp, AriaDataStore::PoseDynamicsPoseDynamicsReader msg) {
    auto data = msg.getData();
    objImageSelectorImageSelector1_->sendPoseDynamics(data);
  }

  void dispatchObjImageSelectorImageSelector1_RgbImage(uint64_t msgTimestamp, ImageSelectorDataStore::RgbImageRgbImageReader msg) {
    auto image = msg.getImage();
    objObjectRecognitionObjectRecognition2_->sendRgbImage(image);
    objLlmHubLlmTriggeredQuery3_->sendRgbImageFeed(image);
    objImageViewerImageWindow7_->sendImage(image);
  }

  void dispatchObjAriaAriaGlasses0_SlamCamera1(uint64_t msgTimestamp, AriaDataStore::SlamCamera1Reader msg) {
    auto image = msg.getImage();
    objImageViewerImageWindow5_->sendImage(image);
  }

  void dispatchObjAriaAriaGlasses0_SlamCamera2(uint64_t msgTimestamp, AriaDataStore::SlamCamera2Reader msg) {
    auto image = msg.getImage();
    objImageViewerImageWindow6_->sendImage(image);
  }

  void createObjects() {
    objAriaAriaGlasses0_ = datastoreAria_->AriaGlasses->createObject();
    objImageSelectorImageSelector1_ = datastoreImageSelector_->ImageSelector->createObject();
    objObjectRecognitionObjectRecognition2_ = datastoreObjectRecognition_->ObjectRecognition->createObject();
    objLlmHubLlmTriggeredQuery3_ = datastoreLlmHub_->LlmTriggeredQuery->createObject();
    objSignalProcessingSignalSource8_ = datastoreSignalProcessing_->SignalSource->createObject();
    objImageViewerImageWindow4_ = datastoreImageViewer_->ImageWindow->createObject();
    objImageViewerImageWindow5_ = datastoreImageViewer_->ImageWindow->createObject();
    objImageViewerImageWindow6_ = datastoreImageViewer_->ImageWindow->createObject();
    objImageViewerImageWindow7_ = datastoreImageViewer_->ImageWindow->createObject();
    objSignalProcessingSignalOutputDevice9_ = datastoreSignalProcessing_->SignalOutputDevice->createObject();
    objAriaAriaGlasses0_->setIpAddress(paramIpAddress_);
    objAriaAriaGlasses0_->setIsFlashlight(true);
    objImageSelectorImageSelector1_->setPickOneEveryNBasedOnMotion(2);
    objAriaAriaGlasses0_->onRgbCamera([this](auto p0, auto p1) { dispatchObjAriaAriaGlasses0_RgbCamera(p0, p1); });
    objAriaAriaGlasses0_->onPoseDynamics([this](auto p0, auto p1) { dispatchObjAriaAriaGlasses0_PoseDynamics(p0, p1); });
    objImageSelectorImageSelector1_->onRgbImage([this](auto p0, auto p1) { dispatchObjImageSelectorImageSelector1_RgbImage(p0, p1); });
    objLlmHubLlmTriggeredQuery3_->setApiKey(paramApiKey_);
    objLlmHubLlmTriggeredQuery3_->setModelSize(static_cast<LlmHubDataStore::ModelSizeHint>(1));
    objLlmHubLlmTriggeredQuery3_->setSysPrompt("You are an image recognizing AI that examines images and answers questions about the objects detected.");
    objLlmHubLlmTriggeredQuery3_->setUserPrompt("\nDescribe this scene in json formt. The json will describe all objects in the image in a lot of detail. Make sure you describe all the objects you detect.\n\nHere is an example json blob of a theoretical scene:\n{ \"scene\": { \"name\": \"Living Room\", \"description\": \"A cozy living room with a couch, coffee table, and TV.\", \"objects\": [ { \"id\": 1, \"name\": \"Couch\", \"material\": \"Fabric\", \"colors\": [\"#964B00\", \"#FFC080\"], \"relative_importance\": 0.8, \"visual_description\": \"A plush, three-seater couch with rolled arms and a tufted back. The cushions are a warm, earthy brown color with cream-colored accent pillows.\" }, { \"id\": 2, \"name\": \"Coffee Table\", \"material\": \"Wood\", \"colors\": [\"#786C3B\"], \"relative_importance\": 0.4, \"visual_description\": \"A simple, low-slung coffee table made of dark-stained wood. The surface is smooth and unadorned, with a subtle grain visible in the wood.\" }, { \"id\": 3, \"name\": \"TV\", \"material\": \"Electronic\", \"colors\": [\"#000000\", \"#333333\"], \"relative_importance\": 0.9, \"visual_description\": \"A large, flat-screen TV with a sleek black frame and a glossy finish. The screen is a deep, rich black when turned off, and displays vibrant colors when turned on.\" } ] } }\n");
    objLlmHubLlmTriggeredQuery3_->setJsonSchema("{\"type\":\"object\",\"properties\":{\"scene\":{\"type\":\"object\",\"properties\":{\"name\":{\"type\":\"string\"},\"description\":{\"type\":\"string\"},\"objects\":{\"type\":\"array\",\"items\":{\"type\":\"object\",\"properties\":{\"id\":{\"type\":\"number\"},\"name\":{\"type\":\"string\"},\"material\":{\"type\":\"string\"},\"colors\":{\"type\":\"array\",\"items\":{\"type\":\"string\"}},\"relative_importance\":{\"type\":\"number\"},\"visual_description\":{\"type\":\"string\"}},\"required\":[\"id\",\"name\",\"material\",\"colors\",\"relative_importance\",\"visual_description\"],\"additionalProperties\":false}}},\"required\":[\"name\",\"description\",\"objects\"],\"additionalProperties\":false}},\"required\":[\"scene\"],\"additionalProperties\":false}");
    objLlmHubLlmTriggeredQuery3_->setTriggerId(paramQueryId_);
    objSignalProcessingSignalSource8_->setNumChannels(2);
    objAriaAriaGlasses0_AudioForwarder_ = std::make_shared<Xrpa::InboundSignalForwarder>();
    objAriaAriaGlasses0_->onAudio(objAriaAriaGlasses0_AudioForwarder_);
    objSignalProcessingSignalSource8_->setSrcDataForwarder<float>(objAriaAriaGlasses0_AudioForwarder_);
    objSignalProcessingSignalSource8_->setNumOutputs(1);
    objImageViewerImageWindow4_->setName("Aria RGB");
    objImageViewerImageWindow5_->setName("Aria SLAM1");
    objAriaAriaGlasses0_->onSlamCamera1([this](auto p0, auto p1) { dispatchObjAriaAriaGlasses0_SlamCamera1(p0, p1); });
    objImageViewerImageWindow6_->setName("Aria SLAM2");
    objAriaAriaGlasses0_->onSlamCamera2([this](auto p0, auto p1) { dispatchObjAriaAriaGlasses0_SlamCamera2(p0, p1); });
    objImageViewerImageWindow7_->setName("Selected RGB");
    objSignalProcessingSignalOutputDevice9_->setSrcNode(objSignalProcessingSignalSource8_->getXrpaId());
    objSignalProcessingSignalOutputDevice9_->setDeviceNameFilter("Headphones");
    objSignalProcessingSignalOutputDevice9_->setChannelOffset(0);
    objAriaAriaGlasses0_->onXrpaFieldsChanged([this](auto p0) { dispatchObjAriaAriaGlasses0_FieldsChanged(p0); });
    objObjectRecognitionObjectRecognition2_->onObjectDetction([this](auto p0, auto p1) { dispatchObjObjectRecognitionObjectRecognition2_ObjectDetction(p0, p1); });
    objLlmHubLlmTriggeredQuery3_->onResponse([this](auto p0, auto p1) { dispatchObjLlmHubLlmTriggeredQuery3_Response(p0, p1); });
  }

  void destroyObjects() {
    if (objSignalProcessingSignalOutputDevice9_) {
      datastoreSignalProcessing_->SignalOutputDevice->removeObject(objSignalProcessingSignalOutputDevice9_->getXrpaId());
      objSignalProcessingSignalOutputDevice9_ = nullptr;
    }
    if (objImageViewerImageWindow7_) {
      datastoreImageViewer_->ImageWindow->removeObject(objImageViewerImageWindow7_->getXrpaId());
      objImageViewerImageWindow7_ = nullptr;
    }
    if (objImageViewerImageWindow6_) {
      datastoreImageViewer_->ImageWindow->removeObject(objImageViewerImageWindow6_->getXrpaId());
      objImageViewerImageWindow6_ = nullptr;
    }
    if (objImageViewerImageWindow5_) {
      datastoreImageViewer_->ImageWindow->removeObject(objImageViewerImageWindow5_->getXrpaId());
      objImageViewerImageWindow5_ = nullptr;
    }
    if (objImageViewerImageWindow4_) {
      datastoreImageViewer_->ImageWindow->removeObject(objImageViewerImageWindow4_->getXrpaId());
      objImageViewerImageWindow4_ = nullptr;
    }
    if (objSignalProcessingSignalSource8_) {
      datastoreSignalProcessing_->SignalSource->removeObject(objSignalProcessingSignalSource8_->getXrpaId());
      objSignalProcessingSignalSource8_ = nullptr;
    }
    if (objLlmHubLlmTriggeredQuery3_) {
      datastoreLlmHub_->LlmTriggeredQuery->removeObject(objLlmHubLlmTriggeredQuery3_->getXrpaId());
      objLlmHubLlmTriggeredQuery3_ = nullptr;
    }
    if (objObjectRecognitionObjectRecognition2_) {
      datastoreObjectRecognition_->ObjectRecognition->removeObject(objObjectRecognitionObjectRecognition2_->getXrpaId());
      objObjectRecognitionObjectRecognition2_ = nullptr;
    }
    if (objImageSelectorImageSelector1_) {
      datastoreImageSelector_->ImageSelector->removeObject(objImageSelectorImageSelector1_->getXrpaId());
      objImageSelectorImageSelector1_ = nullptr;
    }
    if (objAriaAriaGlasses0_) {
      datastoreAria_->AriaGlasses->removeObject(objAriaAriaGlasses0_->getXrpaId());
      objAriaAriaGlasses0_ = nullptr;
    }
  }

  std::shared_ptr<AriaDataStore::AriaDataStore> datastoreAria_;
  std::shared_ptr<ImageSelectorDataStore::ImageSelectorDataStore> datastoreImageSelector_;
  std::shared_ptr<ImageViewerDataStore::ImageViewerDataStore> datastoreImageViewer_;
  std::shared_ptr<LlmHubDataStore::LlmHubDataStore> datastoreLlmHub_;
  std::shared_ptr<ObjectRecognitionDataStore::ObjectRecognitionDataStore> datastoreObjectRecognition_;
  std::shared_ptr<SignalProcessingDataStore::SignalProcessingDataStore> datastoreSignalProcessing_;
  std::string paramApiKey_ = "";
  std::string paramIpAddress_ = "";
  int paramQueryId_ = 0;
  int paramCoordinateFrameId_ = 0;
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;
  std::function<void(uint64_t, const std::string&)> paramObjectDetection_ = nullptr;
  AriaDataStore::Pose paramPose_{Eigen::Vector3f{0.f, 0.f, 0.f}, Eigen::Quaternionf{1.f, 0.f, 0.f, 0.f}};
  std::function<void(uint64_t, const std::string&, int)> paramQueryResponse_ = nullptr;
  std::shared_ptr<AriaDataStore::OutboundAriaGlasses> objAriaAriaGlasses0_;
  std::shared_ptr<ImageSelectorDataStore::OutboundImageSelector> objImageSelectorImageSelector1_;
  std::shared_ptr<ObjectRecognitionDataStore::OutboundObjectRecognition> objObjectRecognitionObjectRecognition2_;
  std::shared_ptr<LlmHubDataStore::OutboundLlmTriggeredQuery> objLlmHubLlmTriggeredQuery3_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalSource> objSignalProcessingSignalSource8_;
  std::shared_ptr<ImageViewerDataStore::OutboundImageWindow> objImageViewerImageWindow4_;
  std::shared_ptr<ImageViewerDataStore::OutboundImageWindow> objImageViewerImageWindow5_;
  std::shared_ptr<ImageViewerDataStore::OutboundImageWindow> objImageViewerImageWindow6_;
  std::shared_ptr<ImageViewerDataStore::OutboundImageWindow> objImageViewerImageWindow7_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalOutputDevice> objSignalProcessingSignalOutputDevice9_;
  std::shared_ptr<Xrpa::InboundSignalForwarder> objAriaAriaGlasses0_AudioForwarder_;
};

} // namespace XrpaDataflowPrograms
