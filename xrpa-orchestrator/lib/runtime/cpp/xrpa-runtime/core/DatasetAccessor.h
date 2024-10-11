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

#include <xrpa-runtime/core/DatasetTypes.h>
#include <xrpa-runtime/core/MutexLockedPointer.h>
#include <xrpa-runtime/utils/MemoryAccessor.h>
#include <chrono>
#include <memory>
#include <utility>
#include <vector>

namespace Xrpa {

struct DatasetConfig {
  DSHashValue schemaHash;
  int changelogByteCount{};
};

class DatasetAccessor {
 public:
  DatasetAccessor(std::unique_ptr<MutexLockedPointer>&& src, bool isInitializing)
      : dataSource(std::move(src)), header(dataSource->get(0)) {
    if (!isInitializing) {
      changelog = header.getChangelog();
    }
  }

  DatasetAccessor(const DatasetAccessor& other) = delete;
  DatasetAccessor& operator=(const DatasetAccessor& other) = delete;

  // move constructor
  DatasetAccessor(DatasetAccessor&& other) noexcept
      : DatasetAccessor(std::move(other.dataSource), false) {
    if (this != &other) {
      other.header.setNull();
      other.changelog = nullptr;
      other.dataSource = nullptr;
    }
  }

  // move assignment
  DatasetAccessor& operator=(DatasetAccessor&& other) noexcept {
    if (this != &other) {
      header = other.header;
      changelog = other.changelog;
      dataSource = std::move(other.dataSource);

      other.header.setNull();
      other.changelog = nullptr;
      other.dataSource = nullptr;
    }
    return *this;
  }

  bool isValid() {
    return !header.isNull();
  }

  uint64_t getBaseTimestamp() {
    return header.isNull() ? 0 : header.getBaseTimestamp();
  }

  int getChangelogTotal() {
    return changelog != nullptr ? changelog->getMaxID() + 1 : 0;
  }

  PlacedRingBuffer* getChangeLog() {
    return changelog;
  }

  template <typename EventAccessor = DSChangeEventAccessor>
  EventAccessor writeChangeEvent(int32_t changeType, int32_t numBytes = 0, uint64_t timestamp = 0) {
    int32_t changeId = 0;
    auto changeEvent = EventAccessor(changelog->push(EventAccessor::DS_SIZE + numBytes, &changeId));

    if (changeEvent.isNull()) {
      return changeEvent;
    }

    header.setLastChangelogID(changeId);

    changeEvent.setChangeType(changeType);
    changeEvent.setTimestamp(
        timestamp ? (timestamp - header.getBaseTimestamp()) : getCurrentTimestamp());

    return changeEvent;
  }

  void initContents(int32_t totalBytes, const DatasetConfig& config) {
    // initialize baseTimestamp to 0 first, to let lock-free readers know the data is invalid
    // (note there is still sort of a race condition there... but a reader always has to acquire
    // the lock before actually doing anything anyway)
    header.setBaseTimestamp(0);

    header.setLastChangelogID(-1);
    header.setDatasetVersion(DATASET_VERSION);
    header.setSchemaHash(config.schemaHash);
    header.setTotalBytes(totalBytes);
    changelog = header.getChangelog(config.changelogByteCount);

    // set this last as it tells anyone accessing the header
    // without a mutex lock that the header is not yet initialized
    header.setBaseTimestamp(getCurrentClockTimeMicroseconds());
  }

  void clear() {
    // initialize baseTimestamp to 0 first, to let lock-free readers know the data is invalid
    // (note there is still sort of a race condition there... but a reader always has to acquire
    // the lock before actually doing anything anyway)
    header.setBaseTimestamp(0);

    header.setLastChangelogID(-1);

    changelog->reset();

    // set this last as it tells anyone accessing the header without a mutex lock that the header is
    // not yet initialized
    header.setBaseTimestamp(getCurrentClockTimeMicroseconds());
  }

  int32_t getCurrentTimestamp() {
    return getCurrentClockTimeMicroseconds() - header.getBaseTimestamp();
  }

  static int32_t getMemSize(const DatasetConfig& config) {
    return DSHeaderAccessor::DS_SIZE + PlacedRingBuffer::getMemSize(config.changelogByteCount);
  }

  static bool versionCheck(void* memView, const DatasetConfig& config) {
    auto header = DSHeaderAccessor(memView);
    return header.getBaseTimestamp() != 0 && header.getDatasetVersion() == DATASET_VERSION &&
        header.getSchemaHash() == config.schemaHash;
  }

 private:
  static constexpr int32_t DATASET_VERSION =
      8; // conorwdickinson: unidirectional transport, no object store

  std::unique_ptr<MutexLockedPointer> dataSource;
  DSHeaderAccessor header;
  PlacedRingBuffer* changelog = nullptr;
};

} // namespace Xrpa
