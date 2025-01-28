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

#include <xrpa-runtime/transport/InterprocessMutex.h>
#include <xrpa-runtime/transport/TransportStream.h>
#include <xrpa-runtime/transport/TransportStreamAccessor.h>
#include <xrpa-runtime/utils/MemoryAccessor.h>
#include <xrpa-runtime/utils/PlacedRingBuffer.h>
#include <xrpa-runtime/utils/XrpaTypes.h>
#include <xrpa-runtime/utils/XrpaUtils.h>
#include <chrono>
#include <functional>
#include <memory>

namespace Xrpa {

class MemoryTransportStream : public TransportStream {
 public:
  MemoryTransportStream(const std::string& name, const TransportConfig& config);
  virtual ~MemoryTransportStream() = default;

  bool transact(
      std::chrono::milliseconds timeout,
      std::function<void(TransportStreamAccessor*)> func) override;

  std::unique_ptr<TransportStreamIterator> createIterator() override;

 protected:
  friend class MemoryTransportStreamIterator;

  std::string name_;
  TransportConfig config_;
  int32_t memSize_ = 0;
  std::unique_ptr<InterprocessMutex> mutex_;

  unsigned char* memBuffer_ = nullptr;

  [[nodiscard]] MemoryAccessor accessMemory() const {
    return {memBuffer_, 0, memSize_};
  }

  bool initializeMemory(bool didCreate);
};

} // namespace Xrpa
