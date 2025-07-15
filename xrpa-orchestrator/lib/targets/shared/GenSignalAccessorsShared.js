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
exports.genSignalFieldAccessors = exports.genSignalDispatchBody = void 0;
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const TypeDefinition_1 = require("../../shared/TypeDefinition");
const TypeValue_1 = require("../../shared/TypeValue");
function genSignalDispatchBody(params) {
    const lines = [];
    const typeDef = params.reconcilerDef.type;
    const typeFields = typeDef.getFieldsOfType(TypeDefinition_1.typeIsSignalData);
    for (const fieldName in typeFields) {
        if (!params.reconcilerDef.isInboundField(fieldName)) {
            continue;
        }
        const signalHandler = params.codegen.privateMember(`${fieldName}SignalHandler`);
        const msgType = typeDef.getFieldIndex(fieldName);
        lines.push(...params.codegen.ifEquals(params.codegen.identifierName("messageType"), `${msgType}`, params.codegen.genMessageDispatch({
            namespace: params.namespace,
            includes: params.includes,
            fieldName,
            fieldType: typeFields[fieldName],
            genMsgHandler: () => signalHandler,
            msgDataToParams: () => ["messageData"],
            convertToReadAccessor: false,
        })));
    }
    return lines;
}
exports.genSignalDispatchBody = genSignalDispatchBody;
function genOnSignalAccessor(classSpec, params) {
    const signalHandler = params.codegen.privateMember(`${params.fieldName}SignalHandler`);
    const inboundSignalDataInterface = params.codegen.getXrpaTypes().InboundSignalDataInterface.getLocalType(classSpec.namespace, classSpec.includes);
    classSpec.methods.push({
        name: `on${(0, xrpa_utils_1.upperFirst)(params.fieldName)}`,
        parameters: [{
                name: "handler",
                type: params.codegen.genSharedPointer(inboundSignalDataInterface, classSpec.includes),
            }],
        body: [
            `${params.codegen.genDeref("", signalHandler)} = handler` + params.codegen.STMT_TERM,
        ],
    });
    classSpec.members.push({
        name: signalHandler,
        type: params.codegen.genSharedPointer(inboundSignalDataInterface, classSpec.includes),
        initialValue: new TypeValue_1.CodeLiteralValue(params.codegen, params.codegen.getNullValue()),
        visibility: "private",
    });
}
function genSendSignalAccessor(classSpec, params) {
    const canInferSampleType = params.codegen.HAS_NATIVE_PRIMITIVE_TYPES;
    const localFieldVar = params.codegen.privateMember(`local${(0, xrpa_utils_1.upperFirst)(params.fieldName)}`);
    const localFieldMember = params.codegen.genDeref("", localFieldVar);
    const collection = params.codegen.genDeref("", params.codegen.privateMember("collection"));
    const getXrpaId = params.codegen.genMethodCall("", "getXrpaId", []);
    const MemoryUtils = params.codegen.getXrpaTypes().MemoryUtils.getLocalType(classSpec.namespace, classSpec.includes);
    let SignalProducerCallback = params.codegen.getXrpaTypes().SignalProducerCallback.getLocalType(classSpec.namespace, classSpec.includes);
    let SignalRingBuffer = params.codegen.getXrpaTypes().SignalRingBuffer.getLocalType(classSpec.namespace, classSpec.includes);
    const SignalTypeInference = params.codegen.getXrpaTypes().SignalTypeInference.getLocalType(classSpec.namespace, classSpec.includes);
    const InboundSignalForwarder = params.codegen.getXrpaTypes().InboundSignalForwarder.getLocalType(classSpec.namespace, classSpec.includes);
    const SignalPacket = params.codegen.getXrpaTypes().SignalPacket.getLocalType(classSpec.namespace, classSpec.includes);
    const OutboundSignalData = params.codegen.getXrpaTypes().OutboundSignalData;
    let inferSampleType = params.codegen.nsJoin(SignalTypeInference, "inferSampleType");
    let sizeofSampleType = params.codegen.nsJoin(MemoryUtils, "getTypeSize");
    if (canInferSampleType) {
        SignalProducerCallback = params.codegen.applyTemplateParams(SignalProducerCallback, "SampleType");
        SignalRingBuffer = params.codegen.applyTemplateParams(SignalRingBuffer, "SampleType");
        inferSampleType = params.codegen.applyTemplateParams(inferSampleType, "SampleType");
        sizeofSampleType = params.codegen.applyTemplateParams(sizeofSampleType, "SampleType");
    }
    classSpec.methods.push({
        name: params.name ?? `set${(0, xrpa_utils_1.upperFirst)(params.fieldName)}Callback`,
        decorations: params.decorations,
        templateParams: canInferSampleType ? ["SampleType"] : undefined,
        whereClauses: canInferSampleType ? ["SampleType : unmanaged"] : undefined,
        parameters: [{
                name: "signalCallback",
                type: SignalProducerCallback,
            },
            ...(canInferSampleType ? [] : [{
                    name: "sampleTypeName",
                    type: params.codegen.PRIMITIVE_INTRINSICS.string.typename,
                }]),
            {
                name: "numChannels",
                type: params.codegen.PRIMITIVE_INTRINSICS.int32.typename,
            }, {
                name: "framesPerSecond",
                type: params.codegen.PRIMITIVE_INTRINSICS.int32.typename,
            }, {
                name: "framesPerPacket",
                type: params.codegen.PRIMITIVE_INTRINSICS.int32.typename,
            }],
        body: () => {
            return [
                params.codegen.genMethodCall(localFieldMember, "setSignalSource", [
                    params.codegen.identifierName("signalCallback"),
                    params.codegen.identifierName("numChannels"),
                    params.codegen.identifierName("framesPerSecond"),
                    params.codegen.identifierName("framesPerPacket"),
                    ...(canInferSampleType ? [] : [params.codegen.identifierName("sampleTypeName")]),
                ]) + params.codegen.STMT_TERM,
            ];
        },
        separateImplementation: params.separateImplementation,
    });
    classSpec.methods.push({
        name: params.name ?? `set${(0, xrpa_utils_1.upperFirst)(params.fieldName)}RingBuffer`,
        decorations: params.decorations,
        templateParams: canInferSampleType ? ["SampleType"] : undefined,
        whereClauses: canInferSampleType ? ["SampleType : unmanaged"] : undefined,
        parameters: [{
                name: "signalRingBuffer",
                type: params.codegen.genPointer(SignalRingBuffer),
            },
            ...(canInferSampleType ? [] : [{
                    name: "sampleTypeName",
                    type: params.codegen.PRIMITIVE_INTRINSICS.string.typename,
                }]),
            {
                name: "numChannels",
                type: params.codegen.PRIMITIVE_INTRINSICS.int32.typename,
            }, {
                name: "framesPerSecond",
                type: params.codegen.PRIMITIVE_INTRINSICS.int32.typename,
            }, {
                name: "framesPerPacket",
                type: params.codegen.PRIMITIVE_INTRINSICS.int32.typename,
            }],
        body: () => {
            return [
                params.codegen.genMethodCall(localFieldMember, "setSignalSource", [
                    params.codegen.identifierName("signalRingBuffer"),
                    params.codegen.identifierName("numChannels"),
                    params.codegen.identifierName("framesPerSecond"),
                    params.codegen.identifierName("framesPerPacket"),
                    ...(canInferSampleType ? [] : [params.codegen.identifierName("sampleTypeName")]),
                ]) + params.codegen.STMT_TERM,
            ];
        },
        separateImplementation: params.separateImplementation,
    });
    classSpec.methods.push({
        name: params.name ?? `set${(0, xrpa_utils_1.upperFirst)(params.fieldName)}Forwarder`,
        decorations: params.decorations,
        templateParams: canInferSampleType ? ["SampleType"] : undefined,
        whereClauses: canInferSampleType ? ["SampleType : unmanaged"] : undefined,
        parameters: [{
                name: "signalForwarder",
                type: params.codegen.genSharedPointer(InboundSignalForwarder, classSpec.includes),
            }],
        body: () => {
            return [
                params.codegen.genMethodCall(localFieldMember, "setRecipient", [getXrpaId, collection, `${messageType}`]) + params.codegen.STMT_TERM,
                params.codegen.genDerefMethodCall(params.codegen.identifierName("signalForwarder"), "addRecipient", [localFieldMember]) + params.codegen.STMT_TERM,
            ];
        },
        separateImplementation: params.separateImplementation,
    });
    classSpec.methods.push({
        name: `send${(0, xrpa_utils_1.upperFirst)(params.fieldName)}`,
        decorations: params.decorations,
        templateParams: canInferSampleType ? ["SampleType"] : undefined,
        whereClauses: canInferSampleType ? ["SampleType : unmanaged"] : undefined,
        returnType: SignalPacket,
        parameters: [{
                name: "frameCount",
                type: params.codegen.PRIMITIVE_INTRINSICS.int32.typename,
            },
            ...(canInferSampleType ? [] : [{
                    name: "sampleTypeName",
                    type: params.codegen.PRIMITIVE_INTRINSICS.string.typename,
                }]),
            {
                name: "numChannels",
                type: params.codegen.PRIMITIVE_INTRINSICS.int32.typename,
            }, {
                name: "framesPerSecond",
                type: params.codegen.PRIMITIVE_INTRINSICS.int32.typename,
            }],
        body: () => {
            return [
                params.codegen.genDeclaration({
                    typename: params.codegen.PRIMITIVE_INTRINSICS.int32.typename,
                    inNamespace: classSpec.namespace,
                    varName: "sampleType",
                    initialValue: new TypeValue_1.CodeLiteralValue(params.codegen, params.codegen.genMethodCall("", inferSampleType, canInferSampleType ? [] : [params.codegen.identifierName("sampleTypeName")])),
                    includeTerminator: true,
                }),
                params.codegen.genMethodCall(localFieldMember, "setRecipient", [getXrpaId, collection, `${messageType}`]) + params.codegen.STMT_TERM,
                "return " + params.codegen.genMethodCall(localFieldMember, "sendSignalPacket", [
                    params.codegen.genMethodCall("", sizeofSampleType, canInferSampleType ? [] : [params.codegen.identifierName("sampleTypeName")]),
                    params.codegen.identifierName("frameCount"),
                    params.codegen.identifierName("sampleType"),
                    params.codegen.identifierName("numChannels"),
                    params.codegen.identifierName("framesPerSecond"),
                ]) + params.codegen.STMT_TERM,
            ];
        },
        separateImplementation: params.separateImplementation,
    });
    classSpec.members.push({
        name: localFieldVar,
        type: OutboundSignalData,
        initialValue: new TypeValue_1.EmptyValue(params.codegen, OutboundSignalData.getLocalType(classSpec.namespace, classSpec.includes), classSpec.namespace),
        visibility: "private",
    });
    const messageType = params.typeDef.getFieldIndex(params.fieldName);
    params.tickLines.push(params.codegen.genMethodCall(localFieldMember, "setRecipient", ["id", collection, `${messageType}`]) + params.codegen.STMT_TERM, params.codegen.genMethodCall(localFieldMember, "tick", []) + params.codegen.STMT_TERM);
}
function genSignalFieldAccessors(classSpec, params) {
    const typeDef = params.reconcilerDef.type;
    const typeFields = typeDef.getFieldsOfType(TypeDefinition_1.typeIsSignalData);
    const tickLines = [];
    for (const fieldName in typeFields) {
        const fieldType = typeFields[fieldName];
        if (params.reconcilerDef.isInboundField(fieldName)) {
            genOnSignalAccessor(classSpec, {
                ...params,
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
        const getXrpaId = params.codegen.genMethodCall("", "getXrpaId", []);
        classSpec.methods.push({
            name: "tickXrpa",
            body: [
                params.codegen.genDeclaration({
                    typename: params.codegen.PRIMITIVE_INTRINSICS.autovar.typename,
                    inNamespace: classSpec.namespace,
                    varName: "id",
                    initialValue: new TypeValue_1.CodeLiteralValue(params.codegen, getXrpaId),
                    includeTerminator: true,
                }),
                ...tickLines,
            ],
        });
    }
}
exports.genSignalFieldAccessors = genSignalFieldAccessors;
//# sourceMappingURL=GenSignalAccessorsShared.js.map
