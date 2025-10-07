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
#include "SignalProcessingDataStore.h"
#include <functional>
#include <string>
#include <xrpa-runtime/signals/InboundSignalForwarder.h>

namespace XrpaDataflowPrograms {

class AudioInputTestProgram {
 public:
  AudioInputTestProgram(std::shared_ptr<AudioInputDataStore::AudioInputDataStore> datastoreAudioInput, std::shared_ptr<SignalProcessingDataStore::SignalProcessingDataStore> datastoreSignalProcessing) : datastoreAudioInput_(datastoreAudioInput), datastoreSignalProcessing_(datastoreSignalProcessing) {
    createObjects();
  }

  ~AudioInputTestProgram() {
    destroyObjects();
  }

  std::function<void(std::string)> onErrorMessageChanged = nullptr;
  std::function<void(bool)> onIsActiveChanged = nullptr;

  // Error message if audio input failed
  const std::string& getErrorMessage() const {
    return paramErrorMessage_;
  }

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  inline bool checkErrorMessageChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  // Whether audio input is currently active
  bool getIsActive() const {
    return paramIsActive_;
  }

  inline bool checkIsActiveChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  void terminate() {
    destroyObjects();
  }

 private:
  void dispatchObjAudioInputAudioInputSource0_FieldsChanged(uint64_t fieldsChanged) {
    if ((fieldsChanged & 256) != 0) {
      paramErrorMessage_ = objAudioInputAudioInputSource0_->getErrorMessage();
      if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(1); }
      if (onErrorMessageChanged) { onErrorMessageChanged(paramErrorMessage_); }
    }
    if ((fieldsChanged & 128) != 0) {
      paramIsActive_ = objAudioInputAudioInputSource0_->getIsActive();
      if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(2); }
      if (onIsActiveChanged) { onIsActiveChanged(paramIsActive_); }
    }
  }

  void createObjects() {
    objAudioInputAudioInputSource0_ = datastoreAudioInput_->AudioInputSource->createObject();
    objSignalProcessingSignalSource1_ = datastoreSignalProcessing_->SignalSource->createObject();
    objSignalProcessingSignalChannelStack2_ = datastoreSignalProcessing_->SignalChannelStack->createObject();
    objSignalProcessingSignalOutputDevice3_ = datastoreSignalProcessing_->SignalOutputDevice->createObject();
    objAudioInputAudioInputSource0_->setBindTo(static_cast<AudioInputDataStore::DeviceBindingType>(3));
    objAudioInputAudioInputSource0_->setHostname("192.168.68.80");
    objAudioInputAudioInputSource0_->setPort(12345);
    objAudioInputAudioInputSource0_->setFrameRate(16000);
    objAudioInputAudioInputSource0_->setNumChannels(1);
    objSignalProcessingSignalSource1_->setNumChannels(1);
    objAudioInputAudioInputSource0_AudioSignalForwarder_ = std::make_shared<Xrpa::InboundSignalForwarder>();
    objAudioInputAudioInputSource0_->onAudioSignal(objAudioInputAudioInputSource0_AudioSignalForwarder_);
    objSignalProcessingSignalSource1_->setSrcDataForwarder<float>(objAudioInputAudioInputSource0_AudioSignalForwarder_);
    objSignalProcessingSignalSource1_->setNumOutputs(2);
    objSignalProcessingSignalChannelStack2_->setSrcNode0(objSignalProcessingSignalSource1_->getXrpaId());
    objSignalProcessingSignalChannelStack2_->setSrcNode1(objSignalProcessingSignalSource1_->getXrpaId());
    objSignalProcessingSignalChannelStack2_->setNumChannels(2);
    objSignalProcessingSignalChannelStack2_->setNumOutputs(1);
    objSignalProcessingSignalOutputDevice3_->setSrcNode(objSignalProcessingSignalChannelStack2_->getXrpaId());
    objSignalProcessingSignalOutputDevice3_->setDeviceNameFilter("Headphones");
    objSignalProcessingSignalOutputDevice3_->setChannelOffset(0);
    objAudioInputAudioInputSource0_->onXrpaFieldsChanged([this](auto p0) { dispatchObjAudioInputAudioInputSource0_FieldsChanged(p0); });
  }

  void destroyObjects() {
    if (objSignalProcessingSignalOutputDevice3_) {
      datastoreSignalProcessing_->SignalOutputDevice->removeObject(objSignalProcessingSignalOutputDevice3_->getXrpaId());
      objSignalProcessingSignalOutputDevice3_ = nullptr;
    }
    if (objSignalProcessingSignalChannelStack2_) {
      datastoreSignalProcessing_->SignalChannelStack->removeObject(objSignalProcessingSignalChannelStack2_->getXrpaId());
      objSignalProcessingSignalChannelStack2_ = nullptr;
    }
    if (objSignalProcessingSignalSource1_) {
      datastoreSignalProcessing_->SignalSource->removeObject(objSignalProcessingSignalSource1_->getXrpaId());
      objSignalProcessingSignalSource1_ = nullptr;
    }
    if (objAudioInputAudioInputSource0_) {
      datastoreAudioInput_->AudioInputSource->removeObject(objAudioInputAudioInputSource0_->getXrpaId());
      objAudioInputAudioInputSource0_ = nullptr;
    }
  }

  std::shared_ptr<AudioInputDataStore::AudioInputDataStore> datastoreAudioInput_;
  std::shared_ptr<SignalProcessingDataStore::SignalProcessingDataStore> datastoreSignalProcessing_;

  // Error message if audio input failed
  std::string paramErrorMessage_ = "";

  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;

  // Whether audio input is currently active
  bool paramIsActive_ = false;

  std::shared_ptr<AudioInputDataStore::OutboundAudioInputSource> objAudioInputAudioInputSource0_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalSource> objSignalProcessingSignalSource1_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalChannelStack> objSignalProcessingSignalChannelStack2_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalOutputDevice> objSignalProcessingSignalOutputDevice3_;
  std::shared_ptr<Xrpa::InboundSignalForwarder> objAudioInputAudioInputSource0_AudioSignalForwarder_;
};

} // namespace XrpaDataflowPrograms
