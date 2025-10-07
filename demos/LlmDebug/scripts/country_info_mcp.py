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

import sys

try:
    from fastmcp import FastMCP
    from fastmcp.exceptions import ToolError
except ImportError:
    print("Error: FastMCP not installed. Install with: pip install fastmcp")
    sys.exit(1)

# Create the MCP server
mcp = FastMCP("country-info")

# Hardcoded database of country information
country_database = {
    "usa": {
        "name": "United States of America",
        "capital": "Washington, D.C.",
        "population": 331900000,
        "sizeInSqKm": 9833520,
    },
    "france": {
        "name": "France",
        "capital": "Paris",
        "population": 67750000,
        "sizeInSqKm": 551695,
    },
    "saudi arabia": {
        "name": "Saudi Arabia",
        "capital": "Riyadh",
        "population": 35950000,
        "sizeInSqKm": 2149690,
    },
}


@mcp.tool()
def get_country_info(country: str):
    """Get basic information about a country including capital city, population, and size."""

    country_name = country.lower()
    print(f"get_country_info: {country}")

    if country_name not in country_database:
        raise ToolError(
            "Country not found. Available countries: USA, France, Saudi Arabia"
        )

    return country_database[country_name]


def main():
    print("Server starting... Press Ctrl+C to stop")

    try:
        # Run the server
        mcp.run(
            transport="http",
            port=3120,
        )
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
