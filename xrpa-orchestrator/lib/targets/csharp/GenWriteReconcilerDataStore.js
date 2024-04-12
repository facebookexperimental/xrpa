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
exports.genOutboundReconciledTypes = exports.defaultFieldToMemberVar = exports.genWriteFunctionBody = exports.genWriteFieldAccessors = exports.genClearSetClearFunctionBody = exports.genClearSetSetterFunctionBody = exports.genFieldSetDirty = void 0;
const assert_1 = __importDefault(require("assert"));
const ClassSpec_1 = require("../../shared/ClassSpec");
const Helpers_1 = require("../../shared/Helpers");
const TypeDefinition_1 = require("../../shared/TypeDefinition");
const TypeValue_1 = require("../../shared/TypeValue");
const CsharpCodeGenImpl_1 = require("./CsharpCodeGenImpl");
const CsharpCodeGenImpl = __importStar(require("./CsharpCodeGenImpl"));
const CsharpDatasetLibraryTypes_1 = require("./CsharpDatasetLibraryTypes");
const GenDataStoreShared_1 = require("../shared/GenDataStoreShared");
const GenMessageAccessors_1 = require("./GenMessageAccessors");
const GenDataStore_1 = require("./GenDataStore");
function genFieldSetDirty(params) {
    if (params.proxyObj) {
        return [
            `if (${params.proxyObj} != null) {`,
            `  _changeBits |= ${params.typeDef.getChangedBit(params.ctx.namespace, params.includes, params.fieldName)};`,
            `  ${params.proxyObj}.SetDirty();`,
            `}`,
        ];
    }
    else {
        return [
            `if (_reconciler != null) {`,
            `  _changeBits |= ${params.typeDef.getChangedBit(params.ctx.namespace, params.includes, params.fieldName)};`,
            `  _reconciler.SetDirty(GetDSID());`,
            `}`,
        ];
    }
}
exports.genFieldSetDirty = genFieldSetDirty;
function genClearSetSetterFunctionBody(params) {
    return [
        ...(params.setterHooks?.[params.fieldName]?.preSet ?? []),
        ...params.fieldType.resetLocalVarToDefault(params.ctx.namespace, params.includes, params.fieldVar, true),
        ...(params.setterHooks?.[params.fieldName]?.postSet ?? []),
        ...(params.needsSetDirty ? genFieldSetDirty(params) : []),
    ];
}
exports.genClearSetSetterFunctionBody = genClearSetSetterFunctionBody;
function genClearSetClearFunctionBody(params) {
    return [
        `${params.fieldType.declareLocalVar(params.ctx.namespace, params.includes, "clearValue")};`,
        `if (${params.fieldVar} != clearValue) {`,
        ...(0, Helpers_1.indent)(1, params.setterHooks?.[params.fieldName]?.preSet ?? []),
        `  ${params.fieldVar} = clearValue;`,
        ...(0, Helpers_1.indent)(1, params.setterHooks?.[params.fieldName]?.postSet ?? []),
        ...(0, Helpers_1.indent)(1, params.needsSetDirty ? genFieldSetDirty(params) : []),
        `}`,
    ];
}
exports.genClearSetClearFunctionBody = genClearSetClearFunctionBody;
function genWriteFieldSetters(classSpec, params) {
    const pascalFieldName = (0, Helpers_1.upperFirst)(params.fieldName);
    const fieldAccessorNameOverride = params.fieldAccessorNameOverrides[params.fieldName];
    const fieldVar = params.fieldToMemberVar(params.fieldName);
    const fieldType = params.fieldType;
    if ((0, TypeDefinition_1.typeIsClearSet)(fieldType)) {
        const overrideParams = (0, Helpers_1.filterToStringArray)(fieldAccessorNameOverride, 2);
        const setterName = overrideParams?.[0] ?? `Set${pascalFieldName}`;
        const clearName = overrideParams?.[1] ?? `Clear${pascalFieldName}`;
        classSpec.methods.push({
            name: setterName,
            body: includes => genClearSetSetterFunctionBody({ ...params, includes, fieldVar, needsSetDirty: true }),
        });
        classSpec.methods.push({
            name: clearName,
            body: includes => genClearSetClearFunctionBody({ ...params, includes, fieldVar, needsSetDirty: true }),
        });
    }
    else if ((0, TypeDefinition_1.typeIsReference)(fieldType)) {
        const setterName = (0, Helpers_1.filterToString)(fieldAccessorNameOverride) ?? `Set${pascalFieldName}`;
        classSpec.methods.push({
            name: setterName,
            parameters: [{
                    name: params.fieldName,
                    type: fieldType.getReferencedSuperType(params.ctx.namespace, classSpec.includes),
                }],
            body: includes => [
                `${fieldVar} = ${fieldType.convertValueFromLocal(params.ctx.namespace, includes, params.fieldName)};`,
                ...genFieldSetDirty({ ...params, includes }),
            ],
        });
    }
    else {
        const setterName = (0, Helpers_1.filterToString)(fieldAccessorNameOverride) ?? `Set${pascalFieldName}`;
        classSpec.methods.push({
            name: setterName,
            parameters: [{
                    name: params.fieldName,
                    type: fieldType,
                }],
            body: includes => [
                `${fieldVar} = ${params.fieldName};`,
                ...genFieldSetDirty({ ...params, includes }),
            ],
        });
    }
}
function genWriteFieldAccessors(classSpec, params) {
    const typeDef = params.reconcilerDef.type;
    const typeFields = typeDef.getStateFields();
    for (const fieldName in typeFields) {
        if (params.directionality === "inbound" && !params.reconcilerDef.isInboundField(fieldName)) {
            continue;
        }
        if (params.directionality === "outbound" && !params.reconcilerDef.isOutboundField(fieldName)) {
            continue;
        }
        const fieldType = typeFields[fieldName].type;
        (0, CsharpCodeGenImpl_1.genFieldGetter)(classSpec, {
            ...params,
            apiname: params.ctx.storeDef.apiname,
            fieldName,
            fieldType,
            fieldToMemberVar: params.fieldToMemberVar,
            convertToLocal: false,
            description: undefined,
        });
        if (!params.gettersOnly) {
            genWriteFieldSetters(classSpec, {
                ...params,
                typeDef,
                fieldName,
                fieldType,
                setterHooks: params.setterHooks ?? {},
            });
        }
    }
}
exports.genWriteFieldAccessors = genWriteFieldAccessors;
function genWriteFunctionBody(params) {
    if (params.proxyObj) {
        (0, assert_1.default)(!params.canCreate);
    }
    const fieldUpdateLines = [];
    const initializerLines = [];
    const writeAccessor = params.reconcilerDef.type.getWriteAccessorType(params.ctx.namespace, params.includes);
    const accessor = params.proxyObj ?? "objAccessor";
    const typeFields = params.reconcilerDef.type.getStateFields();
    for (const fieldName in typeFields) {
        const fieldSpec = typeFields[fieldName];
        const pascalFieldName = (0, Helpers_1.upperFirst)(fieldName);
        if (params.reconcilerDef.isInboundField(fieldName)) {
            const localDefault = fieldSpec.type.getLocalDefaultValue(params.ctx.namespace, params.includes);
            initializerLines.push(`${accessor}.Set${pascalFieldName}(${localDefault});`);
        }
        else {
            const fieldVar = params.fieldToMemberVar(fieldName);
            fieldUpdateLines.push(`if ((_changeBits & ${params.reconcilerDef.type.getChangedBit(params.ctx.namespace, params.includes, fieldName)}) != 0) {`, `  ${accessor}.Set${pascalFieldName}(${fieldVar});`, `}`);
        }
    }
    if (!params.canCreate && !fieldUpdateLines.length) {
        // this is an inbound object (canCreate===false) but no fields are being updated, so there is nothing to do
        return [];
    }
    if (params.proxyObj) {
        return [
            `if (_changeBits == 0 || ${accessor} == null) {`,
            `  return;`,
            `}`,
            ...fieldUpdateLines,
            `_changeBits = 0;`,
        ];
    }
    else {
        return [
            ...(params.canCreate ? [
                `${writeAccessor} objAccessor = new();`,
                `if (_createTimestamp != 0) {`,
                `  objAccessor = accessor.CreateObject<${writeAccessor}>(GetDSID(), _createTimestamp);`,
                `  _createTimestamp = 0;`,
                ...(0, Helpers_1.indent)(1, initializerLines),
                `} else if (_changeBits != 0) {`,
                `  objAccessor = accessor.UpdateObject<${writeAccessor}>(GetDSID(), _changeBits);`,
                `}`,
            ] : [
                `if (_changeBits == 0) {`,
                `  return;`,
                `}`,
                `auto objAccessor = accessor.UpdateObject<${writeAccessor}>(GetDSID(), _changeBits);`,
            ]),
            `if (objAccessor.IsNull()) {`,
            `  return;`,
            `}`,
            ...fieldUpdateLines,
            `_changeBits = 0;`,
        ];
    }
}
exports.genWriteFunctionBody = genWriteFunctionBody;
function defaultFieldToMemberVar(fieldName) {
    return (0, CsharpCodeGenImpl_1.privateMember)(`local${(0, Helpers_1.upperFirst)(fieldName)}`);
}
exports.defaultFieldToMemberVar = defaultFieldToMemberVar;
function genOutboundReconciledTypes(ctx, includesIn) {
    const ret = [];
    const headerFile = (0, CsharpCodeGenImpl_1.getDataStoreHeaderName)(ctx.storeDef.apiname);
    for (const reconcilerDef of ctx.storeDef.getOutputReconcilers()) {
        const typeDef = reconcilerDef.type;
        if (typeDef.getLocalHeaderFile() !== headerFile) {
            continue;
        }
        const readAccessor = typeDef.getReadAccessorType(ctx.namespace, includesIn);
        const classSpec = new ClassSpec_1.ClassSpec({
            name: typeDef.getLocalType(ctx.namespace, null),
            superClass: typeDef.interfaceType ? typeDef.interfaceType.getLocalType(ctx.namespace, includesIn) : CsharpDatasetLibraryTypes_1.DataStoreObject.getLocalType(ctx.namespace, includesIn),
            interfaceName: `${CsharpDatasetLibraryTypes_1.IOutboundReconciledType.getLocalType(ctx.namespace, includesIn)}<${readAccessor}>`,
            namespace: ctx.namespace,
            includes: includesIn,
        });
        classSpec.constructors.push({
            parameters: [{
                    name: "id",
                    type: ctx.moduleDef.DSIdentifier,
                }],
            superClassInitializers: ["id", typeDef.getDSTypeID(ctx.namespace, classSpec.includes)],
            memberInitializers: [
                ["_createTimestamp", CsharpCodeGenImpl_1.GET_CURRENT_CLOCK_TIME],
            ],
            body: [],
        });
        classSpec.methods.push({
            name: "SetDSReconciler",
            parameters: [{
                    name: "reconciler",
                    type: CsharpDatasetLibraryTypes_1.OutboundTypeReconcilerInterface,
                }],
            body: [
                "_reconciler = reconciler;",
            ],
        });
        genWriteFieldAccessors(classSpec, {
            ctx,
            reconcilerDef,
            fieldToMemberVar: defaultFieldToMemberVar,
            fieldAccessorNameOverrides: reconcilerDef.fieldAccessorNameOverrides,
            directionality: "outbound",
            proxyObj: null,
        });
        classSpec.methods.push({
            name: "WriteDSChanges",
            parameters: [{
                    name: "accessor",
                    type: CsharpDatasetLibraryTypes_1.DatasetAccessor,
                }],
            body: includes => genWriteFunctionBody({
                ctx,
                includes,
                reconcilerDef,
                fieldToMemberVar: defaultFieldToMemberVar,
                canCreate: true,
                proxyObj: null,
            }),
            isOverride: true,
        });
        classSpec.methods.push({
            name: "ProcessDSUpdate",
            parameters: [{
                    name: "value",
                    type: readAccessor,
                }, {
                    name: "fieldsChanged",
                    type: CsharpCodeGenImpl_1.PRIMITIVE_INTRINSICS.uint64.typename,
                }],
            body: [],
            isAbstract: reconcilerDef.getInboundChangeBits() !== 0,
        });
        (0, GenMessageAccessors_1.genMessageFieldAccessors)(classSpec, {
            ctx,
            reconcilerDef,
            genMsgHandler: GenDataStore_1.genMsgHandler,
            proxyObj: null,
        });
        (0, GenMessageAccessors_1.genMessageChannelDispatch)(classSpec, {
            ctx,
            reconcilerDef,
            genMsgHandler: GenDataStore_1.genMsgHandler,
            msgDataToParams: () => ["message"],
            isOverride: true,
        });
        (0, GenDataStoreShared_1.genFieldProperties)(classSpec, {
            codegen: CsharpCodeGenImpl,
            reconcilerDef,
            fieldToMemberVar: defaultFieldToMemberVar,
            canCreate: true,
            directionality: "outbound",
            visibility: "protected",
        });
        classSpec.members.push({
            name: "reconciler",
            type: CsharpDatasetLibraryTypes_1.OutboundTypeReconcilerInterface,
            initialValue: new TypeValue_1.CodeLiteralValue(CsharpCodeGenImpl, "null"),
            visibility: "protected",
        });
        ret.push(classSpec);
    }
    return ret;
}
exports.genOutboundReconciledTypes = genOutboundReconciledTypes;
//# sourceMappingURL=GenWriteReconcilerDataStore.js.map
