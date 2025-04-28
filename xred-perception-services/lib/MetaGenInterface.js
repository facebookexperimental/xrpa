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

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmConversation = exports.LlmTriggeredQuery = exports.LlmQuery = exports.XredMetaGenInterface = exports.ModelSize = void 0;
const xrpa_orchestrator_1 = require("@xrpa/xrpa-orchestrator");
const assert_1 = __importDefault(require("assert"));
const zod_to_json_schema_1 = require("zod-to-json-schema");
const Shared_1 = require("./Shared");
var ModelSize;
(function (ModelSize) {
    ModelSize[ModelSize["Small"] = 0] = "Small";
    ModelSize[ModelSize["Large"] = 1] = "Large";
})(ModelSize = exports.ModelSize || (exports.ModelSize = {}));
const LlmChatMessage = (0, xrpa_orchestrator_1.Message)("LlmChatMessage", {
    data: xrpa_orchestrator_1.String,
    id: (0, xrpa_orchestrator_1.Count)(0, "Optional ID. If sent with a chat message, the response will have the same ID."),
});
exports.XredMetaGenInterface = (0, xrpa_orchestrator_1.XrpaProgramInterface)("Xred.MetaGen", () => {
    const ModelSizeHint = (0, xrpa_orchestrator_1.Enum)("ModelSizeHint", ["Small", "Large"]);
    const { rgbMessage, } = (0, Shared_1.getPerceptionTypes)();
    const LlmShared = {
        apiKey: xrpa_orchestrator_1.String,
        modelSize: ModelSizeHint,
        sysPrompt: xrpa_orchestrator_1.String,
        isProcessing: (0, xrpa_orchestrator_1.Output)(xrpa_orchestrator_1.Count),
    };
    (0, xrpa_orchestrator_1.ProgramInput)("LlmQuery", (0, xrpa_orchestrator_1.Collection)({
        maxCount: 32,
        fields: {
            ...LlmShared,
            userPrompt: xrpa_orchestrator_1.String,
            jsonSchema: (0, xrpa_orchestrator_1.String)("", "Optional JSON schema for the response."),
            jpegImageData: (0, xrpa_orchestrator_1.ByteArray)(Math.floor(2048 * 2048 * 3 / 10), "Optional JPEG image data."),
            response: (0, xrpa_orchestrator_1.Output)(xrpa_orchestrator_1.String),
            ResponseStream: (0, xrpa_orchestrator_1.Output)((0, xrpa_orchestrator_1.Message)({
                data: xrpa_orchestrator_1.String,
            })),
            QueryComplete: (0, xrpa_orchestrator_1.Output)((0, xrpa_orchestrator_1.Message)()),
        },
    }));
    (0, xrpa_orchestrator_1.ProgramInput)("LlmTriggeredQuery", (0, xrpa_orchestrator_1.Collection)({
        maxCount: 32,
        fields: {
            ...LlmShared,
            userPrompt: xrpa_orchestrator_1.String,
            jsonSchema: (0, xrpa_orchestrator_1.String)("", "Optional JSON schema for the response."),
            RgbImageFeed: rgbMessage,
            triggerId: xrpa_orchestrator_1.Count,
            Response: (0, xrpa_orchestrator_1.Output)(LlmChatMessage),
            ResponseStream: (0, xrpa_orchestrator_1.Output)(LlmChatMessage),
        },
    }));
    (0, xrpa_orchestrator_1.ProgramInput)("LlmConversation", (0, xrpa_orchestrator_1.Collection)({
        maxCount: 32,
        fields: {
            ...LlmShared,
            conversationStarter: (0, xrpa_orchestrator_1.String)("", "Optional starter message for the conversation. Will be sent as an additional message between the system prompt and the user prompt."),
            ChatMessage: LlmChatMessage,
            ChatResponse: (0, xrpa_orchestrator_1.Output)(LlmChatMessage),
            ChatResponseStream: (0, xrpa_orchestrator_1.Output)(LlmChatMessage),
        },
    }));
});
function convertJsonSchema(jsonSchema) {
    if (typeof jsonSchema === 'object' && jsonSchema !== null && 'parse' in jsonSchema) {
        const schema = (0, zod_to_json_schema_1.zodToJsonSchema)(jsonSchema);
        delete schema.$schema;
        return JSON.stringify(schema);
    }
    else {
        return jsonSchema;
    }
}
function LlmQuery(params) {
    const dataflowNode = (0, xrpa_orchestrator_1.Instantiate)([(0, xrpa_orchestrator_1.bindExternalProgram)(exports.XredMetaGenInterface), "LlmQuery"], {});
    (0, assert_1.default)((0, xrpa_orchestrator_1.isDataflowForeignObjectInstantiation)(dataflowNode));
    dataflowNode.fieldValues = {
        ...params,
        jsonSchema: convertJsonSchema(params.jsonSchema),
    };
    return {
        isProcessing: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "isProcessing"),
        response: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "response"),
        ResponseStream: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "ResponseStream"),
        QueryComplete: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "QueryComplete"),
    };
}
exports.LlmQuery = LlmQuery;
function LlmTriggeredQuery(params) {
    const dataflowNode = (0, xrpa_orchestrator_1.Instantiate)([(0, xrpa_orchestrator_1.bindExternalProgram)(exports.XredMetaGenInterface), "LlmTriggeredQuery"], {});
    (0, assert_1.default)((0, xrpa_orchestrator_1.isDataflowForeignObjectInstantiation)(dataflowNode));
    dataflowNode.fieldValues = {
        ...params,
        jsonSchema: convertJsonSchema(params.jsonSchema),
    };
    return {
        isProcessing: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "isProcessing"),
        Response: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "Response"),
        ResponseStream: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "ResponseStream"),
    };
}
exports.LlmTriggeredQuery = LlmTriggeredQuery;
function LlmConversation(params) {
    const dataflowNode = (0, xrpa_orchestrator_1.Instantiate)([(0, xrpa_orchestrator_1.bindExternalProgram)(exports.XredMetaGenInterface), "LlmConversation"], {});
    (0, assert_1.default)((0, xrpa_orchestrator_1.isDataflowForeignObjectInstantiation)(dataflowNode));
    dataflowNode.fieldValues = {
        ...params,
    };
    return {
        isProcessing: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "isProcessing"),
        ChatResponse: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "ChatResponse"),
        ChatResponseStream: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "ChatResponseStream"),
    };
}
exports.LlmConversation = LlmConversation;
//# sourceMappingURL=MetaGenInterface.js.map
