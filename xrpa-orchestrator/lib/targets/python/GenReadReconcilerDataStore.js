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
exports.genIndexedBindingCalls = exports.genObjectCollectionClasses = exports.genInboundReconciledTypes = exports.genProcessUpdateFunctionBody = void 0;
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const ClassSpec_1 = require("../../shared/ClassSpec");
const DataStore_1 = require("../../shared/DataStore");
const TypeValue_1 = require("../../shared/TypeValue");
const GenDataStoreShared_1 = require("../shared/GenDataStoreShared");
const GenSignalAccessorsShared_1 = require("../shared/GenSignalAccessorsShared");
const PythonCodeGenImpl_1 = require("./PythonCodeGenImpl");
const PythonCodeGenImpl = __importStar(require("./PythonCodeGenImpl"));
const PythonDatasetLibraryTypes_1 = require("./PythonDatasetLibraryTypes");
const GenDataStore_1 = require("./GenDataStore");
const GenMessageAccessors_1 = require("./GenMessageAccessors");
const GenWriteReconcilerDataStore_1 = require("./GenWriteReconcilerDataStore");
function genProcessUpdateFunctionBody(ctx, includes, typeDef, reconcilerDef) {
    const lines = [];
    const typeFields = typeDef.getStateFields();
    for (const fieldName in typeFields) {
        // inbound fields only
        if (!reconcilerDef.isInboundField(fieldName)) {
            continue;
        }
        const checkName = `check_${(0, PythonCodeGenImpl_1.identifierName)(fieldName)}_changed`;
        const funcName = (0, GenDataStoreShared_1.fieldGetterFuncName)(PythonCodeGenImpl, typeFields, fieldName);
        lines.push(`if value.${checkName}(fields_changed):`, `  ${(0, GenWriteReconcilerDataStore_1.defaultFieldToMemberVar)(fieldName)} = value.${funcName}()`);
    }
    lines.push(`self._handle_xrpa_fields_changed(fields_changed)`);
    return lines;
}
exports.genProcessUpdateFunctionBody = genProcessUpdateFunctionBody;
function genInboundReconciledTypes(ctx, includesIn) {
    const ret = [];
    const headerFile = (0, PythonCodeGenImpl_1.getDataStoreHeaderName)(ctx.storeDef.apiname);
    for (const reconcilerDef of ctx.storeDef.getInputReconcilers()) {
        const typeDef = reconcilerDef.type;
        if (typeDef.getLocalHeaderFile() !== headerFile) {
            continue;
        }
        const readAccessor = typeDef.getReadAccessorType(ctx.namespace, includesIn);
        const classSpec = new ClassSpec_1.ClassSpec({
            name: typeDef.getLocalType(ctx.namespace, null),
            superClass: PythonDatasetLibraryTypes_1.DataStoreObject.getLocalType(ctx.namespace, includesIn),
            interfaceName: typeDef.interfaceType ? typeDef.interfaceType.getLocalType(ctx.namespace, includesIn) : `${PythonDatasetLibraryTypes_1.IDataStoreObjectAccessor.getLocalType(ctx.namespace, includesIn)}[${readAccessor}]`,
            namespace: ctx.namespace,
            includes: includesIn,
        });
        (0, GenWriteReconcilerDataStore_1.genChangeHandlerMethods)(classSpec, true);
        classSpec.constructors.push({
            parameters: [{
                    name: "id",
                    type: ctx.moduleDef.ObjectUuid,
                }, {
                    name: "collection",
                    type: PythonDatasetLibraryTypes_1.IObjectCollection,
                }],
            superClassInitializers: ["id", "collection"],
            body: [],
        });
        (0, GenWriteReconcilerDataStore_1.genWriteFieldAccessors)(classSpec, {
            ctx,
            reconcilerDef,
            fieldToMemberVar: GenWriteReconcilerDataStore_1.defaultFieldToMemberVar,
            fieldAccessorNameOverrides: {},
            directionality: "outbound",
        });
        (0, GenDataStoreShared_1.genFieldProperties)(classSpec, {
            codegen: PythonCodeGenImpl,
            reconcilerDef,
            fieldToMemberVar: GenWriteReconcilerDataStore_1.defaultFieldToMemberVar,
            canCreate: false,
            canChange: true,
            canSetDirty: true,
            directionality: "outbound",
            visibility: "private",
        });
        classSpec.methods.push({
            name: "process_ds_update",
            parameters: [{
                    name: "value",
                    type: readAccessor,
                }, {
                    name: "fields_changed",
                    type: PythonCodeGenImpl_1.PRIMITIVE_INTRINSICS.uint64.typename,
                }],
            body: includes => genProcessUpdateFunctionBody(ctx, includes, typeDef, reconcilerDef),
            isVirtual: true,
            isFinal: true,
        });
        classSpec.methods.push({
            name: "create",
            returnType: classSpec.name,
            parameters: [{
                    name: "id",
                    type: ctx.moduleDef.ObjectUuid,
                }, {
                    name: "obj",
                    type: readAccessor,
                }, {
                    name: "collection",
                    type: PythonDatasetLibraryTypes_1.IObjectCollection,
                }],
            body: [
                `return ${classSpec.name}(id, collection)`,
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
        });
        (0, GenDataStoreShared_1.genFieldProperties)(classSpec, {
            codegen: PythonCodeGenImpl,
            reconcilerDef,
            fieldToMemberVar: GenWriteReconcilerDataStore_1.defaultFieldToMemberVar,
            canCreate: false,
            canChange: false,
            directionality: "inbound",
            visibility: "private",
        });
        const fields = typeDef.getStateFields();
        for (const name in fields) {
            (0, PythonCodeGenImpl_1.genFieldChangedCheck)(classSpec, { parentType: typeDef, fieldName: name });
        }
        (0, GenMessageAccessors_1.genMessageFieldAccessors)(classSpec, {
            reconcilerDef,
            genMsgHandler: GenDataStore_1.genMsgHandler,
        });
        (0, GenSignalAccessorsShared_1.genSignalFieldAccessors)(classSpec, {
            codegen: PythonCodeGenImpl,
            reconcilerDef,
            proxyObj: null,
        });
        (0, GenMessageAccessors_1.genMessageChannelDispatch)(classSpec, {
            reconcilerDef,
            genMsgHandler: GenDataStore_1.genMsgHandler,
            msgDataToParams: () => ["message"],
        });
        classSpec.methods.push({
            name: "write_ds_changes",
            parameters: [{
                    name: "accessor",
                    type: PythonDatasetLibraryTypes_1.TransportStreamAccessor,
                }],
            body: includes => (0, GenWriteReconcilerDataStore_1.genWriteFunctionBody)({
                ctx,
                includes,
                reconcilerDef,
                fieldToMemberVar: GenWriteReconcilerDataStore_1.defaultFieldToMemberVar,
                canCreate: false,
            }),
            isVirtual: true,
        });
        classSpec.methods.push({
            name: "prep_ds_full_update",
            returnType: PythonCodeGenImpl.PRIMITIVE_INTRINSICS.uint64.typename,
            body: includes => (0, GenWriteReconcilerDataStore_1.genPrepFullUpdateFunctionBody)({
                ctx,
                includes,
                reconcilerDef,
                fieldToMemberVar: GenWriteReconcilerDataStore_1.defaultFieldToMemberVar,
                canCreate: false,
            }),
        });
        ret.push(classSpec);
    }
    return ret;
}
exports.genInboundReconciledTypes = genInboundReconciledTypes;
function genObjectCollectionClasses(ctx, includesIn) {
    const ret = [];
    for (const reconcilerDef of ctx.storeDef.getAllReconcilers()) {
        const isLocalOwned = reconcilerDef instanceof DataStore_1.OutputReconcilerDefinition;
        const typeDef = reconcilerDef.type;
        const readAccessor = typeDef.getReadAccessorType(ctx.namespace, includesIn);
        const localPtr = typeDef.getLocalTypePtr(ctx.namespace, includesIn);
        const indexedFieldMask = reconcilerDef.getIndexedBitMask();
        const inboundFieldMask = reconcilerDef.getInboundChangeBits();
        const superClass = `${PythonDatasetLibraryTypes_1.ObjectCollection.getLocalType(ctx.namespace, includesIn)}[${readAccessor}, ${localPtr}]`;
        const classSpec = new ClassSpec_1.ClassSpec({
            name: isLocalOwned ? (0, GenDataStoreShared_1.getOutboundCollectionClassName)(ctx, typeDef) : (0, GenDataStoreShared_1.getInboundCollectionClassName)(ctx, typeDef),
            superClass,
            namespace: ctx.namespace,
            includes: includesIn,
        });
        const constructorBody = [];
        // inbound (remotely created) objects are created by the reconciler, so we need to give it a delegate functions
        const reconciledTypeName = typeDef.getLocalType(ctx.namespace, null);
        if (reconcilerDef instanceof DataStore_1.InputReconcilerDefinition) {
            constructorBody.push(`self._set_create_delegate_internal(${reconciledTypeName}.create)`);
            classSpec.methods.push({
                name: "set_create_delegate",
                parameters: [{
                        name: "create_delegate",
                        type: `typing.Callable[[${ctx.moduleDef.ObjectUuid.getLocalType(ctx.namespace, includesIn)}, ${readAccessor}, ${PythonDatasetLibraryTypes_1.IObjectCollection.getLocalType(ctx.namespace, includesIn)}], ${localPtr}]`,
                    }],
                body: ["self._set_create_delegate_internal(create_delegate)"],
            });
            includesIn.addFile({ namespace: "typing" });
        }
        else {
            // expose addObject, removeObject, and createObject to the user
            classSpec.methods.push({
                name: "add_object",
                parameters: [{
                        name: "obj",
                        type: localPtr,
                    }],
                body: ["self._add_object_internal(obj)"],
            });
            const id = (0, PythonCodeGenImpl_1.genRuntimeGuid)({
                objectUuidType: ctx.moduleDef.ObjectUuid.getLocalType(ctx.namespace, classSpec.includes),
                guidGen: ctx.moduleDef.guidGen,
                includes: classSpec.includes,
            });
            classSpec.methods.push({
                name: "create_object",
                returnType: reconciledTypeName,
                body: [
                    `obj = ${reconciledTypeName}(${id})`,
                    `self._add_object_internal(obj)`,
                    `return obj`,
                ],
            });
            classSpec.methods.push({
                name: "remove_object",
                parameters: [{
                        name: "id",
                        type: ctx.moduleDef.ObjectUuid,
                    }],
                body: ["self._remove_object_internal(id)"],
            });
        }
        classSpec.constructors.push({
            parameters: [{
                    name: "reconciler",
                    type: PythonDatasetLibraryTypes_1.DataStoreReconciler,
                }],
            superClassInitializers: [
                readAccessor,
                "reconciler",
                `${typeDef.getCollectionId()}`,
                `${inboundFieldMask}`,
                `${indexedFieldMask}`,
                (0, xrpa_utils_1.upperFirst)(`${isLocalOwned}`),
            ],
            body: constructorBody,
        });
        setupCollectionClassIndexing(ctx, classSpec, reconcilerDef);
        ret.push(classSpec);
    }
    return ret;
}
exports.genObjectCollectionClasses = genObjectCollectionClasses;
function genIndexedBindingCalls(ctx, reconcilerDef, dataStorePtr, boundObjPtr, getFieldMemberName) {
    const ret = {};
    for (const indexConfig of reconcilerDef.indexConfigs) {
        const indexMemberName = getFieldMemberName(reconcilerDef, indexConfig.indexFieldName);
        ret[indexConfig.indexFieldName] = {
            addBinding: `${dataStorePtr}.add_${indexConfig.indexFieldName}_binding(${indexMemberName}, ${boundObjPtr})`,
            removeBinding: `${dataStorePtr}.Remove${indexConfig.indexFieldName}_binding(${indexMemberName}, ${boundObjPtr})`,
        };
    }
    return ret;
}
exports.genIndexedBindingCalls = genIndexedBindingCalls;
function setupCollectionClassIndexing(ctx, classSpec, reconcilerDef) {
    const indexNotifyCreateLines = [];
    const indexNotifyUpdateLines = [];
    const indexNotifyDeleteLines = [];
    const fields = reconcilerDef.type.getStateFields();
    const readAccessor = reconcilerDef.type.getReadAccessorType(ctx.namespace, classSpec.includes);
    const localPtr = reconcilerDef.type.getLocalTypePtr(ctx.namespace, classSpec.includes);
    for (const indexConfig of reconcilerDef.indexConfigs) {
        const boundType = indexConfig.boundClassName ?? null;
        const indexFieldType = fields[indexConfig.indexFieldName].type;
        const indexFieldTypeName = indexFieldType.getLocalType(ctx.namespace, classSpec.includes);
        const indexFieldGet = (0, GenDataStoreShared_1.fieldGetterFuncName)(PythonCodeGenImpl, fields, indexConfig.indexFieldName);
        const memberName = indexConfig.boundClassName ? PythonCodeGenImpl.privateMember(`binding_${indexConfig.boundClassName}_to_${indexConfig.indexFieldName}`) : `${indexConfig.indexFieldName}_index`;
        indexNotifyCreateLines.push(`${memberName}.on_create(obj, obj.${indexFieldGet}())`);
        indexNotifyUpdateLines.push(`if (fields_changed & ${reconcilerDef.type.getFieldBitMask(indexConfig.indexFieldName)}) != 0:`, `  ${memberName}.on_update(obj, obj.${indexFieldGet}())`);
        indexNotifyDeleteLines.push(`${memberName}.on_delete(obj, obj.${indexFieldGet}())`);
        if (boundType) {
            const memberType = `${PythonDatasetLibraryTypes_1.ObjectCollectionIndexedBinding.getLocalType(ctx.namespace, classSpec.includes)}[${readAccessor}, ${localPtr}, ${indexFieldTypeName}, ${boundType}]`;
            classSpec.members.push({
                name: memberName,
                type: memberType,
                visibility: "private",
                initialValue: new TypeValue_1.CodeLiteralValue(PythonCodeGenImpl, `${memberType}()`),
            });
            classSpec.methods.push({
                name: `Add${(0, xrpa_utils_1.upperFirst)(indexConfig.indexFieldName)}Binding`,
                parameters: [{
                        name: "index_value",
                        type: indexFieldType,
                    }, {
                        name: "local_obj",
                        type: boundType,
                    }],
                body: [
                    `${memberName}.add_local_object(index_value, local_obj)`,
                ],
            });
            classSpec.methods.push({
                name: `Remove${(0, xrpa_utils_1.upperFirst)(indexConfig.indexFieldName)}Binding`,
                parameters: [{
                        name: "index_value",
                        type: indexFieldType,
                    }, {
                        name: "local_obj",
                        type: boundType,
                    }],
                body: [
                    `${memberName}.remove_local_object(index_value, local_obj)`,
                ],
            });
        }
        else {
            const memberType = `${PythonDatasetLibraryTypes_1.ObjectCollectionIndex.getLocalType(ctx.namespace, classSpec.includes)}[${readAccessor}, ${localPtr}, ${indexFieldTypeName}]`;
            classSpec.members.push({
                name: memberName,
                type: memberType,
                visibility: "public",
                initialValue: new TypeValue_1.CodeLiteralValue(PythonCodeGenImpl, `${memberType}()`),
            });
        }
    }
    if (indexNotifyCreateLines.length > 0) {
        classSpec.methods.push({
            name: "index_notify_create",
            parameters: [{
                    name: "obj",
                    type: localPtr,
                }],
            body: indexNotifyCreateLines,
            isOverride: true,
            visibility: "protected",
        });
    }
    if (indexNotifyUpdateLines.length > 0) {
        classSpec.methods.push({
            name: "index_notify_update",
            parameters: [{
                    name: "obj",
                    type: localPtr,
                }, {
                    name: "fields_changed",
                    type: PythonCodeGenImpl_1.PRIMITIVE_INTRINSICS.uint64.typename,
                }],
            body: indexNotifyUpdateLines,
            isOverride: true,
            visibility: "protected",
        });
    }
    if (indexNotifyDeleteLines.length > 0) {
        classSpec.methods.push({
            name: "index_notify_delete",
            parameters: [{
                    name: "obj",
                    type: localPtr,
                }],
            body: indexNotifyDeleteLines,
            isOverride: true,
            visibility: "protected",
        });
    }
}
//# sourceMappingURL=GenReadReconcilerDataStore.js.map
