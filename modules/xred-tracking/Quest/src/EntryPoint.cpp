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

#include <OVRSession.h>
#include <lib/QuestModule.h>
#include <memory>

#include "QuestTracker.h"

static Xrpa::ObjectUuid HeadIdentifier(100, 100);

void EntryPoint(QuestModule* moduleData) {
  std::shared_ptr<OVRSession> session;
  try {
    session = std::make_shared<OVRSession>();
  } catch (std::exception& e) {
    std::cout << "Failed to create OVRSession: " << e.what() << std::endl;
    return;
  }

  auto headTrackedObject =
      std::make_shared<TrackingDataStore::OutboundTrackedObject>(HeadIdentifier);
  moduleData->trackingDataStore->TrackedObject->addObject(headTrackedObject);
  auto questTracker = std::make_unique<QuestTracker<TrackingDataStore::OutboundTrackedObject>>(
      session, headTrackedObject);
  moduleData->run(60, [&]() { questTracker->pollHmd(); });
}
