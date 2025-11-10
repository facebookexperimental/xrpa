# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import io
import logging
from typing import Optional

from PIL import Image as PilImage, ImageFile

from .image_types import Image, ImageEncoding, ImageFormat, ImageOrientation

# Allow PIL to load truncated/incomplete JPEG images instead of raising an error.
# This handles cases where JPEG encoding produces slightly malformed but still
# valid images that can be decoded successfully.
ImageFile.LOAD_TRUNCATED_IMAGES = True

logger = logging.getLogger(__name__)


def _decode_jpeg_to_pil(xrpa_image: Image, out_format: str):
    try:
        img = PilImage.open(io.BytesIO(xrpa_image.data))
        img.load()  # Force immediate decoding to prevent lazy-loading race conditions
        return img.convert(out_format)
    except Exception as e:
        logger.error(f"Failed to open JPEG image: {e}")
        return None


def _decode_raw_to_pil(xrpa_image: Image, out_format: str):
    if not (xrpa_image.width and xrpa_image.height):
        return None

    width, height, data = xrpa_image.width, xrpa_image.height, xrpa_image.data
    format = xrpa_image.format

    try:
        if format == ImageFormat.RGB8:
            return PilImage.frombytes("RGB", (width, height), data).convert(out_format)
        elif format == ImageFormat.BGR8:
            rgb_data = bytearray(data)
            for i in range(0, len(rgb_data), 3):
                rgb_data[i], rgb_data[i + 2] = rgb_data[i + 2], rgb_data[i]
            return PilImage.frombytes("RGB", (width, height), bytes(rgb_data)).convert(
                out_format
            )
        elif format == ImageFormat.RGBA8:
            return PilImage.frombytes("RGBA", (width, height), data).convert(out_format)
        elif format == ImageFormat.Y8:
            return PilImage.frombytes("L", (width, height), data).convert(out_format)
        else:
            return PilImage.frombytes("RGB", (width, height), data).convert(out_format)
    except Exception as e:
        logger.error(f"Failed to create PIL image from raw data (format={format}): {e}")
        return None


def convert_to_pil(
    xrpa_image: Optional[Image], out_format="RGBA"
) -> Optional[PilImage.Image]:
    if xrpa_image is None:
        return None

    pil_image = None
    if xrpa_image.encoding == ImageEncoding.Jpeg:
        pil_image = _decode_jpeg_to_pil(xrpa_image, out_format)
    else:
        pil_image = _decode_raw_to_pil(xrpa_image, out_format)

    if pil_image is None:
        return None

    # Rotate the image to the correct orientation
    if xrpa_image.orientation == ImageOrientation.RotatedCW:
        pil_image = pil_image.rotate(-90, expand=True)
    elif xrpa_image.orientation == ImageOrientation.RotatedCCW:
        pil_image = pil_image.rotate(90, expand=True)
    elif xrpa_image.orientation == ImageOrientation.Rotated180:
        pil_image = pil_image.rotate(180, expand=True)

    return pil_image
