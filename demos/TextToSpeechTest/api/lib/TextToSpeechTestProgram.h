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

#include "SignalProcessingDataStore.h"
#include "TextToSpeechDataStore.h"
#include <chrono>
#include <functional>
#include <string>
#include <xrpa-runtime/signals/InboundSignalForwarder.h>

namespace XrpaDataflowPrograms {

class TextToSpeechTestProgram {
 public:
  TextToSpeechTestProgram(std::shared_ptr<SignalProcessingDataStore::SignalProcessingDataStore> datastoreSignalProcessing, std::shared_ptr<TextToSpeechDataStore::TextToSpeechDataStore> datastoreTextToSpeech) : datastoreSignalProcessing_(datastoreSignalProcessing), datastoreTextToSpeech_(datastoreTextToSpeech) {
    createObjects();
  }

  ~TextToSpeechTestProgram() {
    destroyObjects();
  }

  void sendText(const std::string& text, int id) {
    if (objTextToSpeechTextToSpeech0_) {
      objTextToSpeechTextToSpeech0_->sendTextRequest(text, id);
    }
  }

  void onTtsResponse(std::function<void(uint64_t, int, bool, const std::string&, std::chrono::nanoseconds)> handler) {
    paramTtsResponse_ = handler;
  }

  void terminate() {
    destroyObjects();
  }

 private:
  void dispatchObjTextToSpeechTextToSpeech0_TtsResponse(uint64_t msgTimestamp, TextToSpeechDataStore::TtsResponseReader msg) {
    auto id = msg.getId();
    auto success = msg.getSuccess();
    auto errorMessage = msg.getErrorMessage();
    auto playbackStartTimestamp = msg.getPlaybackStartTimestamp();
    if (paramTtsResponse_) {
      paramTtsResponse_(msgTimestamp, id, success, errorMessage, playbackStartTimestamp);
    }
  }

  void createObjects() {
    objTextToSpeechTextToSpeech0_ = datastoreTextToSpeech_->TextToSpeech->createObject();
    objSignalProcessingSignalSource1_ = datastoreSignalProcessing_->SignalSource->createObject();
    objSignalProcessingSignalOutputDevice2_ = datastoreSignalProcessing_->SignalOutputDevice->createObject();
    objSignalProcessingSignalSource1_->setNumChannels(2);
    objTextToSpeechTextToSpeech0_AudioForwarder_ = std::make_shared<Xrpa::InboundSignalForwarder>();
    objTextToSpeechTextToSpeech0_->onAudio(objTextToSpeechTextToSpeech0_AudioForwarder_);
    objSignalProcessingSignalSource1_->setSrcDataForwarder<float>(objTextToSpeechTextToSpeech0_AudioForwarder_);
    objSignalProcessingSignalSource1_->setNumOutputs(1);
    objSignalProcessingSignalOutputDevice2_->setSrcNode(objSignalProcessingSignalSource1_->getXrpaId());
    objSignalProcessingSignalOutputDevice2_->setDeviceNameFilter("MacBook Pro Speakers");
    objSignalProcessingSignalOutputDevice2_->setChannelOffset(0);
    objTextToSpeechTextToSpeech0_->onTtsResponse([this](auto p0, auto p1) { dispatchObjTextToSpeechTextToSpeech0_TtsResponse(p0, p1); });
  }

  void destroyObjects() {
    if (objSignalProcessingSignalOutputDevice2_) {
      datastoreSignalProcessing_->SignalOutputDevice->removeObject(objSignalProcessingSignalOutputDevice2_->getXrpaId());
      objSignalProcessingSignalOutputDevice2_ = nullptr;
    }
    if (objSignalProcessingSignalSource1_) {
      datastoreSignalProcessing_->SignalSource->removeObject(objSignalProcessingSignalSource1_->getXrpaId());
      objSignalProcessingSignalSource1_ = nullptr;
    }
    if (objTextToSpeechTextToSpeech0_) {
      datastoreTextToSpeech_->TextToSpeech->removeObject(objTextToSpeechTextToSpeech0_->getXrpaId());
      objTextToSpeechTextToSpeech0_ = nullptr;
    }
  }

  std::shared_ptr<SignalProcessingDataStore::SignalProcessingDataStore> datastoreSignalProcessing_;
  std::shared_ptr<TextToSpeechDataStore::TextToSpeechDataStore> datastoreTextToSpeech_;
  std::function<void(uint64_t, int, bool, const std::string&, std::chrono::nanoseconds)> paramTtsResponse_ = nullptr;
  std::shared_ptr<TextToSpeechDataStore::OutboundTextToSpeech> objTextToSpeechTextToSpeech0_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalSource> objSignalProcessingSignalSource1_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalOutputDevice> objSignalProcessingSignalOutputDevice2_;
  std::shared_ptr<Xrpa::InboundSignalForwarder> objTextToSpeechTextToSpeech0_AudioForwarder_;
};

} // namespace XrpaDataflowPrograms
