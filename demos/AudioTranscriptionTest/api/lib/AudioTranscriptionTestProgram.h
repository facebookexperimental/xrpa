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
#include <chrono>
#include <functional>
#include <string>
#include <xrpa-runtime/signals/InboundSignalForwarder.h>

namespace XrpaDataflowPrograms {

class AudioTranscriptionTestProgram {
 public:
  AudioTranscriptionTestProgram(std::shared_ptr<AudioInputDataStore::AudioInputDataStore> datastoreAudioInput, std::shared_ptr<AudioTranscriptionDataStore::AudioTranscriptionDataStore> datastoreAudioTranscription) : datastoreAudioInput_(datastoreAudioInput), datastoreAudioTranscription_(datastoreAudioTranscription) {
    createObjects();
  }

  ~AudioTranscriptionTestProgram() {
    destroyObjects();
  }

  std::function<void(std::string)> onAudioErrorMessageChanged = nullptr;
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

  // Whether audio input is currently active
  bool getIsActive() const {
    return paramIsActive_;
  }

  inline bool checkIsActiveChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  void onTranscriptionResult(std::function<void(uint64_t, const std::string&, std::chrono::nanoseconds, bool, const std::string&)> handler) {
    paramTranscriptionResult_ = handler;
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
      if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(2); }
      if (onIsActiveChanged) { onIsActiveChanged(paramIsActive_); }
    }
  }

  void dispatchObjAudioTranscriptionAudioTranscription1_TranscriptionResult(uint64_t msgTimestamp, AudioTranscriptionDataStore::TranscriptionResultReader msg) {
    auto text = msg.getText();
    auto timestamp = msg.getTimestamp();
    auto success = msg.getSuccess();
    auto errorMessage = msg.getErrorMessage();
    if (paramTranscriptionResult_) {
      paramTranscriptionResult_(msgTimestamp, text, timestamp, success, errorMessage);
    }
  }

  void createObjects() {
    objAudioInputAudioInputSource0_ = datastoreAudioInput_->AudioInputSource->createObject();
    objAudioTranscriptionAudioTranscription1_ = datastoreAudioTranscription_->AudioTranscription->createObject();
    objAudioInputAudioInputSource0_->setBindTo(static_cast<AudioInputDataStore::DeviceBindingType>(2));
    objAudioInputAudioInputSource0_->setFrameRate(16000);
    objAudioInputAudioInputSource0_->setNumChannels(1);
    objAudioInputAudioInputSource0_AudioSignalForwarder_ = std::make_shared<Xrpa::InboundSignalForwarder>();
    objAudioInputAudioInputSource0_->onAudioSignal(objAudioInputAudioInputSource0_AudioSignalForwarder_);
    objAudioTranscriptionAudioTranscription1_->setAudioSignalForwarder<float>(objAudioInputAudioInputSource0_AudioSignalForwarder_);
    objAudioInputAudioInputSource0_->onXrpaFieldsChanged([this](auto p0) { dispatchObjAudioInputAudioInputSource0_FieldsChanged(p0); });
    objAudioTranscriptionAudioTranscription1_->onTranscriptionResult([this](auto p0, auto p1) { dispatchObjAudioTranscriptionAudioTranscription1_TranscriptionResult(p0, p1); });
  }

  void destroyObjects() {
    if (objAudioTranscriptionAudioTranscription1_) {
      datastoreAudioTranscription_->AudioTranscription->removeObject(objAudioTranscriptionAudioTranscription1_->getXrpaId());
      objAudioTranscriptionAudioTranscription1_ = nullptr;
    }
    if (objAudioInputAudioInputSource0_) {
      datastoreAudioInput_->AudioInputSource->removeObject(objAudioInputAudioInputSource0_->getXrpaId());
      objAudioInputAudioInputSource0_ = nullptr;
    }
  }

  std::shared_ptr<AudioInputDataStore::AudioInputDataStore> datastoreAudioInput_;
  std::shared_ptr<AudioTranscriptionDataStore::AudioTranscriptionDataStore> datastoreAudioTranscription_;

  // Error message if audio input failed
  std::string paramAudioErrorMessage_ = "";

  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;

  // Whether audio input is currently active
  bool paramIsActive_ = false;

  std::function<void(uint64_t, const std::string&, std::chrono::nanoseconds, bool, const std::string&)> paramTranscriptionResult_ = nullptr;
  std::shared_ptr<AudioInputDataStore::OutboundAudioInputSource> objAudioInputAudioInputSource0_;
  std::shared_ptr<AudioTranscriptionDataStore::OutboundAudioTranscription> objAudioTranscriptionAudioTranscription1_;
  std::shared_ptr<Xrpa::InboundSignalForwarder> objAudioInputAudioInputSource0_AudioSignalForwarder_;
};

} // namespace XrpaDataflowPrograms
