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


import multiprocessing
import queue
import sys
import threading
from typing import List, Optional

# this is to make multiprocessing work in a PyInstaller build
multiprocessing.freeze_support()

import xrpa_runtime.utils.xrpa_module

from llm_utils import (
    chat_stream_completion,
    CHUNK_MSG,
    image_to_jpeg_bytes,
    jpeg_bytes_to_base64,
    RESULT_MSG,
)
from xrpa.llm_hub_application_interface import LlmHubApplicationInterface
from xrpa.llm_hub_data_store import (
    LlmChatMessageReader,
    LlmHubDataStore,
    ReconciledLlmConversation,
    ReconciledLlmQuery,
    ReconciledLlmTriggeredQuery,
    RgbImageFeedReader,
)


def get_mcp_server_urls(data_store: LlmHubDataStore, mcp_server_set) -> List[str]:
    return [
        config.get_url()
        for config in data_store.McpServerConfig.server_set_index.get_indexed_objects(
            mcp_server_set
        )
    ]


def create_system_message(text: str):
    return {
        "role": "system",
        "text": text.strip(),
    }


def create_user_message(user_prompt: str, jpeg_data: Optional[bytearray | bytes]):
    has_image = jpeg_data is not None and len(jpeg_data) > 0
    return {
        "role": "user",
        "text": user_prompt.strip(),
        "attachment": {
            "type": "BASE64_IMAGE",
            "data": jpeg_bytes_to_base64(jpeg_data),
        }
        if has_image
        else None,
    }


class ResponseQueueSet:
    def __init__(self):
        self._response_queues = {}

    def add_queue(self, key, q):
        self._response_queues[key] = q

    def get_items(self):
        items = []
        dead_queue_keys = []
        for key, q in self._response_queues.items():
            # Process the queue until it's empty
            while True:
                try:
                    item = q.get(block=False)
                    items.append((key, item[0], item[1]))
                    if item[0] == RESULT_MSG:
                        # remove the queue from the list
                        dead_queue_keys.append(key)
                except queue.Empty:
                    break

        # remove the dead queues from the list
        for key in dead_queue_keys:
            del self._response_queues[key]

        return items


class LlmQuery(ReconciledLlmQuery):
    def __init__(self, id, collection, data_store: LlmHubDataStore):
        super().__init__(id, collection)
        self._data_store = data_store
        self._responses = ResponseQueueSet()
        self._id_to_response_idx = {}
        self.on_query(self._handle_query)

    # handle the state-based query
    def _handle_xrpa_fields_changed(self, fields_changed: int) -> None:
        if (
            self.check_user_prompt_changed(fields_changed)
            and self.get_user_prompt().strip() != ""
        ):
            self._process_query(self.get_user_prompt(), self.get_jpeg_image_data(), 0)

    # handle the message-based query
    def _handle_query(self, _, data: LlmChatMessageReader):
        user_prompt = data.get_data()
        jpeg_data = data.get_jpeg_image_data()
        id = data.get_id()
        self._process_query(user_prompt, jpeg_data, id)

    # common processing for both state-based and message-based queries
    def _process_query(self, user_prompt: str, jpeg_data: bytearray, id: int):
        json_schema = self.get_json_schema()
        if json_schema:
            user_prompt += "\nRespond in formatted JSON."

        messages = [
            create_system_message(self.get_sys_prompt()),
            create_user_message(user_prompt, jpeg_data),
        ]

        # start a thread to call the API
        self.set_is_processing(self.get_is_processing() + 1)
        self._responses.add_queue(
            id,
            chat_stream_completion(
                access_token=self.get_api_key(),
                messages=messages,
                json_schema=json_schema,
                model_size=self.get_model_size(),
                api_provider=self.get_api_provider(),
                max_consecutive_tool_calls=self.get_max_consecutive_tool_calls(),
                mcp_server_urls=get_mcp_server_urls(
                    self._data_store, self.get_mcp_server_set()
                ),
            ),
        )

    def tick(self):
        items = self._responses.get_items()
        for item in items:
            id = item[0]
            msg = item[1]
            data = item[2]
            if msg == CHUNK_MSG:
                self.send_response_stream(data, id)
            elif msg == RESULT_MSG:
                self.send_response(data, id)
                self.set_is_processing(self.get_is_processing() - 1)


class LlmTriggeredQuery(ReconciledLlmTriggeredQuery):
    def __init__(self, id, collection, data_store: LlmHubDataStore):
        super().__init__(id, collection)
        self._data_store = data_store
        self._responses = ResponseQueueSet()
        self._last_image = None
        self.on_rgb_image_feed(self._handle_rgb_image)

    def _handle_xrpa_fields_changed(self, fields_changed: int) -> None:
        if self.check_trigger_id_changed(fields_changed) and self.get_trigger_id() > 0:
            self._process_query()

    def _handle_rgb_image(self, _, data: RgbImageFeedReader):
        self._last_image = data.get_image()

    def _process_query(self):
        trigger_id = self.get_trigger_id()
        user_prompt = self.get_user_prompt().strip()
        if len(user_prompt) == 0:
            print("[LlmHub]: no user prompt provided, skipping query")
            return

        json_schema = self.get_json_schema()
        if json_schema:
            user_prompt += "\nRespond in formatted JSON."

        messages = [
            create_system_message(self.get_sys_prompt()),
            create_user_message(user_prompt, image_to_jpeg_bytes(self._last_image)),
        ]

        # call the API
        self.set_is_processing(self.get_is_processing() + 1)
        self._responses.add_queue(
            trigger_id,
            chat_stream_completion(
                access_token=self.get_api_key(),
                messages=messages,
                json_schema=json_schema,
                model_size=self.get_model_size(),
                api_provider=self.get_api_provider(),
                max_consecutive_tool_calls=self.get_max_consecutive_tool_calls(),
                mcp_server_urls=get_mcp_server_urls(
                    self._data_store, self.get_mcp_server_set()
                ),
            ),
        )

    def tick(self):
        items = self._responses.get_items()
        for item in items:
            id = item[0]
            msg = item[1]
            data = item[2]
            if msg == CHUNK_MSG:
                self.send_response_stream(data, id)
            elif msg == RESULT_MSG:
                self.send_response(data, id)
                self.set_is_processing(self.get_is_processing() - 1)


class LlmConversation(ReconciledLlmConversation):
    def __init__(self, id, collection, data_store: LlmHubDataStore):
        super().__init__(id, collection)
        self._data_store = data_store
        self._responses = ResponseQueueSet()
        self._chat_history = []
        self._id_to_response_idx = {}
        self.on_chat_message(self._handle_chat_message)

    def _handle_chat_message(self, _, data: LlmChatMessageReader):
        message = data.get_data()
        jpeg_data = data.get_jpeg_image_data()
        id = data.get_id()
        self._process_chat_message(message, jpeg_data, id)

    def _process_chat_message(self, message: str, jpeg_data: bytearray, id: int):
        # add the user message to the chat history
        self._chat_history.append(create_user_message(message, jpeg_data))

        # copy off the chat history to pass into the API call
        messages = self._chat_history.copy()

        # insert an entry for the AI response, to fill in later
        self._id_to_response_idx[id] = len(self._chat_history)
        self._chat_history.append(
            {
                "role": "ai",
                "text": "",
            }
        )

        # prepend the system prompt to the messages array
        messages.insert(0, create_system_message(self.get_sys_prompt()))

        # prepend the conversation starter to the messages array, if we have one
        conversation_starter = self.get_conversation_starter().strip()
        if len(conversation_starter) > 0:
            messages.insert(1, create_user_message(conversation_starter, None))

        # call the API
        self.set_is_processing(self.get_is_processing() + 1)
        self._responses.add_queue(
            id,
            chat_stream_completion(
                access_token=self.get_api_key(),
                messages=messages,
                model_size=self.get_model_size(),
                api_provider=self.get_api_provider(),
                max_consecutive_tool_calls=self.get_max_consecutive_tool_calls(),
                mcp_server_urls=get_mcp_server_urls(
                    self._data_store, self.get_mcp_server_set()
                ),
            ),
        )

    def tick(self):
        items = self._responses.get_items()
        for item in items:
            id = item[0]
            msg = item[1]
            data = item[2]
            if msg == CHUNK_MSG:
                self.send_chat_response_stream(data, id)
            elif msg == RESULT_MSG:
                response_idx = self._id_to_response_idx[id]
                self._chat_history[response_idx]["text"] = data
                self.send_chat_response(data, id)
                self.set_is_processing(self.get_is_processing() - 1)


def tick(module: LlmHubApplicationInterface):
    for obj in module.llm_hub_data_store.LlmQuery.get_enumerator():
        obj.tick()

    for obj in module.llm_hub_data_store.LlmTriggeredQuery.get_enumerator():
        obj.tick()

    for obj in module.llm_hub_data_store.LlmConversation.get_enumerator():
        obj.tick()


def stop_on_enter_keypress(module: xrpa_runtime.utils.xrpa_module.XrpaModule):
    while True:
        sys.stdin.readline()
        module.stop()


def main():
    module = LlmHubApplicationInterface()

    input_thread = threading.Thread(target=stop_on_enter_keypress, args=(module,))
    input_thread.daemon = True
    input_thread.start()

    module.llm_hub_data_store.LlmQuery.set_create_delegate(
        lambda id, _, collection: LlmQuery(id, collection, module.llm_hub_data_store)
    )

    module.llm_hub_data_store.LlmTriggeredQuery.set_create_delegate(
        lambda id, _, collection: LlmTriggeredQuery(
            id, collection, module.llm_hub_data_store
        )
    )

    module.llm_hub_data_store.LlmConversation.set_create_delegate(
        lambda id, _, collection: LlmConversation(
            id, collection, module.llm_hub_data_store
        )
    )

    print("LlmHub started")
    module.run(30, lambda: tick(module))


if __name__ == "__main__":
    main()
    sys.exit(0)
