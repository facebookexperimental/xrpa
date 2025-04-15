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
exports.writeSceneComponent = exports.genProcessUpdateBody = exports.genTransformUpdates = exports.genTransformInitializers = exports.genFieldInitializers = exports.genFieldDefaultInitializers = exports.genUEMessageFieldAccessors = exports.genUEMessageProxyDispatch = exports.genFieldSetterCalls = exports.genFieldProperties = exports.getFieldMemberName = exports.getComponentHeader = exports.getComponentClassName = exports.checkForTransformMapping = exports.IntrinsicProperty = void 0;
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const path_1 = __importDefault(require("path"));
const TypeDefinition_1 = require("../../shared/TypeDefinition");
const CppCodeGenImpl_1 = require("../cpp/CppCodeGenImpl");
const CppCodeGenImpl = __importStar(require("../cpp/CppCodeGenImpl"));
const GenMessageAccessors_1 = require("../cpp/GenMessageAccessors");
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
    const className = `U${(0, xrpa_utils_1.filterToString)(id) ?? ""}${typeName}Component`;
    includes?.addFile({ filename: `${className.slice(1)}.h` });
    return className;
}
exports.getComponentClassName = getComponentClassName;
function getComponentHeader(type, id) {
    return `${getComponentClassName(null, type, id).slice(1)}.h`;
}
exports.getComponentHeader = getComponentHeader;
function getFieldMemberName(reconcilerDef, fieldName) {
    return (0, xrpa_utils_1.filterToString)(reconcilerDef.fieldAccessorNameOverrides[fieldName]) ?? (0, xrpa_utils_1.upperFirst)(fieldName);
}
exports.getFieldMemberName = getFieldMemberName;
function genWriteFieldProperty(classSpec, params) {
    const fieldSpec = params.reconcilerDef.getFieldSpec(params.fieldName);
    const fieldType = fieldSpec.type;
    const typeDef = params.reconcilerDef.type;
    const pascalFieldName = (0, xrpa_utils_1.upperFirst)(params.fieldName);
    const canBeBlueprinted = isLegalBlueprintType(params.ctx, fieldType);
    const isBoundToIntrinsic = params.reconcilerDef.isFieldBoundToIntrinsic(params.fieldName);
    const isClearSet = params.reconcilerDef.isClearSetField(params.fieldName);
    const hasSetter = !isBoundToIntrinsic && !isClearSet;
    const isEphemeral = params.reconcilerDef.isEphemeralField(params.fieldName);
    const isSerialized = params.reconcilerDef.isSerializedField(params.fieldName);
    const overrideParams = (0, xrpa_utils_1.filterToStringArray)(params.reconcilerDef.fieldAccessorNameOverrides[params.fieldName], 2);
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
            body: [
                `if (${params.proxyObj}) { ${params.proxyObj}->set${pascalFieldName}(); }`,
            ],
            separateImplementation: params.separateImplementation,
        });
        classSpec.methods.push({
            name: clearName,
            decorations: [
                ...(0, CppCodeGenImpl_1.genCommentLines)(fieldSpec.description),
                `UFUNCTION(BlueprintCallable, Category = "${params.categoryName}")`,
            ],
            body: [
                `if (${params.proxyObj}) { ${params.proxyObj}->clear${pascalFieldName}(); }`,
            ],
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
            body: [
                ...(params.setterHooks?.[params.fieldName]?.preSet ?? []),
                `${params.memberName} = value;`,
                ...(params.setterHooks?.[params.fieldName]?.postSet ?? []),
                ...(params.isOutboundField ? [
                    `if (${params.proxyObj}) { ${params.proxyObj}->set${pascalFieldName}(value); }`,
                ] : []),
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
        const isIndexBoundField = params.reconcilerDef.isIndexBoundField(fieldName);
        const isOutboundField = params.reconcilerDef.isOutboundField(fieldName);
        if (isIndexBoundField || isOutboundField) {
            genWriteFieldProperty(classSpec, { ...params, categoryName, fieldName, memberName, isOutboundField });
        }
        else {
            genReadFieldProperty(classSpec, { ...params, categoryName, fieldName, memberName });
        }
    }
}
exports.genFieldProperties = genFieldProperties;
function genFieldSetterCalls(params) {
    const lines = [];
    const fields = params.reconcilerDef.type.getStateFields();
    for (const fieldName in fields) {
        const memberName = getFieldMemberName(params.reconcilerDef, fieldName);
        if (params.reconcilerDef.isOutboundField(fieldName)) {
            const fieldType = fields[fieldName].type;
            if ((0, TypeDefinition_1.typeIsReference)(fieldType)) {
                lines.push(`${params.proxyObj}->set${(0, xrpa_utils_1.upperFirst)(fieldName)}Id(${memberName});`);
            }
            else {
                lines.push(`${params.proxyObj}->set${(0, xrpa_utils_1.upperFirst)(fieldName)}(${memberName});`);
            }
        }
    }
    return lines;
}
exports.genFieldSetterCalls = genFieldSetterCalls;
/********************************************************/
function genUESendMessageAccessor(classSpec, params) {
    (0, GenMessageAccessors_1.genSendMessageAccessor)(classSpec, {
        ...params,
        name: `Send${(0, xrpa_utils_1.upperFirst)(params.fieldName)}`,
        decorations: [
            `UFUNCTION(BlueprintCallable, Category = "${params.typeDef.getName()}")`,
        ],
        referencesNeedConversion: false,
        separateImplementation: true,
    });
}
function genUEMessageProxyDispatch(classSpec, params) {
    const msgEventType = (0, GenBlueprintTypes_1.getMessageDelegateName)(params.fieldType, params.storeDef.apiname);
    const ueHandlerName = `On${(0, xrpa_utils_1.upperFirst)(params.fieldName)}`;
    const ueDispatchName = `dispatch${(0, xrpa_utils_1.upperFirst)(params.fieldName)}`;
    const proxyHandlerName = `on${(0, xrpa_utils_1.upperFirst)(params.fieldName)}`;
    classSpec.includes?.addFile({ filename: (0, GenBlueprintTypes_1.getBlueprintTypesHeaderName)(params.storeDef.apiname) });
    classSpec.members.push({
        name: ueHandlerName,
        type: msgEventType,
        decorations: [`UPROPERTY(BlueprintAssignable, Category = "${params.categoryName}")`],
    });
    const messageReadAccessor = params.fieldType.getReadAccessorType(classSpec.namespace, null);
    (0, xrpa_utils_1.pushUnique)(params.forwardDeclarations, (0, CppCodeGenImpl_1.forwardDeclareClass)(messageReadAccessor));
    classSpec.methods.push({
        name: ueDispatchName,
        parameters: [{
                name: "timestamp",
                type: CppCodeGenImpl_1.PRIMITIVE_INTRINSICS.uint64.typename,
            }, {
                name: "message",
                type: messageReadAccessor,
            }],
        body: includes => (0, CppCodeGenImpl_1.genMessageDispatch)({
            namespace: classSpec.namespace,
            includes,
            fieldName: params.fieldName,
            fieldType: params.fieldType,
            genMsgHandler: msg => `On${(0, xrpa_utils_1.upperFirst)(msg)}.Broadcast`,
            msgDataToParams: convertMessageTypeToParams,
            convertToReadAccessor: false,
            timestampName: "FDateTime(timestamp)",
        }),
        visibility: "private",
        separateImplementation: true,
    });
    const dispatchBind = (0, CppCodeGenImpl_1.genPassthroughMethodBind)(ueDispatchName, 2);
    params.initializerLines.push(`${(0, CppCodeGenImpl_1.genDerefMethodCall)(params.proxyObj, params.proxyIsXrpaObj ? proxyHandlerName : (0, xrpa_utils_1.upperFirst)(proxyHandlerName), [dispatchBind])};`);
}
exports.genUEMessageProxyDispatch = genUEMessageProxyDispatch;
function convertMessageTypeToParams(msgType, prelude) {
    const params = [];
    const fields = msgType.getStateFields();
    for (const key in fields) {
        const fieldType = fields[key].type;
        if ((0, TypeDefinition_1.typeIsReference)(fieldType)) {
            (0, xrpa_utils_1.pushUnique)(prelude, `auto datastore = GetDataStoreSubsystem()->DataStore.get();`);
            params.push(`message.get${(0, xrpa_utils_1.upperFirst)(key)}(datastore)->getXrpaOwner<${getComponentClassName(null, fieldType.toType)}>()`);
        }
        else {
            params.push(`message.get${(0, xrpa_utils_1.upperFirst)(key)}()`);
        }
    }
    return params;
}
function genUEMessageFieldAccessors(classSpec, params) {
    const typeDef = params.reconcilerDef.type;
    const typeFields = typeDef.getFieldsOfType(TypeDefinition_1.typeIsMessageData);
    for (const fieldName in typeFields) {
        const fieldType = typeFields[fieldName];
        if (params.reconcilerDef.isInboundField(fieldName)) {
            genUEMessageProxyDispatch(classSpec, {
                storeDef: params.ctx.storeDef,
                categoryName: typeDef.getName(),
                fieldName,
                fieldType,
                proxyObj: params.proxyObj,
                proxyIsXrpaObj: true,
                initializerLines: params.initializerLines,
                forwardDeclarations: params.forwardDeclarations,
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
            (0, xrpa_utils_1.pushUnique)(prelude, `auto& transform = GetComponentTransform();`);
            return [`${targetVar} = transform.Get${property}();`];
        case IntrinsicProperty.Parent: {
            if (!(0, TypeDefinition_1.typeIsReference)(fieldType)) {
                return [];
            }
            (0, xrpa_utils_1.pushUnique)(prelude, `TArray<USceneComponent*> componentParents;`);
            (0, xrpa_utils_1.pushUnique)(prelude, `GetParentComponents(componentParents);`);
            const parentComponentClassName = getComponentClassName(includes, fieldType.toType);
            return [
                ...fieldType.resetLocalVarToDefault(ctx.namespace, includes, targetVar),
                `for (auto parent : componentParents) {`,
                `  auto componentPtr = Cast<${parentComponentClassName}>(parent);`,
                `  if (componentPtr != nullptr) {`,
                `    componentPtr->initializeDS();`,
                `    ${targetVar} = componentPtr->getXrpaId();`,
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
            (0, xrpa_utils_1.pushUnique)(params.prelude, `bool ${params.fieldName}Changed = false;`);
            (0, xrpa_utils_1.pushUnique)(params.prelude, `auto& transform = GetComponentTransform();`);
            (0, xrpa_utils_1.pushUnique)(params.prelude, `auto transform${params.fieldBinding} = transform.Get${params.fieldBinding}();`);
            (0, xrpa_utils_1.pushUnique)(params.changes, `if (${params.fieldName}Changed && ${params.proxyObj}) { ${params.proxyObj}->set${(0, xrpa_utils_1.upperFirst)(params.fieldName)}(${params.memberName}); }`);
            return [
                `if (!${params.targetVar}.Equals(transform${params.fieldBinding}, SMALL_NUMBER)) {`,
                `  ${params.targetVar} = transform${params.fieldBinding};`,
                `  ${params.fieldName}Changed = true;`,
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
                targetVar: memberName,
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
                    targetVar: `${memberName}.${subfieldName}`,
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
        let funcName = `get${(0, xrpa_utils_1.upperFirst)(fieldName)}`;
        if ((0, TypeDefinition_1.typeIsReference)(fields[fieldName].type)) {
            funcName += "Id";
        }
        lines.push(`if (${params.proxyObj}->check${(0, xrpa_utils_1.upperFirst)(fieldName)}Changed(fieldsChanged)) {`, `  ${memberName} = ${params.proxyObj}->${funcName}();`);
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
