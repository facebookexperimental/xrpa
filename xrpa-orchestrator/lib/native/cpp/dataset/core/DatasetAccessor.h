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

#pragma once

#include <dataset/core/DatasetTypes.h>
#include <dataset/core/MutexLockedPointer.h>
#include <dataset/utils/MemoryAccessor.h>
#include <chrono>
#include <memory>
#include <utility>
#include <vector>

namespace Xrpa {

struct DatasetConfig {
  DSHashValue schemaHash;
  int maxObjectCount;
  int memPoolSize;
  int changelogPoolSize;
  int messagePoolSize;
};

class DatasetAccessor {
 public:
  DatasetAccessor(std::unique_ptr<MutexLockedPointer>&& src, bool isInitializing)
      : dataSource(std::move(src)) {
    header = dataSource->get<DSHeader>(0);
    if (!isInitializing) {
      initRegionPointers();
    }
  }

  DatasetAccessor(const DatasetAccessor& other) = delete;
  DatasetAccessor& operator=(const DatasetAccessor& other) = delete;

  // move constructor
  DatasetAccessor(DatasetAccessor&& other) noexcept
      : DatasetAccessor(std::move(other.dataSource), false) {
    if (this != &other) {
      other.header = nullptr;
      other.objectHeaders = nullptr;
      other.memoryPool = nullptr;
      other.changeLog = nullptr;
      other.messageQueue = nullptr;
      other.dataSource = nullptr;
    }
  }

  // move assignment
  DatasetAccessor& operator=(DatasetAccessor&& other) noexcept {
    if (this != &other) {
      header = other.header;
      objectHeaders = other.objectHeaders;
      memoryPool = other.memoryPool;
      changeLog = other.changeLog;
      messageQueue = other.messageQueue;
      dataSource = std::move(other.dataSource);

      other.header = nullptr;
      other.objectHeaders = nullptr;
      other.memoryPool = nullptr;
      other.changeLog = nullptr;
      other.messageQueue = nullptr;
      other.dataSource = nullptr;
    }
    return *this;
  }

  bool isValid() {
    return header != nullptr;
  }

  [[nodiscard]] std::vector<DSIdentifier> getAllObjectIDs() const {
    std::vector<DSIdentifier> ret;
    for (int i = 0; i < objectHeaders->count; ++i) {
      auto& entry = objectHeaders->getAt(i);
      ret.push_back(entry.id);
    }
    return ret;
  }

  [[nodiscard]] std::vector<DSIdentifier> getAllObjectIDsByType(int32_t type) const {
    std::vector<DSIdentifier> ret;
    for (int i = 0; i < objectHeaders->count; ++i) {
      auto& entry = objectHeaders->getAt(i);
      if (entry.type == type) {
        ret.push_back(entry.id);
      }
    }
    return ret;
  }

  uint64_t getBaseTimestamp() {
    return header != nullptr ? header->baseTimestamp : 0;
  }

  int getChangelogTotal() {
    return changeLog != nullptr ? changeLog->getMaxID() + 1 : 0;
  }

  int getObjectCount() {
    return objectHeaders != nullptr ? objectHeaders->count : 0;
  }

  const DSObjectHeaderArray* getObjectIndex() {
    return objectHeaders;
  }

  PlacedRingBuffer* getChangeLog() {
    return changeLog;
  }

  PlacedRingBuffer* getMessageQueue() {
    return messageQueue;
  }

  [[nodiscard]] MemoryAccessor getObject(const DSIdentifier& id, int32_t dsType) {
    return getObjectFromHeader(getObjectHeader(id, dsType));
  }

  template <typename ObjectAccessor>
  [[nodiscard]] ObjectAccessor getObject(const DSIdentifier& id) {
    return ObjectAccessor(getObjectFromHeader(getObjectHeader(id, ObjectAccessor::DS_TYPE)));
  }

  [[nodiscard]] MemoryAccessor getObjectFromOffset(int32_t poolOffset) {
    return memoryPool->get(poolOffset);
  }

  [[nodiscard]] MemoryAccessor getObjectFromHeader(const DSObjectHeader* objHeader) {
    if (objHeader == nullptr) {
      return MemoryAccessor();
    }
    return getObjectFromOffset(objHeader->poolOffset);
  }

  [[nodiscard]] MemoryAccessor getSubobject(int32_t offset) {
    return memoryPool->get(offset);
  }

  MemoryAccessor sendMessage(
      const DSIdentifier& targetID,
      int32_t messageType,
      int32_t numBytes,
      uint64_t timestamp = 0) {
    auto target = getObjectHeader(targetID);
    if (!target) {
      return MemoryAccessor();
    }

    auto message = DSMessageAccessor(
        messageQueue->push(DSMessageAccessor::DS_SIZE + numBytes, &header->lastMessageID));

    if (message.isNull()) {
      return MemoryAccessor();
    }

    message.setTarget(*target);
    message.setMessageType(messageType);
    message.setTimestamp(timestamp ? (timestamp - header->baseTimestamp) : getCurrentTimestamp());
    return message.accessMessageData();
  }

  template <typename MessageAccessor>
  [[nodiscard]] MessageAccessor
  sendMessage(const DSIdentifier& targetID, int32_t messageType, uint64_t timestamp = 0) {
    return MessageAccessor(sendMessage(targetID, messageType, MessageAccessor::DS_SIZE, timestamp));
  }

  [[nodiscard]] MemoryAccessor createObject(
      const DSIdentifier& id,
      int32_t dsType,
      int32_t numBytes,
      uint64_t createTimestamp = 0) {
    if (!isValid() || objectHeaders->isFull()) {
      return MemoryAccessor();
    }

    bool isInIndex;
    int32_t idx = objectHeaders->find(id, isInIndex);
    if (isInIndex) {
      // already exists
      return MemoryAccessor();
    }

    // allocate memory from the memoryPool
    auto mem = memoryPool->alloc(numBytes);
    if (mem.isNull()) {
      return mem;
    }

    // add entry to objectHeaders
    DSObjectHeader objHeader;
    memset(&objHeader, 0, sizeof(objHeader));
    objHeader.id = id;
    objHeader.type = dsType;
    objHeader.createTimestamp =
        createTimestamp ? (createTimestamp - header->baseTimestamp) : getCurrentTimestamp();
    objHeader.poolOffset = mem.getOffset();
    objectHeaders->insertPresorted(objHeader, idx);

    // add entry to log
    auto changeEvent = DSChangeEventAccessor(
        changeLog->push(DSChangeEventAccessor::DS_SIZE, &header->lastChangelogID));
    changeEvent.setChangeType(DSChangeType::CreateObject);
    changeEvent.setTarget(objHeader);
    changeEvent.setTimestamp(getCurrentTimestamp());

    mem.writeToZeros();
    return mem;
  }

  template <typename ObjectAccessor>
  [[nodiscard]] ObjectAccessor createObject(const DSIdentifier& id, uint64_t createTimestamp = 0) {
    return ObjectAccessor(
        createObject(id, ObjectAccessor::DS_TYPE, ObjectAccessor::DS_SIZE, createTimestamp));
  }

  [[nodiscard]] MemoryAccessor
  updateObject(const DSIdentifier& id, int32_t dsType, uint64_t fieldMask) {
    auto objHeader = getObjectHeader(id, dsType);
    if (!objHeader) {
      return MemoryAccessor();
    }

    // add entry to log
    auto changeEvent = DSChangeEventAccessor(
        changeLog->push(DSChangeEventAccessor::DS_SIZE + 8, &header->lastChangelogID));
    changeEvent.setChangeType(DSChangeType::UpdateObject);
    changeEvent.setTarget(*objHeader);
    changeEvent.setTimestamp(getCurrentTimestamp());
    changeEvent.setChangedFields(fieldMask);

    return getObjectFromHeader(objHeader);
  }

  template <typename ObjectAccessor>
  [[nodiscard]] ObjectAccessor updateObject(const DSIdentifier& id, uint64_t fieldMask) {
    return ObjectAccessor(updateObject(id, ObjectAccessor::DS_TYPE, fieldMask));
  }

  // caller is responsible for freeing any subobject allocations referenced in object fields
  void deleteObject(const DSIdentifier& id) {
    bool isInIndex;
    int32_t idx = objectHeaders->find(id, isInIndex);
    if (!isInIndex) {
      return;
    }

    // free memoryPool memory
    auto& objHeader = objectHeaders->get()[idx];
    memoryPool->free(objHeader.poolOffset);

    // remove from objectHeaders
    DSObjectHeader target = objHeader; // copy off data for changelog first
    objectHeaders->removeIndex(idx);

    // add entry to log
    auto changeEvent = DSChangeEventAccessor(
        changeLog->push(DSChangeEventAccessor::DS_SIZE, &header->lastChangelogID));
    changeEvent.setChangeType(DSChangeType::DeleteObject);
    changeEvent.setTarget(target);
    changeEvent.setTimestamp(getCurrentTimestamp());

    // clear out all changelog pointers to the target memory location since they are now invalid
    PlacedRingBufferIterator iter;
    while (iter.hasNext(changeLog)) {
      DSChangeEventAccessor(iter.next(changeLog)).clearPoolOffsetIfMatch(target.poolOffset);
    }
  }

  void deleteAllByType(int dsType) {
    int lastChangelogID = header->lastChangelogID;
    int count = objectHeaders->count;
    for (int i = 0; i < count; ++i) {
      auto& objHeader = objectHeaders->getAt(i);
      if (objHeader.type != dsType) {
        continue;
      }

      // free memoryPool memory
      memoryPool->free(objHeader.poolOffset);

      // remove from objectHeaders
      DSObjectHeader target = objHeader; // copy off data for changelog first
      objectHeaders->removeIndex(i);
      count--;
      i--;

      // add entry to log
      auto changeEvent =
          DSChangeEventAccessor(changeLog->push(DSChangeEventAccessor::DS_SIZE, &lastChangelogID));
      changeEvent.setChangeType(DSChangeType::DeleteObject);
      changeEvent.setTarget(target);
      changeEvent.setTimestamp(getCurrentTimestamp());
    }

    header->lastChangelogID = lastChangelogID;

    // clear out all changelog pointers to the target entries since they are now invalid
    PlacedRingBufferIterator iter;
    while (iter.hasNext(changeLog)) {
      auto entry = DSChangeEventAccessor(iter.next(changeLog));
      if (entry.getTargetType() == dsType) {
        entry.setTargetPoolOffset(0);
      }
    }
  }

  [[nodiscard]] MemoryAccessor subobjectAlloc(int32_t& offsetRef, int32_t numBytes) {
    if (!isValid()) {
      return MemoryAccessor();
    }
    MemoryAccessor mem = memoryPool->alloc(numBytes);
    if (mem.isNull()) {
      return mem;
    }
    mem.writeToZeros();
    offsetRef = mem.getOffset();
    return mem;
  }

  void subobjectFree(int32_t offsetRef) {
    if (!isValid()) {
      return;
    }
    memoryPool->free(offsetRef);
  }

  void initContents(const DSHeader& prefilledHeader, const DatasetConfig& config) {
    // initialize baseTimestamp to 0 first, to let lock-free readers know the data is invalid
    // (note there is still sort of a race condition there... but a reader always has to acquire
    // the lock before actually doing anything anyway)
    header->baseTimestamp = 0;

    *header = prefilledHeader;
    initRegionPointers();

    objectHeaders->init(config.maxObjectCount);
    memoryPool->init(config.memPoolSize);
    changeLog->init(config.changelogPoolSize);
    messageQueue->init(config.messagePoolSize);

    // set this last (and not in genHeader()) as it tells anyone accessing the header
    // without a mutex lock that the header is not yet initialized
    header->baseTimestamp = getCurrentClockTimeMicroseconds();
  }

  void clear() {
    // initialize baseTimestamp to 0 first, to let lock-free readers know the data is invalid
    // (note there is still sort of a race condition there... but a reader always has to acquire
    // the lock before actually doing anything anyway)
    header->baseTimestamp = 0;

    header->lastChangelogID = -1;
    header->lastMessageID = -1;

    objectHeaders->reset();
    memoryPool->reset();
    changeLog->reset();
    messageQueue->reset();

    // set this last as it tells anyone accessing the header without a mutex lock that the header is
    // not yet initialized
    header->baseTimestamp = getCurrentClockTimeMicroseconds();
  }

  int32_t getCurrentTimestamp() {
    return getCurrentClockTimeMicroseconds() - header->baseTimestamp;
  }

  static DSHeader genHeader(const DatasetConfig& config) {
    DSHeader header;
    header.datasetVersion = DATASET_VERSION;
    header.schemaHash = config.schemaHash;
    header.totalBytes = sizeof(header);
    header.baseTimestamp = 0; // set for real in initContents()
    header.lastChangelogID = -1;
    header.lastMessageID = -1;

#define REGION_SIZE(region, size) \
  region = header.totalBytes;     \
  header.totalBytes += size;

    REGION_SIZE(header.objectHeadersRegion, DSObjectHeaderArray::getMemSize(config.maxObjectCount));
    REGION_SIZE(header.memoryPoolRegion, PlacedMemoryAllocator::getMemSize(config.memPoolSize));
    REGION_SIZE(header.changelogRegion, PlacedRingBuffer::getMemSize(config.changelogPoolSize));
    REGION_SIZE(header.messageQueueRegion, PlacedRingBuffer::getMemSize(config.messagePoolSize));

#undef REGION_SIZE

    return header;
  }

  static bool versionCheck(const void* memView, const DatasetConfig& config) {
    const DSHeader* header = reinterpret_cast<const DSHeader*>(memView);
    return header->baseTimestamp != 0 && header->datasetVersion == DATASET_VERSION &&
        header->schemaHash == config.schemaHash;
  }

 private:
  static constexpr int32_t DATASET_VERSION = 7; // conorwdickinson: ring buffer added lastElemOffset

  [[nodiscard]] const DSObjectHeader* getObjectHeader(const DSIdentifier& id) {
    bool isInIndex;
    int32_t idx = objectHeaders->find(id, isInIndex);
    if (!isInIndex) {
      return nullptr;
    }
    return &objectHeaders->get()[idx];
  }

  [[nodiscard]] const DSObjectHeader* getObjectHeader(const DSIdentifier& id, int32_t type) {
    bool isInIndex;
    int32_t idx = objectHeaders->find(id, isInIndex);
    if (!isInIndex) {
      return nullptr;
    }

    const auto& objHeader = objectHeaders->get()[idx];
    if (objHeader.type != type) {
      return nullptr;
    }
    return &objHeader;
  }

  void initRegionPointers() {
    if (header == nullptr) {
      objectHeaders = nullptr;
      memoryPool = nullptr;
      changeLog = nullptr;
      messageQueue = nullptr;
    } else {
      objectHeaders = dataSource->get<DSObjectHeaderArray>(header->objectHeadersRegion);
      memoryPool = dataSource->get<PlacedMemoryAllocator>(header->memoryPoolRegion);
      changeLog = dataSource->get<PlacedRingBuffer>(header->changelogRegion);
      messageQueue = dataSource->get<PlacedRingBuffer>(header->messageQueueRegion);
    }
  }

  DSHeader* header = nullptr;
  DSObjectHeaderArray* objectHeaders = nullptr;
  PlacedMemoryAllocator* memoryPool = nullptr;
  PlacedRingBuffer* changeLog = nullptr;
  PlacedRingBuffer* messageQueue = nullptr;

  std::unique_ptr<MutexLockedPointer> dataSource;
};

} // namespace Xrpa
