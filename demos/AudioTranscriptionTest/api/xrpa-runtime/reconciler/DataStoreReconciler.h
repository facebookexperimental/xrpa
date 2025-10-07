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

#include <xrpa-runtime/transport/TransportStream.h>
#include <xrpa-runtime/transport/TransportStreamAccessor.h>
#include <xrpa-runtime/utils/PlacedRingBuffer.h>
#include <chrono>
#include <memory>
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
    free(outboundMessages_);
  }

  void tickInbound();
  void tickOutbound();
  void shutdown();

  template <typename R>
  void setMessageLifetime(std::chrono::duration<int64_t, R> messageLifetime) {
    messageLifetimeUs_ =
        std::chrono::duration_cast<std::chrono::microseconds>(messageLifetime).count();
  }

  MemoryAccessor
  sendMessage(const ObjectUuid& objectId, int32_t collectionId, int32_t fieldId, int32_t numBytes);

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
  struct PendingWrite {
    PendingWrite(const ObjectUuid& objectId, int32_t collectionId)
        : objectId_(objectId), collectionId_(collectionId) {}

    ObjectUuid objectId_;
    int32_t collectionId_;
  };

  std::weak_ptr<TransportStream> inboundTransport_;
  std::weak_ptr<TransportStream> outboundTransport_;

  // message stuff
  PlacedRingBuffer* outboundMessages_ = nullptr;
  PlacedRingBufferIterator outboundMessagesIterator_;
  uint64_t messageLifetimeUs_{};

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
