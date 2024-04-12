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

#include <dataset/core/DatasetAccessor.h>
#include <dataset/core/DatasetTypes.h>
#include <dataset/reconciler/DatasetReconcilerInterfaces.h>
#include <functional>
#include <iostream>
#include <memory>
#include <unordered_map>
#include "stdint.h"

namespace Xrpa {

template <typename ReconciledTypePtr>
class DummyIndexReconciledType {
 public:
  void setDSReconciledObj(ReconciledTypePtr obj) {}
  void writeDSChanges() {}
  void processDSMessage(int32_t messageType, int32_t timestamp, MemoryAccessor& messageData) {}
  void processDSUpdate(uint64_t fieldsChanged) {}
};

template <typename ObjectAccessorType, typename ReconciledTypePtr, typename IndexReconciledTypePtr>
struct InboundReconciledEntry {
  InboundReconciledEntry(int32_t rID, ReconciledTypePtr&& rValue)
      : reconcileID(rID), directReconciledObj(std::move(rValue)) {}

  void setIndexReconciledObj(IndexReconciledTypePtr iObj, uint64_t inboundFieldMask) {
    assert(!indexReconciledObj);
    indexReconciledObj = iObj;
    indexReconciledObj->setDSReconciledObj(directReconciledObj);
    try {
      indexReconciledObj->processDSUpdate(inboundFieldMask);
    } catch (std::exception& e) {
      // log the exception e.what()
      std::cout << "Caught exception in processDSUpdate: " << e.what() << std::endl;
    } catch (...) {
      // log an error
      std::cout << "Caught unknown error in processDSUpdate" << std::endl;
    }
  }

  void removeIndexReconciledObj() {
    if (indexReconciledObj) {
      indexReconciledObj->setDSReconciledObj(nullptr);
    }
    indexReconciledObj = nullptr;
  }

  void writeDSChanges(DatasetAccessor* accessor) {
    if (indexReconciledObj) {
      indexReconciledObj->writeDSChanges();
    }
    directReconciledObj->writeDSChanges(accessor);
  }

  void processDSUpdate(const ObjectAccessorType& objAccessor, uint64_t fieldsChanged) {
    try {
      directReconciledObj->processDSUpdate(objAccessor, fieldsChanged);
    } catch (std::exception& e) {
      // log the exception e.what()
      std::cout << "Caught exception in processDSUpdate: " << e.what() << std::endl;
    } catch (...) {
      // log an error
      std::cout << "Caught unknown error in processDSUpdate" << std::endl;
    }

    if (indexReconciledObj) {
      try {
        indexReconciledObj->processDSUpdate(fieldsChanged);
      } catch (std::exception& e) {
        // log the exception e.what()
        std::cout << "Caught exception in processDSUpdate: " << e.what() << std::endl;
      } catch (...) {
        // log an error
        std::cout << "Caught unknown error in processDSUpdate" << std::endl;
      }
    }
  }

  [[nodiscard]] IndexReconciledTypePtr processDSDelete() {
    try {
      directReconciledObj->processDSDelete();
    } catch (std::exception& e) {
      // log the exception e.what()
      std::cout << "Caught exception in processDSDelete/destructor: " << e.what() << std::endl;
    } catch (...) {
      // log an error
      std::cout << "Caught unknown error in processDSDelete/destructor" << std::endl;
    }

    auto ret = indexReconciledObj;
    removeIndexReconciledObj();
    return ret;
  }

  void processDSMessage(int32_t messageType, int32_t timestamp, MemoryAccessor& messageData) {
    try {
      directReconciledObj->processDSMessage(messageType, timestamp, messageData);
    } catch (std::exception& e) {
      // log the exception e.what()
      std::cout << "Caught exception in processDSMessage: " << e.what() << std::endl;
    } catch (...) {
      // log an error
      std::cout << "Caught unknown error in processDSMessage" << std::endl;
    }
    if (indexReconciledObj) {
      try {
        indexReconciledObj->processDSMessage(messageType, timestamp, messageData);
      } catch (std::exception& e) {
        // log the exception e.what()
        std::cout << "Caught exception in processDSMessage: " << e.what() << std::endl;
      } catch (...) {
        // log an error
        std::cout << "Caught unknown error in processDSMessage" << std::endl;
      }
    }
  }

  void tickDS() {
    if constexpr (has_tickDS<ReconciledTypePtr>::value) {
      directReconciledObj->tickDS();
    }

    if constexpr (has_tickDS<IndexReconciledTypePtr>::value) {
      if (indexReconciledObj) {
        indexReconciledObj->tickDS();
      }
    }
  }

  int32_t reconcileID;
  ReconciledTypePtr directReconciledObj;
  IndexReconciledTypePtr indexReconciledObj;
};

template <
    typename ObjectAccessorType,
    typename ReconciledTypePtr,
    typename IndexFieldType,
    typename IndexReconciledTypePtr>
class InboundTypeReconciler : public InboundTypeReconcilerInterface {
  using CreateDelegateFunction = std::function<ReconciledTypePtr(
      const DSIdentifier&,
      const ObjectAccessorType&,
      InboundTypeReconcilerInterface*)>;

  using ReconciledEntry =
      InboundReconciledEntry<ObjectAccessorType, ReconciledTypePtr, IndexReconciledTypePtr>;
  using ReconciledEntryMap = std::unordered_map<DSIdentifier, ReconciledEntry>;
  using ReconciledEntryIter = typename ReconciledEntryMap::iterator;

  using IndexedOrphansMap = std::unordered_map<IndexFieldType, IndexReconciledTypePtr>;
  using IndexedEntryLookupMap = std::unordered_map<IndexFieldType, DSIdentifier>;

  class Iterator {
   public:
    Iterator(typename ReconciledEntryMap::iterator it) : current(it) {}

    Iterator& operator++() {
      ++current;
      return *this;
    }

    bool operator!=(const Iterator& other) const {
      return current != other.current;
    }

    const ReconciledTypePtr& operator*() const {
      return current->second.directReconciledObj;
    }

   private:
    typename ReconciledEntryMap::iterator current;
  };

 public:
  InboundTypeReconciler(
      DatasetReconciler* reconciler,
      int32_t dsType,
      uint64_t outboundFieldMask,
      uint64_t indexFieldMask)
      : InboundTypeReconcilerInterface(reconciler),
        dsType_(dsType),
        inboundFieldMask_(~outboundFieldMask),
        indexFieldMask_(indexFieldMask) {}

  void setCreateDelegate(CreateDelegateFunction createDelegate) {
    createDelegate_ = createDelegate;
  }

  virtual MemoryAccessor sendMessage(const DSIdentifier& id, int32_t messageType, int32_t numBytes)
      override final {
    return reconciler_->sendMessage(id, messageType, numBytes);
  }

  [[nodiscard]] ReconciledTypePtr getObject(const DSIdentifier& id) const {
    auto iter = reconciledEntries_.find(id);
    if (iter != reconciledEntries_.end()) {
      return iter->second.directReconciledObj;
    }
    return nullptr;
  }

  Iterator begin() {
    return Iterator(reconciledEntries_.begin());
  }

  Iterator end() {
    return Iterator(reconciledEntries_.end());
  }

  void addIndexReconciledObject(IndexFieldType indexField, IndexReconciledTypePtr iObj) {
    auto lookupIter = indexLookup_.find(indexField);
    if (lookupIter == indexLookup_.end()) {
      // no entry for this index field yet
      indexReconciledOrphans_.emplace(indexField, iObj);
    } else {
      // add to the existing entry
      auto entryIter = reconciledEntries_.find(lookupIter->second);
      assert(entryIter != reconciledEntries_.end());
      entryIter->second.setIndexReconciledObj(iObj, inboundFieldMask_);
    }
  }

  void removeIndexReconciledObject(IndexFieldType indexField) {
    // look for it in an entry
    auto lookupIter = indexLookup_.find(indexField);
    if (lookupIter != indexLookup_.end()) {
      auto entryIter = reconciledEntries_.find(lookupIter->second);
      if (entryIter != reconciledEntries_.end()) {
        entryIter->second.removeIndexReconciledObj();
      }
    }

    // look for it as an orphan
    auto orphanIter = indexReconciledOrphans_.find(indexField);
    if (orphanIter != indexReconciledOrphans_.end()) {
      indexReconciledOrphans_.erase(orphanIter);
    }
  }

 protected:
  friend class DatasetReconciler;

  ReconciledEntryMap reconciledEntries_;
  IndexedOrphansMap indexReconciledOrphans_;
  IndexedEntryLookupMap indexLookup_;
  CreateDelegateFunction createDelegate_ = nullptr;
  int32_t dsType_;
  uint64_t inboundFieldMask_;
  uint64_t indexFieldMask_;

  virtual IndexFieldType getIndexField(ReconciledTypePtr& directReconciledObj) = 0;

  virtual int32_t getType() override final {
    return dsType_;
  }

  virtual void tick() override final {
    if constexpr (has_tickDS<ReconciledTypePtr>::value) {
      for (auto iter = reconciledEntries_.begin(), last = reconciledEntries_.end(); iter != last;
           ++iter) {
        iter->second.tickDS();
      }
    }
  }

  virtual void writeChanges(DatasetAccessor* accessor, const DSIdentifier& id) override final {
    auto iter = reconciledEntries_.find(id);
    if (iter != reconciledEntries_.end()) {
      iter->second.writeDSChanges(accessor);
    }
  }

  virtual void processCreate(
      const DSIdentifier& id,
      MemoryAccessor objAccessor,
      int32_t reconcileID) override final {
    // create a new direct-reconciled object
    ReconciledTypePtr directReconciledObj;
    try {
      directReconciledObj = createDelegate_(id, ObjectAccessorType(objAccessor), this);
    } catch (std::exception& e) {
      // log the exception e.what()
      std::cout << "Caught exception in createDelegate: " << e.what() << std::endl;
    } catch (...) {
      // log an error
      std::cout << "Caught unknown error in createDelegate" << std::endl;
    }
    if (directReconciledObj.get() == nullptr) {
      return;
    }

    // add a reconciler entry
    auto entryIter =
        reconciledEntries_.emplace(id, ReconciledEntry(reconcileID, std::move(directReconciledObj)))
            .first;
    assert(entryIter != reconciledEntries_.end());

    // update the reconciled object with the inbound fields
    entryIter->second.processDSUpdate(ObjectAccessorType(objAccessor), inboundFieldMask_);

    // update the index
    if (indexFieldMask_ != 0) {
      // add a lookup from index field value to object ID, now that we have that data
      auto indexField = getIndexField(entryIter->second.directReconciledObj);
      indexLookup_.emplace(indexField, id);

      // if we already have an index-reconciled object, then move it into the entry so it receives
      // updates
      auto iter = indexReconciledOrphans_.find(indexField);
      if (iter != indexReconciledOrphans_.end()) {
        auto indexReconciledObj = iter->second;
        indexReconciledOrphans_.erase(iter);
        entryIter->second.setIndexReconciledObj(indexReconciledObj, inboundFieldMask_);
      }
    }
  }

  virtual bool processUpdate(
      const DSIdentifier& id,
      MemoryAccessor objAccessor,
      uint64_t fieldsChanged,
      int32_t reconcileID) override final {
    fieldsChanged &= inboundFieldMask_;
    if (fieldsChanged == 0) {
      // no inbound fields changed, ignore this update
      return false;
    }

    auto iter = reconciledEntries_.find(id);
    if (iter == reconciledEntries_.end()) {
      return false;
    }

    ReconciledEntry& entry = iter->second;
    if (fieldsChanged & indexFieldMask_) {
      // index field changed, not currently supported (just to make things simpler until/unless it
      // is needed)
      throw std::runtime_error("index field change not supported");
    }
    entry.processDSUpdate(ObjectAccessorType(objAccessor), fieldsChanged);
    entry.reconcileID = reconcileID;
    return true;
  }

  ReconciledEntryIter processDeleteInternal(ReconciledEntryIter iter) {
    auto indexField = getIndexField(iter->second.directReconciledObj);
    if (indexFieldMask_ != 0) {
      // remove the lookup from index field value to object ID
      auto lookupIter = indexLookup_.find(indexField);
      if (lookupIter != indexLookup_.end()) {
        indexLookup_.erase(lookupIter);
      }
    }
    auto indexReconciledObj = iter->second.processDSDelete();
    if (indexReconciledObj) {
      // put the index-reconciled object back into the orphan list
      indexReconciledOrphans_.emplace(indexField, indexReconciledObj);
    }
    return reconciledEntries_.erase(iter);
  }

  virtual void processDelete(const DSIdentifier& id) override final {
    auto iter = reconciledEntries_.find(id);
    if (iter != reconciledEntries_.end()) {
      processDeleteInternal(iter);
    }
  }

  virtual void processMessage(
      const DSIdentifier& id,
      int32_t messageType,
      int32_t timestamp,
      MemoryAccessor msgAccessor) override final {
    auto iter = reconciledEntries_.find(id);
    if (iter == reconciledEntries_.end()) {
      return;
    }
    ReconciledEntry& entry = iter->second;
    entry.processDSMessage(messageType, timestamp, msgAccessor);
  }

  virtual void processFullReconcile(
      const DSIdentifier& id,
      MemoryAccessor objAccessor,
      int32_t reconcileID) override final {
    if (!processUpdate(id, objAccessor, inboundFieldMask_, reconcileID)) {
      processCreate(id, objAccessor, reconcileID);
    }
  }

  virtual void endFullReconcile(int32_t reconcileID) override final {
    for (auto iter = reconciledEntries_.begin(), last = reconciledEntries_.end(); iter != last;) {
      if (iter->second.reconcileID != reconcileID) {
        iter = processDeleteInternal(iter);
      } else {
        ++iter;
      }
    }
  }
};

} // namespace Xrpa
