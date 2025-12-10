## Lock-Free SPMC Ring Buffer Implementation Plan

### Overview

This plan implements a lock-free Single Producer Multiple Consumer (SPMC) ring
buffer for Xrpa, following the specification in
`/data/sandcastle/boxes/fbsource/arvr/libraries/xred/xrpa/lock-free-spmc.md`.
The implementation will be provided for C++, C#, and Python, targeting both
Windows and macOS.

### Confirmed Design Decisions

Based on review feedback:

1. **Index handling**: Monotonically increasing 32-bit indexes - safe for "less
   than" comparisons
2. **Block header content**: Total byte size stored in first block header
   (needed for MemoryAccessor range checking)
3. **Skipped block marker**: Value of 0 indicates skipped block (uint32, no
   negative values)
4. **Stale read contract**: Readers may read stale data; validation happens
   after read - this is acceptable
5. **Python atomics**: Create a C extension for true atomic operations on raw
   memory
6. **Constructor consistency**: All languages take MemoryAccessor + offset
   (matching existing PlacedRingBuffer pattern)

---

## Memory Layout

```
Offset  | Size | Field
--------|------|------------------
0       | 4    | poolSize (total memory after header)
4       | 4    | blockSize (aligned size of each block, includes 4-byte header)
8       | 4    | blockCount (number of blocks)
12      | 4    | (padding/reserved)
16      | 4    | writeIndex (atomic uint32, monotonically increasing)
20      | 4    | minReadIndex (atomic uint32, minimum valid read index)
24      | ...  | Block pool starts here

Block Layout:
Offset  | Size | Field
--------|------|------------------
0       | 4    | dataSize (0 = skipped block, >0 = total data size in bytes)
4       | ...  | data (up to blockSize - 4 bytes per block)
```

**Multi-block entries:**

- First block header contains total data size across all blocks
- Subsequent blocks have NO header (data is contiguous across blocks)
- If entry would wrap, remaining blocks at end are marked as skipped (size=0)
  and entry starts at block 0

---

## Phase 1: C++ Implementation

### Phase 1.1: Atomic Helpers (C++)

**File**:
`/data/sandcastle/boxes/fbsource/arvr/libraries/xred/xrpa/core/runtime/cpp/xrpa-runtime/utils/AtomicUtils.h`

Create platform-agnostic atomic helpers for 32-bit unsigned integers:

```cpp
#pragma once

#include <cstdint>

#if defined(_MSC_VER)
#include <intrin.h>
#pragma intrinsic(_InterlockedExchange)
#pragma intrinsic(_InterlockedCompareExchange)
#else
// GCC/Clang built-ins available
#endif

namespace Xrpa {

// Atomic load with acquire semantics
inline uint32_t atomicLoadAcquire(volatile uint32_t* ptr);

// Atomic store with release semantics
inline void atomicStoreRelease(volatile uint32_t* ptr, uint32_t value);

// Atomic exchange (returns old value)
inline uint32_t atomicExchange(volatile uint32_t* ptr, uint32_t value);

// Atomic compare-and-swap (returns true if successful, updates expected on failure)
inline bool atomicCompareExchange(volatile uint32_t* ptr, uint32_t* expected, uint32_t desired);

} // namespace Xrpa
```

**Platform implementations:**

- **Windows (MSVC)**: `_InterlockedExchange`, `_InterlockedCompareExchange`,
  `_ReadBarrier()`, `_WriteBarrier()`
- **macOS/GCC/Clang**: `__atomic_load_n`, `__atomic_store_n`,
  `__atomic_exchange_n`, `__atomic_compare_exchange_n` with appropriate memory
  orderings

### Phase 1.2: SPMC Ring Buffer (C++)

**File**:
`/data/sandcastle/boxes/fbsource/arvr/libraries/xred/xrpa/core/runtime/cpp/xrpa-runtime/utils/SpmcRingBuffer.h`

```cpp
namespace Xrpa {

#define SPMC_ALIGN(x) (((x) + 3) & ~3)

class SpmcRingBuffer {
 public:
  static constexpr int32_t BLOCK_HEADER_SIZE = 4;
  static constexpr int32_t HEADER_SIZE = 24;

  SpmcRingBuffer() = default;

  // Constructor takes MemoryAccessor + offset (matches C#/Python pattern)
  SpmcRingBuffer(const MemoryAccessor& memSource, int32_t memOffset);

  static int32_t getMemSize(int32_t blockSize, int32_t blockCount);
  void init(int32_t blockSizeIn, int32_t blockCountIn);

  [[nodiscard]] bool isNull() const;
  [[nodiscard]] int32_t getBlockSize() const;
  [[nodiscard]] int32_t getBlockCount() const;
  [[nodiscard]] int32_t getMaxDataSize() const; // Max single entry size

  // Producer: write data to the ring buffer
  // Returns true if write succeeded, calls callback with MemoryAccessor for writing
  bool write(int32_t dataSize, const std::function<void(MemoryAccessor)>& callback);

 private:
  friend class SpmcRingBufferIterator;

  MemoryAccessor memSource_;      // Original memory accessor
  MemoryAccessor headerAccessor_; // Slice for header (24 bytes)
  MemoryAccessor poolAccessor_;   // Slice for block pool

  // Cached header values (read on construction/init)
  int32_t blockSize_ = 0;
  int32_t blockCount_ = 0;

  int32_t getBlockOffset(uint32_t blockIndex) const;
  int32_t getBlocksNeeded(int32_t dataSize) const;

  // Atomic accessors (via raw pointer into header memory)
  volatile uint32_t* getWriteIndexPtr();
  volatile uint32_t* getMinReadIndexPtr();
  uint32_t loadWriteIndex() const;
  uint32_t loadMinReadIndex() const;
  void storeWriteIndex(uint32_t value);
  void storeMinReadIndex(uint32_t value);

  void setBlockDataSize(int32_t blockOffset, uint32_t dataSize);
  uint32_t getBlockDataSize(int32_t blockOffset) const;
};

class SpmcRingBufferIterator {
 public:
  // Check if entries were missed (overwritten before reading)
  [[nodiscard]] bool hasMissedEntries(const SpmcRingBuffer* ringBuffer) const;

  // Check if there are unread entries
  [[nodiscard]] bool hasNext(const SpmcRingBuffer* ringBuffer) const;

  // Read next entry; callback receives MemoryAccessor
  // Returns false if data was overwritten during read (stale read)
  bool readNext(SpmcRingBuffer* ringBuffer, const std::function<void(MemoryAccessor)>& callback);

  // Skip to current write position
  void setToEnd(const SpmcRingBuffer* ringBuffer);

 private:
  uint32_t localReadIndex_ = 0;

  // Find next valid block index (skipping size=0 blocks)
  uint32_t skipToValidBlock(const SpmcRingBuffer* ringBuffer, uint32_t startIndex) const;
};

} // namespace Xrpa
```

**Key changes from original plan:**

- Constructor signature:
  `SpmcRingBuffer(const MemoryAccessor& memSource, int32_t memOffset)`
- Stores `memSource_`, `headerAccessor_`, and `poolAccessor_` as
  `MemoryAccessor` members
- Uses `MemoryAccessor::slice()` for creating sub-accessors
- Atomic operations use raw pointer access via `headerAccessor_.getRawPointer()`

This matches the existing pattern from `PlacedRingBuffer` in Python/C#:

```cpp
// C++ (new - matches Python/C#)
SpmcRingBuffer(const MemoryAccessor& memSource, int32_t memOffset);

// Python (existing pattern)
def __init__(self, mem_source: MemoryAccessor, mem_offset: int):

// C# (existing pattern)
public PlacedRingBuffer(MemoryAccessor memSource, long memOffset)
```

### Phase 1.3: C++ Unit Tests

**File**:
`/data/sandcastle/boxes/fbsource/arvr/libraries/xred/xrpa/core/runtime/cpp/test/utils/SpmcRingBufferTest.cpp`

Test cases:

1. `TEST(SpmcRingBuffer, Initialization)` - Verify header fields after init
2. `TEST(SpmcRingBuffer, SingleWriteRead)` - Basic write/read cycle with
   callback
3. `TEST(SpmcRingBuffer, MultiBlockEntry)` - Entry spanning multiple blocks
4. `TEST(SpmcRingBuffer, Wraparound)` - Entry causing wrap with skipped blocks
5. `TEST(SpmcRingBuffer, Eviction)` - Producer overwrites old entries
6. `TEST(SpmcRingBuffer, MissedEntriesDetection)` - Consumer detects it fell
   behind
7. `TEST(SpmcRingBuffer, MultipleConsumers)` - Multiple iterators reading
   independently
8. `TEST(SpmcRingBuffer, StaleReadDetection)` - Validate returns false when data
   overwritten

---

## Phase 2: C# Implementation

### Phase 2.1: Atomic Helpers (C#)

**File**:
`/data/sandcastle/boxes/fbsource/arvr/libraries/xred/xrpa/core/runtime/cs/xrpa-runtime/Runtime/utils/AtomicUtils.cs`

```csharp
using System.Threading;

namespace Xrpa
{
    public static class AtomicUtils
    {
        // Atomic load with acquire semantics
        public static uint AtomicLoadAcquire(ref uint location);

        // Atomic store with release semantics
        public static void AtomicStoreRelease(ref uint location, uint value);

        // Unsafe pointer versions for direct memory access
        unsafe public static uint AtomicLoadAcquire(uint* ptr);
        unsafe public static void AtomicStoreRelease(uint* ptr, uint value);
    }
}
```

Uses `Volatile.Read`, `Volatile.Write`, and `Thread.MemoryBarrier()` for memory
ordering.

### Phase 2.2: SPMC Ring Buffer (C#)

**File**:
`/data/sandcastle/boxes/fbsource/arvr/libraries/xred/xrpa/core/runtime/cs/xrpa-runtime/Runtime/utils/SpmcRingBuffer.cs`

```csharp
namespace Xrpa
{
    unsafe public class SpmcRingBuffer
    {
        public static readonly int BLOCK_HEADER_SIZE = 4;
        public static readonly int HEADER_SIZE = 24;

        // Constructor matches C++ and Python
        public SpmcRingBuffer(MemoryAccessor memSource, long memOffset);

        public static int GetMemSize(int blockSize, int blockCount);
        public void Init(int blockSize, int blockCount);

        public bool IsNull();
        public int BlockSize { get; }
        public int BlockCount { get; }

        // Producer method
        public bool Write(int dataSize, Action<MemoryAccessor> callback);
    }

    public class SpmcRingBufferIterator
    {
        public bool HasMissedEntries(SpmcRingBuffer ringBuffer);
        public bool HasNext(SpmcRingBuffer ringBuffer);
        public bool ReadNext(SpmcRingBuffer ringBuffer, Action<MemoryAccessor> callback);
        public void SetToEnd(SpmcRingBuffer ringBuffer);
    }
}
```

### Phase 2.3: C# Unit Tests

**File**:
`/data/sandcastle/boxes/fbsource/arvr/libraries/xred/xrpa/core/runtime/cs/xrpa-runtime/Tests/SpmcRingBufferTest.cs`

Mirror C++ test cases using NUnit/xUnit framework.

---

## Phase 3: Python Implementation (with C Extension)

### Phase 3.1: Python C Extension for Atomics

**Directory**:
`/data/sandcastle/boxes/fbsource/arvr/libraries/xred/xrpa/core/runtime/python/xrpa_atomics/`

Create a Python C extension module providing atomic operations on raw memory:

**File**: `xrpa_atomics.c`

```c
#define PY_SSIZE_T_CLEAN
#include <Python.h>

#if defined(_MSC_VER)
#include <intrin.h>
#else
// GCC/Clang atomics
#endif

// atomic_load_acquire(buffer, offset) -> int
// Atomically loads a uint32 from buffer at byte offset
static PyObject* atomic_load_acquire(PyObject* self, PyObject* args);

// atomic_store_release(buffer, offset, value)
// Atomically stores a uint32 to buffer at byte offset
static PyObject* atomic_store_release(PyObject* self, PyObject* args);

static PyMethodDef XrpaAtomicsMethods[] = {
    {"atomic_load_acquire", atomic_load_acquire, METH_VARARGS, "Atomic load with acquire semantics"},
    {"atomic_store_release", atomic_store_release, METH_VARARGS, "Atomic store with release semantics"},
    {NULL, NULL, 0, NULL}
};

static struct PyModuleDef xrpa_atomics_module = {
    PyModuleDef_HEAD_INIT,
    "xrpa_atomics",
    "Atomic operations for XRPA shared memory",
    -1,
    XrpaAtomicsMethods
};

PyMODINIT_FUNC PyInit_xrpa_atomics(void) {
    return PyModule_Create(&xrpa_atomics_module);
}
```

**File**: `setup.py`

```python
from setuptools import setup, Extension

xrpa_atomics = Extension(
    'xrpa_atomics',
    sources=['xrpa_atomics.c'],
    extra_compile_args=['-O3'],
)

setup(
    name='xrpa_atomics',
    version='1.0',
    ext_modules=[xrpa_atomics],
)
```

**Build integration**: Add BUCK target for the C extension.

### Phase 3.2: SPMC Ring Buffer (Python)

**File**:
`/data/sandcastle/boxes/fbsource/arvr/libraries/xred/xrpa/core/runtime/python/xrpa_runtime/utils/spmc_ring_buffer.py`

```python
from typing import Callable, Optional
from xrpa_runtime.utils.memory_accessor import MemoryAccessor, MemoryOffset

# Import C extension for atomics
try:
    import xrpa_atomics
except ImportError:
    xrpa_atomics = None  # Fallback with warning

def _align(x: int) -> int:
    return (x + 3) & ~3

class SpmcRingBuffer:
    BLOCK_HEADER_SIZE = 4
    HEADER_SIZE = 24

    # Header offsets
    _POOL_SIZE_OFFSET = 0
    _BLOCK_SIZE_OFFSET = 4
    _BLOCK_COUNT_OFFSET = 8
    _WRITE_INDEX_OFFSET = 16
    _MIN_READ_INDEX_OFFSET = 20

    # Constructor matches C++ and C#
    def __init__(self, mem_source: MemoryAccessor, mem_offset: int):
        self._mem_source = mem_source
        self._header_accessor = mem_source.slice(mem_offset, self.HEADER_SIZE)
        self._base_offset = mem_offset
        # Pool accessor created after reading pool_size in init or on first access

    @staticmethod
    def get_mem_size(block_size: int, block_count: int) -> int:
        block_size = _align(block_size)
        return SpmcRingBuffer.HEADER_SIZE + (block_size * block_count)

    def init(self, block_size: int, block_count: int):
        """Initialize the ring buffer with given block size and count."""
        ...

    @property
    def pool_size(self) -> int: ...

    @property
    def block_size(self) -> int: ...

    @property
    def block_count(self) -> int: ...

    def write(self, data_size: int, callback: Callable[[MemoryAccessor], None]) -> bool:
        """Producer: write data to ring buffer via callback."""
        ...


class SpmcRingBufferIterator:
    def __init__(self):
        self._local_read_index: int = 0

    def has_missed_entries(self, ring_buffer: SpmcRingBuffer) -> bool: ...
    def has_next(self, ring_buffer: SpmcRingBuffer) -> bool: ...
    def read_next(self, ring_buffer: SpmcRingBuffer,
                  callback: Callable[[MemoryAccessor], None]) -> bool: ...
    def set_to_end(self, ring_buffer: SpmcRingBuffer): ...
```

### Phase 3.3: Python BUCK Integration

**File**:
`/data/sandcastle/boxes/fbsource/arvr/libraries/xred/xrpa/core/runtime/python/BUCK`

Add C extension target for `xrpa_atomics`.

### Phase 3.4: Python Unit Tests

**File**:
`/data/sandcastle/boxes/fbsource/arvr/libraries/xred/xrpa/core/runtime/python/xrpa_runtime/tests/test_spmc_ring_buffer.py`

Mirror C++ test cases using pytest.

---

## Summary of Files to Create

| File                                                              | Language | Purpose                          |
| ----------------------------------------------------------------- | -------- | -------------------------------- |
| `core/runtime/cpp/xrpa-runtime/utils/AtomicUtils.h`               | C++      | Platform-agnostic atomic helpers |
| `core/runtime/cpp/xrpa-runtime/utils/SpmcRingBuffer.h`            | C++      | SPMC ring buffer + iterator      |
| `core/runtime/cpp/test/utils/SpmcRingBufferTest.cpp`              | C++      | Unit tests                       |
| `core/runtime/cs/xrpa-runtime/Runtime/utils/AtomicUtils.cs`       | C#       | Atomic helpers                   |
| `core/runtime/cs/xrpa-runtime/Runtime/utils/SpmcRingBuffer.cs`    | C#       | SPMC ring buffer + iterator      |
| `core/runtime/cs/xrpa-runtime/Tests/SpmcRingBufferTest.cs`        | C#       | Unit tests                       |
| `core/runtime/python/xrpa_atomics/xrpa_atomics.c`                 | C        | Python C extension for atomics   |
| `core/runtime/python/xrpa_atomics/setup.py`                       | Python   | C extension build config         |
| `core/runtime/python/xrpa_runtime/utils/spmc_ring_buffer.py`      | Python   | SPMC ring buffer + iterator      |
| `core/runtime/python/xrpa_runtime/tests/test_spmc_ring_buffer.py` | Python   | Unit tests                       |

## Files to Modify

| File                                                 | Change                     |
| ---------------------------------------------------- | -------------------------- |
| `core/runtime/python/xrpa_runtime/utils/__init__.py` | Add exports                |
| `core/runtime/python/BUCK`                           | Add C extension target     |
| `lock-free-spmc.md`                                  | Add implementation details |

---

## Consistent Constructor Signatures Across Languages

All three languages now use the same pattern:

```cpp
// C++
SpmcRingBuffer(const MemoryAccessor& memSource, int32_t memOffset);
```

```csharp
// C#
public SpmcRingBuffer(MemoryAccessor memSource, long memOffset);
```

```python
# Python
def __init__(self, mem_source: MemoryAccessor, mem_offset: int):
```

This matches the existing `PlacedRingBuffer` pattern and ensures consistent
usage across all Xrpa runtime implementations.

---

## Implementation Order

1. **Phase 1.1**: C++ AtomicUtils.h (foundation for all implementations)
2. **Phase 1.2**: C++ SpmcRingBuffer.h (reference implementation)
3. **Phase 1.3**: C++ tests (validate design)
4. **Phase 2.1-2.3**: C# implementation (straightforward port)
5. **Phase 3.1**: Python C extension (required for true atomics)
6. **Phase 3.2-3.4**: Python implementation and tests
7. **Phase 4**: Documentation and exports

Total estimated new code: ~1500-2000 lines across all languages.
