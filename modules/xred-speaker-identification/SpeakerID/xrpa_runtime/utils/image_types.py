# Copyright (c) Meta Platforms, Inc. and affiliates.
# @generated
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

import dataclasses
import enum


class ImageFormat(enum.Enum):
    RGB8 = 0
    BGR8 = 1
    RGBA8 = 2
    Y8 = 3


class ImageEncoding(enum.Enum):
    Raw = 0
    Jpeg = 1


class ImageOrientation(enum.Enum):
    Oriented = 0
    RotatedCW = 1
    RotatedCCW = 2
    Rotated180 = 3


@dataclasses.dataclass
class Image:
    # Image width
    width: int

    # Image height
    height: int
    format: ImageFormat
    encoding: ImageEncoding
    orientation: ImageOrientation

    # Image gain
    gain: float

    # Image exposure duration, if available
    exposure_duration: int

    # Capture timestamp, if available
    timestamp: int

    # Capture frame rate, if available
    capture_frame_rate: float

    # Image data
    data: bytearray
