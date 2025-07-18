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


import { XrpaDataflowConnection, XrpaDataType, XrpaProgramParam } from "@xrpa/xrpa-orchestrator";
import { ZodSchema } from "zod";
export declare enum ModelSize {
    Small = 0,
    Large = 1
}
export declare enum ApiProvider {
    MetaGenProxy = 0,
    LlamaAPI = 1,
    LocalLLM = 2
}
export declare const DEFAULT_CONFIG_MAX_COUNT = 32;
export declare const DEFAULT_CONFIG_COLLECTION_MAX_COUNT = 32;
export declare const DEFAULT_SERVER_SET_MAX_COUNT = 64;
export declare const DEFAULT_LLM_FUNCTION_MAX_COUNT = 128;
export declare const XredMetaGenInterface: import("@xrpa/xrpa-orchestrator").ProgramInterface;
interface LlmSharedParams {
    apiKey: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"String">> | string;
    apiProvider?: XrpaDataflowConnection | ApiProvider;
    modelSize?: XrpaDataflowConnection | ModelSize;
    temperature?: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"Scalar">> | number;
    maxTokens?: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"Count">> | number;
    sysPrompt: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"String">> | string;
    maxConsecutiveToolCalls?: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"Count">> | number;
}
export interface McpServerConfigParams {
    name: string;
    description?: string;
    version?: string;
    url?: string;
    transportType?: string;
    authToken?: string;
}
export interface McpServerSetParams {
    name: string;
    description?: string;
    configs: McpServerConfigParams[];
}
export declare function createMcpServerSet(params: McpServerSetParams): {
    serverSet: import("@xrpa/xrpa-orchestrator").XrpaDataflowForeignObjectInstantiation;
    configs: import("@xrpa/xrpa-orchestrator").XrpaDataflowForeignObjectInstantiation[];
};
export declare function LlmQuery(params: LlmSharedParams & {
    userPrompt: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"String">> | string;
    jsonSchema?: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"String">> | string | ZodSchema;
    mcpServerSet?: XrpaDataflowConnection | XrpaProgramParam | string;
    jpegImageData?: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"ByteArray">>;
}): {
    isProcessing: XrpaDataflowConnection;
    response: XrpaDataflowConnection;
    ResponseStream: XrpaDataflowConnection;
    QueryComplete: XrpaDataflowConnection;
};
export declare function LlmTriggeredQuery(params: LlmSharedParams & {
    userPrompt: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"String">> | string;
    jsonSchema?: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"String">> | string | ZodSchema;
    mcpServerSet?: XrpaDataflowConnection | XrpaProgramParam | string;
    RgbImageFeed?: XrpaDataflowConnection | XrpaProgramParam;
    triggerId?: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"Count">>;
}): {
    isProcessing: XrpaDataflowConnection;
    Response: XrpaDataflowConnection;
    ResponseStream: XrpaDataflowConnection;
};
export declare function LlmConversation(params: LlmSharedParams & {
    conversationStarter?: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"String">> | string;
    mcpServerSet?: XrpaDataflowConnection | XrpaProgramParam | string;
    ChatMessage: XrpaDataflowConnection | XrpaProgramParam;
}): {
    isProcessing: XrpaDataflowConnection;
    ChatResponse: XrpaDataflowConnection;
    ChatResponseStream: XrpaDataflowConnection;
};
export {};

