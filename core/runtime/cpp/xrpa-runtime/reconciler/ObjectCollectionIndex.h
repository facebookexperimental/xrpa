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

#include <unordered_map>
#include <vector>

namespace Xrpa {

template <typename ReconciledTypePtr, typename IndexFieldType>
class ObjectCollectionIndex {
 public:
  virtual ~ObjectCollectionIndex() = default;

  [[nodiscard]] const std::vector<ReconciledTypePtr>& getIndexedObjects(IndexFieldType indexValue) {
    auto iter = objectIndex_.find(indexValue);
    if (iter == objectIndex_.end()) {
      return emptyVec_;
    }
    return iter->second;
  }

  virtual void onCreate(ReconciledTypePtr obj, IndexFieldType indexValue) {
    valueMap_[obj->getXrpaId()] = indexValue;
    objectIndex_[indexValue].emplace_back(std::move(obj));
  }

  virtual void onDelete(ReconciledTypePtr obj, IndexFieldType indexValue) {
    valueMap_.erase(obj->getXrpaId());

    auto iter = objectIndex_.find(indexValue);
    if (iter != objectIndex_.end()) {
      auto& objVec = iter->second;
      objVec.erase(std::remove(objVec.begin(), objVec.end(), obj), objVec.end());
      if (objVec.empty()) {
        objectIndex_.erase(iter);
      }
    }
  }

  void onUpdate(ReconciledTypePtr obj, IndexFieldType newValue) {
    auto oldValue = valueMap_[obj->getXrpaId()];
    if (oldValue != newValue) {
      onDelete(obj, oldValue);
      onCreate(obj, newValue);
    }
  }

 protected:
  std::unordered_map<ObjectUuid, IndexFieldType> valueMap_;
  std::unordered_map<IndexFieldType, std::vector<ReconciledTypePtr>> objectIndex_;
  const std::vector<ReconciledTypePtr> emptyVec_;
};

} // namespace Xrpa
