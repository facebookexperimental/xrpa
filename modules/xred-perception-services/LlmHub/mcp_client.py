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


from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client


@dataclass
class McpClientTool:
    client: "McpClient"
    tool_name: str


class McpClient:
    def __init__(self, url: str):
        self.url = url
        self.session: Optional[ClientSession] = None
        self.tools: List[Dict[str, Any]] = []
        self.name = ""

    async def initialize(self) -> bool:
        try:
            # Create HTTP client connection
            async with streamablehttp_client(self.url) as (
                read_stream,
                write_stream,
                _,
            ):
                async with ClientSession(read_stream, write_stream) as session:
                    self.session = session
                    response = await session.initialize()
                    self.name = response.serverInfo.name
                    await self._load_capabilities()
                    return True

        except Exception as e:
            print(f"[MCP]: HTTP connection error for {self.url}: {str(e)}")
            return False

    async def _load_capabilities(self):
        if not self.session:
            return

        try:
            tools_response = await self.session.list_tools()
            self.tools = []
            for tool in tools_response.tools:
                self.tools.append(
                    {
                        "name": tool.name,
                        "description": tool.description or "",
                        "input_schema": tool.inputSchema or {},
                    }
                )

        except Exception as e:
            print(f"[MCP]: Error loading capabilities from {self.name}: {str(e)}")

    async def call_tool(
        self, tool_name: str, arguments: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        if not self.session:
            return {"error": "No active session"}

        try:
            # Create HTTP client connection
            async with streamablehttp_client(self.url) as (
                read_stream,
                write_stream,
                _,
            ):
                async with ClientSession(read_stream, write_stream) as session:
                    self.session = session
                    await session.initialize()
                    result = await self.session.call_tool(tool_name, arguments)
                    print(f"[MCP]: call_tool {tool_name}: {result}")

                    if result.content:
                        content_list = []
                        for content in result.content:
                            if hasattr(content, "text"):
                                content_list.append(
                                    {"type": "text", "text": content.text}
                                )
                            elif hasattr(content, "data"):
                                content_list.append(
                                    {"type": "resource", "resource": content.data}
                                )

                        return {
                            "content": content_list,
                            "isError": result.isError or False,
                        }
                    else:
                        return {"content": [], "isError": result.isError or False}

        except Exception as e:
            print(
                f"[MCP]: Error calling tool {tool_name}: {str(e)} (Exception type: {type(e).__name__})"
            )
            return {"content": [], "isError": True}

    def get_tools_for_llm(self) -> List[Dict[str, Any]]:
        """Get tools formatted for LLM function calling."""
        llm_tools = []
        for tool in self.tools:
            llm_tool = {
                "type": "function",
                "function": {
                    "name": f"{self.name}_{tool['name']}",
                    "description": tool["description"],
                    "parameters": tool["input_schema"],
                },
            }
            llm_tools.append(llm_tool)
        return llm_tools

    def get_tools_for_lookup(self, tools_lookup: Dict[str, McpClientTool]) -> None:
        """Get tools formatted for LLM function calling."""
        for tool in self.tools:
            tools_lookup[f"{self.name}_{tool['name']}"] = McpClientTool(
                self, tool["name"]
            )

    async def disconnect(self):
        if self.session:
            self.session = None


class McpToolSet:
    def __init__(self, clients: List[McpClient]):
        self.clients = clients
        self.tools_lookup: Dict[str, McpClientTool] = {}
        self.llm_tools: List[Dict[str, Any]] = []
        for client in clients:
            client.get_tools_for_lookup(self.tools_lookup)
            self.llm_tools.extend(client.get_tools_for_llm())

    async def call_tool(
        self, full_tool_name: str, arguments: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        if full_tool_name not in self.tools_lookup:
            print(f"[MCP]: Tool not found: {full_tool_name}")
            return {"error": f"Tool not found: {full_tool_name}"}

        tool = self.tools_lookup[full_tool_name]
        return await tool.client.call_tool(tool.tool_name, arguments)

    def get_tools_for_llm(self) -> List[Dict[str, Any]]:
        """Get tools formatted for LLM function calling."""
        return self.llm_tools


async def get_mcp_tool_set(urls: List[str]) -> Optional[McpToolSet]:
    clients = []
    for url in urls:
        client = McpClient(url)
        if await client.initialize():
            clients.append(client)

    return McpToolSet(clients) if len(clients) > 0 else None
