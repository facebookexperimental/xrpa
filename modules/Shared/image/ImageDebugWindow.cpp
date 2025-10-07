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

#include "ImageDebugWindow.h"
#include "ImageConversion.h"

#include <ocean/io/image/Image.h>

#if defined(WIN32)
// BEGIN Windows specific
#include <ocean/platform/win/BitmapWindow.h>
#include <windows.h>
// END Windows specific
#elif defined(__APPLE__)
// BEGIN macOS specific
#ifdef __OBJC__
#import <AppKit/AppKit.h>
#include <ocean/platform/apple/macos/FrameView.h>
#include <ocean/platform/apple/macos/MacOS.h>
#endif
// END macOS specific
#endif

namespace ImageUtils {

ImageDebugWindow::ImageDebugWindow(const std::string& name) : name_(name.begin(), name.end()) {
#if defined(WIN32)
  isRunning_.store(true);

  thread_ = std::thread([this]() {
    auto win = std::make_unique<Ocean::Platform::Win::BitmapWindow>(GetModuleHandle(NULL), name_);
    win->initialize();
    win->hide();
    win->update();
    window_ = std::move(win);

    MSG msg;
    while (isRunning_.load()) {
      while (PeekMessage(&msg, nullptr, 0, 0, PM_REMOVE)) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
      }
      std::this_thread::sleep_for(std::chrono::milliseconds(20));
    }
  });
#elif defined(__APPLE__)
// Create MacOS FrameView with appropriate dimensions
#ifdef __OBJC__
  auto view = std::make_unique<Ocean::Platform::Apple::MacOS::FrameView>(0, 0, 800, 600);
  window_ = std::move(view);
#endif
#endif
}

ImageDebugWindow::~ImageDebugWindow() {
#if defined(WIN32)
  isRunning_.store(false);
  thread_.join();
#endif
}

void ImageDebugWindow::setImage(const Ocean::Frame& imageFrame) {
#ifdef _WIN32
  if (window_) {
    window_->setFrame(imageFrame);
    window_->repaint();
    window_->show();
  }
#elif defined(__APPLE__)
#ifdef __OBJC__
  if (window_) {
    window_->setFrame(imageFrame);
  }
#endif
#endif
}

void ImageDebugWindow::setImage(const ImageTypes::Image& image) {
#if defined(WIN32)
  if (window_) {
    Ocean::Frame oceanFrame = convertImageToOceanFrame(image);
    window_->setFrame(oceanFrame);
    window_->repaint();
    window_->show();
  }
#elif defined(__APPLE__)
#ifdef __OBJC__
  if (window_) {
    Ocean::Frame oceanFrame = convertImageToOceanFrame(image);
    window_->setFrame(oceanFrame);
  }
#endif
#endif
}

} // namespace ImageUtils
