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

#include "ImageTypes.h"

#include <string>
#if defined(WIN32)
#include <atomic>
#include <memory>
#include <thread>
#endif

namespace Ocean::Platform::Win {
class BitmapWindow;
}

namespace Ocean::Platform::Apple::MacOS {
class FrameView;
}

namespace Ocean {
class Frame;
}

namespace ImageUtils {

class ImageDebugWindow {
 public:
  explicit ImageDebugWindow(const std::string& name);
  ~ImageDebugWindow();

  void setImage(const Ocean::Frame& imageFrame);
  void setImage(const ImageTypes::Image& image);

 private:
  std::wstring name_;
#if defined(WIN32)
  std::unique_ptr<Ocean::Platform::Win::BitmapWindow> window_;
  std::atomic<bool> isRunning_;
  std::thread thread_;
#elif defined(__APPLE__)
#ifdef __OBJC__
  std::unique_ptr<Ocean::Platform::Apple::MacOS::FrameView> window_;
#endif
#endif
};

} // namespace ImageUtils
