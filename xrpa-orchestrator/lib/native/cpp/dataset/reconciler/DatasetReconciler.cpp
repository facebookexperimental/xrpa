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

#include <dataset/reconciler/DatasetReconcilerInterfaces.h>
#include <algorithm>
#include <chrono>
#include <stdexcept>
#include <unordered_set>

using namespace std::chrono_literals;

namespace Xrpa {

DatasetReconciler::DatasetReconciler(
    std::weak_ptr<DatasetInterface> dataset,
    const DSHashValue& schemaHash,
    int messageDataPoolSize)
    : dataset_(dataset) {
  auto datasetPtr = dataset_.lock();
  if (datasetPtr && !datasetPtr->checkSchemaHash(schemaHash)) {
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
  if (collection->isLocalOwned()) {
    pendingCollectionClears_.emplace_back(collectionId);
  }
  collections_.try_emplace(collectionId, std::move(collection));
}

void DatasetReconciler::sendOutboundMessages(DatasetAccessor* accessor) {
  if (!outboundMessages_.size()) {
    return;
  }
  if (!accessor->isValid()) {
    return;
  }

  for (auto& message : outboundMessages_) {
    accessor->sendMessage(message.id_, message.messageType_, message.messageData_.getSize())
        .copyFrom(message.messageData_);
  }
  outboundMessages_.clear();
  messageDataPoolPos_ = 0;
}

void DatasetReconciler::dispatchInboundMessages(DatasetAccessor* accessor) {
  if (!accessor->isValid()) {
    return;
  }

  int32_t oldestTimestamp = accessor->getCurrentTimestamp() - messageLifetime_;

  auto messageQueue = accessor->getMessageQueue();
  while (messageIter_.hasNext(messageQueue)) {
    auto message = DSMessageAccessor(messageIter_.next(messageQueue));
    auto timestamp = message.getTimestamp();
    if (timestamp < oldestTimestamp) {
      continue;
    }

    auto id = message.getTargetID();
    auto collectionId = message.getTargetType();
    auto messageType = message.getMessageType();
    auto messageData = message.accessMessageData();

    if (auto iter = collections_.find(collectionId); iter != collections_.end()) {
      iter->second->processMessage(id, messageType, timestamp, messageData);
    }
  }
}

void DatasetReconciler::tick() {
  auto dataset = dataset_.lock();
  if (!dataset) {
    return;
  }

  for (auto& iter : collections_) {
    iter.second->tick();
  }

  bool bHasOutboundMessages = !outboundMessages_.empty();
  bool bHasOutboundChanges = !pendingCollectionClears_.empty() || !pendingWrites_.empty();

  // non-blocking check for inbound changes
  bool bHasInboundChanges = changelogIter_.hasNext(dataset->getLastChangelogID());
  bool bHasInboundMessages = messageIter_.hasNext(dataset->getLastMessageID());

  if (!bHasInboundChanges && !bHasInboundMessages && !bHasOutboundChanges &&
      !bHasOutboundMessages) {
    return;
  }

  // acquire lock
  auto didLock = dataset->acquire(1ms, [&](DatasetAccessor* accessor) {
    // process inbound changes
    auto changelog = accessor->getChangeLog();
    if (changelogIter_.hasMissedEntries(changelog)) {
      // more changes came in between tick() calls than the changelog can hold, so reconcile the
      // entire dataset
      reconcileInboundFromIndex(accessor);
      changelogIter_.setToEnd(changelog);
    } else {
      reconcileInboundFromChangelog(accessor, changelog);
    }

    // dispatch inbound messages
    dispatchInboundMessages(accessor);

    // write outbound changes
    reconcileOutboundChanges(accessor);

    // send outbound messages last, so that any messages that may have been sent as a result of
    // reconciling don't have to wait for a full tick cycle to be written into the dataset
    sendOutboundMessages(accessor);
  });

  if (!didLock) {
    // TODO raise a warning about this, the expiry time for the acquire call may need adjusting
    return;
  }
}

void DatasetReconciler::shutdown() {
  auto dataset = dataset_.lock();
  if (!dataset) {
    return;
  }

  // acquire lock
  dataset->acquire(1ms, [&](DatasetAccessor* accessor) {
    // delete all outbound objects from the dataset
    for (auto& iter : collections_) {
      if (iter.second->isLocalOwned()) {
        auto collectionId = iter.second->getId();
        accessor->deleteAllByType(collectionId);
      }
    }
  });
}

void DatasetReconciler::reconcileOutboundChanges(DatasetAccessor* accessor) {
  for (auto collectionId : pendingCollectionClears_) {
    accessor->deleteAllByType(collectionId);
  }
  pendingCollectionClears_.clear();

  for (auto& pendingWrite : pendingWrites_) {
    if (auto iter = collections_.find(pendingWrite.collectionId_); iter != collections_.end()) {
      iter->second->writeChanges(accessor, pendingWrite.id_);
    }
  }
  pendingWrites_.clear();
}

void DatasetReconciler::reconcileInboundFromIndex(DatasetAccessor* accessor) {
  // sort the index by timestamp so that we can iterate over it in creation order
  auto objectIndex = accessor->getObjectIndex();
  std::vector<const DSObjectHeader*> sortedHeaderPtrs;
  for (int32_t i = 0; i < objectIndex->count; ++i) {
    sortedHeaderPtrs.push_back(&objectIndex->getAt(i));
  }

  std::sort(sortedHeaderPtrs.begin(), sortedHeaderPtrs.end(), [](auto a, auto b) {
    return a->createTimestamp < b->createTimestamp;
  });

  // sweep through the sorted index, reconciling each object and keeping track of the IDs
  std::unordered_set<DSIdentifier> reconciledIds;
  for (auto objHeader : sortedHeaderPtrs) {
    auto& id = objHeader->id;
    auto collectionId = objHeader->type;
    auto objAccessor = accessor->getObjectFromHeader(objHeader);
    if (auto iter = collections_.find(collectionId); iter != collections_.end()) {
      iter->second->processUpsert(id, objAccessor);
      reconciledIds.emplace(id);
    }
  }

  // delete all unreconciled objects
  for (auto& iter : collections_) {
    iter.second->processFullReconcile(reconciledIds);
  }
}

void DatasetReconciler::reconcileInboundFromChangelog(
    DatasetAccessor* accessor,
    PlacedRingBuffer* changelog) {
  while (changelogIter_.hasNext(changelog)) {
    auto entry = DSChangeEventAccessor(changelogIter_.next(changelog));
    auto id = entry.getTargetID();
    auto collectionId = entry.getTargetType();
    auto poolOffset = entry.getTargetPoolOffset();
    auto changeType = entry.getChangeType();

    switch (changeType) {
      case DSChangeType::CreateObject: {
        auto objAccessor = accessor->getObjectFromOffset(poolOffset);
        if (!objAccessor.isNull()) {
          if (auto iter = collections_.find(collectionId); iter != collections_.end()) {
            iter->second->processCreate(id, objAccessor);
          }
        }
        break;
      }

      case DSChangeType::UpdateObject: {
        // TODO collapse multiple updates to same object? they can be squashed by combining field
        // flags, but intervening deletes/creates need to be taken into account as well

        auto changedFields = entry.getChangedFields();
        auto objAccessor = accessor->getObjectFromOffset(poolOffset);
        if (!objAccessor.isNull()) {
          if (auto iter = collections_.find(collectionId); iter != collections_.end()) {
            iter->second->processUpdate(id, objAccessor, changedFields);
          }
        }
        break;
      }

      case DSChangeType::DeleteObject: {
        if (auto iter = collections_.find(collectionId); iter != collections_.end()) {
          iter->second->processDelete(id);
        }
        break;
      }
    }
  }
}

} // namespace Xrpa
