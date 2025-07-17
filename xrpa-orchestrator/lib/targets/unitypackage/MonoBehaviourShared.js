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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeMonoBehaviour = exports.genDataStoreObjectAccessors = exports.genProcessUpdateBody = exports.genTransformUpdates = exports.genTransformInitializers = exports.genFieldInitializers = exports.genFieldDefaultInitializers = exports.genUnitySignalFieldAccessors = exports.genUnityMessageFieldAccessors = exports.genUnityMessageProxyDispatch = exports.genUnitySendMessageAccessor = exports.genFieldSetterCalls = exports.genFieldProperties = exports.getFieldMemberName = exports.getComponentClassName = exports.checkForTransformMapping = exports.IntrinsicProperty = void 0;
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const path_1 = __importDefault(require("path"));
const TypeDefinition_1 = require("../../shared/TypeDefinition");
const CsharpCodeGenImpl_1 = require("../csharp/CsharpCodeGenImpl");
const CsharpCodeGenImpl = __importStar(require("../csharp/CsharpCodeGenImpl"));
const GenMessageAccessors_1 = require("../csharp/GenMessageAccessors");
const GenDataStoreShared_1 = require("../shared/GenDataStoreShared");
const CsharpDatasetLibraryTypes_1 = require("../csharp/CsharpDatasetLibraryTypes");
const TypeValue_1 = require("../../shared/TypeValue");
var IntrinsicProperty;
(function (IntrinsicProperty) {
    IntrinsicProperty["position"] = "position";
    IntrinsicProperty["rotation"] = "rotation";
    IntrinsicProperty["lossyScale"] = "lossyScale";
    IntrinsicProperty["Parent"] = "Parent";
    IntrinsicProperty["gameObject"] = "gameObject";
})(IntrinsicProperty = exports.IntrinsicProperty || (exports.IntrinsicProperty = {}));
function checkForTransformMapping(fieldName, reconcilerDef) {
    // outbound fields only
    if (!reconcilerDef.isOutboundField(fieldName)) {
        return false;
    }
    const propertyMap = reconcilerDef.getFieldPropertyBinding(fieldName);
    if (!propertyMap) {
        return false;
    }
    if (typeof propertyMap === "string") {
        return propertyMap !== IntrinsicProperty.Parent && propertyMap !== IntrinsicProperty.gameObject;
    }
    for (const key in propertyMap) {
        if (propertyMap[key] !== IntrinsicProperty.Parent && propertyMap[key] !== IntrinsicProperty.gameObject) {
            return true;
        }
    }
    return false;
}
exports.checkForTransformMapping = checkForTransformMapping;
function getComponentClassName(type, id) {
    const typeName = typeof type === "string" ? type : type.getName();
    return `${(0, xrpa_utils_1.filterToString)(id) ?? ""}${typeName}Component`;
}
exports.getComponentClassName = getComponentClassName;
function getMessageDelegateName(namespace, includes, msgType) {
    const paramTypes = [
        CsharpCodeGenImpl_1.PRIMITIVE_INTRINSICS.uint64.typename, // timestamp
    ];
    const fields = msgType.getStateFields();
    for (const key in fields) {
        const fieldType = fields[key].type;
        paramTypes.push(fieldType.declareLocalParam(namespace, includes, ""));
    }
    return CsharpCodeGenImpl.genEventHandlerType(paramTypes);
}
function getFieldMemberName(reconcilerDef, fieldName) {
    return (0, xrpa_utils_1.filterToString)(reconcilerDef.fieldAccessorNameOverrides[fieldName]) ?? (0, xrpa_utils_1.upperFirst)(fieldName);
}
exports.getFieldMemberName = getFieldMemberName;
function genWriteFieldProperty(classSpec, params) {
    const fieldSpec = params.reconcilerDef.getFieldSpec(params.fieldName);
    const fieldType = fieldSpec.type;
    const typeDef = params.reconcilerDef.type;
    const isBoundToIntrinsic = params.reconcilerDef.isFieldBoundToIntrinsic(params.fieldName);
    const isClearSet = params.reconcilerDef.isClearSetField(params.fieldName);
    const hasSetter = !isBoundToIntrinsic && !isClearSet;
    const isSerialized = params.reconcilerDef.isSerializedField(params.fieldName);
    const pascalFieldName = (0, xrpa_utils_1.upperFirst)(params.fieldName);
    const decorations = [];
    if (isSerialized) {
        decorations.push("[SerializeField]");
    }
    typeDef.declareLocalFieldClassMember(classSpec, params.fieldName, (0, CsharpCodeGenImpl_1.privateMember)(params.memberName), true, decorations, "private");
    if (isClearSet) {
        const overrideParams = (0, xrpa_utils_1.filterToStringArray)(params.reconcilerDef.fieldAccessorNameOverrides[params.fieldName], 2);
        const setterName = overrideParams?.[0] ?? `Set${pascalFieldName}`;
        const clearName = overrideParams?.[1] ?? `Clear${pascalFieldName}`;
        classSpec.methods.push({
            name: setterName,
            body: [
                `if (${params.proxyObj} != null) { ${params.proxyObj}.Set${pascalFieldName}(); }`,
            ],
        });
        classSpec.methods.push({
            name: clearName,
            body: [
                `if (${params.proxyObj} != null) { ${params.proxyObj}.Clear${pascalFieldName}(); }`,
            ],
        });
    }
    classSpec.members.push({
        name: params.memberName,
        type: fieldType,
        getter: (0, CsharpCodeGenImpl_1.privateMember)(params.memberName),
        setter: !hasSetter ? [] : [
            ...(params.setterHooks?.[params.fieldName]?.preSet ?? []),
            `${(0, CsharpCodeGenImpl_1.privateMember)(params.memberName)} = value;`,
            ...(params.setterHooks?.[params.fieldName]?.postSet ?? []),
            ...(params.isOutboundField ? [
                `if (${params.proxyObj} != null) { ${params.proxyObj}.Set${pascalFieldName}(value); }`,
            ] : []),
        ],
    });
    if (isSerialized && hasSetter && params.isOutboundField) {
        params.validateLines.push(`if (${params.proxyObj} != null) { ${params.proxyObj}.Set${pascalFieldName}(${(0, CsharpCodeGenImpl_1.privateMember)(params.memberName)}); }`);
    }
    if (params.reconcilerDef.isIndexedField(params.fieldName)) {
        classSpec.methods.push({
            name: (0, GenDataStoreShared_1.fieldGetterFuncName)(CsharpCodeGenImpl, params.reconcilerDef.type.getStateFields(), params.fieldName),
            returnType: fieldType.declareLocalReturnType(classSpec.namespace, classSpec.includes, true),
            body: [
                `return ${params.memberName};`,
            ],
            visibility: "public",
        });
    }
}
function genReadFieldProperty(classSpec, params) {
    const fieldSpec = params.reconcilerDef.getFieldSpec(params.fieldName);
    const fieldType = fieldSpec.type;
    const typeDef = params.reconcilerDef.type;
    typeDef.declareLocalFieldClassMember(classSpec, params.fieldName, (0, CsharpCodeGenImpl_1.privateMember)(params.memberName), true, [], "private");
    classSpec.members.push({
        name: params.memberName,
        type: fieldType,
        getter: (0, CsharpCodeGenImpl_1.privateMember)(params.memberName),
    });
}
function genFieldProperties(classSpec, params) {
    const validateLines = [];
    const fields = params.reconcilerDef.type.getStateFields();
    for (const fieldName in fields) {
        const memberName = getFieldMemberName(params.reconcilerDef, fieldName);
        const isIndexBoundField = params.reconcilerDef.isIndexBoundField(fieldName);
        const isOutboundField = params.reconcilerDef.isOutboundField(fieldName);
        if (isIndexBoundField || isOutboundField) {
            genWriteFieldProperty(classSpec, { ...params, fieldName, memberName, isOutboundField, validateLines });
        }
        else {
            genReadFieldProperty(classSpec, { ...params, fieldName, memberName });
        }
    }
    if (validateLines.length > 0) {
        classSpec.methods.push({
            name: "OnValidate",
            body: validateLines,
            visibility: "private",
        });
    }
}
exports.genFieldProperties = genFieldProperties;
function genFieldSetterCalls(params) {
    const lines = [];
    const fields = params.reconcilerDef.type.getStateFields();
    for (const fieldName in fields) {
        const memberName = getFieldMemberName(params.reconcilerDef, fieldName);
        if (params.reconcilerDef.isOutboundField(fieldName)) {
            lines.push(`${params.proxyObj}.Set${(0, xrpa_utils_1.upperFirst)(fieldName)}(${(0, CsharpCodeGenImpl_1.privateMember)(memberName)});`);
        }
    }
    return lines;
}
exports.genFieldSetterCalls = genFieldSetterCalls;
/********************************************************/
function genUnitySendMessageAccessor(classSpec, params) {
    (0, GenMessageAccessors_1.genSendMessageAccessor)(classSpec, {
        ...params,
        name: `Send${(0, xrpa_utils_1.upperFirst)(params.fieldName)}`,
    });
}
exports.genUnitySendMessageAccessor = genUnitySendMessageAccessor;
function genUnityMessageProxyDispatch(classSpec, params) {
    const msgEventType = getMessageDelegateName(classSpec.namespace, classSpec.includes, params.fieldType);
    const unityHandlerName = `On${(0, xrpa_utils_1.upperFirst)(params.fieldName)}`;
    const unityDispatchName = `Dispatch${(0, xrpa_utils_1.upperFirst)(params.fieldName)}`;
    const proxyHandlerName = `On${(0, xrpa_utils_1.upperFirst)(params.fieldName)}`;
    classSpec.members.push({
        name: unityHandlerName,
        type: `event ${msgEventType}`,
    });
    const parameters = [{
            name: "timestamp",
            type: CsharpCodeGenImpl_1.PRIMITIVE_INTRINSICS.uint64.typename,
        }];
    if (params.fieldType.hasFields()) {
        parameters.push({
            name: "message",
            type: params.fieldType.getReadAccessorType(classSpec.namespace, classSpec.includes),
        });
    }
    classSpec.methods.push({
        name: unityDispatchName,
        parameters,
        body: includes => (0, CsharpCodeGenImpl_1.genMessageDispatch)({
            namespace: classSpec.namespace,
            includes,
            fieldName: params.fieldName,
            fieldType: params.fieldType,
            genMsgHandler: msg => `On${(0, xrpa_utils_1.upperFirst)(msg)}?.Invoke`,
            msgDataToParams: convertMessageTypeToParams,
            convertToReadAccessor: false,
        }),
        visibility: "private",
    });
    params.initializerLines.push(`${(0, CsharpCodeGenImpl_1.genDerefMethodCall)(params.proxyObj, proxyHandlerName, [unityDispatchName])};`);
}
exports.genUnityMessageProxyDispatch = genUnityMessageProxyDispatch;
function convertMessageTypeToParams(msgType) {
    const params = [];
    const fields = msgType.getStateFields();
    for (const key in fields) {
        params.push(`message.Get${(0, xrpa_utils_1.upperFirst)(key)}()`);
    }
    return params;
}
function genUnityMessageFieldAccessors(classSpec, params) {
    const typeDef = params.reconcilerDef.type;
    const typeFields = typeDef.getFieldsOfType(TypeDefinition_1.typeIsMessageData);
    for (const fieldName in typeFields) {
        const fieldType = typeFields[fieldName];
        if (params.reconcilerDef.isInboundField(fieldName)) {
            genUnityMessageProxyDispatch(classSpec, {
                ...params,
                storeDef: params.reconcilerDef.storeDef,
                fieldName,
                fieldType,
                proxyObj: params.proxyObj,
                initializerLines: params.initializerLines,
            });
        }
        if (params.reconcilerDef.isOutboundField(fieldName)) {
            genUnitySendMessageAccessor(classSpec, {
                ...params,
                typeDef,
                fieldName,
                fieldType,
            });
        }
    }
}
exports.genUnityMessageFieldAccessors = genUnityMessageFieldAccessors;
/********************************************************/
function genUnityOnSignalAccessor(classSpec, params) {
    const signalHandler = CsharpCodeGenImpl.privateMember(`${params.fieldName}SignalHandler`);
    const inboundSignalDataInterface = CsharpDatasetLibraryTypes_1.InboundSignalDataInterface.getLocalType(classSpec.namespace, classSpec.includes);
    classSpec.methods.push({
        name: `On${(0, xrpa_utils_1.upperFirst)(params.fieldName)}`,
        parameters: [{
                name: "handler",
                type: CsharpCodeGenImpl.genSharedPointer(inboundSignalDataInterface),
            }],
        body: [
            `${signalHandler} = handler;`,
            `if (${params.proxyObj} != null) {`,
            `  ${params.proxyObj}.On${(0, xrpa_utils_1.upperFirst)(params.fieldName)}(${signalHandler});`,
            `}`,
        ],
    });
    classSpec.members.push({
        name: signalHandler,
        type: inboundSignalDataInterface,
        initialValue: new TypeValue_1.CodeLiteralValue(CsharpCodeGenImpl, CsharpCodeGenImpl.getNullValue()),
        visibility: "private",
    });
    params.initializerLines.push(`${(0, CsharpCodeGenImpl_1.genDerefMethodCall)(params.proxyObj, `On${(0, xrpa_utils_1.upperFirst)(params.fieldName)}`, [signalHandler])};`);
}
function genUnitySendSignalAccessor(classSpec, params) {
    classSpec.methods.push({
        name: `Send${(0, xrpa_utils_1.upperFirst)(params.fieldName)}`,
        templateParams: ["SampleType"],
        whereClauses: ["SampleType : unmanaged"],
        returnType: CsharpDatasetLibraryTypes_1.SignalPacket.getLocalType(classSpec.namespace, classSpec.includes),
        parameters: [{
                name: "frameCount",
                type: CsharpCodeGenImpl.PRIMITIVE_INTRINSICS.int32.typename,
            }, {
                name: "numChannels",
                type: CsharpCodeGenImpl.PRIMITIVE_INTRINSICS.int32.typename,
            }, {
                name: "framesPerSecond",
                type: CsharpCodeGenImpl.PRIMITIVE_INTRINSICS.int32.typename,
            }],
        body: () => {
            const proxyMethod = CsharpCodeGenImpl.applyTemplateParams(`Send${(0, xrpa_utils_1.upperFirst)(params.fieldName)}`, "SampleType");
            const methodCall = CsharpCodeGenImpl.genMethodCall(params.proxyObj, proxyMethod, ["frameCount", "numChannels", "framesPerSecond"]);
            return [
                `return ${methodCall};`,
            ];
        },
    });
}
function genUnitySignalFieldAccessors(classSpec, params) {
    const typeDef = params.reconcilerDef.type;
    const typeFields = typeDef.getFieldsOfType(TypeDefinition_1.typeIsSignalData);
    for (const fieldName in typeFields) {
        const fieldType = typeFields[fieldName];
        if (params.reconcilerDef.isInboundField(fieldName)) {
            genUnityOnSignalAccessor(classSpec, {
                ...params,
                fieldName,
                fieldType,
                proxyObj: params.proxyObj,
                initializerLines: params.initializerLines,
            });
        }
        if (params.reconcilerDef.isOutboundField(fieldName)) {
            genUnitySendSignalAccessor(classSpec, {
                ...params,
                typeDef,
                fieldName,
                fieldType,
            });
        }
    }
}
exports.genUnitySignalFieldAccessors = genUnitySignalFieldAccessors;
/********************************************************/
function genFieldDefaultInitializers(namespace, includes, reconcilerDef) {
    const lines = [];
    const fields = reconcilerDef.type.getStateFields();
    for (const fieldName in fields) {
        if (reconcilerDef.isSerializedField(fieldName)) {
            continue;
        }
        const memberName = "_" + getFieldMemberName(reconcilerDef, fieldName);
        lines.push(...reconcilerDef.type.resetLocalFieldVarToDefault(namespace, includes, fieldName, memberName));
    }
    return lines;
}
exports.genFieldDefaultInitializers = genFieldDefaultInitializers;
function genFieldInitializers(namespace, includes, reconcilerDef) {
    const lines = [];
    const fields = reconcilerDef.type.getStateFields();
    for (const fieldName in fields) {
        if (reconcilerDef.isFieldBoundToIntrinsic(fieldName)) {
            continue;
        }
        // these types need to be initialized on BeginPlay
        const isClearSetType = reconcilerDef.isClearSetField(fieldName);
        const isInboundField = !reconcilerDef.isIndexBoundField(fieldName) && reconcilerDef.isInboundField(fieldName);
        const isEphemeral = reconcilerDef.isEphemeralField(fieldName);
        if (isClearSetType || isInboundField || isEphemeral) {
            const memberName = "_" + getFieldMemberName(reconcilerDef, fieldName);
            lines.push(...reconcilerDef.type.resetLocalFieldVarToDefault(namespace, includes, fieldName, memberName));
        }
    }
    return lines;
}
exports.genFieldInitializers = genFieldInitializers;
function genPropertyAssignment(namespace, includes, targetVar, property, fieldType) {
    switch (property) {
        case IntrinsicProperty.position:
        case IntrinsicProperty.rotation:
        case IntrinsicProperty.lossyScale:
            return [`${targetVar} = transform.${property};`];
        case IntrinsicProperty.Parent: {
            if (!(0, TypeDefinition_1.typeIsReference)(fieldType)) {
                return [];
            }
            const targetComponentClassName = getComponentClassName(fieldType.toType);
            return [
                ...fieldType.resetLocalVarToDefault(namespace, includes, targetVar),
                `for (var parentObj = transform.parent; parentObj != null; parentObj = parentObj.transform.parent) {`,
                `  var componentObj = parentObj.GetComponent<${targetComponentClassName}>();`,
                `  if (componentObj != null) {`,
                `    componentObj.InitializeDS();`,
                `    ${targetVar} = componentObj.GetXrpaId();`,
                `    break;`,
                `  }`,
                `}`,
            ];
        }
        case IntrinsicProperty.gameObject: {
            if (!(0, TypeDefinition_1.typeIsReference)(fieldType)) {
                return [];
            }
            const targetComponentClassName = getComponentClassName(fieldType.toType);
            return [
                ...fieldType.resetLocalVarToDefault(namespace, includes, targetVar),
                `{`,
                `  var componentObj = gameObject.GetComponent<${targetComponentClassName}>();`,
                `  if (componentObj != null) {`,
                `    componentObj.InitializeDS();`,
                `    ${targetVar} = componentObj.GetXrpaId();`,
                `  }`,
                `}`,
            ];
        }
    }
    throw new Error(`Unsupported property ${property} for property mapping`);
}
function genTransformInitializers(namespace, includes, reconcilerDef) {
    const lines = [];
    const fields = reconcilerDef.type.getStateFields();
    for (const fieldName in fields) {
        // outbound fields only
        if (!reconcilerDef.isOutboundField(fieldName)) {
            continue;
        }
        const fieldType = fields[fieldName].type;
        const fieldBinding = reconcilerDef.getFieldPropertyBinding(fieldName);
        if (typeof fieldBinding === "string") {
            lines.push(...genPropertyAssignment(namespace, includes, "_" + getFieldMemberName(reconcilerDef, fieldName), fieldBinding, fieldType));
        }
        else if (fieldBinding && (0, TypeDefinition_1.typeIsStruct)(fieldType)) {
            const subfields = fieldType.getStateFields();
            for (const subfieldName in fieldBinding) {
                const subfieldType = subfields[subfieldName].type;
                if (!subfieldType) {
                    continue;
                }
                lines.push(...genPropertyAssignment(namespace, includes, `_${getFieldMemberName(reconcilerDef, fieldName)}.${subfieldName}`, fieldBinding[subfieldName], subfieldType));
            }
        }
    }
    return lines;
}
exports.genTransformInitializers = genTransformInitializers;
function genPropertyOutboundUpdate(params) {
    switch (params.fieldBinding) {
        case IntrinsicProperty.position:
        case IntrinsicProperty.rotation:
        case IntrinsicProperty.lossyScale:
            (0, xrpa_utils_1.pushUnique)(params.prelude, `bool ${params.fieldName}Changed = false;`);
            (0, xrpa_utils_1.pushUnique)(params.changes, `if (${params.fieldName}Changed && ${params.proxyObj} != null) { ${params.proxyObj}.Set${(0, xrpa_utils_1.upperFirst)(params.fieldName)}(${(0, CsharpCodeGenImpl_1.privateMember)(params.memberName)}); }`);
            return [
                `if (${params.targetVar} != transform.${params.fieldBinding}) {`,
                `  ${params.targetVar} = transform.${params.fieldBinding};`,
                `  ${params.fieldName}Changed = true;`,
                `}`,
            ];
        case IntrinsicProperty.Parent: {
            return [];
        }
        case IntrinsicProperty.gameObject: {
            return [];
        }
    }
    throw new Error(`Unsupported fieldBinding ${params.fieldBinding} for property mapping`);
}
function genPropertyInboundUpdate(params) {
    switch (params.fieldBinding) {
        case IntrinsicProperty.position:
        case IntrinsicProperty.rotation:
        case IntrinsicProperty.lossyScale:
            return [
                `transform.local${(0, xrpa_utils_1.upperFirst)(params.fieldBinding)} = ${params.sourceVar};`,
            ];
        case IntrinsicProperty.Parent: {
            return [];
        }
        case IntrinsicProperty.gameObject: {
            return [];
        }
    }
    throw new Error(`Unsupported fieldBinding ${params.fieldBinding} for property mapping`);
}
function genTransformUpdates(params) {
    const prelude = [];
    const lines = [];
    const changes = [];
    const fields = params.reconcilerDef.type.getStateFields();
    for (const fieldName in fields) {
        // outbound fields only
        if (!params.reconcilerDef.isOutboundField(fieldName)) {
            continue;
        }
        const fieldBinding = params.reconcilerDef.getFieldPropertyBinding(fieldName);
        const memberName = getFieldMemberName(params.reconcilerDef, fieldName);
        if (typeof fieldBinding === "string") {
            lines.push(...genPropertyOutboundUpdate({
                ...params,
                memberName,
                targetVar: (0, CsharpCodeGenImpl_1.privateMember)(memberName),
                fieldBinding,
                fieldName,
                prelude,
                changes,
            }));
        }
        else if (fieldBinding) {
            for (const subfieldName in fieldBinding) {
                lines.push(...genPropertyOutboundUpdate({
                    ...params,
                    memberName,
                    targetVar: `${(0, CsharpCodeGenImpl_1.privateMember)(memberName)}.${subfieldName}`,
                    fieldBinding: fieldBinding[subfieldName],
                    fieldName,
                    prelude,
                    changes,
                }));
            }
        }
    }
    return prelude.concat(lines).concat(changes);
}
exports.genTransformUpdates = genTransformUpdates;
function genProcessUpdateBody(params) {
    const lines = [];
    const fields = params.reconcilerDef.type.getStateFields();
    for (const fieldName in fields) {
        if (!params.reconcilerDef.isInboundField(fieldName) || params.reconcilerDef.isIndexBoundField(fieldName)) {
            continue;
        }
        const memberName = getFieldMemberName(params.reconcilerDef, fieldName);
        const checkName = `Check${(0, xrpa_utils_1.upperFirst)(fieldName)}Changed`;
        lines.push(`if (${params.proxyObj}.${checkName}(fieldsChanged)) {`, `  ${(0, CsharpCodeGenImpl_1.privateMember)(memberName)} = ${params.proxyObj}.Get${(0, xrpa_utils_1.upperFirst)(fieldName)}();`);
        // handle property binding
        const fieldBinding = params.reconcilerDef.getFieldPropertyBinding(fieldName);
        if (typeof fieldBinding === "string") {
            lines.push(...(0, xrpa_utils_1.indent)(1, genPropertyInboundUpdate({
                ...params,
                sourceVar: memberName,
                fieldBinding,
            })));
        }
        else if (fieldBinding) {
            for (const subfieldName in fieldBinding) {
                lines.push(...(0, xrpa_utils_1.indent)(1, genPropertyInboundUpdate({
                    ...params,
                    sourceVar: `${memberName}.${subfieldName}`,
                    fieldBinding: fieldBinding[subfieldName],
                })));
            }
        }
        lines.push(`}`);
    }
    return lines;
}
exports.genProcessUpdateBody = genProcessUpdateBody;
function genDataStoreObjectAccessors(ctx, classSpec) {
    classSpec.methods.push({
        name: "GetXrpaId",
        returnType: ctx.moduleDef.ObjectUuid.declareLocalReturnType(ctx.namespace, classSpec.includes, true),
        body: [
            `return _id;`,
        ]
    });
    classSpec.members.push({
        name: "id",
        type: ctx.moduleDef.ObjectUuid,
        visibility: "protected",
    });
}
exports.genDataStoreObjectAccessors = genDataStoreObjectAccessors;
function writeMonoBehaviour(classSpec, params) {
    const lines = (0, CsharpCodeGenImpl_1.genClassDefinition)(classSpec);
    lines.unshift(...CsharpCodeGenImpl_1.HEADER, `#pragma warning disable CS0414`, // disable unused private member warning
    ``, ...(classSpec.includes?.getNamespaceImports() ?? []), ``);
    params.fileWriter.writeFile(path_1.default.join(params.outDir, classSpec.name + ".cs"), lines);
}
exports.writeMonoBehaviour = writeMonoBehaviour;
//# sourceMappingURL=MonoBehaviourShared.js.map
