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


namespace Xrpa
{

    public enum ImageFormat : uint
    {
        RGB8 = 0,
        BGR8 = 1,
        RGBA8 = 2,
        Y8 = 3,
    }

    public enum ImageEncoding : uint
    {
        Raw = 0,
        Jpeg = 1,
    }

    public enum ImageOrientation : uint
    {
        Oriented = 0,
        RotatedCW = 1,
        RotatedCCW = 2,
        Rotated180 = 3,
    }

    public class Image
    {
        // Image width
        public int width;

        // Image height
        public int height;
        public ImageFormat format;
        public ImageEncoding encoding;
        public ImageOrientation orientation;

        // Image gain
        public float gain;

        // Image exposure duration, if available
        public ulong exposureDuration;

        // Capture timestamp, if available
        public ulong timestamp;

        // Capture frame rate, if available
        public float captureFrameRate;

        // Image data
        public byte[] data;
    }

}
