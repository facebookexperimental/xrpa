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

#include <xrpa-runtime/transport/MemoryTransportStream.h>
#include <xrpa-runtime/transport/MemoryTransportStreamAccessor.h>
#include <xrpa-runtime/transport/TransportStreamAccessor.h>
#include <xrpa-runtime/utils/MemoryAccessor.h>
#include <xrpa-runtime/utils/PlacedRingBuffer.h>
#include <xrpa-runtime/utils/XrpaTypes.h>
#include <xrpa-runtime/utils/XrpaUtils.h>

namespace Xrpa {

class MemoryTransportStreamIterator : public TransportStreamIterator {
 public:
  class MemoryTransportStreamIteratorData : public TransportStreamIteratorData {
   public:
    static constexpr int32_t TYPE_ID = 82001;
    explicit MemoryTransportStreamIteratorData(PlacedRingBuffer* changelog)
        : TransportStreamIteratorData(TYPE_ID), changelog_(changelog) {}

    PlacedRingBuffer* changelog_ = nullptr;
  };

  explicit MemoryTransportStreamIterator(MemoryTransportStream* transportStream)
      : transportStream_(transportStream) {}

  ~MemoryTransportStreamIterator() override = default;

  bool needsProcessing() override {
    if (transportStream_->memBuffer_ == nullptr) {
      return false;
    }

    // lock-free check against the transport header
    MemoryTransportStreamAccessor streamAccessor{transportStream_->accessMemory()};
    return iter_.hasNext(streamAccessor.getLastChangelogID());
  }

  bool hasMissedEntries(TransportStreamAccessor* accessor) override {
    auto* iterData = accessor->getIteratorData<MemoryTransportStreamIteratorData>();
    if (iterData == nullptr) {
      return false;
    }
    auto* changelog = iterData->changelog_;
    if (iter_.hasMissedEntries(changelog)) {
      iter_.setToEnd(changelog);
      return true;
    }
    return false;
  }

  MemoryAccessor getNextEntry(TransportStreamAccessor* accessor) override {
    auto* changelog = accessor->getIteratorData<MemoryTransportStreamIteratorData>()->changelog_;
    return iter_.next(changelog);
  }

 private:
  MemoryTransportStream* transportStream_;
  PlacedRingBufferIterator iter_;
};

} // namespace Xrpa
