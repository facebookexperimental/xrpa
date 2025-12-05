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

#include <xrpa-runtime/transport/MemoryTransportStream.h>

#include <xrpa-runtime/transport/MemoryTransportStreamAccessor.h>
#include <xrpa-runtime/transport/MemoryTransportStreamIterator.h>
#include <xrpa-runtime/utils/TimeUtils.h>
#include <iostream>

namespace Xrpa {

using namespace std::chrono_literals;

static constexpr auto INIT_TIMEOUT = 5s;

static constexpr auto TRANSPORT_HEARTBEAT_INTERVAL =
    std::chrono::duration_cast<std::chrono::microseconds>(1s);
static constexpr auto TRANSPORT_EXPIRE_TIME =
    std::chrono::duration_cast<std::chrono::microseconds>(20s);

MemoryTransportStream::MemoryTransportStream(const std::string& name, const TransportConfig& config)
    : name_(name), config_(config), memSize_(MemoryTransportStreamAccessor::getMemSize(config)) {
#ifdef WIN32
  mutex_ = std::make_unique<WindowsInterprocessMutex>(name);
#elif defined(__APPLE__)
  mutex_ = std::make_unique<MacInterprocessMutex>(name);
#else
#error "Unsupported platform"
#endif
}

bool MemoryTransportStream::transact(
    std::chrono::milliseconds timeout,
    std::function<void(TransportStreamAccessor*)> func) {
  if (memBuffer_ == nullptr || mutex_ == nullptr) {
    return false;
  }

  return mutex_->lockAndExecute(timeout.count(), [&]() {
    MemoryTransportStreamAccessor streamAccessor{accessMemory()};
    auto* changelog = streamAccessor.getChangelog();
    auto baseTimestamp = streamAccessor.getBaseTimestamp();
    MemoryTransportStreamIterator::MemoryTransportStreamIteratorData iterData{changelog};

    TransportStreamAccessor transportAccessor{
        baseTimestamp, &iterData, [&](int32_t byteCount) -> MemoryAccessor {
          int32_t changeId = 0;
          auto eventMem = changelog->push(byteCount, &changeId);
          if (!eventMem.isNull()) {
            streamAccessor.setLastChangelogID(changeId);
          }
          return eventMem;
        }};

    func(&transportAccessor);
    streamAccessor.setLastUpdateTimestamp();

    flushWrites();
  });
}

std::unique_ptr<TransportStreamIterator> MemoryTransportStream::createIterator() {
  return std::make_unique<MemoryTransportStreamIterator>(this);
}

bool MemoryTransportStream::needsHeartbeat() {
  // lock-free version check against the transport header
  MemoryTransportStreamAccessor streamAccessor{accessMemory()};
  return streamAccessor.getLastUpdateAgeMicroseconds() > TRANSPORT_HEARTBEAT_INTERVAL.count();
}

bool MemoryTransportStream::initializeMemoryOnCreate() {
  return mutex_->lockAndExecute(
      std::chrono::duration_cast<std::chrono::milliseconds>(INIT_TIMEOUT).count(), [&]() {
        MemoryTransportStreamAccessor streamAccessor{accessMemory()};
        streamAccessor.initialize(config_);
      });
}

bool MemoryTransportStream::initializeMemory(bool didCreate) {
  if (memBuffer_ == nullptr || mutex_ == nullptr) {
    return false;
  }

  if (didCreate) {
    return initializeMemoryOnCreate();
  }

  // lock-free version check against the transport header
  MemoryTransportStreamAccessor streamAccessor{accessMemory()};

  if (!streamAccessor.isInitialized()) {
    std::cerr << "MemoryTransportStream(" << name_ << ")::initializeMemory: memory not available\n"
              << std::flush;
    return false;
  }

  if (streamAccessor.getBaseTimestamp() == 0) {
    // another process could be initializing the memory, so wait for it to finish
    mutex_->lockAndExecute(
        std::chrono::duration_cast<std::chrono::milliseconds>(INIT_TIMEOUT).count(), [&]() {
          // no-op, just needed to wait for the other process to finish initializing the memory
        });
    if (streamAccessor.getBaseTimestamp() == 0) {
      // if the memory is still not initialized after the timeout, then re-initialize it
      return initializeMemoryOnCreate();
    }
  }

  auto transportVersion = streamAccessor.getTransportVersion();
  if (transportVersion < 9) {
    // no heartbeat to check, so re-initialize the transport memory
    std::cout << "MemoryTransportStream(" << name_
              << ")::initializeMemory: transport version too old, reinitializing\n"
              << std::flush;
    return initializeMemoryOnCreate();
  }

  // check if the transport memory has expired
  if (streamAccessor.getLastUpdateAgeMicroseconds() > TRANSPORT_EXPIRE_TIME.count()) {
    std::cout << "MemoryTransportStream(" << name_
              << ")::initializeMemory: transport memory expired, reinitializing\n"
              << std::flush;
    return initializeMemoryOnCreate();
  }

  if (transportVersion != MemoryTransportStreamAccessor::TRANSPORT_VERSION) {
    // transport version mismatch, but the memory is in use, so error out
    std::cerr << "MemoryTransportStream(" << name_ << ")::initializeMemory: version check failed\n"
              << std::flush;
    return false;
  }

  if (streamAccessor.getSchemaHash() != config_.schemaHash) {
    // schema hash mismatch, but the memory is in use, so error out
    std::cerr << "MemoryTransportStream(" << name_ << ")::initializeMemory: schema hash mismatch\n"
              << std::flush;
    return false;
  }

  return true;
}

} // namespace Xrpa
