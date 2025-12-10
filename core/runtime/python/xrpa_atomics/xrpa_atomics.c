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

#define PY_SSIZE_T_CLEAN
#include <Python.h>
#include <stdint.h>

#if defined(_MSC_VER)
#include <intrin.h>
#pragma intrinsic(_InterlockedOr)
#pragma intrinsic(_InterlockedExchange)
#pragma intrinsic(_InterlockedCompareExchange)
#endif

/*
 * Atomic load with acquire semantics.
 *
 * Args:
 *   buffer: A buffer object (e.g., memoryview, bytearray) that supports the buffer protocol
 *   offset: Byte offset within the buffer
 *
 * Returns:
 *   The uint32 value at the specified offset, read atomically with acquire semantics
 */
static PyObject* atomic_load_acquire(PyObject* self, PyObject* args) {
  (void)self;
  Py_buffer buffer;
  Py_ssize_t offset;

  if (!PyArg_ParseTuple(args, "y*n", &buffer, &offset)) {
    return NULL;
  }

  if (offset < 0 || offset + 4 > buffer.len) {
    PyBuffer_Release(&buffer);
    PyErr_SetString(PyExc_IndexError, "Offset out of bounds");
    return NULL;
  }

  volatile uint32_t* ptr = (volatile uint32_t*)((char*)buffer.buf + offset);
  uint32_t value;

#if defined(_MSC_VER)
  /* _InterlockedOr with 0 performs an atomic read with full barrier semantics */
  value = (uint32_t)_InterlockedOr((volatile long*)ptr, 0);
#else
  /* GCC/Clang atomic load with acquire semantics */
  value = __atomic_load_n(ptr, __ATOMIC_ACQUIRE);
#endif

  PyBuffer_Release(&buffer);
  return PyLong_FromUnsignedLong(value);
}

/*
 * Atomic store with release semantics.
 *
 * Args:
 *   buffer: A buffer object (e.g., memoryview, bytearray) that supports the buffer protocol
 *   offset: Byte offset within the buffer
 *   value: The uint32 value to store
 *
 * Returns:
 *   None
 */
static PyObject* atomic_store_release(PyObject* self, PyObject* args) {
  (void)self;
  Py_buffer buffer;
  Py_ssize_t offset;
  unsigned long value;

  if (!PyArg_ParseTuple(args, "y*nk", &buffer, &offset, &value)) {
    return NULL;
  }

  if (offset < 0 || offset + 4 > buffer.len) {
    PyBuffer_Release(&buffer);
    PyErr_SetString(PyExc_IndexError, "Offset out of bounds");
    return NULL;
  }

  volatile uint32_t* ptr = (volatile uint32_t*)((char*)buffer.buf + offset);

#if defined(_MSC_VER)
  /* _InterlockedExchange provides atomic store with full barrier semantics */
  _InterlockedExchange((volatile long*)ptr, (long)value);
#else
  /* GCC/Clang atomic store with release semantics */
  __atomic_store_n(ptr, (uint32_t)value, __ATOMIC_RELEASE);
#endif

  PyBuffer_Release(&buffer);
  Py_RETURN_NONE;
}

/*
 * Atomic exchange operation.
 *
 * Args:
 *   buffer: A buffer object (e.g., memoryview, bytearray) that supports the buffer protocol
 *   offset: Byte offset within the buffer
 *   value: The uint32 value to store
 *
 * Returns:
 *   The previous value at the specified offset
 */
static PyObject* atomic_exchange(PyObject* self, PyObject* args) {
  (void)self;
  Py_buffer buffer;
  Py_ssize_t offset;
  unsigned long value;

  if (!PyArg_ParseTuple(args, "y*nk", &buffer, &offset, &value)) {
    return NULL;
  }

  if (offset < 0 || offset + 4 > buffer.len) {
    PyBuffer_Release(&buffer);
    PyErr_SetString(PyExc_IndexError, "Offset out of bounds");
    return NULL;
  }

  volatile uint32_t* ptr = (volatile uint32_t*)((char*)buffer.buf + offset);
  uint32_t old_value;

#if defined(_MSC_VER)
  old_value = (uint32_t)_InterlockedExchange((volatile long*)ptr, (long)value);
#else
  old_value = __atomic_exchange_n(ptr, (uint32_t)value, __ATOMIC_ACQ_REL);
#endif

  PyBuffer_Release(&buffer);
  return PyLong_FromUnsignedLong(old_value);
}

/*
 * Atomic compare-and-swap operation.
 *
 * Args:
 *   buffer: A buffer object (e.g., memoryview, bytearray) that supports the buffer protocol
 *   offset: Byte offset within the buffer
 *   expected: The expected uint32 value
 *   desired: The desired uint32 value to store if expected matches
 *
 * Returns:
 *   A tuple (success, actual_value) where:
 *     - success is True if the exchange succeeded
 *     - actual_value is the value that was found at the location
 */
static PyObject* atomic_compare_exchange(PyObject* self, PyObject* args) {
  (void)self;
  Py_buffer buffer;
  Py_ssize_t offset;
  unsigned long expected;
  unsigned long desired;

  if (!PyArg_ParseTuple(args, "y*nkk", &buffer, &offset, &expected, &desired)) {
    return NULL;
  }

  if (offset < 0 || offset + 4 > buffer.len) {
    PyBuffer_Release(&buffer);
    PyErr_SetString(PyExc_IndexError, "Offset out of bounds");
    return NULL;
  }

  volatile uint32_t* ptr = (volatile uint32_t*)((char*)buffer.buf + offset);
  uint32_t actual;
  int success;

#if defined(_MSC_VER)
  actual =
      (uint32_t)_InterlockedCompareExchange((volatile long*)ptr, (long)desired, (long)expected);
  success = (actual == (uint32_t)expected);
#else
  uint32_t expected_val = (uint32_t)expected;
  success = __atomic_compare_exchange_n(
      ptr,
      &expected_val,
      (uint32_t)desired,
      0, /* weak = false */
      __ATOMIC_ACQ_REL,
      __ATOMIC_ACQUIRE);
  actual = expected_val;
#endif

  PyBuffer_Release(&buffer);
  return Py_BuildValue("(Nk)", PyBool_FromLong(success), (unsigned long)actual);
}

static PyMethodDef XrpaAtomicsMethods[] = {
    {"atomic_load_acquire",
     atomic_load_acquire,
     METH_VARARGS,
     "Atomically load a uint32 value with acquire semantics.\n\n"
     "Args:\n"
     "    buffer: A buffer object supporting the buffer protocol\n"
     "    offset: Byte offset within the buffer\n\n"
     "Returns:\n"
     "    The uint32 value at the specified offset"},
    {"atomic_store_release",
     atomic_store_release,
     METH_VARARGS,
     "Atomically store a uint32 value with release semantics.\n\n"
     "Args:\n"
     "    buffer: A buffer object supporting the buffer protocol\n"
     "    offset: Byte offset within the buffer\n"
     "    value: The uint32 value to store"},
    {"atomic_exchange",
     atomic_exchange,
     METH_VARARGS,
     "Atomically exchange a uint32 value.\n\n"
     "Args:\n"
     "    buffer: A buffer object supporting the buffer protocol\n"
     "    offset: Byte offset within the buffer\n"
     "    value: The uint32 value to store\n\n"
     "Returns:\n"
     "    The previous value at the specified offset"},
    {"atomic_compare_exchange",
     atomic_compare_exchange,
     METH_VARARGS,
     "Atomically compare and exchange a uint32 value.\n\n"
     "Args:\n"
     "    buffer: A buffer object supporting the buffer protocol\n"
     "    offset: Byte offset within the buffer\n"
     "    expected: The expected value\n"
     "    desired: The value to store if expected matches\n\n"
     "Returns:\n"
     "    A tuple (success, actual_value)"},
    {NULL, NULL, 0, NULL}};

static struct PyModuleDef xrpa_atomics_module = {
    PyModuleDef_HEAD_INIT,
    "xrpa_atomics", // m_name
    // m_doc
    "Atomic operations for XRPA shared memory.\n\n"
    "This module provides atomic read/write operations with proper memory\n"
    "ordering semantics for use in lock-free data structures operating on\n"
    "shared memory.\n\n"
    "Functions:\n"
    "    atomic_load_acquire(buffer, offset) -> int\n"
    "    atomic_store_release(buffer, offset, value) -> None\n"
    "    atomic_exchange(buffer, offset, value) -> int\n"
    "    atomic_compare_exchange(buffer, offset, expected, desired) -> (bool, int)",
    -1, // m_size
    XrpaAtomicsMethods, // m_methods
    NULL, // m_slots
    NULL, // m_traverse
    NULL, // m_clear
    NULL // m_free
};

PyMODINIT_FUNC PyInit_xrpa_atomics(void) {
  return PyModule_Create(&xrpa_atomics_module);
}
