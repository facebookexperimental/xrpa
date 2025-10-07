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
#include <xrpa-runtime/utils/MemoryAccessor.h>
#include <chrono>
#include <functional>
#include <memory>

namespace Xrpa {

class TransportStreamIterator {
 public:
  virtual ~TransportStreamIterator() = default;

  virtual bool needsProcessing() = 0;

  virtual bool hasMissedEntries(TransportStreamAccessor* accessor) = 0;
  virtual MemoryAccessor getNextEntry(TransportStreamAccessor* accessor) = 0;
};

class TransportStream {
 public:
  virtual ~TransportStream() = default;

  virtual bool transact(
      std::chrono::milliseconds timeout,
      std::function<void(TransportStreamAccessor*)> func) = 0;

  virtual std::unique_ptr<TransportStreamIterator> createIterator() = 0;
};

} // namespace Xrpa
