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


import json
import os
import sys
from typing import Dict, List

# Import MLX LM here in the subprocess
try:
    from mlx_lm import generate, load, stream_generate

    MLX_AVAILABLE = True
except ImportError:
    MLX_AVAILABLE = False

# Path to the cached model directory
# Handle both development and PyInstaller environments
if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
    # Running in PyInstaller bundle
    base_dir = os.path.dirname(sys.executable)
else:
    # Running in normal Python environment
    base_dir = os.path.dirname(os.path.abspath(__file__))

CACHED_MODEL_DIR = os.path.join(base_dir, "cached_models")


def ensure_model_cached(model_name):
    """Ensure the model is cached locally"""
    os.makedirs(CACHED_MODEL_DIR, exist_ok=True)
    model_dir = os.path.join(CACHED_MODEL_DIR, model_name.replace("/", "_"))

    # Check if model is properly cached by verifying essential files exist
    essential_files = ["tokenizer.json", "config.json"]
    if os.path.exists(model_dir) and os.path.isdir(model_dir):
        all_files_exist = all(
            os.path.exists(os.path.join(model_dir, file)) for file in essential_files
        )
        if all_files_exist:
            print(
                f"[MLX Subprocess]: Model {model_name} is already cached at {model_dir}",
                file=sys.stderr,
            )
            return model_dir
        else:
            print(
                f"[MLX Subprocess]: Model cache incomplete, re-downloading {model_name}",
                file=sys.stderr,
            )
            # Remove incomplete cache
            import shutil

            shutil.rmtree(model_dir, ignore_errors=True)

    print(
        f"[MLX Subprocess]: Caching model {model_name} to {model_dir}", file=sys.stderr
    )
    try:
        from huggingface_hub import snapshot_download

        snapshot_download(
            repo_id=model_name,
            local_dir=model_dir,
            local_dir_use_symlinks=False,
        )

        all_files_exist = all(
            os.path.exists(os.path.join(model_dir, file)) for file in essential_files
        )
        if not all_files_exist:
            print(
                "[MLX Subprocess]: Model download incomplete, using original model name",
                file=sys.stderr,
            )
            return model_name

        print(
            f"[MLX Subprocess]: Successfully cached model {model_name} to {model_dir}",
            file=sys.stderr,
        )
        return model_dir
    except Exception as e:
        print(
            f"[MLX Subprocess]: Error caching model {model_name}: {str(e)}",
            file=sys.stderr,
        )
        return model_name


def _convert_messages_for_mlx(messages):
    """Convert message format for MLX"""
    formatted_messages = []
    for msg in messages:
        role = msg["role"]
        if "text" in msg:
            if role == "system":
                formatted_messages.append({"role": "system", "content": msg["text"]})
            elif role == "user":
                formatted_messages.append({"role": "user", "content": msg["text"]})
            elif role == "ai":
                formatted_messages.append({"role": "assistant", "content": msg["text"]})
    return formatted_messages


from typing import TextIO


def run_mlx_generation(
    messages: List[Dict],
    model_path: str,
    max_tokens: int,
    write_file: TextIO,
    stderr_file: TextIO,
) -> int:
    """Run MLX generation and stream results to stdout"""
    if not MLX_AVAILABLE:
        stderr_file.write("[MLX Subprocess]: MLX not available on this system\n")
        stderr_file.flush()
        return 1

    try:
        cached_path = ensure_model_cached(model_path)

        if os.path.exists(cached_path) and os.path.isdir(cached_path):
            stderr_file.write(
                f"[MLX Subprocess]: Using cached model at {cached_path}\n"
            )
            stderr_file.flush()
            model_path = cached_path
        else:
            stderr_file.write(
                f"[MLX Subprocess]: Loading MLX model from local path: {model_path}\n"
            )
            stderr_file.flush()

        model, tokenizer = load(model_path)
        formatted_messages = _convert_messages_for_mlx(messages)

        prompt = tokenizer.apply_chat_template(
            formatted_messages, add_generation_prompt=True
        )

        stderr_file.write("[MLX Subprocess]: Generating response...\n")
        stderr_file.flush()

        try:
            for response in stream_generate(
                model, tokenizer, prompt, max_tokens=max_tokens
            ):
                # Output each chunk as a JSON object
                write_file.write(
                    json.dumps({"type": "chunk", "text": response.text}) + "\n"
                )
                write_file.flush()
        except Exception as e:
            stderr_file.write(
                f"[MLX Subprocess]: stream_generate failed: {str(e)}, falling back to generate\n"
            )
            stderr_file.flush()
            text = generate(
                model,
                tokenizer,
                prompt=prompt,
                max_tokens=max_tokens,
            )
            write_file.write(json.dumps({"type": "chunk", "text": text}) + "\n")
            write_file.flush()

        # Signal completion
        write_file.write(json.dumps({"type": "done"}) + "\n")
        write_file.flush()
        return 0

    except Exception as e:
        error_msg = f"Error using local MLX model: {str(e)}"

        stderr_file.write(f"[MLX Subprocess]: {error_msg}\n")
        stderr_file.flush()

        write_file.write(json.dumps({"type": "error", "message": error_msg}) + "\n")
        write_file.flush()

        return 1
