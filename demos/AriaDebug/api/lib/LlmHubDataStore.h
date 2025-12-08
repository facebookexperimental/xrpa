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

#include "LlmHubTypes.h"
#include <functional>
#include <memory>
#include <string>
#include <xrpa-runtime/external_utils/UuidGen.h>
#include <xrpa-runtime/reconciler/DataStoreInterfaces.h>
#include <xrpa-runtime/reconciler/DataStoreReconciler.h>
#include <xrpa-runtime/reconciler/ObjectCollection.h>
#include <xrpa-runtime/reconciler/ObjectCollectionIndex.h>
#include <xrpa-runtime/transport/TransportStream.h>
#include <xrpa-runtime/transport/TransportStreamAccessor.h>
#include <xrpa-runtime/utils/ByteVector.h>
#include <xrpa-runtime/utils/ImageTypes.h>
#include <xrpa-runtime/utils/MemoryAccessor.h>
#include <xrpa-runtime/utils/XrpaTypes.h>

namespace LlmHubDataStore {

class LlmHubDataStore;
class OutboundMcpServerSet;
class OutboundMcpServerConfig;
class OutboundLlmQuery;
class OutboundLlmTriggeredQuery;
class OutboundLlmConversation;

class McpServerSetReader : public Xrpa::ObjectAccessorInterface {
 public:
  McpServerSetReader() {}

  explicit McpServerSetReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

 private:
  Xrpa::MemoryOffset readOffset_;
};

class McpServerSetWriter : public McpServerSetReader {
 public:
  McpServerSetWriter() {}

  explicit McpServerSetWriter(const Xrpa::MemoryAccessor& memAccessor) : McpServerSetReader(memAccessor) {}

  static McpServerSetWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return McpServerSetWriter(changeEvent.accessChangeData());
  }

  static McpServerSetWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return McpServerSetWriter(changeEvent.accessChangeData());
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class McpServerConfigReader : public Xrpa::ObjectAccessorInterface {
 public:
  McpServerConfigReader() {}

  explicit McpServerConfigReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  // URL of the MCP server
  std::string getUrl() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  // Authentication token for the MCP server
  std::string getAuthToken() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  // Reference back to the server set this config belongs to
  Xrpa::ObjectUuid getServerSet() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  inline bool checkUrlChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkAuthTokenChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkServerSetChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class McpServerConfigWriter : public McpServerConfigReader {
 public:
  McpServerConfigWriter() {}

  explicit McpServerConfigWriter(const Xrpa::MemoryAccessor& memAccessor) : McpServerConfigReader(memAccessor) {}

  static McpServerConfigWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return McpServerConfigWriter(changeEvent.accessChangeData());
  }

  static McpServerConfigWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return McpServerConfigWriter(changeEvent.accessChangeData());
  }

  void setUrl(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

  void setAuthToken(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

  void setServerSet(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class LlmChatMessageReader : public Xrpa::ObjectAccessorInterface {
 public:
  LlmChatMessageReader() {}

  explicit LlmChatMessageReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  std::string getData() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  // Optional JPEG image data.
  Xrpa::ByteVector getJpegImageData() {
    return memAccessor_.readValue<Xrpa::ByteVector>(readOffset_);
  }

  // Optional ID. If sent with a chat message, the response will have the same ID.
  int getId() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class LlmChatMessageWriter : public LlmChatMessageReader {
 public:
  LlmChatMessageWriter() {}

  explicit LlmChatMessageWriter(const Xrpa::MemoryAccessor& memAccessor) : LlmChatMessageReader(memAccessor) {}

  void setData(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

  void setJpegImageData(const Xrpa::ByteVector& value) {
    memAccessor_.writeValue<Xrpa::ByteVector>(value, writeOffset_);
  }

  void setId(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class LlmChatResponseReader : public Xrpa::ObjectAccessorInterface {
 public:
  LlmChatResponseReader() {}

  explicit LlmChatResponseReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  std::string getData() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  // Optional ID. If sent with a chat message, the response will have the same ID.
  int getId() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class LlmChatResponseWriter : public LlmChatResponseReader {
 public:
  LlmChatResponseWriter() {}

  explicit LlmChatResponseWriter(const Xrpa::MemoryAccessor& memAccessor) : LlmChatResponseReader(memAccessor) {}

  void setData(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

  void setId(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class LlmQueryReader : public Xrpa::ObjectAccessorInterface {
 public:
  LlmQueryReader() {}

  explicit LlmQueryReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  std::string getApiKey() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  ApiProvider getApiProvider() {
    return static_cast<ApiProvider>(memAccessor_.readValue<uint32_t>(readOffset_));
  }

  ModelSizeHint getModelSize() {
    return static_cast<ModelSizeHint>(memAccessor_.readValue<uint32_t>(readOffset_));
  }

  std::string getSysPrompt() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  // Controls randomness: 0.0 = deterministic, 1.0 = creative
  float getTemperature() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

  // Maximum number of tokens to generate
  int getMaxTokens() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  // Maximum number of consecutive tool calls
  int getMaxConsecutiveToolCalls() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  int getIsProcessing() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  // Optional JSON schema for the response.
  std::string getJsonSchema() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  Xrpa::ObjectUuid getMcpServerSet() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  std::string getUserPrompt() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  // Optional JPEG image data.
  Xrpa::ByteVector getJpegImageData() {
    return memAccessor_.readValue<Xrpa::ByteVector>(readOffset_);
  }

  inline bool checkApiKeyChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkApiProviderChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkModelSizeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkSysPromptChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  inline bool checkTemperatureChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 16;
  }

  inline bool checkMaxTokensChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 32;
  }

  inline bool checkMaxConsecutiveToolCallsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 64;
  }

  inline bool checkIsProcessingChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 128;
  }

  inline bool checkJsonSchemaChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 256;
  }

  inline bool checkMcpServerSetChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 512;
  }

  inline bool checkUserPromptChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1024;
  }

  inline bool checkJpegImageDataChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2048;
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class LlmQueryWriter : public LlmQueryReader {
 public:
  LlmQueryWriter() {}

  explicit LlmQueryWriter(const Xrpa::MemoryAccessor& memAccessor) : LlmQueryReader(memAccessor) {}

  static LlmQueryWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return LlmQueryWriter(changeEvent.accessChangeData());
  }

  static LlmQueryWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return LlmQueryWriter(changeEvent.accessChangeData());
  }

  void setApiKey(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

  void setApiProvider(ApiProvider value) {
    memAccessor_.writeValue<uint32_t>(static_cast<uint32_t>(value), writeOffset_);
  }

  void setModelSize(ModelSizeHint value) {
    memAccessor_.writeValue<uint32_t>(static_cast<uint32_t>(value), writeOffset_);
  }

  void setSysPrompt(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

  void setTemperature(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

  void setMaxTokens(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setMaxConsecutiveToolCalls(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setIsProcessing(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setJsonSchema(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

  void setMcpServerSet(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

  void setUserPrompt(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

  void setJpegImageData(const Xrpa::ByteVector& value) {
    memAccessor_.writeValue<Xrpa::ByteVector>(value, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class RgbImageFeedReader : public Xrpa::ObjectAccessorInterface {
 public:
  RgbImageFeedReader() {}

  explicit RgbImageFeedReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  Xrpa::Image getImage() {
    return DSRgbImage::readValue(memAccessor_, readOffset_);
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class RgbImageFeedWriter : public RgbImageFeedReader {
 public:
  RgbImageFeedWriter() {}

  explicit RgbImageFeedWriter(const Xrpa::MemoryAccessor& memAccessor) : RgbImageFeedReader(memAccessor) {}

  void setImage(const Xrpa::Image& value) {
    DSRgbImage::writeValue(value, memAccessor_, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class LlmTriggeredQueryReader : public Xrpa::ObjectAccessorInterface {
 public:
  LlmTriggeredQueryReader() {}

  explicit LlmTriggeredQueryReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  std::string getApiKey() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  ApiProvider getApiProvider() {
    return static_cast<ApiProvider>(memAccessor_.readValue<uint32_t>(readOffset_));
  }

  ModelSizeHint getModelSize() {
    return static_cast<ModelSizeHint>(memAccessor_.readValue<uint32_t>(readOffset_));
  }

  std::string getSysPrompt() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  // Controls randomness: 0.0 = deterministic, 1.0 = creative
  float getTemperature() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

  // Maximum number of tokens to generate
  int getMaxTokens() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  // Maximum number of consecutive tool calls
  int getMaxConsecutiveToolCalls() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  int getIsProcessing() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  // Optional JSON schema for the response.
  std::string getJsonSchema() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  Xrpa::ObjectUuid getMcpServerSet() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  std::string getUserPrompt() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  int getTriggerId() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  inline bool checkApiKeyChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkApiProviderChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkModelSizeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkSysPromptChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  inline bool checkTemperatureChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 16;
  }

  inline bool checkMaxTokensChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 32;
  }

  inline bool checkMaxConsecutiveToolCallsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 64;
  }

  inline bool checkIsProcessingChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 128;
  }

  inline bool checkJsonSchemaChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 256;
  }

  inline bool checkMcpServerSetChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 512;
  }

  inline bool checkUserPromptChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1024;
  }

  inline bool checkTriggerIdChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2048;
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class LlmTriggeredQueryWriter : public LlmTriggeredQueryReader {
 public:
  LlmTriggeredQueryWriter() {}

  explicit LlmTriggeredQueryWriter(const Xrpa::MemoryAccessor& memAccessor) : LlmTriggeredQueryReader(memAccessor) {}

  static LlmTriggeredQueryWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return LlmTriggeredQueryWriter(changeEvent.accessChangeData());
  }

  static LlmTriggeredQueryWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return LlmTriggeredQueryWriter(changeEvent.accessChangeData());
  }

  void setApiKey(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

  void setApiProvider(ApiProvider value) {
    memAccessor_.writeValue<uint32_t>(static_cast<uint32_t>(value), writeOffset_);
  }

  void setModelSize(ModelSizeHint value) {
    memAccessor_.writeValue<uint32_t>(static_cast<uint32_t>(value), writeOffset_);
  }

  void setSysPrompt(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

  void setTemperature(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

  void setMaxTokens(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setMaxConsecutiveToolCalls(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setIsProcessing(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setJsonSchema(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

  void setMcpServerSet(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

  void setUserPrompt(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

  void setTriggerId(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

class LlmConversationReader : public Xrpa::ObjectAccessorInterface {
 public:
  LlmConversationReader() {}

  explicit LlmConversationReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}

  std::string getApiKey() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  ApiProvider getApiProvider() {
    return static_cast<ApiProvider>(memAccessor_.readValue<uint32_t>(readOffset_));
  }

  ModelSizeHint getModelSize() {
    return static_cast<ModelSizeHint>(memAccessor_.readValue<uint32_t>(readOffset_));
  }

  std::string getSysPrompt() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  // Controls randomness: 0.0 = deterministic, 1.0 = creative
  float getTemperature() {
    return DSScalar::readValue(memAccessor_, readOffset_);
  }

  // Maximum number of tokens to generate
  int getMaxTokens() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  // Maximum number of consecutive tool calls
  int getMaxConsecutiveToolCalls() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  int getIsProcessing() {
    return memAccessor_.readValue<int32_t>(readOffset_);
  }

  // Optional starter message for the conversation. Will be sent as an additional message between the system prompt and the user prompt.
  std::string getConversationStarter() {
    return memAccessor_.readValue<std::string>(readOffset_);
  }

  Xrpa::ObjectUuid getMcpServerSet() {
    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);
  }

  inline bool checkApiKeyChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkApiProviderChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkModelSizeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkSysPromptChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  inline bool checkTemperatureChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 16;
  }

  inline bool checkMaxTokensChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 32;
  }

  inline bool checkMaxConsecutiveToolCallsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 64;
  }

  inline bool checkIsProcessingChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 128;
  }

  inline bool checkConversationStarterChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 256;
  }

  inline bool checkMcpServerSetChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 512;
  }

 private:
  Xrpa::MemoryOffset readOffset_;
};

class LlmConversationWriter : public LlmConversationReader {
 public:
  LlmConversationWriter() {}

  explicit LlmConversationWriter(const Xrpa::MemoryAccessor& memAccessor) : LlmConversationReader(memAccessor) {}

  static LlmConversationWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    return LlmConversationWriter(changeEvent.accessChangeData());
  }

  static LlmConversationWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {
    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);
    changeEvent.setCollectionId(collectionId);
    changeEvent.setObjectId(id);
    changeEvent.setFieldsChanged(fieldsChanged);
    return LlmConversationWriter(changeEvent.accessChangeData());
  }

  void setApiKey(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

  void setApiProvider(ApiProvider value) {
    memAccessor_.writeValue<uint32_t>(static_cast<uint32_t>(value), writeOffset_);
  }

  void setModelSize(ModelSizeHint value) {
    memAccessor_.writeValue<uint32_t>(static_cast<uint32_t>(value), writeOffset_);
  }

  void setSysPrompt(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

  void setTemperature(float value) {
    DSScalar::writeValue(value, memAccessor_, writeOffset_);
  }

  void setMaxTokens(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setMaxConsecutiveToolCalls(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setIsProcessing(int value) {
    memAccessor_.writeValue<int32_t>(value, writeOffset_);
  }

  void setConversationStarter(const std::string& value) {
    memAccessor_.writeValue<std::string>(value, writeOffset_);
  }

  void setMcpServerSet(const Xrpa::ObjectUuid& value) {
    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);
  }

 private:
  Xrpa::MemoryOffset writeOffset_;
};

// Reconciled Types
class OutboundMcpServerSet : public Xrpa::DataStoreObject {
 public:
  explicit OutboundMcpServerSet(const Xrpa::ObjectUuid& id) : Xrpa::DataStoreObject(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  void writeDSChanges(Xrpa::TransportStreamAccessor* accessor) {
    McpServerSetWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 0;
      changeByteCount_ = 0;
      objAccessor = McpServerSetWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = McpServerSetWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
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

  void processDSUpdate(McpServerSetReader value, uint64_t fieldsChanged) {
    handleXrpaFieldsChanged(fieldsChanged);
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
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
};

class OutboundMcpServerConfig : public Xrpa::DataStoreObject {
 public:
  explicit OutboundMcpServerConfig(const Xrpa::ObjectUuid& id) : Xrpa::DataStoreObject(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  const std::string& getUrl() const {
    return localUrl_;
  }

  void setUrl(const std::string& url) {
    localUrl_ = url;
    if ((changeBits_ & 1) == 0) {
      changeBits_ |= 1;
      changeByteCount_ += 4;
    }
    changeByteCount_ += Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localUrl_);
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 1);
    }
  }

  const std::string& getAuthToken() const {
    return localAuthToken_;
  }

  void setAuthToken(const std::string& authToken) {
    localAuthToken_ = authToken;
    if ((changeBits_ & 2) == 0) {
      changeBits_ |= 2;
      changeByteCount_ += 4;
    }
    changeByteCount_ += Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localAuthToken_);
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 2);
    }
  }

  const Xrpa::ObjectUuid& getServerSet() const {
    return localServerSet_;
  }

  void setServerSet(const Xrpa::ObjectUuid& serverSet) {
    localServerSet_ = serverSet;
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
    McpServerConfigWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 7;
      changeByteCount_ = Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localUrl_) + Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localAuthToken_) + 24;
      objAccessor = McpServerConfigWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = McpServerConfigWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    }
    if (objAccessor.isNull()) {
      return;
    }
    if (changeBits_ & 1) {
      objAccessor.setUrl(localUrl_);
    }
    if (changeBits_ & 2) {
      objAccessor.setAuthToken(localAuthToken_);
    }
    if (changeBits_ & 4) {
      objAccessor.setServerSet(localServerSet_);
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    createWritten_ = false;
    changeBits_ = 7;
    changeByteCount_ = Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localUrl_) + Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localAuthToken_) + 24;
    return createTimestamp_;
  }

  void processDSUpdate(McpServerConfigReader value, uint64_t fieldsChanged) {
    handleXrpaFieldsChanged(fieldsChanged);
  }

  inline bool checkUrlChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkAuthTokenChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkServerSetChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
  }

 protected:
  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) {
    if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(fieldsChanged); }
  }

  // URL of the MCP server
  std::string localUrl_ = "http://localhost:3000/mcp";

  // Authentication token for the MCP server
  std::string localAuthToken_ = "";

  // Reference back to the server set this config belongs to
  Xrpa::ObjectUuid localServerSet_{0ULL, 0ULL};

  uint64_t createTimestamp_;
  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;
  bool createWritten_ = false;

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;
};

class OutboundLlmQuery : public Xrpa::DataStoreObject {
 public:
  explicit OutboundLlmQuery(const Xrpa::ObjectUuid& id) : Xrpa::DataStoreObject(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  const std::string& getApiKey() const {
    return localApiKey_;
  }

  void setApiKey(const std::string& apiKey) {
    localApiKey_ = apiKey;
    if ((changeBits_ & 1) == 0) {
      changeBits_ |= 1;
      changeByteCount_ += 4;
    }
    changeByteCount_ += Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localApiKey_);
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 1);
    }
  }

  ApiProvider getApiProvider() const {
    return localApiProvider_;
  }

  void setApiProvider(ApiProvider apiProvider) {
    localApiProvider_ = apiProvider;
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

  ModelSizeHint getModelSize() const {
    return localModelSize_;
  }

  void setModelSize(ModelSizeHint modelSize) {
    localModelSize_ = modelSize;
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

  const std::string& getSysPrompt() const {
    return localSysPrompt_;
  }

  void setSysPrompt(const std::string& sysPrompt) {
    localSysPrompt_ = sysPrompt;
    if ((changeBits_ & 8) == 0) {
      changeBits_ |= 8;
      changeByteCount_ += 4;
    }
    changeByteCount_ += Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localSysPrompt_);
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 8);
    }
  }

  float getTemperature() const {
    return localTemperature_;
  }

  void setTemperature(float temperature) {
    localTemperature_ = temperature;
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

  int getMaxTokens() const {
    return localMaxTokens_;
  }

  void setMaxTokens(int maxTokens) {
    localMaxTokens_ = maxTokens;
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

  int getMaxConsecutiveToolCalls() const {
    return localMaxConsecutiveToolCalls_;
  }

  void setMaxConsecutiveToolCalls(int maxConsecutiveToolCalls) {
    localMaxConsecutiveToolCalls_ = maxConsecutiveToolCalls;
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

  const std::string& getJsonSchema() const {
    return localJsonSchema_;
  }

  void setJsonSchema(const std::string& jsonSchema) {
    localJsonSchema_ = jsonSchema;
    if ((changeBits_ & 256) == 0) {
      changeBits_ |= 256;
      changeByteCount_ += 4;
    }
    changeByteCount_ += Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localJsonSchema_);
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 256);
    }
  }

  const Xrpa::ObjectUuid& getMcpServerSet() const {
    return localMcpServerSet_;
  }

  void setMcpServerSet(const Xrpa::ObjectUuid& mcpServerSet) {
    localMcpServerSet_ = mcpServerSet;
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

  const std::string& getUserPrompt() const {
    return localUserPrompt_;
  }

  void setUserPrompt(const std::string& userPrompt) {
    localUserPrompt_ = userPrompt;
    if ((changeBits_ & 1024) == 0) {
      changeBits_ |= 1024;
      changeByteCount_ += 4;
    }
    changeByteCount_ += Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localUserPrompt_);
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 1024);
    }
  }

  const Xrpa::ByteVector& getJpegImageData() const {
    return localJpegImageData_;
  }

  void setJpegImageData(const Xrpa::ByteVector& jpegImageData) {
    localJpegImageData_ = jpegImageData;
    if ((changeBits_ & 2048) == 0) {
      changeBits_ |= 2048;
      changeByteCount_ += 4;
    }
    changeByteCount_ += Xrpa::MemoryAccessor::dynSizeOfValue<Xrpa::ByteVector>(localJpegImageData_);
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 2048);
    }
  }

  void writeDSChanges(Xrpa::TransportStreamAccessor* accessor) {
    LlmQueryWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 3967;
      changeByteCount_ = Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localApiKey_) + Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localSysPrompt_) + Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localJsonSchema_) + Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localUserPrompt_) + Xrpa::MemoryAccessor::dynSizeOfValue<Xrpa::ByteVector>(localJpegImageData_) + 56;
      objAccessor = LlmQueryWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = LlmQueryWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    }
    if (objAccessor.isNull()) {
      return;
    }
    if (changeBits_ & 1) {
      objAccessor.setApiKey(localApiKey_);
    }
    if (changeBits_ & 2) {
      objAccessor.setApiProvider(localApiProvider_);
    }
    if (changeBits_ & 4) {
      objAccessor.setModelSize(localModelSize_);
    }
    if (changeBits_ & 8) {
      objAccessor.setSysPrompt(localSysPrompt_);
    }
    if (changeBits_ & 16) {
      objAccessor.setTemperature(localTemperature_);
    }
    if (changeBits_ & 32) {
      objAccessor.setMaxTokens(localMaxTokens_);
    }
    if (changeBits_ & 64) {
      objAccessor.setMaxConsecutiveToolCalls(localMaxConsecutiveToolCalls_);
    }
    if (changeBits_ & 256) {
      objAccessor.setJsonSchema(localJsonSchema_);
    }
    if (changeBits_ & 512) {
      objAccessor.setMcpServerSet(localMcpServerSet_);
    }
    if (changeBits_ & 1024) {
      objAccessor.setUserPrompt(localUserPrompt_);
    }
    if (changeBits_ & 2048) {
      objAccessor.setJpegImageData(localJpegImageData_);
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    createWritten_ = false;
    changeBits_ = 3967;
    changeByteCount_ = Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localApiKey_) + Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localSysPrompt_) + Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localJsonSchema_) + Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localUserPrompt_) + Xrpa::MemoryAccessor::dynSizeOfValue<Xrpa::ByteVector>(localJpegImageData_) + 56;
    return createTimestamp_;
  }

  void processDSUpdate(LlmQueryReader value, uint64_t fieldsChanged) {
    if (value.checkIsProcessingChanged(fieldsChanged)) {
      localIsProcessing_ = value.getIsProcessing();
    }
    handleXrpaFieldsChanged(fieldsChanged);
  }

  int getIsProcessing() const {
    return localIsProcessing_;
  }

  inline bool checkApiKeyChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkApiProviderChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkModelSizeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkSysPromptChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  inline bool checkTemperatureChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 16;
  }

  inline bool checkMaxTokensChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 32;
  }

  inline bool checkMaxConsecutiveToolCallsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 64;
  }

  inline bool checkIsProcessingChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 128;
  }

  inline bool checkJsonSchemaChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 256;
  }

  inline bool checkMcpServerSetChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 512;
  }

  inline bool checkUserPromptChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1024;
  }

  inline bool checkJpegImageDataChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2048;
  }

  void sendQuery(const std::string& data, const Xrpa::ByteVector& jpegImageData, int id) {
    auto message = LlmChatMessageWriter(collection_->sendMessage(
        getXrpaId(),
        10,
        Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(data) + Xrpa::MemoryAccessor::dynSizeOfValue<Xrpa::ByteVector>(jpegImageData) + 12));
    message.setData(data);
    message.setJpegImageData(jpegImageData);
    message.setId(id);
  }

  void onResponse(std::function<void(uint64_t, LlmChatResponseReader)> handler) {
    ResponseMessageHandler_ = handler;
  }

  void onResponseStream(std::function<void(uint64_t, LlmChatResponseReader)> handler) {
    ResponseStreamMessageHandler_ = handler;
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
    if (messageType == 13) {
      if (ResponseMessageHandler_) {
        auto message = LlmChatResponseReader(messageData);
        ResponseMessageHandler_(msgTimestamp, message);
      }
    }
    if (messageType == 14) {
      if (ResponseStreamMessageHandler_) {
        auto message = LlmChatResponseReader(messageData);
        ResponseStreamMessageHandler_(msgTimestamp, message);
      }
    }
  }

 protected:
  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) {
    if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(fieldsChanged); }
  }

  std::string localApiKey_ = "";
  ApiProvider localApiProvider_ = ApiProvider::MetaGenProxy;
  ModelSizeHint localModelSize_ = ModelSizeHint::Small;
  std::string localSysPrompt_ = "";

  // Controls randomness: 0.0 = deterministic, 1.0 = creative
  float localTemperature_ = 0.7f;

  // Maximum number of tokens to generate
  int localMaxTokens_ = 256;

  // Maximum number of consecutive tool calls
  int localMaxConsecutiveToolCalls_ = 20;

  // Optional JSON schema for the response.
  std::string localJsonSchema_ = "";

  Xrpa::ObjectUuid localMcpServerSet_{0ULL, 0ULL};
  std::string localUserPrompt_ = "";

  // Optional JPEG image data.
  Xrpa::ByteVector localJpegImageData_;

  uint64_t createTimestamp_;
  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;
  bool createWritten_ = false;

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;
  int localIsProcessing_ = 0;
  std::function<void(uint64_t, LlmChatResponseReader)> ResponseMessageHandler_ = nullptr;
  std::function<void(uint64_t, LlmChatResponseReader)> ResponseStreamMessageHandler_ = nullptr;
};

class OutboundLlmTriggeredQuery : public Xrpa::DataStoreObject {
 public:
  explicit OutboundLlmTriggeredQuery(const Xrpa::ObjectUuid& id) : Xrpa::DataStoreObject(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  const std::string& getApiKey() const {
    return localApiKey_;
  }

  void setApiKey(const std::string& apiKey) {
    localApiKey_ = apiKey;
    if ((changeBits_ & 1) == 0) {
      changeBits_ |= 1;
      changeByteCount_ += 4;
    }
    changeByteCount_ += Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localApiKey_);
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 1);
    }
  }

  ApiProvider getApiProvider() const {
    return localApiProvider_;
  }

  void setApiProvider(ApiProvider apiProvider) {
    localApiProvider_ = apiProvider;
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

  ModelSizeHint getModelSize() const {
    return localModelSize_;
  }

  void setModelSize(ModelSizeHint modelSize) {
    localModelSize_ = modelSize;
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

  const std::string& getSysPrompt() const {
    return localSysPrompt_;
  }

  void setSysPrompt(const std::string& sysPrompt) {
    localSysPrompt_ = sysPrompt;
    if ((changeBits_ & 8) == 0) {
      changeBits_ |= 8;
      changeByteCount_ += 4;
    }
    changeByteCount_ += Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localSysPrompt_);
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 8);
    }
  }

  float getTemperature() const {
    return localTemperature_;
  }

  void setTemperature(float temperature) {
    localTemperature_ = temperature;
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

  int getMaxTokens() const {
    return localMaxTokens_;
  }

  void setMaxTokens(int maxTokens) {
    localMaxTokens_ = maxTokens;
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

  int getMaxConsecutiveToolCalls() const {
    return localMaxConsecutiveToolCalls_;
  }

  void setMaxConsecutiveToolCalls(int maxConsecutiveToolCalls) {
    localMaxConsecutiveToolCalls_ = maxConsecutiveToolCalls;
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

  const std::string& getJsonSchema() const {
    return localJsonSchema_;
  }

  void setJsonSchema(const std::string& jsonSchema) {
    localJsonSchema_ = jsonSchema;
    if ((changeBits_ & 256) == 0) {
      changeBits_ |= 256;
      changeByteCount_ += 4;
    }
    changeByteCount_ += Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localJsonSchema_);
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 256);
    }
  }

  const Xrpa::ObjectUuid& getMcpServerSet() const {
    return localMcpServerSet_;
  }

  void setMcpServerSet(const Xrpa::ObjectUuid& mcpServerSet) {
    localMcpServerSet_ = mcpServerSet;
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

  const std::string& getUserPrompt() const {
    return localUserPrompt_;
  }

  void setUserPrompt(const std::string& userPrompt) {
    localUserPrompt_ = userPrompt;
    if ((changeBits_ & 1024) == 0) {
      changeBits_ |= 1024;
      changeByteCount_ += 4;
    }
    changeByteCount_ += Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localUserPrompt_);
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 1024);
    }
  }

  int getTriggerId() const {
    return localTriggerId_;
  }

  void setTriggerId(int triggerId) {
    localTriggerId_ = triggerId;
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

  void writeDSChanges(Xrpa::TransportStreamAccessor* accessor) {
    LlmTriggeredQueryWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 3967;
      changeByteCount_ = Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localApiKey_) + Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localSysPrompt_) + Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localJsonSchema_) + Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localUserPrompt_) + 56;
      objAccessor = LlmTriggeredQueryWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = LlmTriggeredQueryWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    }
    if (objAccessor.isNull()) {
      return;
    }
    if (changeBits_ & 1) {
      objAccessor.setApiKey(localApiKey_);
    }
    if (changeBits_ & 2) {
      objAccessor.setApiProvider(localApiProvider_);
    }
    if (changeBits_ & 4) {
      objAccessor.setModelSize(localModelSize_);
    }
    if (changeBits_ & 8) {
      objAccessor.setSysPrompt(localSysPrompt_);
    }
    if (changeBits_ & 16) {
      objAccessor.setTemperature(localTemperature_);
    }
    if (changeBits_ & 32) {
      objAccessor.setMaxTokens(localMaxTokens_);
    }
    if (changeBits_ & 64) {
      objAccessor.setMaxConsecutiveToolCalls(localMaxConsecutiveToolCalls_);
    }
    if (changeBits_ & 256) {
      objAccessor.setJsonSchema(localJsonSchema_);
    }
    if (changeBits_ & 512) {
      objAccessor.setMcpServerSet(localMcpServerSet_);
    }
    if (changeBits_ & 1024) {
      objAccessor.setUserPrompt(localUserPrompt_);
    }
    if (changeBits_ & 2048) {
      objAccessor.setTriggerId(localTriggerId_);
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    createWritten_ = false;
    changeBits_ = 3967;
    changeByteCount_ = Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localApiKey_) + Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localSysPrompt_) + Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localJsonSchema_) + Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localUserPrompt_) + 56;
    return createTimestamp_;
  }

  void processDSUpdate(LlmTriggeredQueryReader value, uint64_t fieldsChanged) {
    if (value.checkIsProcessingChanged(fieldsChanged)) {
      localIsProcessing_ = value.getIsProcessing();
    }
    handleXrpaFieldsChanged(fieldsChanged);
  }

  int getIsProcessing() const {
    return localIsProcessing_;
  }

  inline bool checkApiKeyChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkApiProviderChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkModelSizeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkSysPromptChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  inline bool checkTemperatureChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 16;
  }

  inline bool checkMaxTokensChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 32;
  }

  inline bool checkMaxConsecutiveToolCallsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 64;
  }

  inline bool checkIsProcessingChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 128;
  }

  inline bool checkJsonSchemaChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 256;
  }

  inline bool checkMcpServerSetChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 512;
  }

  inline bool checkUserPromptChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1024;
  }

  inline bool checkTriggerIdChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2048;
  }

  void sendRgbImageFeed(const Xrpa::Image& image) {
    auto message = RgbImageFeedWriter(collection_->sendMessage(
        getXrpaId(),
        11,
        DSRgbImage::dynSizeOfValue(image) + 48));
    message.setImage(image);
  }

  void onResponse(std::function<void(uint64_t, LlmChatResponseReader)> handler) {
    ResponseMessageHandler_ = handler;
  }

  void onResponseStream(std::function<void(uint64_t, LlmChatResponseReader)> handler) {
    ResponseStreamMessageHandler_ = handler;
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
    if (messageType == 13) {
      if (ResponseMessageHandler_) {
        auto message = LlmChatResponseReader(messageData);
        ResponseMessageHandler_(msgTimestamp, message);
      }
    }
    if (messageType == 14) {
      if (ResponseStreamMessageHandler_) {
        auto message = LlmChatResponseReader(messageData);
        ResponseStreamMessageHandler_(msgTimestamp, message);
      }
    }
  }

 protected:
  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) {
    if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(fieldsChanged); }
  }

  std::string localApiKey_ = "";
  ApiProvider localApiProvider_ = ApiProvider::MetaGenProxy;
  ModelSizeHint localModelSize_ = ModelSizeHint::Small;
  std::string localSysPrompt_ = "";

  // Controls randomness: 0.0 = deterministic, 1.0 = creative
  float localTemperature_ = 0.7f;

  // Maximum number of tokens to generate
  int localMaxTokens_ = 256;

  // Maximum number of consecutive tool calls
  int localMaxConsecutiveToolCalls_ = 20;

  // Optional JSON schema for the response.
  std::string localJsonSchema_ = "";

  Xrpa::ObjectUuid localMcpServerSet_{0ULL, 0ULL};
  std::string localUserPrompt_ = "";
  int localTriggerId_ = 0;
  uint64_t createTimestamp_;
  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;
  bool createWritten_ = false;

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;
  int localIsProcessing_ = 0;
  std::function<void(uint64_t, LlmChatResponseReader)> ResponseMessageHandler_ = nullptr;
  std::function<void(uint64_t, LlmChatResponseReader)> ResponseStreamMessageHandler_ = nullptr;
};

class OutboundLlmConversation : public Xrpa::DataStoreObject {
 public:
  explicit OutboundLlmConversation(const Xrpa::ObjectUuid& id) : Xrpa::DataStoreObject(id, nullptr), createTimestamp_(Xrpa::getCurrentClockTimeMicroseconds()) {}

  void onXrpaFieldsChanged(std::function<void(uint64_t)> handler) {
    xrpaFieldsChangedHandler_ = handler;
  }

  const std::string& getApiKey() const {
    return localApiKey_;
  }

  void setApiKey(const std::string& apiKey) {
    localApiKey_ = apiKey;
    if ((changeBits_ & 1) == 0) {
      changeBits_ |= 1;
      changeByteCount_ += 4;
    }
    changeByteCount_ += Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localApiKey_);
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 1);
    }
  }

  ApiProvider getApiProvider() const {
    return localApiProvider_;
  }

  void setApiProvider(ApiProvider apiProvider) {
    localApiProvider_ = apiProvider;
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

  ModelSizeHint getModelSize() const {
    return localModelSize_;
  }

  void setModelSize(ModelSizeHint modelSize) {
    localModelSize_ = modelSize;
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

  const std::string& getSysPrompt() const {
    return localSysPrompt_;
  }

  void setSysPrompt(const std::string& sysPrompt) {
    localSysPrompt_ = sysPrompt;
    if ((changeBits_ & 8) == 0) {
      changeBits_ |= 8;
      changeByteCount_ += 4;
    }
    changeByteCount_ += Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localSysPrompt_);
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 8);
    }
  }

  float getTemperature() const {
    return localTemperature_;
  }

  void setTemperature(float temperature) {
    localTemperature_ = temperature;
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

  int getMaxTokens() const {
    return localMaxTokens_;
  }

  void setMaxTokens(int maxTokens) {
    localMaxTokens_ = maxTokens;
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

  int getMaxConsecutiveToolCalls() const {
    return localMaxConsecutiveToolCalls_;
  }

  void setMaxConsecutiveToolCalls(int maxConsecutiveToolCalls) {
    localMaxConsecutiveToolCalls_ = maxConsecutiveToolCalls;
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

  const std::string& getConversationStarter() const {
    return localConversationStarter_;
  }

  void setConversationStarter(const std::string& conversationStarter) {
    localConversationStarter_ = conversationStarter;
    if ((changeBits_ & 256) == 0) {
      changeBits_ |= 256;
      changeByteCount_ += 4;
    }
    changeByteCount_ += Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localConversationStarter_);
    if (collection_) {
      if (!hasNotifiedNeedsWrite_) {
        collection_->notifyObjectNeedsWrite(getXrpaId());
        hasNotifiedNeedsWrite_ = true;
      }
      collection_->setDirty(getXrpaId(), 256);
    }
  }

  const Xrpa::ObjectUuid& getMcpServerSet() const {
    return localMcpServerSet_;
  }

  void setMcpServerSet(const Xrpa::ObjectUuid& mcpServerSet) {
    localMcpServerSet_ = mcpServerSet;
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

  void writeDSChanges(Xrpa::TransportStreamAccessor* accessor) {
    LlmConversationWriter objAccessor;
    if (!createWritten_) {
      changeBits_ = 895;
      changeByteCount_ = Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localApiKey_) + Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localSysPrompt_) + Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localConversationStarter_) + 48;
      objAccessor = LlmConversationWriter::create(accessor, getCollectionId(), getXrpaId(), changeByteCount_, createTimestamp_);
      createWritten_ = true;
    } else if (changeBits_ != 0) {
      objAccessor = LlmConversationWriter::update(accessor, getCollectionId(), getXrpaId(), changeBits_, changeByteCount_);
    }
    if (objAccessor.isNull()) {
      return;
    }
    if (changeBits_ & 1) {
      objAccessor.setApiKey(localApiKey_);
    }
    if (changeBits_ & 2) {
      objAccessor.setApiProvider(localApiProvider_);
    }
    if (changeBits_ & 4) {
      objAccessor.setModelSize(localModelSize_);
    }
    if (changeBits_ & 8) {
      objAccessor.setSysPrompt(localSysPrompt_);
    }
    if (changeBits_ & 16) {
      objAccessor.setTemperature(localTemperature_);
    }
    if (changeBits_ & 32) {
      objAccessor.setMaxTokens(localMaxTokens_);
    }
    if (changeBits_ & 64) {
      objAccessor.setMaxConsecutiveToolCalls(localMaxConsecutiveToolCalls_);
    }
    if (changeBits_ & 256) {
      objAccessor.setConversationStarter(localConversationStarter_);
    }
    if (changeBits_ & 512) {
      objAccessor.setMcpServerSet(localMcpServerSet_);
    }
    changeBits_ = 0;
    changeByteCount_ = 0;
    hasNotifiedNeedsWrite_ = false;
  }

  uint64_t prepDSFullUpdate() {
    createWritten_ = false;
    changeBits_ = 895;
    changeByteCount_ = Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localApiKey_) + Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localSysPrompt_) + Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(localConversationStarter_) + 48;
    return createTimestamp_;
  }

  void processDSUpdate(LlmConversationReader value, uint64_t fieldsChanged) {
    if (value.checkIsProcessingChanged(fieldsChanged)) {
      localIsProcessing_ = value.getIsProcessing();
    }
    handleXrpaFieldsChanged(fieldsChanged);
  }

  int getIsProcessing() const {
    return localIsProcessing_;
  }

  inline bool checkApiKeyChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 1;
  }

  inline bool checkApiProviderChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 2;
  }

  inline bool checkModelSizeChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 4;
  }

  inline bool checkSysPromptChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 8;
  }

  inline bool checkTemperatureChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 16;
  }

  inline bool checkMaxTokensChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 32;
  }

  inline bool checkMaxConsecutiveToolCallsChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 64;
  }

  inline bool checkIsProcessingChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 128;
  }

  inline bool checkConversationStarterChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 256;
  }

  inline bool checkMcpServerSetChanged(uint64_t fieldsChanged) const {
    return fieldsChanged & 512;
  }

  void sendChatMessage(const std::string& data, const Xrpa::ByteVector& jpegImageData, int id) {
    auto message = LlmChatMessageWriter(collection_->sendMessage(
        getXrpaId(),
        10,
        Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(data) + Xrpa::MemoryAccessor::dynSizeOfValue<Xrpa::ByteVector>(jpegImageData) + 12));
    message.setData(data);
    message.setJpegImageData(jpegImageData);
    message.setId(id);
  }

  void onChatResponse(std::function<void(uint64_t, LlmChatResponseReader)> handler) {
    ChatResponseMessageHandler_ = handler;
  }

  void onChatResponseStream(std::function<void(uint64_t, LlmChatResponseReader)> handler) {
    ChatResponseStreamMessageHandler_ = handler;
  }

  void processDSMessage(int32_t messageType, uint64_t msgTimestamp, const Xrpa::MemoryAccessor& messageData) {
    if (messageType == 11) {
      if (ChatResponseMessageHandler_) {
        auto message = LlmChatResponseReader(messageData);
        ChatResponseMessageHandler_(msgTimestamp, message);
      }
    }
    if (messageType == 12) {
      if (ChatResponseStreamMessageHandler_) {
        auto message = LlmChatResponseReader(messageData);
        ChatResponseStreamMessageHandler_(msgTimestamp, message);
      }
    }
  }

 protected:
  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) {
    if (xrpaFieldsChangedHandler_) { xrpaFieldsChangedHandler_(fieldsChanged); }
  }

  std::string localApiKey_ = "";
  ApiProvider localApiProvider_ = ApiProvider::MetaGenProxy;
  ModelSizeHint localModelSize_ = ModelSizeHint::Small;
  std::string localSysPrompt_ = "";

  // Controls randomness: 0.0 = deterministic, 1.0 = creative
  float localTemperature_ = 0.7f;

  // Maximum number of tokens to generate
  int localMaxTokens_ = 256;

  // Maximum number of consecutive tool calls
  int localMaxConsecutiveToolCalls_ = 20;

  // Optional starter message for the conversation. Will be sent as an additional message between the system prompt and the user prompt.
  std::string localConversationStarter_ = "";

  Xrpa::ObjectUuid localMcpServerSet_{0ULL, 0ULL};
  uint64_t createTimestamp_;
  uint64_t changeBits_ = 0;
  int32_t changeByteCount_ = 0;
  bool createWritten_ = false;

 private:
  std::function<void(uint64_t)> xrpaFieldsChangedHandler_ = nullptr;
  int localIsProcessing_ = 0;
  std::function<void(uint64_t, LlmChatResponseReader)> ChatResponseMessageHandler_ = nullptr;
  std::function<void(uint64_t, LlmChatResponseReader)> ChatResponseStreamMessageHandler_ = nullptr;
};

// Object Collections
class OutboundMcpServerSetReaderCollection : public Xrpa::ObjectCollection<McpServerSetReader, std::shared_ptr<OutboundMcpServerSet>> {
 public:
  explicit OutboundMcpServerSetReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<McpServerSetReader, std::shared_ptr<OutboundMcpServerSet>>(reconciler, 0, 0, 0, true) {}

  void addObject(std::shared_ptr<OutboundMcpServerSet> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundMcpServerSet> createObject() {
    auto obj = std::make_shared<OutboundMcpServerSet>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
    addObjectInternal(obj);
    return obj;
  }

  void removeObject(const Xrpa::ObjectUuid& id) {
    removeObjectInternal(id);
  }
};

class OutboundMcpServerConfigReaderCollection : public Xrpa::ObjectCollection<McpServerConfigReader, std::shared_ptr<OutboundMcpServerConfig>> {
 public:
  explicit OutboundMcpServerConfigReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<McpServerConfigReader, std::shared_ptr<OutboundMcpServerConfig>>(reconciler, 1, 0, 4, true) {}

  Xrpa::ObjectCollectionIndex<std::shared_ptr<OutboundMcpServerConfig>, Xrpa::ObjectUuid> ServerSetIndex;

  void addObject(std::shared_ptr<OutboundMcpServerConfig> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundMcpServerConfig> createObject() {
    auto obj = std::make_shared<OutboundMcpServerConfig>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
    addObjectInternal(obj);
    return obj;
  }

  void removeObject(const Xrpa::ObjectUuid& id) {
    removeObjectInternal(id);
  }

 protected:
  void indexNotifyCreate(std::shared_ptr<OutboundMcpServerConfig> obj) override {
    ServerSetIndex.onCreate(obj, obj->getServerSet());
  }

  void indexNotifyUpdate(std::shared_ptr<OutboundMcpServerConfig> obj, uint64_t fieldsChanged) override {
    if (fieldsChanged & 4) {
      ServerSetIndex.onUpdate(obj, obj->getServerSet());
    }
  }

  void indexNotifyDelete(std::shared_ptr<OutboundMcpServerConfig> obj) override {
    ServerSetIndex.onDelete(obj, obj->getServerSet());
  }
};

class OutboundLlmQueryReaderCollection : public Xrpa::ObjectCollection<LlmQueryReader, std::shared_ptr<OutboundLlmQuery>> {
 public:
  explicit OutboundLlmQueryReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<LlmQueryReader, std::shared_ptr<OutboundLlmQuery>>(reconciler, 2, 128, 0, true) {}

  void addObject(std::shared_ptr<OutboundLlmQuery> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundLlmQuery> createObject() {
    auto obj = std::make_shared<OutboundLlmQuery>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
    addObjectInternal(obj);
    return obj;
  }

  void removeObject(const Xrpa::ObjectUuid& id) {
    removeObjectInternal(id);
  }
};

class OutboundLlmTriggeredQueryReaderCollection : public Xrpa::ObjectCollection<LlmTriggeredQueryReader, std::shared_ptr<OutboundLlmTriggeredQuery>> {
 public:
  explicit OutboundLlmTriggeredQueryReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<LlmTriggeredQueryReader, std::shared_ptr<OutboundLlmTriggeredQuery>>(reconciler, 3, 128, 0, true) {}

  void addObject(std::shared_ptr<OutboundLlmTriggeredQuery> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundLlmTriggeredQuery> createObject() {
    auto obj = std::make_shared<OutboundLlmTriggeredQuery>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
    addObjectInternal(obj);
    return obj;
  }

  void removeObject(const Xrpa::ObjectUuid& id) {
    removeObjectInternal(id);
  }
};

class OutboundLlmConversationReaderCollection : public Xrpa::ObjectCollection<LlmConversationReader, std::shared_ptr<OutboundLlmConversation>> {
 public:
  explicit OutboundLlmConversationReaderCollection(Xrpa::DataStoreReconciler* reconciler) : Xrpa::ObjectCollection<LlmConversationReader, std::shared_ptr<OutboundLlmConversation>>(reconciler, 4, 128, 0, true) {}

  void addObject(std::shared_ptr<OutboundLlmConversation> obj) {
    addObjectInternal(obj);
  }

  [[nodiscard]] std::shared_ptr<OutboundLlmConversation> createObject() {
    auto obj = std::make_shared<OutboundLlmConversation>(Xrpa::ObjectUuid(Xrpa::generateUuid()));
    addObjectInternal(obj);
    return obj;
  }

  void removeObject(const Xrpa::ObjectUuid& id) {
    removeObjectInternal(id);
  }
};

// Data Store Implementation
class LlmHubDataStore : public Xrpa::DataStoreReconciler {
 public:
  LlmHubDataStore(std::weak_ptr<Xrpa::TransportStream> inboundTransport, std::weak_ptr<Xrpa::TransportStream> outboundTransport)
      : Xrpa::DataStoreReconciler(inboundTransport, outboundTransport, 388727552) {
    McpServerSet = std::make_shared<OutboundMcpServerSetReaderCollection>(this);
    registerCollection(McpServerSet);
    McpServerConfig = std::make_shared<OutboundMcpServerConfigReaderCollection>(this);
    registerCollection(McpServerConfig);
    LlmQuery = std::make_shared<OutboundLlmQueryReaderCollection>(this);
    registerCollection(LlmQuery);
    LlmTriggeredQuery = std::make_shared<OutboundLlmTriggeredQueryReaderCollection>(this);
    registerCollection(LlmTriggeredQuery);
    LlmConversation = std::make_shared<OutboundLlmConversationReaderCollection>(this);
    registerCollection(LlmConversation);
  }

  std::shared_ptr<OutboundMcpServerSetReaderCollection> McpServerSet;
  std::shared_ptr<OutboundMcpServerConfigReaderCollection> McpServerConfig;
  std::shared_ptr<OutboundLlmQueryReaderCollection> LlmQuery;
  std::shared_ptr<OutboundLlmTriggeredQueryReaderCollection> LlmTriggeredQuery;
  std::shared_ptr<OutboundLlmConversationReaderCollection> LlmConversation;
};

} // namespace LlmHubDataStore
