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

#include <Windows.h>
#include <filesystem>

#include "ocean/base/Base.h"
#include "ocean/base/PluginManager.h"

#include "ocean/io/CameraCalibrationManager.h"
#include "ocean/io/Directory.h"
#include "ocean/io/File.h"

#include "ocean/media/Manager.h"
#include "ocean/media/mediafoundation/MediaFoundation.h"
#include "ocean/media/wic/WIC.h"

#pragma comment(lib, "Version.lib")

class OceanSetup {
 public:
  OceanSetup() {
    Ocean::Media::MediaFoundation::registerMediaFoundationLibrary();
    Ocean::Media::WIC::registerWICLibrary();
    Ocean::PluginManager::get().loadPlugins(
        Ocean::PluginManager::PluginType(Ocean::PluginManager::TYPE_MEDIA));

    char runningFilename[MAX_PATH] = {0};
    GetModuleFileNameA(NULL, runningFilename, MAX_PATH);
    Ocean::IO::Directory runningDir(
        std::filesystem::path(runningFilename).remove_filename().string());

    auto cameraCalibrationFile = runningDir + Ocean::IO::File("cameracalibration.occ");
    std::cout << "Searching for " << cameraCalibrationFile() << std::endl;

    if (cameraCalibrationFile.exists()) {
      Ocean::IO::CameraCalibrationManager::get().registerCalibrationFile(cameraCalibrationFile());
      std::cout << "Loaded camera calibration file." << std::endl;
    }

    std::cout << "Available media:" << std::endl;
    auto mediaList = Ocean::Media::Manager::get().selectableMedia(Ocean::Media::Medium::LIVE_VIDEO);
    for (const auto& medium : mediaList) {
      std::cout << "Found medium: " << medium.url() << std::endl;
    }
  }

  ~OceanSetup() {
    Ocean::Media::MediaFoundation::unregisterMediaFoundationLibrary();
    Ocean::Media::WIC::unregisterWICLibrary();
    Ocean::PluginManager::get().release();
  }
};
