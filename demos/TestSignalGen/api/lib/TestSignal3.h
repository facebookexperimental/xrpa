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

class TestSignal3 {
 public:
  TestSignal3(std::shared_ptr<SignalOutputDataStore::SignalOutputDataStore> datastoreSignalOutput, std::shared_ptr<SignalProcessingDataStore::SignalProcessingDataStore> datastoreSignalProcessing) : datastoreSignalOutput_(datastoreSignalOutput), datastoreSignalProcessing_(datastoreSignalProcessing) {
    createObjects();
  }

  ~TestSignal3() {
    destroyObjects();
  }

  void terminate() {
    destroyObjects();
  }

 private:
  void createObjects() {
    objSignalProcessingSignalParametricEqualizer5_ = datastoreSignalProcessing_->SignalParametricEqualizer->createObject();
    objSignalProcessingSignalDelay6_ = datastoreSignalProcessing_->SignalDelay->createObject();
    objSignalProcessingSignalSourceFile0_ = datastoreSignalProcessing_->SignalSourceFile->createObject();
    objSignalProcessingSignalFeedback1_ = datastoreSignalProcessing_->SignalFeedback->createObject();
    objSignalProcessingSignalMathOp3_ = datastoreSignalProcessing_->SignalMathOp->createObject();
    objSignalProcessingSignalParametricEqualizer2_ = datastoreSignalProcessing_->SignalParametricEqualizer->createObject();
    objSignalProcessingSignalMathOp4_ = datastoreSignalProcessing_->SignalMathOp->createObject();
    objSignalProcessingSignalPitchShift7_ = datastoreSignalProcessing_->SignalPitchShift->createObject();
    objSignalProcessingSignalPitchShift8_ = datastoreSignalProcessing_->SignalPitchShift->createObject();
    objSignalProcessingSignalPitchShift9_ = datastoreSignalProcessing_->SignalPitchShift->createObject();
    objSignalProcessingSignalMathOp10_ = datastoreSignalProcessing_->SignalMathOp->createObject();
    objSignalProcessingSignalMathOp11_ = datastoreSignalProcessing_->SignalMathOp->createObject();
    objSignalProcessingSignalSoftClip13_ = datastoreSignalProcessing_->SignalSoftClip->createObject();
    objSignalProcessingSignalOutputData14_ = datastoreSignalProcessing_->SignalOutputData->createObject();
    objSignalProcessingSignalOutputDevice12_ = datastoreSignalProcessing_->SignalOutputDevice->createObject();
    objSignalOutputSignalOutputSource15_ = datastoreSignalOutput_->SignalOutputSource->createObject();
    objSignalProcessingSignalParametricEqualizer5_->setSrcNode(objSignalProcessingSignalMathOp4_->getXrpaId());
    objSignalProcessingSignalParametricEqualizer5_->setFilterType0(static_cast<SignalProcessingDataStore::FilterType>(4));
    objSignalProcessingSignalParametricEqualizer5_->setFrequency0(500.f);
    objSignalProcessingSignalParametricEqualizer5_->setQuality0(1.f);
    objSignalProcessingSignalParametricEqualizer5_->setGain0(0.f);
    objSignalProcessingSignalParametricEqualizer5_->setFilterType1(static_cast<SignalProcessingDataStore::FilterType>(0));
    objSignalProcessingSignalParametricEqualizer5_->setFrequency1(50.f);
    objSignalProcessingSignalParametricEqualizer5_->setQuality1(0.7076f);
    objSignalProcessingSignalParametricEqualizer5_->setGain1(0.f);
    objSignalProcessingSignalParametricEqualizer5_->setFilterType2(static_cast<SignalProcessingDataStore::FilterType>(0));
    objSignalProcessingSignalParametricEqualizer5_->setFrequency2(50.f);
    objSignalProcessingSignalParametricEqualizer5_->setQuality2(0.7076f);
    objSignalProcessingSignalParametricEqualizer5_->setGain2(0.f);
    objSignalProcessingSignalParametricEqualizer5_->setFilterType3(static_cast<SignalProcessingDataStore::FilterType>(0));
    objSignalProcessingSignalParametricEqualizer5_->setFrequency3(50.f);
    objSignalProcessingSignalParametricEqualizer5_->setQuality3(0.7076f);
    objSignalProcessingSignalParametricEqualizer5_->setGain3(0.f);
    objSignalProcessingSignalParametricEqualizer5_->setFilterType4(static_cast<SignalProcessingDataStore::FilterType>(0));
    objSignalProcessingSignalParametricEqualizer5_->setFrequency4(50.f);
    objSignalProcessingSignalParametricEqualizer5_->setQuality4(0.7076f);
    objSignalProcessingSignalParametricEqualizer5_->setGain4(0.f);
    objSignalProcessingSignalParametricEqualizer5_->setGainAdjust(0.f);
    objSignalProcessingSignalParametricEqualizer5_->setNumChannels(2);
    objSignalProcessingSignalParametricEqualizer5_->setNumOutputs(1);
    objSignalProcessingSignalDelay6_->setSrcNode(objSignalProcessingSignalParametricEqualizer5_->getXrpaId());
    objSignalProcessingSignalDelay6_->setDelayTimeMs(250.f);
    objSignalProcessingSignalDelay6_->setNumChannels(2);
    objSignalProcessingSignalDelay6_->setNumOutputs(1);
    objSignalProcessingSignalSourceFile0_->setFilePath("/Users/archanapradeep/fbsource/arvr/libraries/xred/xrpa/demos/TestSignalGen/assets/test.wav");
    objSignalProcessingSignalSourceFile0_->setAutoPlay(true);
    objSignalProcessingSignalSourceFile0_->setNumOutputs(1);
    objSignalProcessingSignalFeedback1_->setNumOutputs(1);
    objSignalProcessingSignalFeedback1_->setSrcNode(objSignalProcessingSignalDelay6_->getXrpaId());
    objSignalProcessingSignalFeedback1_->setNumChannels(2);
    objSignalProcessingSignalMathOp3_->setOperation(static_cast<SignalProcessingDataStore::MathOperation>(1));
    objSignalProcessingSignalMathOp3_->setOperandANode(objSignalProcessingSignalFeedback1_->getXrpaId());
    objSignalProcessingSignalMathOp3_->setOperandB(0.25f);
    objSignalProcessingSignalMathOp3_->setNumChannels(0);
    objSignalProcessingSignalMathOp3_->setNumOutputs(1);
    objSignalProcessingSignalParametricEqualizer2_->setSrcNode(objSignalProcessingSignalSourceFile0_->getXrpaId());
    objSignalProcessingSignalParametricEqualizer2_->setFilterType0(static_cast<SignalProcessingDataStore::FilterType>(5));
    objSignalProcessingSignalParametricEqualizer2_->setFrequency0(1000.f);
    objSignalProcessingSignalParametricEqualizer2_->setQuality0(1.f);
    objSignalProcessingSignalParametricEqualizer2_->setGain0(0.f);
    objSignalProcessingSignalParametricEqualizer2_->setFilterType1(static_cast<SignalProcessingDataStore::FilterType>(0));
    objSignalProcessingSignalParametricEqualizer2_->setFrequency1(50.f);
    objSignalProcessingSignalParametricEqualizer2_->setQuality1(0.7076f);
    objSignalProcessingSignalParametricEqualizer2_->setGain1(0.f);
    objSignalProcessingSignalParametricEqualizer2_->setFilterType2(static_cast<SignalProcessingDataStore::FilterType>(0));
    objSignalProcessingSignalParametricEqualizer2_->setFrequency2(50.f);
    objSignalProcessingSignalParametricEqualizer2_->setQuality2(0.7076f);
    objSignalProcessingSignalParametricEqualizer2_->setGain2(0.f);
    objSignalProcessingSignalParametricEqualizer2_->setFilterType3(static_cast<SignalProcessingDataStore::FilterType>(0));
    objSignalProcessingSignalParametricEqualizer2_->setFrequency3(50.f);
    objSignalProcessingSignalParametricEqualizer2_->setQuality3(0.7076f);
    objSignalProcessingSignalParametricEqualizer2_->setGain3(0.f);
    objSignalProcessingSignalParametricEqualizer2_->setFilterType4(static_cast<SignalProcessingDataStore::FilterType>(0));
    objSignalProcessingSignalParametricEqualizer2_->setFrequency4(50.f);
    objSignalProcessingSignalParametricEqualizer2_->setQuality4(0.7076f);
    objSignalProcessingSignalParametricEqualizer2_->setGain4(0.f);
    objSignalProcessingSignalParametricEqualizer2_->setGainAdjust(0.f);
    objSignalProcessingSignalParametricEqualizer2_->setNumChannels(2);
    objSignalProcessingSignalParametricEqualizer2_->setNumOutputs(1);
    objSignalProcessingSignalMathOp4_->setOperation(static_cast<SignalProcessingDataStore::MathOperation>(0));
    objSignalProcessingSignalMathOp4_->setOperandANode(objSignalProcessingSignalMathOp3_->getXrpaId());
    objSignalProcessingSignalMathOp4_->setOperandBNode(objSignalProcessingSignalParametricEqualizer2_->getXrpaId());
    objSignalProcessingSignalMathOp4_->setNumChannels(2);
    objSignalProcessingSignalMathOp4_->setNumOutputs(4);
    objSignalProcessingSignalPitchShift7_->setSrcNode(objSignalProcessingSignalMathOp4_->getXrpaId());
    objSignalProcessingSignalPitchShift7_->setPitchShiftSemitones(0);
    objSignalProcessingSignalPitchShift7_->setNumChannels(2);
    objSignalProcessingSignalPitchShift7_->setNumOutputs(1);
    objSignalProcessingSignalPitchShift8_->setSrcNode(objSignalProcessingSignalMathOp4_->getXrpaId());
    objSignalProcessingSignalPitchShift8_->setPitchShiftSemitones(4);
    objSignalProcessingSignalPitchShift8_->setNumChannels(2);
    objSignalProcessingSignalPitchShift8_->setNumOutputs(1);
    objSignalProcessingSignalPitchShift9_->setSrcNode(objSignalProcessingSignalMathOp4_->getXrpaId());
    objSignalProcessingSignalPitchShift9_->setPitchShiftSemitones(-5);
    objSignalProcessingSignalPitchShift9_->setNumChannels(2);
    objSignalProcessingSignalPitchShift9_->setNumOutputs(1);
    objSignalProcessingSignalMathOp10_->setOperation(static_cast<SignalProcessingDataStore::MathOperation>(0));
    objSignalProcessingSignalMathOp10_->setOperandANode(objSignalProcessingSignalPitchShift7_->getXrpaId());
    objSignalProcessingSignalMathOp10_->setOperandBNode(objSignalProcessingSignalPitchShift8_->getXrpaId());
    objSignalProcessingSignalMathOp10_->setNumChannels(2);
    objSignalProcessingSignalMathOp10_->setNumOutputs(1);
    objSignalProcessingSignalMathOp11_->setOperation(static_cast<SignalProcessingDataStore::MathOperation>(0));
    objSignalProcessingSignalMathOp11_->setOperandANode(objSignalProcessingSignalMathOp10_->getXrpaId());
    objSignalProcessingSignalMathOp11_->setOperandBNode(objSignalProcessingSignalPitchShift9_->getXrpaId());
    objSignalProcessingSignalMathOp11_->setNumChannels(2);
    objSignalProcessingSignalMathOp11_->setNumOutputs(2);
    objSignalProcessingSignalSoftClip13_->setSrcNode(objSignalProcessingSignalMathOp11_->getXrpaId());
    objSignalProcessingSignalSoftClip13_->setNumChannels(2);
    objSignalProcessingSignalSoftClip13_->setNumOutputs(1);
    objSignalProcessingSignalOutputData14_->setSrcNode(objSignalProcessingSignalSoftClip13_->getXrpaId());
    objSignalProcessingSignalOutputData14_->setNumChannels(2);
    objSignalProcessingSignalOutputData14_->setFrameRate(16000);
    objSignalProcessingSignalOutputDevice12_->setSrcNode(objSignalProcessingSignalMathOp11_->getXrpaId());
    objSignalProcessingSignalOutputDevice12_->setDeviceNameFilter("Headphones");
    objSignalProcessingSignalOutputDevice12_->setChannelOffset(0);
    objSignalOutputSignalOutputSource15_->setBindTo(static_cast<SignalOutputDataStore::DeviceBindingType>(3));
    objSignalOutputSignalOutputSource15_->setHostname("192.168.68.80");
    objSignalOutputSignalOutputSource15_->setPort(12346);
    objSignalProcessingSignalOutputData14_DataForwarder_ = std::make_shared<Xrpa::InboundSignalForwarder>();
    objSignalProcessingSignalOutputData14_->onData(objSignalProcessingSignalOutputData14_DataForwarder_);
    objSignalOutputSignalOutputSource15_->setSignalForwarder<float>(objSignalProcessingSignalOutputData14_DataForwarder_);
  }

  void destroyObjects() {
    if (objSignalOutputSignalOutputSource15_) {
      datastoreSignalOutput_->SignalOutputSource->removeObject(objSignalOutputSignalOutputSource15_->getXrpaId());
      objSignalOutputSignalOutputSource15_ = nullptr;
    }
    if (objSignalProcessingSignalOutputDevice12_) {
      datastoreSignalProcessing_->SignalOutputDevice->removeObject(objSignalProcessingSignalOutputDevice12_->getXrpaId());
      objSignalProcessingSignalOutputDevice12_ = nullptr;
    }
    if (objSignalProcessingSignalOutputData14_) {
      datastoreSignalProcessing_->SignalOutputData->removeObject(objSignalProcessingSignalOutputData14_->getXrpaId());
      objSignalProcessingSignalOutputData14_ = nullptr;
    }
    if (objSignalProcessingSignalSoftClip13_) {
      datastoreSignalProcessing_->SignalSoftClip->removeObject(objSignalProcessingSignalSoftClip13_->getXrpaId());
      objSignalProcessingSignalSoftClip13_ = nullptr;
    }
    if (objSignalProcessingSignalMathOp11_) {
      datastoreSignalProcessing_->SignalMathOp->removeObject(objSignalProcessingSignalMathOp11_->getXrpaId());
      objSignalProcessingSignalMathOp11_ = nullptr;
    }
    if (objSignalProcessingSignalMathOp10_) {
      datastoreSignalProcessing_->SignalMathOp->removeObject(objSignalProcessingSignalMathOp10_->getXrpaId());
      objSignalProcessingSignalMathOp10_ = nullptr;
    }
    if (objSignalProcessingSignalPitchShift9_) {
      datastoreSignalProcessing_->SignalPitchShift->removeObject(objSignalProcessingSignalPitchShift9_->getXrpaId());
      objSignalProcessingSignalPitchShift9_ = nullptr;
    }
    if (objSignalProcessingSignalPitchShift8_) {
      datastoreSignalProcessing_->SignalPitchShift->removeObject(objSignalProcessingSignalPitchShift8_->getXrpaId());
      objSignalProcessingSignalPitchShift8_ = nullptr;
    }
    if (objSignalProcessingSignalPitchShift7_) {
      datastoreSignalProcessing_->SignalPitchShift->removeObject(objSignalProcessingSignalPitchShift7_->getXrpaId());
      objSignalProcessingSignalPitchShift7_ = nullptr;
    }
    if (objSignalProcessingSignalMathOp4_) {
      datastoreSignalProcessing_->SignalMathOp->removeObject(objSignalProcessingSignalMathOp4_->getXrpaId());
      objSignalProcessingSignalMathOp4_ = nullptr;
    }
    if (objSignalProcessingSignalParametricEqualizer2_) {
      datastoreSignalProcessing_->SignalParametricEqualizer->removeObject(objSignalProcessingSignalParametricEqualizer2_->getXrpaId());
      objSignalProcessingSignalParametricEqualizer2_ = nullptr;
    }
    if (objSignalProcessingSignalMathOp3_) {
      datastoreSignalProcessing_->SignalMathOp->removeObject(objSignalProcessingSignalMathOp3_->getXrpaId());
      objSignalProcessingSignalMathOp3_ = nullptr;
    }
    if (objSignalProcessingSignalFeedback1_) {
      datastoreSignalProcessing_->SignalFeedback->removeObject(objSignalProcessingSignalFeedback1_->getXrpaId());
      objSignalProcessingSignalFeedback1_ = nullptr;
    }
    if (objSignalProcessingSignalSourceFile0_) {
      datastoreSignalProcessing_->SignalSourceFile->removeObject(objSignalProcessingSignalSourceFile0_->getXrpaId());
      objSignalProcessingSignalSourceFile0_ = nullptr;
    }
    if (objSignalProcessingSignalDelay6_) {
      datastoreSignalProcessing_->SignalDelay->removeObject(objSignalProcessingSignalDelay6_->getXrpaId());
      objSignalProcessingSignalDelay6_ = nullptr;
    }
    if (objSignalProcessingSignalParametricEqualizer5_) {
      datastoreSignalProcessing_->SignalParametricEqualizer->removeObject(objSignalProcessingSignalParametricEqualizer5_->getXrpaId());
      objSignalProcessingSignalParametricEqualizer5_ = nullptr;
    }
  }

  std::shared_ptr<SignalOutputDataStore::SignalOutputDataStore> datastoreSignalOutput_;
  std::shared_ptr<SignalProcessingDataStore::SignalProcessingDataStore> datastoreSignalProcessing_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalParametricEqualizer> objSignalProcessingSignalParametricEqualizer5_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalDelay> objSignalProcessingSignalDelay6_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalSourceFile> objSignalProcessingSignalSourceFile0_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalFeedback> objSignalProcessingSignalFeedback1_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalMathOp> objSignalProcessingSignalMathOp3_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalParametricEqualizer> objSignalProcessingSignalParametricEqualizer2_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalMathOp> objSignalProcessingSignalMathOp4_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalPitchShift> objSignalProcessingSignalPitchShift7_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalPitchShift> objSignalProcessingSignalPitchShift8_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalPitchShift> objSignalProcessingSignalPitchShift9_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalMathOp> objSignalProcessingSignalMathOp10_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalMathOp> objSignalProcessingSignalMathOp11_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalSoftClip> objSignalProcessingSignalSoftClip13_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalOutputData> objSignalProcessingSignalOutputData14_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalOutputDevice> objSignalProcessingSignalOutputDevice12_;
  std::shared_ptr<SignalOutputDataStore::OutboundSignalOutputSource> objSignalOutputSignalOutputSource15_;
  std::shared_ptr<Xrpa::InboundSignalForwarder> objSignalProcessingSignalOutputData14_DataForwarder_;
};

} // namespace XrpaDataflowPrograms
