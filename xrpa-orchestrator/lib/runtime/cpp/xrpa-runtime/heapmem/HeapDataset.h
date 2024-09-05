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

#include <xrpa-runtime/core/DatasetInterface.h>
#include <xrpa-runtime/core/MutexLockedPointer.h>
#include <chrono>
#include <memory>
#include <mutex>

namespace Xrpa {

using HeapMutexLockedPointer = MutexLockedPointerImpl<std::timed_mutex>;

class HeapDataset : public DatasetInterface {
 public:
  explicit HeapDataset(const DatasetConfig& config);
  ~HeapDataset() override;

  HeapDataset(const HeapDataset& other) = delete;
  HeapDataset(HeapDataset&& other) = delete;
  HeapDataset& operator=(const HeapDataset& other) = delete;
  HeapDataset& operator=(HeapDataset&& other) = delete;

  [[nodiscard]] bool checkSchemaHash(const DSHashValue& schemaHash) const override;
  [[nodiscard]] uint64_t getBaseTimestamp() const override;
  [[nodiscard]] int32_t getLastChangelogID() const override;
  [[nodiscard]] int32_t getLastMessageID() const override;

  bool acquire(std::chrono::milliseconds timeout, std::function<void(DatasetAccessor*)> func)
      override;

 protected:
  void* memoryBlock = nullptr;
  std::timed_mutex mutex;
  bool isInitialized_ = false;
};

} // namespace Xrpa
