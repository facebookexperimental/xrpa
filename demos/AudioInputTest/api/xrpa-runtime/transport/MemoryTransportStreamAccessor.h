/*
// @generated
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

#include <xrpa-runtime/utils/MemoryAccessor.h>
#include <xrpa-runtime/utils/PlacedRingBuffer.h>
#include <xrpa-runtime/utils/TimeUtils.h>
#include <xrpa-runtime/utils/XrpaTypes.h>

namespace Xrpa {

class MemoryTransportStreamAccessor : public ObjectAccessorInterface {
 public:
  static constexpr int32_t BYTE_COUNT = 52;
  static constexpr int32_t TRANSPORT_VERSION =
      8; // conorwdickinson: unidirectional transport, no object store

  static int32_t getMemSize(const TransportConfig& config) {
    return BYTE_COUNT + PlacedRingBuffer::getMemSize(config.changelogByteCount);
  }
  explicit MemoryTransportStreamAccessor(const MemoryAccessor& memAccessor)
      : ObjectAccessorInterface(memAccessor.slice(0, BYTE_COUNT)) {}

  int32_t getTransportVersion() {
    auto offset = MemoryOffset(0);
    return memAccessor_.readValue<int32_t>(offset);
  }

  void setTransportVersion() {
    auto offset = MemoryOffset(0);
    memAccessor_.writeValue<int32_t>(TRANSPORT_VERSION, offset);
  }

  int32_t getTotalBytes() {
    auto offset = MemoryOffset(4);
    return memAccessor_.readValue<int32_t>(offset);
  }

  void setTotalBytes(int32_t type) {
    auto offset = MemoryOffset(4);
    memAccessor_.writeValue<int32_t>(type, offset);
  }

  HashValue getSchemaHash() {
    auto offset = MemoryOffset(8);
    return HashValue::readValue(memAccessor_, offset);
  }

  void setSchemaHash(const HashValue& hash) {
    auto offset = MemoryOffset(8);
    HashValue::writeValue(hash, memAccessor_, offset);
  }

  uint64_t getBaseTimestamp() {
    auto offset = MemoryOffset(40);
    return memAccessor_.readValue<uint64_t>(offset);
  }

  void setBaseTimestamp(uint64_t timestamp) {
    auto offset = MemoryOffset(40);
    memAccessor_.writeValue<uint64_t>(timestamp, offset);
  }

  int32_t getLastChangelogID() {
    auto offset = MemoryOffset(48);
    return memAccessor_.readValue<int32_t>(offset);
  }

  void setLastChangelogID(int32_t id) {
    auto offset = MemoryOffset(48);
    memAccessor_.writeValue<int32_t>(id, offset);
  }

  PlacedRingBuffer* getChangelog() {
    return static_cast<PlacedRingBuffer*>(memAccessor_.getRawPointer(BYTE_COUNT, 0));
  }

  void setNull() {
    memAccessor_ = MemoryAccessor();
  }

  void initialize(const TransportConfig& config) {
    // initialize baseTimestamp to 0 first, to let lock-free readers know the data is invalid
    // (note there is still sort of a race condition there... but a reader always has to acquire
    // the lock before actually doing anything anyway)
    setBaseTimestamp(0);

    setLastChangelogID(-1);
    setTransportVersion();
    setSchemaHash(config.schemaHash);
    setTotalBytes(getMemSize(config));

    getChangelog()->init(config.changelogByteCount);

    // set this last as it tells anyone accessing the header
    // without a mutex lock that the header is not yet initialized
    setBaseTimestamp(getCurrentClockTimeMicroseconds());
  }

  bool versionCheck(const TransportConfig& config) {
    if (memAccessor_.isNull()) {
      return false;
    }
    return getBaseTimestamp() != 0 && getTransportVersion() == TRANSPORT_VERSION &&
        getSchemaHash() == config.schemaHash;
  }
};

} // namespace Xrpa
