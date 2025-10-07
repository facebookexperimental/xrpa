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

#include <xrpa-runtime/reconciler/DataStoreInterfaces.h>
#include <xrpa-runtime/reconciler/ObjectCollectionIndex.h>

#include <unordered_map>
#include <vector>

namespace Xrpa {

template <typename ReconciledTypePtr, typename IndexFieldType, typename LocalTypePtr>
class ObjectCollectionIndexedBinding
    : public ObjectCollectionIndex<ReconciledTypePtr, IndexFieldType> {
 public:
  ObjectCollectionIndexedBinding() = default;
  ~ObjectCollectionIndexedBinding() override = default;

  void addLocalObject(IndexFieldType indexValue, LocalTypePtr localObj) {
    // add local object to lookup
    localObjects_[indexValue].emplace_back(localObj);

    // check if there is already a reconciled object for this index value and bind to it if it
    // exists
    auto reconciledObjects = this->getIndexedObjects(indexValue);
    for (auto& reconciledObj : reconciledObjects) {
      if (localObj->addXrpaBinding(reconciledObj)) {
        auto id = reconciledObj->getXrpaId();
        boundLocalObjects_[id].emplace_back(localObj);
      }
      break;
    }
  }

  void removeLocalObject(IndexFieldType indexValue, LocalTypePtr localObj) {
    // remove local object from lookup
    auto& objVec = localObjects_[indexValue];
    objVec.erase(std::remove(objVec.begin(), objVec.end(), localObj), objVec.end());
    if (objVec.empty()) {
      localObjects_.erase(indexValue);
    }

    // unbind from reconciled object
    auto reconciledObjects = this->getIndexedObjects(indexValue);
    for (auto& reconciledObj : reconciledObjects) {
      localObj->removeXrpaBinding(reconciledObj);

      auto id = reconciledObj->getXrpaId();
      auto& boundObjVec = boundLocalObjects_[id];
      boundObjVec.erase(
          std::remove(boundObjVec.begin(), boundObjVec.end(), localObj), boundObjVec.end());
      if (boundObjVec.empty()) {
        boundLocalObjects_.erase(id);
      }
    }
  }

  void onCreate(ReconciledTypePtr reconciledObj, IndexFieldType indexValue) override {
    ObjectCollectionIndex<ReconciledTypePtr, IndexFieldType>::onCreate(reconciledObj, indexValue);

    // bind local objects to reconciled object
    auto id = reconciledObj->getXrpaId();
    auto& localObjects = localObjects_[indexValue];
    for (auto& localObj : localObjects) {
      if (localObj->addXrpaBinding(reconciledObj)) {
        boundLocalObjects_[id].emplace_back(localObj);
      }
    }
  }

  void onDelete(ReconciledTypePtr reconciledObj, IndexFieldType indexValue) override {
    auto id = reconciledObj->getXrpaId();
    ObjectCollectionIndex<ReconciledTypePtr, IndexFieldType>::onDelete(reconciledObj, indexValue);

    // unbind local objects from reconciled object
    auto vecIter = boundLocalObjects_.find(id);
    if (vecIter == boundLocalObjects_.end()) {
      return;
    }
    for (auto& localObj : vecIter->second) {
      localObj->removeXrpaBinding(reconciledObj);
    }
    boundLocalObjects_.erase(id);
  }

 private:
  std::unordered_map<IndexFieldType, std::vector<LocalTypePtr>> localObjects_;
  std::unordered_map<ObjectUuid, std::vector<LocalTypePtr>> boundLocalObjects_;
};

} // namespace Xrpa
