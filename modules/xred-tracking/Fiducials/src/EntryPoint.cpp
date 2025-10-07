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

#include <lib/FiducialsModule.h>

#include "FiducialTracker.h"
#include "OceanSetup.h"
#include "SingleCameraQRTracker.h"
#include "TrackedFiducialReconciler.h"
#include "Usb3DCamera.h"

#include "ocean/platform/win/BitmapWindow.h"

#include <iostream>
#include <memory>

void EntryPoint(FiducialsModule* moduleData) {
  OceanSetup oceanSetup;
  TrackedFiducialReconciler reconciler(moduleData->trackingDataStore);

  std::vector<std::shared_ptr<FiducialTracker>> trackers;

  trackers.emplace_back(std::make_shared<SingleCameraQRTracker>(moduleData));

  std::cout << "Tracking fiducials" << std::endl;

  Ocean::Platform::Win::BitmapWindow* debugWindow = nullptr;
  if (moduleData->settings.showDebugWindow) {
    debugWindow =
        new Ocean::Platform::Win::BitmapWindow(GetModuleHandle(NULL), L"Fiducial Tracking");
    debugWindow->initialize();
    debugWindow->show();
    debugWindow->update();
  }

  moduleData->run(120, [&]() {
    MSG msg;
    while (PeekMessage(&msg, nullptr, 0, 0, PM_REMOVE)) {
      TranslateMessage(&msg);
      DispatchMessage(&msg);
    }

    bool hasUpdates = false;
    for (auto& tracker : trackers) {
      if (tracker->tick(debugWindow)) {
        hasUpdates = true;
      }
    }

    if (!hasUpdates) {
      return;
    }

    reconciler.reconcile([&](auto& accessor) {
      for (auto& tracker : trackers) {
        for (auto& iter : tracker->fiducials) {
          auto& name = iter.first;
          auto posePtr = accessor.get(name);
          if (posePtr == nullptr) {
            accessor.create(name, TrackingDataStore::Pose());
            posePtr = accessor.get(name);
          }
          *posePtr = iter.second;
        }
      }
    });
  });
}
