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

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.genMessageChannelDispatch = exports.genMessageFieldAccessors = exports.genSendMessageAccessor = void 0;
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const TypeDefinition_1 = require("../../shared/TypeDefinition");
const GenMessageAccessorsShared_1 = require("../shared/GenMessageAccessorsShared");
const GenSignalAccessorsShared_1 = require("../shared/GenSignalAccessorsShared");
const CppCodeGenImpl_1 = require("./CppCodeGenImpl");
const CppCodeGenImpl = __importStar(require("./CppCodeGenImpl"));
const CppDatasetLibraryTypes_1 = require("./CppDatasetLibraryTypes");
function genMessageParamInitializer(msgType) {
    const lines = [];
    const paramNames = (0, GenMessageAccessorsShared_1.getMessageParamNames)(msgType);
    for (const key in paramNames) {
        lines.push(`message.set${(0, xrpa_utils_1.upperFirst)(key)}(${paramNames[key]});`);
    }
    return lines;
}
function genMessageSize(namespace, includes, msgType) {
    const dynFieldSizes = [];
    let staticSize = 0;
    const msgFields = msgType.getStateFields();
    for (const key in msgFields) {
        const fieldType = msgFields[key].type;
        const byteCount = fieldType.getRuntimeByteCount((0, GenMessageAccessorsShared_1.getMessageParamName)(key), namespace, includes);
        staticSize += byteCount[0];
        if (byteCount[1] !== null) {
            dynFieldSizes.push(byteCount[1]);
        }
    }
    dynFieldSizes.push(staticSize.toString());
    return dynFieldSizes.join(" + ");
}
function genSendMessageBody(params) {
    const lines = [];
    if (params.proxyObj) {
        const msgParams = Object.values((0, GenMessageAccessorsShared_1.getMessageParamNames)(params.fieldType));
        lines.push(`if (${params.proxyObj}) { ${params.proxyObj}->send${(0, xrpa_utils_1.upperFirst)(params.fieldName)}(${msgParams.join(", ")}); }`);
    }
    else {
        const messageType = params.typeDef.getFieldIndex(params.fieldName);
        if (params.fieldType.hasFields()) {
            const msgWriteAccessor = params.fieldType.getWriteAccessorType(params.namespace, params.includes);
            lines.push(`auto message = ${msgWriteAccessor}(collection_->sendMessage(`, `    getXrpaId(),`, `    ${messageType},`, `    ${genMessageSize(params.namespace, params.includes, params.fieldType)}));`, ...genMessageParamInitializer(params.fieldType));
        }
        else {
            lines.push(`collection_->sendMessage(`, `    getXrpaId(),`, `    ${messageType},`, `    0);`);
        }
    }
    return lines;
}
function genSendMessageAccessor(classSpec, params) {
    classSpec.methods.push({
        name: params.name ?? `send${(0, xrpa_utils_1.upperFirst)(params.fieldName)}`,
        decorations: params.decorations,
        parameters: (0, GenMessageAccessorsShared_1.genMessageMethodParams)({ ...params, namespace: classSpec.namespace, includes: classSpec.includes }),
        body: includes => genSendMessageBody({ ...params, namespace: classSpec.namespace, includes }),
        separateImplementation: params.separateImplementation,
    });
}
exports.genSendMessageAccessor = genSendMessageAccessor;
function genMessageDispatchBody(params) {
    const lines = [];
    const typeDef = params.reconcilerDef.type;
    const typeFields = typeDef.getFieldsOfType(TypeDefinition_1.typeIsMessageData);
    for (const fieldName in typeFields) {
        if (!params.reconcilerDef.isInboundField(fieldName)) {
            continue;
        }
        const fieldType = typeFields[fieldName];
        const msgType = typeDef.getFieldIndex(fieldName);
        lines.push(`if (messageType == ${msgType}) {`, ...(0, xrpa_utils_1.indent)(1, (0, CppCodeGenImpl_1.genMessageDispatch)({
            namespace: params.namespace,
            includes: params.includes,
            fieldName,
            fieldType,
            genMsgHandler: params.genMsgHandler,
            msgDataToParams: params.msgDataToParams,
            convertToReadAccessor: true,
        })), `}`);
    }
    return lines;
}
function genMessageFieldAccessors(classSpec, params) {
    const typeDef = params.reconcilerDef.type;
    const typeFields = typeDef.getFieldsOfType(TypeDefinition_1.typeIsMessageData);
    for (const fieldName in typeFields) {
        const fieldType = typeFields[fieldName];
        if (params.reconcilerDef.isInboundField(fieldName)) {
            (0, GenMessageAccessorsShared_1.genOnMessageAccessor)(classSpec, {
                ...params,
                codegen: CppCodeGenImpl,
                fieldName,
                fieldType,
            });
        }
        if (params.reconcilerDef.isOutboundField(fieldName)) {
            genSendMessageAccessor(classSpec, {
                ...params,
                typeDef,
                fieldName,
                fieldType,
                proxyObj: null,
            });
        }
    }
}
exports.genMessageFieldAccessors = genMessageFieldAccessors;
/*********************************************************************/
function genMessageChannelDispatch(classSpec, params) {
    classSpec.methods.push({
        name: "processDSMessage",
        parameters: [{
                name: "messageType",
                type: CppCodeGenImpl_1.PRIMITIVE_INTRINSICS.int32.typename,
            }, {
                name: "msgTimestamp",
                type: CppCodeGenImpl_1.PRIMITIVE_INTRINSICS.uint64.typename,
            }, {
                name: "messageData",
                type: CppDatasetLibraryTypes_1.MemoryAccessor,
            }],
        body: includes => {
            return [
                ...genMessageDispatchBody({ ...params, namespace: classSpec.namespace, includes }),
                ...(0, GenSignalAccessorsShared_1.genSignalDispatchBody)({ ...params, namespace: classSpec.namespace, includes, codegen: CppCodeGenImpl }),
            ];
        },
        separateImplementation: params.separateImplementation,
    });
}
exports.genMessageChannelDispatch = genMessageChannelDispatch;
//# sourceMappingURL=GenMessageAccessors.js.map
