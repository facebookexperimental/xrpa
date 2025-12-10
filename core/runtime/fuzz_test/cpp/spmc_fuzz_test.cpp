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

// SPMC Ring Buffer Fuzz Test - C++ Implementation
//
// Usage:
//   ./spmc_fuzz_test --mode producer --entries 10000 --shm-name test
//   ./spmc_fuzz_test --mode consumer --entries 10000 --shm-name test
//
// Data Protocol (per entry):
//   Offset | Size | Field
//   -------|------|------------------
//   0      | 4    | sequence (uint32, monotonically increasing)
//   4      | 4    | checksum (uint32, simple sum of payload bytes)
//   8      | 4    | payload_size (uint32, size of payload in bytes)
//   12     | ...  | payload (random bytes)

#include <xrpa-runtime/utils/MemoryAccessor.h>
#include <xrpa-runtime/utils/SpmcRingBuffer.h>

#include <chrono>
#include <cstdint>
#include <cstring>
#include <filesystem>
#include <iostream>
#include <random>
#include <string>
#include <thread>
#include <vector>

#if defined(WIN32)
#include <Windows.h>
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#else
#include <fcntl.h>
#include <sys/mman.h>
#include <sys/stat.h>
#include <unistd.h>
#endif

namespace {

// Configuration constants - defaults suitable for image data testing
constexpr int32_t DEFAULT_BLOCK_SIZE = 1024 * 1024; // 1MB blocks
constexpr int32_t DEFAULT_BLOCK_COUNT = 4;
constexpr int32_t DEFAULT_ENTRIES = 100;
constexpr int32_t WRITE_DELAY_MS = 1;
constexpr uint32_t MAGIC_NUMBER = 0x53504D43; // "SPMC"
constexpr uint32_t VERSION = 1;

// Header offsets in shared memory
constexpr int32_t SHM_MAGIC_OFFSET = 0;
constexpr int32_t SHM_VERSION_OFFSET = 4;
constexpr int32_t SHM_RINGBUF_OFFSET = 8;

// Entry header size (sequence + checksum + payload length prefix)
constexpr int32_t ENTRY_HEADER_SIZE = 12;

// Payload size range (in blocks worth of data)
constexpr float MIN_PAYLOAD_BLOCKS = 0.5f;
constexpr float MAX_PAYLOAD_BLOCKS = 3.0f;

struct Config {
  std::string mode;
  std::string shmName = "xrpa_spmc_fuzz_test";
  int32_t entries = DEFAULT_ENTRIES;
  int32_t blockSize = DEFAULT_BLOCK_SIZE;
  int32_t blockCount = DEFAULT_BLOCK_COUNT;
  int32_t startupDelayMs = 0;
  bool verbose = false;
};

struct SharedMemory {
  void* ptr = nullptr;
  int32_t size = 0;
#if defined(WIN32)
  void* handle = nullptr;
#endif
};

struct Statistics {
  uint32_t entriesWritten = 0;
  uint32_t entriesRead = 0;
  uint32_t checksumErrors = 0;
  uint32_t sequenceErrors = 0;
  uint32_t missedEntries = 0;
  uint32_t staleReads = 0;
  uint32_t minPayloadSize = UINT32_MAX;
  uint32_t maxPayloadSize = 0;
  uint64_t totalPayloadBytes = 0;
  uint64_t readProcessingTimeUs = 0; // Time spent actually reading/processing (microseconds)
  uint64_t writeProcessingTimeUs = 0; // Time spent actually writing (microseconds)
};

uint32_t computeChecksum(const uint8_t* data, uint32_t size) {
  uint32_t sum = 0;
  for (uint32_t i = 0; i < size; ++i) {
    sum += data[i];
  }
  return sum;
}

std::string getSharedMemoryPath(const std::string& name) {
#if defined(WIN32)
  return name;
#else
  return "/tmp/xrpa/" + name;
#endif
}

bool createDirectories(const std::string& path) {
#if !defined(WIN32)
  std::filesystem::path dir = std::filesystem::path(path).parent_path();
  if (!dir.empty() && !std::filesystem::exists(dir)) {
    std::filesystem::create_directories(dir);
  }
#endif
  return true;
}

SharedMemory openSharedMemory(const std::string& name, int32_t size, bool create) {
  SharedMemory shm;
  shm.size = size;

#if defined(WIN32)
  if (create) {
    shm.handle = CreateFileMappingA(
        INVALID_HANDLE_VALUE, NULL, PAGE_READWRITE, 0, static_cast<DWORD>(size), name.c_str());
  } else {
    shm.handle = OpenFileMappingA(FILE_MAP_ALL_ACCESS, FALSE, name.c_str());
  }

  if (shm.handle == nullptr) {
    return shm;
  }

  shm.ptr = MapViewOfFile(shm.handle, FILE_MAP_ALL_ACCESS, 0, 0, size);
  if (shm.ptr == nullptr) {
    CloseHandle(shm.handle);
    shm.handle = nullptr;
  }
#else
  std::string path = getSharedMemoryPath(name);
  createDirectories(path);

  int flags = O_RDWR;
  if (create) {
    flags |= O_CREAT | O_TRUNC;
  }

  int fd = open(path.c_str(), flags, 0666);
  if (fd == -1) {
    std::cerr << "Failed to open shared memory: " << path << " (error: " << strerror(errno) << ")"
              << std::endl;
    return shm;
  }

  if (create) {
    if (ftruncate(fd, size) == -1) {
      std::cerr << "Failed to set shared memory size (error: " << strerror(errno) << ")"
                << std::endl;
      close(fd);
      return shm;
    }
  }

  shm.ptr = mmap(nullptr, size, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);
  close(fd);

  if (shm.ptr == MAP_FAILED) {
    std::cerr << "Failed to map shared memory (error: " << strerror(errno) << ")" << std::endl;
    shm.ptr = nullptr;
  }
#endif

  return shm;
}

void closeSharedMemory(SharedMemory& shm) {
#if defined(WIN32)
  if (shm.ptr != nullptr) {
    UnmapViewOfFile(shm.ptr);
  }
  if (shm.handle != nullptr) {
    CloseHandle(shm.handle);
  }
#else
  if (shm.ptr != nullptr) {
    munmap(shm.ptr, shm.size);
  }
#endif
  shm.ptr = nullptr;
}

void deleteSharedMemory(const std::string& name) {
#if !defined(WIN32)
  std::string path = getSharedMemoryPath(name);
  unlink(path.c_str());
#endif
}

void flushSharedMemory(SharedMemory& shm) {
#if defined(WIN32)
  if (shm.ptr != nullptr) {
    FlushViewOfFile(shm.ptr, shm.size);
  }
#else
  if (shm.ptr != nullptr) {
    msync(shm.ptr, shm.size, MS_SYNC);
  }
#endif
}

int runProducer(const Config& config) {
  std::cout << "=== SPMC Fuzz Test Producer (C++) ===" << std::endl;
  std::cout << "Shared memory: " << config.shmName << std::endl;
  std::cout << "Entries to write: " << config.entries << std::endl;

  // Calculate total shared memory size
  int32_t ringBufMemSize = Xrpa::SpmcRingBuffer::getMemSize(config.blockSize, config.blockCount);
  int32_t totalSize = SHM_RINGBUF_OFFSET + ringBufMemSize;

  std::cout << "Ring buffer: " << config.blockCount << " blocks x " << config.blockSize << " bytes"
            << std::endl;
  std::cout << "Total shared memory size: " << totalSize << " bytes" << std::endl;

  // Clean up any existing shared memory
  deleteSharedMemory(config.shmName);

  // Create shared memory
  SharedMemory shm = openSharedMemory(config.shmName, totalSize, true);
  if (shm.ptr == nullptr) {
    std::cerr << "ERROR: Failed to create shared memory" << std::endl;
    return 1;
  }

  // Initialize ring buffer BEFORE writing magic number
  // This ensures consumers see the magic number only after ring buffer is ready
  auto* mem = static_cast<uint8_t*>(shm.ptr);
  Xrpa::MemoryAccessor memAccessor(mem, 0, totalSize);
  Xrpa::SpmcRingBuffer ringBuffer(memAccessor, SHM_RINGBUF_OFFSET);
  ringBuffer.init(config.blockSize, config.blockCount);

  // Now write the magic number and version to signal initialization is complete
  *reinterpret_cast<uint32_t*>(mem + SHM_MAGIC_OFFSET) = MAGIC_NUMBER;
  *reinterpret_cast<uint32_t*>(mem + SHM_VERSION_OFFSET) = VERSION;

  flushSharedMemory(shm);

  std::cout << "Shared memory initialized. Starting writes..." << std::endl;

  // Startup delay to allow consumers to connect
  if (config.startupDelayMs > 0) {
    std::cout << "Waiting " << config.startupDelayMs << "ms for consumers to connect..."
              << std::endl;
    std::this_thread::sleep_for(std::chrono::milliseconds(config.startupDelayMs));
  }

  // Random number generator
  std::random_device rd;
  std::mt19937 gen(rd());
  int32_t dataPerBlock = config.blockSize - Xrpa::SpmcRingBuffer::BLOCK_HEADER_SIZE;
  auto minPayloadSize = static_cast<int32_t>(MIN_PAYLOAD_BLOCKS * dataPerBlock);
  auto maxPayloadSize = static_cast<int32_t>(MAX_PAYLOAD_BLOCKS * dataPerBlock);
  // Clamp to max that fits in ring buffer
  int32_t maxPossible = ringBuffer.getMaxDataSize() - ENTRY_HEADER_SIZE;
  maxPayloadSize = std::min(maxPayloadSize, maxPossible);
  std::uniform_int_distribution<int32_t> sizeDist(minPayloadSize, maxPayloadSize);
  std::uniform_int_distribution<uint8_t> byteDist(0, 255);

  Statistics stats;
  std::vector<uint8_t> payloadBuffer(maxPayloadSize);
  auto startTime = std::chrono::steady_clock::now();

  for (int32_t seq = 0; seq < config.entries; ++seq) {
    // Generate random payload
    int32_t payloadSize = sizeDist(gen);
    for (int32_t i = 0; i < payloadSize; ++i) {
      payloadBuffer[i] = byteDist(gen);
    }

    // Compute checksum
    uint32_t checksum = computeChecksum(payloadBuffer.data(), payloadSize);

    // Total entry size
    int32_t entrySize = ENTRY_HEADER_SIZE + payloadSize;

    // Write entry to ring buffer
    Xrpa::ByteVector payload(payloadBuffer.begin(), payloadBuffer.begin() + payloadSize);
    auto writeStart = std::chrono::steady_clock::now();
    bool success = ringBuffer.write(entrySize, [&](Xrpa::MemoryAccessor accessor) {
      Xrpa::MemoryOffset pos;
      accessor.writeValue<uint32_t>(static_cast<uint32_t>(seq), pos);
      accessor.writeValue<uint32_t>(checksum, pos);
      accessor.writeValue<Xrpa::ByteVector>(payload, pos);
    });
    auto writeEnd = std::chrono::steady_clock::now();
    stats.writeProcessingTimeUs +=
        std::chrono::duration_cast<std::chrono::microseconds>(writeEnd - writeStart).count();

    if (!success) {
      std::cerr << "ERROR: Failed to write entry " << seq << std::endl;
      closeSharedMemory(shm);
      return 1;
    }

    flushSharedMemory(shm);

    stats.entriesWritten++;
    stats.totalPayloadBytes += payloadSize;
    stats.minPayloadSize = std::min(stats.minPayloadSize, static_cast<uint32_t>(payloadSize));
    stats.maxPayloadSize = std::max(stats.maxPayloadSize, static_cast<uint32_t>(payloadSize));

    if (config.verbose && (seq % 1000 == 0)) {
      std::cout << "Written " << seq << " entries..." << std::endl;
    }

    // Small delay to avoid overwhelming consumers
    std::this_thread::sleep_for(std::chrono::milliseconds(WRITE_DELAY_MS));
  }

  auto endTime = std::chrono::steady_clock::now();
  auto durationMs =
      std::chrono::duration_cast<std::chrono::milliseconds>(endTime - startTime).count();

  std::cout << "\n=== Producer Results ===" << std::endl;
  std::cout << "Entries written: " << stats.entriesWritten << std::endl;
  std::cout << "Total payload bytes: " << stats.totalPayloadBytes << std::endl;
  std::cout << "Payload size range: " << stats.minPayloadSize << " - " << stats.maxPayloadSize
            << " bytes" << std::endl;
  std::cout << "Duration: " << durationMs << " ms" << std::endl;
  std::cout << "Rate: " << (stats.entriesWritten * 1000.0 / durationMs) << " entries/sec"
            << std::endl;
  std::cout << "INTERNAL_LOOP_DURATION_MS: " << durationMs << std::endl;
  std::cout << "INTERNAL_WRITE_PROCESSING_MS: " << (stats.writeProcessingTimeUs / 1000)
            << std::endl;

  closeSharedMemory(shm);

  std::cout << "\nPRODUCER COMPLETED SUCCESSFULLY" << std::endl;
  return 0;
}

int runConsumer(const Config& config) {
  std::cout << "=== SPMC Fuzz Test Consumer (C++) ===" << std::endl;
  std::cout << "Shared memory: " << config.shmName << std::endl;
  std::cout << "Entries expected: " << config.entries << std::endl;

  // Calculate total shared memory size
  int32_t ringBufMemSize = Xrpa::SpmcRingBuffer::getMemSize(config.blockSize, config.blockCount);
  int32_t totalSize = SHM_RINGBUF_OFFSET + ringBufMemSize;

  // Wait for shared memory to be created
  SharedMemory shm;
  int retries = 0;
  constexpr int maxRetries = 100;
  constexpr int retryDelayMs = 100;

  while (shm.ptr == nullptr && retries < maxRetries) {
    shm = openSharedMemory(config.shmName, totalSize, false);
    if (shm.ptr == nullptr) {
      std::this_thread::sleep_for(std::chrono::milliseconds(retryDelayMs));
      retries++;
    }
  }

  if (shm.ptr == nullptr) {
    std::cerr << "ERROR: Failed to open shared memory after " << maxRetries << " retries"
              << std::endl;
    return 1;
  }

  std::cout << "Connected to shared memory after " << retries << " retries" << std::endl;

  // Wait for magic number and version to be initialized
  // The producer creates the file first, then initializes the header
  auto* mem = static_cast<uint8_t*>(shm.ptr);
  uint32_t magic = 0;
  uint32_t version = 0;
  int magicRetries = 0;
  constexpr int maxMagicRetries = 100;
  constexpr int magicRetryDelayMs = 100;

  while (magicRetries < maxMagicRetries) {
    magic = *reinterpret_cast<uint32_t*>(mem + SHM_MAGIC_OFFSET);
    version = *reinterpret_cast<uint32_t*>(mem + SHM_VERSION_OFFSET);

    if (magic == MAGIC_NUMBER && version == VERSION) {
      break;
    }

    std::this_thread::sleep_for(std::chrono::milliseconds(magicRetryDelayMs));
    magicRetries++;
  }

  if (magic != MAGIC_NUMBER) {
    std::cerr << "ERROR: Invalid magic number: 0x" << std::hex << magic << std::dec << std::endl;
    closeSharedMemory(shm);
    return 1;
  }

  if (version != VERSION) {
    std::cerr << "ERROR: Version mismatch: expected " << VERSION << ", got " << version
              << std::endl;
    closeSharedMemory(shm);
    return 1;
  }

  std::cout << "Shared memory verified after " << magicRetries
            << " header retries. Starting reads..." << std::endl;

  // Create ring buffer accessor
  Xrpa::MemoryAccessor memAccessor(mem, 0, totalSize);
  Xrpa::SpmcRingBuffer ringBuffer(memAccessor, SHM_RINGBUF_OFFSET);
  Xrpa::SpmcRingBufferIterator iterator;

  if (ringBuffer.isNull()) {
    std::cerr << "ERROR: Ring buffer is null" << std::endl;
    closeSharedMemory(shm);
    return 1;
  }

  std::cout << "Ring buffer: blockSize=" << ringBuffer.getBlockSize()
            << ", blockCount=" << ringBuffer.getBlockCount()
            << ", maxDataSize=" << ringBuffer.getMaxDataSize() << std::endl;

  Statistics stats;
  int32_t expectedSequence = 0;
  int32_t maxPayloadSize = ringBuffer.getMaxDataSize() - ENTRY_HEADER_SIZE;
  std::vector<uint8_t> payloadBuffer(maxPayloadSize);
  auto startTime = std::chrono::steady_clock::now();

  constexpr int maxIdleMs = 10000; // 10 second timeout for no new data
  auto lastReadTime = std::chrono::steady_clock::now();

  while (stats.entriesRead < static_cast<uint32_t>(config.entries)) {
    // Check for missed entries
    if (iterator.hasMissedEntries(&ringBuffer)) {
      stats.missedEntries++;
      expectedSequence = -1; // Reset sequence tracking
    }

    // Try to read next entry
    if (iterator.hasNext(&ringBuffer)) {
      auto readStart = std::chrono::steady_clock::now();

      // Variables to capture data from callback
      uint32_t sequence = 0;
      uint32_t checksum = 0;
      Xrpa::ByteVector payload;
      bool validRead = false;

      bool readSuccess = iterator.readNext(&ringBuffer, [&](Xrpa::MemoryAccessor accessor) {
        Xrpa::MemoryOffset pos;
        sequence = accessor.readValue<uint32_t>(pos);
        checksum = accessor.readValue<uint32_t>(pos);
        payload = accessor.readValue<Xrpa::ByteVector>(pos);
        validRead = true;
      });

      auto readEnd = std::chrono::steady_clock::now();
      stats.readProcessingTimeUs +=
          std::chrono::duration_cast<std::chrono::microseconds>(readEnd - readStart).count();

      if (!readSuccess) {
        // Stale read - data was overwritten during read
        stats.staleReads++;
        if (config.verbose) {
          std::cout << "Stale read detected, ignoring" << std::endl;
        }
      } else if (!validRead) {
        // Callback didn't complete - shouldn't happen if readSuccess is true
        std::cerr << "ERROR: Read succeeded but callback didn't complete" << std::endl;
        stats.checksumErrors++;
      } else {
        // Valid read - now verify checksum
        int32_t payloadSize = payload.size();

        if (config.verbose) {
          std::cout << "Reading entry: seq=" << sequence << ", checksum=0x" << std::hex << checksum
                    << std::dec << ", payloadSize=" << payloadSize << std::endl;
        }

        uint32_t computedChecksum = computeChecksum(payload.data(), payloadSize);
        if (computedChecksum != checksum) {
          std::cerr << "ERROR: Checksum mismatch at sequence " << sequence << ": expected 0x"
                    << std::hex << checksum << ", got 0x" << computedChecksum << std::dec
                    << std::endl;
          stats.checksumErrors++;
        } else {
          // Verify sequence (if not reset)
          if (expectedSequence >= 0 && sequence != static_cast<uint32_t>(expectedSequence)) {
            if (config.verbose) {
              std::cerr << "SEQUENCE GAP: expected " << expectedSequence << ", got " << sequence
                        << std::endl;
            }
            stats.sequenceErrors++;
          }

          expectedSequence = static_cast<int32_t>(sequence) + 1;

          stats.entriesRead++;
          stats.totalPayloadBytes += payloadSize;
          stats.minPayloadSize = std::min(stats.minPayloadSize, static_cast<uint32_t>(payloadSize));
          stats.maxPayloadSize = std::max(stats.maxPayloadSize, static_cast<uint32_t>(payloadSize));
        }
      }

      lastReadTime = std::chrono::steady_clock::now();

      if (config.verbose && (stats.entriesRead % 1000 == 0)) {
        std::cout << "Read " << stats.entriesRead << " entries..." << std::endl;
      }
    } else {
      // No data available, check timeout
      auto now = std::chrono::steady_clock::now();
      auto idleMs =
          std::chrono::duration_cast<std::chrono::milliseconds>(now - lastReadTime).count();

      if (idleMs > maxIdleMs) {
        std::cerr << "TIMEOUT: No new data for " << idleMs << " ms" << std::endl;
        break;
      }

      std::this_thread::sleep_for(std::chrono::microseconds(100));
    }
  }

  auto endTime = std::chrono::steady_clock::now();
  auto durationMs =
      std::chrono::duration_cast<std::chrono::milliseconds>(endTime - startTime).count();

  std::cout << "\n=== Consumer Results ===" << std::endl;
  std::cout << "Entries read: " << stats.entriesRead << std::endl;
  std::cout << "Total payload bytes: " << stats.totalPayloadBytes << std::endl;
  if (stats.minPayloadSize != UINT32_MAX) {
    std::cout << "Payload size range: " << stats.minPayloadSize << " - " << stats.maxPayloadSize
              << " bytes" << std::endl;
  }
  std::cout << "Duration: " << durationMs << " ms" << std::endl;
  if (durationMs > 0) {
    std::cout << "Rate: " << (stats.entriesRead * 1000.0 / durationMs) << " entries/sec"
              << std::endl;
  }
  std::cout << "INTERNAL_LOOP_DURATION_MS: " << durationMs << std::endl;
  std::cout << "INTERNAL_READ_PROCESSING_MS: " << (stats.readProcessingTimeUs / 1000) << std::endl;
  std::cout << "\nError Summary:" << std::endl;
  std::cout << "  Checksum errors: " << stats.checksumErrors << std::endl;
  std::cout << "  Sequence gaps: " << stats.sequenceErrors << std::endl;
  std::cout << "  Missed entries (evictions): " << stats.missedEntries << std::endl;
  std::cout << "  Stale reads: " << stats.staleReads << std::endl;

  closeSharedMemory(shm);

  bool passed = (stats.checksumErrors == 0);
  if (passed) {
    std::cout << "\nCONSUMER PASSED" << std::endl;
    return 0;
  } else {
    std::cout << "\nCONSUMER FAILED" << std::endl;
    return 1;
  }
}

void printUsage(const char* programName) {
  std::cout << "Usage: " << programName << " --mode <producer|consumer> [options]" << std::endl;
  std::cout << "\nOptions:" << std::endl;
  std::cout << "  --mode <mode>      Mode: 'producer' or 'consumer' (required)" << std::endl;
  std::cout << "  --entries <n>      Number of entries to write/read (default: " << DEFAULT_ENTRIES
            << ")" << std::endl;
  std::cout << "  --block-size <n>   Block size in bytes (default: " << DEFAULT_BLOCK_SIZE << ")"
            << std::endl;
  std::cout << "  --block-count <n>  Number of blocks (default: " << DEFAULT_BLOCK_COUNT << ")"
            << std::endl;
  std::cout << "  --shm-name <name>  Shared memory name (default: xrpa_spmc_fuzz_test)"
            << std::endl;
  std::cout << "  --startup-delay <ms>  Delay before producer starts writing (default: 0)"
            << std::endl;
  std::cout << "  --verbose          Enable verbose output" << std::endl;
  std::cout << "  --help             Show this help" << std::endl;
}

Config parseArgs(int argc, char* argv[]) {
  Config config;

  for (int i = 1; i < argc; ++i) {
    std::string arg = argv[i];

    if (arg == "--mode" && i + 1 < argc) {
      config.mode = argv[++i];
    } else if (arg == "--entries" && i + 1 < argc) {
      config.entries = std::stoi(argv[++i]);
    } else if (arg == "--block-size" && i + 1 < argc) {
      config.blockSize = std::stoi(argv[++i]);
    } else if (arg == "--block-count" && i + 1 < argc) {
      config.blockCount = std::stoi(argv[++i]);
    } else if (arg == "--shm-name" && i + 1 < argc) {
      config.shmName = argv[++i];
    } else if (arg == "--startup-delay" && i + 1 < argc) {
      config.startupDelayMs = std::stoi(argv[++i]);
    } else if (arg == "--verbose") {
      config.verbose = true;
    } else if (arg == "--help") {
      printUsage(argv[0]);
      exit(0);
    }
  }

  return config;
}

} // namespace

int main(int argc, char* argv[]) {
  Config config = parseArgs(argc, argv);

  if (config.mode.empty()) {
    std::cerr << "ERROR: --mode is required" << std::endl;
    printUsage(argv[0]);
    return 1;
  }

  if (config.mode == "producer") {
    return runProducer(config);
  } else if (config.mode == "consumer") {
    return runConsumer(config);
  } else {
    std::cerr << "ERROR: Invalid mode '" << config.mode << "'. Use 'producer' or 'consumer'."
              << std::endl;
    return 1;
  }
}
