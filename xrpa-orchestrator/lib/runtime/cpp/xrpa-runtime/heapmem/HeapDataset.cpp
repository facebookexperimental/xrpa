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

#include <xrpa-runtime/heapmem/HeapDataset.h>

using namespace std::chrono_literals;

namespace Xrpa {

static constexpr auto HM_TIMEOUT = 1s;

HeapDataset::HeapDataset(const DatasetConfig& config) {
  int32_t totalBytes = DatasetAccessor::getMemSize(config);

  memoryBlock = malloc(totalBytes);

  acquire(
      HM_TIMEOUT, [&](DatasetAccessor* accessor) { accessor->initContents(totalBytes, config); });
  isInitialized_ = true;
}

HeapDataset::~HeapDataset() {
  free(memoryBlock);
  memoryBlock = nullptr;
}

bool HeapDataset::acquire(
    std::chrono::milliseconds timeout,
    std::function<void(DatasetAccessor*)> func) {
  if (memoryBlock != nullptr && mutex.try_lock_for(timeout)) {
    auto accessor = std::make_unique<DatasetAccessor>(
        std::make_unique<HeapMutexLockedPointer>(memoryBlock, &mutex), !isInitialized_);
    func(accessor.get());
    return true;
  }
  return false;
}

bool HeapDataset::checkSchemaHash(const DSHashValue& schemaHash) const {
  auto header = DSHeaderAccessor(memoryBlock);
  return header.isNull() ? false : header.getSchemaHash() == schemaHash;
}

uint64_t HeapDataset::getBaseTimestamp() const {
  auto header = DSHeaderAccessor(memoryBlock);
  return header.isNull() ? 0 : header.getBaseTimestamp();
}

int32_t HeapDataset::getLastChangelogID() const {
  auto header = DSHeaderAccessor(memoryBlock);
  return header.isNull() ? 0 : header.getLastChangelogID();
}

} // namespace Xrpa
