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

#include <CLI/CLI.hpp>
#include <iostream>
#include <string>

#include "ocean/base/Frame.h"
#include "ocean/base/WorkerPool.h"
#include "ocean/cv/detector/qrcodes/QRCodeEncoder.h"
#include "ocean/cv/detector/qrcodes/Utilities.h"
#include "ocean/io/File.h"
#include "ocean/media/openimagelibraries/Image.h"

using namespace Ocean;

int main(int argc, char** argv) {
  std::string message = "XrpaQR1";
  std::string outputFilename = "./qrcode.png";
  unsigned int imageSize = 2048u;
  CV::Detector::QRCodes::QRCode::ErrorCorrectionCapacity errorCorrectionCapacity =
      CV::Detector::QRCodes::QRCode::ECC_30;

  CLI::App app{"QRGenerator"};
  app.add_option("--message", message, "Message to encode in the QR code.");
  app.add_option("--output", outputFilename, "Output filename of the generated QR code.");
  app.add_option(
      "--imageSize",
      imageSize,
      "Image size of the generated QR code. Default is 2048x2048 pixels.");
  CLI11_PARSE(app, argc, argv);

  ocean_assert(message.empty() == false);
  ocean_assert(outputFilename.empty() == false);
  ocean_assert(errorCorrectionCapacity != CV::Detector::QRCodes::QRCode::ECC_INVALID);

  CV::Detector::QRCodes::QRCode code;

  if (CV::Detector::QRCodes::QRCodeEncoder::encodeText(message, errorCorrectionCapacity, code) !=
      CV::Detector::QRCodes::QRCodeEncoder::SC_SUCCESS) {
    std::cout << "Failed to generate a QR code" << std::endl;
    return 1;
  }

  ocean_assert(code.isValid());

  const Frame frame = CV::Detector::QRCodes::Utilities::draw(
      code,
      imageSize,
      /* allowTrueMultiple */ true,
      /* border */ 4u,
      WorkerPool::get().scopedWorker()());

  ocean_assert(frame.isValid());

  if (Media::OpenImageLibraries::Image::writeImage(frame, outputFilename) == false) {
    std::cout << "Failed to save to file \'" << outputFilename << "\'" << std::endl;
  } else {
    std::cout << "Saved image of QR code to \'" << outputFilename << "\'" << std::endl;
  }
  return 0;
}
