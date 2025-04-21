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

Object.defineProperty(exports, "__esModule", { value: true });
exports.genMessageFieldAccessors = exports.genMessageChannelDispatch = exports.genSendMessageAccessor = void 0;
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const TypeDefinition_1 = require("../../shared/TypeDefinition");
const GenMessageAccessorsShared_1 = require("../shared/GenMessageAccessorsShared");
const CsharpCodeGenImpl_1 = require("./CsharpCodeGenImpl");
const CsharpDatasetLibraryTypes_1 = require("./CsharpDatasetLibraryTypes");
function genMessageParamInitializer(namespace, includes, msgType) {
    const lines = [];
    const msgFields = msgType.getStateFields();
    for (const key in msgFields) {
        const fieldType = msgFields[key].type;
        if ((0, TypeDefinition_1.typeIsReference)(fieldType)) {
            lines.push(`message.Set${(0, xrpa_utils_1.upperFirst)(key)}(${fieldType.convertValueFromLocal(namespace, includes, key)});`);
        }
        else {
            lines.push(`message.Set${(0, xrpa_utils_1.upperFirst)(key)}(${key});`);
        }
    }
    return lines;
}
function genMessageSize(namespace, includes, msgType) {
    const dynFieldSizes = [];
    let staticSize = 0;
    const msgFields = msgType.getStateFields();
    for (const key in msgFields) {
        const fieldType = msgFields[key].type;
        const byteCount = fieldType.getRuntimeByteCount(key, namespace, includes);
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
        const msgParams = Object.keys(params.fieldType.getStateFields());
        lines.push(`${params.proxyObj}?.Send${params.fieldName}(${msgParams.join(", ")});`);
    }
    else {
        const messageType = params.typeDef.getFieldIndex(params.fieldName);
        if (params.fieldType.hasFields()) {
            const msgWriteAccessor = params.fieldType.getWriteAccessorType(params.namespace, params.includes);
            lines.push(`${msgWriteAccessor} message = new(_collection.SendMessage(`, `    GetXrpaId(),`, `    ${messageType},`, `    ${genMessageSize(params.namespace, params.includes, params.fieldType)}));`, ...genMessageParamInitializer(params.namespace, params.includes, params.fieldType));
        }
        else {
            lines.push(`_collection.SendMessage(`, `    GetXrpaId(),`, `    ${messageType},`, `    0);`);
        }
    }
    return lines;
}
function genSendMessageAccessor(classSpec, params) {
    classSpec.methods.push({
        name: params.name ?? `Send${params.fieldName}`,
        parameters: (0, GenMessageAccessorsShared_1.genMessageMethodParams)({ ...params, includes: classSpec.includes }),
        body: includes => genSendMessageBody({ ...params, includes }),
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
        lines.push(`if (messageType == ${msgType}) {`, ...(0, xrpa_utils_1.indent)(1, (0, CsharpCodeGenImpl_1.genMessageDispatch)({
            ...params,
            fieldName,
            fieldType,
            convertToReadAccessor: true,
        })), `}`);
    }
    return lines;
}
function genMessageChannelDispatch(classSpec, params) {
    classSpec.methods.push({
        name: "ProcessDSMessage",
        parameters: [{
                name: "messageType",
                type: CsharpCodeGenImpl_1.PRIMITIVE_INTRINSICS.int32.typename,
            }, {
                name: "timestamp",
                type: CsharpCodeGenImpl_1.PRIMITIVE_INTRINSICS.uint64.typename,
            }, {
                name: "messageData",
                type: CsharpDatasetLibraryTypes_1.MemoryAccessor,
            }],
        body: includes => genMessageDispatchBody({ ...params, includes }),
        isOverride: params.isOverride,
    });
}
exports.genMessageChannelDispatch = genMessageChannelDispatch;
function genMessageFieldAccessors(classSpec, params) {
    const typeDef = params.reconcilerDef.type;
    const typeFields = typeDef.getFieldsOfType(TypeDefinition_1.typeIsMessageData);
    for (const fieldName in typeFields) {
        const fieldType = typeFields[fieldName];
        if (params.reconcilerDef.isInboundField(fieldName)) {
            (0, CsharpCodeGenImpl_1.genOnMessageAccessor)(classSpec, {
                namespace: params.namespace,
                fieldName,
                fieldType,
                genMsgHandler: params.genMsgHandler,
            });
        }
        if (params.reconcilerDef.isOutboundField(fieldName)) {
            genSendMessageAccessor(classSpec, {
                ...params,
                typeDef,
                fieldName,
                fieldType,
                referencesNeedConversion: true,
                proxyObj: null,
            });
        }
    }
}
exports.genMessageFieldAccessors = genMessageFieldAccessors;
//# sourceMappingURL=GenMessageAccessors.js.map
