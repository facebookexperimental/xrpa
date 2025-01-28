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
    return ObjectUuid::readValue(memAccessor_, ChangeEventAccessor::DS_SIZE);
  }

  void setObjectId(const ObjectUuid& id) {
    ObjectUuid::writeValue(id, memAccessor_, ChangeEventAccessor::DS_SIZE);
  }

  int32_t getCollectionId() {
    return memAccessor_.readValue<int32_t>(ChangeEventAccessor::DS_SIZE + 16);
  }

  void setCollectionId(int32_t collectionId) {
    memAccessor_.writeValue<int32_t>(collectionId, ChangeEventAccessor::DS_SIZE + 16);
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
    return memAccessor_.readValue<uint64_t>(CollectionChangeEventAccessor::DS_SIZE);
  }

  void setFieldsChanged(uint64_t fieldsChanged) {
    memAccessor_.writeValue<uint64_t>(fieldsChanged, CollectionChangeEventAccessor::DS_SIZE);
  }

  MemoryAccessor accessChangeData() override {
    return memAccessor_.slice(DS_SIZE);
  }
};

class CollectionMessageChangeEventAccessor : public CollectionChangeEventAccessor {
 public:
  static constexpr int32_t DS_SIZE = CollectionChangeEventAccessor::DS_SIZE + 8;

  explicit CollectionMessageChangeEventAccessor(MemoryAccessor memAccessor)
      : CollectionChangeEventAccessor(std::move(memAccessor)) {}

  int32_t getFieldId() {
    return memAccessor_.readValue<int32_t>(CollectionChangeEventAccessor::DS_SIZE);
  }

  void setFieldId(int32_t fieldId) {
    memAccessor_.writeValue<int32_t>(fieldId, CollectionChangeEventAccessor::DS_SIZE);
  }

  MemoryAccessor accessChangeData() override {
    return memAccessor_.slice(DS_SIZE);
  }
};

} // namespace Xrpa
