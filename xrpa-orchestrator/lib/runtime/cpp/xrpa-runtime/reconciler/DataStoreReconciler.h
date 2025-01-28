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

#include <xrpa-runtime/transport/TransportStream.h>
#include <xrpa-runtime/transport/TransportStreamAccessor.h>
#include <cassert>
#include <chrono>
#include <memory>
#include <utility>
#include <vector>

namespace Xrpa {

class IObjectCollection;

class DataStoreReconciler {
 public:
  DataStoreReconciler(
      std::weak_ptr<TransportStream> inboundTransport,
      std::weak_ptr<TransportStream> outboundTransport,
      int messageDataPoolSize);

  virtual ~DataStoreReconciler() {
    free(messageDataPool_);
  }

  void tickInbound();
  void tickOutbound();
  void shutdown();

  template <typename R>
  void setMessageLifetime(std::chrono::duration<int64_t, R> messageLifetime) {
    messageLifetime_ =
        std::chrono::duration_cast<std::chrono::microseconds>(messageLifetime).count();
  }

  MemoryAccessor
  sendMessage(const ObjectUuid& objectId, int32_t collectionId, int32_t fieldId, int32_t numBytes) {
    assert(messageDataPoolPos_ + numBytes < messageDataPoolSize_);
    uint8_t* rawMessageData = numBytes > 0 ? messageDataPool_ + messageDataPoolPos_ : nullptr;
    messageDataPoolPos_ += numBytes;

    auto messageData = MemoryAccessor(rawMessageData, 0, numBytes);
    outboundMessages_.emplace_back(objectId, collectionId, fieldId, messageData);
    return messageData;
  }

  void notifyObjectNeedsWrite(const ObjectUuid& objectId, int32_t collectionId) {
    auto curSize = pendingWrites_.size();
    if (curSize > 0) {
      auto& lastWrite = pendingWrites_[curSize - 1];
      if (lastWrite.collectionId_ == collectionId && lastWrite.objectId_ == objectId) {
        return;
      }
    }
    pendingWrites_.emplace_back(objectId, collectionId);
  }

 protected:
  void registerCollection(std::shared_ptr<IObjectCollection> collection);

 private:
  struct OutboundMessage {
    OutboundMessage(
        const ObjectUuid& objectId,
        int32_t collectionId,
        int32_t fieldId,
        MemoryAccessor messageData)
        : objectId_(objectId),
          collectionId_(collectionId),
          fieldId_(fieldId),
          messageData_(std::move(messageData)) {}

    ObjectUuid objectId_;
    int32_t collectionId_;
    int32_t fieldId_;
    MemoryAccessor messageData_;
  };

  struct PendingWrite {
    PendingWrite(const ObjectUuid& objectId, int32_t collectionId)
        : objectId_(objectId), collectionId_(collectionId) {}

    ObjectUuid objectId_;
    int32_t collectionId_;
  };

  std::weak_ptr<TransportStream> inboundTransport_;
  std::weak_ptr<TransportStream> outboundTransport_;

  // message stuff
  std::vector<OutboundMessage> outboundMessages_;
  uint8_t* messageDataPool_ = nullptr;
  int32_t messageDataPoolSize_ = 0;
  int32_t messageDataPoolPos_ = 0;
  int32_t messageLifetime_{};

  // collections
  std::unordered_map<int32_t, std::shared_ptr<IObjectCollection>> collections_;
  std::vector<PendingWrite> pendingWrites_;
  bool pendingOutboundFullUpdate_ = true;
  bool requestInboundFullUpdate_ = false;
  bool waitingForInboundFullUpdate_ = false;
  std::unique_ptr<TransportStreamIterator> inboundTransportIterator_;

  void reconcileInboundChanges(TransportStreamAccessor* accessor);
  void reconcileOutboundChanges(TransportStreamAccessor* accessor);
  void sendFullUpdate();
};

} // namespace Xrpa
