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

#include <xrpa-runtime/core/DatasetTypes.h>
#include <xrpa-runtime/reconciler/DatasetReconciler.h>
#include <memory>
#include <type_traits>
#include <unordered_set>

namespace Xrpa {

enum DSChangeType : int32_t {
  RequestFullUpdate = 0,
  FullUpdate = 1,
  Shutdown = 2,
  CreateObject = 3,
  DeleteObject = 4,
  UpdateObject = 5,
  Message = 6,
};

class DSCollectionChangeEventAccessor : public DSChangeEventAccessor {
 public:
  static constexpr int32_t DS_SIZE = DSChangeEventAccessor::DS_SIZE + 20;

  explicit DSCollectionChangeEventAccessor(MemoryAccessor memAccessor)
      : DSChangeEventAccessor(std::move(memAccessor)) {}

  DSIdentifier getObjectId() {
    return DSIdentifier::readValue(memAccessor_, DSChangeEventAccessor::DS_SIZE);
  }

  void setObjectId(const DSIdentifier& id) {
    DSIdentifier::writeValue(id, memAccessor_, DSChangeEventAccessor::DS_SIZE);
  }

  int32_t getCollectionId() {
    return memAccessor_.readValue<int32_t>(DSChangeEventAccessor::DS_SIZE + 16);
  }

  void setCollectionId(int32_t collectionId) {
    memAccessor_.writeValue<int32_t>(collectionId, DSChangeEventAccessor::DS_SIZE + 16);
  }

  virtual MemoryAccessor accessChangeData() {
    return memAccessor_.slice(DS_SIZE);
  }
};

class DSCollectionUpdateChangeEventAccessor : public DSCollectionChangeEventAccessor {
 public:
  static constexpr int32_t DS_SIZE = DSCollectionChangeEventAccessor::DS_SIZE + 8;

  explicit DSCollectionUpdateChangeEventAccessor(MemoryAccessor memAccessor)
      : DSCollectionChangeEventAccessor(std::move(memAccessor)) {}

  uint64_t getFieldsChanged() {
    return memAccessor_.readValue<uint64_t>(DSCollectionChangeEventAccessor::DS_SIZE);
  }

  void setFieldsChanged(uint64_t fieldsChanged) {
    memAccessor_.writeValue<uint64_t>(fieldsChanged, DSCollectionChangeEventAccessor::DS_SIZE);
  }

  MemoryAccessor accessChangeData() override {
    return memAccessor_.slice(DS_SIZE);
  }
};

class DSCollectionMessageChangeEventAccessor : public DSCollectionChangeEventAccessor {
 public:
  static constexpr int32_t DS_SIZE = DSCollectionChangeEventAccessor::DS_SIZE + 8;

  explicit DSCollectionMessageChangeEventAccessor(MemoryAccessor memAccessor)
      : DSCollectionChangeEventAccessor(std::move(memAccessor)) {}

  int32_t getFieldId() {
    return memAccessor_.readValue<int32_t>(DSCollectionChangeEventAccessor::DS_SIZE);
  }

  void setFieldId(int32_t fieldId) {
    memAccessor_.writeValue<int32_t>(fieldId, DSCollectionChangeEventAccessor::DS_SIZE);
  }

  MemoryAccessor accessChangeData() override {
    return memAccessor_.slice(DS_SIZE);
  }
};

struct FullUpdateEntry {
  FullUpdateEntry(const DSIdentifier& objectId, int32_t collectionId, uint64_t timestamp)
      : objectId_(objectId), collectionId_(collectionId), timestamp_(timestamp) {}

  DSIdentifier objectId_;
  int32_t collectionId_;
  uint64_t timestamp_;
};

} // namespace Xrpa
