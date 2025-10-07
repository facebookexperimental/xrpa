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

#include "SignalOutputDataStore.h"
#include "SignalOutputTypes.h"
#include "SignalProcessingDataStore.h"
#include "SignalProcessingTypes.h"
#include <string>
#include <xrpa-runtime/signals/InboundSignalForwarder.h>

namespace XrpaDataflowPrograms {

class TestSignal2 {
 public:
  TestSignal2(std::shared_ptr<SignalOutputDataStore::SignalOutputDataStore> datastoreSignalOutput, std::shared_ptr<SignalProcessingDataStore::SignalProcessingDataStore> datastoreSignalProcessing) : datastoreSignalOutput_(datastoreSignalOutput), datastoreSignalProcessing_(datastoreSignalProcessing) {
    createObjects();
  }

  ~TestSignal2() {
    destroyObjects();
  }

  void terminate() {
    destroyObjects();
  }

 private:
  void createObjects() {
    objSignalProcessingSignalEvent1_ = datastoreSignalProcessing_->SignalEvent->createObject();
    objSignalProcessingSignalDelay7_ = datastoreSignalProcessing_->SignalDelay->createObject();
    objSignalProcessingSignalCurve0_ = datastoreSignalProcessing_->SignalCurve->createObject();
    objSignalProcessingSignalOscillator2_ = datastoreSignalProcessing_->SignalOscillator->createObject();
    objSignalProcessingSignalFeedback4_ = datastoreSignalProcessing_->SignalFeedback->createObject();
    objSignalProcessingSignalMathOp3_ = datastoreSignalProcessing_->SignalMathOp->createObject();
    objSignalProcessingSignalMathOp5_ = datastoreSignalProcessing_->SignalMathOp->createObject();
    objSignalProcessingSignalMathOp6_ = datastoreSignalProcessing_->SignalMathOp->createObject();
    objSignalProcessingSignalSoftClip9_ = datastoreSignalProcessing_->SignalSoftClip->createObject();
    objSignalProcessingSignalOutputData10_ = datastoreSignalProcessing_->SignalOutputData->createObject();
    objSignalProcessingSignalOutputDevice8_ = datastoreSignalProcessing_->SignalOutputDevice->createObject();
    objSignalOutputSignalOutputSource11_ = datastoreSignalOutput_->SignalOutputSource->createObject();
    objSignalProcessingSignalDelay7_->setSrcNode(objSignalProcessingSignalMathOp6_->getXrpaId());
    objSignalProcessingSignalDelay7_->setDelayTimeMs(500.f);
    objSignalProcessingSignalDelay7_->setNumChannels(1);
    objSignalProcessingSignalDelay7_->setNumOutputs(1);
    objSignalProcessingSignalCurve0_->setSoftCurve(true);
    objSignalProcessingSignalCurve0_->setNumSegments(5);
    objSignalProcessingSignalCurve0_->setStartValue(0.f);
    objSignalProcessingSignalCurve0_->setSegmentLength0(0.f);
    objSignalProcessingSignalCurve0_->setSegmentEndValue0(0.f);
    objSignalProcessingSignalCurve0_->setSegmentLength1(0.25f);
    objSignalProcessingSignalCurve0_->setSegmentEndValue1(1.f);
    objSignalProcessingSignalCurve0_->setSegmentLength2(0.5f);
    objSignalProcessingSignalCurve0_->setSegmentEndValue2(1.f);
    objSignalProcessingSignalCurve0_->setSegmentLength3(0.25f);
    objSignalProcessingSignalCurve0_->setSegmentEndValue3(0.f);
    objSignalProcessingSignalCurve0_->setSegmentLength4(2.f);
    objSignalProcessingSignalCurve0_->setSegmentEndValue4(0.f);
    objSignalProcessingSignalCurve0_->setAutoStart(true);
    objSignalProcessingSignalCurve0_->setAutoLoop(false);
    objSignalProcessingSignalCurve0_->setOnDoneEvent(objSignalProcessingSignalEvent1_->getXrpaId());
    objSignalProcessingSignalCurve0_->setStartEvent(objSignalProcessingSignalEvent1_->getXrpaId());
    objSignalProcessingSignalCurve0_->setNumOutputs(1);
    objSignalProcessingSignalOscillator2_->setNumChannels(1);
    objSignalProcessingSignalOscillator2_->setWaveformType(static_cast<SignalProcessingDataStore::WaveformType>(3));
    objSignalProcessingSignalOscillator2_->setFrequency(450.f);
    objSignalProcessingSignalOscillator2_->setPulseWidth(0.5f);
    objSignalProcessingSignalOscillator2_->setNumOutputs(1);
    objSignalProcessingSignalFeedback4_->setNumOutputs(1);
    objSignalProcessingSignalFeedback4_->setSrcNode(objSignalProcessingSignalDelay7_->getXrpaId());
    objSignalProcessingSignalFeedback4_->setNumChannels(1);
    objSignalProcessingSignalMathOp3_->setOperation(static_cast<SignalProcessingDataStore::MathOperation>(1));
    objSignalProcessingSignalMathOp3_->setOperandANode(objSignalProcessingSignalOscillator2_->getXrpaId());
    objSignalProcessingSignalMathOp3_->setOperandBNode(objSignalProcessingSignalCurve0_->getXrpaId());
    objSignalProcessingSignalMathOp3_->setNumChannels(1);
    objSignalProcessingSignalMathOp3_->setNumOutputs(1);
    objSignalProcessingSignalMathOp5_->setOperation(static_cast<SignalProcessingDataStore::MathOperation>(1));
    objSignalProcessingSignalMathOp5_->setOperandANode(objSignalProcessingSignalFeedback4_->getXrpaId());
    objSignalProcessingSignalMathOp5_->setOperandB(0.25f);
    objSignalProcessingSignalMathOp5_->setNumChannels(0);
    objSignalProcessingSignalMathOp5_->setNumOutputs(1);
    objSignalProcessingSignalMathOp6_->setOperation(static_cast<SignalProcessingDataStore::MathOperation>(0));
    objSignalProcessingSignalMathOp6_->setOperandANode(objSignalProcessingSignalMathOp5_->getXrpaId());
    objSignalProcessingSignalMathOp6_->setOperandBNode(objSignalProcessingSignalMathOp3_->getXrpaId());
    objSignalProcessingSignalMathOp6_->setNumChannels(1);
    objSignalProcessingSignalMathOp6_->setNumOutputs(3);
    objSignalProcessingSignalSoftClip9_->setSrcNode(objSignalProcessingSignalMathOp6_->getXrpaId());
    objSignalProcessingSignalSoftClip9_->setNumChannels(1);
    objSignalProcessingSignalSoftClip9_->setNumOutputs(1);
    objSignalProcessingSignalOutputData10_->setSrcNode(objSignalProcessingSignalSoftClip9_->getXrpaId());
    objSignalProcessingSignalOutputData10_->setNumChannels(1);
    objSignalProcessingSignalOutputData10_->setFrameRate(16000);
    objSignalProcessingSignalOutputDevice8_->setSrcNode(objSignalProcessingSignalMathOp6_->getXrpaId());
    objSignalProcessingSignalOutputDevice8_->setDeviceNameFilter("Headphones");
    objSignalProcessingSignalOutputDevice8_->setChannelOffset(0);
    objSignalOutputSignalOutputSource11_->setBindTo(static_cast<SignalOutputDataStore::DeviceBindingType>(3));
    objSignalOutputSignalOutputSource11_->setHostname("192.168.68.80");
    objSignalOutputSignalOutputSource11_->setPort(12346);
    objSignalProcessingSignalOutputData10_DataForwarder_ = std::make_shared<Xrpa::InboundSignalForwarder>();
    objSignalProcessingSignalOutputData10_->onData(objSignalProcessingSignalOutputData10_DataForwarder_);
    objSignalOutputSignalOutputSource11_->setSignalForwarder<float>(objSignalProcessingSignalOutputData10_DataForwarder_);
  }

  void destroyObjects() {
    if (objSignalOutputSignalOutputSource11_) {
      datastoreSignalOutput_->SignalOutputSource->removeObject(objSignalOutputSignalOutputSource11_->getXrpaId());
      objSignalOutputSignalOutputSource11_ = nullptr;
    }
    if (objSignalProcessingSignalOutputDevice8_) {
      datastoreSignalProcessing_->SignalOutputDevice->removeObject(objSignalProcessingSignalOutputDevice8_->getXrpaId());
      objSignalProcessingSignalOutputDevice8_ = nullptr;
    }
    if (objSignalProcessingSignalOutputData10_) {
      datastoreSignalProcessing_->SignalOutputData->removeObject(objSignalProcessingSignalOutputData10_->getXrpaId());
      objSignalProcessingSignalOutputData10_ = nullptr;
    }
    if (objSignalProcessingSignalSoftClip9_) {
      datastoreSignalProcessing_->SignalSoftClip->removeObject(objSignalProcessingSignalSoftClip9_->getXrpaId());
      objSignalProcessingSignalSoftClip9_ = nullptr;
    }
    if (objSignalProcessingSignalMathOp6_) {
      datastoreSignalProcessing_->SignalMathOp->removeObject(objSignalProcessingSignalMathOp6_->getXrpaId());
      objSignalProcessingSignalMathOp6_ = nullptr;
    }
    if (objSignalProcessingSignalMathOp5_) {
      datastoreSignalProcessing_->SignalMathOp->removeObject(objSignalProcessingSignalMathOp5_->getXrpaId());
      objSignalProcessingSignalMathOp5_ = nullptr;
    }
    if (objSignalProcessingSignalMathOp3_) {
      datastoreSignalProcessing_->SignalMathOp->removeObject(objSignalProcessingSignalMathOp3_->getXrpaId());
      objSignalProcessingSignalMathOp3_ = nullptr;
    }
    if (objSignalProcessingSignalFeedback4_) {
      datastoreSignalProcessing_->SignalFeedback->removeObject(objSignalProcessingSignalFeedback4_->getXrpaId());
      objSignalProcessingSignalFeedback4_ = nullptr;
    }
    if (objSignalProcessingSignalOscillator2_) {
      datastoreSignalProcessing_->SignalOscillator->removeObject(objSignalProcessingSignalOscillator2_->getXrpaId());
      objSignalProcessingSignalOscillator2_ = nullptr;
    }
    if (objSignalProcessingSignalCurve0_) {
      datastoreSignalProcessing_->SignalCurve->removeObject(objSignalProcessingSignalCurve0_->getXrpaId());
      objSignalProcessingSignalCurve0_ = nullptr;
    }
    if (objSignalProcessingSignalDelay7_) {
      datastoreSignalProcessing_->SignalDelay->removeObject(objSignalProcessingSignalDelay7_->getXrpaId());
      objSignalProcessingSignalDelay7_ = nullptr;
    }
    if (objSignalProcessingSignalEvent1_) {
      datastoreSignalProcessing_->SignalEvent->removeObject(objSignalProcessingSignalEvent1_->getXrpaId());
      objSignalProcessingSignalEvent1_ = nullptr;
    }
  }

  std::shared_ptr<SignalOutputDataStore::SignalOutputDataStore> datastoreSignalOutput_;
  std::shared_ptr<SignalProcessingDataStore::SignalProcessingDataStore> datastoreSignalProcessing_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalEvent> objSignalProcessingSignalEvent1_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalDelay> objSignalProcessingSignalDelay7_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalCurve> objSignalProcessingSignalCurve0_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalOscillator> objSignalProcessingSignalOscillator2_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalFeedback> objSignalProcessingSignalFeedback4_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalMathOp> objSignalProcessingSignalMathOp3_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalMathOp> objSignalProcessingSignalMathOp5_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalMathOp> objSignalProcessingSignalMathOp6_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalSoftClip> objSignalProcessingSignalSoftClip9_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalOutputData> objSignalProcessingSignalOutputData10_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalOutputDevice> objSignalProcessingSignalOutputDevice8_;
  std::shared_ptr<SignalOutputDataStore::OutboundSignalOutputSource> objSignalOutputSignalOutputSource11_;
  std::shared_ptr<Xrpa::InboundSignalForwarder> objSignalProcessingSignalOutputData10_DataForwarder_;
};

} // namespace XrpaDataflowPrograms
