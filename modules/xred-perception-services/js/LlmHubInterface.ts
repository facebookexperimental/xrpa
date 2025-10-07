/**
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


import {
  bindExternalProgram,
  ByteArray,
  Collection,
  Count,
  Enum,
  Instantiate,
  IndexKey,
  isDataflowForeignObjectInstantiation,
  Message,
  MessageRate,
  ObjectField,
  Output,
  ProgramInput,
  ReferenceTo,
  Scalar,
  String,
  XrpaDataflowConnection,
  XrpaDataType,
  XrpaProgramInterface,
  XrpaProgramParam,
  XrpaDataflowGraphNode,
} from "@xrpa/xrpa-orchestrator";

import assert from "assert";
import path from "path";
import { ZodSchema } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

import { getPerceptionTypes } from "./Shared";

export enum ModelSize {
  Small = 0,
  Large = 1,
}

export enum ApiProvider {
  MetaGenProxy = 0,
  LlamaAPI = 1,
  LocalLLM = 2,
}

const LlmChatMessage = MessageRate(1, Message("LlmChatMessage", {
  data: String,
  jpegImageData: ByteArray(Math.floor(1024 * 1024 * 3 / 10), "Optional JPEG image data."),
  id: Count(0, "Optional ID. If sent with a chat message, the response will have the same ID."),
}));

const LlmChatResponse = MessageRate(1, Message("LlmChatResponse", {
  data: String,
  id: Count(0, "Optional ID. If sent with a chat message, the response will have the same ID."),
}));

// Default collection size limits - can be overridden when needed
// These numbers are just hints to the transport layer for memory allocation in the ring buffer
// It's fine for them to be on the larger side
export const DEFAULT_CONFIG_MAX_COUNT = 32;
export const DEFAULT_CONFIG_COLLECTION_MAX_COUNT = 32;
export const DEFAULT_SERVER_SET_MAX_COUNT = 64;
export const DEFAULT_LLM_FUNCTION_MAX_COUNT = 128;

export const XredLlmHubInterface = XrpaProgramInterface("Xred.LlmHub", path.join(__dirname, "../package.json"), () => {
  const ModelSizeHint = Enum("ModelSizeHint", ["Small", "Large"]);
  const ApiProviderEnum = Enum("ApiProvider", ["MetaGenProxy", "LlamaAPI", "LocalLLM"]);

  const {
    rgbMessage,
  } = getPerceptionTypes();

  // MCP configuration
  const McpServerSet = ProgramInput("McpServerSet", Collection({
    maxCount: DEFAULT_SERVER_SET_MAX_COUNT,
    fields: {},
  }));

  ProgramInput("McpServerConfig", Collection({
    maxCount: DEFAULT_CONFIG_MAX_COUNT,
    fields: {
      url: String("http://localhost:3000/mcp", "URL of the MCP server"),
      authToken: String("", "Authentication token for the MCP server"),
      serverSet: IndexKey(ReferenceTo(McpServerSet, "Reference back to the server set this config belongs to")),
    },
  }));

  const LlmShared = {
    apiKey: String,
    apiProvider: ApiProviderEnum,
    modelSize: ModelSizeHint,
    sysPrompt: String,
    temperature: Scalar(0.7, "Controls randomness: 0.0 = deterministic, 1.0 = creative"),
    maxTokens: Count(256, "Maximum number of tokens to generate"),
    maxConsecutiveToolCalls: Count(20, "Maximum number of consecutive tool calls"),

    isProcessing: Output(Count),
  };

  ProgramInput("LlmQuery", Collection({
    maxCount: DEFAULT_LLM_FUNCTION_MAX_COUNT,
    fields: {
      ...LlmShared,

      jsonSchema: String("", "Optional JSON schema for the response."),
      mcpServerSet: ReferenceTo(McpServerSet),

      // Supports either a query message OR a stateful user prompt
      Query: LlmChatMessage,

      userPrompt: String,
      jpegImageData: ByteArray(Math.floor(1024 * 1024 * 3 / 10), "Optional JPEG image data."),

      Response: Output(LlmChatResponse),
      ResponseStream: Output(LlmChatResponse),
    },
  }));

  ProgramInput("LlmTriggeredQuery", Collection({
    maxCount: DEFAULT_LLM_FUNCTION_MAX_COUNT,
    fields: {
      ...LlmShared,

      jsonSchema: String("", "Optional JSON schema for the response."),
      mcpServerSet: ReferenceTo(McpServerSet),

      userPrompt: String,
      RgbImageFeed: rgbMessage,
      triggerId: Count,

      Response: Output(LlmChatResponse),
      ResponseStream: Output(LlmChatResponse),
    },
  }));

  ProgramInput("LlmConversation", Collection({
    maxCount: DEFAULT_LLM_FUNCTION_MAX_COUNT,
    fields: {
      ...LlmShared,

      conversationStarter: String("", "Optional starter message for the conversation. Will be sent as an additional message between the system prompt and the user prompt."),
      mcpServerSet: ReferenceTo(McpServerSet),

      ChatMessage: LlmChatMessage,
      ChatResponse: Output(LlmChatResponse),
      ChatResponseStream: Output(LlmChatResponse),
    },
  }));
});

interface LlmSharedParams {
  apiKey: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"String">> | string;
  apiProvider?: XrpaDataflowConnection | ApiProvider;
  modelSize?: XrpaDataflowConnection | ModelSize;
  temperature?: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"Scalar">> | number;
  maxTokens?: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"Count">> | number;
  sysPrompt: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"String">> | string;
  maxConsecutiveToolCalls?: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"Count">> | number;
}

function convertJsonSchema(jsonSchema?: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"String">> | string | ZodSchema): XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"String">> | string | undefined {
  if (typeof jsonSchema === 'object' && jsonSchema !== null && 'parse' in jsonSchema) {
    const schema = zodToJsonSchema(jsonSchema);
    delete schema.$schema;
    return JSON.stringify(schema);
  } else {
    return jsonSchema;
  }
}

// McpServerSet interface - contains all the MCP servers we want to call with the LLM query
export interface McpServerConfigParams {
  url: string;
  authToken?: string;
}

export function McpServerSet(servers: McpServerConfigParams[]): XrpaDataflowGraphNode {
  const dataflowNode = Instantiate(
    [bindExternalProgram(XredLlmHubInterface), "McpServerSet"],
    {},
  );

  assert(isDataflowForeignObjectInstantiation(dataflowNode));

  for (const serverConfig of servers) {
    const serverNode = Instantiate(
      [bindExternalProgram(XredLlmHubInterface), "McpServerConfig"],
      {},
    );

    assert(isDataflowForeignObjectInstantiation(serverNode));

    serverNode.fieldValues = {
      url: serverConfig.url || "http://localhost:3000/mcp",
      authToken: serverConfig.authToken || "",
      serverSet: dataflowNode,
    };
  }

  return dataflowNode;
}

export function LlmQuery(params: LlmSharedParams & {
  Query?: XrpaDataflowConnection | XrpaProgramParam;

  userPrompt?: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"String">> | string;
  jpegImageData?: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"ByteArray">>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jsonSchema?: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"String">> | string | ZodSchema;
  mcpServerSet?: XrpaDataflowGraphNode;
}) {
  const dataflowNode = Instantiate(
    [bindExternalProgram(XredLlmHubInterface), "LlmQuery"],
    {},
  );

  assert(isDataflowForeignObjectInstantiation(dataflowNode));

  dataflowNode.fieldValues = {
    ...params,
    jsonSchema: convertJsonSchema(params.jsonSchema),
  };

  return {
    isProcessing: ObjectField(dataflowNode, "isProcessing"),
    Response: ObjectField(dataflowNode, "Response"),
    ResponseStream: ObjectField(dataflowNode, "ResponseStream"),
  };
}

export function LlmTriggeredQuery(params: LlmSharedParams & {
  userPrompt: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"String">> | string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jsonSchema?: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"String">> | string | ZodSchema;

  // Tool calling support
  mcpServerSet?: XrpaDataflowGraphNode;

  RgbImageFeed?: XrpaDataflowConnection | XrpaProgramParam;
  triggerId?: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"Count">>;
}) {
  const dataflowNode = Instantiate(
    [bindExternalProgram(XredLlmHubInterface), "LlmTriggeredQuery"],
    {},
  );

  assert(isDataflowForeignObjectInstantiation(dataflowNode));

  dataflowNode.fieldValues = {
    ...params,
    jsonSchema: convertJsonSchema(params.jsonSchema),
  };

  return {
    isProcessing: ObjectField(dataflowNode, "isProcessing"),
    Response: ObjectField(dataflowNode, "Response"),
    ResponseStream: ObjectField(dataflowNode, "ResponseStream"),
  };
}

export function LlmConversation(params: LlmSharedParams & {
  conversationStarter?: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"String">> | string;
  mcpServerSet?: XrpaDataflowGraphNode;
  ChatMessage: XrpaDataflowConnection | XrpaProgramParam;
}) {
  const dataflowNode = Instantiate(
    [bindExternalProgram(XredLlmHubInterface), "LlmConversation"],
    {},
  );

  assert(isDataflowForeignObjectInstantiation(dataflowNode));

  dataflowNode.fieldValues = {
    ...params,
  };

  return {
    isProcessing: ObjectField(dataflowNode, "isProcessing"),
    ChatResponse: ObjectField(dataflowNode, "ChatResponse"),
    ChatResponseStream: ObjectField(dataflowNode, "ChatResponseStream"),
  };
}
