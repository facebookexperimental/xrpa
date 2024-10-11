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

#include "DatasetReconciler.h"

#include <xrpa-runtime/reconciler/DatasetReconcilerInterfaces.h>
#include <algorithm>
#include <chrono>
#include <stdexcept>
#include <unordered_set>

using namespace std::chrono_literals;

namespace Xrpa {

DatasetReconciler::DatasetReconciler(
    std::weak_ptr<DatasetInterface> inboundDataset,
    std::weak_ptr<DatasetInterface> outboundDataset,
    const DSHashValue& schemaHash,
    int messageDataPoolSize)
    : inboundDataset_(inboundDataset), outboundDataset_(outboundDataset) {
  auto inboundDatasetPtr = inboundDataset_.lock();
  if (inboundDatasetPtr && !inboundDatasetPtr->checkSchemaHash(schemaHash)) {
    throw std::runtime_error("Schema hash mismatch");
  }

  auto outboundDatasetPtr = outboundDataset_.lock();
  if (outboundDatasetPtr && !outboundDatasetPtr->checkSchemaHash(schemaHash)) {
    throw std::runtime_error("Schema hash mismatch");
  }

  setMessageLifetime(5s);

  messageDataPoolSize_ = messageDataPoolSize;
  if (messageDataPoolSize > 0) {
    messageDataPool_ = static_cast<uint8_t*>(malloc(messageDataPoolSize));
  }
}

void DatasetReconciler::registerCollection(std::shared_ptr<CollectionInterface> collection) {
  auto collectionId = collection->getId();
  collections_.try_emplace(collectionId, std::move(collection));
}

void DatasetReconciler::tickInbound() {
  auto inboundDataset = inboundDataset_.lock();
  if (!inboundDataset) {
    return;
  }

  // non-blocking check for inbound changes
  bool bHasInboundChanges = changelogIter_.hasNext(inboundDataset->getLastChangelogID());
  if (!bHasInboundChanges) {
    return;
  }

  // acquire lock
  auto didLock = inboundDataset->acquire(
      1ms, [&](DatasetAccessor* accessor) { reconcileInboundChanges(accessor); });

  if (!didLock) {
    // TODO raise a warning about this, the expiry time for the acquire call may need adjusting
    return;
  }
}

void DatasetReconciler::tickOutbound() {
  auto outboundDataset = outboundDataset_.lock();
  if (!outboundDataset) {
    return;
  }

  for (auto& iter : collections_) {
    iter.second->tick();
  }

  bool bHasOutboundMessages = !outboundMessages_.empty();
  bool bHasOutboundChanges =
      requestInboundFullUpdate_ || pendingOutboundFullUpdate_ || !pendingWrites_.empty();

  if (!bHasOutboundChanges && !bHasOutboundMessages) {
    return;
  }

  // acquire lock
  auto didLock = outboundDataset->acquire(
      1ms, [&](DatasetAccessor* accessor) { reconcileOutboundChanges(accessor); });

  if (!didLock) {
    // TODO raise a warning about this, the expiry time for the acquire call may need adjusting
    return;
  }
}

void DatasetReconciler::shutdown() {
  auto outboundDataset = outboundDataset_.lock();
  if (!outboundDataset) {
    return;
  }

  // acquire lock
  outboundDataset->acquire(
      1ms, [&](DatasetAccessor* accessor) { accessor->writeChangeEvent(DSChangeType::Shutdown); });
}

void DatasetReconciler::reconcileOutboundChanges(DatasetAccessor* accessor) {
  if (!accessor->isValid()) {
    return;
  }

  if (requestInboundFullUpdate_) {
    accessor->writeChangeEvent(DSChangeType::RequestFullUpdate);
    requestInboundFullUpdate_ = false;
  }

  if (pendingOutboundFullUpdate_) {
    accessor->writeChangeEvent(DSChangeType::FullUpdate);
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
  for (auto& message : outboundMessages_) {
    auto data = accessor->writeChangeEvent<DSCollectionMessageChangeEventAccessor>(
        DSChangeType::Message, message.messageData_.getSize());
    data.setCollectionId(message.collectionId_);
    data.setObjectId(message.objectId_);
    data.setFieldId(message.fieldId_);
    data.accessChangeData().copyFrom(message.messageData_);
  }
  outboundMessages_.clear();
  messageDataPoolPos_ = 0;
}

void DatasetReconciler::sendFullUpdate() {
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

void DatasetReconciler::reconcileInboundChanges(DatasetAccessor* accessor) {
  auto* changelog = accessor->getChangeLog();

  if (changelogIter_.hasMissedEntries(changelog)) {
    // More changes came in between tick() calls than the changelog can hold.
    // Send message to outbound dataset to reconcile the entire dataset, then make sure to
    // wait for the FullUpdate message.
    requestInboundFullUpdate_ = true;
    waitingForInboundFullUpdate_ = true;
    changelogIter_.setToEnd(changelog);
    return;
  }

  int32_t oldestMessageTimestamp = accessor->getCurrentTimestamp() - messageLifetime_;
  bool inFullUpdate = false;
  std::unordered_set<DSIdentifier> reconciledIds;

  while (changelogIter_.hasNext(changelog)) {
    auto entryMem = changelogIter_.next(changelog);
    auto changeType = DSChangeEventAccessor(entryMem).getChangeType();

    // handle RequestFullUpdate by queueing up a full update for the next outbound tick
    if (changeType == DSChangeType::RequestFullUpdate) {
      sendFullUpdate();
      continue;
    }

    if (waitingForInboundFullUpdate_ && changeType != DSChangeType::FullUpdate) {
      // skip all changes until we see the FullUpdate marker
      continue;
    }

    switch (changeType) {
      case DSChangeType::FullUpdate: {
        requestInboundFullUpdate_ = false;
        waitingForInboundFullUpdate_ = false;
        inFullUpdate = true;
        break;
      }

      case DSChangeType::Shutdown: {
        for (auto& iter : collections_) {
          iter.second->processShutdown();
        }
        break;
      }

      case DSChangeType::CreateObject: {
        auto entry = DSCollectionChangeEventAccessor(entryMem);
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

      case DSChangeType::UpdateObject: {
        auto entry = DSCollectionUpdateChangeEventAccessor(entryMem);
        auto id = entry.getObjectId();
        auto collectionId = entry.getCollectionId();
        if (auto iter = collections_.find(collectionId); iter != collections_.end()) {
          iter->second->processUpdate(id, entry.accessChangeData(), entry.getFieldsChanged());
        }
        break;
      }

      case DSChangeType::DeleteObject: {
        auto entry = DSCollectionChangeEventAccessor(entryMem);
        auto id = entry.getObjectId();
        auto collectionId = entry.getCollectionId();
        if (auto iter = collections_.find(collectionId); iter != collections_.end()) {
          iter->second->processDelete(id);
        }
        break;
      }

      case DSChangeType::Message: {
        auto entry = DSCollectionMessageChangeEventAccessor(entryMem);
        auto timestamp = entry.getTimestamp();
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
