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
exports.genOutboundReconciledTypes = exports.defaultFieldToMemberVar = exports.genPrepFullUpdateFunctionBody = exports.genWriteFunctionBody = exports.genWriteFieldAccessors = exports.genClearSetClearFunctionBody = exports.genClearSetSetterFunctionBody = exports.genFieldSetDirty = void 0;
const assert_1 = __importDefault(require("assert"));
const ClassSpec_1 = require("../../shared/ClassSpec");
const Helpers_1 = require("../../shared/Helpers");
const TypeDefinition_1 = require("../../shared/TypeDefinition");
const CppCodeGenImpl_1 = require("./CppCodeGenImpl");
const CppCodeGenImpl = __importStar(require("./CppCodeGenImpl"));
const CppDatasetLibraryTypes_1 = require("./CppDatasetLibraryTypes");
const GenDataStoreShared_1 = require("../shared/GenDataStoreShared");
const GenMessageAccessors_1 = require("./GenMessageAccessors");
const GenDataStore_1 = require("./GenDataStore");
const GenSignalAccessors_1 = require("./GenSignalAccessors");
const GenReadReconcilerDataStore_1 = require("./GenReadReconcilerDataStore");
function genFieldSetDirty(params) {
    const changeBit = params.typeDef.getChangedBit(params.ctx.namespace, params.includes, params.fieldName);
    if (params.proxyObj) {
        return [
            `if (${params.proxyObj} && (changeBits_ & ${changeBit}) == 0) {`,
            `  changeBits_ |= ${changeBit};`,
            `  ${params.proxyObj}->setDirty(${changeBit});`,
            `}`,
        ];
    }
    else {
        const fieldSize = params.typeDef.getFieldSize(params.ctx.namespace, params.includes, params.fieldName);
        return [
            `if (collection_ && (changeBits_ & ${changeBit}) == 0) {`,
            `  changeBits_ |= ${changeBit};`,
            `  changeByteCount_ += ${fieldSize};`,
            `  collection_->setDirty(getXrpaId(), ${changeBit});`,
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
    const fieldType = params.fieldType;
    const pascalFieldName = (0, Helpers_1.upperFirst)(params.fieldName);
    const rawOverrideParams = params.fieldAccessorNameOverrides[params.fieldName];
    const fieldVar = params.fieldToMemberVar(params.fieldName);
    if ((0, TypeDefinition_1.typeIsClearSet)(fieldType)) {
        const overrideParams = (0, Helpers_1.filterToStringArray)(rawOverrideParams, 2);
        const setterName = overrideParams?.[0] ?? `set${pascalFieldName}`;
        const clearName = overrideParams?.[1] ?? `clear${pascalFieldName}`;
        classSpec.methods.push({
            name: setterName,
            body: genClearSetSetterFunctionBody({ ...params, includes: classSpec.includes, fieldVar, needsSetDirty: true }),
        });
        classSpec.methods.push({
            name: clearName,
            body: genClearSetClearFunctionBody({ ...params, includes: classSpec.includes, fieldVar, needsSetDirty: true }),
        });
    }
    else if ((0, TypeDefinition_1.typeIsReference)(fieldType)) {
        const setterName = (0, Helpers_1.filterToString)(rawOverrideParams) ?? `set${pascalFieldName}`;
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
            separateImplementation: true,
        });
        classSpec.methods.push({
            name: setterName + "Id",
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
    else {
        const setterName = (0, Helpers_1.filterToString)(rawOverrideParams) ?? `set${pascalFieldName}`;
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
        (0, CppCodeGenImpl_1.genFieldGetter)(classSpec, {
            ...params,
            apiname: params.ctx.storeDef.apiname,
            fieldName,
            fieldType,
            fieldToMemberVar: params.fieldToMemberVar,
            convertToLocal: false,
            description: undefined,
            isConst: true,
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
    const writeAccessor = params.reconcilerDef.type.getWriteAccessorType(params.ctx.namespace, params.includes);
    const accessor = params.proxyObj ? `${params.proxyObj}->` : "objAccessor.";
    const typeFields = params.reconcilerDef.type.getStateFields();
    for (const fieldName in typeFields) {
        const pascalFieldName = (0, Helpers_1.upperFirst)(fieldName);
        if (!params.reconcilerDef.isInboundField(fieldName)) {
            const fieldVar = params.fieldToMemberVar(fieldName);
            fieldUpdateLines.push(`if (changeBits_ & ${params.reconcilerDef.type.getChangedBit(params.ctx.namespace, params.includes, fieldName)}) {`, `  ${accessor}set${pascalFieldName}(${fieldVar});`, `}`);
        }
    }
    if (!params.canCreate && !fieldUpdateLines.length) {
        // this is an inbound object (canCreate===false) but no fields are being updated, so there is nothing to do
        return [];
    }
    if (params.proxyObj) {
        return [
            `if (!changeBits_ || !${params.proxyObj}) {`,
            `  return;`,
            `}`,
            ...fieldUpdateLines,
            `changeBits_ = 0;`,
        ];
    }
    else {
        return [
            ...(params.canCreate ? [
                `${writeAccessor} objAccessor;`,
                `if (!createWritten_) {`,
                `  changeBits_ = ${params.reconcilerDef.getOutboundChangeBits()};`,
                `  changeByteCount_ = ${params.reconcilerDef.getOutboundChangeByteCount()};`,
                `  objAccessor = ${writeAccessor}::create(accessor, getXrpaId(), changeByteCount_, createTimestamp_);`,
                `  createWritten_ = true;`,
                `} else if (changeBits_ != 0) {`,
                `  objAccessor = ${writeAccessor}::update(accessor, getXrpaId(), changeBits_, changeByteCount_);`,
                `}`,
            ] : [
                `if (changeBits_ == 0) {`,
                `  return;`,
                `}`,
                `auto objAccessor = ${writeAccessor}::update(accessor, getXrpaId(), changeBits_, changeByteCount_);`,
            ]),
            `if (objAccessor.isNull()) {`,
            `  return;`,
            `}`,
            ...fieldUpdateLines,
            `changeBits_ = 0;`,
            `changeByteCount_ = 0;`,
        ];
    }
}
exports.genWriteFunctionBody = genWriteFunctionBody;
function genPrepFullUpdateFunctionBody(params) {
    const outboundChangeBits = params.reconcilerDef.getOutboundChangeBits();
    if (!outboundChangeBits && !params.canCreate) {
        return ["return 0;"];
    }
    return [
        ...(params.canCreate ? [
            `createWritten_ = false;`,
        ] : []),
        `changeBits_ = ${outboundChangeBits};`,
        `changeByteCount_ = ${params.reconcilerDef.getOutboundChangeByteCount()};`,
        ...(params.canCreate ? [
            `return createTimestamp_;`,
        ] : [
            `return 1;`,
        ]),
    ];
}
exports.genPrepFullUpdateFunctionBody = genPrepFullUpdateFunctionBody;
function defaultFieldToMemberVar(fieldName) {
    return (0, CppCodeGenImpl_1.privateMember)(`local${(0, Helpers_1.upperFirst)(fieldName)}`);
}
exports.defaultFieldToMemberVar = defaultFieldToMemberVar;
function genOutboundReconciledTypes(ctx, includesIn) {
    const ret = [];
    const headerFile = (0, CppCodeGenImpl_1.getDataStoreHeaderName)(ctx.storeDef.apiname);
    for (const reconcilerDef of ctx.storeDef.getOutputReconcilers()) {
        const typeDef = reconcilerDef.type;
        if (typeDef.getLocalHeaderFile() !== headerFile) {
            continue;
        }
        const readAccessor = typeDef.getReadAccessorType(ctx.namespace, includesIn);
        const classSpec = new ClassSpec_1.ClassSpec({
            name: typeDef.getLocalType(ctx.namespace, null),
            superClass: typeDef.interfaceType ? typeDef.interfaceType.getLocalType(ctx.namespace, includesIn) : CppDatasetLibraryTypes_1.DataStoreObject.getLocalType(ctx.namespace, includesIn),
            namespace: ctx.namespace,
            includes: includesIn,
        });
        classSpec.constructors.push({
            parameters: [{
                    name: "id",
                    type: ctx.moduleDef.DSIdentifier,
                }],
            superClassInitializers: ["id", "nullptr"],
            memberInitializers: [
                ["createTimestamp_", CppCodeGenImpl_1.GET_CURRENT_CLOCK_TIME],
            ],
            body: [],
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
            name: "writeDSChanges",
            parameters: [{
                    name: "accessor",
                    type: CppDatasetLibraryTypes_1.DatasetAccessor.getLocalType(ctx.namespace, classSpec.includes) + "*",
                }],
            body: includes => genWriteFunctionBody({
                ctx,
                includes,
                reconcilerDef,
                fieldToMemberVar: defaultFieldToMemberVar,
                canCreate: true,
                proxyObj: null,
            }),
        });
        classSpec.methods.push({
            name: "prepDSFullUpdate",
            returnType: CppCodeGenImpl.PRIMITIVE_INTRINSICS.uint64.typename,
            body: includes => genPrepFullUpdateFunctionBody({
                ctx,
                includes,
                reconcilerDef,
                canCreate: true,
            }),
        });
        if (reconcilerDef.shouldGenerateConcreteReconciledType()) {
            classSpec.methods.push({
                name: "processDSUpdate",
                parameters: [{
                        name: "value",
                        type: readAccessor,
                    }, {
                        name: "fieldsChanged",
                        type: CppCodeGenImpl_1.PRIMITIVE_INTRINSICS.uint64.typename,
                    }],
                body: includes => (0, GenReadReconcilerDataStore_1.genProcessUpdateFunctionBodyForConcreteReconciledType)(ctx, includes, typeDef, reconcilerDef),
            });
            genWriteFieldAccessors(classSpec, {
                ctx,
                reconcilerDef,
                fieldToMemberVar: defaultFieldToMemberVar,
                fieldAccessorNameOverrides: {},
                gettersOnly: true,
                directionality: "inbound",
                proxyObj: null,
            });
            (0, GenDataStoreShared_1.genFieldProperties)(classSpec, {
                codegen: CppCodeGenImpl,
                reconcilerDef,
                fieldToMemberVar: defaultFieldToMemberVar,
                canCreate: false,
                canChange: false,
                directionality: "inbound",
                visibility: "private",
            });
        }
        else {
            classSpec.methods.push({
                name: "processDSUpdate",
                parameters: [{
                        name: "value",
                        type: readAccessor,
                    }, {
                        name: "fieldsChanged",
                        type: CppCodeGenImpl_1.PRIMITIVE_INTRINSICS.uint64.typename,
                    }],
                body: [],
                isAbstract: reconcilerDef.getInboundChangeBits() !== 0,
            });
        }
        (0, GenMessageAccessors_1.genMessageFieldAccessors)(classSpec, {
            ctx,
            reconcilerDef,
            genMsgHandler: GenDataStore_1.genMsgHandler,
            proxyObj: null,
        });
        (0, GenSignalAccessors_1.genSignalFieldAccessors)(classSpec, {
            ctx,
            reconcilerDef,
            proxyObj: null,
        });
        (0, GenMessageAccessors_1.genMessageChannelDispatch)(classSpec, {
            ctx,
            reconcilerDef,
            genMsgHandler: GenDataStore_1.genMsgHandler,
            msgDataToParams: () => ["message"],
        });
        (0, GenDataStoreShared_1.genFieldProperties)(classSpec, {
            codegen: CppCodeGenImpl,
            reconcilerDef,
            fieldToMemberVar: defaultFieldToMemberVar,
            canCreate: true,
            directionality: "outbound",
            visibility: "protected",
        });
        ret.push(classSpec);
    }
    return ret;
}
exports.genOutboundReconciledTypes = genOutboundReconciledTypes;
//# sourceMappingURL=GenWriteReconcilerDataStore.js.map
