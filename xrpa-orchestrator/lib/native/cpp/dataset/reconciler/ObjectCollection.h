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
#include <dataset/reconciler/DatasetReconcilerInterfaces.h>
#include <iostream>
#include <memory>
#include <type_traits>

namespace Xrpa {

template <typename ObjectAccessorType, typename ReconciledTypePtr>
class ObjectCollection : public CollectionInterface {
  using CollectionEntryMap = std::unordered_map<DSIdentifier, ReconciledTypePtr>;
  using CollectionEntryIter = typename CollectionEntryMap::iterator;

  class Iterator {
   public:
    explicit Iterator(CollectionEntryIter it) : current(it) {}

    Iterator& operator++() {
      ++current;
      return *this;
    }

    bool operator!=(const Iterator& other) const {
      return current != other.current;
    }

    const ReconciledTypePtr& operator*() const {
      return current->second;
    }

   private:
    CollectionEntryIter current;
  };

 public:
  using CreateDelegateFunction = std::function<
      ReconciledTypePtr(const DSIdentifier&, const ObjectAccessorType&, CollectionInterface*)>;

  ObjectCollection(
      DatasetReconciler* reconciler,
      int32_t collectionId,
      uint64_t inboundFieldMask,
      uint64_t indexedFieldMask,
      bool isLocalOwned)
      : CollectionInterface(reconciler, collectionId),
        inboundFieldMask_(inboundFieldMask),
        indexedFieldMask_(indexedFieldMask),
        isLocalOwned_(isLocalOwned) {}

  [[nodiscard]] const ReconciledTypePtr& getObject(const DSIdentifier& id) const {
    auto iter = objects_.find(id);
    if (iter != objects_.end()) {
      return iter->second;
    }
    return emptyPointer_;
  }

  Iterator begin() {
    return Iterator(objects_.begin());
  }

  Iterator end() {
    return Iterator(objects_.end());
  }

 protected:
  uint64_t inboundFieldMask_;
  uint64_t indexedFieldMask_;
  bool isLocalOwned_;

  CollectionEntryMap objects_;
  CreateDelegateFunction createDelegate_ = nullptr;

  ReconciledTypePtr emptyPointer_ = nullptr;

  // these functions are for updating indexes in derived classes
  virtual void indexNotifyCreate(ReconciledTypePtr /*obj*/) {}
  virtual void indexNotifyUpdate(ReconciledTypePtr /*obj*/, uint64_t /*fieldsChanged*/) {}
  virtual void indexNotifyDelete(ReconciledTypePtr /*obj*/) {}

  virtual void bindingTick() {}
  virtual void bindingWriteChanges(const DSIdentifier& /*id*/) {}
  virtual void bindingProcessMessage(
      const DSIdentifier& /*id*/,
      int32_t /*messageType*/,
      int32_t /*timestamp*/,
      MemoryAccessor /*msgAccessor*/) {}

  // these functions are for isLocalOwned=true derived classes; they typically will be exposed with
  // public wrapper functions
  void addObjectInternal(ReconciledTypePtr obj) {
    if (!isLocalOwned_) {
      return;
    }

    objects_.emplace(obj->getXrpaId(), obj);
    obj->setXrpaCollection(this);
    setDirty(obj->getXrpaId(), 0);

    if (indexedFieldMask_ != 0) {
      indexNotifyCreate(obj);
    }
  }

  void removeObjectInternal(const DSIdentifier& id) {
    if (!isLocalOwned_) {
      return;
    }

    auto iter = objects_.find(id);
    if (iter == objects_.end()) {
      return;
    }

    if (indexedFieldMask_ != 0) {
      indexNotifyDelete(iter->second);
    }

    objects_.erase(iter);
    setDirty(id, 0);
  }

  // this function is for isLocalOwned=false derived classes; it will either be called in the
  // constructor or exposed with a public wrapper function
  void setCreateDelegateInternal(CreateDelegateFunction createDelegate) {
    if (!isLocalOwned_) {
      createDelegate_ = createDelegate;
    }
  }

  [[nodiscard]] bool isLocalOwned() const final {
    return isLocalOwned_;
  }

  void tick() final {
    if (indexedFieldMask_ != 0) {
      bindingTick();
    }

    if constexpr (has_tickXrpa<ReconciledTypePtr>::value) {
      for (auto iter = objects_.begin(), last = objects_.end(); iter != last; ++iter) {
        iter->second->tickXrpa();
      }
    }
  }

  void setDirty(const DSIdentifier& objId, uint64_t fieldsChanged) final {
    CollectionInterface::setDirty(objId, fieldsChanged);

    if ((indexedFieldMask_ & fieldsChanged) != 0) {
      auto iter = objects_.find(objId);
      if (iter != objects_.end()) {
        indexNotifyUpdate(iter->second, fieldsChanged);
      }
    }
  }

  void processCreate(const DSIdentifier& id, MemoryAccessor memAccessor) final {
    if (isLocalOwned_) {
      return;
    }

    // create a new object using the delegate function
    ReconciledTypePtr objectPtr;
    try {
      objectPtr = createDelegate_(id, ObjectAccessorType(memAccessor), this);
    } catch (std::exception& e) {
      // log the exception e.what()
      std::cout << "Caught exception in createDelegate: " << e.what() << std::endl;
    } catch (...) {
      // log an error
      std::cout << "Caught unknown error in createDelegate" << std::endl;
    }
    if (objectPtr.get() == nullptr) {
      return;
    }

    objects_.emplace(id, objectPtr);
    processUpdateInternal(id, memAccessor, inboundFieldMask_, false);

    if (indexedFieldMask_ != 0) {
      indexNotifyCreate(objectPtr);
    }
  }

  CollectionEntryIter processDeleteInternal(CollectionEntryIter iter) {
    if (indexedFieldMask_ != 0) {
      indexNotifyDelete(iter->second);
    }

    if constexpr (has_processDSDelete<ReconciledTypePtr>::value) {
      try {
        iter->second->processDSDelete();
      } catch (std::exception& e) {
        // log the exception e.what()
        std::cout << "Caught exception in processDSDelete/destructor: " << e.what() << std::endl;
      } catch (...) {
        // log an error
        std::cout << "Caught unknown error in processDSDelete/destructor" << std::endl;
      }
    }
    return objects_.erase(iter);
  }

  void processDelete(const DSIdentifier& id) final {
    if (isLocalOwned_) {
      return;
    }

    auto iter = objects_.find(id);
    if (iter != objects_.end()) {
      processDeleteInternal(iter);
    }
  }

  void processUpsert(const DSIdentifier& id, MemoryAccessor memAccessor) final {
    if (!processUpdateInternal(id, memAccessor, inboundFieldMask_, true)) {
      processCreate(id, memAccessor);
    }
  }

  void processFullReconcile(const std::unordered_set<DSIdentifier>& reconciledIds) final {
    if (isLocalOwned_) {
      return;
    }
    for (auto iter = objects_.begin(), last = objects_.end(); iter != last;) {
      if (reconciledIds.find(iter->first) == reconciledIds.end()) {
        iter = processDeleteInternal(iter);
      } else {
        ++iter;
      }
    }
  }

  void writeChanges(DatasetAccessor* accessor, const DSIdentifier& id) final {
    auto iter = objects_.find(id);
    if (iter != objects_.end()) {
      if (indexedFieldMask_ != 0) {
        bindingWriteChanges(id);
      }
      iter->second->writeDSChanges(accessor);
    } else if (isLocalOwned_) {
      accessor->deleteObject(id);
    }
  }

  bool processUpdate(const DSIdentifier& id, MemoryAccessor memAccessor, uint64_t fieldsChanged)
      final {
    return processUpdateInternal(id, memAccessor, fieldsChanged, true);
  }

  bool processUpdateInternal(
      const DSIdentifier& id,
      MemoryAccessor memAccessor,
      uint64_t fieldsChanged,
      bool notify) {
    fieldsChanged &= inboundFieldMask_;
    if (fieldsChanged == 0) {
      // no inbound fields changed, ignore this update
      return false;
    }

    auto iter = objects_.find(id);
    if (iter == objects_.end()) {
      return false;
    }

    try {
      iter->second->processDSUpdate(ObjectAccessorType(memAccessor), fieldsChanged);
    } catch (std::exception& e) {
      // log the exception e.what()
      std::cout << "Caught exception in processDSUpdate: " << e.what() << std::endl;
    } catch (...) {
      // log an error
      std::cout << "Caught unknown error in processDSUpdate" << std::endl;
    }

    if (notify && (indexedFieldMask_ & fieldsChanged) != 0) {
      indexNotifyUpdate(iter->second, fieldsChanged);
    }

    return true;
  }

  void processMessage(
      const DSIdentifier& id,
      int32_t messageType,
      int32_t timestamp,
      MemoryAccessor msgAccessor) final {
    auto iter = objects_.find(id);
    if (iter == objects_.end()) {
      return;
    }
    try {
      iter->second->processDSMessage(messageType, timestamp, msgAccessor);
    } catch (std::exception& e) {
      // log the exception e.what()
      std::cout << "Caught exception in processDSMessage: " << e.what() << std::endl;
    } catch (...) {
      // log an error
      std::cout << "Caught unknown error in processDSMessage" << std::endl;
    }

    if (indexedFieldMask_ != 0) {
      bindingProcessMessage(id, messageType, timestamp, msgAccessor);
    }
  }
};

} // namespace Xrpa
