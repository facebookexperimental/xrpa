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

#include <functional>
#include <unordered_map>

namespace Xrpa {

template <typename KeyType, typename ReconciledType>
class SimpleReconcilerAccessor {
  template <typename KT, typename RT>
  friend class SimpleReconciler;

 public:
  explicit SimpleReconcilerAccessor(SimpleReconciler<KeyType, ReconciledType>* reconciler)
      : reconciler_(reconciler) {}

  void create(const KeyType& id, ReconciledType&& value) {
    reconciler_->onCreate(id, value);
    reconciledEntries_.emplace(id, ReconciledEntry(currentReconcileID_, std::move(value)));
  }

  ReconciledType* get(const KeyType& id) {
    auto iter = reconciledEntries_.find(id);
    if (iter == reconciledEntries_.end()) {
      return nullptr;
    }

    ReconciledEntry& entry = iter->second;
    entry.reconcileID = currentReconcileID_;
    return &entry.reconciledValue;
  }

 private:
  struct ReconciledEntry {
    ReconciledEntry(int rID, ReconciledType&& value)
        : reconcileID(rID), reconciledValue(std::move(value)) {}

    int reconcileID;
    ReconciledType reconciledValue;
  };

  void preReconcile() {
    currentReconcileID_++;
  }

  void postReconcile() {
    for (auto iter = reconciledEntries_.begin(), last = reconciledEntries_.end(); iter != last;) {
      if (iter->second.reconcileID != currentReconcileID_) {
        reconciler_->onDelete(iter->first, iter->second.reconciledValue);
        iter = reconciledEntries_.erase(iter);
      } else {
        reconciler_->onUpdate(iter->first, iter->second.reconciledValue);
        ++iter;
      }
    }

    reconciler_->onReconcileComplete();
  }

  SimpleReconciler<KeyType, ReconciledType>* reconciler_;
  std::unordered_map<KeyType, ReconciledEntry> reconciledEntries_;
  int currentReconcileID_ = 0;
};

template <typename KeyType, typename ReconciledType>
class SimpleReconciler {
 public:
  SimpleReconciler() : accessor_(this) {}

  void reconcile(
      std::function<void(SimpleReconcilerAccessor<KeyType, ReconciledType>& accessor)>
          reconcileFunc) {
    accessor_.preReconcile();
    reconcileFunc(accessor_);
    accessor_.postReconcile();
  }

 protected:
  template <typename KT, typename RT>
  friend class SimpleReconcilerAccessor;

  virtual void onCreate(const KeyType& id, ReconciledType& value) {}
  virtual void onUpdate(const KeyType& id, const ReconciledType& value) {}
  virtual void onDelete(const KeyType& id, ReconciledType& value) {}
  virtual void onReconcileComplete() {}

 private:
  SimpleReconcilerAccessor<KeyType, ReconciledType> accessor_;
};

} // namespace Xrpa
