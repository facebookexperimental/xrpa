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


import asyncio
import base64
import io
import json
import os
import platform
import re
import threading
import time
from queue import Queue
from typing import Dict, List, Optional

import requests

from llama_api_client import LlamaAPIClient
from mcp_client import get_mcp_tool_set, McpToolSet
from PIL import Image

# Check if we're on macOS (MLX only works on macOS)
MLX_AVAILABLE = platform.system() == "Darwin"
if not MLX_AVAILABLE:
    print("[LlmHub]: MLX not supported on this platform")

from xrpa.llm_hub_types import (
    ApiProvider,
    ImageEncoding,
    ImageOrientation,
    ModelSizeHint,
)

_metagen_url = "https://graph.facebook.com/v22.0/chat_stream_completions"
_max_retries = 5

CHUNK_MSG = "chunk"
RESULT_MSG = "result"


def jpeg_bytes_to_base64(jpeg_bytearray: bytearray | bytes):
    return base64.b64encode(jpeg_bytearray).decode("utf-8")


def image_to_jpeg_bytes(image) -> Optional[bytes]:
    if image is None:
        return None

    if image.encoding == ImageEncoding.Raw:
        pil_image = Image.frombytes("RGB", (image.width, image.height), image.data)
    else:
        # decompress the jpeg image data and convert to RGB format
        pil_image = Image.open(io.BytesIO(image.data))
        pil_image = pil_image.convert("RGB")

    # Rotate the image to the correct orientation
    if image.orientation == ImageOrientation.RotatedCW:
        pil_image = pil_image.rotate(-90, expand=True)
    elif image.orientation == ImageOrientation.RotatedCCW:
        pil_image = pil_image.rotate(90, expand=True)
    elif image.orientation == ImageOrientation.Rotated180:
        pil_image = pil_image.rotate(180, expand=True)

    # Encode the image as JPEG and then convert to a base64 string
    buffered = io.BytesIO()
    pil_image.save(buffered, format="JPEG")
    return buffered.getvalue()


def _process_chunk(chunk, queue, result_str):
    try:
        chunk = chunk.decode("utf-8")
        for mini_chunk in chunk.split("  "):
            try:
                mini_chunk = json.loads(mini_chunk)
                if "error" in mini_chunk:
                    error_message = mini_chunk["error"]["message"]
                    error_type = mini_chunk["error"]["type"]
                    if (
                        error_type == "GraphMethodException"
                        and "STREAMING_CHUNK_TIMEOUT" in error_message
                    ):
                        print(
                            f"[LlmHub]: timeout (TODO add continue handling): {mini_chunk['error']}"
                        )
                    elif error_type == "GraphMethodException" and (
                        "ADMITTANCE_REJECTED" in error_message
                        or "HOST_OVERLOAD" in error_message
                        or "Connection closed by server" in error_message
                    ):
                        return (result_str, True)
                    else:
                        print(f"[LlmHub]: error: {mini_chunk['error']}")
                    continue
                elif "text" in mini_chunk:
                    queue.put((CHUNK_MSG, mini_chunk["text"]))
                    result_str += mini_chunk["text"]
            except Exception:
                pass
    except json.decoder.JSONDecodeError as e:
        print(f"[LlmHub]: {chunk}, {str(e)}")
        pass

    return (result_str, False)


def _add_mcp_system_message(
    messages: List[Dict], mcp_tools: Optional[McpToolSet]
) -> List[Dict]:
    if not mcp_tools:
        return messages

    tools_description = "You have access to the following tools:\n\n"
    for tool in mcp_tools.get_tools_for_llm():
        func = tool.get("function", {})
        name = func.get("name", "unknown")
        description = func.get("description", "No description")
        parameters = func.get("parameters", {})

        tools_description += f"- {name}: {description}\n"
        if parameters.get("properties"):
            tools_description += "  Parameters:\n"
            for param_name, param_info in parameters["properties"].items():
                param_desc = param_info.get("description", "")
                param_type = param_info.get("type", "")
                tools_description += (
                    f"    - {param_name} ({param_type}): {param_desc}\n"
                )
        tools_description += "\n"

    tools_description += """To use a tool, respond with a JSON object in this format:
{
  "tool_calls": [
    {
      "name": "tool_name",
      "arguments": {
        "param1": "value1",
        "param2": "value2"
      }
    }
  ]
}

You can make multiple tool calls in a single response. After tool execution, you'll receive the results and can continue the conversation normally."""

    updated_messages = []
    system_message_added = False

    for msg in messages:
        if msg.get("role") == "system":
            existing_text = msg.get("text", "")
            updated_text = (
                existing_text + "\n\n" + tools_description
                if existing_text
                else tools_description
            )
            updated_messages.append({**msg, "text": updated_text})
            system_message_added = True
        else:
            updated_messages.append(msg)

    if not system_message_added:
        updated_messages.insert(0, {"role": "system", "text": tools_description})

    return updated_messages


def _parse_tool_calls(response_text: str) -> List[Dict]:
    tool_calls = []

    json_pattern = r'\{[^{}]*"tool_calls"[^{}]*\[[^\]]*\][^{}]*\}'
    matches = re.findall(json_pattern, response_text, re.DOTALL)

    for match in matches:
        try:
            parsed = json.loads(match)
            if "tool_calls" in parsed and isinstance(parsed["tool_calls"], list):
                tool_calls.extend(parsed["tool_calls"])
        except json.JSONDecodeError:
            continue

    try:
        parsed = json.loads(response_text.strip())
        if "tool_calls" in parsed and isinstance(parsed["tool_calls"], list):
            tool_calls.extend(parsed["tool_calls"])
    except json.JSONDecodeError:
        pass

    return tool_calls


async def _execute_tool_calls(
    mcp_tools: McpToolSet, tool_calls: List[Dict]
) -> List[Dict]:
    results = []

    for tool_call in tool_calls:
        tool_name = tool_call.get("name", "")
        arguments = tool_call.get("arguments", {})

        if not tool_name:
            results.append(
                {"name": tool_name, "result": {"error": "Tool name is required"}}
            )
            continue

        try:
            result = await mcp_tools.call_tool(tool_name, arguments)
            results.append(
                {"name": tool_name, "result": result or {"error": "No result returned"}}
            )
        except Exception as e:
            results.append(
                {
                    "name": tool_name,
                    "result": {"error": f"Tool execution failed: {str(e)}"},
                }
            )

    return results


def _handle_tool_calling_workflow(
    conversation_messages: List[Dict],
    result_str: str,
    mcp_tools: Optional[McpToolSet],
    max_tool_calls: int,
    tool_call_count: int,
    queue: Queue,
) -> tuple[bool, List[Dict], int]:
    tool_calls = _parse_tool_calls(result_str)

    if not tool_calls or not mcp_tools:
        queue.put((RESULT_MSG, result_str))
        return False, conversation_messages, tool_call_count

    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    tool_results = loop.run_until_complete(_execute_tool_calls(mcp_tools, tool_calls))

    updated_messages = conversation_messages.copy()
    updated_messages.append({"role": "ai", "text": result_str})

    for tool_result in tool_results:
        tool_result_text = f"Tool '{tool_result['name']}' result: {json.dumps(tool_result['result'], indent=2)}"
        updated_messages.append({"role": "user", "text": tool_result_text})

    updated_tool_call_count = tool_call_count + 1
    print(
        f"[LlmHub]: Executed {len(tool_calls)} tool calls, continuing conversation (attempt {updated_tool_call_count}/{max_tool_calls})"
    )

    return True, updated_messages, updated_tool_call_count


def _chat_stream_thread_metagen(
    payload,
    queue,
    mcp_server_urls: List[str],
    max_tool_calls=20,
):
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    mcp_tools = loop.run_until_complete(get_mcp_tool_set(mcp_server_urls))
    if not mcp_tools:
        print(
            f"[LlmHub]: sending request to MetaGen proxy using model {payload['model']}"
        )
    else:
        print(
            f"[LlmHub]: sending request to MetaGen proxy using model {payload['model']} with JSON-based tool calling"
        )

    conversation_messages = _add_mcp_system_message(
        payload["messages"].copy(), mcp_tools=mcp_tools
    )
    tool_call_count = 0
    result_str = ""

    while tool_call_count < max_tool_calls:
        current_payload = payload.copy()
        current_payload["messages"] = conversation_messages

        retry_count = 0
        result_str = ""

        while True:
            response = requests.post(_metagen_url, json=current_payload, stream=True)
            needs_retry = False

            for chunk in response.iter_content(chunk_size=None):
                (result_str, needs_retry) = _process_chunk(chunk, queue, result_str)

            if needs_retry and retry_count < _max_retries:
                retry_count += 1
                timeout = 2**retry_count
                print(
                    f"[LlmHub]: throttled, retrying ({retry_count}/{_max_retries}) after {timeout}s"
                )
                time.sleep(timeout)
                result_str = ""
            else:
                break

        should_continue, conversation_messages, tool_call_count = (
            _handle_tool_calling_workflow(
                conversation_messages,
                result_str,
                mcp_tools,
                max_tool_calls,
                tool_call_count,
                queue,
            )
        )

        if not should_continue:
            return

    queue.put((RESULT_MSG, result_str))


# Default model to use for local MLX inference
DEFAULT_MLX_MODEL = "mlx-community/Llama-3.2-1B-Instruct-4bit"

# Path to the cached model directory
CACHED_MODEL_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "cached_models"
)


# Define this function at module level so it can be pickled for multiprocessing
def run_mlx_in_process(conn, messages_json, model_path, max_tokens):
    try:
        # Import MLX modules in the child process
        try:
            import io

            from mlx_subprocess import run_mlx_generation

            # Parse messages
            messages = json.loads(messages_json)

            # Create file-like objects for communication
            write_buffer = io.StringIO()
            stderr_buffer = io.StringIO()

            # Run MLX generation
            exit_code = run_mlx_generation(
                messages,
                model_path,
                max_tokens,
                write_buffer,
                stderr_buffer,
            )

            # Send results back to parent
            conn.send(
                {
                    "status": exit_code,
                    "output": write_buffer.getvalue(),
                    "stderr": stderr_buffer.getvalue(),
                }
            )

        except ImportError as e:
            conn.send(
                {
                    "status": 1,
                    "output": json.dumps(
                        {
                            "type": "error",
                            "message": f"MLX not available: {str(e)}",
                        }
                    ),
                    "stderr": f"Import error: {str(e)}",
                }
            )
        except Exception as e:
            conn.send(
                {
                    "status": 1,
                    "output": json.dumps(
                        {
                            "type": "error",
                            "message": f"Error in MLX subprocess: {str(e)}",
                        }
                    ),
                    "stderr": f"Error: {str(e)}",
                }
            )
    except Exception as e:
        conn.send(
            {
                "status": 1,
                "output": "",
                "stderr": f"Process error: {str(e)}",
            }
        )
    finally:
        conn.close()


def _chat_stream_thread_local_mlx(
    messages,
    temperature,
    max_tokens,
    queue,
    mcp_server_urls: List[str],
    max_tool_calls=20,
):
    if not MLX_AVAILABLE:
        error_msg = "Local MLX model not available on this platform"
        print(f"[LlmHub]: {error_msg}")
        queue.put((RESULT_MSG, error_msg))
        return

    if max_tokens <= 0:
        print(f"[LlmHub]: Invalid max_tokens value ({max_tokens}), using default 4096")
        max_tokens = 4096  # Default value if invalid

    # Always use the default model
    model_path = DEFAULT_MLX_MODEL

    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    mcp_tools = loop.run_until_complete(get_mcp_tool_set(mcp_server_urls))
    if not mcp_tools:
        print(f"[LlmHub]: Using default MLX model: {model_path}")
    else:
        print(
            f"[LlmHub]: Using default MLX model: {model_path} with JSON-based tool calling"
        )

    conversation_messages = _add_mcp_system_message(
        messages.copy(), mcp_tools=mcp_tools
    )
    tool_call_count = 0
    result_str = ""

    try:
        # Use multiprocessing instead of fork() to avoid Objective-C runtime issues on macOS
        from multiprocessing import Pipe, Process

        while tool_call_count < max_tool_calls:
            print(f"[LlmHub]: Starting multiprocessing for MLX with model {model_path}")

            # Create pipes for communication
            parent_conn, child_conn = Pipe()

            # Convert messages to JSON
            messages_json = json.dumps(conversation_messages)

            # Start the process
            p = Process(
                target=run_mlx_in_process,
                args=(child_conn, messages_json, model_path, max_tokens),
            )
            p.start()

            # Wait for the process to complete and get results
            if parent_conn.poll(timeout=60):  # Wait up to 60 seconds for a response
                response = parent_conn.recv()
                status = response.get("status", 1)
                output = response.get("output", "")
                stderr_output = response.get("stderr", "")

                # Process any stderr output
                if stderr_output:
                    print(f"[LlmHub]: MLX subprocess stderr: {stderr_output}")

                # Process the output
                result_str = ""
                for line in output.splitlines():
                    try:
                        line_str = line.strip()
                        if not line_str:
                            continue

                        data = json.loads(line_str)

                        if data.get("type") == "chunk":
                            chunk_text = data.get("text", "")
                            queue.put((CHUNK_MSG, chunk_text))
                            result_str += chunk_text
                        elif data.get("type") == "error":
                            error_msg = data.get(
                                "message", "Unknown error in MLX subprocess"
                            )
                            print(f"[LlmHub]: {error_msg}")
                            queue.put((RESULT_MSG, error_msg))
                            parent_conn.close()
                            p.join(timeout=1)
                            return
                    except json.JSONDecodeError:
                        print(f"[LlmHub]: Failed to parse subprocess output: {line}")
                    except Exception as e:
                        print(f"[LlmHub]: Error processing subprocess output: {str(e)}")

                # Check if process exited with error
                if status != 0:
                    error_msg = f"MLX subprocess exited with code {status}"
                    print(f"[LlmHub]: {error_msg}")
                    queue.put((RESULT_MSG, error_msg))
                    parent_conn.close()
                    p.join(timeout=1)
                    return
            else:
                # Timeout occurred
                error_msg = "MLX subprocess timed out"
                print(f"[LlmHub]: {error_msg}")
                queue.put((RESULT_MSG, error_msg))
                parent_conn.close()
                p.terminate()
                p.join(timeout=1)
                return

            # Clean up
            parent_conn.close()
            p.join(timeout=1)

            should_continue, conversation_messages, tool_call_count = (
                _handle_tool_calling_workflow(
                    conversation_messages,
                    result_str,
                    mcp_tools,
                    max_tool_calls,
                    tool_call_count,
                    queue,
                )
            )

            if not should_continue:
                return

        queue.put((RESULT_MSG, result_str))

    except Exception as e:
        error_msg = f"Error using local MLX model: {str(e)}"
        print(f"[LlmHub]: {error_msg}")
        queue.put((RESULT_MSG, error_msg))


def _chat_stream_thread_llama_api(
    api_key,
    messages_converted,
    model_name,
    temperature,
    max_tokens,
    json_schema,
    queue,
    mcp_server_urls: List[str],
    max_tool_calls=20,
):
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    mcp_tools = loop.run_until_complete(get_mcp_tool_set(mcp_server_urls))
    if not mcp_tools:
        print(f"[LlmHub]: sending request to Llama API using model {model_name}")
    else:
        print(
            f"[LlmHub]: sending request to Llama API using model {model_name} with native tool calling"
        )

    conversation_messages = messages_converted.copy()
    tool_call_count = 0
    retry_count = 0
    result_str = ""

    try:
        client = LlamaAPIClient(api_key=api_key)

        can_use_tools = True

        while tool_call_count <= max_tool_calls and retry_count < 5:
            if tool_call_count == max_tool_calls:
                can_use_tools = False

            # Note: max_tokens is not supported by the Llama API client
            params = {
                "messages": conversation_messages,
                "model": model_name,
                "temperature": temperature,
                "stream": True,
            }

            if mcp_tools and can_use_tools:
                params["tools"] = mcp_tools.get_tools_for_llm()

            if json_schema:
                params["response_format"] = {
                    "type": "json_schema",
                    "json_schema": {
                        "name": "WhyDoesThisNeedToBeNamed",
                        "schema": json.loads(json_schema),
                    },
                }

            result_str = ""
            tool_calls_from_response = []
            stream = client.chat.completions.create(**params)

            current_tool_call = None
            for chunk in stream:
                # print(f"[LlmHub]: Received chunk: {chunk}")
                if hasattr(chunk, "event") and hasattr(chunk.event, "delta"):
                    delta = chunk.event.delta

                    if hasattr(delta, "text") and delta.text:
                        queue.put((CHUNK_MSG, delta.text))
                        result_str += delta.text

                    elif delta.type == "tool_call":
                        if delta.id:
                            if current_tool_call:
                                tool_calls_from_response.append(current_tool_call)
                            current_tool_call = {
                                "id": delta.id,
                                "function": {"name": "", "arguments": ""},
                            }

                        if delta.function:
                            if delta.function.name:
                                current_tool_call["function"]["name"] = (
                                    delta.function.name
                                )
                                print(
                                    f"[LlmHub]: Native tool call: {delta.function.name}"
                                )
                            if delta.function.arguments:
                                current_tool_call["function"]["arguments"] += (
                                    delta.function.arguments
                                )

            if current_tool_call:
                tool_calls_from_response.append(current_tool_call)
            elif result_str == "":
                # sometimes Llama API returns an empty response, just retry
                print("[LlmHub]: Empty response, retrying")
                retry_count += 1
                continue
            elif mcp_tools and can_use_tools:
                # sometimes Llama API returns the name of a tool instead of issuing a tool call, check for this and retry
                if (
                    result_str.endswith("()")
                    and result_str[:-2] in mcp_tools.tools_lookup
                ):
                    print(
                        f"[LlmHub]: Tool name returned instead of tool call: {result_str}, retrying"
                    )
                    retry_count += 1
                    continue

            if tool_calls_from_response and mcp_tools and can_use_tools:
                print(
                    f"[LlmHub]: Executing {len(tool_calls_from_response)} native tool calls for response: {result_str}"
                )

                # Add tool call to conversation
                conversation_messages.append(
                    {
                        "role": "assistant",
                        "content": result_str if result_str else "",
                        "tool_calls": tool_calls_from_response,
                    }
                )

                for tool_call in tool_calls_from_response:
                    tool_name = tool_call["function"]["name"]
                    try:
                        arguments = json.loads(tool_call["function"]["arguments"])
                    except json.JSONDecodeError:
                        print("[LlmHub] Failed to parse json arguments")
                        arguments = {}

                    try:
                        result = loop.run_until_complete(
                            mcp_tools.call_tool(tool_name, arguments)
                        )
                        tool_result = result or {
                            "content": [{"text": "No result returned"}],
                            "isError": True,
                        }
                    except Exception as e:
                        tool_result = {
                            "content": [{"text": f"Tool execution failed: {str(e)}"}],
                            "isError": True,
                        }

                    if tool_result.get("isError"):
                        print(
                            f"[LlmHub]: Tool call failed: {json.dumps(tool_result, indent=2)}"
                        )
                        # Forbid using more tools if a tool call returned an error
                        can_use_tools = False

                    # Add tool call result to conversation
                    conversation_messages.append(
                        {
                            "role": "tool",
                            "tool_call_id": tool_call["id"],
                            "content": json.dumps(tool_result, indent=2),
                        }
                    )

                tool_call_count += 1
                print(
                    f"[LlmHub]: Tool calls executed, continuing conversation (attempt {tool_call_count}/{max_tool_calls})"
                )
            else:
                queue.put((RESULT_MSG, result_str))
                return

        queue.put((RESULT_MSG, result_str))

    except Exception as e:
        error_msg = f"Error calling Llama API: {str(e)}"
        print(f"[LlmHub]: {error_msg}")
        queue.put((RESULT_MSG, error_msg))


def _convert_messages_for_llama_api(messages):
    converted_messages = []

    for msg in messages:
        role = (
            "user"
            if msg["role"] == "user"
            else "assistant"
            if msg["role"] == "ai"
            else "system"
        )
        content = []

        if "text" in msg:
            content.append({"type": "text", "text": msg["text"]})

        if (
            "attachment" in msg
            and msg["attachment"]
            and msg["attachment"]["type"] == "BASE64_IMAGE"
        ):
            content.append(
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{msg['attachment']['data']}",
                    },
                }
            )

        if len(content) == 1 and content[0]["type"] == "text":
            converted_messages.append({"role": role, "content": content[0]["text"]})
        else:
            converted_messages.append({"role": role, "content": content})

    return converted_messages


def chat_stream_completion(
    access_token: str,
    messages: List,
    mcp_server_urls: List[str],
    model_size: ModelSizeHint,
    api_provider: ApiProvider,
    json_schema="",
    max_consecutive_tool_calls=10,
    temperature=0.6,
    max_tokens=4096,
) -> Queue:
    queue = Queue()

    has_image = False
    for msg in messages:
        if (
            "attachment" in msg
            and msg["attachment"]
            and msg["attachment"]["type"] == "BASE64_IMAGE"
        ):
            has_image = True

    if (
        hasattr(api_provider, "value")
        and api_provider.value == ApiProvider.LocalLLM.value
    ):
        worker_thread = threading.Thread(
            target=_chat_stream_thread_local_mlx,
            args=(
                messages,
                temperature,
                max_tokens,
                queue,
                mcp_server_urls,
                max_consecutive_tool_calls,
            ),
        )
        worker_thread.start()
    elif (
        hasattr(api_provider, "value")
        and api_provider.value == ApiProvider.LlamaAPI.value
    ):
        if model_size == ModelSizeHint.Small:
            model_name = (
                "Llama-4-Scout-17B-16E-Instruct-FP8"
                if has_image
                else "Llama-3.3-8B-Instruct"
            )
        else:
            model_name = (
                "Llama-4-Maverick-17B-128E-Instruct-FP8"
                if has_image
                else "Llama-3.3-70B-Instruct"
            )

        messages_converted = _convert_messages_for_llama_api(messages)

        worker_thread = threading.Thread(
            target=_chat_stream_thread_llama_api,
            args=(
                access_token,
                messages_converted,
                model_name,
                temperature,
                max_tokens,
                json_schema,
                queue,
                mcp_server_urls,
                max_consecutive_tool_calls,
            ),
        )
        worker_thread.start()

    else:
        if model_size == ModelSizeHint.Small:
            model_name = (
                "llama3.2-11b-vision-instruct" if has_image else "llama3.2-3b-instruct"
            )
        else:
            model_name = (
                "llama3.2-90b-vision-instruct" if has_image else "llama3.3-70b-instruct"
            )

        has_mcp_tools = len(mcp_server_urls) > 0
        has_json_schema = json_schema and len(json_schema.strip()) > 0

        if has_mcp_tools and has_json_schema:
            print(
                "[LlmHub]: WARNING - Both MCP tool calling and guided JSON decoding are enabled. "
                "These features may conflict. Disabling guided JSON decoding in favor of tool calling. "
                "To use guided JSON decoding, disable MCP tools for this query."
            )
            json_schema = ""

        payload = {
            "messages": messages,
            "model": model_name,
            "chunks_delimited": True,
            "access_token": access_token,
            "options": {
                "temperature": temperature,
                "guided_decode_json_schema": json_schema,
                "max_tokens": max_tokens,
            },
        }

        worker_thread = threading.Thread(
            target=_chat_stream_thread_metagen,
            args=(
                payload,
                queue,
                mcp_server_urls,
                max_consecutive_tool_calls,
            ),
        )
        worker_thread.start()

    return queue
