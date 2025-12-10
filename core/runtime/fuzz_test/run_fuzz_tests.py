#!/usr/bin/env python3
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
SPMC Ring Buffer Fuzz Test Dispatcher

This script orchestrates fuzz testing of the SPMC ring buffer across different
language implementations (C++, C#, Python). It runs all 9 permutations of
producer/consumer language pairs and reports results.

Usage:
    python run_fuzz_tests.py                           # Run all permutations
    python run_fuzz_tests.py --entries 1000           # Quick test with fewer entries
    python run_fuzz_tests.py --producer cpp --consumer python  # Single permutation
    python run_fuzz_tests.py --consumers 3            # Test with multiple consumers
    python run_fuzz_tests.py --skip-build             # Skip building (use existing binaries)
"""

import argparse
import os
import subprocess
import sys
import time
from concurrent.futures import as_completed, ThreadPoolExecutor
from dataclasses import dataclass, field
from enum import Enum
from io import StringIO
from pathlib import Path
from typing import Optional


class Language(Enum):
    CPP = "cpp"
    CS = "cs"
    PYTHON = "python"


@dataclass
class TestConfig:
    entries: int = 100
    block_size: int = 1024 * 1024  # 1MB default
    block_count: int = 4
    producer: Optional[Language] = None
    consumer: Optional[Language] = None
    num_consumers: int = 1
    startup_delay_ms: int = 2000  # 2 second default startup delay
    parallel: bool = True  # Run tests in parallel by default
    verbose: bool = False
    skip_build: bool = False
    timeout: int = 300  # 5 minute timeout per test


@dataclass
class TestResult:
    producer: Language
    consumer: Language
    passed: bool
    skipped: bool = False
    skip_reason: str = ""
    producer_exit_code: int = 0
    consumer_exit_codes: list[int] = field(default_factory=list)
    duration_ms: float = 0.0
    producer_loop_ms: float = 0.0  # Internal loop timing from producer
    consumer_loop_ms: float = 0.0  # Internal loop timing from consumer (first consumer)
    producer_processing_ms: float = 0.0  # Write processing time from producer
    consumer_processing_ms: float = 0.0  # Read processing time from consumer
    error_message: str = ""
    log_output: str = ""  # Buffered log output for parallel execution


# Buck target paths
BUCK_TARGETS = {
    Language.CPP: "//arvr/libraries/xred/xrpa/core/runtime/fuzz_test:cpp_spmc_fuzz_test",
    Language.CS: "//arvr/libraries/xred/xrpa/core/runtime/fuzz_test:cs_spmc_fuzz_test",
    Language.PYTHON: "//arvr/libraries/xred/xrpa/core/runtime/fuzz_test:python_spmc_fuzz_test",
}

# Display names for output
LANGUAGE_NAMES = {
    Language.CPP: "C++",
    Language.CS: "C#",
    Language.PYTHON: "Python",
}

# ANSI color codes for terminal output
COLORS = {
    "green": "\033[92m",
    "red": "\033[91m",
    "yellow": "\033[93m",
    "blue": "\033[94m",
    "bold": "\033[1m",
    "reset": "\033[0m",
}


def colorize(text: str, color: str) -> str:
    """Add ANSI color codes to text."""
    if not sys.stdout.isatty():
        return text
    return f"{COLORS.get(color, '')}{text}{COLORS['reset']}"


def print_header(text: str) -> None:
    """Print a formatted header."""
    print("\n" + "=" * 60)
    print(colorize(f"  {text}", "bold"))
    print("=" * 60)


def print_subheader(text: str) -> None:
    """Print a formatted subheader."""
    print(f"\n--- {text} ---")


def get_shared_memory_path(name: str) -> str:
    """Get platform-specific shared memory path."""
    if sys.platform == "win32":
        return name
    return f"/tmp/xrpa/{name}"


def cleanup_shared_memory(name: str) -> None:
    """Clean up any existing shared memory."""
    if sys.platform != "win32":
        path = get_shared_memory_path(name)
        if os.path.exists(path):
            try:
                os.unlink(path)
                print(f"  Cleaned up shared memory: {path}")
            except OSError as e:
                print(f"  Warning: Could not clean up {path}: {e}")

        # Also clean up parent directory if empty
        parent = Path(path).parent
        if parent.exists() and not any(parent.iterdir()):
            try:
                parent.rmdir()
            except OSError:
                pass


def build_targets(languages: list[Language], verbose: bool = False) -> bool:
    """Build all required Buck targets."""
    print_header("Building Test Binaries")

    targets = [BUCK_TARGETS[lang] for lang in languages]

    print(f"  Building {len(targets)} target(s):")
    for target in targets:
        print(f"    - {target}")

    cmd = ["buck", "build"] + targets

    try:
        result = subprocess.run(
            cmd,
            capture_output=not verbose,
            text=True,
            timeout=600,  # 10 minute build timeout
        )
        if result.returncode != 0:
            print(colorize("  BUILD FAILED", "red"))
            if not verbose and result.stderr:
                print(result.stderr[:1000])
            return False
        print(colorize("  BUILD SUCCEEDED", "green"))
        return True
    except subprocess.TimeoutExpired:
        print(colorize("  BUILD TIMEOUT", "red"))
        return False
    except Exception as e:
        print(colorize(f"  BUILD ERROR: {e}", "red"))
        return False


def get_run_command(language: Language) -> list[str]:
    """Get the command to run the test binary for a language.

    Returns a list of command arguments. Uses buck run with the appropriate target.
    """
    target = BUCK_TARGETS[language]

    if language == Language.CS:
        # C# binaries use a _run target since csharp_binary_dotnet doesn't support buck run directly
        return ["buck", "run", f"{target}_run", "--"]

    # For C++ and Python, use buck run directly
    return ["buck", "run", target, "--"]


def parse_internal_loop_duration(output: str) -> float:
    """Parse the internal loop duration from process output."""
    for line in output.split("\n"):
        if "INTERNAL_LOOP_DURATION_MS:" in line:
            try:
                return float(line.split(":")[1].strip())
            except (ValueError, IndexError):
                pass
    return 0.0


def parse_processing_time(output: str, key: str) -> float:
    """Parse the processing time from process output."""
    for line in output.split("\n"):
        if key in line:
            try:
                return float(line.split(":")[1].strip())
            except (ValueError, IndexError):
                pass
    return 0.0


def run_test_permutation(
    producer_lang: Language,
    consumer_lang: Language,
    config: TestConfig,
    buffer_output: bool = False,
) -> TestResult:
    """Run a single producer/consumer language permutation.

    Args:
        producer_lang: Producer language
        consumer_lang: Consumer language
        config: Test configuration
        buffer_output: If True, capture output to result.log_output instead of printing
    """
    result = TestResult(
        producer=producer_lang,
        consumer=consumer_lang,
        passed=False,
        consumer_exit_codes=[],
    )

    # Use StringIO to buffer output when running in parallel
    if buffer_output:
        output_buffer = StringIO()

        def log(msg: str = "") -> None:
            output_buffer.write(msg + "\n")
    else:

        def log(msg: str = "") -> None:
            print(msg)

    shm_name = f"fuzz_test_{producer_lang.value}_{consumer_lang.value}_{os.getpid()}"

    log(
        f"\n--- {LANGUAGE_NAMES[producer_lang]} Producer → {LANGUAGE_NAMES[consumer_lang]} Consumer ---"
    )
    log(f"  Shared memory: {shm_name}")
    log(f"  Entries: {config.entries}")
    log(f"  Consumers: {config.num_consumers}")

    # Clean up any existing shared memory (don't log cleanup in buffered mode)
    if not buffer_output:
        cleanup_shared_memory(shm_name)
    else:
        # Silent cleanup
        if sys.platform != "win32":
            path = get_shared_memory_path(shm_name)
            if os.path.exists(path):
                try:
                    os.unlink(path)
                except OSError:
                    pass

    producer_cmd = get_run_command(producer_lang)
    consumer_cmd = get_run_command(consumer_lang)

    # Build command arguments
    producer_args = producer_cmd + [
        "--mode",
        "producer",
        "--entries",
        str(config.entries),
        "--block-size",
        str(config.block_size),
        "--block-count",
        str(config.block_count),
        "--shm-name",
        shm_name,
        "--startup-delay",
        str(config.startup_delay_ms),
    ]
    if config.verbose:
        producer_args.append("--verbose")

    consumer_args = consumer_cmd + [
        "--mode",
        "consumer",
        "--entries",
        str(config.entries),
        "--block-size",
        str(config.block_size),
        "--block-count",
        str(config.block_count),
        "--shm-name",
        shm_name,
    ]
    if config.verbose:
        consumer_args.append("--verbose")

    start_time = time.perf_counter()
    producer_proc: Optional[subprocess.Popen] = None
    consumer_procs: list[subprocess.Popen] = []

    try:
        # Start consumer(s) first - they will wait for shared memory
        log("  Starting consumer(s)...")
        for i in range(config.num_consumers):
            proc = subprocess.Popen(
                consumer_args,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
            )
            consumer_procs.append(proc)
            if config.verbose:
                log(f"    Consumer {i + 1} started (PID: {proc.pid})")

        # Small delay to let consumers start waiting for shared memory
        time.sleep(0.1)

        # Start producer
        log("  Starting producer...")
        producer_proc = subprocess.Popen(
            producer_args,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
        )
        if config.verbose:
            log(f"    Producer started (PID: {producer_proc.pid})")

        # Wait for producer to complete
        log("  Waiting for producer...")
        producer_stdout, _ = producer_proc.communicate(timeout=config.timeout)
        result.producer_exit_code = producer_proc.returncode
        result.producer_loop_ms = parse_internal_loop_duration(producer_stdout)
        result.producer_processing_ms = parse_processing_time(
            producer_stdout, "INTERNAL_WRITE_PROCESSING_MS:"
        )

        if config.verbose:
            log("\n  Producer output:")
            for line in producer_stdout.strip().split("\n"):
                log(f"    {line}")
        elif "PRODUCER COMPLETED SUCCESSFULLY" in producer_stdout:
            log("    Producer completed successfully")
        else:
            log(f"    Producer exited with code {result.producer_exit_code}")
            # Show last few lines on failure
            lines = producer_stdout.strip().split("\n")
            for line in lines[-5:]:
                log(f"    {line}")

        # Wait for consumers to complete
        log("  Waiting for consumer(s)...")
        for i, proc in enumerate(consumer_procs):
            consumer_stdout, _ = proc.communicate(timeout=config.timeout)
            result.consumer_exit_codes.append(proc.returncode)

            # Parse internal loop duration from first consumer
            if i == 0:
                result.consumer_loop_ms = parse_internal_loop_duration(consumer_stdout)
                result.consumer_processing_ms = parse_processing_time(
                    consumer_stdout, "INTERNAL_READ_PROCESSING_MS:"
                )

            if config.verbose:
                log(f"\n  Consumer {i + 1} output:")
                for line in consumer_stdout.strip().split("\n"):
                    log(f"    {line}")
            else:
                if "CONSUMER PASSED" in consumer_stdout:
                    log(f"    Consumer {i + 1} PASSED")
                elif "CONSUMER FAILED" in consumer_stdout:
                    log(f"    Consumer {i + 1} FAILED")
                    # Show error details
                    for line in consumer_stdout.strip().split("\n"):
                        if "ERROR" in line or "error" in line.lower():
                            log(f"      {line}")
                else:
                    log(f"    Consumer {i + 1} exited with code {proc.returncode}")

    except subprocess.TimeoutExpired:
        result.error_message = "Test timed out"
        log(colorize(f"  TIMEOUT after {config.timeout}s", "red"))

        # Terminate any running processes
        if producer_proc and producer_proc.poll() is None:
            producer_proc.terminate()
        for proc in consumer_procs:
            if proc.poll() is None:
                proc.terminate()

    except Exception as e:
        result.error_message = str(e)
        log(colorize(f"  ERROR: {e}", "red"))

    finally:
        # Clean up shared memory
        if not buffer_output:
            cleanup_shared_memory(shm_name)
        else:
            # Silent cleanup
            if sys.platform != "win32":
                path = get_shared_memory_path(shm_name)
                if os.path.exists(path):
                    try:
                        os.unlink(path)
                        log(f"  Cleaned up shared memory: {path}")
                    except OSError:
                        pass

    end_time = time.perf_counter()
    result.duration_ms = (end_time - start_time) * 1000

    # Determine pass/fail
    producer_passed = result.producer_exit_code == 0
    consumers_passed = all(code == 0 for code in result.consumer_exit_codes)
    result.passed = producer_passed and consumers_passed and not result.error_message

    status = colorize("PASSED", "green") if result.passed else colorize("FAILED", "red")
    loop_time = max(result.producer_loop_ms, result.consumer_loop_ms)
    proc_time = result.producer_processing_ms + result.consumer_processing_ms
    log(
        f"\n  Result: {status} (total: {result.duration_ms:.0f} ms, "
        f"loop: {loop_time:.0f} ms, processing: {proc_time:.0f} ms)"
    )

    # Store buffered output if we were buffering
    if buffer_output:
        result.log_output = output_buffer.getvalue()

    return result


def run_all_tests(config: TestConfig) -> list[TestResult]:
    """Run all test permutations."""
    results: list[TestResult] = []

    # Determine which languages to test
    if config.producer and config.consumer:
        # Single permutation
        producers = [config.producer]
        consumers = [config.consumer]
    else:
        # All permutations
        producers = list(Language)
        consumers = list(Language)

    # Build if needed
    if not config.skip_build:
        all_languages = set(producers) | set(consumers)
        if not build_targets(list(all_languages), config.verbose):
            print(colorize("\nBuild failed - cannot run tests", "red"))
            return results

    # Build list of test permutations
    permutations = [
        (producer_lang, consumer_lang)
        for producer_lang in producers
        for consumer_lang in consumers
    ]

    print_header("Running Fuzz Tests")
    print(f"  Entries per test: {config.entries}")
    print(f"  Consumers per test: {config.num_consumers}")
    print(f"  Total permutations: {len(permutations)}")
    print(f"  Parallel execution: {config.parallel}")

    if config.parallel and len(permutations) > 1:
        # Run tests in parallel using ThreadPoolExecutor
        # Use number of permutations as max workers (they're mostly I/O bound)
        max_workers = len(permutations)
        print(f"  Max parallel workers: {max_workers}")
        print(
            "\n  Running tests in parallel (output will be shown after completion)..."
        )

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all tests with buffer_output=True
            future_to_permutation = {
                executor.submit(
                    run_test_permutation,
                    producer_lang,
                    consumer_lang,
                    config,
                    True,  # buffer_output=True for parallel execution
                ): (producer_lang, consumer_lang)
                for producer_lang, consumer_lang in permutations
            }

            # Collect results as they complete
            for future in as_completed(future_to_permutation):
                result = future.result()
                results.append(result)

        # Sort results by producer then consumer for consistent display order
        results.sort(
            key=lambda r: (
                list(Language).index(r.producer),
                list(Language).index(r.consumer),
            )
        )

        # Print buffered logs in order
        for result in results:
            if result.log_output:
                print(result.log_output, end="")
    else:
        # Run tests sequentially (no buffering needed)
        for producer_lang, consumer_lang in permutations:
            result = run_test_permutation(producer_lang, consumer_lang, config, False)
            results.append(result)

    return results


def print_summary(results: list[TestResult]) -> bool:
    """Print test summary and return overall pass/fail."""
    print_header("Test Summary")

    passed_count = sum(1 for r in results if r.passed)
    skipped_count = sum(1 for r in results if r.skipped)
    failed_count = len(results) - passed_count - skipped_count
    total_duration_ms = sum(r.duration_ms for r in results)

    # Print table
    print(
        f"\n  {'Producer':<10} {'Consumer':<10} {'Result':<10} "
        f"{'Total':<10} {'Loop':<10} {'Write':<10} {'Read':<10}"
    )
    print("  " + "-" * 73)

    for result in results:
        producer = LANGUAGE_NAMES[result.producer]
        consumer = LANGUAGE_NAMES[result.consumer]
        if result.skipped:
            status = colorize("SKIPPED".ljust(10), "yellow")
        elif result.passed:
            status = colorize("PASSED".ljust(10), "green")
        else:
            status = colorize("FAILED".ljust(10), "red")
        duration = f"{result.duration_ms:.0f} ms"
        loop_time = max(result.producer_loop_ms, result.consumer_loop_ms)
        loop_str = f"{loop_time:.0f} ms"
        write_str = f"{result.producer_processing_ms:.0f} ms"
        read_str = f"{result.consumer_processing_ms:.0f} ms"
        print(
            f"  {producer:<10} {consumer:<10} {status} "
            f"{duration:<10} {loop_str:<10} {write_str:<10} {read_str:<10}"
        )

    print("  " + "-" * 73)
    print(
        f"\n  Total: {passed_count} passed, {failed_count} failed, {skipped_count} skipped"
    )
    print(f"  Duration: {total_duration_ms / 1000:.1f} seconds")

    if failed_count > 0:
        print(colorize("\n  SOME TESTS FAILED", "red"))
        return False
    elif skipped_count > 0 and passed_count == 0:
        print(colorize("\n  ALL TESTS SKIPPED", "yellow"))
        return True
    else:
        print(colorize("\n  ALL TESTS PASSED", "green"))
        return True


def parse_args() -> TestConfig:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="SPMC Ring Buffer Fuzz Test Dispatcher",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run_fuzz_tests.py                           # Run all 9 permutations
  python run_fuzz_tests.py --entries 1000           # Quick test
  python run_fuzz_tests.py --producer cpp --consumer python
  python run_fuzz_tests.py --consumers 3            # Multiple consumers
""",
    )

    parser.add_argument(
        "--entries",
        type=int,
        default=100,
        help="Number of entries to write/read (default: 100)",
    )

    parser.add_argument(
        "--block-size",
        type=int,
        default=1024 * 1024,
        help="Block size in bytes (default: 1048576, i.e., 1MB)",
    )

    parser.add_argument(
        "--block-count",
        type=int,
        default=10,
        help="Number of blocks in the ring buffer (default: 10)",
    )

    parser.add_argument(
        "--producer",
        type=str,
        choices=["cpp", "cs", "python"],
        help="Run only this producer language",
    )

    parser.add_argument(
        "--consumer",
        type=str,
        choices=["cpp", "cs", "python"],
        help="Run only this consumer language",
    )

    parser.add_argument(
        "--consumers",
        type=int,
        default=1,
        help="Number of consumers per test (default: 1)",
    )

    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose output from test processes",
    )

    parser.add_argument(
        "--skip-build",
        action="store_true",
        help="Skip building targets (use existing binaries)",
    )

    parser.add_argument(
        "--timeout",
        type=int,
        default=300,
        help="Timeout per test in seconds (default: 300)",
    )

    parser.add_argument(
        "--parallel",
        action="store_true",
        default=True,
        dest="parallel",
        help="Run tests in parallel (default: enabled)",
    )

    parser.add_argument(
        "--no-parallel",
        action="store_false",
        dest="parallel",
        help="Run tests sequentially",
    )

    args = parser.parse_args()

    config = TestConfig(
        entries=args.entries,
        block_size=args.block_size,
        block_count=args.block_count,
        num_consumers=args.consumers,
        parallel=args.parallel,
        verbose=args.verbose,
        skip_build=args.skip_build,
        timeout=args.timeout,
    )

    if args.producer:
        config.producer = Language(args.producer)
    if args.consumer:
        config.consumer = Language(args.consumer)

    return config


def main() -> int:
    """Main entry point."""
    print(
        colorize(
            "\n╔══════════════════════════════════════════════════════════╗", "blue"
        )
    )
    print(
        colorize("║       SPMC Ring Buffer Cross-Language Fuzz Test          ║", "blue")
    )
    print(
        colorize("╚══════════════════════════════════════════════════════════╝", "blue")
    )

    config = parse_args()

    results = run_all_tests(config)

    if not results:
        print(colorize("\nNo tests were run", "yellow"))
        return 1

    success = print_summary(results)
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
