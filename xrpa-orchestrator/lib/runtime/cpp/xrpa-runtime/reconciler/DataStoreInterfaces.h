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
#include <memory>
#include <type_traits>
#include <unordered_set>

namespace Xrpa {

struct FullUpdateEntry {
  FullUpdateEntry(const ObjectUuid& objectId, int32_t collectionId, uint64_t timestamp)
      : objectId_(objectId), collectionId_(collectionId), timestamp_(timestamp) {}

  ObjectUuid objectId_;
  int32_t collectionId_;
  uint64_t timestamp_;
};

class IObjectCollection {
 public:
  explicit IObjectCollection(DataStoreReconciler* reconciler, int32_t collectionId)
      : reconciler_(reconciler), collectionId_(collectionId) {}
  virtual ~IObjectCollection() = default;

  MemoryAccessor sendMessage(const ObjectUuid& id, int32_t messageType, int32_t numBytes) {
    return reconciler_->sendMessage(id, collectionId_, messageType, numBytes);
  }

  void notifyObjectNeedsWrite(const ObjectUuid& objectId) {
    reconciler_->notifyObjectNeedsWrite(objectId, collectionId_);
  }

  virtual void setDirty(const ObjectUuid& objectId, uint64_t fieldsChanged) = 0;

  int32_t getId() {
    return collectionId_;
  }

 protected:
  friend class DataStoreReconciler;
  DataStoreReconciler* reconciler_;
  int32_t collectionId_;

  [[nodiscard]] virtual bool isLocalOwned() const = 0;

  virtual void tick() = 0;

  virtual void writeChanges(TransportStreamAccessor* accessor, const ObjectUuid& id) = 0;

  virtual void prepFullUpdate(std::vector<FullUpdateEntry>& entries) = 0;

  virtual void processCreate(const ObjectUuid& id, MemoryAccessor objAccessor) = 0;

  virtual bool
  processUpdate(const ObjectUuid& id, MemoryAccessor objAccessor, uint64_t fieldsChanged) = 0;

  virtual void processDelete(const ObjectUuid& id) = 0;

  virtual void processMessage(
      const ObjectUuid& id,
      int32_t messageType,
      uint64_t timestamp,
      MemoryAccessor msgAccessor) = 0;

  virtual void processUpsert(const ObjectUuid& id, MemoryAccessor objAccessor) = 0;

  virtual void processFullReconcile(const std::unordered_set<ObjectUuid>& reconciledIds) = 0;

  virtual void processShutdown() = 0;
};

class DataStoreObject : public std::enable_shared_from_this<DataStoreObject> {
 public:
  explicit DataStoreObject(const ObjectUuid& id) : id_(id) {}

  DataStoreObject(const ObjectUuid& id, IObjectCollection* collection)
      : collection_(collection), id_(id) {}

  virtual ~DataStoreObject() = default;

  void setXrpaCollection(IObjectCollection* collection) {
    if (collection == nullptr && collection_ != nullptr && !hasNotifiedNeedsWrite_) {
      // object removed from collection
      collection_->notifyObjectNeedsWrite(id_);
      hasNotifiedNeedsWrite_ = true;
    }

    collection_ = collection;

    if (collection_ != nullptr && !hasNotifiedNeedsWrite_) {
      // object added to collection
      collection_->notifyObjectNeedsWrite(id_);
      hasNotifiedNeedsWrite_ = true;
    }
  }

  const ObjectUuid& getXrpaId() const {
    return id_;
  }

  int getCollectionId() const {
    return collection_ == nullptr ? -1 : collection_->getId();
  }

  void setXrpaOwner(void* owner) {
    owner_ = owner;
  }

  template <typename T>
  T* getXrpaOwner() {
    return static_cast<T*>(owner_);
  }

 protected:
  IObjectCollection* collection_ = nullptr;
  bool hasNotifiedNeedsWrite_ = false;

 private:
  ObjectUuid id_;
  void* owner_ = nullptr;
};

// tickXrpa traits
template <typename T, typename = std::void_t<>>
struct has_tickXrpa : std::false_type {};

template <typename T>
struct has_tickXrpa<T*, std::void_t<decltype(std::declval<T>().tickXrpa())>> : std::true_type {};

template <typename T>
struct has_tickXrpa<std::shared_ptr<T>, std::void_t<decltype(std::declval<T>().tickXrpa())>>
    : std::true_type {};

// handleXrpaDelete traits
template <typename T, typename = std::void_t<>>
struct has_handleXrpaDelete : std::false_type {};

template <typename T>
struct has_handleXrpaDelete<T*, std::void_t<decltype(std::declval<T>().handleXrpaDelete())>>
    : std::true_type {};

template <typename T>
struct has_handleXrpaDelete<
    std::shared_ptr<T>,
    std::void_t<decltype(std::declval<T>().handleXrpaDelete())>> : std::true_type {};

} // namespace Xrpa
