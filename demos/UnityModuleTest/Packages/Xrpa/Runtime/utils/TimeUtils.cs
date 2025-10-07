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

    public class TimeUtils
    {
        private static long TicksPerMicrosecond = System.TimeSpan.TicksPerMillisecond / 1000;
        private static long TicksPerNanosecond = System.TimeSpan.TicksPerMillisecond / 1000000;
        private static long UnixEpochStart = (new System.DateTime(1970, 1, 1, 0, 0, 0, System.DateTimeKind.Utc)).Ticks;

        public static ulong GetCurrentClockTimeMicroseconds()
        {
            return (ulong)((System.DateTime.UtcNow.Ticks - UnixEpochStart) / TicksPerMicrosecond);
        }

        public static ulong GetCurrentClockTimeNanoseconds()
        {
            return (ulong)((System.DateTime.UtcNow.Ticks - UnixEpochStart) / TicksPerNanosecond);
        }
    }

}
