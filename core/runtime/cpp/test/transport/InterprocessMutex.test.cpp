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

#include <folly/portability/GTest.h>
#include <folly/portability/Unistd.h>

#include <xrpa-runtime/transport/InterprocessMutex.h>

#include <atomic>
#include <chrono>
#include <filesystem>
#include <functional>
#include <stdexcept>
#include <string>
#include <thread>
#include <vector>

using namespace Xrpa;
using namespace std::chrono_literals;

#if defined(__APPLE__) || defined(WIN32)
namespace {

// Generate a unique mutex name per test to avoid collisions between tests
std::string uniqueMutexName(const std::string& prefix) {
  static std::atomic<int> counter{0};
  auto pid = static_cast<int>(getpid());
  return prefix + "_" + std::to_string(pid) + "_" + std::to_string(counter++);
}

} // namespace
#endif // defined(__APPLE__) || defined(WIN32)

#ifdef __APPLE__

// ============================================================================
// MacInterprocessMutex - Construction and Lifecycle Tests
// ============================================================================

class MacInterprocessMutexTest : public ::testing::Test {
 protected:
  void SetUp() override {
    mutexName_ = uniqueMutexName("MacMutexTest");
  }

  void TearDown() override {
    // Clean up lock file if it exists
    std::string lockFilePath = "/tmp/xrpa/" + mutexName_ + ".lock";
    std::filesystem::remove(lockFilePath);
  }

  std::string mutexName_;
};

TEST_F(MacInterprocessMutexTest, ConstructorCreatesLockFileAndMutexIsFunctional) {
  MacInterprocessMutex mutex(mutexName_);

  // Verify the lock file was created as a side effect of construction
  std::string expectedPath = "/tmp/xrpa/" + mutexName_ + ".lock";
  EXPECT_TRUE(std::filesystem::exists(expectedPath));

  // Verify the mutex is immediately functional after construction
  bool callbackExecuted = false;
  bool result = mutex.lockAndExecute(100, [&]() { callbackExecuted = true; });
  EXPECT_TRUE(result);
  EXPECT_TRUE(callbackExecuted);
}

// ============================================================================
// MacInterprocessMutex - lockAndExecute Basic Behavior
// ============================================================================

TEST_F(MacInterprocessMutexTest, LockAndExecuteWithNonPositiveTimeoutUsesNonBlockingLock) {
  MacInterprocessMutex mutex(mutexName_);

  // The implementation uses a single non-blocking lock attempt when timeoutMS <= 0
  // Test both zero and negative values to cover the boundary condition
  bool callbackExecuted = false;
  bool result = mutex.lockAndExecute(0, [&]() { callbackExecuted = true; });
  EXPECT_TRUE(result);
  EXPECT_TRUE(callbackExecuted);

  callbackExecuted = false;
  result = mutex.lockAndExecute(-1, [&]() { callbackExecuted = true; });
  EXPECT_TRUE(result);
  EXPECT_TRUE(callbackExecuted);
}

// ============================================================================
// MacInterprocessMutex - Exception Safety
// ============================================================================

TEST_F(MacInterprocessMutexTest, LockAndExecuteReleasesLockOnException) {
  MacInterprocessMutex mutex(mutexName_);

  // First call throws an exception
  EXPECT_THROW(
      mutex.lockAndExecute(100, [&]() { throw std::runtime_error("test error"); }),
      std::runtime_error);

  // Lock should be released, so a subsequent lockAndExecute should succeed
  bool secondCallbackExecuted = false;
  bool result = mutex.lockAndExecute(100, [&]() { secondCallbackExecuted = true; });

  EXPECT_TRUE(result);
  EXPECT_TRUE(secondCallbackExecuted);
}

TEST_F(MacInterprocessMutexTest, LockAndExecutePreservesExceptionType) {
  MacInterprocessMutex mutex(mutexName_);

  EXPECT_THROW(
      mutex.lockAndExecute(100, [&]() { throw std::invalid_argument("bad arg"); }),
      std::invalid_argument);
}

// ============================================================================
// MacInterprocessMutex - Unlock and Dispose
// ============================================================================

TEST_F(MacInterprocessMutexTest, UnlockWhenNotLockedDoesNotCorruptState) {
  MacInterprocessMutex mutex(mutexName_);

  // Calling unlock without holding a lock should not corrupt the mutex
  mutex.unlock();

  // Verify the mutex is still usable after spurious unlock
  bool callbackExecuted = false;
  bool result = mutex.lockAndExecute(100, [&]() { callbackExecuted = true; });

  EXPECT_TRUE(result);
  EXPECT_TRUE(callbackExecuted);
}

TEST_F(MacInterprocessMutexTest, DoubleDisposeDoesNotCorruptState) {
  MacInterprocessMutex mutex(mutexName_);

  mutex.dispose();
  mutex.dispose();

  // On Mac, dispose() only calls unlock(), so the mutex should still be usable
  bool callbackExecuted = false;
  bool result = mutex.lockAndExecute(100, [&]() { callbackExecuted = true; });

  EXPECT_TRUE(result);
  EXPECT_TRUE(callbackExecuted);
}

// ============================================================================
// MacInterprocessMutex - Mutual Exclusion
// ============================================================================

TEST_F(MacInterprocessMutexTest, MutualExclusionBetweenInstances) {
  MacInterprocessMutex mutex1(mutexName_);
  MacInterprocessMutex mutex2(mutexName_);

  std::atomic<bool> t1LockAcquired{false};
  std::atomic<bool> mutex1Held{false};
  std::atomic<bool> overlapDetected{false};

  // Thread 1: hold the lock for a short period
  std::thread t1([&]() {
    mutex1.lockAndExecute(1000, [&]() {
      t1LockAcquired.store(true);
      mutex1Held.store(true);
      std::this_thread::sleep_for(50ms);
      mutex1Held.store(false);
    });
  });

  // Wait for thread 1 to acquire the lock
  while (!t1LockAcquired.load()) {
    std::this_thread::sleep_for(1ms);
  }

  // Thread 2: try to acquire the same lock
  std::thread t2([&]() {
    mutex2.lockAndExecute(2000, [&]() {
      // If mutex1 is still held when we enter, mutual exclusion is broken
      if (mutex1Held.load()) {
        overlapDetected.store(true);
      }
    });
  });

  t1.join();
  t2.join();

  EXPECT_FALSE(overlapDetected.load());
}

TEST_F(MacInterprocessMutexTest, LockAndExecuteTimesOutWhenLockHeld) {
  MacInterprocessMutex mutex1(mutexName_);
  MacInterprocessMutex mutex2(mutexName_);

  std::atomic<bool> lockAcquired{false};
  std::atomic<bool> holdLock{true};

  // Thread 1: hold the lock indefinitely until told to release
  std::thread holder([&]() {
    mutex1.lockAndExecute(1000, [&]() {
      lockAcquired.store(true);
      while (holdLock.load()) {
        std::this_thread::sleep_for(1ms);
      }
    });
  });

  // Wait for thread 1 to acquire the lock
  while (!lockAcquired.load()) {
    std::this_thread::sleep_for(1ms);
  }

  // Thread 2: try to acquire with a short timeout - should fail
  bool result = mutex2.lockAndExecute(20, [&]() {
    // Should not reach here
  });

  EXPECT_FALSE(result);

  // Release the lock holder
  holdLock.store(false);
  holder.join();
}

// ============================================================================
// MacInterprocessMutex - Re-entrant Lock Behavior
// ============================================================================

TEST_F(MacInterprocessMutexTest, LockAndExecuteWhileAlreadyLockedExecutesCallback) {
  MacInterprocessMutex mutex(mutexName_);

  bool innerCallbackExecuted = false;

  // Acquire the lock, then call lockAndExecute again from within the callback
  // The implementation should detect the already-locked state and execute directly
  bool outerResult = mutex.lockAndExecute(100, [&]() {
    bool innerResult = mutex.lockAndExecute(100, [&]() { innerCallbackExecuted = true; });
    EXPECT_TRUE(innerResult);
  });

  EXPECT_TRUE(outerResult);
  EXPECT_TRUE(innerCallbackExecuted);
}

// ============================================================================
// MacInterprocessMutex - Sequential Lock/Unlock Cycles
// ============================================================================

TEST_F(MacInterprocessMutexTest, MultipleLockAndExecuteCyclesSucceed) {
  MacInterprocessMutex mutex(mutexName_);

  int totalCount = 0;
  for (int i = 0; i < 10; ++i) {
    bool result = mutex.lockAndExecute(100, [&]() { totalCount++; });
    EXPECT_TRUE(result);
  }

  EXPECT_EQ(totalCount, 10);
}

// ============================================================================
// MacInterprocessMutex - Destructor Cleanup
// ============================================================================

TEST_F(MacInterprocessMutexTest, DestructorReleasesLock) {
  MacInterprocessMutex mutex2(mutexName_);

  {
    MacInterprocessMutex mutex1(mutexName_);
    // mutex1 is destroyed here, should release any held resources
  }

  // mutex2 should be able to acquire the lock after mutex1 is destroyed
  bool callbackExecuted = false;
  bool result = mutex2.lockAndExecute(100, [&]() { callbackExecuted = true; });

  EXPECT_TRUE(result);
  EXPECT_TRUE(callbackExecuted);
}

// ============================================================================
// MacInterprocessMutex - Concurrent Access Stress Test
// ============================================================================

TEST_F(MacInterprocessMutexTest, ConcurrentAccessMaintainsDataIntegrity) {
  constexpr int kNumThreads = 4;
  constexpr int kIncrementsPerThread = 50;

  int sharedCounter = 0;
  std::vector<std::thread> threads;
  threads.reserve(kNumThreads);

  for (int i = 0; i < kNumThreads; ++i) {
    threads.emplace_back([&]() {
      MacInterprocessMutex mutex(mutexName_);
      for (int j = 0; j < kIncrementsPerThread; ++j) {
        mutex.lockAndExecute(5000, [&]() { sharedCounter++; });
      }
    });
  }

  for (auto& t : threads) {
    t.join();
  }

  EXPECT_EQ(sharedCounter, kNumThreads * kIncrementsPerThread);
}

#endif // __APPLE__

#ifdef WIN32

// ============================================================================
// WindowsInterprocessMutex - Basic Tests
// ============================================================================

class WindowsInterprocessMutexTest : public ::testing::Test {
 protected:
  void SetUp() override {
    mutexName_ = uniqueMutexName("WinMutexTest");
  }

  std::string mutexName_;
};

TEST_F(WindowsInterprocessMutexTest, LockAndExecuteRunsCallback) {
  WindowsInterprocessMutex mutex(mutexName_);

  bool callbackExecuted = false;
  bool result = mutex.lockAndExecute(100, [&]() { callbackExecuted = true; });

  EXPECT_TRUE(result);
  EXPECT_TRUE(callbackExecuted);
}

TEST_F(WindowsInterprocessMutexTest, UnlockWhenNotLockedDoesNotCorruptState) {
  WindowsInterprocessMutex mutex(mutexName_);

  // Calling unlock without holding a lock should not corrupt the mutex
  mutex.unlock();

  // Verify the mutex is still usable after spurious unlock
  bool callbackExecuted = false;
  bool result = mutex.lockAndExecute(100, [&]() { callbackExecuted = true; });

  EXPECT_TRUE(result);
  EXPECT_TRUE(callbackExecuted);
}

TEST_F(WindowsInterprocessMutexTest, DoubleDisposeDisablesMutex) {
  WindowsInterprocessMutex mutex(mutexName_);

  mutex.dispose();
  mutex.dispose();

  // On Windows, dispose() sets mutexHandle_ to 0, so lockAndExecute should return false
  bool callbackExecuted = false;
  bool result = mutex.lockAndExecute(100, [&]() { callbackExecuted = true; });

  EXPECT_FALSE(result);
  EXPECT_FALSE(callbackExecuted);
}

TEST_F(WindowsInterprocessMutexTest, MultipleLockAndExecuteCyclesSucceed) {
  WindowsInterprocessMutex mutex(mutexName_);

  int totalCount = 0;
  for (int i = 0; i < 10; ++i) {
    bool result = mutex.lockAndExecute(100, [&]() { totalCount++; });
    EXPECT_TRUE(result);
  }

  EXPECT_EQ(totalCount, 10);
}

TEST_F(WindowsInterprocessMutexTest, MutualExclusionBetweenInstances) {
  WindowsInterprocessMutex mutex1(mutexName_);
  WindowsInterprocessMutex mutex2(mutexName_);

  std::atomic<bool> t1LockAcquired{false};
  std::atomic<bool> mutex1Held{false};
  std::atomic<bool> overlapDetected{false};

  std::thread t1([&]() {
    mutex1.lockAndExecute(1000, [&]() {
      t1LockAcquired.store(true);
      mutex1Held.store(true);
      std::this_thread::sleep_for(50ms);
      mutex1Held.store(false);
    });
  });

  // Wait for thread 1 to acquire the lock
  while (!t1LockAcquired.load()) {
    std::this_thread::sleep_for(1ms);
  }

  std::thread t2([&]() {
    mutex2.lockAndExecute(2000, [&]() {
      if (mutex1Held.load()) {
        overlapDetected.store(true);
      }
    });
  });

  t1.join();
  t2.join();

  EXPECT_FALSE(overlapDetected.load());
}

TEST_F(WindowsInterprocessMutexTest, ConcurrentAccessMaintainsDataIntegrity) {
  constexpr int kNumThreads = 4;
  constexpr int kIncrementsPerThread = 50;

  int sharedCounter = 0;
  std::vector<std::thread> threads;
  threads.reserve(kNumThreads);

  for (int i = 0; i < kNumThreads; ++i) {
    threads.emplace_back([&]() {
      WindowsInterprocessMutex mutex(mutexName_);
      for (int j = 0; j < kIncrementsPerThread; ++j) {
        mutex.lockAndExecute(5000, [&]() { sharedCounter++; });
      }
    });
  }

  for (auto& t : threads) {
    t.join();
  }

  EXPECT_EQ(sharedCounter, kNumThreads * kIncrementsPerThread);
}

TEST_F(WindowsInterprocessMutexTest, DestructorReleasesLock) {
  WindowsInterprocessMutex mutex2(mutexName_);

  {
    WindowsInterprocessMutex mutex1(mutexName_);
  }

  bool callbackExecuted = false;
  bool result = mutex2.lockAndExecute(100, [&]() { callbackExecuted = true; });

  EXPECT_TRUE(result);
  EXPECT_TRUE(callbackExecuted);
}

#endif // WIN32
