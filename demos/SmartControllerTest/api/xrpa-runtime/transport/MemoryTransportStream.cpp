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

bool MemoryTransportStream::initializeMemory(bool didCreate) {
  if (memBuffer_ == nullptr || mutex_ == nullptr) {
    return false;
  }

  if (didCreate) {
    return mutex_->lockAndExecute(
        std::chrono::duration_cast<std::chrono::milliseconds>(INIT_TIMEOUT).count(), [&]() {
          MemoryTransportStreamAccessor streamAccessor{accessMemory()};
          streamAccessor.initialize(config_);
        });
  }

  // lock-free version check against the transport header
  MemoryTransportStreamAccessor streamAccessor{accessMemory()};

  if (!streamAccessor.versionCheck(config_)) {
    std::cerr << "MemoryTransportStream::initializeMemory: version check failed" << std::endl;
    return false;
  }

  if (streamAccessor.getLastUpdateAgeMicroseconds() > TRANSPORT_EXPIRE_TIME.count()) {
    // re-initialize the transport memory if it has expired
    std::cout << "MemoryTransportStream::initializeMemory: transport memory expired, reinitializing"
              << std::endl;
    return mutex_->lockAndExecute(
        std::chrono::duration_cast<std::chrono::milliseconds>(INIT_TIMEOUT).count(), [&]() {
          MemoryTransportStreamAccessor streamAccessor{accessMemory()};
          streamAccessor.initialize(config_);
        });
  }

  return true;
}

} // namespace Xrpa
