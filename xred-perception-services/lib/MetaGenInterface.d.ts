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
declare const LlmChatMessage: import("@xrpa/xrpa-orchestrator").XrpaMessageType;
export declare const XredMetaGenInterface: import("@xrpa/xrpa-orchestrator").ProgramInterface;
interface LlmSharedParams {
    apiKey: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"String">> | string;
    modelSize?: XrpaDataflowConnection | ModelSize;
    sysPrompt: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"String">> | string;
}
export declare function LlmQuery(params: LlmSharedParams & {
    userPrompt: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"String">> | string;
    jsonSchema?: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"String">> | string | ZodSchema;
    jpegImageData?: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"ByteArray">>;
}): {
    response: XrpaDataflowConnection;
    ResponseStream: XrpaDataflowConnection;
};
export declare function LlmTriggeredQuery(params: LlmSharedParams & {
    userPrompt: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"String">> | string;
    jsonSchema?: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"String">> | string | ZodSchema;
    RgbImageFeed?: XrpaDataflowConnection | XrpaProgramParam;
    triggerId?: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"Count">>;
}): {
    Response: XrpaDataflowConnection;
    ResponseStream: XrpaDataflowConnection;
};
export declare function LlmConversation(params: LlmSharedParams & {
    conversationStarter: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"String">> | string;
    ChatMessage: XrpaDataflowConnection | XrpaProgramParam<typeof LlmChatMessage>;
}): {
    ChatResponse: XrpaDataflowConnection;
    ChatResponseStream: XrpaDataflowConnection;
};
export {};

