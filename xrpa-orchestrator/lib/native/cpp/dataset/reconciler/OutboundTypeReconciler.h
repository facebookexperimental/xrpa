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
#include <iostream>
#include <memory>
#include <unordered_map>
#include <vector>

namespace Xrpa {

template <typename ObjectAccessorType, typename ReconciledTypePtr>
class OutboundTypeReconciler final : public OutboundTypeReconcilerInterface {
 public:
  explicit OutboundTypeReconciler(
      DatasetReconciler* reconciler,
      int32_t dsType,
      uint64_t inboundFieldMask)
      : OutboundTypeReconcilerInterface(reconciler),
        dsType_(dsType),
        inboundFieldMask_(inboundFieldMask) {}

  void addObject(ReconciledTypePtr obj) {
    objects_.emplace(obj->getDSID(), obj);
    obj->setDSReconciler(this);
    setDirty(obj->getDSID());
  }

  [[nodiscard]] ReconciledTypePtr getObject(const DSIdentifier& id) const {
    auto iter = objects_.find(id);
    if (iter != objects_.end()) {
      return iter->second;
    }
    return nullptr;
  }

  void removeObject(const DSIdentifier& id) {
    auto iter = objects_.find(id);
    if (iter != objects_.end()) {
      objects_.erase(iter);
      setDirty(id);
    }
  }

  virtual MemoryAccessor sendMessage(const DSIdentifier& id, int32_t messageType, int32_t numBytes)
      override final {
    return reconciler_->sendMessage(id, messageType, numBytes);
  }

 protected:
  std::unordered_map<DSIdentifier, ReconciledTypePtr> objects_;
  int32_t dsType_;
  uint64_t inboundFieldMask_;

  virtual int32_t getType() override final {
    return dsType_;
  }

  virtual void tick() override final {
    if constexpr (has_tickDS<ReconciledTypePtr>::value) {
      for (auto iter = objects_.begin(), last = objects_.end(); iter != last; ++iter) {
        iter->second->tickDS();
      }
    }
  }

  virtual void writeChanges(DatasetAccessor* accessor, const DSIdentifier& id) override final {
    auto iter = objects_.find(id);
    if (iter == objects_.end()) {
      accessor->deleteObject(id);
    } else {
      iter->second->writeDSChanges(accessor);
    }
  }

  virtual bool processUpdate(
      const DSIdentifier& id,
      MemoryAccessor objAccessor,
      uint64_t fieldsChanged) override final {
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
      iter->second->processDSUpdate(ObjectAccessorType(objAccessor), fieldsChanged);
    } catch (std::exception& e) {
      // log the exception e.what()
      std::cout << "Caught exception in processDSUpdate: " << e.what() << std::endl;
    } catch (...) {
      // log an error
      std::cout << "Caught unknown error in processDSUpdate" << std::endl;
    }
    return true;
  }

  virtual void processMessage(
      const DSIdentifier& id,
      int32_t messageType,
      int32_t timestamp,
      MemoryAccessor msgAccessor) override final {
    auto iter = objects_.find(id);
    if (iter == objects_.end()) {
      return;
    }
    try {
      iter->second->processDSMessage(messageType, timestamp, msgAccessor);
    } catch (std::exception& e) {
      // log the exception e.what()
      std::cout << "Caught exception in onMessage: " << e.what() << std::endl;
    } catch (...) {
      // log an error
      std::cout << "Caught unknown error in onMessage" << std::endl;
    }
  }
};

} // namespace Xrpa
