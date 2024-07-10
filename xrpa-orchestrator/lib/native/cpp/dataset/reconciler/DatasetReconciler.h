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
#include <dataset/utils/PlacedRingBuffer.h>
#include <chrono>
#include <memory>
#include <vector>

namespace Xrpa {

class CollectionInterface;

class DatasetReconciler {
 public:
  DatasetReconciler(
      std::weak_ptr<DatasetInterface> dataset,
      const DSHashValue& schemaHash,
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

  void setDirty(const DSIdentifier& id, int32_t collectionId) {
    auto curSize = pendingWrites_.size();
    if (curSize > 0) {
      auto& lastWrite = pendingWrites_[curSize - 1];
      if (lastWrite.collectionId_ == collectionId && lastWrite.id_ == id) {
        return;
      }
    }
    pendingWrites_.emplace_back(id, collectionId);
  }

 protected:
  void registerCollection(std::shared_ptr<CollectionInterface> collection);

 private:
  struct OutboundMessage {
    OutboundMessage(const DSIdentifier& id, int32_t messageType, MemoryAccessor messageData)
        : id_(id), messageType_(messageType), messageData_(messageData) {}

    DSIdentifier id_;
    int32_t messageType_;
    MemoryAccessor messageData_;
  };

  struct PendingWrite {
    PendingWrite(const DSIdentifier& id, int32_t collectionId)
        : id_(id), collectionId_(collectionId) {}

    DSIdentifier id_;
    int32_t collectionId_;
  };

  std::weak_ptr<DatasetInterface> dataset_;

  // message stuff
  std::vector<OutboundMessage> outboundMessages_;
  uint8_t* messageDataPool_ = nullptr;
  int32_t messageDataPoolSize_ = 0;
  int32_t messageDataPoolPos_ = 0;
  int32_t messageLifetime_;
  PlacedRingBufferIterator messageIter_;

  // collections
  std::unordered_map<int32_t, std::shared_ptr<CollectionInterface>> collections_;
  std::vector<int32_t> pendingCollectionClears_;
  std::vector<PendingWrite> pendingWrites_;
  PlacedRingBufferIterator changelogIter_;

  void sendOutboundMessages(DatasetAccessor* accessor);
  void dispatchInboundMessages(DatasetAccessor* accessor);

  void reconcileInboundFromIndex(DatasetAccessor* accessor);
  void reconcileInboundFromChangelog(DatasetAccessor* accessor, PlacedRingBuffer* changelog);

  void reconcileOutboundChanges(DatasetAccessor* accessor);
};

} // namespace Xrpa
