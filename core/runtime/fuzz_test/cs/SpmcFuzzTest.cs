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

// SPMC Ring Buffer Fuzz Test - C# Implementation
//
// Usage:
//   dotnet run -- --mode producer --entries 10000 --shm-name test
//   dotnet run -- --mode consumer --entries 10000 --shm-name test
//
// Data Protocol (per entry):
//   Offset | Size | Field
//   -------|------|------------------
//   0      | 4    | sequence (uint32, monotonically increasing)
//   4      | 4    | checksum (uint32, simple sum of payload bytes)
//   8      | 4    | payload_size (uint32, size of payload in bytes)
//   12     | ...  | payload (random bytes)

using System;
using System.Diagnostics;
using System.IO;
using System.IO.MemoryMappedFiles;
using System.Runtime.InteropServices;
using System.Threading;
using Xrpa;

namespace SpmcFuzzTest
{
    public class Program
    {
        // Configuration constants - defaults suitable for image data testing
        private const int DEFAULT_BLOCK_SIZE = 1024 * 1024; // 1MB blocks
        private const int DEFAULT_BLOCK_COUNT = 4;
        private const int DEFAULT_ENTRIES = 100;
        private const int WRITE_DELAY_MS = 1;
        private const uint MAGIC_NUMBER = 0x53504D43; // "SPMC"
        private const uint VERSION = 1;

        // Header offsets in shared memory
        private const int SHM_MAGIC_OFFSET = 0;
        private const int SHM_VERSION_OFFSET = 4;
        private const int SHM_RINGBUF_OFFSET = 8;

        // Entry header size (sequence + checksum + payload length prefix)
        private const int ENTRY_HEADER_SIZE = 12;

        // Payload size range (in blocks worth of data)
        private const float MIN_PAYLOAD_BLOCKS = 0.5f;
        private const float MAX_PAYLOAD_BLOCKS = 3.0f;

        private class Config
        {
            public string Mode { get; set; } = "";
            public string ShmName { get; set; } = "xrpa_spmc_fuzz_test";
            public int Entries { get; set; } = DEFAULT_ENTRIES;
            public int BlockSize { get; set; } = DEFAULT_BLOCK_SIZE;
            public int BlockCount { get; set; } = DEFAULT_BLOCK_COUNT;
            public int StartupDelayMs { get; set; } = 0;
            public bool Verbose { get; set; } = false;
        }

        private class Statistics
        {
            public uint EntriesWritten { get; set; } = 0;
            public uint EntriesRead { get; set; } = 0;
            public uint ChecksumErrors { get; set; } = 0;
            public uint SequenceErrors { get; set; } = 0;
            public uint MissedEntries { get; set; } = 0;
            public uint StaleReads { get; set; } = 0;
            public uint MinPayloadSize { get; set; } = uint.MaxValue;
            public uint MaxPayloadSize { get; set; } = 0;
            public ulong TotalPayloadBytes { get; set; } = 0;
            public long ReadProcessingTimeUs { get; set; } = 0;  // Time spent actually reading/processing (microseconds)
            public long WriteProcessingTimeUs { get; set; } = 0; // Time spent actually writing (microseconds)
        }

        private static uint ComputeChecksum(byte[] data, int size)
        {
            uint sum = 0;
            for (int i = 0; i < size; i++)
            {
                sum += data[i];
            }
            return sum;
        }

        private static string GetSharedMemoryPath(string name)
        {
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            {
                return name;
            }
            return $"/tmp/xrpa/{name}";
        }

        private static void CreateDirectories(string path)
        {
            if (!RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            {
                string? dir = Path.GetDirectoryName(path);
                if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
                {
                    Directory.CreateDirectory(dir);
                }
            }
        }

        private static void DeleteSharedMemory(string name)
        {
            if (!RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            {
                string path = GetSharedMemoryPath(name);
                if (File.Exists(path))
                {
                    File.Delete(path);
                }
            }
        }

        private static unsafe int RunProducer(Config config)
        {
            Console.WriteLine("=== SPMC Fuzz Test Producer (C#) ===");
            Console.WriteLine($"Shared memory: {config.ShmName}");
            Console.WriteLine($"Entries to write: {config.Entries}");

            int ringBufMemSize = SpmcRingBuffer.GetMemSize(config.BlockSize, config.BlockCount);
            int totalSize = SHM_RINGBUF_OFFSET + ringBufMemSize;

            Console.WriteLine($"Ring buffer: {config.BlockCount} blocks x {config.BlockSize} bytes");
            Console.WriteLine($"Total shared memory size: {totalSize} bytes");

            // Clean up any existing shared memory
            DeleteSharedMemory(config.ShmName);

            MemoryMappedFile? mmf = null;
            MemoryMappedViewAccessor? accessor = null;

            try
            {
                if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
                {
                    mmf = MemoryMappedFile.CreateOrOpen(config.ShmName, totalSize);
                }
                else
                {
                    string path = GetSharedMemoryPath(config.ShmName);
                    CreateDirectories(path);
                    FileStream fs = new FileStream(path, FileMode.Create, FileAccess.ReadWrite, FileShare.ReadWrite);
                    fs.SetLength(totalSize);
                    mmf = MemoryMappedFile.CreateFromFile(fs, null, totalSize, MemoryMappedFileAccess.ReadWrite, HandleInheritability.None, false);
                }

                accessor = mmf.CreateViewAccessor(0, totalSize);
                byte* memPtr = null;
                accessor.SafeMemoryMappedViewHandle.AcquirePointer(ref memPtr);

                // Initialize ring buffer BEFORE writing magic number
                // This ensures consumers see the magic number only after ring buffer is ready
                MemoryAccessor memAccessor = new MemoryAccessor(memPtr, 0, totalSize);
                SpmcRingBuffer ringBuffer = new SpmcRingBuffer(memAccessor, SHM_RINGBUF_OFFSET);
                ringBuffer.Init(config.BlockSize, config.BlockCount);

                // Now write the magic number and version to signal initialization is complete
                *(uint*)(memPtr + SHM_MAGIC_OFFSET) = MAGIC_NUMBER;
                *(uint*)(memPtr + SHM_VERSION_OFFSET) = VERSION;

                // Flush changes
                accessor.Flush();

                Console.WriteLine("Shared memory initialized. Starting writes...");

                // Startup delay to allow consumers to connect
                if (config.StartupDelayMs > 0)
                {
                    Console.WriteLine($"Waiting {config.StartupDelayMs}ms for consumers to connect...");
                    Thread.Sleep(config.StartupDelayMs);
                }

                // Random number generator
                Random rng = new Random();
                int dataPerBlock = config.BlockSize - SpmcRingBuffer.BLOCK_HEADER_SIZE;
                int minPayloadSize = (int)(MIN_PAYLOAD_BLOCKS * dataPerBlock);
                int maxPayloadSize = (int)(MAX_PAYLOAD_BLOCKS * dataPerBlock);
                // Clamp to max that fits in ring buffer
                int maxPossible = ringBuffer.MaxDataSize - ENTRY_HEADER_SIZE;
                maxPayloadSize = Math.Min(maxPayloadSize, maxPossible);

                Statistics stats = new Statistics();
                byte[] payloadBuffer = new byte[maxPayloadSize];
                Stopwatch stopwatch = Stopwatch.StartNew();

                for (int seq = 0; seq < config.Entries; seq++)
                {
                    // Generate random payload
                    int payloadSize = rng.Next(minPayloadSize, maxPayloadSize + 1);
                    rng.NextBytes(payloadBuffer);

                    // Compute checksum
                    uint checksum = ComputeChecksum(payloadBuffer, payloadSize);

                    // Total entry size
                    int entrySize = ENTRY_HEADER_SIZE + payloadSize;

                    // Write entry to ring buffer
                    Stopwatch writeTimer = Stopwatch.StartNew();
                    bool success = ringBuffer.Write(entrySize, (MemoryAccessor dataAccessor) =>
                    {
                        MemoryOffset pos = new MemoryOffset();
                        dataAccessor.WriteUint((uint)seq, pos);
                        dataAccessor.WriteUint(checksum, pos);
                        dataAccessor.WriteBytes(payloadBuffer, 0, payloadSize, pos);
                    });
                    writeTimer.Stop();
                    stats.WriteProcessingTimeUs += writeTimer.ElapsedTicks * 1000000 / Stopwatch.Frequency;

                    if (!success)
                    {
                        Console.Error.WriteLine($"ERROR: Failed to write entry {seq}");
                        return 1;
                    }

                    // Flush changes
                    accessor.Flush();

                    stats.EntriesWritten++;
                    stats.TotalPayloadBytes += (ulong)payloadSize;
                    stats.MinPayloadSize = Math.Min(stats.MinPayloadSize, (uint)payloadSize);
                    stats.MaxPayloadSize = Math.Max(stats.MaxPayloadSize, (uint)payloadSize);

                    if (config.Verbose && (seq % 1000 == 0))
                    {
                        Console.WriteLine($"Written {seq} entries...");
                    }

                    // Small delay to avoid overwhelming consumers
                    Thread.Sleep(WRITE_DELAY_MS);
                }

                stopwatch.Stop();
                long durationMs = stopwatch.ElapsedMilliseconds;

                Console.WriteLine("\n=== Producer Results ===");
                Console.WriteLine($"Entries written: {stats.EntriesWritten}");
                Console.WriteLine($"Total payload bytes: {stats.TotalPayloadBytes}");
                Console.WriteLine($"Payload size range: {stats.MinPayloadSize} - {stats.MaxPayloadSize} bytes");
                Console.WriteLine($"Duration: {durationMs} ms");
                Console.WriteLine($"Rate: {stats.EntriesWritten * 1000.0 / durationMs:F2} entries/sec");
                Console.WriteLine($"INTERNAL_LOOP_DURATION_MS: {durationMs}");
                Console.WriteLine($"INTERNAL_WRITE_PROCESSING_MS: {stats.WriteProcessingTimeUs / 1000}");

                Console.WriteLine("\nPRODUCER COMPLETED SUCCESSFULLY");
                return 0;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"ERROR: {ex.Message}");
                return 1;
            }
            finally
            {
                accessor?.Dispose();
                mmf?.Dispose();
            }
        }

        private static unsafe int RunConsumer(Config config)
        {
            Console.WriteLine("=== SPMC Fuzz Test Consumer (C#) ===");
            Console.WriteLine($"Shared memory: {config.ShmName}");
            Console.WriteLine($"Entries expected: {config.Entries}");

            int ringBufMemSize = SpmcRingBuffer.GetMemSize(config.BlockSize, config.BlockCount);
            int totalSize = SHM_RINGBUF_OFFSET + ringBufMemSize;

            MemoryMappedFile? mmf = null;
            MemoryMappedViewAccessor? accessor = null;

            // Wait for shared memory to be created
            const int maxRetries = 100;
            const int retryDelayMs = 100;
            int retries = 0;

            while (mmf == null && retries < maxRetries)
            {
                try
                {
                    if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
                    {
                        mmf = MemoryMappedFile.OpenExisting(config.ShmName);
                    }
                    else
                    {
                        string path = GetSharedMemoryPath(config.ShmName);
                        if (File.Exists(path))
                        {
                            FileStream fs = new FileStream(path, FileMode.Open, FileAccess.ReadWrite, FileShare.ReadWrite);
                            mmf = MemoryMappedFile.CreateFromFile(fs, null, totalSize, MemoryMappedFileAccess.ReadWrite, HandleInheritability.None, false);
                        }
                    }
                }
                catch
                {
                    // Ignore and retry
                }

                if (mmf == null)
                {
                    Thread.Sleep(retryDelayMs);
                    retries++;
                }
            }

            if (mmf == null)
            {
                Console.Error.WriteLine($"ERROR: Failed to open shared memory after {maxRetries} retries");
                return 1;
            }

            Console.WriteLine($"Connected to shared memory after {retries} retries");

            try
            {
                accessor = mmf.CreateViewAccessor(0, totalSize);
                byte* memPtr = null;
                accessor.SafeMemoryMappedViewHandle.AcquirePointer(ref memPtr);

                // Wait for magic number and version to be initialized
                // The producer creates the file first, then initializes the header
                uint magic = 0;
                uint version = 0;
                int magicRetries = 0;
                const int maxMagicRetries = 100;
                const int magicRetryDelayMs = 100;

                while (magicRetries < maxMagicRetries)
                {
                    magic = *(uint*)(memPtr + SHM_MAGIC_OFFSET);
                    version = *(uint*)(memPtr + SHM_VERSION_OFFSET);

                    if (magic == MAGIC_NUMBER && version == VERSION)
                    {
                        break;
                    }

                    Thread.Sleep(magicRetryDelayMs);
                    magicRetries++;
                }

                if (magic != MAGIC_NUMBER)
                {
                    Console.Error.WriteLine($"ERROR: Invalid magic number: 0x{magic:X8}");
                    return 1;
                }

                if (version != VERSION)
                {
                    Console.Error.WriteLine($"ERROR: Version mismatch: expected {VERSION}, got {version}");
                    return 1;
                }

                Console.WriteLine($"Shared memory verified after {magicRetries} header retries. Starting reads...");

                // Create ring buffer accessor
                MemoryAccessor memAccessor = new MemoryAccessor(memPtr, 0, totalSize);
                SpmcRingBuffer ringBuffer = new SpmcRingBuffer(memAccessor, SHM_RINGBUF_OFFSET);
                SpmcRingBufferIterator iterator = new SpmcRingBufferIterator();

                if (ringBuffer.IsNull())
                {
                    Console.Error.WriteLine("ERROR: Ring buffer is null");
                    return 1;
                }

                Console.WriteLine($"Ring buffer: blockSize={ringBuffer.BlockSize}, blockCount={ringBuffer.BlockCount}, maxDataSize={ringBuffer.MaxDataSize}");

                Statistics stats = new Statistics();
                int expectedSequence = 0;
                Stopwatch stopwatch = Stopwatch.StartNew();

                const int maxIdleMs = 10000; // 10 second timeout for no new data
                Stopwatch lastReadTime = Stopwatch.StartNew();

                while (stats.EntriesRead < (uint)config.Entries)
                {
                    // Check for missed entries
                    if (iterator.HasMissedEntries(ringBuffer))
                    {
                        stats.MissedEntries++;
                        expectedSequence = -1; // Reset sequence tracking
                    }

                    // Try to read next entry
                    if (iterator.HasNext(ringBuffer))
                    {
                        Stopwatch readTimer = Stopwatch.StartNew();

                        // Variables to capture data from callback
                        uint sequence = 0;
                        uint checksum = 0;
                        byte[] payload = null;
                        bool validRead = false;

                        bool readSuccess = iterator.ReadNext(ringBuffer, (MemoryAccessor dataAccessor) =>
                        {
                            MemoryOffset pos = new MemoryOffset();
                            sequence = dataAccessor.ReadUint(pos);
                            checksum = dataAccessor.ReadUint(pos);
                            payload = dataAccessor.ReadBytes(pos);
                            validRead = true;
                        });

                        readTimer.Stop();
                        stats.ReadProcessingTimeUs += readTimer.ElapsedTicks * 1000000 / Stopwatch.Frequency;

                        if (!readSuccess)
                        {
                            // Stale read - data was overwritten during read
                            stats.StaleReads++;
                            if (config.Verbose)
                            {
                                Console.WriteLine("Stale read detected, ignoring");
                            }
                        }
                        else if (!validRead)
                        {
                            // Callback didn't complete - shouldn't happen if readSuccess is true
                            Console.Error.WriteLine("ERROR: Read succeeded but callback didn't complete");
                            stats.ChecksumErrors++;
                        }
                        else
                        {
                            // Valid read - now verify checksum
                            uint payloadSize = (uint)payload.Length;

                            if (config.Verbose)
                            {
                                Console.WriteLine($"Reading entry: seq={sequence}, checksum=0x{checksum:X8}, payloadSize={payloadSize}");
                            }

                            uint computedChecksum = ComputeChecksum(payload, (int)payloadSize);
                            if (computedChecksum != checksum)
                            {
                                Console.Error.WriteLine($"ERROR: Checksum mismatch at sequence {sequence}: expected 0x{checksum:X8}, got 0x{computedChecksum:X8}");
                                stats.ChecksumErrors++;
                            }
                            else
                            {
                                // Verify sequence (if not reset)
                                if (expectedSequence >= 0 && sequence != (uint)expectedSequence)
                                {
                                    if (config.Verbose)
                                    {
                                        Console.Error.WriteLine($"SEQUENCE GAP: expected {expectedSequence}, got {sequence}");
                                    }
                                    stats.SequenceErrors++;
                                }

                                expectedSequence = (int)sequence + 1;

                                stats.EntriesRead++;
                                stats.TotalPayloadBytes += payloadSize;
                                stats.MinPayloadSize = Math.Min(stats.MinPayloadSize, payloadSize);
                                stats.MaxPayloadSize = Math.Max(stats.MaxPayloadSize, payloadSize);
                            }
                        }

                        lastReadTime.Restart();

                        if (config.Verbose && (stats.EntriesRead % 1000 == 0))
                        {
                            Console.WriteLine($"Read {stats.EntriesRead} entries...");
                        }
                    }
                    else
                    {
                        // No data available, check timeout
                        long idleMs = lastReadTime.ElapsedMilliseconds;

                        if (idleMs > maxIdleMs)
                        {
                            Console.Error.WriteLine($"TIMEOUT: No new data for {idleMs} ms");
                            break;
                        }

                        Thread.Sleep(0);
                    }
                }

                stopwatch.Stop();
                long durationMs = stopwatch.ElapsedMilliseconds;

                Console.WriteLine("\n=== Consumer Results ===");
                Console.WriteLine($"Entries read: {stats.EntriesRead}");
                Console.WriteLine($"Total payload bytes: {stats.TotalPayloadBytes}");
                if (stats.MinPayloadSize != uint.MaxValue)
                {
                    Console.WriteLine($"Payload size range: {stats.MinPayloadSize} - {stats.MaxPayloadSize} bytes");
                }
                Console.WriteLine($"Duration: {durationMs} ms");
                if (durationMs > 0)
                {
                    Console.WriteLine($"Rate: {stats.EntriesRead * 1000.0 / durationMs:F2} entries/sec");
                }
                Console.WriteLine($"INTERNAL_LOOP_DURATION_MS: {durationMs}");
                Console.WriteLine($"INTERNAL_READ_PROCESSING_MS: {stats.ReadProcessingTimeUs / 1000}");
                Console.WriteLine("\nError Summary:");
                Console.WriteLine($"  Checksum errors: {stats.ChecksumErrors}");
                Console.WriteLine($"  Sequence gaps: {stats.SequenceErrors}");
                Console.WriteLine($"  Missed entries (evictions): {stats.MissedEntries}");
                Console.WriteLine($"  Stale reads: {stats.StaleReads}");

                bool passed = stats.ChecksumErrors == 0;
                if (passed)
                {
                    Console.WriteLine("\nCONSUMER PASSED");
                    return 0;
                }
                else
                {
                    Console.WriteLine("\nCONSUMER FAILED");
                    return 1;
                }
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"ERROR: {ex.Message}");
                return 1;
            }
            finally
            {
                accessor?.Dispose();
                mmf?.Dispose();
            }
        }

        private static void PrintUsage(string programName)
        {
            Console.WriteLine($"Usage: {programName} --mode <producer|consumer> [options]");
            Console.WriteLine("\nOptions:");
            Console.WriteLine("  --mode <mode>      Mode: 'producer' or 'consumer' (required)");
            Console.WriteLine($"  --entries <n>      Number of entries to write/read (default: {DEFAULT_ENTRIES})");
            Console.WriteLine($"  --block-size <n>   Block size in bytes (default: {DEFAULT_BLOCK_SIZE})");
            Console.WriteLine($"  --block-count <n>  Number of blocks (default: {DEFAULT_BLOCK_COUNT})");
            Console.WriteLine("  --shm-name <name>  Shared memory name (default: xrpa_spmc_fuzz_test)");
            Console.WriteLine("  --startup-delay <ms>  Delay before producer starts writing (default: 0)");
            Console.WriteLine("  --verbose          Enable verbose output");
            Console.WriteLine("  --help             Show this help");
        }

        private static Config ParseArgs(string[] args)
        {
            Config config = new Config();

            for (int i = 0; i < args.Length; i++)
            {
                string arg = args[i];

                if (arg == "--mode" && i + 1 < args.Length)
                {
                    config.Mode = args[++i];
                }
                else if (arg == "--entries" && i + 1 < args.Length)
                {
                    config.Entries = int.Parse(args[++i]);
                }
                else if (arg == "--block-size" && i + 1 < args.Length)
                {
                    config.BlockSize = int.Parse(args[++i]);
                }
                else if (arg == "--block-count" && i + 1 < args.Length)
                {
                    config.BlockCount = int.Parse(args[++i]);
                }
                else if (arg == "--shm-name" && i + 1 < args.Length)
                {
                    config.ShmName = args[++i];
                }
                else if (arg == "--startup-delay" && i + 1 < args.Length)
                {
                    config.StartupDelayMs = int.Parse(args[++i]);
                }
                else if (arg == "--verbose")
                {
                    config.Verbose = true;
                }
                else if (arg == "--help")
                {
                    PrintUsage("SpmcFuzzTest");
                    Environment.Exit(0);
                }
            }

            return config;
        }

        public static int Main(string[] args)
        {
            Config config = ParseArgs(args);

            if (string.IsNullOrEmpty(config.Mode))
            {
                Console.Error.WriteLine("ERROR: --mode is required");
                PrintUsage("SpmcFuzzTest");
                return 1;
            }

            if (config.Mode == "producer")
            {
                return RunProducer(config);
            }
            else if (config.Mode == "consumer")
            {
                return RunConsumer(config);
            }
            else
            {
                Console.Error.WriteLine($"ERROR: Invalid mode '{config.Mode}'. Use 'producer' or 'consumer'.");
                return 1;
            }
        }
    }
}
