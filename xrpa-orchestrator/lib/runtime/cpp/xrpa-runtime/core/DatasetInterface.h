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

#include <xrpa-runtime/core/DatasetAccessor.h>
#include <xrpa-runtime/core/MutexLockedPointer.h>
#include <chrono>
#include <functional>

namespace Xrpa {

class DatasetInterface {
 public:
  virtual ~DatasetInterface() = default;

  [[nodiscard]] virtual bool checkSchemaHash(const DSHashValue& schemaHash) const = 0;
  [[nodiscard]] virtual uint64_t getBaseTimestamp() const = 0;
  [[nodiscard]] virtual int32_t getLastChangelogID() const = 0;

  virtual bool acquire(
      std::chrono::milliseconds timeout,
      std::function<void(DatasetAccessor*)> func) = 0;
};

} // namespace Xrpa
