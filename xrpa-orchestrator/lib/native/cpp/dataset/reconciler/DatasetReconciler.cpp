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

using namespace std::chrono_literals;

namespace Xrpa {

DatasetReconciler::DatasetReconciler(
    std::weak_ptr<DatasetInterface> dataset,
    const DSHashValue& schemaHash,
    int typeCount,
    int messageDataPoolSize)
    : dataset_(dataset), inboundReconcilers_(typeCount), outboundReconcilers_(typeCount) {
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
  auto nextIndex = messageQueue->getIndexForID(lastHandledMessageID_ + 1);
  for (int32_t i = nextIndex; i < messageQueue->count; ++i) {
    auto message = DSMessageAccessor(messageQueue->getAt(i));
    auto timestamp = message.getTimestamp();
    if (timestamp < oldestTimestamp) {
      continue;
    }

    auto id = message.getTargetID();
    auto type = message.getTargetType();
    auto messageType = message.getMessageType();
    auto messageData = message.accessMessageData();

    if (auto* reconcilerPtr = inboundReconcilers_[type].get()) {
      reconcilerPtr->processMessage(id, messageType, timestamp, messageData);
    }
    if (auto* reconcilerPtr = outboundReconcilers_[type].get()) {
      reconcilerPtr->processMessage(id, messageType, timestamp, messageData);
    }
  }

  lastHandledMessageID_ = messageQueue->getMaxID();
}

void DatasetReconciler::tick() {
  auto dataset = dataset_.lock();
  if (!dataset) {
    return;
  }

  for (auto& reconciler : inboundReconcilers_) {
    if (auto* reconcilerPtr = reconciler.get()) {
      reconcilerPtr->tick();
    }
  }
  for (auto& reconciler : outboundReconcilers_) {
    if (auto* reconcilerPtr = reconciler.get()) {
      reconcilerPtr->tick();
    }
  }

  bool bHasOutboundMessages = outboundMessages_.size() > 0;
  bool bHasOutboundChanges = pendingTypeClears_.size() > 0 || pendingWrites_.size() > 0;

  // non-blocking check for inbound changes
  bool bHasInboundChanges = dataset->getLastChangelogID() != lastChangelogID_;
  bool bHasInboundMessages = dataset->getLastMessageID() != lastHandledMessageID_;

  if (!bHasInboundChanges && !bHasInboundMessages && !bHasOutboundChanges &&
      !bHasOutboundMessages) {
    return;
  }

  // acquire lock
  auto didLock = dataset->acquire(1ms, [&](DatasetAccessor* accessor) {
    // process inbound changes
    auto changelog = accessor->getChangeLog();
    if (changelog->getMinID() > lastChangelogID_) {
      // more changes came in between tick() calls than the changelog can hold, so reconcile the
      // entire dataset
      // NOTE: this block also hits on the first tick
      reconcileInboundFromIndex(accessor);
    } else {
      reconcileInboundFromChangelog(accessor, changelog);
    }
    lastChangelogID_ = changelog->getMaxID();

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
    for (auto& reconciler : outboundReconcilers_) {
      if (auto* reconcilerPtr = reconciler.get()) {
        auto type = reconcilerPtr->getType();
        auto existingIDs = accessor->getAllObjectIDsByType(type);
        for (auto& id : existingIDs) {
          accessor->deleteObject(id);
        }
      }
    }
  });
}

void DatasetReconciler::reconcileOutboundChanges(DatasetAccessor* accessor) {
  for (auto type : pendingTypeClears_) {
    auto existingIDs = accessor->getAllObjectIDsByType(type);
    for (auto& id : existingIDs) {
      accessor->deleteObject(id);
    }
  }
  pendingTypeClears_.clear();

  for (auto& pendingWrite : pendingWrites_) {
    auto& id = pendingWrite.id_;
    if (auto* reconcilerPtr = inboundReconcilers_[pendingWrite.type_].get()) {
      reconcilerPtr->writeChanges(accessor, id);
    }
    if (auto* reconcilerPtr = outboundReconcilers_[pendingWrite.type_].get()) {
      reconcilerPtr->writeChanges(accessor, id);
    }
  }
  pendingWrites_.clear();
}

void DatasetReconciler::reconcileInboundFromIndex(DatasetAccessor* accessor) {
  // increment reconcileID
  ++reconcileID_;

  // sort the index by timestamp so that we can iterate over it in creation order
  auto objectIndex = accessor->getObjectIndex();
  std::vector<const DSObjectHeader*> sortedHeaderPtrs;
  for (int32_t i = 0; i < objectIndex->count; ++i) {
    sortedHeaderPtrs.push_back(&objectIndex->getAt(i));
  }

  std::sort(sortedHeaderPtrs.begin(), sortedHeaderPtrs.end(), [](auto a, auto b) {
    return a->createTimestamp < b->createTimestamp;
  });

  // sweep through the sorted index, reconciling each object and marking them with the reconcileID
  for (auto objHeader : sortedHeaderPtrs) {
    auto& id = objHeader->id;
    auto type = objHeader->type;
    auto objAccessor = accessor->getObjectFromHeader(objHeader);
    if (auto* reconcilerPtr = inboundReconcilers_[type].get()) {
      reconcilerPtr->processFullReconcile(id, objAccessor, reconcileID_);
    }
    if (auto* reconcilerPtr = outboundReconcilers_[type].get()) {
      reconcilerPtr->processUpdate(id, objAccessor, ~0ULL);
    }
  }

  // delete any reconciled value that was not marked above
  for (auto& reconciler : inboundReconcilers_) {
    if (auto* reconcilerPtr = reconciler.get()) {
      reconcilerPtr->endFullReconcile(reconcileID_);
    }
  }
}

void DatasetReconciler::reconcileInboundFromChangelog(
    DatasetAccessor* accessor,
    PlacedRingBuffer* changelog) {
  for (int32_t i = changelog->getIndexForID(lastChangelogID_) + 1; i < changelog->count; ++i) {
    auto entry = DSChangeEventAccessor(changelog->getAt(i));
    auto id = entry.getTargetID();
    auto type = entry.getTargetType();
    auto poolOffset = entry.getTargetPoolOffset();
    auto changeType = entry.getChangeType();

    switch (changeType) {
      case DSChangeType::CreateObject: {
        auto objAccessor = accessor->getObjectFromOffset(poolOffset);
        if (!objAccessor.isNull()) {
          if (auto* reconcilerPtr = inboundReconcilers_[type].get()) {
            reconcilerPtr->processCreate(id, objAccessor, reconcileID_);
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
          if (auto* reconcilerPtr = inboundReconcilers_[type].get()) {
            reconcilerPtr->processUpdate(id, objAccessor, changedFields, reconcileID_);
          }
          if (auto* reconcilerPtr = outboundReconcilers_[type].get()) {
            reconcilerPtr->processUpdate(id, objAccessor, changedFields);
          }
        }
        break;
      }

      case DSChangeType::DeleteObject: {
        if (auto* reconcilerPtr = inboundReconcilers_[type].get()) {
          reconcilerPtr->processDelete(id);
        }
        break;
      }
    }
  }
}

} // namespace Xrpa
