/*
// @generated
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

#include <xrpa-runtime/reconciler/DataStoreReconciler.h>
#include <xrpa-runtime/utils/XrpaTypes.h>

namespace Xrpa {

enum CollectionChangeType : int32_t {
  RequestFullUpdate = 0,
  FullUpdate = 1,
  Shutdown = 2,
  CreateObject = 3,
  DeleteObject = 4,
  UpdateObject = 5,
  Message = 6,
};

class CollectionChangeEventAccessor : public ChangeEventAccessor {
 public:
  static constexpr int32_t DS_SIZE = ChangeEventAccessor::DS_SIZE + 20;

  explicit CollectionChangeEventAccessor(MemoryAccessor memAccessor)
      : ChangeEventAccessor(std::move(memAccessor)) {}

  ObjectUuid getObjectId() {
    auto offset = MemoryOffset(ChangeEventAccessor::DS_SIZE);
    return ObjectUuid::readValue(memAccessor_, offset);
  }

  void setObjectId(const ObjectUuid& id) {
    auto offset = MemoryOffset(ChangeEventAccessor::DS_SIZE);
    ObjectUuid::writeValue(id, memAccessor_, offset);
  }

  int32_t getCollectionId() {
    auto offset = MemoryOffset(ChangeEventAccessor::DS_SIZE + 16);
    return memAccessor_.readValue<int32_t>(offset);
  }

  void setCollectionId(int32_t collectionId) {
    auto offset = MemoryOffset(ChangeEventAccessor::DS_SIZE + 16);
    memAccessor_.writeValue<int32_t>(collectionId, offset);
  }

  virtual MemoryAccessor accessChangeData() {
    return memAccessor_.slice(DS_SIZE);
  }
};

class CollectionUpdateChangeEventAccessor : public CollectionChangeEventAccessor {
 public:
  static constexpr int32_t DS_SIZE = CollectionChangeEventAccessor::DS_SIZE + 8;

  explicit CollectionUpdateChangeEventAccessor(MemoryAccessor memAccessor)
      : CollectionChangeEventAccessor(std::move(memAccessor)) {}

  uint64_t getFieldsChanged() {
    auto offset = MemoryOffset(CollectionChangeEventAccessor::DS_SIZE);
    return memAccessor_.readValue<uint64_t>(offset);
  }

  void setFieldsChanged(uint64_t fieldsChanged) {
    auto offset = MemoryOffset(CollectionChangeEventAccessor::DS_SIZE);
    memAccessor_.writeValue<uint64_t>(fieldsChanged, offset);
  }

  MemoryAccessor accessChangeData() override {
    return memAccessor_.slice(DS_SIZE);
  }
};

class CollectionMessageChangeEventAccessor : public CollectionChangeEventAccessor {
 public:
  // TODO this should be 4 bytes, not 8
  static constexpr int32_t DS_SIZE = CollectionChangeEventAccessor::DS_SIZE + 8;

  explicit CollectionMessageChangeEventAccessor(MemoryAccessor memAccessor)
      : CollectionChangeEventAccessor(std::move(memAccessor)) {}

  int32_t getFieldId() {
    auto offset = MemoryOffset(CollectionChangeEventAccessor::DS_SIZE);
    return memAccessor_.readValue<int32_t>(offset);
  }

  void setFieldId(int32_t fieldId) {
    auto offset = MemoryOffset(CollectionChangeEventAccessor::DS_SIZE);
    memAccessor_.writeValue<int32_t>(fieldId, offset);
  }

  MemoryAccessor accessChangeData() override {
    return memAccessor_.slice(DS_SIZE);
  }
};

} // namespace Xrpa
