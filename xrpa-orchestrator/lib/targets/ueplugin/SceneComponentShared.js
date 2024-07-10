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
exports.writeSceneComponent = exports.genProcessUpdateBody = exports.genTransformUpdates = exports.genTransformInitializers = exports.genFieldInitializers = exports.genFieldDefaultInitializers = exports.genUEMessageFieldAccessors = exports.genUEMessageChannelDispatch = exports.genFieldProperties = exports.getFieldMemberName = exports.getComponentHeader = exports.getComponentClassName = exports.checkForTransformMapping = exports.IntrinsicProperty = void 0;
const path_1 = __importDefault(require("path"));
const Helpers_1 = require("../../shared/Helpers");
const TypeDefinition_1 = require("../../shared/TypeDefinition");
const CppCodeGenImpl_1 = require("../cpp/CppCodeGenImpl");
const CppCodeGenImpl = __importStar(require("../cpp/CppCodeGenImpl"));
const GenMessageAccessors_1 = require("../cpp/GenMessageAccessors");
const GenWriteReconcilerDataStore_1 = require("../cpp/GenWriteReconcilerDataStore");
const GenDataStoreShared_1 = require("../shared/GenDataStoreShared");
const GenBlueprintTypes_1 = require("./GenBlueprintTypes");
var IntrinsicProperty;
(function (IntrinsicProperty) {
    IntrinsicProperty["Location"] = "Location";
    IntrinsicProperty["Rotation"] = "Rotation";
    IntrinsicProperty["Scale3D"] = "Scale3D";
    IntrinsicProperty["Parent"] = "Parent";
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
        return propertyMap !== IntrinsicProperty.Parent;
    }
    for (const key in propertyMap) {
        if (propertyMap[key] !== IntrinsicProperty.Parent) {
            return true;
        }
    }
    return false;
}
exports.checkForTransformMapping = checkForTransformMapping;
const LegalBlueprintTypes = {
    int: true,
    float: true,
    bool: true,
    FString: true,
    FVector2D: true,
    FVector: true,
    FQuat: true,
    FColor: true,
    FColorLinear: true,
    FRotator: true,
};
function isLegalBlueprintType(ctx, typeDef) {
    if (typeDef.getLocalHeaderFile() === (0, GenBlueprintTypes_1.getBlueprintTypesHeaderName)(ctx.storeDef.apiname)) {
        return true;
    }
    if ((0, TypeDefinition_1.typeIsReference)(typeDef)) {
        return true;
    }
    const localType = typeDef.getLocalType(ctx.namespace, null);
    if (localType in LegalBlueprintTypes) {
        return true;
    }
    if (localType.startsWith("TArray<")) {
        return true;
    }
    return false;
}
function getComponentClassName(includes, type, id) {
    const typeName = typeof type === "string" ? type : type.getName();
    const className = `U${(0, Helpers_1.filterToString)(id) ?? ""}${typeName}Component`;
    includes?.addFile({ filename: `${className.slice(1)}.h` });
    return className;
}
exports.getComponentClassName = getComponentClassName;
function getComponentHeader(type, id) {
    return `${getComponentClassName(null, type, id).slice(1)}.h`;
}
exports.getComponentHeader = getComponentHeader;
function getFieldMemberName(reconcilerDef, fieldName) {
    return (0, Helpers_1.filterToString)(reconcilerDef.fieldAccessorNameOverrides[fieldName]) ?? (0, Helpers_1.upperFirst)(fieldName);
}
exports.getFieldMemberName = getFieldMemberName;
function genWriteFieldProperty(classSpec, params) {
    const fieldSpec = params.reconcilerDef.getFieldSpec(params.fieldName);
    const fieldType = fieldSpec.type;
    const typeDef = params.reconcilerDef.type;
    const pascalFieldName = (0, Helpers_1.upperFirst)(params.fieldName);
    const canBeBlueprinted = isLegalBlueprintType(params.ctx, fieldType);
    const isBoundToIntrinsic = params.reconcilerDef.isFieldBoundToIntrinsic(params.fieldName);
    const isClearSet = params.reconcilerDef.isClearSetField(params.fieldName);
    const hasSetter = !isBoundToIntrinsic && !isClearSet;
    const isEphemeral = params.reconcilerDef.isEphemeralField(params.fieldName);
    const isSerialized = params.reconcilerDef.isSerializedField(params.fieldName);
    const overrideParams = (0, Helpers_1.filterToStringArray)(params.reconcilerDef.fieldAccessorNameOverrides[params.fieldName], 2);
    const setterName = overrideParams?.[0] ?? `Set${pascalFieldName}`;
    const clearName = overrideParams?.[1] ?? `Clear${pascalFieldName}`;
    const decorations = [];
    if (!isBoundToIntrinsic && (isEphemeral || isSerialized) && canBeBlueprinted) {
        const propertyMeta = isEphemeral ? "BlueprintReadOnly, Transient" : `BlueprintReadWrite, BlueprintSetter = ${setterName}`;
        decorations.push(`UPROPERTY(EditAnywhere, ${propertyMeta}, Category = "${params.categoryName}")`);
    }
    typeDef.declareLocalFieldClassMember(classSpec, params.fieldName, params.memberName, true, decorations, "public");
    if (isClearSet) {
        classSpec.methods.push({
            name: setterName,
            decorations: [
                ...(0, CppCodeGenImpl_1.genCommentLines)(fieldSpec.description),
                `UFUNCTION(BlueprintCallable, Category = "${params.categoryName}")`,
            ],
            body: includes => (0, GenWriteReconcilerDataStore_1.genClearSetSetterFunctionBody)({ ...params, includes, fieldType, fieldVar: params.memberName, typeDef }),
            separateImplementation: params.separateImplementation,
        });
        classSpec.methods.push({
            name: clearName,
            decorations: [
                ...(0, CppCodeGenImpl_1.genCommentLines)(fieldSpec.description),
                `UFUNCTION(BlueprintCallable, Category = "${params.categoryName}")`,
            ],
            body: includes => (0, GenWriteReconcilerDataStore_1.genClearSetClearFunctionBody)({ ...params, includes, fieldType, fieldVar: params.memberName, typeDef }),
            separateImplementation: params.separateImplementation,
        });
    }
    if (hasSetter) {
        classSpec.methods.push({
            name: setterName,
            decorations: [
                ...((isEphemeral || !canBeBlueprinted) ? [] : [`UFUNCTION(BlueprintCallable, BlueprintInternalUseOnly)`]),
            ],
            parameters: [{
                    name: "value",
                    type: fieldType,
                }],
            body: includes => [
                ...(params.setterHooks?.[params.fieldName]?.preSet ?? []),
                `${params.memberName} = value;`,
                ...(params.setterHooks?.[params.fieldName]?.postSet ?? []),
                ...(params.needsSetDirty ? (0, GenWriteReconcilerDataStore_1.genFieldSetDirty)({ ...params, includes, typeDef }) : []),
            ],
            separateImplementation: params.separateImplementation,
        });
    }
    if (params.reconcilerDef.isIndexedField(params.fieldName)) {
        classSpec.methods.push({
            name: (0, GenDataStoreShared_1.fieldGetterFuncName)(CppCodeGenImpl, params.reconcilerDef.type.getStateFields(), params.fieldName),
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
    const isBoundToIntrinsic = params.reconcilerDef.isFieldBoundToIntrinsic(params.fieldName);
    const decorations = [];
    if (!isBoundToIntrinsic && isLegalBlueprintType(params.ctx, fieldType)) {
        decorations.push(`UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "${params.categoryName}")`);
    }
    typeDef.declareLocalFieldClassMember(classSpec, params.fieldName, params.memberName, true, decorations, "public");
}
function genFieldProperties(classSpec, params) {
    const categoryName = params.reconcilerDef.type.getName();
    const fields = params.reconcilerDef.type.getStateFields();
    for (const fieldName in fields) {
        const memberName = getFieldMemberName(params.reconcilerDef, fieldName);
        const isOutboundField = params.reconcilerDef.isOutboundField(fieldName);
        if (params.reconcilerDef.isIndexBoundField(fieldName) || isOutboundField) {
            genWriteFieldProperty(classSpec, { ...params, categoryName, fieldName, memberName, needsSetDirty: isOutboundField });
        }
        else {
            genReadFieldProperty(classSpec, { ...params, categoryName, fieldName, memberName });
        }
    }
}
exports.genFieldProperties = genFieldProperties;
/********************************************************/
function genUESendMessageAccessor(classSpec, params) {
    (0, GenMessageAccessors_1.genSendMessageAccessor)(classSpec, {
        ...params,
        name: `Send${(0, Helpers_1.upperFirst)(params.fieldName)}`,
        decorations: [
            `UFUNCTION(BlueprintCallable, Category = "${params.typeDef.getName()}")`,
        ],
        referencesNeedConversion: false,
        separateImplementation: true,
    });
}
function genUEOnMessageAccessor(classSpec, params) {
    const msgEventType = (0, GenBlueprintTypes_1.getMessageDelegateName)(params.fieldType, params.ctx.storeDef.apiname);
    classSpec.includes?.addFile({ filename: (0, GenBlueprintTypes_1.getBlueprintTypesHeaderName)(params.ctx.storeDef.apiname) });
    classSpec.members.push({
        name: `On${(0, Helpers_1.upperFirst)(params.fieldName)}`,
        type: msgEventType,
        decorations: [`UPROPERTY(BlueprintAssignable, Category = "${params.typeDef.getName()}")`],
    });
}
function convertMessageTypeToParams(msgType, prelude) {
    const params = [];
    const fields = msgType.getStateFields();
    for (const key in fields) {
        const fieldType = fields[key].type;
        if ((0, TypeDefinition_1.typeIsReference)(fieldType)) {
            (0, Helpers_1.pushUnique)(prelude, `auto datastore = GetDataStoreSubsystem()->DataStore.get();`);
            params.push(`message.get${(0, Helpers_1.upperFirst)(key)}(datastore)`);
        }
        else {
            params.push(`message.get${(0, Helpers_1.upperFirst)(key)}()`);
        }
    }
    return params;
}
function genUEMessageChannelDispatch(classSpec, params) {
    (0, GenMessageAccessors_1.genMessageChannelDispatch)(classSpec, {
        ...params,
        genMsgHandler: msg => `On${msg}.Broadcast`,
        msgDataToParams: convertMessageTypeToParams,
        separateImplementation: true,
    });
}
exports.genUEMessageChannelDispatch = genUEMessageChannelDispatch;
function genUEMessageFieldAccessors(classSpec, params) {
    const typeDef = params.reconcilerDef.type;
    const typeFields = typeDef.getFieldsOfType(TypeDefinition_1.typeIsMessageData);
    for (const fieldName in typeFields) {
        const fieldType = typeFields[fieldName];
        if (params.reconcilerDef.isInboundField(fieldName)) {
            genUEOnMessageAccessor(classSpec, {
                ...params,
                typeDef,
                fieldName,
                fieldType,
            });
        }
        if (params.reconcilerDef.isOutboundField(fieldName)) {
            genUESendMessageAccessor(classSpec, {
                ...params,
                typeDef,
                fieldName,
                fieldType,
            });
        }
    }
}
exports.genUEMessageFieldAccessors = genUEMessageFieldAccessors;
/********************************************************/
function genFieldDefaultInitializers(ctx, includes, reconcilerDef) {
    const lines = [];
    const fields = reconcilerDef.type.getStateFields();
    for (const fieldName in fields) {
        if (reconcilerDef.isFieldBoundToIntrinsic(fieldName)) {
            continue;
        }
        const memberName = getFieldMemberName(reconcilerDef, fieldName);
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
            const memberName = getFieldMemberName(reconcilerDef, fieldName);
            lines.push(...reconcilerDef.type.resetLocalFieldVarToDefault(ctx.namespace, includes, fieldName, memberName));
        }
    }
    return lines;
}
exports.genFieldInitializers = genFieldInitializers;
function genPropertyAssignment(ctx, includes, targetVar, property, fieldType, prelude) {
    switch (property) {
        case IntrinsicProperty.Location:
        case IntrinsicProperty.Rotation:
        case IntrinsicProperty.Scale3D:
            (0, Helpers_1.pushUnique)(prelude, `auto& transform = GetComponentTransform();`);
            return [`${targetVar} = transform.Get${property}();`];
        case IntrinsicProperty.Parent: {
            if (!(0, TypeDefinition_1.typeIsReference)(fieldType)) {
                return [];
            }
            (0, Helpers_1.pushUnique)(prelude, `TArray<USceneComponent*> componentParents;`);
            (0, Helpers_1.pushUnique)(prelude, `GetParentComponents(componentParents);`);
            return [
                ...fieldType.resetLocalVarToDefault(ctx.namespace, includes, targetVar),
                `for (auto parent : componentParents) {`,
                `  auto componentPtr = Cast<${fieldType.toType.getLocalType(ctx.namespace, includes)}>(parent);`,
                `  if (componentPtr != nullptr) {`,
                `    componentPtr->initializeDS();`,
                `    ${targetVar} = ${fieldType.convertValueFromLocal(ctx.namespace, includes, "componentPtr")};`,
                `    break;`,
                `  }`,
                `}`,
            ];
        }
    }
    throw new Error(`Unsupported property ${property} for property mapping`);
}
function genTransformInitializers(ctx, includes, reconcilerDef) {
    const prelude = [];
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
            lines.push(...genPropertyAssignment(ctx, includes, getFieldMemberName(reconcilerDef, fieldName), fieldBinding, fieldType, prelude));
        }
        else if (fieldBinding && (0, TypeDefinition_1.typeIsStruct)(fieldType)) {
            const subfields = fieldType.getStateFields();
            for (const subfieldName in fieldBinding) {
                const subfieldType = subfields[subfieldName].type;
                if (!subfieldType) {
                    continue;
                }
                lines.push(...genPropertyAssignment(ctx, includes, `${getFieldMemberName(reconcilerDef, fieldName)}.${subfieldName}`, fieldBinding[subfieldName], subfieldType, prelude));
            }
        }
    }
    return prelude.concat(lines);
}
exports.genTransformInitializers = genTransformInitializers;
function genPropertyOutboundUpdate(params) {
    switch (params.fieldBinding) {
        case IntrinsicProperty.Location:
        case IntrinsicProperty.Rotation:
        case IntrinsicProperty.Scale3D:
            (0, Helpers_1.pushUnique)(params.prelude, `auto& transform = GetComponentTransform();`);
            (0, Helpers_1.pushUnique)(params.prelude, `auto transform${params.fieldBinding} = transform.Get${params.fieldBinding}();`);
            return [
                `if (!${params.targetVar}.Equals(transform${params.fieldBinding}, SMALL_NUMBER)) {`,
                `  ${params.targetVar} = transform${params.fieldBinding};`,
                ...(0, Helpers_1.indent)(1, (0, GenWriteReconcilerDataStore_1.genFieldSetDirty)({ ...params, typeDef: params.reconcilerDef.type })),
                `}`,
            ];
        case IntrinsicProperty.Parent: {
            return [];
        }
    }
    throw new Error(`Unsupported fieldBinding ${params.fieldBinding} for property mapping`);
}
function genPropertyInboundUpdate(params) {
    switch (params.fieldBinding) {
        case IntrinsicProperty.Location:
        case IntrinsicProperty.Rotation:
        case IntrinsicProperty.Scale3D:
            return [
                `SetRelative${params.fieldBinding}(${params.sourceVar});`,
            ];
        case IntrinsicProperty.Parent: {
            return [];
        }
    }
    throw new Error(`Unsupported fieldBinding ${params.fieldBinding} for property mapping`);
}
function genTransformUpdates(params) {
    const prelude = [];
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
                prelude,
            }));
        }
        else if (fieldBinding) {
            for (const subfieldName in fieldBinding) {
                lines.push(...genPropertyOutboundUpdate({
                    ...params,
                    targetVar: `${memberName}.${subfieldName}`,
                    fieldBinding: fieldBinding[subfieldName],
                    fieldName,
                    prelude,
                }));
            }
        }
    }
    return prelude.concat(lines);
}
exports.genTransformUpdates = genTransformUpdates;
function genProcessUpdateBody(params) {
    const lines = [];
    const accessor = params.proxyObj ? `${params.proxyObj}->` : "value.";
    const fields = params.reconcilerDef.type.getStateFields();
    for (const fieldName in fields) {
        if (!params.reconcilerDef.isInboundField(fieldName) || params.reconcilerDef.isIndexBoundField(fieldName)) {
            continue;
        }
        const memberName = getFieldMemberName(params.reconcilerDef, fieldName);
        lines.push(`if (${accessor}check${(0, Helpers_1.upperFirst)(fieldName)}Changed(fieldsChanged)) {`, `  ${memberName} = ${accessor}get${(0, Helpers_1.upperFirst)(fieldName)}();`);
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
function writeSceneComponent(classSpec, params) {
    const cppLines = (0, CppCodeGenImpl_1.genClassSourceDefinition)(classSpec, params.cppIncludes);
    cppLines.unshift(...CppCodeGenImpl_1.HEADER, `#include "${params.headerName}"`, ...(params.cppIncludes?.getIncludes() ?? []), ``);
    params.fileWriter.writeFile(path_1.default.join(params.outSrcDir, `${params.headerName.slice(0, -2)}.cpp`), cppLines);
    const headerLines = (0, CppCodeGenImpl_1.genClassHeaderDefinition)(classSpec);
    headerLines.unshift(...CppCodeGenImpl_1.HEADER, `#pragma once`, ``, ...(params.headerIncludes?.getIncludes(params.headerName) ?? []), ``, `#include "${params.componentName}.generated.h"`, ``, ...params.forwardDeclarations, ``);
    params.fileWriter.writeFile(path_1.default.join(params.outHeaderDir, params.headerName), headerLines);
}
exports.writeSceneComponent = writeSceneComponent;
//# sourceMappingURL=SceneComponentShared.js.map
