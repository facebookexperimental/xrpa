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
Example MCP server for testing tool calling functionality.
This server provides basic calculator and utility tools.
"""

import sys
from datetime import datetime

try:
    from mcp.server.fastmcp import FastMCP
except ImportError:
    print("Error: FastMCP not installed. Install with: pip install fastmcp")
    sys.exit(1)

# Create the MCP server
mcp = FastMCP("Example Calculator Server")


@mcp.tool()
def add(a: float, b: float) -> float:
    """Add two numbers together."""
    result = a + b
    print(f"[Calculator] Adding {a} + {b} = {result}")
    return result


@mcp.tool()
def subtract(a: float, b: float) -> float:
    """Subtract second number from first number."""
    result = a - b
    print(f"[Calculator] Subtracting {a} - {b} = {result}")
    return result


@mcp.tool()
def multiply(a: float, b: float) -> float:
    """Multiply two numbers together."""
    result = a * b
    print(f"[Calculator] Multiplying {a} * {b} = {result}")
    return result


@mcp.tool()
def divide(a: float, b: float) -> float:
    """Divide first number by second number."""
    if b == 0:
        raise ValueError("Cannot divide by zero")
    result = a / b
    print(f"[Calculator] Dividing {a} / {b} = {result}")
    return result


@mcp.tool()
def power(base: float, exponent: float) -> float:
    """Raise base to the power of exponent."""
    result = base**exponent
    print(f"[Calculator] Power {base} ^ {exponent} = {result}")
    return result


@mcp.tool()
def get_current_time() -> str:
    """Get the current date and time."""
    now = datetime.now()
    result = now.strftime("%Y-%m-%d %H:%M:%S")
    print(f"[Utility] Current time: {result}")
    return result


@mcp.tool()
def reverse_string(text: str) -> str:
    """Reverse a string."""
    result = text[::-1]
    print(f"[Utility] Reversing '{text}' = '{result}'")
    return result


@mcp.tool()
def count_words(text: str) -> int:
    """Count the number of words in a text."""
    words = text.split()
    result = len(words)
    print(f"[Utility] Counting words in '{text[:50]}...' = {result}")
    return result


@mcp.tool()
def fibonacci(n: int) -> int:
    """Calculate the nth Fibonacci number."""
    if n < 0:
        raise ValueError("n must be non-negative")
    if n <= 1:
        return n

    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b

    print(f"[Calculator] Fibonacci({n}) = {b}")
    return b


@mcp.tool()
def factorial(n: int) -> int:
    """Calculate the factorial of a number."""
    if n < 0:
        raise ValueError("n must be non-negative")
    if n <= 1:
        return 1

    result = 1
    for i in range(2, n + 1):
        result *= i

    print(f"[Calculator] Factorial({n}) = {result}")
    return result


def main():
    """Run the MCP server."""
    print("🧮 Example MCP Calculator Server")
    print("=" * 40)
    print("Available tools:")
    print("  📊 Math: add, subtract, multiply, divide, power")
    print("  🔢 Advanced: fibonacci, factorial")
    print("  🛠️  Utility: get_current_time, reverse_string, count_words")
    print("=" * 40)
    print("Server starting... Press Ctrl+C to stop")

    try:
        # Run the server
        mcp.run()
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
