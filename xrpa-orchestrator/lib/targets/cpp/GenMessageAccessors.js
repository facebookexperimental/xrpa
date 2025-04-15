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
exports.genMessageChannelDispatch = exports.genMessageFieldAccessors = exports.genSendMessageAccessor = void 0;
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const TypeDefinition_1 = require("../../shared/TypeDefinition");
const GenMessageAccessorsShared_1 = require("../shared/GenMessageAccessorsShared");
const CppCodeGenImpl_1 = require("./CppCodeGenImpl");
const CppDatasetLibraryTypes_1 = require("./CppDatasetLibraryTypes");
const GenSignalAccessors_1 = require("./GenSignalAccessors");
function genMessageParamInitializer(ctx, includes, msgType) {
    const lines = [];
    const msgFields = msgType.getStateFields();
    for (const key in msgFields) {
        const fieldType = msgFields[key].type;
        if ((0, TypeDefinition_1.typeIsReference)(fieldType)) {
            lines.push(`message.set${(0, xrpa_utils_1.upperFirst)(key)}(${fieldType.convertValueFromLocal(ctx.namespace, includes, key)});`);
        }
        else {
            lines.push(`message.set${(0, xrpa_utils_1.upperFirst)(key)}(${key});`);
        }
    }
    return lines;
}
function genMessageSize(ctx, includes, msgType) {
    const dynFieldSizes = [];
    let staticSize = 0;
    const msgFields = msgType.getStateFields();
    for (const key in msgFields) {
        const fieldType = msgFields[key].type;
        const byteCount = fieldType.getRuntimeByteCount(key, ctx.namespace, includes);
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
        lines.push(`${params.proxyObj}->send${(0, xrpa_utils_1.upperFirst)(params.fieldName)}(${msgParams.join(", ")});`);
    }
    else {
        const messageType = params.typeDef.getFieldIndex(params.fieldName);
        if (params.fieldType.hasFields()) {
            const msgWriteAccessor = params.fieldType.getWriteAccessorType(params.ctx.namespace, params.includes);
            lines.push(`auto message = ${msgWriteAccessor}(collection_->sendMessage(`, `    getXrpaId(),`, `    ${messageType},`, `    ${genMessageSize(params.ctx, params.includes, params.fieldType)}));`, ...genMessageParamInitializer(params.ctx, params.includes, params.fieldType));
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
        parameters: (0, GenMessageAccessorsShared_1.genMessageMethodParams)({ ...params, includes: classSpec.includes }),
        body: includes => genSendMessageBody({ ...params, includes }),
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
            namespace: params.ctx.namespace,
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
            (0, CppCodeGenImpl_1.genOnMessageAccessor)(classSpec, {
                namespace: params.ctx.namespace,
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
                separateImplementation: true,
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
                name: "timestamp",
                type: CppCodeGenImpl_1.PRIMITIVE_INTRINSICS.uint64.typename,
            }, {
                name: "messageData",
                type: CppDatasetLibraryTypes_1.MemoryAccessor,
            }],
        body: includes => {
            return [
                ...genMessageDispatchBody({ ...params, includes }),
                ...(0, GenSignalAccessors_1.genSignalDispatchBody)({ ...params, includes }),
            ];
        },
        separateImplementation: params.separateImplementation,
    });
}
exports.genMessageChannelDispatch = genMessageChannelDispatch;
//# sourceMappingURL=GenMessageAccessors.js.map
