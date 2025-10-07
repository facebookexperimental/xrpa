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


using System;

namespace Xrpa
{

    public class XrpaUtils
    {
        public static void BoundsAssert(int accessStart, int accessSize, int minRange, int maxRange)
        {
            int accessEnd = accessStart + accessSize;
            if (accessSize < 0 || accessStart < minRange || accessEnd > maxRange)
            {
                throw new System.Exception(
                    "Memory access violation: [" + accessStart + ", " + accessEnd +
                    "] reaches outside of range [" + minRange + ", " + maxRange + "]");
            }
        }

        public static void DebugAssert(bool condition, string message = "Assertion failed")
        {
            if (!condition)
            {
                throw new System.Exception(message);
            }
        }
    }

}
