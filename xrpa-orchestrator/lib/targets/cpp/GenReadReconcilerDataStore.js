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
exports.genIndexedBindingCalls = exports.genObjectCollectionClasses = exports.genInboundReconciledTypes = exports.genProcessUpdateFunctionBodyForConcreteReconciledType = void 0;
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const ClassSpec_1 = require("../../shared/ClassSpec");
const DataStore_1 = require("../../shared/DataStore");
const TypeValue_1 = require("../../shared/TypeValue");
const GenDataStoreShared_1 = require("../shared/GenDataStoreShared");
const CppCodeGenImpl_1 = require("./CppCodeGenImpl");
const CppCodeGenImpl = __importStar(require("./CppCodeGenImpl"));
const CppDatasetLibraryTypes_1 = require("./CppDatasetLibraryTypes");
const GenDataStore_1 = require("./GenDataStore");
const GenMessageAccessors_1 = require("./GenMessageAccessors");
const GenSignalAccessors_1 = require("./GenSignalAccessors");
const GenWriteReconcilerDataStore_1 = require("./GenWriteReconcilerDataStore");
function genProcessUpdateFunctionBodyForConcreteReconciledType(ctx, includes, typeDef, reconcilerDef) {
    const lines = [];
    const typeFields = typeDef.getStateFields();
    for (const fieldName in typeFields) {
        // inbound fields only
        if (!reconcilerDef.isInboundField(fieldName)) {
            continue;
        }
        const checkName = `check${(0, xrpa_utils_1.upperFirst)(fieldName)}Changed`;
        const funcName = (0, GenDataStoreShared_1.fieldGetterFuncName)(CppCodeGenImpl, typeFields, fieldName);
        lines.push(`if (value.${checkName}(fieldsChanged)) {`, `  ${(0, GenWriteReconcilerDataStore_1.defaultFieldToMemberVar)(fieldName)} = value.${funcName}();`, `}`);
    }
    return lines;
}
exports.genProcessUpdateFunctionBodyForConcreteReconciledType = genProcessUpdateFunctionBodyForConcreteReconciledType;
function genInboundReconciledTypes(ctx, includesIn) {
    const ret = [];
    const headerFile = (0, CppCodeGenImpl_1.getDataStoreHeaderName)(ctx.storeDef.apiname);
    for (const reconcilerDef of ctx.storeDef.getInputReconcilers()) {
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
                    type: ctx.moduleDef.ObjectUuid,
                }, {
                    name: "collection",
                    type: CppDatasetLibraryTypes_1.IObjectCollection.getLocalType(ctx.namespace, classSpec.includes) + "*",
                }],
            superClassInitializers: ["id", "collection"],
        });
        classSpec.virtualDestructor = true;
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
            canSetDirty: reconcilerDef.shouldGenerateConcreteReconciledType(),
            directionality: "outbound",
            visibility: "private",
        });
        const localPtr = typeDef.getLocalTypePtr(ctx.namespace, classSpec.includes);
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
                body: includes => genProcessUpdateFunctionBodyForConcreteReconciledType(ctx, includes, typeDef, reconcilerDef),
                isVirtual: true,
                isFinal: true,
            });
            classSpec.methods.push({
                name: "create",
                returnType: localPtr,
                parameters: [{
                        name: "id",
                        type: ctx.moduleDef.ObjectUuid,
                    }, {
                        name: "obj",
                        type: readAccessor,
                    }, {
                        name: "collection",
                        type: CppDatasetLibraryTypes_1.IObjectCollection.getLocalType(ctx.namespace, classSpec.includes) + "*",
                    }],
                body: [
                    `return std::make_shared<${classSpec.name}>(id, collection);`,
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
            // the "check<FieldName>Changed" functions are here for index binding
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
                        type: readAccessor,
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
                    type: CppDatasetLibraryTypes_1.TransportStreamAccessor.getLocalType(ctx.namespace, classSpec.includes) + "*",
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
        classSpec.methods.push({
            name: "prepDSFullUpdate",
            returnType: CppCodeGenImpl.PRIMITIVE_INTRINSICS.uint64.typename,
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
        const superClass = `${CppDatasetLibraryTypes_1.ObjectCollection.getLocalType(ctx.namespace, includesIn)}<${readAccessor}, ${localPtr}>`;
        const classSpec = new ClassSpec_1.ClassSpec({
            name: isLocalOwned ? (0, GenDataStoreShared_1.getOutboundCollectionClassName)(ctx, typeDef) : (0, GenDataStoreShared_1.getInboundCollectionClassName)(ctx, typeDef),
            superClass,
            namespace: ctx.namespace,
            includes: includesIn,
        });
        const constructorBody = [];
        // inbound (remotely created) objects are created by the reconciler, so we need to give it a delegate functions
        if (reconcilerDef instanceof DataStore_1.InputReconcilerDefinition) {
            if (reconcilerDef.shouldGenerateConcreteReconciledType()) {
                const reconciledTypeName = typeDef.getLocalType(ctx.namespace, null);
                constructorBody.push(`setCreateDelegateInternal(${reconciledTypeName}::create);`);
            }
            else {
                // the class we generate is not concrete, so the user needs to set the delegate
                classSpec.methods.push({
                    name: "setCreateDelegate",
                    parameters: [{
                            name: "createDelegate",
                            type: `${superClass}::CreateDelegateFunction`,
                        }],
                    body: ["setCreateDelegateInternal(std::move(createDelegate));"],
                });
            }
        }
        else {
            // expose addObject and removeObject to the user
            classSpec.methods.push({
                name: "addObject",
                parameters: [{
                        name: "obj",
                        type: localPtr,
                    }],
                body: ["addObjectInternal(obj);"],
            });
            classSpec.methods.push({
                name: "removeObject",
                parameters: [{
                        name: "id",
                        type: ctx.moduleDef.ObjectUuid,
                    }],
                body: ["removeObjectInternal(id);"],
            });
        }
        classSpec.constructors.push({
            parameters: [{
                    name: "reconciler",
                    type: CppDatasetLibraryTypes_1.DataStoreReconciler.getLocalType(ctx.namespace, classSpec.includes) + "*",
                }],
            superClassInitializers: [
                "reconciler",
                `${typeDef.getCollectionId()}`,
                `${inboundFieldMask}`,
                `${indexedFieldMask}`,
                `${isLocalOwned}`,
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
            addBinding: `${dataStorePtr}->add${(0, xrpa_utils_1.upperFirst)(indexConfig.indexFieldName)}Binding(${indexMemberName}, ${boundObjPtr});`,
            removeBinding: `${dataStorePtr}->remove${(0, xrpa_utils_1.upperFirst)(indexConfig.indexFieldName)}Binding(${indexMemberName}, ${boundObjPtr});`,
        };
    }
    return ret;
}
exports.genIndexedBindingCalls = genIndexedBindingCalls;
function setupCollectionClassIndexing(ctx, classSpec, reconcilerDef) {
    const bindingTickLines = [];
    const bindingWriteChangesLines = [];
    const bindingProcessMessageLines = [];
    const indexNotifyCreateLines = [];
    const indexNotifyUpdateLines = [];
    const indexNotifyDeleteLines = [];
    const fields = reconcilerDef.type.getStateFields();
    const localPtr = reconcilerDef.type.getLocalTypePtr(ctx.namespace, classSpec.includes);
    for (const indexConfig of reconcilerDef.indexConfigs) {
        const boundType = indexConfig.boundClassName ? `${indexConfig.boundClassName}*` : null;
        const indexFieldType = fields[indexConfig.indexFieldName].type;
        const indexFieldTypeName = indexFieldType.getLocalType(ctx.namespace, classSpec.includes);
        const indexFieldGet = (0, GenDataStoreShared_1.fieldGetterFuncName)(CppCodeGenImpl, fields, indexConfig.indexFieldName);
        const memberName = indexConfig.boundClassName ? CppCodeGenImpl.privateMember(`binding${indexConfig.boundClassName}To${(0, xrpa_utils_1.upperFirst)(indexConfig.indexFieldName)}`) : `${(0, xrpa_utils_1.upperFirst)(indexConfig.indexFieldName)}Index`;
        indexNotifyCreateLines.push(`${memberName}.onCreate(obj, obj->${indexFieldGet}());`);
        indexNotifyUpdateLines.push(`if (fieldsChanged & ${reconcilerDef.type.getFieldBitMask(indexConfig.indexFieldName)}) {`, `  ${memberName}.onUpdate(obj, obj->${indexFieldGet}());`, `}`);
        indexNotifyDeleteLines.push(`${memberName}.onDelete(obj, obj->${indexFieldGet}());`);
        if (boundType) {
            const indexBindingType = `${CppDatasetLibraryTypes_1.ObjectCollectionIndexedBinding.getLocalType(ctx.namespace, classSpec.includes)}<${localPtr}, ${indexFieldTypeName}, ${boundType}>`;
            classSpec.members.push({
                name: memberName,
                type: indexBindingType,
                visibility: "private",
                initialValue: new TypeValue_1.CodeLiteralValue(CppCodeGenImpl, `${indexBindingType}{${reconcilerDef.getInboundChangeBits()}}`),
            });
            classSpec.methods.push({
                name: `add${(0, xrpa_utils_1.upperFirst)(indexConfig.indexFieldName)}Binding`,
                parameters: [{
                        name: "indexValue",
                        type: indexFieldType,
                    }, {
                        name: "localObj",
                        type: boundType,
                    }],
                body: [
                    `${memberName}.addLocalObject(indexValue, localObj);`,
                ],
            });
            classSpec.methods.push({
                name: `remove${(0, xrpa_utils_1.upperFirst)(indexConfig.indexFieldName)}Binding`,
                parameters: [{
                        name: "indexValue",
                        type: indexFieldType,
                    }, {
                        name: "localObj",
                        type: boundType,
                    }],
                body: [
                    `${memberName}.removeLocalObject(indexValue, localObj);`,
                ],
            });
            bindingTickLines.push(`${memberName}.tick();`);
            bindingWriteChangesLines.push(`${memberName}.writeChanges(id);`);
            bindingProcessMessageLines.push(`${memberName}.processMessage(id, messageType, timestamp, msgAccessor);`);
            indexNotifyUpdateLines.push(`${memberName}.processUpdate(obj->getXrpaId(), fieldsChanged);`);
        }
        else {
            classSpec.members.push({
                name: memberName,
                type: `${CppDatasetLibraryTypes_1.ObjectCollectionIndex.getLocalType(ctx.namespace, classSpec.includes)}<${localPtr}, ${indexFieldTypeName}>`,
                visibility: "public",
            });
        }
    }
    if (bindingTickLines.length > 0) {
        classSpec.methods.push({
            name: "bindingTick",
            body: bindingTickLines,
            isOverride: true,
            visibility: "protected",
        });
    }
    if (bindingWriteChangesLines.length > 0) {
        classSpec.methods.push({
            name: "bindingWriteChanges",
            parameters: [{
                    name: "id",
                    type: ctx.moduleDef.ObjectUuid,
                }],
            body: bindingWriteChangesLines,
            isOverride: true,
            visibility: "protected",
        });
    }
    if (bindingProcessMessageLines.length > 0) {
        classSpec.methods.push({
            name: "bindingProcessMessage",
            parameters: [{
                    name: "id",
                    type: ctx.moduleDef.ObjectUuid,
                }, {
                    name: "messageType",
                    type: CppCodeGenImpl_1.PRIMITIVE_INTRINSICS.int32.typename,
                }, {
                    name: "timestamp",
                    type: CppCodeGenImpl_1.PRIMITIVE_INTRINSICS.int32.typename,
                }, {
                    name: "msgAccessor",
                    type: CppDatasetLibraryTypes_1.MemoryAccessor,
                }],
            body: bindingProcessMessageLines,
            isOverride: true,
            visibility: "protected",
        });
    }
    if (indexNotifyCreateLines.length > 0) {
        classSpec.methods.push({
            name: "indexNotifyCreate",
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
            name: "indexNotifyUpdate",
            parameters: [{
                    name: "obj",
                    type: localPtr,
                }, {
                    name: "fieldsChanged",
                    type: CppCodeGenImpl_1.PRIMITIVE_INTRINSICS.uint64.typename,
                }],
            body: indexNotifyUpdateLines,
            isOverride: true,
            visibility: "protected",
        });
    }
    if (indexNotifyDeleteLines.length > 0) {
        classSpec.methods.push({
            name: "indexNotifyDelete",
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
