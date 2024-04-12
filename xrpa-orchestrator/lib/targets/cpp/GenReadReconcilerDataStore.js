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
exports.genInboundTypeReconcilers = exports.getInboundReconcilerClassName = exports.genInboundReconciledTypes = void 0;
const ClassSpec_1 = require("../../shared/ClassSpec");
const Helpers_1 = require("../../shared/Helpers");
const GenDataStoreShared_1 = require("../shared/GenDataStoreShared");
const CppCodeGenImpl_1 = require("./CppCodeGenImpl");
const CppCodeGenImpl = __importStar(require("./CppCodeGenImpl"));
const CppDatasetLibraryTypes_1 = require("./CppDatasetLibraryTypes");
const GenDataStore_1 = require("./GenDataStore");
const GenMessageAccessors_1 = require("./GenMessageAccessors");
const GenSignalAccessors_1 = require("./GenSignalAccessors");
const GenWriteReconcilerDataStore_1 = require("./GenWriteReconcilerDataStore");
function getGetIndexFieldFunction(classSpec, params) {
    if (!params.indexParams) {
        return;
    }
    const indexedFieldType = params.typeDef.getStateFields()[params.indexParams.fieldName].type.getLocalType(classSpec.namespace, classSpec.includes);
    classSpec.methods.push({
        name: "getIndexField",
        returnType: indexedFieldType,
        body: [
            `return ${params.fieldToMemberVar(params.indexParams.fieldName)};`,
        ],
        isConst: true,
    });
}
function genProcessUpdateFunctionBodyForIndexed(ctx, includes, typeDef, reconcilerDef) {
    const lines = [];
    const typeFields = typeDef.getStateFields();
    for (const fieldName in typeFields) {
        // inbound fields only
        if (!reconcilerDef.isInboundField(fieldName)) {
            continue;
        }
        const checkName = `check${(0, Helpers_1.upperFirst)(fieldName)}Changed`;
        const funcName = `get${(0, Helpers_1.upperFirst)(fieldName)}`;
        lines.push(`if (value.${checkName}(fieldsChanged)) {`, `  ${(0, GenWriteReconcilerDataStore_1.defaultFieldToMemberVar)(fieldName)} = value.${funcName}();`, `}`);
    }
    return lines;
}
function genInboundReconciledTypes(ctx, includesIn) {
    const ret = [];
    const headerFile = (0, CppCodeGenImpl_1.getDataStoreHeaderName)(ctx.storeDef.apiname);
    for (const reconcilerDef of ctx.storeDef.getInputReconcilers()) {
        const typeDef = reconcilerDef.type;
        if (typeDef.getLocalHeaderFile() !== headerFile) {
            continue;
        }
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
                }, {
                    name: "reconciler",
                    type: CppDatasetLibraryTypes_1.InboundTypeReconcilerInterface.getLocalType(ctx.namespace, classSpec.includes) + "*",
                }],
            superClassInitializers: ["id", typeDef.getDSTypeID(ctx.namespace, classSpec.includes)],
            memberInitializers: [
                ["reconciler_", "reconciler"],
            ],
            body: [],
        });
        classSpec.virtualDestructor = true;
        classSpec.members.push({
            name: "reconciler",
            type: CppDatasetLibraryTypes_1.InboundTypeReconcilerInterface.getLocalType(ctx.namespace, classSpec.includes) + "*",
            visibility: "private",
        });
        (0, GenWriteReconcilerDataStore_1.genWriteFieldAccessors)(classSpec, {
            ctx,
            reconcilerDef,
            fieldToMemberVar: GenWriteReconcilerDataStore_1.defaultFieldToMemberVar,
            fieldAccessorNameOverrides: {},
            directionality: "outbound",
            proxyObj: null,
        });
        (0, GenDataStoreShared_1.genFieldProperties)(classSpec, {
            codegen: CppCodeGenImpl,
            reconcilerDef,
            fieldToMemberVar: GenWriteReconcilerDataStore_1.defaultFieldToMemberVar,
            canCreate: false,
            canChange: true,
            directionality: "outbound",
            visibility: "private",
        });
        const localPtr = typeDef.getLocalTypePtr(ctx.namespace, classSpec.includes);
        if (reconcilerDef.shouldGenerateConcreteReconciledType()) {
            classSpec.methods.push({
                name: "setDirty",
                body: [
                    `reconciler_->setDirty(getDSID());`,
                ],
            });
            classSpec.methods.push({
                name: "processDSUpdate",
                parameters: [{
                        name: "value",
                        type: `const ${typeDef.getReadAccessorType(ctx.namespace, classSpec.includes)}&`,
                    }, {
                        name: "fieldsChanged",
                        type: CppCodeGenImpl_1.PRIMITIVE_INTRINSICS.uint64.typename,
                    }],
                body: includes => genProcessUpdateFunctionBodyForIndexed(ctx, includes, typeDef, reconcilerDef),
                isVirtual: true,
                isFinal: true,
            });
            classSpec.methods.push({
                name: "create",
                returnType: localPtr,
                parameters: [{
                        name: "id",
                        type: ctx.moduleDef.DSIdentifier,
                    }, {
                        name: "obj",
                        type: `const ${typeDef.getReadAccessorType(ctx.namespace, classSpec.includes)}&`,
                    }, {
                        name: "reconciler",
                        type: CppDatasetLibraryTypes_1.InboundTypeReconcilerInterface.getLocalType(ctx.namespace, classSpec.includes) + "*",
                    }],
                body: [
                    `return std::make_shared<${classSpec.name}>(id, reconciler);`,
                ],
                isStatic: true,
            });
            (0, GenWriteReconcilerDataStore_1.genWriteFieldAccessors)(classSpec, {
                ctx,
                reconcilerDef,
                fieldToMemberVar: GenWriteReconcilerDataStore_1.defaultFieldToMemberVar,
                fieldAccessorNameOverrides: {},
                gettersOnly: true,
                directionality: "inbound",
                proxyObj: null,
            });
            (0, GenDataStoreShared_1.genFieldProperties)(classSpec, {
                codegen: CppCodeGenImpl,
                reconcilerDef,
                fieldToMemberVar: GenWriteReconcilerDataStore_1.defaultFieldToMemberVar,
                canCreate: false,
                canChange: false,
                directionality: "inbound",
                visibility: "private",
            });
            const fields = typeDef.getStateFields();
            for (const name in fields) {
                (0, CppCodeGenImpl_1.genFieldChangedCheck)(classSpec, { parentType: typeDef, fieldName: name });
            }
        }
        else {
            classSpec.methods.push({
                name: "processDSUpdate",
                parameters: [{
                        name: "value",
                        type: `const ${typeDef.getReadAccessorType(ctx.namespace, classSpec.includes)}&`,
                    }, {
                        name: "fieldsChanged",
                        type: CppCodeGenImpl_1.PRIMITIVE_INTRINSICS.uint64.typename,
                    }],
                body: [],
                isAbstract: true,
            });
        }
        classSpec.methods.push({
            name: "processDSDelete",
            body: [],
            isVirtual: true,
        });
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
        classSpec.methods.push({
            name: "writeDSChanges",
            parameters: [{
                    name: "accessor",
                    type: CppDatasetLibraryTypes_1.DatasetAccessor.getLocalType(ctx.namespace, classSpec.includes) + "*",
                }],
            body: includes => (0, GenWriteReconcilerDataStore_1.genWriteFunctionBody)({
                ctx,
                includes,
                reconcilerDef,
                fieldToMemberVar: GenWriteReconcilerDataStore_1.defaultFieldToMemberVar,
                canCreate: false,
                proxyObj: null,
            }),
        });
        getGetIndexFieldFunction(classSpec, { fieldToMemberVar: GenWriteReconcilerDataStore_1.defaultFieldToMemberVar, typeDef, indexParams: reconcilerDef.indexedReconciled });
        ret.push(classSpec);
    }
    return ret;
}
exports.genInboundReconciledTypes = genInboundReconciledTypes;
function getInboundReconcilerClassName(ctx, typeDef) {
    return `Inbound${typeDef.getReadAccessorType(ctx.namespace, null)}Reconciler`;
}
exports.getInboundReconcilerClassName = getInboundReconcilerClassName;
function genInboundTypeReconcilers(ctx, includesIn) {
    const ret = [];
    for (const reconcilerDef of ctx.storeDef.getInputReconcilers()) {
        const typeDef = reconcilerDef.type;
        const readAccessor = typeDef.getReadAccessorType(ctx.namespace, includesIn);
        const localPtr = typeDef.getLocalTypePtr(ctx.namespace, includesIn);
        const indexParams = reconcilerDef.indexedReconciled;
        const indexedFieldType = indexParams ? typeDef.getStateFields()[indexParams.fieldName].type.getLocalType(ctx.namespace, includesIn) : "int";
        const indexedFieldMask = indexParams ? typeDef.getFieldBitMask(indexParams.fieldName) : 0;
        const indexedFieldGet = indexParams ? `directReconciledObj->getIndexField()` : 0;
        const indexedType = indexParams ? `${indexParams.indexedTypeName}*` : `${CppDatasetLibraryTypes_1.DummyIndexReconciledType.getLocalType(ctx.namespace, includesIn)}<${localPtr}>*`;
        const outboundFieldMask = reconcilerDef.getOutboundChangeBits();
        const classSpec = new ClassSpec_1.ClassSpec({
            name: getInboundReconcilerClassName(ctx, typeDef),
            superClass: `${CppDatasetLibraryTypes_1.InboundTypeReconciler.getLocalType(ctx.namespace, includesIn)}<${readAccessor}, ${localPtr}, ${indexedFieldType}, ${indexedType}>`,
            namespace: ctx.namespace,
            includes: includesIn,
        });
        classSpec.constructors.push({
            parameters: [{
                    name: "reconciler",
                    type: CppDatasetLibraryTypes_1.DatasetReconciler.getLocalType(ctx.namespace, classSpec.includes) + "*",
                }],
            superClassInitializers: [
                "reconciler",
                typeDef.getDSTypeID(ctx.namespace, classSpec.includes),
                `${outboundFieldMask}`,
                `${indexedFieldMask}`,
            ],
            body: [],
        });
        classSpec.methods.push({
            name: "getIndexField",
            returnType: indexedFieldType,
            parameters: [{
                    name: "directReconciledObj",
                    type: localPtr + "&",
                }],
            body: [`return ${indexedFieldGet};`],
            isVirtual: true,
            isOverride: true,
            isFinal: true,
        });
        ret.push(classSpec);
    }
    return ret;
}
exports.genInboundTypeReconcilers = genInboundTypeReconcilers;
//# sourceMappingURL=GenReadReconcilerDataStore.js.map
