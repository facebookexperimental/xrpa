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

#include <xrpa-runtime/transport/TransportStreamAccessor.h>
#include <xrpa-runtime/utils/TimeUtils.h>
#include <xrpa-runtime/utils/XrpaTypes.h>
#include <functional>

namespace Xrpa {

class ChangeEventAccessor : public ObjectAccessorInterface {
 public:
  static constexpr int32_t DS_SIZE = 8;

  explicit ChangeEventAccessor(MemoryAccessor memAccessor)
      : ObjectAccessorInterface(std::move(memAccessor)) {}

  int32_t getChangeType() {
    auto offset = MemoryOffset(0);
    return memAccessor_.readValue<int32_t>(offset);
  }

  void setChangeType(int32_t type) {
    auto offset = MemoryOffset(0);
    memAccessor_.writeValue<int32_t>(type, offset);
  }

  int32_t getTimestamp() {
    auto offset = MemoryOffset(4);
    return memAccessor_.readValue<int32_t>(offset);
  }

  void setTimestamp(int32_t timestamp) {
    auto offset = MemoryOffset(4);
    memAccessor_.writeValue<int32_t>(timestamp, offset);
  }
};

class TransportStreamIteratorData {
 public:
  explicit TransportStreamIteratorData(int32_t typeId) : typeId_(typeId) {}
  virtual ~TransportStreamIteratorData() = default;

  int32_t typeId_;
};

class TransportStreamAccessor {
 public:
  TransportStreamAccessor(
      uint64_t baseTimestamp,
      TransportStreamIteratorData* iteratorData,
      std::function<MemoryAccessor(int32_t)> eventAllocator)
      : baseTimestamp_(baseTimestamp),
        iteratorData_(iteratorData),
        eventAllocator_(std::move(eventAllocator)) {}

  template <typename EventAccessor = ChangeEventAccessor>
  EventAccessor writeChangeEvent(int32_t changeType, int32_t numBytes = 0, uint64_t timestamp = 0) {
    auto changeEvent = EventAccessor(eventAllocator_(EventAccessor::DS_SIZE + numBytes));

    if (!changeEvent.isNull()) {
      changeEvent.setChangeType(changeType);
      changeEvent.setTimestamp(timestamp ? (timestamp - baseTimestamp_) : getCurrentTimestamp());
    }

    return changeEvent;
  }

  int32_t getCurrentTimestamp() {
    return getCurrentClockTimeMicroseconds() - baseTimestamp_;
  }

  template <typename T>
  T* getIteratorData() {
    // can't use reinterpret_cast because Unreal Engine has RTTI disabled
    if (T::TYPE_ID != iteratorData_->typeId_) {
      return nullptr;
    }
    return reinterpret_cast<T*>(iteratorData_);
  }

 private:
  uint64_t baseTimestamp_;
  TransportStreamIteratorData* iteratorData_;
  std::function<MemoryAccessor(int32_t)> eventAllocator_;
};

} // namespace Xrpa
