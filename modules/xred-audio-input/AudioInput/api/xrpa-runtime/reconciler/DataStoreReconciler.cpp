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

#include <xrpa-runtime/reconciler/DataStoreReconciler.h>

#include <xrpa-runtime/reconciler/CollectionChangeTypes.h>
#include <xrpa-runtime/reconciler/DataStoreInterfaces.h>
#include <algorithm>
#include <unordered_set>

using namespace std::chrono_literals;

namespace Xrpa {

DataStoreReconciler::DataStoreReconciler(
    std::weak_ptr<TransportStream> inboundTransport,
    std::weak_ptr<TransportStream> outboundTransport,
    int messageDataPoolSize)
    : inboundTransport_(inboundTransport), outboundTransport_(outboundTransport) {
  setMessageLifetime(5s);

  if (messageDataPoolSize > 0) {
    outboundMessages_ =
        static_cast<PlacedRingBuffer*>(malloc(PlacedRingBuffer::getMemSize(messageDataPoolSize)));
    outboundMessages_->init(messageDataPoolSize);
    outboundMessagesIterator_.setToEnd(outboundMessages_);
  }

  inboundTransportIterator_ = inboundTransport_.lock()->createIterator();
}

MemoryAccessor DataStoreReconciler::sendMessage(
    const ObjectUuid& objectId,
    int32_t collectionId,
    int32_t fieldId,
    int32_t numBytes) {
  auto message = CollectionMessageChangeEventAccessor(
      outboundMessages_->push(CollectionMessageChangeEventAccessor::DS_SIZE + numBytes, nullptr));
  message.setChangeType(CollectionChangeType::Message);
  message.setObjectId(objectId);
  message.setCollectionId(collectionId);
  message.setFieldId(fieldId);
  return message.accessChangeData();
}

void DataStoreReconciler::registerCollection(std::shared_ptr<IObjectCollection> collection) {
  auto collectionId = collection->getId();
  collections_.try_emplace(collectionId, std::move(collection));
}

void DataStoreReconciler::tickInbound() {
  auto inboundTransport = inboundTransport_.lock();
  if (!inboundTransport) {
    return;
  }

  // non-blocking check for inbound changes
  if (!inboundTransportIterator_->needsProcessing()) {
    return;
  }

  // acquire lock
  auto didLock = inboundTransport->transact(
      1ms, [&](TransportStreamAccessor* accessor) { reconcileInboundChanges(accessor); });

  if (!didLock) {
    // TODO raise a warning about this, the expiry time for the transact call may need adjusting
    return;
  }
}

void DataStoreReconciler::tickOutbound() {
  auto outboundTransport = outboundTransport_.lock();
  if (!outboundTransport) {
    return;
  }

  for (auto& iter : collections_) {
    iter.second->tick();
  }

  bool bHasOutboundMessages =
      outboundMessages_ != nullptr && outboundMessagesIterator_.hasNext(outboundMessages_);
  bool bHasOutboundChanges =
      requestInboundFullUpdate_ || pendingOutboundFullUpdate_ || !pendingWrites_.empty();

  if (!bHasOutboundChanges && !bHasOutboundMessages) {
    return;
  }

  // acquire lock
  auto didLock = outboundTransport->transact(
      1ms, [&](TransportStreamAccessor* accessor) { reconcileOutboundChanges(accessor); });

  if (!didLock) {
    // TODO raise a warning about this, the expiry time for the transact call may need adjusting
    return;
  }
}

void DataStoreReconciler::shutdown() {
  auto outboundTransport = outboundTransport_.lock();
  if (!outboundTransport) {
    return;
  }

  // acquire lock
  outboundTransport->transact(1ms, [&](TransportStreamAccessor* accessor) {
    accessor->writeChangeEvent(CollectionChangeType::Shutdown);
  });

  inboundTransport_.reset();
  outboundTransport_.reset();
}

void DataStoreReconciler::reconcileOutboundChanges(TransportStreamAccessor* accessor) {
  if (requestInboundFullUpdate_) {
    accessor->writeChangeEvent(CollectionChangeType::RequestFullUpdate);
    requestInboundFullUpdate_ = false;
  }

  if (pendingOutboundFullUpdate_) {
    accessor->writeChangeEvent(CollectionChangeType::FullUpdate);
    pendingOutboundFullUpdate_ = false;
  }

  // write changes
  for (auto& pendingWrite : pendingWrites_) {
    if (auto iter = collections_.find(pendingWrite.collectionId_); iter != collections_.end()) {
      iter->second->writeChanges(accessor, pendingWrite.objectId_);
    }
  }
  pendingWrites_.clear();

  // write messages
  if (outboundMessages_ != nullptr) {
    while (outboundMessagesIterator_.hasNext(outboundMessages_)) {
      auto message = outboundMessagesIterator_.next(outboundMessages_);
      accessor->writePrefilledChangeEvent(message);
    }
  }
}

void DataStoreReconciler::sendFullUpdate() {
  pendingOutboundFullUpdate_ = true;

  // sort by timestamp so that we can send the full update in creation order
  std::vector<FullUpdateEntry> entries;
  for (auto& iter : collections_) {
    iter.second->prepFullUpdate(entries);
  }
  std::sort(
      entries.begin(), entries.end(), [](auto& a, auto& b) { return a.timestamp_ < b.timestamp_; });

  pendingWrites_.clear();
  for (auto& entry : entries) {
    pendingWrites_.emplace_back(entry.objectId_, entry.collectionId_);
  }
}

void DataStoreReconciler::reconcileInboundChanges(TransportStreamAccessor* accessor) {
  if (inboundTransportIterator_->hasMissedEntries(accessor)) {
    // More changes came in between tick() calls than the changelog can hold.
    // Send message to outbound dataset to reconcile the entire dataset, then make sure to
    // wait for the FullUpdate message.
    requestInboundFullUpdate_ = true;
    waitingForInboundFullUpdate_ = true;
    return;
  }

  uint64_t oldestMessageTimestamp = getCurrentClockTimeMicroseconds() - messageLifetimeUs_;
  uint64_t baseTimestamp = accessor->getBaseTimestamp();
  bool inFullUpdate = false;
  std::unordered_set<ObjectUuid> reconciledIds;

  while (true) {
    auto entryMem = inboundTransportIterator_->getNextEntry(accessor);
    if (entryMem.isNull()) {
      break;
    }

    auto changeType = ChangeEventAccessor(entryMem).getChangeType();

    // handle RequestFullUpdate by queueing up a full update for the next outbound tick
    if (changeType == CollectionChangeType::RequestFullUpdate) {
      sendFullUpdate();
      continue;
    }

    if (waitingForInboundFullUpdate_ && changeType != CollectionChangeType::FullUpdate) {
      // skip all changes until we see the FullUpdate marker
      continue;
    }

    switch (changeType) {
      case CollectionChangeType::FullUpdate: {
        requestInboundFullUpdate_ = false;
        waitingForInboundFullUpdate_ = false;
        inFullUpdate = true;
        break;
      }

      case CollectionChangeType::Shutdown: {
        for (auto& iter : collections_) {
          iter.second->processShutdown();
        }
        break;
      }

      case CollectionChangeType::CreateObject: {
        auto entry = CollectionChangeEventAccessor(entryMem);
        auto id = entry.getObjectId();
        auto collectionId = entry.getCollectionId();
        if (auto iter = collections_.find(collectionId); iter != collections_.end()) {
          if (inFullUpdate) {
            iter->second->processUpsert(id, entry.accessChangeData());
            reconciledIds.emplace(id);
          } else {
            iter->second->processCreate(id, entry.accessChangeData());
          }
        }
        break;
      }

      case CollectionChangeType::UpdateObject: {
        auto entry = CollectionUpdateChangeEventAccessor(entryMem);
        auto id = entry.getObjectId();
        auto collectionId = entry.getCollectionId();
        if (auto iter = collections_.find(collectionId); iter != collections_.end()) {
          iter->second->processUpdate(id, entry.accessChangeData(), entry.getFieldsChanged());
        }
        break;
      }

      case CollectionChangeType::DeleteObject: {
        auto entry = CollectionChangeEventAccessor(entryMem);
        auto id = entry.getObjectId();
        auto collectionId = entry.getCollectionId();
        if (auto iter = collections_.find(collectionId); iter != collections_.end()) {
          iter->second->processDelete(id);
        }
        break;
      }

      case CollectionChangeType::Message: {
        auto entry = CollectionMessageChangeEventAccessor(entryMem);
        uint64_t timestamp = entry.getTimestamp(baseTimestamp);
        if (timestamp >= oldestMessageTimestamp) {
          auto collectionId = entry.getCollectionId();
          if (auto iter = collections_.find(collectionId); iter != collections_.end()) {
            iter->second->processMessage(
                entry.getObjectId(), entry.getFieldId(), timestamp, entry.accessChangeData());
          }
        }
      }
    }
  }

  if (inFullUpdate) {
    // delete all unreconciled objects
    for (auto& iter : collections_) {
      iter.second->processFullReconcile(reconciledIds);
    }
  }
}

} // namespace Xrpa
