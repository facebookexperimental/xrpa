/*
// @generated
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

#include <xrpa-runtime/utils/ByteVector.h>
#include <chrono>

namespace Xrpa {

enum class ImageFormat : uint32_t {
  RGB8 = 0,
  BGR8 = 1,
  RGBA8 = 2,
  Y8 = 3,
};

enum class ImageEncoding : uint32_t {
  Raw = 0,
  Jpeg = 1,
};

enum class ImageOrientation : uint32_t {
  Oriented = 0,
  RotatedCW = 1,
  RotatedCCW = 2,
  Rotated180 = 3,
};

struct Image {
  int width;
  int height;

  ImageFormat format;
  ImageEncoding encoding;
  ImageOrientation orientation;

  float gain;
  std::chrono::nanoseconds exposureDuration;
  std::chrono::nanoseconds timestamp;
  float captureFrameRate;

  Xrpa::ByteVector data;
};

} // namespace Xrpa
