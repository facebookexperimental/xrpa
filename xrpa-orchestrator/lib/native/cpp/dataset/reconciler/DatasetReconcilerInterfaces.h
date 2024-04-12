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

namespace Xrpa {

class DataStoreObject : public std::enable_shared_from_this<DataStoreObject> {
 public:
  DataStoreObject(const DSIdentifier& id, int32_t type) : id_(id), type_(type) {}
  virtual ~DataStoreObject() {}

  const DSIdentifier& getDSID() const {
    return id_;
  }

  int32_t getDSType() const {
    return type_;
  }

 private:
  DSIdentifier id_;
  int32_t type_;
};

class InboundTypeReconcilerInterface {
 public:
  explicit InboundTypeReconcilerInterface(DatasetReconciler* reconciler)
      : reconciler_(reconciler) {}
  virtual ~InboundTypeReconcilerInterface() {}

  virtual MemoryAccessor
  sendMessage(const DSIdentifier& id, int32_t messageType, int32_t numBytes) = 0;

  void setDirty(const DSIdentifier& id) {
    reconciler_->setDirty(id, getType());
  }

 protected:
  friend class DatasetReconciler;
  DatasetReconciler* reconciler_;

  virtual int32_t getType() = 0;

  virtual void tick() = 0;

  virtual void writeChanges(DatasetAccessor* accessor, const DSIdentifier& id) = 0;

  virtual void
  processCreate(const DSIdentifier& id, MemoryAccessor objAccessor, int32_t reconcileID) = 0;

  virtual bool processUpdate(
      const DSIdentifier& id,
      MemoryAccessor objAccessor,
      uint64_t fieldsChanged,
      int32_t reconcileID) = 0;

  virtual void processDelete(const DSIdentifier& id) = 0;

  virtual void processMessage(
      const DSIdentifier& id,
      int32_t messageType,
      int32_t timestamp,
      MemoryAccessor msgAccessor) = 0;

  virtual void
  processFullReconcile(const DSIdentifier& id, MemoryAccessor objAccessor, int32_t reconcileID) = 0;

  virtual void endFullReconcile(int32_t reconcileID) = 0;
};

class OutboundTypeReconcilerInterface {
 public:
  explicit OutboundTypeReconcilerInterface(DatasetReconciler* reconciler)
      : reconciler_(reconciler) {}
  virtual ~OutboundTypeReconcilerInterface() {}

  virtual MemoryAccessor
  sendMessage(const DSIdentifier& id, int32_t messageType, int32_t numBytes) = 0;

  void setDirty(const DSIdentifier& id) {
    reconciler_->setDirty(id, getType());
  }

 protected:
  friend class DatasetReconciler;
  DatasetReconciler* reconciler_;

  virtual int32_t getType() = 0;

  virtual void tick() = 0;

  virtual void writeChanges(DatasetAccessor* accessor, const DSIdentifier& id) = 0;

  virtual bool
  processUpdate(const DSIdentifier& id, MemoryAccessor objAccessor, uint64_t fieldsChanged) = 0;

  virtual void processMessage(
      const DSIdentifier& id,
      int32_t messageType,
      int32_t timestamp,
      MemoryAccessor msgAccessor) = 0;
};

template <typename T, typename = std::void_t<>>
struct has_tickDS : std::false_type {};

template <typename T>
struct has_tickDS<T*, std::void_t<decltype(std::declval<T>().tickDS())>> : std::true_type {};

template <typename T>
struct has_tickDS<std::shared_ptr<T>, std::void_t<decltype(std::declval<T>().tickDS())>>
    : std::true_type {};

} // namespace Xrpa
