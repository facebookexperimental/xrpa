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

#include <ImageTypes.h>
#include <lib/CameraModule.h>

#include <folly/MPMCQueue.h>

#include <memory>

#include "CameraMediaManager.h"
#include "OceanSetup.h"

class CameraFeed : public CameraDataStore::ReconciledCameraFeed {
 public:
  CameraFeed(
      OceanSetup* oceanSetup,
      const Xrpa::ObjectUuid& id,
      Xrpa::IObjectCollection* collection);

  ~CameraFeed() override;

  static void registerDelegate(
      OceanSetup* oceanSetup,
      std::shared_ptr<CameraDataStore::CameraDataStore>& dataStore) {
    dataStore->CameraFeed->setCreateDelegate([&](const Xrpa::ObjectUuid& id,
                                                 CameraDataStore::CameraFeedReader,
                                                 Xrpa::IObjectCollection* collection) {
      return std::make_shared<CameraFeed>(oceanSetup, id, collection);
    });
  }

  void handleXrpaFieldsChanged(uint64_t fieldsChanged) final;

  void tick();
  void shutdown();

 private:
  OceanSetup* oceanSetup_;
  folly::MPMCQueue<ImageTypes::Image> rgbQueue_;
  ImageTypes::Image tempRgbImage_;

  CameraMediaManager::Subscription mediaSubscription_;
};
