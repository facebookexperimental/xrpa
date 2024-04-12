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
exports.genSignalFieldAccessors = exports.genSendSignalAccessor = exports.genOnSignalAccessor = exports.genSignalDispatchBody = void 0;
const Helpers_1 = require("../../shared/Helpers");
const TypeDefinition_1 = require("../../shared/TypeDefinition");
const TypeValue_1 = require("../../shared/TypeValue");
const CppCodeGenImpl_1 = require("./CppCodeGenImpl");
const CppCodeGenImpl = __importStar(require("./CppCodeGenImpl"));
const CppDatasetLibraryTypes_1 = require("./CppDatasetLibraryTypes");
function genSignalDispatchBody(params) {
    const lines = [];
    const typeDef = params.reconcilerDef.type;
    const typeFields = typeDef.getFieldsOfType(TypeDefinition_1.typeIsSignalData);
    for (const fieldName in typeFields) {
        if (!params.reconcilerDef.isInboundField(fieldName)) {
            continue;
        }
        const handlerVar = `${fieldName}SignalHandler_`;
        const handlerCanBeNull = handlerVar.indexOf(".") < 0;
        const msgType = typeDef.getFieldIndex(fieldName);
        const validateMsgHandler = handlerCanBeNull ? ` && ${handlerVar}` : "";
        lines.push(`if (messageType == ${msgType}${validateMsgHandler}) {`, `  ${handlerVar}->onSignalData(timestamp, messageData);`, `}`);
    }
    return lines;
}
exports.genSignalDispatchBody = genSignalDispatchBody;
function genOnSignalAccessor(classSpec, params) {
    const signalHandler = `${params.fieldName}SignalHandler_`;
    classSpec.methods.push({
        name: `on${(0, Helpers_1.upperFirst)(params.fieldName)}`,
        parameters: [{
                name: "handler",
                type: `std::shared_ptr<${CppDatasetLibraryTypes_1.InboundSignalDataInterface.getLocalType(params.ctx.namespace, classSpec.includes)}>`,
            }, {
                name: "dataReadyCB",
                type: "const std::function<void()>&",
                defaultValue: "nullptr",
            }],
        body: [
            `${signalHandler} = handler;`,
            `if (handler && dataReadyCB) {`,
            `  handler->onDataReady(dataReadyCB);`,
            `}`,
        ],
    });
    classSpec.members.push({
        name: signalHandler,
        type: `std::shared_ptr<${CppDatasetLibraryTypes_1.InboundSignalDataInterface.getLocalType(params.ctx.namespace, classSpec.includes)}>`,
        initialValue: new TypeValue_1.CodeLiteralValue(CppCodeGenImpl, "nullptr"),
        visibility: "private",
    });
}
exports.genOnSignalAccessor = genOnSignalAccessor;
function genSendSignalAccessor(classSpec, params) {
    classSpec.methods.push({
        name: params.name ?? `set${(0, Helpers_1.upperFirst)(params.fieldName)}`,
        decorations: params.decorations,
        templateParams: ["SampleType"],
        parameters: [{
                name: "signal",
                type: `${CppDatasetLibraryTypes_1.SignalProducerCallback.getLocalType(params.ctx.namespace, classSpec.includes)}<SampleType>`,
            }, {
                name: "numChannels",
                type: CppCodeGenImpl_1.PRIMITIVE_INTRINSICS.int32.typename,
            }, {
                name: "samplesPerChannelPerSec",
                type: CppCodeGenImpl_1.PRIMITIVE_INTRINSICS.int32.typename,
            }, {
                name: "samplesPerCallback",
                type: CppCodeGenImpl_1.PRIMITIVE_INTRINSICS.int32.typename,
            }],
        body: () => {
            return [
                `local${(0, Helpers_1.upperFirst)(params.fieldName)}_.setSignalSource(signal, numChannels, samplesPerChannelPerSec, samplesPerCallback);`,
            ];
        },
        separateImplementation: params.separateImplementation,
    });
    classSpec.members.push({
        name: `local${(0, Helpers_1.upperFirst)(params.fieldName)}`,
        type: CppDatasetLibraryTypes_1.OutboundSignalData.getLocalType(params.ctx.namespace, classSpec.includes),
        visibility: "private",
    });
    const messageType = params.typeDef.getFieldIndex(params.fieldName);
    params.tickLines.push(`local${(0, Helpers_1.upperFirst)(params.fieldName)}_.tick(id, ${messageType}, reconciler_);`);
}
exports.genSendSignalAccessor = genSendSignalAccessor;
function genSignalFieldAccessors(classSpec, params) {
    const typeDef = params.reconcilerDef.type;
    const typeFields = typeDef.getFieldsOfType(TypeDefinition_1.typeIsSignalData);
    const tickLines = [];
    for (const fieldName in typeFields) {
        const fieldType = typeFields[fieldName];
        if (params.reconcilerDef.isInboundField(fieldName)) {
            genOnSignalAccessor(classSpec, {
                ...params,
                typeDef,
                fieldName,
                fieldType,
            });
        }
        if (params.reconcilerDef.isOutboundField(fieldName)) {
            genSendSignalAccessor(classSpec, {
                ...params,
                typeDef,
                fieldName,
                fieldType,
                referencesNeedConversion: true,
                separateImplementation: true,
                tickLines,
            });
        }
    }
    if (tickLines.length) {
        classSpec.methods.push({
            name: "tickDS",
            body: [
                `auto id = getDSID();`,
                ...tickLines,
            ],
        });
    }
}
exports.genSignalFieldAccessors = genSignalFieldAccessors;
//# sourceMappingURL=GenSignalAccessors.js.map
