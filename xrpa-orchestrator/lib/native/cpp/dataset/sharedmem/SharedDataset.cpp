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

#include <dataset/sharedmem/SharedDataset.h>

#include <dataset/core/DatasetTypes.h>

#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#include <Windows.h>

#include <iostream>

using namespace std::chrono_literals;

namespace Xrpa {

static constexpr auto SM_TIMEOUT = 5s;

SharedDataset::SharedDataset(const std::string& name, const DatasetConfig& config)
    : datasetName_(name), config_(config) {}

bool SharedDataset::initialize() {
  DSHeader header = DatasetAccessor::genHeader(config_);

  auto didCreate = memoryBlock_.openMemory(datasetName_, header.totalBytes);

  if (didCreate) {
    auto didLock = acquire(
        SM_TIMEOUT, [&](DatasetAccessor* accessor) { accessor->initContents(header, config_); });
    if (!didLock) {
      return false;
    }
  } else {
    // lock-free version check against the dataset's metadata
    if (!memoryBlock_.memBuffer ||
        !DatasetAccessor::versionCheck(memoryBlock_.memBuffer, config_)) {
      // TODO log a warning for the version mismatch? it isn't a hard failure but it will be
      // confusing without a log message
      return false;
    }
  }
  return true;
}

int filterException(int code, PEXCEPTION_POINTERS ex) {
  std::cout << "Exception: " << std::hex << code << std::endl;
  return EXCEPTION_EXECUTE_HANDLER;
}

bool runAcquireCallback(std::function<void(DatasetAccessor*)>& func, DatasetAccessor* accessor) {
  __try {
    func(accessor);
  } __except (filterException(GetExceptionCode(), GetExceptionInformation())) {
    return false;
  }
  return true;
}

bool SharedDataset::acquire(
    std::chrono::milliseconds timeout,
    std::function<void(DatasetAccessor*)> func) {
  if (!memoryBlock_.memBuffer) {
    initialize();
  }
  auto accessor = std::make_unique<DatasetAccessor>(memoryBlock_.acquire(timeout));
  if (!accessor->isValid()) {
    return false;
  }
  if (!runAcquireCallback(func, accessor.get())) {
    // release the mutex lock on crash, but still terminate the process
    accessor.reset();
    std::terminate();
  }
  return true;
}

bool SharedDataset::checkSchemaHash(const DSHashValue& schemaHash) const {
  auto header = reinterpret_cast<const DSHeader*>(memoryBlock_.memBuffer);
  return header != nullptr ? header->schemaHash == schemaHash : false;
}

uint64_t SharedDataset::getBaseTimestamp() const {
  auto header = reinterpret_cast<const DSHeader*>(memoryBlock_.memBuffer);
  return header != nullptr ? header->baseTimestamp : 0;
}

int32_t SharedDataset::getLastChangelogID() const {
  auto header = reinterpret_cast<const DSHeader*>(memoryBlock_.memBuffer);
  return header != nullptr ? header->lastChangelogID : 0;
}

int32_t SharedDataset::getLastMessageID() const {
  auto header = reinterpret_cast<const DSHeader*>(memoryBlock_.memBuffer);
  return header != nullptr ? header->lastMessageID : 0;
}

} // namespace Xrpa
