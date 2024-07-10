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

#include <dataset/core/DatasetTypes.h>
#include <dataset/reconciler/DatasetReconciler.h>
#include <memory>
#include <type_traits>
#include <unordered_set>

namespace Xrpa {

class DataStoreObject : public std::enable_shared_from_this<DataStoreObject> {
 public:
  explicit DataStoreObject(const DSIdentifier& id) : id_(id) {}

  DataStoreObject(const DSIdentifier& id, Xrpa::CollectionInterface* collection)
      : collection_(collection), id_(id) {}

  virtual ~DataStoreObject() {}

  void setXrpaCollection(Xrpa::CollectionInterface* collection) {
    collection_ = collection;
  }

  const DSIdentifier& getXrpaId() const {
    return id_;
  }

 protected:
  Xrpa::CollectionInterface* collection_ = nullptr;

 private:
  DSIdentifier id_;
};

class CollectionInterface {
 public:
  explicit CollectionInterface(DatasetReconciler* reconciler, int32_t collectionId)
      : reconciler_(reconciler), collectionId_(collectionId) {}
  virtual ~CollectionInterface() = default;

  MemoryAccessor sendMessage(const DSIdentifier& id, int32_t messageType, int32_t numBytes) {
    return reconciler_->sendMessage(id, messageType, numBytes);
  }

  virtual void setDirty(const DSIdentifier& objId, uint64_t /*fieldsChanged*/) {
    reconciler_->setDirty(objId, getId());
  }

 protected:
  friend class DatasetReconciler;
  DatasetReconciler* reconciler_;
  int32_t collectionId_;

  int32_t getId() {
    return collectionId_;
  }

  [[nodiscard]] virtual bool isLocalOwned() const = 0;

  virtual void tick() = 0;

  virtual void writeChanges(DatasetAccessor* accessor, const DSIdentifier& id) = 0;

  virtual void processCreate(const DSIdentifier& id, MemoryAccessor objAccessor) = 0;

  virtual bool
  processUpdate(const DSIdentifier& id, MemoryAccessor objAccessor, uint64_t fieldsChanged) = 0;

  virtual void processDelete(const DSIdentifier& id) = 0;

  virtual void processMessage(
      const DSIdentifier& id,
      int32_t messageType,
      int32_t timestamp,
      MemoryAccessor msgAccessor) = 0;

  virtual void processUpsert(const DSIdentifier& id, MemoryAccessor objAccessor) = 0;

  virtual void processFullReconcile(const std::unordered_set<DSIdentifier>& reconciledIds) = 0;
};

// tickXrpa traits
template <typename T, typename = std::void_t<>>
struct has_tickXrpa : std::false_type {};

template <typename T>
struct has_tickXrpa<T*, std::void_t<decltype(std::declval<T>().tickXrpa())>> : std::true_type {};

template <typename T>
struct has_tickXrpa<std::shared_ptr<T>, std::void_t<decltype(std::declval<T>().tickXrpa())>>
    : std::true_type {};

// processDSDelete traits
template <typename T, typename = std::void_t<>>
struct has_processDSDelete : std::false_type {};

template <typename T>
struct has_processDSDelete<T*, std::void_t<decltype(std::declval<T>().processDSDelete())>>
    : std::true_type {};

template <typename T>
struct has_processDSDelete<
    std::shared_ptr<T>,
    std::void_t<decltype(std::declval<T>().processDSDelete())>> : std::true_type {};

} // namespace Xrpa
