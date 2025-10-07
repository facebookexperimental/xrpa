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
#include "SignalProcessingTypes.h"
#include <string>

namespace XrpaDataflowPrograms {

class TestSignal1 {
 public:
  explicit TestSignal1(std::shared_ptr<SignalProcessingDataStore::SignalProcessingDataStore> datastoreSignalProcessing) : datastoreSignalProcessing_(datastoreSignalProcessing) {
    createObjects();
  }

  ~TestSignal1() {
    destroyObjects();
  }

  // Low frequency, in Hz
  float getAudioFrequency1() const {
    return paramAudioFrequency1_;
  }

  void setAudioFrequency1(float audioFrequency1) {
    paramAudioFrequency1_ = audioFrequency1;
    if (objSignalProcessingSignalCurve0_) {
      objSignalProcessingSignalCurve0_->setStartValue(audioFrequency1);
    }
    if (objSignalProcessingSignalCurve0_) {
      objSignalProcessingSignalCurve0_->setSegmentEndValue0(audioFrequency1);
    }
    if (objSignalProcessingSignalCurve0_) {
      objSignalProcessingSignalCurve0_->setSegmentEndValue3(audioFrequency1);
    }
    if (objSignalProcessingSignalCurve0_) {
      objSignalProcessingSignalCurve0_->setSegmentEndValue4(audioFrequency1);
    }
  }

  // High frequency, in Hz
  float getAudioFrequency2() const {
    return paramAudioFrequency2_;
  }

  void setAudioFrequency2(float audioFrequency2) {
    paramAudioFrequency2_ = audioFrequency2;
    if (objSignalProcessingSignalCurve0_) {
      objSignalProcessingSignalCurve0_->setSegmentEndValue1(audioFrequency2);
    }
    if (objSignalProcessingSignalCurve0_) {
      objSignalProcessingSignalCurve0_->setSegmentEndValue2(audioFrequency2);
    }
  }

  void terminate() {
    destroyObjects();
  }

 private:
  void createObjects() {
    objSignalProcessingSignalCurve0_ = datastoreSignalProcessing_->SignalCurve->createObject();
    objSignalProcessingSignalEvent12_ = datastoreSignalProcessing_->SignalEvent->createObject();
    objSignalProcessingSignalEvent13_ = datastoreSignalProcessing_->SignalEvent->createObject();
    objSignalProcessingSignalEvent16_ = datastoreSignalProcessing_->SignalEvent->createObject();
    objSignalProcessingSignalOscillator1_ = datastoreSignalProcessing_->SignalOscillator->createObject();
    objSignalProcessingSignalOscillator6_ = datastoreSignalProcessing_->SignalOscillator->createObject();
    objSignalProcessingSignalCurve10_ = datastoreSignalProcessing_->SignalCurve->createObject();
    objSignalProcessingSignalCurve11_ = datastoreSignalProcessing_->SignalCurve->createObject();
    objSignalProcessingSignalEventCombiner14_ = datastoreSignalProcessing_->SignalEventCombiner->createObject();
    objSignalProcessingSignalEvent17_ = datastoreSignalProcessing_->SignalEvent->createObject();
    objSignalProcessingSignalMathOp2_ = datastoreSignalProcessing_->SignalMathOp->createObject();
    objSignalProcessingSignalMathOp7_ = datastoreSignalProcessing_->SignalMathOp->createObject();
    objSignalProcessingSignalMultiplexer15_ = datastoreSignalProcessing_->SignalMultiplexer->createObject();
    objSignalProcessingSignalOscillator3_ = datastoreSignalProcessing_->SignalOscillator->createObject();
    objSignalProcessingSignalCurve5_ = datastoreSignalProcessing_->SignalCurve->createObject();
    objSignalProcessingSignalMathOp8_ = datastoreSignalProcessing_->SignalMathOp->createObject();
    objSignalProcessingSignalMathOp18_ = datastoreSignalProcessing_->SignalMathOp->createObject();
    objSignalProcessingSignalMathOp4_ = datastoreSignalProcessing_->SignalMathOp->createObject();
    objSignalProcessingSignalChannelRouter9_ = datastoreSignalProcessing_->SignalChannelRouter->createObject();
    objSignalProcessingSignalMathOp19_ = datastoreSignalProcessing_->SignalMathOp->createObject();
    objSignalProcessingSignalMathOp22_ = datastoreSignalProcessing_->SignalMathOp->createObject();
    objSignalProcessingSignalSoftClip20_ = datastoreSignalProcessing_->SignalSoftClip->createObject();
    objSignalProcessingSignalMathOp23_ = datastoreSignalProcessing_->SignalMathOp->createObject();
    objSignalProcessingSignalMathOp25_ = datastoreSignalProcessing_->SignalMathOp->createObject();
    objSignalProcessingSignalOutputDevice21_ = datastoreSignalProcessing_->SignalOutputDevice->createObject();
    objSignalProcessingSignalOutputDevice24_ = datastoreSignalProcessing_->SignalOutputDevice->createObject();
    objSignalProcessingSignalOutputDevice26_ = datastoreSignalProcessing_->SignalOutputDevice->createObject();
    objSignalProcessingSignalCurve0_->setSoftCurve(true);
    objSignalProcessingSignalCurve0_->setNumSegments(5);
    objSignalProcessingSignalCurve0_->setStartValue(paramAudioFrequency1_);
    objSignalProcessingSignalCurve0_->setSegmentLength0(1.f);
    objSignalProcessingSignalCurve0_->setSegmentEndValue0(paramAudioFrequency1_);
    objSignalProcessingSignalCurve0_->setSegmentLength1(1.f);
    objSignalProcessingSignalCurve0_->setSegmentEndValue1(paramAudioFrequency2_);
    objSignalProcessingSignalCurve0_->setSegmentLength2(1.f);
    objSignalProcessingSignalCurve0_->setSegmentEndValue2(paramAudioFrequency2_);
    objSignalProcessingSignalCurve0_->setSegmentLength3(1.f);
    objSignalProcessingSignalCurve0_->setSegmentEndValue3(paramAudioFrequency1_);
    objSignalProcessingSignalCurve0_->setSegmentLength4(0.f);
    objSignalProcessingSignalCurve0_->setSegmentEndValue4(paramAudioFrequency1_);
    objSignalProcessingSignalCurve0_->setAutoStart(true);
    objSignalProcessingSignalCurve0_->setAutoLoop(false);
    objSignalProcessingSignalCurve0_->setNumOutputs(1);
    objSignalProcessingSignalOscillator1_->setNumChannels(2);
    objSignalProcessingSignalOscillator1_->setWaveformType(static_cast<SignalProcessingDataStore::WaveformType>(3));
    objSignalProcessingSignalOscillator1_->setFrequencyNode(objSignalProcessingSignalCurve0_->getXrpaId());
    objSignalProcessingSignalOscillator1_->setPulseWidth(0.5f);
    objSignalProcessingSignalOscillator1_->setNumOutputs(1);
    objSignalProcessingSignalOscillator6_->setNumChannels(1);
    objSignalProcessingSignalOscillator6_->setWaveformType(static_cast<SignalProcessingDataStore::WaveformType>(3));
    objSignalProcessingSignalOscillator6_->setFrequency(0.5f);
    objSignalProcessingSignalOscillator6_->setPulseWidth(0.5f);
    objSignalProcessingSignalOscillator6_->setNumOutputs(1);
    objSignalProcessingSignalCurve10_->setSoftCurve(true);
    objSignalProcessingSignalCurve10_->setNumSegments(5);
    objSignalProcessingSignalCurve10_->setStartValue(0.f);
    objSignalProcessingSignalCurve10_->setSegmentLength0(0.f);
    objSignalProcessingSignalCurve10_->setSegmentEndValue0(0.f);
    objSignalProcessingSignalCurve10_->setSegmentLength1(0.5f);
    objSignalProcessingSignalCurve10_->setSegmentEndValue1(1.f);
    objSignalProcessingSignalCurve10_->setSegmentLength2(2.f);
    objSignalProcessingSignalCurve10_->setSegmentEndValue2(1.f);
    objSignalProcessingSignalCurve10_->setSegmentLength3(1.5f);
    objSignalProcessingSignalCurve10_->setSegmentEndValue3(0.f);
    objSignalProcessingSignalCurve10_->setSegmentLength4(0.5f);
    objSignalProcessingSignalCurve10_->setSegmentEndValue4(0.f);
    objSignalProcessingSignalCurve10_->setAutoStart(true);
    objSignalProcessingSignalCurve10_->setAutoLoop(false);
    objSignalProcessingSignalCurve10_->setOnDoneEvent(objSignalProcessingSignalEvent12_->getXrpaId());
    objSignalProcessingSignalCurve10_->setNumOutputs(1);
    objSignalProcessingSignalCurve11_->setSoftCurve(true);
    objSignalProcessingSignalCurve11_->setNumSegments(5);
    objSignalProcessingSignalCurve11_->setStartValue(0.f);
    objSignalProcessingSignalCurve11_->setSegmentLength0(0.f);
    objSignalProcessingSignalCurve11_->setSegmentEndValue0(0.f);
    objSignalProcessingSignalCurve11_->setSegmentLength1(1.5f);
    objSignalProcessingSignalCurve11_->setSegmentEndValue1(1.f);
    objSignalProcessingSignalCurve11_->setSegmentLength2(0.f);
    objSignalProcessingSignalCurve11_->setSegmentEndValue2(1.f);
    objSignalProcessingSignalCurve11_->setSegmentLength3(1.5f);
    objSignalProcessingSignalCurve11_->setSegmentEndValue3(0.f);
    objSignalProcessingSignalCurve11_->setSegmentLength4(0.f);
    objSignalProcessingSignalCurve11_->setSegmentEndValue4(0.f);
    objSignalProcessingSignalCurve11_->setAutoStart(false);
    objSignalProcessingSignalCurve11_->setAutoLoop(false);
    objSignalProcessingSignalCurve11_->setStartEvent(objSignalProcessingSignalEvent12_->getXrpaId());
    objSignalProcessingSignalCurve11_->setOnDoneEvent(objSignalProcessingSignalEvent13_->getXrpaId());
    objSignalProcessingSignalCurve11_->setNumOutputs(1);
    objSignalProcessingSignalEventCombiner14_->setSrcEvent0(objSignalProcessingSignalEvent12_->getXrpaId());
    objSignalProcessingSignalEventCombiner14_->setSrcEvent1(objSignalProcessingSignalEvent13_->getXrpaId());
    objSignalProcessingSignalEventCombiner14_->setOnEvent(objSignalProcessingSignalEvent16_->getXrpaId());
    objSignalProcessingSignalMathOp2_->setOperation(static_cast<SignalProcessingDataStore::MathOperation>(1));
    objSignalProcessingSignalMathOp2_->setOperandANode(objSignalProcessingSignalOscillator1_->getXrpaId());
    objSignalProcessingSignalMathOp2_->setOperandB(0.25f);
    objSignalProcessingSignalMathOp2_->setNumChannels(2);
    objSignalProcessingSignalMathOp2_->setNumOutputs(1);
    objSignalProcessingSignalMathOp7_->setOperation(static_cast<SignalProcessingDataStore::MathOperation>(1));
    objSignalProcessingSignalMathOp7_->setOperandANode(objSignalProcessingSignalOscillator6_->getXrpaId());
    objSignalProcessingSignalMathOp7_->setOperandB(0.5f);
    objSignalProcessingSignalMathOp7_->setNumChannels(1);
    objSignalProcessingSignalMathOp7_->setNumOutputs(1);
    objSignalProcessingSignalMultiplexer15_->setSrcNode0(objSignalProcessingSignalCurve10_->getXrpaId());
    objSignalProcessingSignalMultiplexer15_->setSrcNode1(objSignalProcessingSignalCurve11_->getXrpaId());
    objSignalProcessingSignalMultiplexer15_->setIncrementEvent(objSignalProcessingSignalEvent16_->getXrpaId());
    objSignalProcessingSignalMultiplexer15_->setAutoStart(true);
    objSignalProcessingSignalMultiplexer15_->setNumChannels(1);
    objSignalProcessingSignalMultiplexer15_->setOnDoneEvent(objSignalProcessingSignalEvent17_->getXrpaId());
    objSignalProcessingSignalMultiplexer15_->setNumOutputs(3);
    objSignalProcessingSignalOscillator3_->setNumChannels(1);
    objSignalProcessingSignalOscillator3_->setWaveformType(static_cast<SignalProcessingDataStore::WaveformType>(3));
    objSignalProcessingSignalOscillator3_->setFrequency(170.f);
    objSignalProcessingSignalOscillator3_->setPulseWidth(0.5f);
    objSignalProcessingSignalOscillator3_->setNumOutputs(1);
    objSignalProcessingSignalCurve5_->setSoftCurve(false);
    objSignalProcessingSignalCurve5_->setNumSegments(3);
    objSignalProcessingSignalCurve5_->setStartValue(0.f);
    objSignalProcessingSignalCurve5_->setSegmentLength0(0.0049900000000000005f);
    objSignalProcessingSignalCurve5_->setSegmentEndValue0(1.f);
    objSignalProcessingSignalCurve5_->setSegmentLength1(0.00001000000000000001f);
    objSignalProcessingSignalCurve5_->setSegmentEndValue1(0.f);
    objSignalProcessingSignalCurve5_->setSegmentLength2(0.005f);
    objSignalProcessingSignalCurve5_->setSegmentEndValue2(0.f);
    objSignalProcessingSignalCurve5_->setAutoStart(true);
    objSignalProcessingSignalCurve5_->setAutoLoop(true);
    objSignalProcessingSignalCurve5_->setNumOutputs(1);
    objSignalProcessingSignalMathOp8_->setOperation(static_cast<SignalProcessingDataStore::MathOperation>(0));
    objSignalProcessingSignalMathOp8_->setOperandANode(objSignalProcessingSignalMathOp7_->getXrpaId());
    objSignalProcessingSignalMathOp8_->setOperandB(0.5f);
    objSignalProcessingSignalMathOp8_->setNumChannels(1);
    objSignalProcessingSignalMathOp8_->setNumOutputs(1);
    objSignalProcessingSignalMathOp18_->setOperation(static_cast<SignalProcessingDataStore::MathOperation>(1));
    objSignalProcessingSignalMathOp18_->setOperandANode(objSignalProcessingSignalMathOp2_->getXrpaId());
    objSignalProcessingSignalMathOp18_->setOperandBNode(objSignalProcessingSignalMultiplexer15_->getXrpaId());
    objSignalProcessingSignalMathOp18_->setNumChannels(2);
    objSignalProcessingSignalMathOp18_->setNumOutputs(1);
    objSignalProcessingSignalMathOp4_->setOperation(static_cast<SignalProcessingDataStore::MathOperation>(1));
    objSignalProcessingSignalMathOp4_->setOperandANode(objSignalProcessingSignalOscillator3_->getXrpaId());
    objSignalProcessingSignalMathOp4_->setOperandB(0.5f);
    objSignalProcessingSignalMathOp4_->setNumChannels(1);
    objSignalProcessingSignalMathOp4_->setNumOutputs(1);
    objSignalProcessingSignalChannelRouter9_->setSrcNode(objSignalProcessingSignalCurve5_->getXrpaId());
    objSignalProcessingSignalChannelRouter9_->setChannelSelectNode(objSignalProcessingSignalMathOp8_->getXrpaId());
    objSignalProcessingSignalChannelRouter9_->setNumChannels(2);
    objSignalProcessingSignalChannelRouter9_->setNumOutputs(1);
    objSignalProcessingSignalMathOp19_->setOperation(static_cast<SignalProcessingDataStore::MathOperation>(1));
    objSignalProcessingSignalMathOp19_->setOperandANode(objSignalProcessingSignalMathOp18_->getXrpaId());
    objSignalProcessingSignalMathOp19_->setOperandB(3.f);
    objSignalProcessingSignalMathOp19_->setNumChannels(2);
    objSignalProcessingSignalMathOp19_->setNumOutputs(1);
    objSignalProcessingSignalMathOp22_->setOperation(static_cast<SignalProcessingDataStore::MathOperation>(2));
    objSignalProcessingSignalMathOp22_->setOperandA(1.f);
    objSignalProcessingSignalMathOp22_->setOperandBNode(objSignalProcessingSignalMultiplexer15_->getXrpaId());
    objSignalProcessingSignalMathOp22_->setNumChannels(1);
    objSignalProcessingSignalMathOp22_->setNumOutputs(1);
    objSignalProcessingSignalSoftClip20_->setSrcNode(objSignalProcessingSignalMathOp19_->getXrpaId());
    objSignalProcessingSignalSoftClip20_->setNumChannels(2);
    objSignalProcessingSignalSoftClip20_->setNumOutputs(1);
    objSignalProcessingSignalMathOp23_->setOperation(static_cast<SignalProcessingDataStore::MathOperation>(1));
    objSignalProcessingSignalMathOp23_->setOperandANode(objSignalProcessingSignalChannelRouter9_->getXrpaId());
    objSignalProcessingSignalMathOp23_->setOperandBNode(objSignalProcessingSignalMathOp22_->getXrpaId());
    objSignalProcessingSignalMathOp23_->setNumChannels(2);
    objSignalProcessingSignalMathOp23_->setNumOutputs(1);
    objSignalProcessingSignalMathOp25_->setOperation(static_cast<SignalProcessingDataStore::MathOperation>(1));
    objSignalProcessingSignalMathOp25_->setOperandANode(objSignalProcessingSignalMathOp4_->getXrpaId());
    objSignalProcessingSignalMathOp25_->setOperandBNode(objSignalProcessingSignalMultiplexer15_->getXrpaId());
    objSignalProcessingSignalMathOp25_->setNumChannels(1);
    objSignalProcessingSignalMathOp25_->setNumOutputs(1);
    objSignalProcessingSignalOutputDevice21_->setSrcNode(objSignalProcessingSignalSoftClip20_->getXrpaId());
    objSignalProcessingSignalOutputDevice21_->setDeviceNameFilter("Headphones");
    objSignalProcessingSignalOutputDevice21_->setChannelOffset(0);
    objSignalProcessingSignalOutputDevice24_->setSrcNode(objSignalProcessingSignalMathOp23_->getXrpaId());
    objSignalProcessingSignalOutputDevice24_->setDeviceNameFilter("BuzzDuino");
    objSignalProcessingSignalOutputDevice24_->setChannelOffset(0);
    objSignalProcessingSignalOutputDevice26_->setSrcNode(objSignalProcessingSignalMathOp25_->getXrpaId());
    objSignalProcessingSignalOutputDevice26_->setDeviceNameFilter("Sundial");
    objSignalProcessingSignalOutputDevice26_->setChannelOffset(0);
    if (objSignalProcessingSignalEvent17_) {
      objSignalProcessingSignalEvent17_->onReceiveEvent([this](auto, auto) { terminate(); });
    }
  }

  void destroyObjects() {
    if (objSignalProcessingSignalOutputDevice26_) {
      datastoreSignalProcessing_->SignalOutputDevice->removeObject(objSignalProcessingSignalOutputDevice26_->getXrpaId());
      objSignalProcessingSignalOutputDevice26_ = nullptr;
    }
    if (objSignalProcessingSignalOutputDevice24_) {
      datastoreSignalProcessing_->SignalOutputDevice->removeObject(objSignalProcessingSignalOutputDevice24_->getXrpaId());
      objSignalProcessingSignalOutputDevice24_ = nullptr;
    }
    if (objSignalProcessingSignalOutputDevice21_) {
      datastoreSignalProcessing_->SignalOutputDevice->removeObject(objSignalProcessingSignalOutputDevice21_->getXrpaId());
      objSignalProcessingSignalOutputDevice21_ = nullptr;
    }
    if (objSignalProcessingSignalMathOp25_) {
      datastoreSignalProcessing_->SignalMathOp->removeObject(objSignalProcessingSignalMathOp25_->getXrpaId());
      objSignalProcessingSignalMathOp25_ = nullptr;
    }
    if (objSignalProcessingSignalMathOp23_) {
      datastoreSignalProcessing_->SignalMathOp->removeObject(objSignalProcessingSignalMathOp23_->getXrpaId());
      objSignalProcessingSignalMathOp23_ = nullptr;
    }
    if (objSignalProcessingSignalSoftClip20_) {
      datastoreSignalProcessing_->SignalSoftClip->removeObject(objSignalProcessingSignalSoftClip20_->getXrpaId());
      objSignalProcessingSignalSoftClip20_ = nullptr;
    }
    if (objSignalProcessingSignalMathOp22_) {
      datastoreSignalProcessing_->SignalMathOp->removeObject(objSignalProcessingSignalMathOp22_->getXrpaId());
      objSignalProcessingSignalMathOp22_ = nullptr;
    }
    if (objSignalProcessingSignalMathOp19_) {
      datastoreSignalProcessing_->SignalMathOp->removeObject(objSignalProcessingSignalMathOp19_->getXrpaId());
      objSignalProcessingSignalMathOp19_ = nullptr;
    }
    if (objSignalProcessingSignalChannelRouter9_) {
      datastoreSignalProcessing_->SignalChannelRouter->removeObject(objSignalProcessingSignalChannelRouter9_->getXrpaId());
      objSignalProcessingSignalChannelRouter9_ = nullptr;
    }
    if (objSignalProcessingSignalMathOp4_) {
      datastoreSignalProcessing_->SignalMathOp->removeObject(objSignalProcessingSignalMathOp4_->getXrpaId());
      objSignalProcessingSignalMathOp4_ = nullptr;
    }
    if (objSignalProcessingSignalMathOp18_) {
      datastoreSignalProcessing_->SignalMathOp->removeObject(objSignalProcessingSignalMathOp18_->getXrpaId());
      objSignalProcessingSignalMathOp18_ = nullptr;
    }
    if (objSignalProcessingSignalMathOp8_) {
      datastoreSignalProcessing_->SignalMathOp->removeObject(objSignalProcessingSignalMathOp8_->getXrpaId());
      objSignalProcessingSignalMathOp8_ = nullptr;
    }
    if (objSignalProcessingSignalCurve5_) {
      datastoreSignalProcessing_->SignalCurve->removeObject(objSignalProcessingSignalCurve5_->getXrpaId());
      objSignalProcessingSignalCurve5_ = nullptr;
    }
    if (objSignalProcessingSignalOscillator3_) {
      datastoreSignalProcessing_->SignalOscillator->removeObject(objSignalProcessingSignalOscillator3_->getXrpaId());
      objSignalProcessingSignalOscillator3_ = nullptr;
    }
    if (objSignalProcessingSignalMultiplexer15_) {
      datastoreSignalProcessing_->SignalMultiplexer->removeObject(objSignalProcessingSignalMultiplexer15_->getXrpaId());
      objSignalProcessingSignalMultiplexer15_ = nullptr;
    }
    if (objSignalProcessingSignalMathOp7_) {
      datastoreSignalProcessing_->SignalMathOp->removeObject(objSignalProcessingSignalMathOp7_->getXrpaId());
      objSignalProcessingSignalMathOp7_ = nullptr;
    }
    if (objSignalProcessingSignalMathOp2_) {
      datastoreSignalProcessing_->SignalMathOp->removeObject(objSignalProcessingSignalMathOp2_->getXrpaId());
      objSignalProcessingSignalMathOp2_ = nullptr;
    }
    if (objSignalProcessingSignalEvent17_) {
      datastoreSignalProcessing_->SignalEvent->removeObject(objSignalProcessingSignalEvent17_->getXrpaId());
      objSignalProcessingSignalEvent17_ = nullptr;
    }
    if (objSignalProcessingSignalEventCombiner14_) {
      datastoreSignalProcessing_->SignalEventCombiner->removeObject(objSignalProcessingSignalEventCombiner14_->getXrpaId());
      objSignalProcessingSignalEventCombiner14_ = nullptr;
    }
    if (objSignalProcessingSignalCurve11_) {
      datastoreSignalProcessing_->SignalCurve->removeObject(objSignalProcessingSignalCurve11_->getXrpaId());
      objSignalProcessingSignalCurve11_ = nullptr;
    }
    if (objSignalProcessingSignalCurve10_) {
      datastoreSignalProcessing_->SignalCurve->removeObject(objSignalProcessingSignalCurve10_->getXrpaId());
      objSignalProcessingSignalCurve10_ = nullptr;
    }
    if (objSignalProcessingSignalOscillator6_) {
      datastoreSignalProcessing_->SignalOscillator->removeObject(objSignalProcessingSignalOscillator6_->getXrpaId());
      objSignalProcessingSignalOscillator6_ = nullptr;
    }
    if (objSignalProcessingSignalOscillator1_) {
      datastoreSignalProcessing_->SignalOscillator->removeObject(objSignalProcessingSignalOscillator1_->getXrpaId());
      objSignalProcessingSignalOscillator1_ = nullptr;
    }
    if (objSignalProcessingSignalEvent16_) {
      datastoreSignalProcessing_->SignalEvent->removeObject(objSignalProcessingSignalEvent16_->getXrpaId());
      objSignalProcessingSignalEvent16_ = nullptr;
    }
    if (objSignalProcessingSignalEvent13_) {
      datastoreSignalProcessing_->SignalEvent->removeObject(objSignalProcessingSignalEvent13_->getXrpaId());
      objSignalProcessingSignalEvent13_ = nullptr;
    }
    if (objSignalProcessingSignalEvent12_) {
      datastoreSignalProcessing_->SignalEvent->removeObject(objSignalProcessingSignalEvent12_->getXrpaId());
      objSignalProcessingSignalEvent12_ = nullptr;
    }
    if (objSignalProcessingSignalCurve0_) {
      datastoreSignalProcessing_->SignalCurve->removeObject(objSignalProcessingSignalCurve0_->getXrpaId());
      objSignalProcessingSignalCurve0_ = nullptr;
    }
  }

  std::shared_ptr<SignalProcessingDataStore::SignalProcessingDataStore> datastoreSignalProcessing_;

  // Low frequency, in Hz
  float paramAudioFrequency1_ = 120.f;

  // High frequency, in Hz
  float paramAudioFrequency2_ = 330.f;

  std::shared_ptr<SignalProcessingDataStore::OutboundSignalCurve> objSignalProcessingSignalCurve0_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalEvent> objSignalProcessingSignalEvent12_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalEvent> objSignalProcessingSignalEvent13_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalEvent> objSignalProcessingSignalEvent16_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalOscillator> objSignalProcessingSignalOscillator1_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalOscillator> objSignalProcessingSignalOscillator6_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalCurve> objSignalProcessingSignalCurve10_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalCurve> objSignalProcessingSignalCurve11_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalEventCombiner> objSignalProcessingSignalEventCombiner14_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalEvent> objSignalProcessingSignalEvent17_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalMathOp> objSignalProcessingSignalMathOp2_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalMathOp> objSignalProcessingSignalMathOp7_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalMultiplexer> objSignalProcessingSignalMultiplexer15_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalOscillator> objSignalProcessingSignalOscillator3_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalCurve> objSignalProcessingSignalCurve5_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalMathOp> objSignalProcessingSignalMathOp8_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalMathOp> objSignalProcessingSignalMathOp18_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalMathOp> objSignalProcessingSignalMathOp4_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalChannelRouter> objSignalProcessingSignalChannelRouter9_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalMathOp> objSignalProcessingSignalMathOp19_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalMathOp> objSignalProcessingSignalMathOp22_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalSoftClip> objSignalProcessingSignalSoftClip20_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalMathOp> objSignalProcessingSignalMathOp23_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalMathOp> objSignalProcessingSignalMathOp25_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalOutputDevice> objSignalProcessingSignalOutputDevice21_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalOutputDevice> objSignalProcessingSignalOutputDevice24_;
  std::shared_ptr<SignalProcessingDataStore::OutboundSignalOutputDevice> objSignalProcessingSignalOutputDevice26_;
};

} // namespace XrpaDataflowPrograms
