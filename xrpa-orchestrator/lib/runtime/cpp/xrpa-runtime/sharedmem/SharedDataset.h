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
#include <xrpa-runtime/sharedmem/SharedMemoryBlock.h>
#include <chrono>
#include <memory>

namespace Xrpa {

class SharedDataset : public DatasetInterface {
 public:
  SharedDataset(const std::string& name, const DatasetConfig& config);
  virtual ~SharedDataset() override {}

  SharedDataset() = delete;
  SharedDataset(const SharedDataset& other) = delete;
  SharedDataset(SharedDataset&& other) = delete;
  SharedDataset& operator=(const SharedDataset& other) = delete;
  SharedDataset& operator=(SharedDataset&& other) = delete;

  bool initialize();

  virtual bool checkSchemaHash(const DSHashValue& schemaHash) const override;
  virtual uint64_t getBaseTimestamp() const override;
  virtual int32_t getLastChangelogID() const override;
  virtual int32_t getLastMessageID() const override;

  virtual bool acquire(
      std::chrono::milliseconds timeout,
      std::function<void(DatasetAccessor*)> func) override;

 protected:
  std::string datasetName_;
  DatasetConfig config_;
  SharedMemoryBlock memoryBlock_;
  bool isInitialized_ = false;
};

} // namespace Xrpa
