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
exports.genMessageChannelDispatch = exports.genMessageFieldAccessors = exports.genOnMessageAccessor = exports.genSendMessageAccessor = void 0;
const Helpers_1 = require("../../shared/Helpers");
const TypeDefinition_1 = require("../../shared/TypeDefinition");
const TypeValue_1 = require("../../shared/TypeValue");
const GenMessageAccessorsShared_1 = require("../shared/GenMessageAccessorsShared");
const CppCodeGenImpl_1 = require("./CppCodeGenImpl");
const CppCodeGenImpl = __importStar(require("./CppCodeGenImpl"));
const CppDatasetLibraryTypes_1 = require("./CppDatasetLibraryTypes");
const GenSignalAccessors_1 = require("./GenSignalAccessors");
function genMessageParamInitializer(ctx, includes, msgType) {
    const lines = [];
    const msgFields = msgType.getStateFields();
    for (const key in msgFields) {
        const fieldType = msgFields[key].type;
        if ((0, TypeDefinition_1.typeIsReference)(fieldType)) {
            lines.push(`message.set${(0, Helpers_1.upperFirst)(key)}(${fieldType.convertValueFromLocal(ctx.namespace, includes, key)});`);
        }
        else {
            lines.push(`message.set${(0, Helpers_1.upperFirst)(key)}(${key});`);
        }
    }
    return lines;
}
function genSendMessageBody(params) {
    const lines = [];
    if (params.proxyObj) {
        const msgParams = Object.keys(params.fieldType.getStateFields());
        lines.push(`${params.proxyObj}->send${(0, Helpers_1.upperFirst)(params.fieldName)}(${msgParams.join(", ")});`);
    }
    else {
        const messageType = params.typeDef.getFieldIndex(params.fieldName);
        if (params.fieldType.hasFields()) {
            const msgWriteAccessor = params.fieldType.getWriteAccessorType(params.ctx.namespace, params.includes);
            lines.push(`auto message = ${msgWriteAccessor}(reconciler_->sendMessage(`, `    getDSID(),`, `    ${messageType},`, `    ${msgWriteAccessor}::DS_SIZE));`, ...genMessageParamInitializer(params.ctx, params.includes, params.fieldType));
        }
        else {
            lines.push(`reconciler_->sendMessage(`, `    getDSID(),`, `    ${messageType},`, `    0);`);
        }
    }
    return lines;
}
function genSendMessageAccessor(classSpec, params) {
    classSpec.methods.push({
        name: params.name ?? `send${(0, Helpers_1.upperFirst)(params.fieldName)}`,
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
        const msgHandler = params.genMsgHandler(fieldName);
        const handlerCanBeNull = msgHandler.indexOf(".") < 0;
        const msgType = typeDef.getFieldIndex(fieldName);
        const validateMsgHandler = handlerCanBeNull ? ` && ${msgHandler}` : "";
        if (!fieldType.hasFields()) {
            lines.push(`if (messageType == ${msgType}${validateMsgHandler}) {`, `  ${msgHandler}(timestamp);`, `}`);
        }
        else {
            const prelude = [];
            const msgParams = ["timestamp"].concat(params.msgDataToParams(fieldType, prelude, params.includes));
            lines.push(`if (messageType == ${msgType}${validateMsgHandler}) {`, `  auto message = ${fieldType.getReadAccessorType(params.ctx.namespace, params.includes)}(messageData);`, ...(0, Helpers_1.indent)(1, prelude), `  ${msgHandler}(${msgParams.join(", ")});`, `}`);
        }
    }
    return lines;
}
function genOnMessageAccessor(classSpec, params) {
    const paramTypes = [CppCodeGenImpl_1.PRIMITIVE_INTRINSICS.int32.typename];
    if (params.fieldType.hasFields()) {
        paramTypes.push(params.fieldType.declareLocalParam(params.ctx.namespace, classSpec.includes, ""));
    }
    const msgHandler = params.genMsgHandler(params.fieldName);
    classSpec.methods.push({
        name: `on${(0, Helpers_1.upperFirst)(params.fieldName)}`,
        parameters: [{
                name: "handler",
                type: `std::function<void(${paramTypes.join(", ")})>`,
            }],
        body: [
            `${msgHandler} = handler;`,
        ],
    });
    classSpec.members.push({
        name: msgHandler,
        type: `std::function<void(${paramTypes.join(", ")})>`,
        initialValue: new TypeValue_1.CodeLiteralValue(CppCodeGenImpl, "nullptr"),
        visibility: "private",
    });
}
exports.genOnMessageAccessor = genOnMessageAccessor;
function genMessageFieldAccessors(classSpec, params) {
    const typeDef = params.reconcilerDef.type;
    const typeFields = typeDef.getFieldsOfType(TypeDefinition_1.typeIsMessageData);
    for (const fieldName in typeFields) {
        const fieldType = typeFields[fieldName];
        if (params.reconcilerDef.isInboundField(fieldName)) {
            genOnMessageAccessor(classSpec, {
                ...params,
                typeDef,
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
                referencesNeedConversion: true,
                separateImplementation: true,
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
                type: CppCodeGenImpl_1.PRIMITIVE_INTRINSICS.int32.typename,
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
