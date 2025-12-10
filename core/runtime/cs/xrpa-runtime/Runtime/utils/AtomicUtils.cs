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

using System.Threading;

namespace Xrpa
{
    /// <summary>
    /// Atomic operations for lock-free data structures.
    ///
    /// These functions provide atomic read/write operations with proper memory ordering
    /// semantics for use in shared memory scenarios.
    ///
    /// For atomic load with acquire semantics, we use Interlocked.CompareExchange
    /// with identical values, which provides a full memory barrier and ensures the
    /// read is truly atomic. This matches the C++ pattern of using _InterlockedOr
    /// with 0 for atomic loads.
    ///
    /// For atomic store with release semantics, we use Interlocked.Exchange which
    /// provides a full memory barrier and ensures the write is truly atomic.
    /// </summary>
    public static class AtomicUtils
    {
        /// <summary>
        /// Atomic load with acquire semantics for a uint value at a reference location.
        /// Uses Interlocked.CompareExchange to ensure true atomicity and memory ordering.
        /// </summary>
        public static uint AtomicLoadAcquire(ref int location)
        {
            // CompareExchange with identical compare and exchange values performs
            // an atomic load with full memory barrier semantics
            return (uint)Interlocked.CompareExchange(ref location, 0, 0);
        }

        /// <summary>
        /// Atomic store with release semantics for a uint value at a reference location.
        /// Uses Interlocked.Exchange to ensure true atomicity and memory ordering.
        /// </summary>
        public static void AtomicStoreRelease(ref int location, uint value)
        {
            // Exchange provides atomic store with full memory barrier semantics
            Interlocked.Exchange(ref location, (int)value);
        }

        /// <summary>
        /// Atomic load with acquire semantics from a raw memory pointer.
        /// Uses Interlocked.CompareExchange to ensure true atomicity and memory ordering.
        /// </summary>
        unsafe public static uint AtomicLoadAcquire(uint* ptr)
        {
            // Cast to int* since Interlocked only works with int/long in older .NET
            int* intPtr = (int*)ptr;
            // CompareExchange with identical compare and exchange values performs
            // an atomic load with full memory barrier semantics
            return (uint)Interlocked.CompareExchange(ref *intPtr, 0, 0);
        }

        /// <summary>
        /// Atomic store with release semantics to a raw memory pointer.
        /// Uses Interlocked.Exchange to ensure true atomicity and memory ordering.
        /// </summary>
        unsafe public static void AtomicStoreRelease(uint* ptr, uint value)
        {
            // Cast to int* since Interlocked only works with int/long in older .NET
            int* intPtr = (int*)ptr;
            // Exchange provides atomic store with full memory barrier semantics
            Interlocked.Exchange(ref *intPtr, (int)value);
        }

        /// <summary>
        /// Atomic exchange operation - atomically sets the value and returns the previous value.
        /// </summary>
        public static uint AtomicExchange(ref int location, uint value)
        {
            return (uint)Interlocked.Exchange(ref location, (int)value);
        }

        /// <summary>
        /// Atomic compare-and-swap operation.
        /// Returns true if the exchange succeeded (location contained expected value).
        /// On failure, expected is updated with the actual value found.
        /// </summary>
        public static bool AtomicCompareExchange(ref int location, ref uint expected, uint desired)
        {
            int oldExpected = (int)expected;
            int actual = Interlocked.CompareExchange(ref location, (int)desired, oldExpected);

            if (actual == oldExpected)
            {
                return true;
            }
            expected = (uint)actual;
            return false;
        }
    }
}
