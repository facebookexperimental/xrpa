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
exports.genMessageFieldAccessors = exports.genMessageChannelDispatch = exports.genSendMessageAccessor = void 0;
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const TypeDefinition_1 = require("../../shared/TypeDefinition");
const GenMessageAccessorsShared_1 = require("../shared/GenMessageAccessorsShared");
const GenSignalAccessorsShared_1 = require("../shared/GenSignalAccessorsShared");
const PythonCodeGenImpl_1 = require("./PythonCodeGenImpl");
const PythonCodeGenImpl = __importStar(require("./PythonCodeGenImpl"));
const PythonDatasetLibraryTypes_1 = require("./PythonDatasetLibraryTypes");
function genMessageParamInitializer(msgType) {
    const lines = [];
    const paramNames = (0, GenMessageAccessorsShared_1.getMessageParamNames)(msgType);
    for (const key in paramNames) {
        lines.push(`message.set_${(0, PythonCodeGenImpl_1.identifierName)(key)}(${(0, PythonCodeGenImpl_1.identifierName)(paramNames[key])})`);
    }
    return lines;
}
function genMessageSize(namespace, includes, msgType) {
    const dynFieldSizes = [];
    let staticSize = 0;
    const msgFields = msgType.getStateFields();
    for (const key in msgFields) {
        const fieldType = msgFields[key].type;
        const byteCount = fieldType.getRuntimeByteCount((0, PythonCodeGenImpl_1.identifierName)((0, GenMessageAccessorsShared_1.getMessageParamName)(key)), namespace, includes);
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
        lines.push(`${params.proxyObj}.send_${params.fieldName}(${msgParams.join(", ")})`);
    }
    else {
        const messageType = params.typeDef.getFieldIndex(params.fieldName);
        if (params.fieldType.hasFields()) {
            const msgWriteAccessor = params.fieldType.getWriteAccessorType(params.namespace, params.includes);
            lines.push(`message = ${msgWriteAccessor}(self._collection.send_message(`, `    self.get_xrpa_id(),`, `    ${messageType},`, `    ${genMessageSize(params.namespace, params.includes, params.fieldType)}))`, ...genMessageParamInitializer(params.fieldType));
        }
        else {
            lines.push(`self._collection.send_message(`, `    self.get_xrpa_id(),`, `    ${messageType},`, `    0)`);
        }
    }
    return lines;
}
function isImageStruct(type) {
    if (!(0, TypeDefinition_1.typeIsStruct)(type)) {
        return false;
    }
    return Boolean(type.properties.isImage);
}
function genSendMessageAccessor(classSpec, params) {
    classSpec.methods.push({
        name: params.name ?? `send_${params.fieldName}`,
        parameters: (0, GenMessageAccessorsShared_1.genMessageMethodParams)({ ...params, namespace: classSpec.namespace, includes: classSpec.includes }),
        body: includes => genSendMessageBody({ ...params, namespace: classSpec.namespace, includes }),
    });
    const messageFields = params.fieldType.getStateFields();
    const messageFieldNames = Object.keys(messageFields);
    if (messageFieldNames.length !== 1) {
        return;
    }
    // PsyhcoPy window source helper
    const messageFieldType = messageFields[messageFieldNames[0]].type;
    if (isImageStruct(messageFieldType)) {
        const imageType = messageFieldType.getLocalType(classSpec.namespace, classSpec.includes);
        const imageFormat = messageFieldType.getStateField("format").getLocalType(classSpec.namespace, classSpec.includes);
        const imageEncoding = messageFieldType.getStateField("encoding").getLocalType(classSpec.namespace, classSpec.includes);
        const imageOrientation = messageFieldType.getStateField("orientation").getLocalType(classSpec.namespace, classSpec.includes);
        classSpec.includes?.addFile({ namespace: "io" });
        classSpec.includes?.addFile({ namespace: "typing" });
        classSpec.methods.push({
            name: `send_${params.fieldName}_pil_image`,
            parameters: [{
                    name: "pil_image",
                    type: "typing.Any",
                }],
            body: [
                `jpeg_data = io.BytesIO()`,
                `pil_image.save(jpeg_data, format='JPEG')`,
                `jpeg_data.seek(0)`,
                `image_data = ${imageType}(`,
                `  pil_image.width,`,
                `  pil_image.height,`,
                `  ${imageFormat}.RGB8,`,
                `  ${imageEncoding}.Jpeg,`,
                `  ${imageOrientation}.Oriented,`,
                `  1.0,`,
                `  0,`,
                `  ${(0, PythonCodeGenImpl_1.genGetCurrentClockTime)(classSpec.includes)},`,
                `  0,`,
                `  bytearray(jpeg_data.read())`,
                `)`,
                `self.send_${params.fieldName}(image_data)`,
            ],
        });
        classSpec.methods.push({
            name: `set_${params.fieldName}_source`,
            parameters: [{
                    name: "source",
                    type: "typing.Any",
                }],
            body: [
                `source._startOfFlip = lambda: (self.send_${params.fieldName}_pil_image(source._getFrame(buffer="back")), True)[1]`,
            ],
            decorations: (0, PythonCodeGenImpl_1.genCommentLines)("Helper for setting a PsychoPy window as the source of an image message."),
        });
    }
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
        lines.push(`if message_type == ${msgType}:`, ...(0, xrpa_utils_1.indent)(1, (0, PythonCodeGenImpl_1.genMessageDispatch)({
            namespace: params.namespace,
            includes: params.includes,
            fieldName,
            fieldType,
            genMsgHandler: params.genMsgHandler,
            msgDataToParams: params.msgDataToParams,
            convertToReadAccessor: true,
        })));
    }
    return lines;
}
function genMessageChannelDispatch(classSpec, params) {
    classSpec.methods.push({
        name: "process_ds_message",
        parameters: [{
                name: "message_type",
                type: PythonCodeGenImpl_1.PRIMITIVE_INTRINSICS.int32.typename,
            }, {
                name: "msgTimestamp",
                type: PythonCodeGenImpl_1.PRIMITIVE_INTRINSICS.uint64.typename,
            }, {
                name: "message_data",
                type: PythonDatasetLibraryTypes_1.MemoryAccessor,
            }],
        body: includes => {
            return [
                ...genMessageDispatchBody({ ...params, namespace: classSpec.namespace, includes }),
                ...(0, GenSignalAccessorsShared_1.genSignalDispatchBody)({ ...params, namespace: classSpec.namespace, includes, codegen: PythonCodeGenImpl }),
            ];
        },
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
            (0, GenMessageAccessorsShared_1.genOnMessageAccessor)(classSpec, {
                codegen: PythonCodeGenImpl,
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
                proxyObj: null,
            });
        }
    }
}
exports.genMessageFieldAccessors = genMessageFieldAccessors;
//# sourceMappingURL=GenMessageAccessors.js.map
