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

#include "ocean/base/Base.h"
#include "ocean/base/PluginManager.h"

#include "ocean/media/Manager.h"

#ifdef WIN32
#include "ocean/media/mediafoundation/MediaFoundation.h"
#include "ocean/media/wic/WIC.h"
#pragma comment(lib, "Version.lib")
#elif defined(__APPLE__)
#include "ocean/media/avfoundation/AVFoundation.h"
#include "ocean/media/imageio/ImageIO.h"
#endif

#include <vector>

class OceanSetup {
 public:
  OceanSetup() {
#ifdef WIN32
    Ocean::Media::MediaFoundation::registerMediaFoundationLibrary();
    Ocean::Media::WIC::registerWICLibrary();
#elif defined(__APPLE__)
    Ocean::Media::ImageIO::registerImageIOLibrary();
    Ocean::Media::AVFoundation::registerAVFLibrary();
#endif
    Ocean::PluginManager::get().loadPlugins(
        Ocean::PluginManager::PluginType(Ocean::PluginManager::TYPE_MEDIA));
  }

  ~OceanSetup() {
#ifdef WIN32
    Ocean::Media::MediaFoundation::unregisterMediaFoundationLibrary();
    Ocean::Media::WIC::unregisterWICLibrary();
#elif defined(__APPLE__)
    Ocean::Media::AVFoundation::unregisterAVFLibrary();
    Ocean::Media::ImageIO::unregisterImageIOLibrary();
#endif
    Ocean::PluginManager::get().release();
  }

  std::vector<Ocean::Media::Library::Definition> getMedia() {
    return Ocean::Media::Manager::get().selectableMedia(Ocean::Media::Medium::LIVE_VIDEO);
  }
};
