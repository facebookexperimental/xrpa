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
exports.writeMonoBehaviour = exports.genProcessUpdateBody = exports.genTransformUpdates = exports.genTransformInitializers = exports.genFieldInitializers = exports.genFieldDefaultInitializers = exports.genUnityMessageFieldAccessors = exports.genUnityMessageChannelDispatch = exports.genFieldProperties = exports.getFieldMemberName = exports.getMessageDelegateName = exports.getComponentClassName = exports.checkForTransformMapping = exports.IntrinsicProperty = void 0;
const path_1 = __importDefault(require("path"));
const Helpers_1 = require("../../shared/Helpers");
const TypeDefinition_1 = require("../../shared/TypeDefinition");
const CsharpCodeGenImpl_1 = require("../csharp/CsharpCodeGenImpl");
const CsharpCodeGenImpl = __importStar(require("../csharp/CsharpCodeGenImpl"));
const GenMessageAccessors_1 = require("../csharp/GenMessageAccessors");
const GenWriteReconcilerDataStore_1 = require("../csharp/GenWriteReconcilerDataStore");
const GenDataStoreShared_1 = require("../shared/GenDataStoreShared");
const GenDataStoreSubsystem_1 = require("./GenDataStoreSubsystem");
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
    return `${(0, Helpers_1.filterToString)(id) ?? ""}${typeName}Component`;
}
exports.getComponentClassName = getComponentClassName;
function getMessageDelegateName(ctx, includes, msgType) {
    const paramTypes = [
        `int`, // timestamp
    ];
    const fields = msgType.getStateFields();
    for (const key in fields) {
        const fieldType = fields[key].type;
        if ((0, TypeDefinition_1.typeIsReference)(fieldType)) {
            paramTypes.push(getComponentClassName(fieldType.toType));
        }
        else {
            paramTypes.push(fieldType.declareLocalParam(ctx.namespace, includes, ""));
        }
    }
    return `System.Action<${paramTypes.join(", ")}>`;
}
exports.getMessageDelegateName = getMessageDelegateName;
function getFieldMemberName(reconcilerDef, fieldName) {
    return (0, Helpers_1.filterToString)(reconcilerDef.fieldAccessorNameOverrides[fieldName]) ?? (0, Helpers_1.upperFirst)(fieldName);
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
    const decorations = [];
    if (isSerialized) {
        decorations.push("[SerializeField]");
    }
    typeDef.declareLocalFieldClassMember(classSpec, params.fieldName, (0, CsharpCodeGenImpl_1.privateMember)(params.memberName), true, decorations, "private");
    if (isClearSet) {
        const overrideParams = (0, Helpers_1.filterToStringArray)(params.reconcilerDef.fieldAccessorNameOverrides[params.fieldName], 2);
        const pascalFieldName = (0, Helpers_1.upperFirst)(params.fieldName);
        const setterName = overrideParams?.[0] ?? `Set${pascalFieldName}`;
        const clearName = overrideParams?.[1] ?? `Clear${pascalFieldName}`;
        classSpec.methods.push({
            name: setterName,
            body: includes => (0, GenWriteReconcilerDataStore_1.genClearSetSetterFunctionBody)({ ...params, includes, fieldType, fieldVar: (0, CsharpCodeGenImpl_1.privateMember)(params.memberName), typeDef: typeDef }),
        });
        classSpec.methods.push({
            name: clearName,
            body: includes => (0, GenWriteReconcilerDataStore_1.genClearSetClearFunctionBody)({ ...params, includes, fieldType, fieldVar: (0, CsharpCodeGenImpl_1.privateMember)(params.memberName), typeDef: typeDef }),
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
            ...(params.needsSetDirty ? (0, GenWriteReconcilerDataStore_1.genFieldSetDirty)({ ...params, includes: classSpec.includes, typeDef: typeDef }) : []),
        ],
    });
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
    const fields = params.reconcilerDef.type.getStateFields();
    for (const fieldName in fields) {
        const memberName = getFieldMemberName(params.reconcilerDef, fieldName);
        const isOutboundField = params.reconcilerDef.isOutboundField(fieldName);
        if (params.reconcilerDef.isIndexBoundField(fieldName) || isOutboundField) {
            genWriteFieldProperty(classSpec, { ...params, fieldName, memberName, needsSetDirty: isOutboundField });
        }
        else {
            genReadFieldProperty(classSpec, { ...params, fieldName, memberName });
        }
    }
}
exports.genFieldProperties = genFieldProperties;
/********************************************************/
function genUnitySendMessageAccessor(classSpec, params) {
    (0, GenMessageAccessors_1.genSendMessageAccessor)(classSpec, {
        ...params,
        name: `Send${(0, Helpers_1.upperFirst)(params.fieldName)}`,
        referencesNeedConversion: false,
    });
}
function genUnityOnMessageAccessor(classSpec, params) {
    const msgEventType = getMessageDelegateName(params.ctx, classSpec.includes, params.fieldType);
    classSpec.members.push({
        name: `On${(0, Helpers_1.upperFirst)(params.fieldName)}`,
        type: `event ${msgEventType}`,
    });
}
function convertMessageTypeToParams(ctx, msgType, prelude) {
    const params = [];
    const fields = msgType.getStateFields();
    for (const key in fields) {
        const fieldType = fields[key].type;
        if ((0, TypeDefinition_1.typeIsReference)(fieldType)) {
            (0, Helpers_1.pushUnique)(prelude, `var datastore = ${(0, GenDataStoreSubsystem_1.getDataStoreSubsystemName)(ctx.storeDef)}.Instance.DataStore;`);
            params.push(`message.Get${(0, Helpers_1.upperFirst)(key)}(datastore)`);
        }
        else {
            params.push(`message.Get${(0, Helpers_1.upperFirst)(key)}()`);
        }
    }
    return params;
}
function genUnityMessageChannelDispatch(classSpec, params) {
    (0, GenMessageAccessors_1.genMessageChannelDispatch)(classSpec, {
        ...params,
        genMsgHandler: msg => `On${(0, Helpers_1.upperFirst)(msg)}?.Invoke`,
        msgDataToParams: convertMessageTypeToParams,
        isOverride: Boolean(params.reconcilerDef.type.interfaceType),
    });
}
exports.genUnityMessageChannelDispatch = genUnityMessageChannelDispatch;
function genUnityMessageFieldAccessors(classSpec, params) {
    const typeDef = params.reconcilerDef.type;
    const typeFields = typeDef.getFieldsOfType(TypeDefinition_1.typeIsMessageData);
    for (const fieldName in typeFields) {
        const fieldType = typeFields[fieldName];
        if (params.reconcilerDef.isInboundField(fieldName)) {
            genUnityOnMessageAccessor(classSpec, {
                ...params,
                fieldName,
                fieldType,
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
function genFieldDefaultInitializers(ctx, includes, reconcilerDef) {
    const lines = [];
    const fields = reconcilerDef.type.getStateFields();
    for (const fieldName in fields) {
        if (reconcilerDef.isSerializedField(fieldName)) {
            continue;
        }
        const memberName = "_" + getFieldMemberName(reconcilerDef, fieldName);
        lines.push(...reconcilerDef.type.resetLocalFieldVarToDefault(ctx.namespace, includes, fieldName, memberName));
    }
    return lines;
}
exports.genFieldDefaultInitializers = genFieldDefaultInitializers;
function genFieldInitializers(ctx, includes, reconcilerDef) {
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
            lines.push(...reconcilerDef.type.resetLocalFieldVarToDefault(ctx.namespace, includes, fieldName, memberName));
        }
    }
    return lines;
}
exports.genFieldInitializers = genFieldInitializers;
function genPropertyAssignment(ctx, includes, targetVar, property, fieldType) {
    switch (property) {
        case IntrinsicProperty.position:
        case IntrinsicProperty.rotation:
        case IntrinsicProperty.lossyScale:
            return [`${targetVar} = transform.${property};`];
        case IntrinsicProperty.Parent: {
            if (!(0, TypeDefinition_1.typeIsReference)(fieldType)) {
                return [];
            }
            return [
                ...fieldType.resetLocalVarToDefault(ctx.namespace, includes, targetVar),
                `for (var parentObj = transform.parent; parentObj != null; parentObj = parentObj.transform.parent) {`,
                `  var componentObj = parentObj.GetComponent<${fieldType.toType.getLocalType(ctx.namespace, includes)}>();`,
                `  if (componentObj != null) {`,
                `    componentObj.InitializeDS();`,
                `    ${targetVar} = ${fieldType.convertValueFromLocal(ctx.namespace, includes, "componentObj")};`,
                `    break;`,
                `  }`,
                `}`,
            ];
        }
        case IntrinsicProperty.gameObject: {
            if (!(0, TypeDefinition_1.typeIsReference)(fieldType)) {
                return [];
            }
            return [
                ...fieldType.resetLocalVarToDefault(ctx.namespace, includes, targetVar),
                `{`,
                `  var componentObj = gameObject.GetComponent<${fieldType.toType.getLocalType(ctx.namespace, includes)}>();`,
                `  if (componentObj != null) {`,
                `    componentObj.InitializeDS();`,
                `    ${targetVar} = ${fieldType.convertValueFromLocal(ctx.namespace, includes, "componentObj")};`,
                `  }`,
                `}`,
            ];
        }
    }
    throw new Error(`Unsupported property ${property} for property mapping`);
}
function genTransformInitializers(ctx, includes, reconcilerDef) {
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
            lines.push(...genPropertyAssignment(ctx, includes, "_" + getFieldMemberName(reconcilerDef, fieldName), fieldBinding, fieldType));
        }
        else if (fieldBinding && (0, TypeDefinition_1.typeIsStruct)(fieldType)) {
            const subfields = fieldType.getStateFields();
            for (const subfieldName in fieldBinding) {
                const subfieldType = subfields[subfieldName].type;
                if (!subfieldType) {
                    continue;
                }
                lines.push(...genPropertyAssignment(ctx, includes, `_${getFieldMemberName(reconcilerDef, fieldName)}.${subfieldName}`, fieldBinding[subfieldName], subfieldType));
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
            return [
                `if (${params.targetVar} != transform.${params.fieldBinding}) {`,
                `  ${params.targetVar} = transform.${params.fieldBinding};`,
                ...(0, Helpers_1.indent)(1, (0, GenWriteReconcilerDataStore_1.genFieldSetDirty)({ ...params, typeDef: params.reconcilerDef.type })),
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
                `transform.local${(0, Helpers_1.upperFirst)(params.fieldBinding)} = ${params.sourceVar};`,
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
    const lines = [];
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
                targetVar: memberName,
                fieldBinding,
                fieldName,
            }));
        }
        else if (fieldBinding) {
            for (const subfieldName in fieldBinding) {
                lines.push(...genPropertyOutboundUpdate({
                    ...params,
                    targetVar: `${memberName}.${subfieldName}`,
                    fieldBinding: fieldBinding[subfieldName],
                    fieldName,
                }));
            }
        }
    }
    return lines;
}
exports.genTransformUpdates = genTransformUpdates;
function genProcessUpdateBody(params) {
    const lines = [];
    const accessor = params.proxyObj ?? "value";
    const fields = params.reconcilerDef.type.getStateFields();
    for (const fieldName in fields) {
        if (!params.reconcilerDef.isInboundField(fieldName) || params.reconcilerDef.isIndexBoundField(fieldName)) {
            continue;
        }
        const memberName = getFieldMemberName(params.reconcilerDef, fieldName);
        const checkName = `Check${(0, Helpers_1.upperFirst)(fieldName)}Changed`;
        let funcName = `Get${(0, Helpers_1.upperFirst)(fieldName)}`;
        if ((0, TypeDefinition_1.typeIsReference)(fields[fieldName].type)) {
            funcName += "Id";
        }
        lines.push(`if (${accessor}.${checkName}(fieldsChanged)) {`, `  ${(0, CsharpCodeGenImpl_1.privateMember)(memberName)} = ${accessor}.${funcName}();`);
        // handle property binding
        const fieldBinding = params.reconcilerDef.getFieldPropertyBinding(fieldName);
        if (typeof fieldBinding === "string") {
            lines.push(...(0, Helpers_1.indent)(1, genPropertyInboundUpdate({
                ...params,
                sourceVar: memberName,
                fieldBinding,
            })));
        }
        else if (fieldBinding) {
            for (const subfieldName in fieldBinding) {
                lines.push(...(0, Helpers_1.indent)(1, genPropertyInboundUpdate({
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
function writeMonoBehaviour(classSpec, params) {
    const lines = (0, CsharpCodeGenImpl_1.genClassDefinition)(classSpec);
    lines.unshift(...CsharpCodeGenImpl_1.HEADER, `#pragma warning disable CS0414`, // disable unused private member warning
    ``, ...(classSpec.includes?.getNamespaceImports() ?? []), ``);
    params.fileWriter.writeFile(path_1.default.join(params.outDir, classSpec.name + ".cs"), lines);
}
exports.writeMonoBehaviour = writeMonoBehaviour;
//# sourceMappingURL=MonoBehaviourShared.js.map
