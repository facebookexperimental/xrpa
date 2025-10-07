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


import argparse
import os
import platform
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from llm_utils import DEFAULT_MLX_MODEL
from mlx_subprocess import ensure_model_cached


def main():
    if platform.system() != "Darwin":
        print("Error: Model caching is only supported on macOS systems")
        print(
            "MLX (Apple's machine learning framework) is not available on this platform"
        )
        sys.exit(1)

    parser = argparse.ArgumentParser(
        description="Cache MLX models for offline use (macOS only)"
    )
    parser.add_argument(
        "--model",
        type=str,
        default=DEFAULT_MLX_MODEL,
        help=f"Model to cache (default: {DEFAULT_MLX_MODEL})",
    )

    args = parser.parse_args()

    print(f"Caching model: {args.model}")
    cached_path = ensure_model_cached(args.model)

    if os.path.exists(cached_path) and os.path.isdir(cached_path):
        print(f"Model successfully cached at: {cached_path}")
    else:
        print(f"Failed to cache model: {args.model}")
        sys.exit(1)


if __name__ == "__main__":
    main()
