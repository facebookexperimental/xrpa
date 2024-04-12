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

#include <assert.h>
#include <dataset/core/DatasetInterface.h>
#include <chrono>
#include <memory>
#include <vector>

namespace Xrpa {

class InboundTypeReconcilerInterface;
class OutboundTypeReconcilerInterface;

class DatasetReconciler {
 public:
  DatasetReconciler(
      std::weak_ptr<DatasetInterface> dataset,
      const DSHashValue& schemaHash,
      int typeCount,
      int messageDataPoolSize);

  virtual ~DatasetReconciler() {
    free(messageDataPool_);
  }

  void tick();
  void shutdown();

  template <typename R>
  void setMessageLifetime(std::chrono::duration<int64_t, R> messageLifetime) {
    messageLifetime_ =
        std::chrono::duration_cast<std::chrono::microseconds>(messageLifetime).count();
  }

  MemoryAccessor sendMessage(const DSIdentifier& id, int32_t messageType, int32_t numBytes) {
    assert(messageDataPoolPos_ + numBytes < messageDataPoolSize_);
    uint8_t* rawMessageData = numBytes > 0 ? messageDataPool_ + messageDataPoolPos_ : nullptr;
    messageDataPoolPos_ += numBytes;

    auto messageData = MemoryAccessor(rawMessageData, 0, numBytes);
    outboundMessages_.emplace_back(id, messageType, messageData);
    return messageData;
  }

  template <typename MessageAccessorType>
  MessageAccessorType sendMessage(const DSIdentifier& id, int32_t messageType) {
    return MessageAccessorType(sendMessage(id, messageType, MessageAccessorType::DS_SIZE));
  }

  void setDirty(const DSIdentifier& id, int32_t type) {
    auto curSize = pendingWrites_.size();
    if (curSize > 0) {
      auto& lastWrite = pendingWrites_[curSize - 1];
      if (lastWrite.type_ == type && lastWrite.id_ == id) {
        return;
      }
    }
    pendingWrites_.emplace_back(id, type);
  }

 protected:
  void setInboundReconciler(
      int32_t type,
      std::shared_ptr<InboundTypeReconcilerInterface> reconciler) {
    inboundReconcilers_[type] = std::move(reconciler);
  }

  void setOutboundReconciler(
      int32_t type,
      std::shared_ptr<OutboundTypeReconcilerInterface> reconciler) {
    outboundReconcilers_[type] = std::move(reconciler);
    pendingTypeClears_.emplace_back(type);
  }

 private:
  struct OutboundMessage {
    OutboundMessage(const DSIdentifier& id, int32_t messageType, MemoryAccessor messageData)
        : id_(id), messageType_(messageType), messageData_(messageData) {}

    DSIdentifier id_;
    int32_t messageType_;
    MemoryAccessor messageData_;
  };

  struct PendingWrite {
    PendingWrite(const DSIdentifier& id, int32_t type) : id_(id), type_(type) {}

    DSIdentifier id_;
    int32_t type_;
  };

  std::weak_ptr<DatasetInterface> dataset_;

  // message stuff
  std::vector<OutboundMessage> outboundMessages_;
  uint8_t* messageDataPool_ = nullptr;
  int32_t messageDataPoolSize_ = 0;
  int32_t messageDataPoolPos_ = 0;
  int32_t lastHandledMessageID_ = -1;
  int32_t messageLifetime_;

  // read reconciliation
  std::vector<std::shared_ptr<InboundTypeReconcilerInterface>> inboundReconcilers_;
  int32_t lastChangelogID_ = -1;
  int32_t reconcileID_ = 0;

  // write reconciliation
  std::vector<std::shared_ptr<OutboundTypeReconcilerInterface>> outboundReconcilers_;
  std::vector<int32_t> pendingTypeClears_;
  std::vector<PendingWrite> pendingWrites_;

  void sendOutboundMessages(DatasetAccessor* accessor);
  void dispatchInboundMessages(DatasetAccessor* accessor);

  void reconcileInboundFromIndex(DatasetAccessor* accessor);
  void reconcileInboundFromChangelog(DatasetAccessor* accessor, PlacedRingBuffer* changelog);

  void reconcileOutboundChanges(DatasetAccessor* accessor);
};

} // namespace Xrpa
