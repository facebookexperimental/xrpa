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

#include "ImageConversion.h"

#include <ocean/base/Frame.h>
#include <ocean/cv/FrameTransposer.h>
#include <ocean/io/image/Image.h>
#include "ocean/base/WorkerPool.h"

namespace ImageUtils {

Ocean::Frame convertImageToOceanFrame(const ImageTypes::Image& image) {
  auto oceanFormat = Ocean::FrameType::FORMAT_UNDEFINED;
  switch (image.format) {
    case ImageTypes::Format::RGB8:
      oceanFormat = Ocean::FrameType::FORMAT_RGB24;
      break;
    case ImageTypes::Format::BGR8:
      oceanFormat = Ocean::FrameType::FORMAT_BGR24;
      break;
    case ImageTypes::Format::RGBA8:
      oceanFormat = Ocean::FrameType::FORMAT_RGBA32;
      break;
    case ImageTypes::Format::Y8:
      oceanFormat = Ocean::FrameType::FORMAT_Y8;
      break;
  }

  Ocean::Frame imageFrame = image.encoding == ImageTypes::Encoding::Jpeg
      ? Ocean::IO::Image::decodeImage(image.data.data(), image.data.size(), "jpg")
      : Ocean::Frame(
            Ocean::FrameType(
                image.width, image.height, oceanFormat, Ocean::FrameType::ORIGIN_UPPER_LEFT),
            image.data.data(),
            Ocean::Frame::CM_USE_KEEP_LAYOUT,
            0u);

  if (image.orientation == ImageTypes::Orientation::RotatedCW) {
    Ocean::CV::FrameTransposer::Comfort::rotate90(imageFrame, false);
  } else if (image.orientation == ImageTypes::Orientation::RotatedCCW) {
    Ocean::CV::FrameTransposer::Comfort::rotate90(imageFrame, true);
  } else if (image.orientation == ImageTypes::Orientation::Rotated180) {
    Ocean::CV::FrameTransposer::Comfort::rotate180(imageFrame);
  }

  return imageFrame;
}

ImageTypes::Image convertOceanFrameToImage(const Ocean::Frame& frame, float captureFrameRate) {
  ImageTypes::Image image;
  image.width = frame.width();
  image.height = frame.height();
  image.format = ImageTypes::Format::BGR8;
  image.encoding = ImageTypes::Encoding::Jpeg;
  image.orientation = ImageTypes::Orientation::Oriented;
  image.gain = 1.0f;
  image.exposureDuration = std::chrono::nanoseconds::zero();
  image.timestamp = std::chrono::nanoseconds(frame.timestamp().nanoseconds());
  image.captureFrameRate = captureFrameRate;

  // Convert to BGR
  Ocean::Frame bgrFrame;
  Ocean::CV::FrameConverter::Comfort::convert(
      frame,
      Ocean::FrameType::FORMAT_BGR24,
      Ocean::FrameType::ORIGIN_UPPER_LEFT,
      bgrFrame,
      Ocean::CV::FrameConverter::CP_ALWAYS_COPY,
      Ocean::WorkerPool::get().scopedWorker()());

#ifdef __APPLE__
  // Use Ocean::IO::Image::Comfort API for Apple platforms
  Ocean::Media::Image::Properties properties(1.0f);
  bool encodeSuccess = Ocean::IO::Image::Comfort::encodeImage(
      bgrFrame, "jpg", image.data, true, nullptr, properties);
#else
  // Use regular Ocean::IO::Image API for Windows platforms
  bool encodeSuccess = Ocean::IO::Image::encodeImage(bgrFrame, "jpg", image.data);
#endif

  if (!encodeSuccess) {
    std::cout << "[ImageConversion] JPEG encode failed, width: " << image.width
              << ", height: " << image.height << std::endl;
  }

  return image;
}

} // namespace ImageUtils
