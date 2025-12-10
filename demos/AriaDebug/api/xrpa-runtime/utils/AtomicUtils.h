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

#include <cstdint>

#if defined(_MSC_VER)
#include <intrin.h>
#pragma intrinsic(_InterlockedOr)
#pragma intrinsic(_InterlockedExchange)
#pragma intrinsic(_InterlockedCompareExchange)
#endif

namespace Xrpa {

// Verify that long and int32_t have the same size for MSVC intrinsics
#if defined(_MSC_VER)
static_assert(sizeof(long) == sizeof(int32_t), "long must be 32-bit for atomic operations");
#endif

// Atomic load with acquire semantics
inline uint32_t atomicLoadAcquire(volatile const uint32_t* const ptr) {
#if defined(_MSC_VER)
  // _InterlockedOr with 0 performs an atomic read and provides full barrier semantics
  return static_cast<uint32_t>(
      _InterlockedOr(reinterpret_cast<volatile long*>(const_cast<volatile uint32_t*>(ptr)), 0));
#else
  return __atomic_load_n(const_cast<volatile uint32_t*>(ptr), __ATOMIC_ACQUIRE);
#endif
}

// Atomic store with release semantics
inline void atomicStoreRelease(volatile uint32_t* const ptr, uint32_t value) {
#if defined(_MSC_VER)
  // _InterlockedExchange provides atomic store with full barrier semantics
  _InterlockedExchange(reinterpret_cast<volatile long*>(ptr), static_cast<long>(value));
#else
  __atomic_store_n(ptr, value, __ATOMIC_RELEASE);
#endif
}

// Atomic exchange (returns old value)
inline uint32_t atomicExchange(volatile uint32_t* const ptr, uint32_t value) {
#if defined(_MSC_VER)
  return static_cast<uint32_t>(
      _InterlockedExchange(reinterpret_cast<volatile long*>(ptr), static_cast<long>(value)));
#else
  return __atomic_exchange_n(ptr, value, __ATOMIC_ACQ_REL);
#endif
}

// Atomic compare-and-swap
// Returns true if exchange succeeded (ptr contained expected value)
// On failure, expected is updated with the actual value found
inline bool
atomicCompareExchange(volatile uint32_t* const ptr, uint32_t* const expected, uint32_t desired) {
#if defined(_MSC_VER)
  uint32_t oldExpected = *expected;
  uint32_t actual = static_cast<uint32_t>(_InterlockedCompareExchange(
      reinterpret_cast<volatile long*>(ptr),
      static_cast<long>(desired),
      static_cast<long>(oldExpected)));
  if (actual == oldExpected) {
    return true;
  }
  *expected = actual;
  return false;
#else
  return __atomic_compare_exchange_n(
      ptr, expected, desired, false, __ATOMIC_ACQ_REL, __ATOMIC_ACQUIRE);
#endif
}

} // namespace Xrpa
