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
#include "SpeakerIdentificationDataStore.h"
#include <functional>
#include <string>
#include <xrpa-runtime/signals/InboundSignalForwarder.h>

namespace XrpaDataflowPrograms {

class SpeakerIdentificationTestProgram {
 public:
  SpeakerIdentificationTestProgram(std::shared_ptr<AudioInputDataStore::AudioInputDataStore> datastoreAudioInput, std::shared_ptr<SpeakerIdentificationDataStore::SpeakerIdentificationDataStore> datastoreSpeakerIdentification) : datastoreAudioInput_(datastoreAudioInput), datastoreSpeakerIdentification_(datastoreSpeakerIdentification) {
    createObjects();
  }

  ~SpeakerIdentificationTestProgram() {
    destroyObjects();
  }

  std::function<void(std::string)> onAudioErrorMessageChanged = nullptr;
  std::function<void(int)> onConfidenceScoreChanged = nullptr;
  std::function<void(std::string)> onErrorMessageChanged = nullptr;
  std::function<void(std::string)> onIdentifiedSpeakerIdChanged = nullptr;
  std::function<void(std::string)> onIdentifiedSpeakerNameChanged = nullptr;
  std::function<void(bool)> onIsActiveChanged = nullptr;

  // Error message if audio input failed
  const std::string& getAudioErrorMessage() const {
    return paramAudioErrorMessage_;
  }

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  inline bool checkAudioErrorMessageChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  // Confidence score of the match (0-1)
  int getConfidenceScore() const {
    return paramConfidenceScore_;
  }

  inline bool checkConfidenceScoreChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  // Error message if identification failed
  const std::string& getErrorMessage() const {
    return paramErrorMessage_;
  }

  inline bool checkErrorMessageChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  // ID of the identified speaker, empty if no match
  const std::string& getIdentifiedSpeakerId() const {
    return paramIdentifiedSpeakerId_;
  }

  inline bool checkIdentifiedSpeakerIdChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  // Name of the identified speaker, empty if no match
  const std::string& getIdentifiedSpeakerName() const {
    return paramIdentifiedSpeakerName_;
  }

  inline bool checkIdentifiedSpeakerNameChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 16;
  }

  // Whether audio input is currently active
  bool getIsActive() const {
    return paramIsActive_;
  }

  inline bool checkIsActiveChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 32;
  }

  void terminate() {
    destroyObjects();
  }

 private:
  void dispatchObjAudioInputAudioInputSource0_FieldsChanged(uint64_t fieldsChanged) {
    if ((fieldsChanged & 256) != 0) {
      paramAudioErrorMessage_ = objAudioInputAudioInputSource0_->getErrorMessage();
      if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(1); }
      if (onAudioErrorMessageChanged) { onAudioErrorMessageChanged(paramAudioErrorMessage_); }
    }
    if ((fieldsChanged & 128) != 0) {
      paramIsActive_ = objAudioInputAudioInputSource0_->getIsActive();
      if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(32); }
      if (onIsActiveChanged) { onIsActiveChanged(paramIsActive_); }
    }
  }

  void dispatchObjSpeakerIdentificationSpeakerIdentifier1_FieldsChanged(uint64_t fieldsChanged) {
    if ((fieldsChanged & 4) != 0) {
      paramConfidenceScore_ = objSpeakerIdentificationSpeakerIdentifier1_->getConfidenceScore();
      if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(2); }
      if (onConfidenceScoreChanged) { onConfidenceScoreChanged(paramConfidenceScore_); }
    }
    if ((fieldsChanged & 8) != 0) {
      paramErrorMessage_ = objSpeakerIdentificationSpeakerIdentifier1_->getErrorMessage();
      if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(4); }
      if (onErrorMessageChanged) { onErrorMessageChanged(paramErrorMessage_); }
    }
    if ((fieldsChanged & 1) != 0) {
      paramIdentifiedSpeakerId_ = objSpeakerIdentificationSpeakerIdentifier1_->getIdentifiedSpeakerId();
      if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(8); }
      if (onIdentifiedSpeakerIdChanged) { onIdentifiedSpeakerIdChanged(paramIdentifiedSpeakerId_); }
    }
    if ((fieldsChanged & 2) != 0) {
      paramIdentifiedSpeakerName_ = objSpeakerIdentificationSpeakerIdentifier1_->getIdentifiedSpeakerName();
      if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(16); }
      if (onIdentifiedSpeakerNameChanged) { onIdentifiedSpeakerNameChanged(paramIdentifiedSpeakerName_); }
    }
  }

  void createObjects() {
    objAudioInputAudioInputSource0_ = datastoreAudioInput_->AudioInputSource->createObject();
    objSpeakerIdentificationSpeakerIdentifier1_ = datastoreSpeakerIdentification_->SpeakerIdentifier->createObject();
    objSpeakerIdentificationReferenceSpeaker5_ = datastoreSpeakerIdentification_->ReferenceSpeaker->createObject();
    objSpeakerIdentificationReferenceSpeaker2_ = datastoreSpeakerIdentification_->ReferenceSpeaker->createObject();
    objSpeakerIdentificationReferenceSpeaker3_ = datastoreSpeakerIdentification_->ReferenceSpeaker->createObject();
    objSpeakerIdentificationReferenceSpeaker4_ = datastoreSpeakerIdentification_->ReferenceSpeaker->createObject();
    objSpeakerIdentificationReferenceSpeakerAudioFile6_ = datastoreSpeakerIdentification_->ReferenceSpeakerAudioFile->createObject();
    objAudioInputAudioInputSource0_->setBindTo(static_cast<AudioInputDataStore::DeviceBindingType>(2));
    objAudioInputAudioInputSource0_->setFrameRate(16000);
    objAudioInputAudioInputSource0_->setNumChannels(2);
    objAudioInputAudioInputSource0_AudioSignalForwarder_ = std::make_shared<Xrpa::InboundSignalForwarder>();
    objAudioInputAudioInputSource0_->onAudioSignal(objAudioInputAudioInputSource0_AudioSignalForwarder_);
    objSpeakerIdentificationSpeakerIdentifier1_->setAudioSignalForwarder<float>(objAudioInputAudioInputSource0_AudioSignalForwarder_);
    objSpeakerIdentificationReferenceSpeaker5_->setSpeakerId("speaker6");
    objSpeakerIdentificationReferenceSpeaker5_->setSpeakerName("Speaker 6");
    objSpeakerIdentificationReferenceSpeaker5_->setSpeakerIdentifier(objSpeakerIdentificationSpeakerIdentifier1_->getXrpaId());
    objSpeakerIdentificationReferenceSpeaker5_->setFilePath("/Users/conorwdickinson/fbsource/arvr/libraries/xred/xrpa/demos/SpeakerIdentificationTest/samples/sample_6_excited.wav");
    objSpeakerIdentificationReferenceSpeaker2_->setSpeakerId("speaker1");
    objSpeakerIdentificationReferenceSpeaker2_->setSpeakerName("Speaker 1");
    objSpeakerIdentificationReferenceSpeaker2_->setSpeakerIdentifier(objSpeakerIdentificationSpeakerIdentifier1_->getXrpaId());
    objSpeakerIdentificationReferenceSpeaker2_->setFilePath("/Users/conorwdickinson/fbsource/arvr/libraries/xred/xrpa/demos/SpeakerIdentificationTest/samples/sample_1.wav");
    objSpeakerIdentificationReferenceSpeaker3_->setSpeakerId("speaker2");
    objSpeakerIdentificationReferenceSpeaker3_->setSpeakerName("Speaker 2");
    objSpeakerIdentificationReferenceSpeaker3_->setSpeakerIdentifier(objSpeakerIdentificationSpeakerIdentifier1_->getXrpaId());
    objSpeakerIdentificationReferenceSpeaker3_->setFilePath("/Users/conorwdickinson/fbsource/arvr/libraries/xred/xrpa/demos/SpeakerIdentificationTest/samples/sample_2.wav");
    objSpeakerIdentificationReferenceSpeaker4_->setSpeakerId("speaker3");
    objSpeakerIdentificationReferenceSpeaker4_->setSpeakerName("Kid Speaker");
    objSpeakerIdentificationReferenceSpeaker4_->setSpeakerIdentifier(objSpeakerIdentificationSpeakerIdentifier1_->getXrpaId());
    objSpeakerIdentificationReferenceSpeaker4_->setFilePath("/Users/conorwdickinson/fbsource/arvr/libraries/xred/xrpa/demos/SpeakerIdentificationTest/samples/sample_3_kid.wav");
    objSpeakerIdentificationReferenceSpeakerAudioFile6_->setFilePath("/Users/conorwdickinson/fbsource/arvr/libraries/xred/xrpa/demos/SpeakerIdentificationTest/samples/sample_6_neutral.wav");
    objSpeakerIdentificationReferenceSpeakerAudioFile6_->setSpeaker(objSpeakerIdentificationReferenceSpeaker5_->getXrpaId());
    objAudioInputAudioInputSource0_->onXrpaFieldsChanged([this](auto p0) { dispatchObjAudioInputAudioInputSource0_FieldsChanged(p0); });
    objSpeakerIdentificationSpeakerIdentifier1_->onXrpaFieldsChanged([this](auto p0) { dispatchObjSpeakerIdentificationSpeakerIdentifier1_FieldsChanged(p0); });
  }

  void destroyObjects() {
    if (objSpeakerIdentificationReferenceSpeakerAudioFile6_) {
      datastoreSpeakerIdentification_->ReferenceSpeakerAudioFile->removeObject(objSpeakerIdentificationReferenceSpeakerAudioFile6_->getXrpaId());
      objSpeakerIdentificationReferenceSpeakerAudioFile6_ = nullptr;
    }
    if (objSpeakerIdentificationReferenceSpeaker4_) {
      datastoreSpeakerIdentification_->ReferenceSpeaker->removeObject(objSpeakerIdentificationReferenceSpeaker4_->getXrpaId());
      objSpeakerIdentificationReferenceSpeaker4_ = nullptr;
    }
    if (objSpeakerIdentificationReferenceSpeaker3_) {
      datastoreSpeakerIdentification_->ReferenceSpeaker->removeObject(objSpeakerIdentificationReferenceSpeaker3_->getXrpaId());
      objSpeakerIdentificationReferenceSpeaker3_ = nullptr;
    }
    if (objSpeakerIdentificationReferenceSpeaker2_) {
      datastoreSpeakerIdentification_->ReferenceSpeaker->removeObject(objSpeakerIdentificationReferenceSpeaker2_->getXrpaId());
      objSpeakerIdentificationReferenceSpeaker2_ = nullptr;
    }
    if (objSpeakerIdentificationReferenceSpeaker5_) {
      datastoreSpeakerIdentification_->ReferenceSpeaker->removeObject(objSpeakerIdentificationReferenceSpeaker5_->getXrpaId());
      objSpeakerIdentificationReferenceSpeaker5_ = nullptr;
    }
    if (objSpeakerIdentificationSpeakerIdentifier1_) {
      datastoreSpeakerIdentification_->SpeakerIdentifier->removeObject(objSpeakerIdentificationSpeakerIdentifier1_->getXrpaId());
      objSpeakerIdentificationSpeakerIdentifier1_ = nullptr;
    }
    if (objAudioInputAudioInputSource0_) {
      datastoreAudioInput_->AudioInputSource->removeObject(objAudioInputAudioInputSource0_->getXrpaId());
      objAudioInputAudioInputSource0_ = nullptr;
    }
  }

  std::shared_ptr<AudioInputDataStore::AudioInputDataStore> datastoreAudioInput_;
  std::shared_ptr<SpeakerIdentificationDataStore::SpeakerIdentificationDataStore> datastoreSpeakerIdentification_;

  // Error message if audio input failed
  std::string paramAudioErrorMessage_ = "";

  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;

  // Confidence score of the match (0-1)
  int paramConfidenceScore_ = 0;

  // Error message if identification failed
  std::string paramErrorMessage_ = "";

  // ID of the identified speaker, empty if no match
  std::string paramIdentifiedSpeakerId_ = "";

  // Name of the identified speaker, empty if no match
  std::string paramIdentifiedSpeakerName_ = "";

  // Whether audio input is currently active
  bool paramIsActive_ = false;

  std::shared_ptr<AudioInputDataStore::OutboundAudioInputSource> objAudioInputAudioInputSource0_;
  std::shared_ptr<SpeakerIdentificationDataStore::OutboundSpeakerIdentifier> objSpeakerIdentificationSpeakerIdentifier1_;
  std::shared_ptr<SpeakerIdentificationDataStore::OutboundReferenceSpeaker> objSpeakerIdentificationReferenceSpeaker5_;
  std::shared_ptr<SpeakerIdentificationDataStore::OutboundReferenceSpeaker> objSpeakerIdentificationReferenceSpeaker2_;
  std::shared_ptr<SpeakerIdentificationDataStore::OutboundReferenceSpeaker> objSpeakerIdentificationReferenceSpeaker3_;
  std::shared_ptr<SpeakerIdentificationDataStore::OutboundReferenceSpeaker> objSpeakerIdentificationReferenceSpeaker4_;
  std::shared_ptr<SpeakerIdentificationDataStore::OutboundReferenceSpeakerAudioFile> objSpeakerIdentificationReferenceSpeakerAudioFile6_;
  std::shared_ptr<Xrpa::InboundSignalForwarder> objAudioInputAudioInputSource0_AudioSignalForwarder_;
};

} // namespace XrpaDataflowPrograms
