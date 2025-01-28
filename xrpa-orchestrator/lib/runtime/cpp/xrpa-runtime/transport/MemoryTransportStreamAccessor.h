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
    return memAccessor_.readValue<int32_t>(0);
  }

  void setTransportVersion() {
    memAccessor_.writeValue<int32_t>(TRANSPORT_VERSION, 0);
  }

  int32_t getTotalBytes() {
    return memAccessor_.readValue<int32_t>(4);
  }

  void setTotalBytes(int32_t type) {
    memAccessor_.writeValue<int32_t>(type, 4);
  }

  HashValue getSchemaHash() {
    return HashValue::readValue(memAccessor_, 8);
  }

  void setSchemaHash(const HashValue& hash) {
    HashValue::writeValue(hash, memAccessor_, 8);
  }

  uint64_t getBaseTimestamp() {
    return memAccessor_.readValue<uint64_t>(40);
  }

  void setBaseTimestamp(uint64_t timestamp) {
    memAccessor_.writeValue<uint64_t>(timestamp, 40);
  }

  int32_t getLastChangelogID() {
    return memAccessor_.readValue<int32_t>(48);
  }

  void setLastChangelogID(int32_t id) {
    memAccessor_.writeValue<int32_t>(id, 48);
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
