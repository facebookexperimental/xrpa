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

#include "SignalProcessingTypes.h"
#include <functional>
#include <memory>
#include <string>
#include <xrpa-runtime/external_utils/UuidGen.h>
#include <xrpa-runtime/reconciler/DataStoreInterfaces.h>
#include <xrpa-runtime/reconciler/DataStoreReconciler.h>
#include <xrpa-runtime/reconciler/ObjectCollection.h>
#include <xrpa-runtime/signals/InboundSignalData.h>
#include <xrpa-runtime/signals/InboundSignalForwarder.h>
#include <xrpa-runtime/signals/OutboundSignalData.h>
#include <xrpa-runtime/signals/SignalRingBuffer.h>
#include <xrpa-runtime/signals/SignalShared.h>
#include <xrpa-runtime/transport/TransportStream.h>
#include <xrpa-runtime/transport/TransportStreamAccessor.h>
#include <xrpa-runtime/utils/MemoryAccessor.h>
#include <xrpa-runtime/utils/XrpaTypes.h>

namespace SignalProcessingDataStore {

class SignalProcessingDataStore;
class OutboundSignalEvent;
class OutboundSignalEventCombiner;
class ISignalNode;
class OutboundSignalSource;
class OutboundSignalSourceFile;
class OutboundSignalOscillator;
class OutboundSignalChannelRouter;
class OutboundSignalChannelSelect;
class OutboundSignalChannelStack;
class OutboundSignalCurve;
class OutboundSignalDelay;
class OutboundSignalFeedback;
class OutboundSignalMathOp;
class OutboundSignalMultiplexer;
class OutboundSignalParametricEqualizer;
class OutboundSignalPitchShift;
class OutboundSignalSoftClip;
class OutboundSignalOutputData;
class OutboundSignalOutputDevice;

class TriggerEventMessageReader : public Xrpa::ObjectAccessorInterface {
 public:
  TriggerEventMessageReader() {}

  explicit TriggerEventMessageReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  float getPayload() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class TriggerEventMessageWriter : public TriggerEventMessageReader {
 public:
  TriggerEventMessageWriter() {}

  explicit TriggerEventMessageWriter(const Xrpa::MemoryAccessor& memAccessor) : TriggerEventMessageReader(memAccessor) {}

  void setPayload(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class ReceiveEventMessageReader : public Xrpa::ObjectAccessorInterface {
 public:
  ReceiveEventMessageReader() {}

  explicit ReceiveEventMessageReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  float getPayload() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class ReceiveEventMessageWriter : public ReceiveEventMessageReader {
 public:
  ReceiveEventMessageWriter() {}

  explicit ReceiveEventMessageWriter(const Xrpa::MemoryAccessor& memAccessor) : ReceiveEventMessageReader(memAccessor) {}

  void setPayload(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class SignalEventReader : public Xrpa::ObjectAccessorInterface {
 public:
  SignalEventReader() {}

  explicit SignalEventReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

 private:
  Xrpa::MemoryOffset readOffset_;
};

class SignalEventWriter : public SignalEventReader {
 public:
  SignalEventWriter() {}

  explicit SignalEventWriter(const Xrpa::MemoryAccessor& memAccessor) : SignalEventReader(memAccessor) {}

  static SignalEventWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return SignalEventWriter(changeEvent.accessChangeData());
  }

  static SignalEventWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return SignalEventWriter(changeEvent.accessChangeData());
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class SignalEventCombinerReader : public Xrpa::ObjectAccessorInterface {
 public:
  SignalEventCombinerReader() {}

  explicit SignalEventCombinerReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  Xrpa::ObjectUuid getSrcEvent0() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  Xrpa::ObjectUuid getSrcEvent1() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  Xrpa::ObjectUuid getSrcEvent2() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  Xrpa::ObjectUuid getSrcEvent3() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  Xrpa::ObjectUuid getSrcEvent4() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  Xrpa::ObjectUuid getSrcEvent5() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  ParameterMode getParameterMode() {
    return static_cast<ParameterMode>(memAccessor_.readValue<uint32_t>(readOffset_));
  }

  Xrpa::ObjectUuid getOnEvent() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  inline bool checkSrcEvent0Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkSrcEvent1Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkSrcEvent2Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkSrcEvent3Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  inline bool checkSrcEvent4Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 16;
  }

  inline bool checkSrcEvent5Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 32;
  }

  inline bool checkParameterModeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 64;
  }

  inline bool checkOnEventChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 128;
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class SignalEventCombinerWriter : public SignalEventCombinerReader {
 public:
  SignalEventCombinerWriter() {}

  explicit SignalEventCombinerWriter(const Xrpa::MemoryAccessor& memAccessor) : SignalEventCombinerReader(memAccessor) {}

  static SignalEventCombinerWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return SignalEventCombinerWriter(changeEvent.accessChangeData());
  }

  static SignalEventCombinerWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return SignalEventCombinerWriter(changeEvent.accessChangeData());
  }

  void setSrcEvent0(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

  void setSrcEvent1(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

  void setSrcEvent2(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

  void setSrcEvent3(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

  void setSrcEvent4(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

  void setSrcEvent5(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

  void setParameterMode(ParameterMode value) {
    memAccessor_.writeValue<uint32_t>(static_cast<uint32_t>(value), writeOffset_);
  }

  void setOnEvent(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class SignalSourceReader : public Xrpa::ObjectAccessorInterface {
 public:
  SignalSourceReader() {}

  explicit SignalSourceReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  int getNumOutputs() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  int getNumChannels() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  inline bool checkNumOutputsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkNumChannelsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class SignalSourceWriter : public SignalSourceReader {
 public:
  SignalSourceWriter() {}

  explicit SignalSourceWriter(const Xrpa::MemoryAccessor& memAccessor) : SignalSourceReader(memAccessor) {}

  static SignalSourceWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return SignalSourceWriter(changeEvent.accessChangeData());
  }

  static SignalSourceWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return SignalSourceWriter(changeEvent.accessChangeData());
  }

  void setNumOutputs(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setNumChannels(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class SignalSourceFileReader : public Xrpa::ObjectAccessorInterface {
 public:
  SignalSourceFileReader() {}

  explicit SignalSourceFileReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  int getNumOutputs() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  std::string getFilePath() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  bool getAutoPlay() {
    return (memAccessor_.readValue<int32_t>(readOffset_) == 1 ? true : false);
  }

  inline bool checkNumOutputsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkFilePathChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkAutoPlayChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class SignalSourceFileWriter : public SignalSourceFileReader {
 public:
  SignalSourceFileWriter() {}

  explicit SignalSourceFileWriter(const Xrpa::MemoryAccessor& memAccessor) : SignalSourceFileReader(memAccessor) {}

  static SignalSourceFileWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return SignalSourceFileWriter(changeEvent.accessChangeData());
  }

  static SignalSourceFileWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return SignalSourceFileWriter(changeEvent.accessChangeData());
  }

  void setNumOutputs(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setFilePath(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

  void setAutoPlay(bool value) {
    memAccessor_.writeValue<int32_t>((value ? 1 : 0), writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class SignalOscillatorReader : public Xrpa::ObjectAccessorInterface {
 public:
  SignalOscillatorReader() {}

  explicit SignalOscillatorReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  int getNumOutputs() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  int getNumChannels() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  WaveformType getWaveformType() {
    return static_cast<WaveformType>(memAccessor_.readValue<uint32_t>(readOffset_));
  }

  float getFrequency() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

  Xrpa::ObjectUuid getFrequencyNode() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  float getPulseWidth() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

  Xrpa::ObjectUuid getPulseWidthNode() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  inline bool checkNumOutputsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkNumChannelsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkWaveformTypeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkFrequencyChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  inline bool checkFrequencyNodeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 16;
  }

  inline bool checkPulseWidthChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 32;
  }

  inline bool checkPulseWidthNodeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 64;
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class SignalOscillatorWriter : public SignalOscillatorReader {
 public:
  SignalOscillatorWriter() {}

  explicit SignalOscillatorWriter(const Xrpa::MemoryAccessor& memAccessor) : SignalOscillatorReader(memAccessor) {}

  static SignalOscillatorWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return SignalOscillatorWriter(changeEvent.accessChangeData());
  }

  static SignalOscillatorWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return SignalOscillatorWriter(changeEvent.accessChangeData());
  }

  void setNumOutputs(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setNumChannels(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setWaveformType(WaveformType value) {
    memAccessor_.writeValue<uint32_t>(static_cast<uint32_t>(value), writeOffset_);
  }

  void setFrequency(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

  void setFrequencyNode(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

  void setPulseWidth(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

  void setPulseWidthNode(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class SignalChannelRouterReader : public Xrpa::ObjectAccessorInterface {
 public:
  SignalChannelRouterReader() {}

  explicit SignalChannelRouterReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  int getNumOutputs() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  int getNumChannels() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  float getChannelSelect() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

  Xrpa::ObjectUuid getChannelSelectNode() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  Xrpa::ObjectUuid getSrcNode() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  inline bool checkNumOutputsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkNumChannelsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkChannelSelectChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkChannelSelectNodeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  inline bool checkSrcNodeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 16;
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class SignalChannelRouterWriter : public SignalChannelRouterReader {
 public:
  SignalChannelRouterWriter() {}

  explicit SignalChannelRouterWriter(const Xrpa::MemoryAccessor& memAccessor) : SignalChannelRouterReader(memAccessor) {}

  static SignalChannelRouterWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return SignalChannelRouterWriter(changeEvent.accessChangeData());
  }

  static SignalChannelRouterWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return SignalChannelRouterWriter(changeEvent.accessChangeData());
  }

  void setNumOutputs(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setNumChannels(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setChannelSelect(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

  void setChannelSelectNode(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

  void setSrcNode(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class SignalChannelSelectReader : public Xrpa::ObjectAccessorInterface {
 public:
  SignalChannelSelectReader() {}

  explicit SignalChannelSelectReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  int getNumOutputs() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  int getNumChannels() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  int getChannelIdx() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  Xrpa::ObjectUuid getSrcNode() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  inline bool checkNumOutputsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkNumChannelsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkChannelIdxChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkSrcNodeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class SignalChannelSelectWriter : public SignalChannelSelectReader {
 public:
  SignalChannelSelectWriter() {}

  explicit SignalChannelSelectWriter(const Xrpa::MemoryAccessor& memAccessor) : SignalChannelSelectReader(memAccessor) {}

  static SignalChannelSelectWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return SignalChannelSelectWriter(changeEvent.accessChangeData());
  }

  static SignalChannelSelectWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return SignalChannelSelectWriter(changeEvent.accessChangeData());
  }

  void setNumOutputs(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setNumChannels(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setChannelIdx(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setSrcNode(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class SignalChannelStackReader : public Xrpa::ObjectAccessorInterface {
 public:
  SignalChannelStackReader() {}

  explicit SignalChannelStackReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  int getNumOutputs() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  int getNumChannels() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  Xrpa::ObjectUuid getSrcNode0() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  Xrpa::ObjectUuid getSrcNode1() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  Xrpa::ObjectUuid getSrcNode2() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  Xrpa::ObjectUuid getSrcNode3() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  inline bool checkNumOutputsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkNumChannelsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkSrcNode0Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkSrcNode1Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  inline bool checkSrcNode2Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 16;
  }

  inline bool checkSrcNode3Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 32;
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class SignalChannelStackWriter : public SignalChannelStackReader {
 public:
  SignalChannelStackWriter() {}

  explicit SignalChannelStackWriter(const Xrpa::MemoryAccessor& memAccessor) : SignalChannelStackReader(memAccessor) {}

  static SignalChannelStackWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return SignalChannelStackWriter(changeEvent.accessChangeData());
  }

  static SignalChannelStackWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return SignalChannelStackWriter(changeEvent.accessChangeData());
  }

  void setNumOutputs(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setNumChannels(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setSrcNode0(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

  void setSrcNode1(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

  void setSrcNode2(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

  void setSrcNode3(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class SignalCurveReader : public Xrpa::ObjectAccessorInterface {
 public:
  SignalCurveReader() {}

  explicit SignalCurveReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  int getNumOutputs() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  bool getSoftCurve() {
    return (memAccessor_.readValue<int32_t>(readOffset_) == 1 ? true : false);
  }

  int getNumSegments() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  float getStartValue() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

  float getSegmentLength0() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

  float getSegmentEndValue0() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

  float getSegmentLength1() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

  float getSegmentEndValue1() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

  float getSegmentLength2() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

  float getSegmentEndValue2() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

  float getSegmentLength3() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

  float getSegmentEndValue3() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

  float getSegmentLength4() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

  float getSegmentEndValue4() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

  float getSegmentLength5() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

  float getSegmentEndValue5() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

  Xrpa::ObjectUuid getStartEvent() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  bool getAutoStart() {
    return (memAccessor_.readValue<int32_t>(readOffset_) == 1 ? true : false);
  }

  Xrpa::ObjectUuid getOnDoneEvent() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  bool getAutoLoop() {
    return (memAccessor_.readValue<int32_t>(readOffset_) == 1 ? true : false);
  }

  inline bool checkNumOutputsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkSoftCurveChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkNumSegmentsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkStartValueChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  inline bool checkSegmentLength0Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 16;
  }

  inline bool checkSegmentEndValue0Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 32;
  }

  inline bool checkSegmentLength1Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 64;
  }

  inline bool checkSegmentEndValue1Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 128;
  }

  inline bool checkSegmentLength2Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 256;
  }

  inline bool checkSegmentEndValue2Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 512;
  }

  inline bool checkSegmentLength3Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 1024;
  }

  inline bool checkSegmentEndValue3Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 2048;
  }

  inline bool checkSegmentLength4Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 4096;
  }

  inline bool checkSegmentEndValue4Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 8192;
  }

  inline bool checkSegmentLength5Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 16384;
  }

  inline bool checkSegmentEndValue5Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 32768;
  }

  inline bool checkStartEventChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 65536;
  }

  inline bool checkAutoStartChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 131072;
  }

  inline bool checkOnDoneEventChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 262144;
  }

  inline bool checkAutoLoopChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 524288;
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class SignalCurveWriter : public SignalCurveReader {
 public:
  SignalCurveWriter() {}

  explicit SignalCurveWriter(const Xrpa::MemoryAccessor& memAccessor) : SignalCurveReader(memAccessor) {}

  static SignalCurveWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return SignalCurveWriter(changeEvent.accessChangeData());
  }

  static SignalCurveWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return SignalCurveWriter(changeEvent.accessChangeData());
  }

  void setNumOutputs(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setSoftCurve(bool value) {
    memAccessor_.writeValue<int32_t>((value ? 1 : 0), writeOffset_);
  }

  void setNumSegments(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setStartValue(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

  void setSegmentLength0(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

  void setSegmentEndValue0(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

  void setSegmentLength1(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

  void setSegmentEndValue1(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

  void setSegmentLength2(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

  void setSegmentEndValue2(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

  void setSegmentLength3(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

  void setSegmentEndValue3(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

  void setSegmentLength4(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

  void setSegmentEndValue4(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

  void setSegmentLength5(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

  void setSegmentEndValue5(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

  void setStartEvent(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

  void setAutoStart(bool value) {
    memAccessor_.writeValue<int32_t>((value ? 1 : 0), writeOffset_);
  }

  void setOnDoneEvent(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

  void setAutoLoop(bool value) {
    memAccessor_.writeValue<int32_t>((value ? 1 : 0), writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class SignalDelayReader : public Xrpa::ObjectAccessorInterface {
 public:
  SignalDelayReader() {}

  explicit SignalDelayReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  int getNumOutputs() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  int getNumChannels() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  Xrpa::ObjectUuid getSrcNode() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  float getDelayTimeMs() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

  inline bool checkNumOutputsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkNumChannelsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkSrcNodeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkDelayTimeMsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class SignalDelayWriter : public SignalDelayReader {
 public:
  SignalDelayWriter() {}

  explicit SignalDelayWriter(const Xrpa::MemoryAccessor& memAccessor) : SignalDelayReader(memAccessor) {}

  static SignalDelayWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return SignalDelayWriter(changeEvent.accessChangeData());
  }

  static SignalDelayWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return SignalDelayWriter(changeEvent.accessChangeData());
  }

  void setNumOutputs(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setNumChannels(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setSrcNode(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

  void setDelayTimeMs(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class SignalFeedbackReader : public Xrpa::ObjectAccessorInterface {
 public:
  SignalFeedbackReader() {}

  explicit SignalFeedbackReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  int getNumOutputs() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  int getNumChannels() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  Xrpa::ObjectUuid getSrcNode() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  inline bool checkNumOutputsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkNumChannelsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkSrcNodeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class SignalFeedbackWriter : public SignalFeedbackReader {
 public:
  SignalFeedbackWriter() {}

  explicit SignalFeedbackWriter(const Xrpa::MemoryAccessor& memAccessor) : SignalFeedbackReader(memAccessor) {}

  static SignalFeedbackWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return SignalFeedbackWriter(changeEvent.accessChangeData());
  }

  static SignalFeedbackWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return SignalFeedbackWriter(changeEvent.accessChangeData());
  }

  void setNumOutputs(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setNumChannels(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setSrcNode(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class SignalMathOpReader : public Xrpa::ObjectAccessorInterface {
 public:
  SignalMathOpReader() {}

  explicit SignalMathOpReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  int getNumOutputs() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  int getNumChannels() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  MathOperation getOperation() {
    return static_cast<MathOperation>(memAccessor_.readValue<uint32_t>(readOffset_));
  }

  float getOperandA() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

  Xrpa::ObjectUuid getOperandANode() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  float getOperandB() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

  Xrpa::ObjectUuid getOperandBNode() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  inline bool checkNumOutputsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkNumChannelsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkOperationChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkOperandAChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  inline bool checkOperandANodeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 16;
  }

  inline bool checkOperandBChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 32;
  }

  inline bool checkOperandBNodeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 64;
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class SignalMathOpWriter : public SignalMathOpReader {
 public:
  SignalMathOpWriter() {}

  explicit SignalMathOpWriter(const Xrpa::MemoryAccessor& memAccessor) : SignalMathOpReader(memAccessor) {}

  static SignalMathOpWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return SignalMathOpWriter(changeEvent.accessChangeData());
  }

  static SignalMathOpWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return SignalMathOpWriter(changeEvent.accessChangeData());
  }

  void setNumOutputs(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setNumChannels(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setOperation(MathOperation value) {
    memAccessor_.writeValue<uint32_t>(static_cast<uint32_t>(value), writeOffset_);
  }

  void setOperandA(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

  void setOperandANode(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

  void setOperandB(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

  void setOperandBNode(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class SignalMultiplexerReader : public Xrpa::ObjectAccessorInterface {
 public:
  SignalMultiplexerReader() {}

  explicit SignalMultiplexerReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  int getNumOutputs() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  int getNumChannels() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  Xrpa::ObjectUuid getSrcNode0() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  Xrpa::ObjectUuid getSrcNode1() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  Xrpa::ObjectUuid getSrcNode2() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  Xrpa::ObjectUuid getSrcNode3() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  Xrpa::ObjectUuid getSrcNode4() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  Xrpa::ObjectUuid getSrcNode5() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  Xrpa::ObjectUuid getIncrementEvent() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  Xrpa::ObjectUuid getStartEvent() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  bool getAutoStart() {
    return (memAccessor_.readValue<int32_t>(readOffset_) == 1 ? true : false);
  }

  Xrpa::ObjectUuid getOnDoneEvent() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  inline bool checkNumOutputsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkNumChannelsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkSrcNode0Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkSrcNode1Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  inline bool checkSrcNode2Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 16;
  }

  inline bool checkSrcNode3Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 32;
  }

  inline bool checkSrcNode4Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 64;
  }

  inline bool checkSrcNode5Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 128;
  }

  inline bool checkIncrementEventChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 256;
  }

  inline bool checkStartEventChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 512;
  }

  inline bool checkAutoStartChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1024;
  }

  inline bool checkOnDoneEventChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2048;
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class SignalMultiplexerWriter : public SignalMultiplexerReader {
 public:
  SignalMultiplexerWriter() {}

  explicit SignalMultiplexerWriter(const Xrpa::MemoryAccessor& memAccessor) : SignalMultiplexerReader(memAccessor) {}

  static SignalMultiplexerWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return SignalMultiplexerWriter(changeEvent.accessChangeData());
  }

  static SignalMultiplexerWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return SignalMultiplexerWriter(changeEvent.accessChangeData());
  }

  void setNumOutputs(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setNumChannels(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setSrcNode0(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

  void setSrcNode1(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

  void setSrcNode2(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

  void setSrcNode3(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

  void setSrcNode4(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

  void setSrcNode5(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

  void setIncrementEvent(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

  void setStartEvent(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

  void setAutoStart(bool value) {
    memAccessor_.writeValue<int32_t>((value ? 1 : 0), writeOffset_);
  }

  void setOnDoneEvent(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class SignalParametricEqualizerReader : public Xrpa::ObjectAccessorInterface {
 public:
  SignalParametricEqualizerReader() {}

  explicit SignalParametricEqualizerReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  int getNumOutputs() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  int getNumChannels() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  Xrpa::ObjectUuid getSrcNode() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  FilterType getFilterType0() {
    return static_cast<FilterType>(memAccessor_.readValue<uint32_t>(readOffset_));
  }

  float getFrequency0() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

  float getQuality0() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

  float getGain0() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

  FilterType getFilterType1() {
    return static_cast<FilterType>(memAccessor_.readValue<uint32_t>(readOffset_));
  }

  float getFrequency1() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

  float getQuality1() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

  float getGain1() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

  FilterType getFilterType2() {
    return static_cast<FilterType>(memAccessor_.readValue<uint32_t>(readOffset_));
  }

  float getFrequency2() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

  float getQuality2() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

  float getGain2() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

  FilterType getFilterType3() {
    return static_cast<FilterType>(memAccessor_.readValue<uint32_t>(readOffset_));
  }

  float getFrequency3() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

  float getQuality3() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

  float getGain3() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

  FilterType getFilterType4() {
    return static_cast<FilterType>(memAccessor_.readValue<uint32_t>(readOffset_));
  }

  float getFrequency4() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

  float getQuality4() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

  float getGain4() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

  float getGainAdjust() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

  inline bool checkNumOutputsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkNumChannelsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkSrcNodeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkFilterType0Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  inline bool checkFrequency0Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 16;
  }

  inline bool checkQuality0Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 32;
  }

  inline bool checkGain0Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 64;
  }

  inline bool checkFilterType1Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 128;
  }

  inline bool checkFrequency1Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 256;
  }

  inline bool checkQuality1Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 512;
  }

  inline bool checkGain1Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 1024;
  }

  inline bool checkFilterType2Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 2048;
  }

  inline bool checkFrequency2Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 4096;
  }

  inline bool checkQuality2Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 8192;
  }

  inline bool checkGain2Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 16384;
  }

  inline bool checkFilterType3Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 32768;
  }

  inline bool checkFrequency3Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 65536;
  }

  inline bool checkQuality3Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 131072;
  }

  inline bool checkGain3Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 262144;
  }

  inline bool checkFilterType4Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 524288;
  }

  inline bool checkFrequency4Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 1048576;
  }

  inline bool checkQuality4Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 2097152;
  }

  inline bool checkGain4Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 4194304;
  }

  inline bool checkGainAdjustChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8388608;
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class SignalParametricEqualizerWriter : public SignalParametricEqualizerReader {
 public:
  SignalParametricEqualizerWriter() {}

  explicit SignalParametricEqualizerWriter(const Xrpa::MemoryAccessor& memAccessor) : SignalParametricEqualizerReader(memAccessor) {}

  static SignalParametricEqualizerWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return SignalParametricEqualizerWriter(changeEvent.accessChangeData());
  }

  static SignalParametricEqualizerWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return SignalParametricEqualizerWriter(changeEvent.accessChangeData());
  }

  void setNumOutputs(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setNumChannels(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setSrcNode(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

  void setFilterType0(FilterType value) {
    memAccessor_.writeValue<uint32_t>(static_cast<uint32_t>(value), writeOffset_);
  }

  void setFrequency0(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

  void setQuality0(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

  void setGain0(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

  void setFilterType1(FilterType value) {
    memAccessor_.writeValue<uint32_t>(static_cast<uint32_t>(value), writeOffset_);
  }

  void setFrequency1(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

  void setQuality1(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

  void setGain1(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

  void setFilterType2(FilterType value) {
    memAccessor_.writeValue<uint32_t>(static_cast<uint32_t>(value), writeOffset_);
  }

  void setFrequency2(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

  void setQuality2(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

  void setGain2(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

  void setFilterType3(FilterType value) {
    memAccessor_.writeValue<uint32_t>(static_cast<uint32_t>(value), writeOffset_);
  }

  void setFrequency3(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

  void setQuality3(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

  void setGain3(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

  void setFilterType4(FilterType value) {
    memAccessor_.writeValue<uint32_t>(static_cast<uint32_t>(value), writeOffset_);
  }

  void setFrequency4(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

  void setQuality4(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

  void setGain4(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

  void setGainAdjust(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class SignalPitchShiftReader : public Xrpa::ObjectAccessorInterface {
 public:
  SignalPitchShiftReader() {}

  explicit SignalPitchShiftReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  int getNumOutputs() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  int getNumChannels() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  Xrpa::ObjectUuid getSrcNode() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  int getPitchShiftSemitones() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  inline bool checkNumOutputsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkNumChannelsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkSrcNodeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkPitchShiftSemitonesChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class SignalPitchShiftWriter : public SignalPitchShiftReader {
 public:
  SignalPitchShiftWriter() {}

  explicit SignalPitchShiftWriter(const Xrpa::MemoryAccessor& memAccessor) : SignalPitchShiftReader(memAccessor) {}

  static SignalPitchShiftWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return SignalPitchShiftWriter(changeEvent.accessChangeData());
  }

  static SignalPitchShiftWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return SignalPitchShiftWriter(changeEvent.accessChangeData());
  }

  void setNumOutputs(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setNumChannels(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setSrcNode(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

  void setPitchShiftSemitones(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class SignalSoftClipReader : public Xrpa::ObjectAccessorInterface {
 public:
  SignalSoftClipReader() {}

  explicit SignalSoftClipReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  int getNumOutputs() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  int getNumChannels() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  Xrpa::ObjectUuid getSrcNode() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  inline bool checkNumOutputsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkNumChannelsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkSrcNodeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class SignalSoftClipWriter : public SignalSoftClipReader {
 public:
  SignalSoftClipWriter() {}

  explicit SignalSoftClipWriter(const Xrpa::MemoryAccessor& memAccessor) : SignalSoftClipReader(memAccessor) {}

  static SignalSoftClipWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return SignalSoftClipWriter(changeEvent.accessChangeData());
  }

  static SignalSoftClipWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return SignalSoftClipWriter(changeEvent.accessChangeData());
  }

  void setNumOutputs(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setNumChannels(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setSrcNode(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class SignalOutputDataReader : public Xrpa::ObjectAccessorInterface {
 public:
  SignalOutputDataReader() {}

  explicit SignalOutputDataReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  Xrpa::ObjectUuid getSrcNode() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  int getNumChannels() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  int getFrameRate() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  inline bool checkSrcNodeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkNumChannelsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkFrameRateChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class SignalOutputDataWriter : public SignalOutputDataReader {
 public:
  SignalOutputDataWriter() {}

  explicit SignalOutputDataWriter(const Xrpa::MemoryAccessor& memAccessor) : SignalOutputDataReader(memAccessor) {}

  static SignalOutputDataWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return SignalOutputDataWriter(changeEvent.accessChangeData());
  }

  static SignalOutputDataWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return SignalOutputDataWriter(changeEvent.accessChangeData());
  }

  void setSrcNode(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

  void setNumChannels(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setFrameRate(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class SignalOutputDeviceReader : public Xrpa::ObjectAccessorInterface {
 public:
  SignalOutputDeviceReader() {}

  explicit SignalOutputDeviceReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  Xrpa::ObjectUuid getSrcNode() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  int getChannelOffset() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  // pseudo-regex, with just $ and ^ supported for now
  std::string getDeviceNameFilter() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  bool getOutputToSystemAudio() {
    return (memAccessor_.readValue<int32_t>(readOffset_) == 1 ? true : false);
  }

  // Set to true if a matching device was found
  bool getFoundMatch() {
    return (memAccessor_.readValue<int32_t>(readOffset_) == 1 ? true : false);
  }

  inline bool checkSrcNodeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkChannelOffsetChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkDeviceNameFilterChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkOutputToSystemAudioChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  inline bool checkFoundMatchChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 16;
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class SignalOutputDeviceWriter : public SignalOutputDeviceReader {
 public:
  SignalOutputDeviceWriter() {}

  explicit SignalOutputDeviceWriter(const Xrpa::MemoryAccessor& memAccessor) : SignalOutputDeviceReader(memAccessor) {}

  static SignalOutputDeviceWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return SignalOutputDeviceWriter(changeEvent.accessChangeData());
  }

  static SignalOutputDeviceWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return SignalOutputDeviceWriter(changeEvent.accessChangeData());
  }

  void setSrcNode(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

  void setChannelOffset(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setDeviceNameFilter(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

  void setOutputToSystemAudio(bool value) {
    memAccessor_.writeValue<int32_t>((value ? 1 : 0), writeOffset_);
  }

  void setFoundMatch(bool value) {
    memAccessor_.writeValue<int32_t>((value ? 1 : 0), writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

// Reconciled Types
class ISignalNode : public Xrpa::DataStoreObject {
 public:
  ISignalNode(const Xrpa::ObjectUuid& id, Xrpa::IObjectCollection* collection) : Xrpa::DataStoreObject(id, collection) {}
};

class OutboundSignalEvent : public Xrpa::DataStoreObject {
 public:
  explicit OutboundSignalEvent(const Xrpa::ObjectUuid& id) : Xrpa::DataStoreObject(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  void writeDSChanges(Xrpa::TransportStreamAccessor* accessor) {
    SignalEventWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 0;
      changeByteCount_ = 0;
      objAccessor = SignalEventWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = SignalEventWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    }
    if (objAccessor.isNull()) {
      return;
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    createWritten_ = false;
    changeBits_ = 0;
    changeByteCount_ = 0;
    return createTimestamp_;
  }

  void processDSUpdate(SignalEventReader value, uint64_t fieldsChanged) {
    handleXrpaFieldsChanged(fieldsChanged);
  }

  void sendTriggerEvent(float payload) {
    auto message = TriggerEventMessageWriter(collection_->sendMessage(
        getXrpaId(),
        0,
        4));
    message.setPayload(payload);
  }

  void onReceiveEvent(std::function<void(uint64_t, ReceiveEventMessageReader)> handler) {
    receiveEventMessageHandler_ = handler;
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
    if (messageType == 1) {
      if (receiveEventMessageHandler_) {
        auto message = ReceiveEventMessageReader(messageData);
        receiveEventMessageHandler_(msgTimestamp, message);
      }
    }
  }

 protected:
  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) {
    if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(fieldsChanged); }
  }

  uint64_t createTimestamp_;
  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;
  bool createWritten_ = false;

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;
  std::function<void(uint64_t, ReceiveEventMessageReader)> receiveEventMessageHandler_ = nullptr;
};

class OutboundSignalEventCombiner : public Xrpa::DataStoreObject {
 public:
  explicit OutboundSignalEventCombiner(const Xrpa::ObjectUuid& id) : Xrpa::DataStoreObject(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  const Xrpa::ObjectUuid& getSrcEvent0() const {
    return localSrcEvent0_;
  }

  void setSrcEvent0(const Xrpa::ObjectUuid& srcEvent0) {
    localSrcEvent0_ = srcEvent0;
    if ((changeBits_ & 1) == 0) {
      changeBits_ |= 1;
      changeByteCount_ += 16;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 1);
    }
  }

  const Xrpa::ObjectUuid& getSrcEvent1() const {
    return localSrcEvent1_;
  }

  void setSrcEvent1(const Xrpa::ObjectUuid& srcEvent1) {
    localSrcEvent1_ = srcEvent1;
    if ((changeBits_ & 2) == 0) {
      changeBits_ |= 2;
      changeByteCount_ += 16;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 2);
    }
  }

  const Xrpa::ObjectUuid& getSrcEvent2() const {
    return localSrcEvent2_;
  }

  void setSrcEvent2(const Xrpa::ObjectUuid& srcEvent2) {
    localSrcEvent2_ = srcEvent2;
    if ((changeBits_ & 4) == 0) {
      changeBits_ |= 4;
      changeByteCount_ += 16;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 4);
    }
  }

  const Xrpa::ObjectUuid& getSrcEvent3() const {
    return localSrcEvent3_;
  }

  void setSrcEvent3(const Xrpa::ObjectUuid& srcEvent3) {
    localSrcEvent3_ = srcEvent3;
    if ((changeBits_ & 8) == 0) {
      changeBits_ |= 8;
      changeByteCount_ += 16;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 8);
    }
  }

  const Xrpa::ObjectUuid& getSrcEvent4() const {
    return localSrcEvent4_;
  }

  void setSrcEvent4(const Xrpa::ObjectUuid& srcEvent4) {
    localSrcEvent4_ = srcEvent4;
    if ((changeBits_ & 16) == 0) {
      changeBits_ |= 16;
      changeByteCount_ += 16;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 16);
    }
  }

  const Xrpa::ObjectUuid& getSrcEvent5() const {
    return localSrcEvent5_;
  }

  void setSrcEvent5(const Xrpa::ObjectUuid& srcEvent5) {
    localSrcEvent5_ = srcEvent5;
    if ((changeBits_ & 32) == 0) {
      changeBits_ |= 32;
      changeByteCount_ += 16;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 32);
    }
  }

  ParameterMode getParameterMode() const {
    return localParameterMode_;
  }

  void setParameterMode(ParameterMode parameterMode) {
    localParameterMode_ = parameterMode;
    if ((changeBits_ & 64) == 0) {
      changeBits_ |= 64;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 64);
    }
  }

  const Xrpa::ObjectUuid& getOnEvent() const {
    return localOnEvent_;
  }

  void setOnEvent(const Xrpa::ObjectUuid& onEvent) {
    localOnEvent_ = onEvent;
    if ((changeBits_ & 128) == 0) {
      changeBits_ |= 128;
      changeByteCount_ += 16;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 128);
    }
  }

  void writeDSChanges(Xrpa::TransportStreamAccessor* accessor) {
    SignalEventCombinerWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 255;
      changeByteCount_ = 116;
      objAccessor = SignalEventCombinerWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = SignalEventCombinerWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    }
    if (objAccessor.isNull()) {
      return;
    }
    if (changeBits_ & 1) {
      objAccessor.setSrcEvent0(localSrcEvent0_);
    }
    if (changeBits_ & 2) {
      objAccessor.setSrcEvent1(localSrcEvent1_);
    }
    if (changeBits_ & 4) {
      objAccessor.setSrcEvent2(localSrcEvent2_);
    }
    if (changeBits_ & 8) {
      objAccessor.setSrcEvent3(localSrcEvent3_);
    }
    if (changeBits_ & 16) {
      objAccessor.setSrcEvent4(localSrcEvent4_);
    }
    if (changeBits_ & 32) {
      objAccessor.setSrcEvent5(localSrcEvent5_);
    }
    if (changeBits_ & 64) {
      objAccessor.setParameterMode(localParameterMode_);
    }
    if (changeBits_ & 128) {
      objAccessor.setOnEvent(localOnEvent_);
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    createWritten_ = false;
    changeBits_ = 255;
    changeByteCount_ = 116;
    return createTimestamp_;
  }

  void processDSUpdate(SignalEventCombinerReader value, uint64_t fieldsChanged) {
    handleXrpaFieldsChanged(fieldsChanged);
  }

  inline bool checkSrcEvent0Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkSrcEvent1Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkSrcEvent2Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkSrcEvent3Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  inline bool checkSrcEvent4Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 16;
  }

  inline bool checkSrcEvent5Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 32;
  }

  inline bool checkParameterModeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 64;
  }

  inline bool checkOnEventChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 128;
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
  }

 protected:
  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) {
    if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(fieldsChanged); }
  }

  Xrpa::ObjectUuid localSrcEvent0_{0ULL, 0ULL};
  Xrpa::ObjectUuid localSrcEvent1_{0ULL, 0ULL};
  Xrpa::ObjectUuid localSrcEvent2_{0ULL, 0ULL};
  Xrpa::ObjectUuid localSrcEvent3_{0ULL, 0ULL};
  Xrpa::ObjectUuid localSrcEvent4_{0ULL, 0ULL};
  Xrpa::ObjectUuid localSrcEvent5_{0ULL, 0ULL};
  ParameterMode localParameterMode_ = ParameterMode::Passthrough;
  Xrpa::ObjectUuid localOnEvent_{0ULL, 0ULL};
  uint64_t createTimestamp_;
  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;
  bool createWritten_ = false;

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;
};

class OutboundSignalSource : public ISignalNode {
 public:
  explicit OutboundSignalSource(const Xrpa::ObjectUuid& id) : ISignalNode(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  int getNumOutputs() const {
    return localNumOutputs_;
  }

  void setNumOutputs(int numOutputs) {
    localNumOutputs_ = numOutputs;
    if ((changeBits_ & 1) == 0) {
      changeBits_ |= 1;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 1);
    }
  }

  int getNumChannels() const {
    return localNumChannels_;
  }

  void setNumChannels(int numChannels) {
    localNumChannels_ = numChannels;
    if ((changeBits_ & 2) == 0) {
      changeBits_ |= 2;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 2);
    }
  }

  void writeDSChanges(Xrpa::TransportStreamAccessor* accessor) {
    SignalSourceWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 3;
      changeByteCount_ = 8;
      objAccessor = SignalSourceWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = SignalSourceWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    }
    if (objAccessor.isNull()) {
      return;
    }
    if (changeBits_ & 1) {
      objAccessor.setNumOutputs(localNumOutputs_);
    }
    if (changeBits_ & 2) {
      objAccessor.setNumChannels(localNumChannels_);
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    createWritten_ = false;
    changeBits_ = 3;
    changeByteCount_ = 8;
    return createTimestamp_;
  }

  void processDSUpdate(SignalSourceReader value, uint64_t fieldsChanged) {
    handleXrpaFieldsChanged(fieldsChanged);
  }

  inline bool checkNumOutputsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkNumChannelsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  template <typename SampleType>
  void setSrcDataCallback(Xrpa::SignalProducerCallback<SampleType> signalCallback, int32_t numChannels, int32_t framesPerSecond, int32_t framesPerPacket);

  template <typename SampleType>
  void setSrcDataRingBuffer(Xrpa::SignalRingBuffer<SampleType>* signalRingBuffer, int32_t numChannels, int32_t framesPerSecond, int32_t framesPerPacket);

  template <typename SampleType>
  void setSrcDataForwarder(std::shared_ptr<Xrpa::InboundSignalForwarder> signalForwarder);

  template <typename SampleType>
  Xrpa::SignalPacket sendSrcData(int32_t frameCount, int32_t numChannels, int32_t framesPerSecond);

  void tickXrpa() {
    auto id = getXrpaId();
    localSrcData_.setRecipient(id, collection_, 2);
    localSrcData_.tick();
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
  }

 protected:
  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) {
    if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(fieldsChanged); }
  }

  int localNumOutputs_ = 1;
  int localNumChannels_ = 1;
  uint64_t createTimestamp_;
  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;
  bool createWritten_ = false;

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;
  Xrpa::OutboundSignalData localSrcData_{};
};

class OutboundSignalSourceFile : public ISignalNode {
 public:
  explicit OutboundSignalSourceFile(const Xrpa::ObjectUuid& id) : ISignalNode(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  int getNumOutputs() const {
    return localNumOutputs_;
  }

  void setNumOutputs(int numOutputs) {
    localNumOutputs_ = numOutputs;
    if ((changeBits_ & 1) == 0) {
      changeBits_ |= 1;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 1);
    }
  }

  const std::string& getFilePath() const {
    return localFilePath_;
  }

  void setFilePath(const std::string& filePath) {
    localFilePath_ = filePath;
    if ((changeBits_ & 2) == 0) {
      changeBits_ |= 2;
      changeByteCount_ += 4;
    }
    changeByteCount_ += Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localFilePath_);
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 2);
    }
  }

  bool getAutoPlay() const {
    return localAutoPlay_;
  }

  void setAutoPlay(bool autoPlay) {
    localAutoPlay_ = autoPlay;
    if ((changeBits_ & 4) == 0) {
      changeBits_ |= 4;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 4);
    }
  }

  void writeDSChanges(Xrpa::TransportStreamAccessor* accessor) {
    SignalSourceFileWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 7;
      changeByteCount_ = Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localFilePath_) + 12;
      objAccessor = SignalSourceFileWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = SignalSourceFileWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    }
    if (objAccessor.isNull()) {
      return;
    }
    if (changeBits_ & 1) {
      objAccessor.setNumOutputs(localNumOutputs_);
    }
    if (changeBits_ & 2) {
      objAccessor.setFilePath(localFilePath_);
    }
    if (changeBits_ & 4) {
      objAccessor.setAutoPlay(localAutoPlay_);
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    createWritten_ = false;
    changeBits_ = 7;
    changeByteCount_ = Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localFilePath_) + 12;
    return createTimestamp_;
  }

  void processDSUpdate(SignalSourceFileReader value, uint64_t fieldsChanged) {
    handleXrpaFieldsChanged(fieldsChanged);
  }

  inline bool checkNumOutputsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkFilePathChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkAutoPlayChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
  }

 protected:
  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) {
    if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(fieldsChanged); }
  }

  int localNumOutputs_ = 1;
  std::string localFilePath_ = "";
  bool localAutoPlay_ = true;
  uint64_t createTimestamp_;
  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;
  bool createWritten_ = false;

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;
};

class OutboundSignalOscillator : public ISignalNode {
 public:
  explicit OutboundSignalOscillator(const Xrpa::ObjectUuid& id) : ISignalNode(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  int getNumOutputs() const {
    return localNumOutputs_;
  }

  void setNumOutputs(int numOutputs) {
    localNumOutputs_ = numOutputs;
    if ((changeBits_ & 1) == 0) {
      changeBits_ |= 1;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 1);
    }
  }

  int getNumChannels() const {
    return localNumChannels_;
  }

  void setNumChannels(int numChannels) {
    localNumChannels_ = numChannels;
    if ((changeBits_ & 2) == 0) {
      changeBits_ |= 2;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 2);
    }
  }

  WaveformType getWaveformType() const {
    return localWaveformType_;
  }

  void setWaveformType(WaveformType waveformType) {
    localWaveformType_ = waveformType;
    if ((changeBits_ & 4) == 0) {
      changeBits_ |= 4;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 4);
    }
  }

  float getFrequency() const {
    return localFrequency_;
  }

  void setFrequency(float frequency) {
    localFrequency_ = frequency;
    if ((changeBits_ & 8) == 0) {
      changeBits_ |= 8;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 8);
    }
  }

  const Xrpa::ObjectUuid& getFrequencyNode() const {
    return localFrequencyNode_;
  }

  void setFrequencyNode(const Xrpa::ObjectUuid& frequencyNode) {
    localFrequencyNode_ = frequencyNode;
    if ((changeBits_ & 16) == 0) {
      changeBits_ |= 16;
      changeByteCount_ += 16;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 16);
    }
  }

  float getPulseWidth() const {
    return localPulseWidth_;
  }

  void setPulseWidth(float pulseWidth) {
    localPulseWidth_ = pulseWidth;
    if ((changeBits_ & 32) == 0) {
      changeBits_ |= 32;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 32);
    }
  }

  const Xrpa::ObjectUuid& getPulseWidthNode() const {
    return localPulseWidthNode_;
  }

  void setPulseWidthNode(const Xrpa::ObjectUuid& pulseWidthNode) {
    localPulseWidthNode_ = pulseWidthNode;
    if ((changeBits_ & 64) == 0) {
      changeBits_ |= 64;
      changeByteCount_ += 16;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 64);
    }
  }

  void writeDSChanges(Xrpa::TransportStreamAccessor* accessor) {
    SignalOscillatorWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 127;
      changeByteCount_ = 52;
      objAccessor = SignalOscillatorWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = SignalOscillatorWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    }
    if (objAccessor.isNull()) {
      return;
    }
    if (changeBits_ & 1) {
      objAccessor.setNumOutputs(localNumOutputs_);
    }
    if (changeBits_ & 2) {
      objAccessor.setNumChannels(localNumChannels_);
    }
    if (changeBits_ & 4) {
      objAccessor.setWaveformType(localWaveformType_);
    }
    if (changeBits_ & 8) {
      objAccessor.setFrequency(localFrequency_);
    }
    if (changeBits_ & 16) {
      objAccessor.setFrequencyNode(localFrequencyNode_);
    }
    if (changeBits_ & 32) {
      objAccessor.setPulseWidth(localPulseWidth_);
    }
    if (changeBits_ & 64) {
      objAccessor.setPulseWidthNode(localPulseWidthNode_);
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    createWritten_ = false;
    changeBits_ = 127;
    changeByteCount_ = 52;
    return createTimestamp_;
  }

  void processDSUpdate(SignalOscillatorReader value, uint64_t fieldsChanged) {
    handleXrpaFieldsChanged(fieldsChanged);
  }

  inline bool checkNumOutputsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkNumChannelsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkWaveformTypeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkFrequencyChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  inline bool checkFrequencyNodeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 16;
  }

  inline bool checkPulseWidthChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 32;
  }

  inline bool checkPulseWidthNodeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 64;
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
  }

 protected:
  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) {
    if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(fieldsChanged); }
  }

  int localNumOutputs_ = 1;
  int localNumChannels_ = 1;
  WaveformType localWaveformType_ = WaveformType::Sawtooth;
  float localFrequency_ = 440.f;
  Xrpa::ObjectUuid localFrequencyNode_{0ULL, 0ULL};
  float localPulseWidth_ = 0.5f;
  Xrpa::ObjectUuid localPulseWidthNode_{0ULL, 0ULL};
  uint64_t createTimestamp_;
  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;
  bool createWritten_ = false;

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;
};

class OutboundSignalChannelRouter : public ISignalNode {
 public:
  explicit OutboundSignalChannelRouter(const Xrpa::ObjectUuid& id) : ISignalNode(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  int getNumOutputs() const {
    return localNumOutputs_;
  }

  void setNumOutputs(int numOutputs) {
    localNumOutputs_ = numOutputs;
    if ((changeBits_ & 1) == 0) {
      changeBits_ |= 1;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 1);
    }
  }

  int getNumChannels() const {
    return localNumChannels_;
  }

  void setNumChannels(int numChannels) {
    localNumChannels_ = numChannels;
    if ((changeBits_ & 2) == 0) {
      changeBits_ |= 2;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 2);
    }
  }

  float getChannelSelect() const {
    return localChannelSelect_;
  }

  void setChannelSelect(float channelSelect) {
    localChannelSelect_ = channelSelect;
    if ((changeBits_ & 4) == 0) {
      changeBits_ |= 4;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 4);
    }
  }

  const Xrpa::ObjectUuid& getChannelSelectNode() const {
    return localChannelSelectNode_;
  }

  void setChannelSelectNode(const Xrpa::ObjectUuid& channelSelectNode) {
    localChannelSelectNode_ = channelSelectNode;
    if ((changeBits_ & 8) == 0) {
      changeBits_ |= 8;
      changeByteCount_ += 16;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 8);
    }
  }

  const Xrpa::ObjectUuid& getSrcNode() const {
    return localSrcNode_;
  }

  void setSrcNode(const Xrpa::ObjectUuid& srcNode) {
    localSrcNode_ = srcNode;
    if ((changeBits_ & 16) == 0) {
      changeBits_ |= 16;
      changeByteCount_ += 16;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 16);
    }
  }

  void writeDSChanges(Xrpa::TransportStreamAccessor* accessor) {
    SignalChannelRouterWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 31;
      changeByteCount_ = 44;
      objAccessor = SignalChannelRouterWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = SignalChannelRouterWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    }
    if (objAccessor.isNull()) {
      return;
    }
    if (changeBits_ & 1) {
      objAccessor.setNumOutputs(localNumOutputs_);
    }
    if (changeBits_ & 2) {
      objAccessor.setNumChannels(localNumChannels_);
    }
    if (changeBits_ & 4) {
      objAccessor.setChannelSelect(localChannelSelect_);
    }
    if (changeBits_ & 8) {
      objAccessor.setChannelSelectNode(localChannelSelectNode_);
    }
    if (changeBits_ & 16) {
      objAccessor.setSrcNode(localSrcNode_);
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    createWritten_ = false;
    changeBits_ = 31;
    changeByteCount_ = 44;
    return createTimestamp_;
  }

  void processDSUpdate(SignalChannelRouterReader value, uint64_t fieldsChanged) {
    handleXrpaFieldsChanged(fieldsChanged);
  }

  inline bool checkNumOutputsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkNumChannelsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkChannelSelectChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkChannelSelectNodeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  inline bool checkSrcNodeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 16;
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
  }

 protected:
  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) {
    if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(fieldsChanged); }
  }

  int localNumOutputs_ = 1;
  int localNumChannels_ = 1;
  float localChannelSelect_ = 0.5f;
  Xrpa::ObjectUuid localChannelSelectNode_{0ULL, 0ULL};
  Xrpa::ObjectUuid localSrcNode_{0ULL, 0ULL};
  uint64_t createTimestamp_;
  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;
  bool createWritten_ = false;

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;
};

class OutboundSignalChannelSelect : public ISignalNode {
 public:
  explicit OutboundSignalChannelSelect(const Xrpa::ObjectUuid& id) : ISignalNode(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  int getNumOutputs() const {
    return localNumOutputs_;
  }

  void setNumOutputs(int numOutputs) {
    localNumOutputs_ = numOutputs;
    if ((changeBits_ & 1) == 0) {
      changeBits_ |= 1;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 1);
    }
  }

  int getNumChannels() const {
    return localNumChannels_;
  }

  void setNumChannels(int numChannels) {
    localNumChannels_ = numChannels;
    if ((changeBits_ & 2) == 0) {
      changeBits_ |= 2;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 2);
    }
  }

  int getChannelIdx() const {
    return localChannelIdx_;
  }

  void setChannelIdx(int channelIdx) {
    localChannelIdx_ = channelIdx;
    if ((changeBits_ & 4) == 0) {
      changeBits_ |= 4;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 4);
    }
  }

  const Xrpa::ObjectUuid& getSrcNode() const {
    return localSrcNode_;
  }

  void setSrcNode(const Xrpa::ObjectUuid& srcNode) {
    localSrcNode_ = srcNode;
    if ((changeBits_ & 8) == 0) {
      changeBits_ |= 8;
      changeByteCount_ += 16;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 8);
    }
  }

  void writeDSChanges(Xrpa::TransportStreamAccessor* accessor) {
    SignalChannelSelectWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 15;
      changeByteCount_ = 28;
      objAccessor = SignalChannelSelectWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = SignalChannelSelectWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    }
    if (objAccessor.isNull()) {
      return;
    }
    if (changeBits_ & 1) {
      objAccessor.setNumOutputs(localNumOutputs_);
    }
    if (changeBits_ & 2) {
      objAccessor.setNumChannels(localNumChannels_);
    }
    if (changeBits_ & 4) {
      objAccessor.setChannelIdx(localChannelIdx_);
    }
    if (changeBits_ & 8) {
      objAccessor.setSrcNode(localSrcNode_);
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    createWritten_ = false;
    changeBits_ = 15;
    changeByteCount_ = 28;
    return createTimestamp_;
  }

  void processDSUpdate(SignalChannelSelectReader value, uint64_t fieldsChanged) {
    handleXrpaFieldsChanged(fieldsChanged);
  }

  inline bool checkNumOutputsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkNumChannelsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkChannelIdxChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkSrcNodeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
  }

 protected:
  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) {
    if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(fieldsChanged); }
  }

  int localNumOutputs_ = 1;
  int localNumChannels_ = 1;
  int localChannelIdx_ = 0;
  Xrpa::ObjectUuid localSrcNode_{0ULL, 0ULL};
  uint64_t createTimestamp_;
  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;
  bool createWritten_ = false;

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;
};

class OutboundSignalChannelStack : public ISignalNode {
 public:
  explicit OutboundSignalChannelStack(const Xrpa::ObjectUuid& id) : ISignalNode(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  int getNumOutputs() const {
    return localNumOutputs_;
  }

  void setNumOutputs(int numOutputs) {
    localNumOutputs_ = numOutputs;
    if ((changeBits_ & 1) == 0) {
      changeBits_ |= 1;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 1);
    }
  }

  int getNumChannels() const {
    return localNumChannels_;
  }

  void setNumChannels(int numChannels) {
    localNumChannels_ = numChannels;
    if ((changeBits_ & 2) == 0) {
      changeBits_ |= 2;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 2);
    }
  }

  const Xrpa::ObjectUuid& getSrcNode0() const {
    return localSrcNode0_;
  }

  void setSrcNode0(const Xrpa::ObjectUuid& srcNode0) {
    localSrcNode0_ = srcNode0;
    if ((changeBits_ & 4) == 0) {
      changeBits_ |= 4;
      changeByteCount_ += 16;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 4);
    }
  }

  const Xrpa::ObjectUuid& getSrcNode1() const {
    return localSrcNode1_;
  }

  void setSrcNode1(const Xrpa::ObjectUuid& srcNode1) {
    localSrcNode1_ = srcNode1;
    if ((changeBits_ & 8) == 0) {
      changeBits_ |= 8;
      changeByteCount_ += 16;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 8);
    }
  }

  const Xrpa::ObjectUuid& getSrcNode2() const {
    return localSrcNode2_;
  }

  void setSrcNode2(const Xrpa::ObjectUuid& srcNode2) {
    localSrcNode2_ = srcNode2;
    if ((changeBits_ & 16) == 0) {
      changeBits_ |= 16;
      changeByteCount_ += 16;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 16);
    }
  }

  const Xrpa::ObjectUuid& getSrcNode3() const {
    return localSrcNode3_;
  }

  void setSrcNode3(const Xrpa::ObjectUuid& srcNode3) {
    localSrcNode3_ = srcNode3;
    if ((changeBits_ & 32) == 0) {
      changeBits_ |= 32;
      changeByteCount_ += 16;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 32);
    }
  }

  void writeDSChanges(Xrpa::TransportStreamAccessor* accessor) {
    SignalChannelStackWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 63;
      changeByteCount_ = 72;
      objAccessor = SignalChannelStackWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = SignalChannelStackWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    }
    if (objAccessor.isNull()) {
      return;
    }
    if (changeBits_ & 1) {
      objAccessor.setNumOutputs(localNumOutputs_);
    }
    if (changeBits_ & 2) {
      objAccessor.setNumChannels(localNumChannels_);
    }
    if (changeBits_ & 4) {
      objAccessor.setSrcNode0(localSrcNode0_);
    }
    if (changeBits_ & 8) {
      objAccessor.setSrcNode1(localSrcNode1_);
    }
    if (changeBits_ & 16) {
      objAccessor.setSrcNode2(localSrcNode2_);
    }
    if (changeBits_ & 32) {
      objAccessor.setSrcNode3(localSrcNode3_);
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    createWritten_ = false;
    changeBits_ = 63;
    changeByteCount_ = 72;
    return createTimestamp_;
  }

  void processDSUpdate(SignalChannelStackReader value, uint64_t fieldsChanged) {
    handleXrpaFieldsChanged(fieldsChanged);
  }

  inline bool checkNumOutputsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkNumChannelsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkSrcNode0Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkSrcNode1Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  inline bool checkSrcNode2Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 16;
  }

  inline bool checkSrcNode3Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 32;
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
  }

 protected:
  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) {
    if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(fieldsChanged); }
  }

  int localNumOutputs_ = 1;
  int localNumChannels_ = 1;
  Xrpa::ObjectUuid localSrcNode0_{0ULL, 0ULL};
  Xrpa::ObjectUuid localSrcNode1_{0ULL, 0ULL};
  Xrpa::ObjectUuid localSrcNode2_{0ULL, 0ULL};
  Xrpa::ObjectUuid localSrcNode3_{0ULL, 0ULL};
  uint64_t createTimestamp_;
  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;
  bool createWritten_ = false;

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;
};

class OutboundSignalCurve : public ISignalNode {
 public:
  explicit OutboundSignalCurve(const Xrpa::ObjectUuid& id) : ISignalNode(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  int getNumOutputs() const {
    return localNumOutputs_;
  }

  void setNumOutputs(int numOutputs) {
    localNumOutputs_ = numOutputs;
    if ((changeBits_ & 1) == 0) {
      changeBits_ |= 1;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 1);
    }
  }

  bool getSoftCurve() const {
    return localSoftCurve_;
  }

  void setSoftCurve(bool softCurve) {
    localSoftCurve_ = softCurve;
    if ((changeBits_ & 2) == 0) {
      changeBits_ |= 2;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 2);
    }
  }

  int getNumSegments() const {
    return localNumSegments_;
  }

  void setNumSegments(int numSegments) {
    localNumSegments_ = numSegments;
    if ((changeBits_ & 4) == 0) {
      changeBits_ |= 4;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 4);
    }
  }

  float getStartValue() const {
    return localStartValue_;
  }

  void setStartValue(float startValue) {
    localStartValue_ = startValue;
    if ((changeBits_ & 8) == 0) {
      changeBits_ |= 8;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 8);
    }
  }

  float getSegmentLength0() const {
    return localSegmentLength0_;
  }

  void setSegmentLength0(float segmentLength0) {
    localSegmentLength0_ = segmentLength0;
    if ((changeBits_ & 16) == 0) {
      changeBits_ |= 16;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 16);
    }
  }

  float getSegmentEndValue0() const {
    return localSegmentEndValue0_;
  }

  void setSegmentEndValue0(float segmentEndValue0) {
    localSegmentEndValue0_ = segmentEndValue0;
    if ((changeBits_ & 32) == 0) {
      changeBits_ |= 32;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 32);
    }
  }

  float getSegmentLength1() const {
    return localSegmentLength1_;
  }

  void setSegmentLength1(float segmentLength1) {
    localSegmentLength1_ = segmentLength1;
    if ((changeBits_ & 64) == 0) {
      changeBits_ |= 64;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 64);
    }
  }

  float getSegmentEndValue1() const {
    return localSegmentEndValue1_;
  }

  void setSegmentEndValue1(float segmentEndValue1) {
    localSegmentEndValue1_ = segmentEndValue1;
    if ((changeBits_ & 128) == 0) {
      changeBits_ |= 128;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 128);
    }
  }

  float getSegmentLength2() const {
    return localSegmentLength2_;
  }

  void setSegmentLength2(float segmentLength2) {
    localSegmentLength2_ = segmentLength2;
    if ((changeBits_ & 256) == 0) {
      changeBits_ |= 256;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 256);
    }
  }

  float getSegmentEndValue2() const {
    return localSegmentEndValue2_;
  }

  void setSegmentEndValue2(float segmentEndValue2) {
    localSegmentEndValue2_ = segmentEndValue2;
    if ((changeBits_ & 512) == 0) {
      changeBits_ |= 512;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 512);
    }
  }

  float getSegmentLength3() const {
    return localSegmentLength3_;
  }

  void setSegmentLength3(float segmentLength3) {
    localSegmentLength3_ = segmentLength3;
    if ((changeBits_ & 1024) == 0) {
      changeBits_ |= 1024;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 1024);
    }
  }

  float getSegmentEndValue3() const {
    return localSegmentEndValue3_;
  }

  void setSegmentEndValue3(float segmentEndValue3) {
    localSegmentEndValue3_ = segmentEndValue3;
    if ((changeBits_ & 2048) == 0) {
      changeBits_ |= 2048;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 2048);
    }
  }

  float getSegmentLength4() const {
    return localSegmentLength4_;
  }

  void setSegmentLength4(float segmentLength4) {
    localSegmentLength4_ = segmentLength4;
    if ((changeBits_ & 4096) == 0) {
      changeBits_ |= 4096;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 4096);
    }
  }

  float getSegmentEndValue4() const {
    return localSegmentEndValue4_;
  }

  void setSegmentEndValue4(float segmentEndValue4) {
    localSegmentEndValue4_ = segmentEndValue4;
    if ((changeBits_ & 8192) == 0) {
      changeBits_ |= 8192;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 8192);
    }
  }

  float getSegmentLength5() const {
    return localSegmentLength5_;
  }

  void setSegmentLength5(float segmentLength5) {
    localSegmentLength5_ = segmentLength5;
    if ((changeBits_ & 16384) == 0) {
      changeBits_ |= 16384;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 16384);
    }
  }

  float getSegmentEndValue5() const {
    return localSegmentEndValue5_;
  }

  void setSegmentEndValue5(float segmentEndValue5) {
    localSegmentEndValue5_ = segmentEndValue5;
    if ((changeBits_ & 32768) == 0) {
      changeBits_ |= 32768;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 32768);
    }
  }

  const Xrpa::ObjectUuid& getStartEvent() const {
    return localStartEvent_;
  }

  void setStartEvent(const Xrpa::ObjectUuid& startEvent) {
    localStartEvent_ = startEvent;
    if ((changeBits_ & 65536) == 0) {
      changeBits_ |= 65536;
      changeByteCount_ += 16;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 65536);
    }
  }

  bool getAutoStart() const {
    return localAutoStart_;
  }

  void setAutoStart(bool autoStart) {
    localAutoStart_ = autoStart;
    if ((changeBits_ & 131072) == 0) {
      changeBits_ |= 131072;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 131072);
    }
  }

  const Xrpa::ObjectUuid& getOnDoneEvent() const {
    return localOnDoneEvent_;
  }

  void setOnDoneEvent(const Xrpa::ObjectUuid& onDoneEvent) {
    localOnDoneEvent_ = onDoneEvent;
    if ((changeBits_ & 262144) == 0) {
      changeBits_ |= 262144;
      changeByteCount_ += 16;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 262144);
    }
  }

  bool getAutoLoop() const {
    return localAutoLoop_;
  }

  void setAutoLoop(bool autoLoop) {
    localAutoLoop_ = autoLoop;
    if ((changeBits_ & 524288) == 0) {
      changeBits_ |= 524288;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 524288);
    }
  }

  void writeDSChanges(Xrpa::TransportStreamAccessor* accessor) {
    SignalCurveWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 1048575;
      changeByteCount_ = 104;
      objAccessor = SignalCurveWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = SignalCurveWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    }
    if (objAccessor.isNull()) {
      return;
    }
    if (changeBits_ & 1) {
      objAccessor.setNumOutputs(localNumOutputs_);
    }
    if (changeBits_ & 2) {
      objAccessor.setSoftCurve(localSoftCurve_);
    }
    if (changeBits_ & 4) {
      objAccessor.setNumSegments(localNumSegments_);
    }
    if (changeBits_ & 8) {
      objAccessor.setStartValue(localStartValue_);
    }
    if (changeBits_ & 16) {
      objAccessor.setSegmentLength0(localSegmentLength0_);
    }
    if (changeBits_ & 32) {
      objAccessor.setSegmentEndValue0(localSegmentEndValue0_);
    }
    if (changeBits_ & 64) {
      objAccessor.setSegmentLength1(localSegmentLength1_);
    }
    if (changeBits_ & 128) {
      objAccessor.setSegmentEndValue1(localSegmentEndValue1_);
    }
    if (changeBits_ & 256) {
      objAccessor.setSegmentLength2(localSegmentLength2_);
    }
    if (changeBits_ & 512) {
      objAccessor.setSegmentEndValue2(localSegmentEndValue2_);
    }
    if (changeBits_ & 1024) {
      objAccessor.setSegmentLength3(localSegmentLength3_);
    }
    if (changeBits_ & 2048) {
      objAccessor.setSegmentEndValue3(localSegmentEndValue3_);
    }
    if (changeBits_ & 4096) {
      objAccessor.setSegmentLength4(localSegmentLength4_);
    }
    if (changeBits_ & 8192) {
      objAccessor.setSegmentEndValue4(localSegmentEndValue4_);
    }
    if (changeBits_ & 16384) {
      objAccessor.setSegmentLength5(localSegmentLength5_);
    }
    if (changeBits_ & 32768) {
      objAccessor.setSegmentEndValue5(localSegmentEndValue5_);
    }
    if (changeBits_ & 65536) {
      objAccessor.setStartEvent(localStartEvent_);
    }
    if (changeBits_ & 131072) {
      objAccessor.setAutoStart(localAutoStart_);
    }
    if (changeBits_ & 262144) {
      objAccessor.setOnDoneEvent(localOnDoneEvent_);
    }
    if (changeBits_ & 524288) {
      objAccessor.setAutoLoop(localAutoLoop_);
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    createWritten_ = false;
    changeBits_ = 1048575;
    changeByteCount_ = 104;
    return createTimestamp_;
  }

  void processDSUpdate(SignalCurveReader value, uint64_t fieldsChanged) {
    handleXrpaFieldsChanged(fieldsChanged);
  }

  inline bool checkNumOutputsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkSoftCurveChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkNumSegmentsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkStartValueChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  inline bool checkSegmentLength0Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 16;
  }

  inline bool checkSegmentEndValue0Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 32;
  }

  inline bool checkSegmentLength1Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 64;
  }

  inline bool checkSegmentEndValue1Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 128;
  }

  inline bool checkSegmentLength2Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 256;
  }

  inline bool checkSegmentEndValue2Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 512;
  }

  inline bool checkSegmentLength3Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 1024;
  }

  inline bool checkSegmentEndValue3Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 2048;
  }

  inline bool checkSegmentLength4Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 4096;
  }

  inline bool checkSegmentEndValue4Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 8192;
  }

  inline bool checkSegmentLength5Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 16384;
  }

  inline bool checkSegmentEndValue5Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 32768;
  }

  inline bool checkStartEventChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 65536;
  }

  inline bool checkAutoStartChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 131072;
  }

  inline bool checkOnDoneEventChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 262144;
  }

  inline bool checkAutoLoopChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 524288;
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
  }

 protected:
  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) {
    if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(fieldsChanged); }
  }

  int localNumOutputs_ = 1;
  bool localSoftCurve_ = false;
  int localNumSegments_ = 1;
  float localStartValue_ = 1.f;
  float localSegmentLength0_ = 1.f;
  float localSegmentEndValue0_ = 1.f;
  float localSegmentLength1_ = 1.f;
  float localSegmentEndValue1_ = 1.f;
  float localSegmentLength2_ = 1.f;
  float localSegmentEndValue2_ = 1.f;
  float localSegmentLength3_ = 1.f;
  float localSegmentEndValue3_ = 1.f;
  float localSegmentLength4_ = 1.f;
  float localSegmentEndValue4_ = 1.f;
  float localSegmentLength5_ = 1.f;
  float localSegmentEndValue5_ = 1.f;
  Xrpa::ObjectUuid localStartEvent_{0ULL, 0ULL};
  bool localAutoStart_ = true;
  Xrpa::ObjectUuid localOnDoneEvent_{0ULL, 0ULL};
  bool localAutoLoop_ = false;
  uint64_t createTimestamp_;
  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;
  bool createWritten_ = false;

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;
};

class OutboundSignalDelay : public ISignalNode {
 public:
  explicit OutboundSignalDelay(const Xrpa::ObjectUuid& id) : ISignalNode(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  int getNumOutputs() const {
    return localNumOutputs_;
  }

  void setNumOutputs(int numOutputs) {
    localNumOutputs_ = numOutputs;
    if ((changeBits_ & 1) == 0) {
      changeBits_ |= 1;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 1);
    }
  }

  int getNumChannels() const {
    return localNumChannels_;
  }

  void setNumChannels(int numChannels) {
    localNumChannels_ = numChannels;
    if ((changeBits_ & 2) == 0) {
      changeBits_ |= 2;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 2);
    }
  }

  const Xrpa::ObjectUuid& getSrcNode() const {
    return localSrcNode_;
  }

  void setSrcNode(const Xrpa::ObjectUuid& srcNode) {
    localSrcNode_ = srcNode;
    if ((changeBits_ & 4) == 0) {
      changeBits_ |= 4;
      changeByteCount_ += 16;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 4);
    }
  }

  float getDelayTimeMs() const {
    return localDelayTimeMs_;
  }

  void setDelayTimeMs(float delayTimeMs) {
    localDelayTimeMs_ = delayTimeMs;
    if ((changeBits_ & 8) == 0) {
      changeBits_ |= 8;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 8);
    }
  }

  void writeDSChanges(Xrpa::TransportStreamAccessor* accessor) {
    SignalDelayWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 15;
      changeByteCount_ = 28;
      objAccessor = SignalDelayWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = SignalDelayWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    }
    if (objAccessor.isNull()) {
      return;
    }
    if (changeBits_ & 1) {
      objAccessor.setNumOutputs(localNumOutputs_);
    }
    if (changeBits_ & 2) {
      objAccessor.setNumChannels(localNumChannels_);
    }
    if (changeBits_ & 4) {
      objAccessor.setSrcNode(localSrcNode_);
    }
    if (changeBits_ & 8) {
      objAccessor.setDelayTimeMs(localDelayTimeMs_);
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    createWritten_ = false;
    changeBits_ = 15;
    changeByteCount_ = 28;
    return createTimestamp_;
  }

  void processDSUpdate(SignalDelayReader value, uint64_t fieldsChanged) {
    handleXrpaFieldsChanged(fieldsChanged);
  }

  inline bool checkNumOutputsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkNumChannelsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkSrcNodeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkDelayTimeMsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
  }

 protected:
  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) {
    if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(fieldsChanged); }
  }

  int localNumOutputs_ = 1;
  int localNumChannels_ = 1;
  Xrpa::ObjectUuid localSrcNode_{0ULL, 0ULL};
  float localDelayTimeMs_ = 1.f;
  uint64_t createTimestamp_;
  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;
  bool createWritten_ = false;

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;
};

class OutboundSignalFeedback : public ISignalNode {
 public:
  explicit OutboundSignalFeedback(const Xrpa::ObjectUuid& id) : ISignalNode(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  int getNumOutputs() const {
    return localNumOutputs_;
  }

  void setNumOutputs(int numOutputs) {
    localNumOutputs_ = numOutputs;
    if ((changeBits_ & 1) == 0) {
      changeBits_ |= 1;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 1);
    }
  }

  int getNumChannels() const {
    return localNumChannels_;
  }

  void setNumChannels(int numChannels) {
    localNumChannels_ = numChannels;
    if ((changeBits_ & 2) == 0) {
      changeBits_ |= 2;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 2);
    }
  }

  const Xrpa::ObjectUuid& getSrcNode() const {
    return localSrcNode_;
  }

  void setSrcNode(const Xrpa::ObjectUuid& srcNode) {
    localSrcNode_ = srcNode;
    if ((changeBits_ & 4) == 0) {
      changeBits_ |= 4;
      changeByteCount_ += 16;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 4);
    }
  }

  void writeDSChanges(Xrpa::TransportStreamAccessor* accessor) {
    SignalFeedbackWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 7;
      changeByteCount_ = 24;
      objAccessor = SignalFeedbackWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = SignalFeedbackWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    }
    if (objAccessor.isNull()) {
      return;
    }
    if (changeBits_ & 1) {
      objAccessor.setNumOutputs(localNumOutputs_);
    }
    if (changeBits_ & 2) {
      objAccessor.setNumChannels(localNumChannels_);
    }
    if (changeBits_ & 4) {
      objAccessor.setSrcNode(localSrcNode_);
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    createWritten_ = false;
    changeBits_ = 7;
    changeByteCount_ = 24;
    return createTimestamp_;
  }

  void processDSUpdate(SignalFeedbackReader value, uint64_t fieldsChanged) {
    handleXrpaFieldsChanged(fieldsChanged);
  }

  inline bool checkNumOutputsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkNumChannelsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkSrcNodeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
  }

 protected:
  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) {
    if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(fieldsChanged); }
  }

  int localNumOutputs_ = 1;
  int localNumChannels_ = 1;
  Xrpa::ObjectUuid localSrcNode_{0ULL, 0ULL};
  uint64_t createTimestamp_;
  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;
  bool createWritten_ = false;

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;
};

class OutboundSignalMathOp : public ISignalNode {
 public:
  explicit OutboundSignalMathOp(const Xrpa::ObjectUuid& id) : ISignalNode(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  int getNumOutputs() const {
    return localNumOutputs_;
  }

  void setNumOutputs(int numOutputs) {
    localNumOutputs_ = numOutputs;
    if ((changeBits_ & 1) == 0) {
      changeBits_ |= 1;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 1);
    }
  }

  int getNumChannels() const {
    return localNumChannels_;
  }

  void setNumChannels(int numChannels) {
    localNumChannels_ = numChannels;
    if ((changeBits_ & 2) == 0) {
      changeBits_ |= 2;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 2);
    }
  }

  MathOperation getOperation() const {
    return localOperation_;
  }

  void setOperation(MathOperation operation) {
    localOperation_ = operation;
    if ((changeBits_ & 4) == 0) {
      changeBits_ |= 4;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 4);
    }
  }

  float getOperandA() const {
    return localOperandA_;
  }

  void setOperandA(float operandA) {
    localOperandA_ = operandA;
    if ((changeBits_ & 8) == 0) {
      changeBits_ |= 8;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 8);
    }
  }

  const Xrpa::ObjectUuid& getOperandANode() const {
    return localOperandANode_;
  }

  void setOperandANode(const Xrpa::ObjectUuid& operandANode) {
    localOperandANode_ = operandANode;
    if ((changeBits_ & 16) == 0) {
      changeBits_ |= 16;
      changeByteCount_ += 16;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 16);
    }
  }

  float getOperandB() const {
    return localOperandB_;
  }

  void setOperandB(float operandB) {
    localOperandB_ = operandB;
    if ((changeBits_ & 32) == 0) {
      changeBits_ |= 32;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 32);
    }
  }

  const Xrpa::ObjectUuid& getOperandBNode() const {
    return localOperandBNode_;
  }

  void setOperandBNode(const Xrpa::ObjectUuid& operandBNode) {
    localOperandBNode_ = operandBNode;
    if ((changeBits_ & 64) == 0) {
      changeBits_ |= 64;
      changeByteCount_ += 16;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 64);
    }
  }

  void writeDSChanges(Xrpa::TransportStreamAccessor* accessor) {
    SignalMathOpWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 127;
      changeByteCount_ = 52;
      objAccessor = SignalMathOpWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = SignalMathOpWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    }
    if (objAccessor.isNull()) {
      return;
    }
    if (changeBits_ & 1) {
      objAccessor.setNumOutputs(localNumOutputs_);
    }
    if (changeBits_ & 2) {
      objAccessor.setNumChannels(localNumChannels_);
    }
    if (changeBits_ & 4) {
      objAccessor.setOperation(localOperation_);
    }
    if (changeBits_ & 8) {
      objAccessor.setOperandA(localOperandA_);
    }
    if (changeBits_ & 16) {
      objAccessor.setOperandANode(localOperandANode_);
    }
    if (changeBits_ & 32) {
      objAccessor.setOperandB(localOperandB_);
    }
    if (changeBits_ & 64) {
      objAccessor.setOperandBNode(localOperandBNode_);
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    createWritten_ = false;
    changeBits_ = 127;
    changeByteCount_ = 52;
    return createTimestamp_;
  }

  void processDSUpdate(SignalMathOpReader value, uint64_t fieldsChanged) {
    handleXrpaFieldsChanged(fieldsChanged);
  }

  inline bool checkNumOutputsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkNumChannelsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkOperationChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkOperandAChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  inline bool checkOperandANodeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 16;
  }

  inline bool checkOperandBChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 32;
  }

  inline bool checkOperandBNodeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 64;
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
  }

 protected:
  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) {
    if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(fieldsChanged); }
  }

  int localNumOutputs_ = 1;
  int localNumChannels_ = 1;
  MathOperation localOperation_ = MathOperation::Add;
  float localOperandA_ = 1.f;
  Xrpa::ObjectUuid localOperandANode_{0ULL, 0ULL};
  float localOperandB_ = 1.f;
  Xrpa::ObjectUuid localOperandBNode_{0ULL, 0ULL};
  uint64_t createTimestamp_;
  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;
  bool createWritten_ = false;

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;
};

class OutboundSignalMultiplexer : public ISignalNode {
 public:
  explicit OutboundSignalMultiplexer(const Xrpa::ObjectUuid& id) : ISignalNode(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  int getNumOutputs() const {
    return localNumOutputs_;
  }

  void setNumOutputs(int numOutputs) {
    localNumOutputs_ = numOutputs;
    if ((changeBits_ & 1) == 0) {
      changeBits_ |= 1;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 1);
    }
  }

  int getNumChannels() const {
    return localNumChannels_;
  }

  void setNumChannels(int numChannels) {
    localNumChannels_ = numChannels;
    if ((changeBits_ & 2) == 0) {
      changeBits_ |= 2;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 2);
    }
  }

  const Xrpa::ObjectUuid& getSrcNode0() const {
    return localSrcNode0_;
  }

  void setSrcNode0(const Xrpa::ObjectUuid& srcNode0) {
    localSrcNode0_ = srcNode0;
    if ((changeBits_ & 4) == 0) {
      changeBits_ |= 4;
      changeByteCount_ += 16;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 4);
    }
  }

  const Xrpa::ObjectUuid& getSrcNode1() const {
    return localSrcNode1_;
  }

  void setSrcNode1(const Xrpa::ObjectUuid& srcNode1) {
    localSrcNode1_ = srcNode1;
    if ((changeBits_ & 8) == 0) {
      changeBits_ |= 8;
      changeByteCount_ += 16;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 8);
    }
  }

  const Xrpa::ObjectUuid& getSrcNode2() const {
    return localSrcNode2_;
  }

  void setSrcNode2(const Xrpa::ObjectUuid& srcNode2) {
    localSrcNode2_ = srcNode2;
    if ((changeBits_ & 16) == 0) {
      changeBits_ |= 16;
      changeByteCount_ += 16;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 16);
    }
  }

  const Xrpa::ObjectUuid& getSrcNode3() const {
    return localSrcNode3_;
  }

  void setSrcNode3(const Xrpa::ObjectUuid& srcNode3) {
    localSrcNode3_ = srcNode3;
    if ((changeBits_ & 32) == 0) {
      changeBits_ |= 32;
      changeByteCount_ += 16;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 32);
    }
  }

  const Xrpa::ObjectUuid& getSrcNode4() const {
    return localSrcNode4_;
  }

  void setSrcNode4(const Xrpa::ObjectUuid& srcNode4) {
    localSrcNode4_ = srcNode4;
    if ((changeBits_ & 64) == 0) {
      changeBits_ |= 64;
      changeByteCount_ += 16;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 64);
    }
  }

  const Xrpa::ObjectUuid& getSrcNode5() const {
    return localSrcNode5_;
  }

  void setSrcNode5(const Xrpa::ObjectUuid& srcNode5) {
    localSrcNode5_ = srcNode5;
    if ((changeBits_ & 128) == 0) {
      changeBits_ |= 128;
      changeByteCount_ += 16;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 128);
    }
  }

  const Xrpa::ObjectUuid& getIncrementEvent() const {
    return localIncrementEvent_;
  }

  void setIncrementEvent(const Xrpa::ObjectUuid& incrementEvent) {
    localIncrementEvent_ = incrementEvent;
    if ((changeBits_ & 256) == 0) {
      changeBits_ |= 256;
      changeByteCount_ += 16;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 256);
    }
  }

  const Xrpa::ObjectUuid& getStartEvent() const {
    return localStartEvent_;
  }

  void setStartEvent(const Xrpa::ObjectUuid& startEvent) {
    localStartEvent_ = startEvent;
    if ((changeBits_ & 512) == 0) {
      changeBits_ |= 512;
      changeByteCount_ += 16;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 512);
    }
  }

  bool getAutoStart() const {
    return localAutoStart_;
  }

  void setAutoStart(bool autoStart) {
    localAutoStart_ = autoStart;
    if ((changeBits_ & 1024) == 0) {
      changeBits_ |= 1024;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 1024);
    }
  }

  const Xrpa::ObjectUuid& getOnDoneEvent() const {
    return localOnDoneEvent_;
  }

  void setOnDoneEvent(const Xrpa::ObjectUuid& onDoneEvent) {
    localOnDoneEvent_ = onDoneEvent;
    if ((changeBits_ & 2048) == 0) {
      changeBits_ |= 2048;
      changeByteCount_ += 16;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 2048);
    }
  }

  void writeDSChanges(Xrpa::TransportStreamAccessor* accessor) {
    SignalMultiplexerWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 4095;
      changeByteCount_ = 156;
      objAccessor = SignalMultiplexerWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = SignalMultiplexerWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    }
    if (objAccessor.isNull()) {
      return;
    }
    if (changeBits_ & 1) {
      objAccessor.setNumOutputs(localNumOutputs_);
    }
    if (changeBits_ & 2) {
      objAccessor.setNumChannels(localNumChannels_);
    }
    if (changeBits_ & 4) {
      objAccessor.setSrcNode0(localSrcNode0_);
    }
    if (changeBits_ & 8) {
      objAccessor.setSrcNode1(localSrcNode1_);
    }
    if (changeBits_ & 16) {
      objAccessor.setSrcNode2(localSrcNode2_);
    }
    if (changeBits_ & 32) {
      objAccessor.setSrcNode3(localSrcNode3_);
    }
    if (changeBits_ & 64) {
      objAccessor.setSrcNode4(localSrcNode4_);
    }
    if (changeBits_ & 128) {
      objAccessor.setSrcNode5(localSrcNode5_);
    }
    if (changeBits_ & 256) {
      objAccessor.setIncrementEvent(localIncrementEvent_);
    }
    if (changeBits_ & 512) {
      objAccessor.setStartEvent(localStartEvent_);
    }
    if (changeBits_ & 1024) {
      objAccessor.setAutoStart(localAutoStart_);
    }
    if (changeBits_ & 2048) {
      objAccessor.setOnDoneEvent(localOnDoneEvent_);
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    createWritten_ = false;
    changeBits_ = 4095;
    changeByteCount_ = 156;
    return createTimestamp_;
  }

  void processDSUpdate(SignalMultiplexerReader value, uint64_t fieldsChanged) {
    handleXrpaFieldsChanged(fieldsChanged);
  }

  inline bool checkNumOutputsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkNumChannelsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkSrcNode0Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkSrcNode1Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  inline bool checkSrcNode2Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 16;
  }

  inline bool checkSrcNode3Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 32;
  }

  inline bool checkSrcNode4Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 64;
  }

  inline bool checkSrcNode5Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 128;
  }

  inline bool checkIncrementEventChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 256;
  }

  inline bool checkStartEventChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 512;
  }

  inline bool checkAutoStartChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1024;
  }

  inline bool checkOnDoneEventChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2048;
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
  }

 protected:
  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) {
    if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(fieldsChanged); }
  }

  int localNumOutputs_ = 1;
  int localNumChannels_ = 1;
  Xrpa::ObjectUuid localSrcNode0_{0ULL, 0ULL};
  Xrpa::ObjectUuid localSrcNode1_{0ULL, 0ULL};
  Xrpa::ObjectUuid localSrcNode2_{0ULL, 0ULL};
  Xrpa::ObjectUuid localSrcNode3_{0ULL, 0ULL};
  Xrpa::ObjectUuid localSrcNode4_{0ULL, 0ULL};
  Xrpa::ObjectUuid localSrcNode5_{0ULL, 0ULL};
  Xrpa::ObjectUuid localIncrementEvent_{0ULL, 0ULL};
  Xrpa::ObjectUuid localStartEvent_{0ULL, 0ULL};
  bool localAutoStart_ = true;
  Xrpa::ObjectUuid localOnDoneEvent_{0ULL, 0ULL};
  uint64_t createTimestamp_;
  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;
  bool createWritten_ = false;

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;
};

class OutboundSignalParametricEqualizer : public ISignalNode {
 public:
  explicit OutboundSignalParametricEqualizer(const Xrpa::ObjectUuid& id) : ISignalNode(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  int getNumOutputs() const {
    return localNumOutputs_;
  }

  void setNumOutputs(int numOutputs) {
    localNumOutputs_ = numOutputs;
    if ((changeBits_ & 1) == 0) {
      changeBits_ |= 1;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 1);
    }
  }

  int getNumChannels() const {
    return localNumChannels_;
  }

  void setNumChannels(int numChannels) {
    localNumChannels_ = numChannels;
    if ((changeBits_ & 2) == 0) {
      changeBits_ |= 2;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 2);
    }
  }

  const Xrpa::ObjectUuid& getSrcNode() const {
    return localSrcNode_;
  }

  void setSrcNode(const Xrpa::ObjectUuid& srcNode) {
    localSrcNode_ = srcNode;
    if ((changeBits_ & 4) == 0) {
      changeBits_ |= 4;
      changeByteCount_ += 16;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 4);
    }
  }

  FilterType getFilterType0() const {
    return localFilterType0_;
  }

  void setFilterType0(FilterType filterType0) {
    localFilterType0_ = filterType0;
    if ((changeBits_ & 8) == 0) {
      changeBits_ |= 8;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 8);
    }
  }

  float getFrequency0() const {
    return localFrequency0_;
  }

  void setFrequency0(float frequency0) {
    localFrequency0_ = frequency0;
    if ((changeBits_ & 16) == 0) {
      changeBits_ |= 16;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 16);
    }
  }

  float getQuality0() const {
    return localQuality0_;
  }

  void setQuality0(float quality0) {
    localQuality0_ = quality0;
    if ((changeBits_ & 32) == 0) {
      changeBits_ |= 32;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 32);
    }
  }

  float getGain0() const {
    return localGain0_;
  }

  void setGain0(float gain0) {
    localGain0_ = gain0;
    if ((changeBits_ & 64) == 0) {
      changeBits_ |= 64;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 64);
    }
  }

  FilterType getFilterType1() const {
    return localFilterType1_;
  }

  void setFilterType1(FilterType filterType1) {
    localFilterType1_ = filterType1;
    if ((changeBits_ & 128) == 0) {
      changeBits_ |= 128;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 128);
    }
  }

  float getFrequency1() const {
    return localFrequency1_;
  }

  void setFrequency1(float frequency1) {
    localFrequency1_ = frequency1;
    if ((changeBits_ & 256) == 0) {
      changeBits_ |= 256;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 256);
    }
  }

  float getQuality1() const {
    return localQuality1_;
  }

  void setQuality1(float quality1) {
    localQuality1_ = quality1;
    if ((changeBits_ & 512) == 0) {
      changeBits_ |= 512;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 512);
    }
  }

  float getGain1() const {
    return localGain1_;
  }

  void setGain1(float gain1) {
    localGain1_ = gain1;
    if ((changeBits_ & 1024) == 0) {
      changeBits_ |= 1024;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 1024);
    }
  }

  FilterType getFilterType2() const {
    return localFilterType2_;
  }

  void setFilterType2(FilterType filterType2) {
    localFilterType2_ = filterType2;
    if ((changeBits_ & 2048) == 0) {
      changeBits_ |= 2048;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 2048);
    }
  }

  float getFrequency2() const {
    return localFrequency2_;
  }

  void setFrequency2(float frequency2) {
    localFrequency2_ = frequency2;
    if ((changeBits_ & 4096) == 0) {
      changeBits_ |= 4096;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 4096);
    }
  }

  float getQuality2() const {
    return localQuality2_;
  }

  void setQuality2(float quality2) {
    localQuality2_ = quality2;
    if ((changeBits_ & 8192) == 0) {
      changeBits_ |= 8192;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 8192);
    }
  }

  float getGain2() const {
    return localGain2_;
  }

  void setGain2(float gain2) {
    localGain2_ = gain2;
    if ((changeBits_ & 16384) == 0) {
      changeBits_ |= 16384;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 16384);
    }
  }

  FilterType getFilterType3() const {
    return localFilterType3_;
  }

  void setFilterType3(FilterType filterType3) {
    localFilterType3_ = filterType3;
    if ((changeBits_ & 32768) == 0) {
      changeBits_ |= 32768;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 32768);
    }
  }

  float getFrequency3() const {
    return localFrequency3_;
  }

  void setFrequency3(float frequency3) {
    localFrequency3_ = frequency3;
    if ((changeBits_ & 65536) == 0) {
      changeBits_ |= 65536;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 65536);
    }
  }

  float getQuality3() const {
    return localQuality3_;
  }

  void setQuality3(float quality3) {
    localQuality3_ = quality3;
    if ((changeBits_ & 131072) == 0) {
      changeBits_ |= 131072;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 131072);
    }
  }

  float getGain3() const {
    return localGain3_;
  }

  void setGain3(float gain3) {
    localGain3_ = gain3;
    if ((changeBits_ & 262144) == 0) {
      changeBits_ |= 262144;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 262144);
    }
  }

  FilterType getFilterType4() const {
    return localFilterType4_;
  }

  void setFilterType4(FilterType filterType4) {
    localFilterType4_ = filterType4;
    if ((changeBits_ & 524288) == 0) {
      changeBits_ |= 524288;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 524288);
    }
  }

  float getFrequency4() const {
    return localFrequency4_;
  }

  void setFrequency4(float frequency4) {
    localFrequency4_ = frequency4;
    if ((changeBits_ & 1048576) == 0) {
      changeBits_ |= 1048576;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 1048576);
    }
  }

  float getQuality4() const {
    return localQuality4_;
  }

  void setQuality4(float quality4) {
    localQuality4_ = quality4;
    if ((changeBits_ & 2097152) == 0) {
      changeBits_ |= 2097152;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 2097152);
    }
  }

  float getGain4() const {
    return localGain4_;
  }

  void setGain4(float gain4) {
    localGain4_ = gain4;
    if ((changeBits_ & 4194304) == 0) {
      changeBits_ |= 4194304;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 4194304);
    }
  }

  float getGainAdjust() const {
    return localGainAdjust_;
  }

  void setGainAdjust(float gainAdjust) {
    localGainAdjust_ = gainAdjust;
    if ((changeBits_ & 8388608) == 0) {
      changeBits_ |= 8388608;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 8388608);
    }
  }

  void writeDSChanges(Xrpa::TransportStreamAccessor* accessor) {
    SignalParametricEqualizerWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 16777215;
      changeByteCount_ = 108;
      objAccessor = SignalParametricEqualizerWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = SignalParametricEqualizerWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    }
    if (objAccessor.isNull()) {
      return;
    }
    if (changeBits_ & 1) {
      objAccessor.setNumOutputs(localNumOutputs_);
    }
    if (changeBits_ & 2) {
      objAccessor.setNumChannels(localNumChannels_);
    }
    if (changeBits_ & 4) {
      objAccessor.setSrcNode(localSrcNode_);
    }
    if (changeBits_ & 8) {
      objAccessor.setFilterType0(localFilterType0_);
    }
    if (changeBits_ & 16) {
      objAccessor.setFrequency0(localFrequency0_);
    }
    if (changeBits_ & 32) {
      objAccessor.setQuality0(localQuality0_);
    }
    if (changeBits_ & 64) {
      objAccessor.setGain0(localGain0_);
    }
    if (changeBits_ & 128) {
      objAccessor.setFilterType1(localFilterType1_);
    }
    if (changeBits_ & 256) {
      objAccessor.setFrequency1(localFrequency1_);
    }
    if (changeBits_ & 512) {
      objAccessor.setQuality1(localQuality1_);
    }
    if (changeBits_ & 1024) {
      objAccessor.setGain1(localGain1_);
    }
    if (changeBits_ & 2048) {
      objAccessor.setFilterType2(localFilterType2_);
    }
    if (changeBits_ & 4096) {
      objAccessor.setFrequency2(localFrequency2_);
    }
    if (changeBits_ & 8192) {
      objAccessor.setQuality2(localQuality2_);
    }
    if (changeBits_ & 16384) {
      objAccessor.setGain2(localGain2_);
    }
    if (changeBits_ & 32768) {
      objAccessor.setFilterType3(localFilterType3_);
    }
    if (changeBits_ & 65536) {
      objAccessor.setFrequency3(localFrequency3_);
    }
    if (changeBits_ & 131072) {
      objAccessor.setQuality3(localQuality3_);
    }
    if (changeBits_ & 262144) {
      objAccessor.setGain3(localGain3_);
    }
    if (changeBits_ & 524288) {
      objAccessor.setFilterType4(localFilterType4_);
    }
    if (changeBits_ & 1048576) {
      objAccessor.setFrequency4(localFrequency4_);
    }
    if (changeBits_ & 2097152) {
      objAccessor.setQuality4(localQuality4_);
    }
    if (changeBits_ & 4194304) {
      objAccessor.setGain4(localGain4_);
    }
    if (changeBits_ & 8388608) {
      objAccessor.setGainAdjust(localGainAdjust_);
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    createWritten_ = false;
    changeBits_ = 16777215;
    changeByteCount_ = 108;
    return createTimestamp_;
  }

  void processDSUpdate(SignalParametricEqualizerReader value, uint64_t fieldsChanged) {
    handleXrpaFieldsChanged(fieldsChanged);
  }

  inline bool checkNumOutputsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkNumChannelsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkSrcNodeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkFilterType0Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  inline bool checkFrequency0Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 16;
  }

  inline bool checkQuality0Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 32;
  }

  inline bool checkGain0Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 64;
  }

  inline bool checkFilterType1Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 128;
  }

  inline bool checkFrequency1Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 256;
  }

  inline bool checkQuality1Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 512;
  }

  inline bool checkGain1Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 1024;
  }

  inline bool checkFilterType2Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 2048;
  }

  inline bool checkFrequency2Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 4096;
  }

  inline bool checkQuality2Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 8192;
  }

  inline bool checkGain2Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 16384;
  }

  inline bool checkFilterType3Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 32768;
  }

  inline bool checkFrequency3Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 65536;
  }

  inline bool checkQuality3Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 131072;
  }

  inline bool checkGain3Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 262144;
  }

  inline bool checkFilterType4Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 524288;
  }

  inline bool checkFrequency4Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 1048576;
  }

  inline bool checkQuality4Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 2097152;
  }

  inline bool checkGain4Changed(uint64_t fieldsChanged) const {
    return fieldsChanged & 4194304;
  }

  inline bool checkGainAdjustChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8388608;
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
  }

 protected:
  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) {
    if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(fieldsChanged); }
  }

  int localNumOutputs_ = 1;
  int localNumChannels_ = 1;
  Xrpa::ObjectUuid localSrcNode_{0ULL, 0ULL};
  FilterType localFilterType0_ = FilterType::Bypass;
  float localFrequency0_ = 50.f;
  float localQuality0_ = 0.707106f;
  float localGain0_ = 0.f;
  FilterType localFilterType1_ = FilterType::Bypass;
  float localFrequency1_ = 50.f;
  float localQuality1_ = 0.707106f;
  float localGain1_ = 0.f;
  FilterType localFilterType2_ = FilterType::Bypass;
  float localFrequency2_ = 50.f;
  float localQuality2_ = 0.707106f;
  float localGain2_ = 0.f;
  FilterType localFilterType3_ = FilterType::Bypass;
  float localFrequency3_ = 50.f;
  float localQuality3_ = 0.707106f;
  float localGain3_ = 0.f;
  FilterType localFilterType4_ = FilterType::Bypass;
  float localFrequency4_ = 50.f;
  float localQuality4_ = 0.707106f;
  float localGain4_ = 0.f;
  float localGainAdjust_ = 0.f;
  uint64_t createTimestamp_;
  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;
  bool createWritten_ = false;

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;
};

class OutboundSignalPitchShift : public ISignalNode {
 public:
  explicit OutboundSignalPitchShift(const Xrpa::ObjectUuid& id) : ISignalNode(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  int getNumOutputs() const {
    return localNumOutputs_;
  }

  void setNumOutputs(int numOutputs) {
    localNumOutputs_ = numOutputs;
    if ((changeBits_ & 1) == 0) {
      changeBits_ |= 1;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 1);
    }
  }

  int getNumChannels() const {
    return localNumChannels_;
  }

  void setNumChannels(int numChannels) {
    localNumChannels_ = numChannels;
    if ((changeBits_ & 2) == 0) {
      changeBits_ |= 2;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 2);
    }
  }

  const Xrpa::ObjectUuid& getSrcNode() const {
    return localSrcNode_;
  }

  void setSrcNode(const Xrpa::ObjectUuid& srcNode) {
    localSrcNode_ = srcNode;
    if ((changeBits_ & 4) == 0) {
      changeBits_ |= 4;
      changeByteCount_ += 16;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 4);
    }
  }

  int getPitchShiftSemitones() const {
    return localPitchShiftSemitones_;
  }

  void setPitchShiftSemitones(int pitchShiftSemitones) {
    localPitchShiftSemitones_ = pitchShiftSemitones;
    if ((changeBits_ & 8) == 0) {
      changeBits_ |= 8;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 8);
    }
  }

  void writeDSChanges(Xrpa::TransportStreamAccessor* accessor) {
    SignalPitchShiftWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 15;
      changeByteCount_ = 28;
      objAccessor = SignalPitchShiftWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = SignalPitchShiftWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    }
    if (objAccessor.isNull()) {
      return;
    }
    if (changeBits_ & 1) {
      objAccessor.setNumOutputs(localNumOutputs_);
    }
    if (changeBits_ & 2) {
      objAccessor.setNumChannels(localNumChannels_);
    }
    if (changeBits_ & 4) {
      objAccessor.setSrcNode(localSrcNode_);
    }
    if (changeBits_ & 8) {
      objAccessor.setPitchShiftSemitones(localPitchShiftSemitones_);
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    createWritten_ = false;
    changeBits_ = 15;
    changeByteCount_ = 28;
    return createTimestamp_;
  }

  void processDSUpdate(SignalPitchShiftReader value, uint64_t fieldsChanged) {
    handleXrpaFieldsChanged(fieldsChanged);
  }

  inline bool checkNumOutputsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkNumChannelsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkSrcNodeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkPitchShiftSemitonesChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
  }

 protected:
  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) {
    if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(fieldsChanged); }
  }

  int localNumOutputs_ = 1;
  int localNumChannels_ = 1;
  Xrpa::ObjectUuid localSrcNode_{0ULL, 0ULL};
  int localPitchShiftSemitones_ = 0;
  uint64_t createTimestamp_;
  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;
  bool createWritten_ = false;

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;
};

class OutboundSignalSoftClip : public ISignalNode {
 public:
  explicit OutboundSignalSoftClip(const Xrpa::ObjectUuid& id) : ISignalNode(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  int getNumOutputs() const {
    return localNumOutputs_;
  }

  void setNumOutputs(int numOutputs) {
    localNumOutputs_ = numOutputs;
    if ((changeBits_ & 1) == 0) {
      changeBits_ |= 1;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 1);
    }
  }

  int getNumChannels() const {
    return localNumChannels_;
  }

  void setNumChannels(int numChannels) {
    localNumChannels_ = numChannels;
    if ((changeBits_ & 2) == 0) {
      changeBits_ |= 2;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 2);
    }
  }

  const Xrpa::ObjectUuid& getSrcNode() const {
    return localSrcNode_;
  }

  void setSrcNode(const Xrpa::ObjectUuid& srcNode) {
    localSrcNode_ = srcNode;
    if ((changeBits_ & 4) == 0) {
      changeBits_ |= 4;
      changeByteCount_ += 16;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 4);
    }
  }

  void writeDSChanges(Xrpa::TransportStreamAccessor* accessor) {
    SignalSoftClipWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 7;
      changeByteCount_ = 24;
      objAccessor = SignalSoftClipWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = SignalSoftClipWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    }
    if (objAccessor.isNull()) {
      return;
    }
    if (changeBits_ & 1) {
      objAccessor.setNumOutputs(localNumOutputs_);
    }
    if (changeBits_ & 2) {
      objAccessor.setNumChannels(localNumChannels_);
    }
    if (changeBits_ & 4) {
      objAccessor.setSrcNode(localSrcNode_);
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    createWritten_ = false;
    changeBits_ = 7;
    changeByteCount_ = 24;
    return createTimestamp_;
  }

  void processDSUpdate(SignalSoftClipReader value, uint64_t fieldsChanged) {
    handleXrpaFieldsChanged(fieldsChanged);
  }

  inline bool checkNumOutputsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkNumChannelsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkSrcNodeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
  }

 protected:
  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) {
    if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(fieldsChanged); }
  }

  int localNumOutputs_ = 1;
  int localNumChannels_ = 1;
  Xrpa::ObjectUuid localSrcNode_{0ULL, 0ULL};
  uint64_t createTimestamp_;
  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;
  bool createWritten_ = false;

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;
};

class OutboundSignalOutputData : public Xrpa::DataStoreObject {
 public:
  explicit OutboundSignalOutputData(const Xrpa::ObjectUuid& id) : Xrpa::DataStoreObject(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  const Xrpa::ObjectUuid& getSrcNode() const {
    return localSrcNode_;
  }

  void setSrcNode(const Xrpa::ObjectUuid& srcNode) {
    localSrcNode_ = srcNode;
    if ((changeBits_ & 1) == 0) {
      changeBits_ |= 1;
      changeByteCount_ += 16;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 1);
    }
  }

  int getNumChannels() const {
    return localNumChannels_;
  }

  void setNumChannels(int numChannels) {
    localNumChannels_ = numChannels;
    if ((changeBits_ & 2) == 0) {
      changeBits_ |= 2;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 2);
    }
  }

  int getFrameRate() const {
    return localFrameRate_;
  }

  void setFrameRate(int frameRate) {
    localFrameRate_ = frameRate;
    if ((changeBits_ & 4) == 0) {
      changeBits_ |= 4;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 4);
    }
  }

  void writeDSChanges(Xrpa::TransportStreamAccessor* accessor) {
    SignalOutputDataWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 7;
      changeByteCount_ = 24;
      objAccessor = SignalOutputDataWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = SignalOutputDataWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    }
    if (objAccessor.isNull()) {
      return;
    }
    if (changeBits_ & 1) {
      objAccessor.setSrcNode(localSrcNode_);
    }
    if (changeBits_ & 2) {
      objAccessor.setNumChannels(localNumChannels_);
    }
    if (changeBits_ & 4) {
      objAccessor.setFrameRate(localFrameRate_);
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    createWritten_ = false;
    changeBits_ = 7;
    changeByteCount_ = 24;
    return createTimestamp_;
  }

  void processDSUpdate(SignalOutputDataReader value, uint64_t fieldsChanged) {
    handleXrpaFieldsChanged(fieldsChanged);
  }

  inline bool checkSrcNodeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkNumChannelsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkFrameRateChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  void onData(std::shared_ptr<Xrpa::InboundSignalDataInterface> handler) {
    dataSignalHandler_ = handler;
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
    if (messageType == 3) {
      if (dataSignalHandler_) {
        dataSignalHandler_->onSignalData(msgTimestamp, messageData);
      }
    }
  }

 protected:
  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) {
    if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(fieldsChanged); }
  }

  Xrpa::ObjectUuid localSrcNode_{0ULL, 0ULL};
  int localNumChannels_ = 1;
  int localFrameRate_ = 0;
  uint64_t createTimestamp_;
  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;
  bool createWritten_ = false;

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;
  std::shared_ptr<Xrpa::InboundSignalDataInterface> dataSignalHandler_ = nullptr;
};

class OutboundSignalOutputDevice : public Xrpa::DataStoreObject {
 public:
  explicit OutboundSignalOutputDevice(const Xrpa::ObjectUuid& id) : Xrpa::DataStoreObject(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  const Xrpa::ObjectUuid& getSrcNode() const {
    return localSrcNode_;
  }

  void setSrcNode(const Xrpa::ObjectUuid& srcNode) {
    localSrcNode_ = srcNode;
    if ((changeBits_ & 1) == 0) {
      changeBits_ |= 1;
      changeByteCount_ += 16;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 1);
    }
  }

  int getChannelOffset() const {
    return localChannelOffset_;
  }

  void setChannelOffset(int channelOffset) {
    localChannelOffset_ = channelOffset;
    if ((changeBits_ & 2) == 0) {
      changeBits_ |= 2;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 2);
    }
  }

  const std::string& getDeviceNameFilter() const {
    return localDeviceNameFilter_;
  }

  void setDeviceNameFilter(const std::string& deviceNameFilter) {
    localDeviceNameFilter_ = deviceNameFilter;
    if ((changeBits_ & 4) == 0) {
      changeBits_ |= 4;
      changeByteCount_ += 4;
    }
    changeByteCount_ += Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localDeviceNameFilter_);
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 4);
    }
  }

  bool getOutputToSystemAudio() const {
    return localOutputToSystemAudio_;
  }

  void setOutputToSystemAudio(bool outputToSystemAudio) {
    localOutputToSystemAudio_ = outputToSystemAudio;
    if ((changeBits_ & 8) == 0) {
      changeBits_ |= 8;
      changeByteCount_ += 4;
    }
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 8);
    }
  }

  void writeDSChanges(Xrpa::TransportStreamAccessor* accessor) {
    SignalOutputDeviceWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 15;
      changeByteCount_ = Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localDeviceNameFilter_) + 28;
      objAccessor = SignalOutputDeviceWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = SignalOutputDeviceWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    }
    if (objAccessor.isNull()) {
      return;
    }
    if (changeBits_ & 1) {
      objAccessor.setSrcNode(localSrcNode_);
    }
    if (changeBits_ & 2) {
      objAccessor.setChannelOffset(localChannelOffset_);
    }
    if (changeBits_ & 4) {
      objAccessor.setDeviceNameFilter(localDeviceNameFilter_);
    }
    if (changeBits_ & 8) {
      objAccessor.setOutputToSystemAudio(localOutputToSystemAudio_);
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    createWritten_ = false;
    changeBits_ = 15;
    changeByteCount_ = Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localDeviceNameFilter_) + 28;
    return createTimestamp_;
  }

  void processDSUpdate(SignalOutputDeviceReader value, uint64_t fieldsChanged) {
    if (value.checkFoundMatchChanged(fieldsChanged)) {
      localFoundMatch_ = value.getFoundMatch();
    }
    handleXrpaFieldsChanged(fieldsChanged);
  }

  bool getFoundMatch() const {
    return localFoundMatch_;
  }

  inline bool checkSrcNodeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkChannelOffsetChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkDeviceNameFilterChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkOutputToSystemAudioChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  inline bool checkFoundMatchChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 16;
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
  }

 protected:
  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) {
    if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(fieldsChanged); }
  }

  Xrpa::ObjectUuid localSrcNode_{0ULL, 0ULL};
  int localChannelOffset_ = 0;

  // pseudo-regex, with just $ and ^ supported for now
  std::string localDeviceNameFilter_ = "";

  bool localOutputToSystemAudio_ = false;
  uint64_t createTimestamp_;
  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;
  bool createWritten_ = false;

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;

  // Set to true if a matching device was found
  bool localFoundMatch_ = false;
};

// Object Collections
class OutboundSignalEventReaderCollection : public Xrpa::ObjectCollection<SignalEventReader, std::shared_ptr<OutboundSignalEvent>> {
 public:
  explicit OutboundSignalEventReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<SignalEventReader, std::shared_ptr<OutboundSignalEvent>>(reconciler, 0, 0, 0, true) {}

  void addObject(std::shared_ptr<OutboundSignalEvent> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundSignalEvent> createObject() {
    auto obj = std::make_shared<OutboundSignalEvent>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
    addObjectInternal(obj);
    return obj;
  }

  void removeObject(const Xrpa::ObjectUuid& id) {
    removeObjectInternal(id);
  }
};

class OutboundSignalEventCombinerReaderCollection : public Xrpa::ObjectCollection<SignalEventCombinerReader, std::shared_ptr<OutboundSignalEventCombiner>> {
 public:
  explicit OutboundSignalEventCombinerReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<SignalEventCombinerReader, std::shared_ptr<OutboundSignalEventCombiner>>(reconciler, 1, 0, 0, true) {}

  void addObject(std::shared_ptr<OutboundSignalEventCombiner> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundSignalEventCombiner> createObject() {
    auto obj = std::make_shared<OutboundSignalEventCombiner>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
    addObjectInternal(obj);
    return obj;
  }

  void removeObject(const Xrpa::ObjectUuid& id) {
    removeObjectInternal(id);
  }
};

class OutboundSignalSourceReaderCollection : public Xrpa::ObjectCollection<SignalSourceReader, std::shared_ptr<OutboundSignalSource>> {
 public:
  explicit OutboundSignalSourceReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<SignalSourceReader, std::shared_ptr<OutboundSignalSource>>(reconciler, 2, 0, 0, true) {}

  void addObject(std::shared_ptr<OutboundSignalSource> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundSignalSource> createObject() {
    auto obj = std::make_shared<OutboundSignalSource>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
    addObjectInternal(obj);
    return obj;
  }

  void removeObject(const Xrpa::ObjectUuid& id) {
    removeObjectInternal(id);
  }
};

class OutboundSignalSourceFileReaderCollection : public Xrpa::ObjectCollection<SignalSourceFileReader, std::shared_ptr<OutboundSignalSourceFile>> {
 public:
  explicit OutboundSignalSourceFileReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<SignalSourceFileReader, std::shared_ptr<OutboundSignalSourceFile>>(reconciler, 3, 0, 0, true) {}

  void addObject(std::shared_ptr<OutboundSignalSourceFile> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundSignalSourceFile> createObject() {
    auto obj = std::make_shared<OutboundSignalSourceFile>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
    addObjectInternal(obj);
    return obj;
  }

  void removeObject(const Xrpa::ObjectUuid& id) {
    removeObjectInternal(id);
  }
};

class OutboundSignalOscillatorReaderCollection : public Xrpa::ObjectCollection<SignalOscillatorReader, std::shared_ptr<OutboundSignalOscillator>> {
 public:
  explicit OutboundSignalOscillatorReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<SignalOscillatorReader, std::shared_ptr<OutboundSignalOscillator>>(reconciler, 4, 0, 0, true) {}

  void addObject(std::shared_ptr<OutboundSignalOscillator> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundSignalOscillator> createObject() {
    auto obj = std::make_shared<OutboundSignalOscillator>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
    addObjectInternal(obj);
    return obj;
  }

  void removeObject(const Xrpa::ObjectUuid& id) {
    removeObjectInternal(id);
  }
};

class OutboundSignalChannelRouterReaderCollection : public Xrpa::ObjectCollection<SignalChannelRouterReader, std::shared_ptr<OutboundSignalChannelRouter>> {
 public:
  explicit OutboundSignalChannelRouterReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<SignalChannelRouterReader, std::shared_ptr<OutboundSignalChannelRouter>>(reconciler, 5, 0, 0, true) {}

  void addObject(std::shared_ptr<OutboundSignalChannelRouter> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundSignalChannelRouter> createObject() {
    auto obj = std::make_shared<OutboundSignalChannelRouter>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
    addObjectInternal(obj);
    return obj;
  }

  void removeObject(const Xrpa::ObjectUuid& id) {
    removeObjectInternal(id);
  }
};

class OutboundSignalChannelSelectReaderCollection : public Xrpa::ObjectCollection<SignalChannelSelectReader, std::shared_ptr<OutboundSignalChannelSelect>> {
 public:
  explicit OutboundSignalChannelSelectReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<SignalChannelSelectReader, std::shared_ptr<OutboundSignalChannelSelect>>(reconciler, 6, 0, 0, true) {}

  void addObject(std::shared_ptr<OutboundSignalChannelSelect> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundSignalChannelSelect> createObject() {
    auto obj = std::make_shared<OutboundSignalChannelSelect>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
    addObjectInternal(obj);
    return obj;
  }

  void removeObject(const Xrpa::ObjectUuid& id) {
    removeObjectInternal(id);
  }
};

class OutboundSignalChannelStackReaderCollection : public Xrpa::ObjectCollection<SignalChannelStackReader, std::shared_ptr<OutboundSignalChannelStack>> {
 public:
  explicit OutboundSignalChannelStackReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<SignalChannelStackReader, std::shared_ptr<OutboundSignalChannelStack>>(reconciler, 7, 0, 0, true) {}

  void addObject(std::shared_ptr<OutboundSignalChannelStack> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundSignalChannelStack> createObject() {
    auto obj = std::make_shared<OutboundSignalChannelStack>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
    addObjectInternal(obj);
    return obj;
  }

  void removeObject(const Xrpa::ObjectUuid& id) {
    removeObjectInternal(id);
  }
};

class OutboundSignalCurveReaderCollection : public Xrpa::ObjectCollection<SignalCurveReader, std::shared_ptr<OutboundSignalCurve>> {
 public:
  explicit OutboundSignalCurveReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<SignalCurveReader, std::shared_ptr<OutboundSignalCurve>>(reconciler, 8, 0, 0, true) {}

  void addObject(std::shared_ptr<OutboundSignalCurve> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundSignalCurve> createObject() {
    auto obj = std::make_shared<OutboundSignalCurve>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
    addObjectInternal(obj);
    return obj;
  }

  void removeObject(const Xrpa::ObjectUuid& id) {
    removeObjectInternal(id);
  }
};

class OutboundSignalDelayReaderCollection : public Xrpa::ObjectCollection<SignalDelayReader, std::shared_ptr<OutboundSignalDelay>> {
 public:
  explicit OutboundSignalDelayReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<SignalDelayReader, std::shared_ptr<OutboundSignalDelay>>(reconciler, 9, 0, 0, true) {}

  void addObject(std::shared_ptr<OutboundSignalDelay> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundSignalDelay> createObject() {
    auto obj = std::make_shared<OutboundSignalDelay>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
    addObjectInternal(obj);
    return obj;
  }

  void removeObject(const Xrpa::ObjectUuid& id) {
    removeObjectInternal(id);
  }
};

class OutboundSignalFeedbackReaderCollection : public Xrpa::ObjectCollection<SignalFeedbackReader, std::shared_ptr<OutboundSignalFeedback>> {
 public:
  explicit OutboundSignalFeedbackReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<SignalFeedbackReader, std::shared_ptr<OutboundSignalFeedback>>(reconciler, 10, 0, 0, true) {}

  void addObject(std::shared_ptr<OutboundSignalFeedback> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundSignalFeedback> createObject() {
    auto obj = std::make_shared<OutboundSignalFeedback>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
    addObjectInternal(obj);
    return obj;
  }

  void removeObject(const Xrpa::ObjectUuid& id) {
    removeObjectInternal(id);
  }
};

class OutboundSignalMathOpReaderCollection : public Xrpa::ObjectCollection<SignalMathOpReader, std::shared_ptr<OutboundSignalMathOp>> {
 public:
  explicit OutboundSignalMathOpReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<SignalMathOpReader, std::shared_ptr<OutboundSignalMathOp>>(reconciler, 11, 0, 0, true) {}

  void addObject(std::shared_ptr<OutboundSignalMathOp> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundSignalMathOp> createObject() {
    auto obj = std::make_shared<OutboundSignalMathOp>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
    addObjectInternal(obj);
    return obj;
  }

  void removeObject(const Xrpa::ObjectUuid& id) {
    removeObjectInternal(id);
  }
};

class OutboundSignalMultiplexerReaderCollection : public Xrpa::ObjectCollection<SignalMultiplexerReader, std::shared_ptr<OutboundSignalMultiplexer>> {
 public:
  explicit OutboundSignalMultiplexerReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<SignalMultiplexerReader, std::shared_ptr<OutboundSignalMultiplexer>>(reconciler, 12, 0, 0, true) {}

  void addObject(std::shared_ptr<OutboundSignalMultiplexer> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundSignalMultiplexer> createObject() {
    auto obj = std::make_shared<OutboundSignalMultiplexer>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
    addObjectInternal(obj);
    return obj;
  }

  void removeObject(const Xrpa::ObjectUuid& id) {
    removeObjectInternal(id);
  }
};

class OutboundSignalParametricEqualizerReaderCollection : public Xrpa::ObjectCollection<SignalParametricEqualizerReader, std::shared_ptr<OutboundSignalParametricEqualizer>> {
 public:
  explicit OutboundSignalParametricEqualizerReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<SignalParametricEqualizerReader, std::shared_ptr<OutboundSignalParametricEqualizer>>(reconciler, 13, 0, 0, true) {}

  void addObject(std::shared_ptr<OutboundSignalParametricEqualizer> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundSignalParametricEqualizer> createObject() {
    auto obj = std::make_shared<OutboundSignalParametricEqualizer>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
    addObjectInternal(obj);
    return obj;
  }

  void removeObject(const Xrpa::ObjectUuid& id) {
    removeObjectInternal(id);
  }
};

class OutboundSignalPitchShiftReaderCollection : public Xrpa::ObjectCollection<SignalPitchShiftReader, std::shared_ptr<OutboundSignalPitchShift>> {
 public:
  explicit OutboundSignalPitchShiftReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<SignalPitchShiftReader, std::shared_ptr<OutboundSignalPitchShift>>(reconciler, 14, 0, 0, true) {}

  void addObject(std::shared_ptr<OutboundSignalPitchShift> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundSignalPitchShift> createObject() {
    auto obj = std::make_shared<OutboundSignalPitchShift>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
    addObjectInternal(obj);
    return obj;
  }

  void removeObject(const Xrpa::ObjectUuid& id) {
    removeObjectInternal(id);
  }
};

class OutboundSignalSoftClipReaderCollection : public Xrpa::ObjectCollection<SignalSoftClipReader, std::shared_ptr<OutboundSignalSoftClip>> {
 public:
  explicit OutboundSignalSoftClipReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<SignalSoftClipReader, std::shared_ptr<OutboundSignalSoftClip>>(reconciler, 15, 0, 0, true) {}

  void addObject(std::shared_ptr<OutboundSignalSoftClip> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundSignalSoftClip> createObject() {
    auto obj = std::make_shared<OutboundSignalSoftClip>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
    addObjectInternal(obj);
    return obj;
  }

  void removeObject(const Xrpa::ObjectUuid& id) {
    removeObjectInternal(id);
  }
};

class OutboundSignalOutputDataReaderCollection : public Xrpa::ObjectCollection<SignalOutputDataReader, std::shared_ptr<OutboundSignalOutputData>> {
 public:
  explicit OutboundSignalOutputDataReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<SignalOutputDataReader, std::shared_ptr<OutboundSignalOutputData>>(reconciler, 16, 0, 0, true) {}

  void addObject(std::shared_ptr<OutboundSignalOutputData> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundSignalOutputData> createObject() {
    auto obj = std::make_shared<OutboundSignalOutputData>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
    addObjectInternal(obj);
    return obj;
  }

  void removeObject(const Xrpa::ObjectUuid& id) {
    removeObjectInternal(id);
  }
};

class OutboundSignalOutputDeviceReaderCollection : public Xrpa::ObjectCollection<SignalOutputDeviceReader, std::shared_ptr<OutboundSignalOutputDevice>> {
 public:
  explicit OutboundSignalOutputDeviceReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<SignalOutputDeviceReader, std::shared_ptr<OutboundSignalOutputDevice>>(reconciler, 17, 16, 0, true) {}

  void addObject(std::shared_ptr<OutboundSignalOutputDevice> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundSignalOutputDevice> createObject() {
    auto obj = std::make_shared<OutboundSignalOutputDevice>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
    addObjectInternal(obj);
    return obj;
  }

  void removeObject(const Xrpa::ObjectUuid& id) {
    removeObjectInternal(id);
  }
};

// Data Store Implementation
class SignalProcessingDataStore : public Xrpa::DataStoreReconciler {
 public:
  SignalProcessingDataStore(std::weak_ptr<Xrpa::TransportStream> inboundTransport, std::weak_ptr<Xrpa::TransportStream> outboundTransport)
      : Xrpa::DataStoreReconciler(inboundTransport, outboundTransport, 9912320) {
    SignalEvent = std::make_shared<OutboundSignalEventReaderCollection>(this);
    registerCollection(SignalEvent);
    SignalEventCombiner = std::make_shared<OutboundSignalEventCombinerReaderCollection>(this);
    registerCollection(SignalEventCombiner);
    SignalSource = std::make_shared<OutboundSignalSourceReaderCollection>(this);
    registerCollection(SignalSource);
    SignalSourceFile = std::make_shared<OutboundSignalSourceFileReaderCollection>(this);
    registerCollection(SignalSourceFile);
    SignalOscillator = std::make_shared<OutboundSignalOscillatorReaderCollection>(this);
    registerCollection(SignalOscillator);
    SignalChannelRouter = std::make_shared<OutboundSignalChannelRouterReaderCollection>(this);
    registerCollection(SignalChannelRouter);
    SignalChannelSelect = std::make_shared<OutboundSignalChannelSelectReaderCollection>(this);
    registerCollection(SignalChannelSelect);
    SignalChannelStack = std::make_shared<OutboundSignalChannelStackReaderCollection>(this);
    registerCollection(SignalChannelStack);
    SignalCurve = std::make_shared<OutboundSignalCurveReaderCollection>(this);
    registerCollection(SignalCurve);
    SignalDelay = std::make_shared<OutboundSignalDelayReaderCollection>(this);
    registerCollection(SignalDelay);
    SignalFeedback = std::make_shared<OutboundSignalFeedbackReaderCollection>(this);
    registerCollection(SignalFeedback);
    SignalMathOp = std::make_shared<OutboundSignalMathOpReaderCollection>(this);
    registerCollection(SignalMathOp);
    SignalMultiplexer = std::make_shared<OutboundSignalMultiplexerReaderCollection>(this);
    registerCollection(SignalMultiplexer);
    SignalParametricEqualizer = std::make_shared<OutboundSignalParametricEqualizerReaderCollection>(this);
    registerCollection(SignalParametricEqualizer);
    SignalPitchShift = std::make_shared<OutboundSignalPitchShiftReaderCollection>(this);
    registerCollection(SignalPitchShift);
    SignalSoftClip = std::make_shared<OutboundSignalSoftClipReaderCollection>(this);
    registerCollection(SignalSoftClip);
    SignalOutputData = std::make_shared<OutboundSignalOutputDataReaderCollection>(this);
    registerCollection(SignalOutputData);
    SignalOutputDevice = std::make_shared<OutboundSignalOutputDeviceReaderCollection>(this);
    registerCollection(SignalOutputDevice);
  }

  std::shared_ptr<OutboundSignalEventReaderCollection> SignalEvent;
  std::shared_ptr<OutboundSignalEventCombinerReaderCollection> SignalEventCombiner;
  std::shared_ptr<OutboundSignalSourceReaderCollection> SignalSource;
  std::shared_ptr<OutboundSignalSourceFileReaderCollection> SignalSourceFile;
  std::shared_ptr<OutboundSignalOscillatorReaderCollection> SignalOscillator;
  std::shared_ptr<OutboundSignalChannelRouterReaderCollection> SignalChannelRouter;
  std::shared_ptr<OutboundSignalChannelSelectReaderCollection> SignalChannelSelect;
  std::shared_ptr<OutboundSignalChannelStackReaderCollection> SignalChannelStack;
  std::shared_ptr<OutboundSignalCurveReaderCollection> SignalCurve;
  std::shared_ptr<OutboundSignalDelayReaderCollection> SignalDelay;
  std::shared_ptr<OutboundSignalFeedbackReaderCollection> SignalFeedback;
  std::shared_ptr<OutboundSignalMathOpReaderCollection> SignalMathOp;
  std::shared_ptr<OutboundSignalMultiplexerReaderCollection> SignalMultiplexer;
  std::shared_ptr<OutboundSignalParametricEqualizerReaderCollection> SignalParametricEqualizer;
  std::shared_ptr<OutboundSignalPitchShiftReaderCollection> SignalPitchShift;
  std::shared_ptr<OutboundSignalSoftClipReaderCollection> SignalSoftClip;
  std::shared_ptr<OutboundSignalOutputDataReaderCollection> SignalOutputData;
  std::shared_ptr<OutboundSignalOutputDeviceReaderCollection> SignalOutputDevice;
};

template <typename SampleType>
inline void OutboundSignalSource::setSrcDataCallback(Xrpa::SignalProducerCallback<SampleType> signalCallback, int32_t numChannels, int32_t framesPerSecond, int32_t framesPerPacket) {
  localSrcData_.setSignalSource(signalCallback, numChannels, framesPerSecond, framesPerPacket);
}

template <typename SampleType>
inline void OutboundSignalSource::setSrcDataRingBuffer(Xrpa::SignalRingBuffer<SampleType>* signalRingBuffer, int32_t numChannels, int32_t framesPerSecond, int32_t framesPerPacket) {
  localSrcData_.setSignalSource(signalRingBuffer, numChannels, framesPerSecond, framesPerPacket);
}

template <typename SampleType>
inline void OutboundSignalSource::setSrcDataForwarder(std::shared_ptr<Xrpa::InboundSignalForwarder> signalForwarder) {
  localSrcData_.setRecipient(getXrpaId(), collection_, 2);
  signalForwarder->addRecipient(localSrcData_);
}

template <typename SampleType>
inline Xrpa::SignalPacket OutboundSignalSource::sendSrcData(int32_t frameCount, int32_t numChannels, int32_t framesPerSecond) {
  int32_t sampleType = Xrpa::SignalTypeInference::inferSampleType<SampleType>();
  localSrcData_.setRecipient(getXrpaId(), collection_, 2);
  return localSrcData_.sendSignalPacket(Xrpa::MemoryUtils::getTypeSize<SampleType>(), frameCount, sampleType, numChannels, framesPerSecond);
}

} // namespace SignalProcessingDataStore
