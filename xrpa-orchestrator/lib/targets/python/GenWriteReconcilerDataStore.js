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
exports.genOutboundReconciledTypes = exports.genChangeHandlerMethods = exports.defaultFieldToMemberVar = exports.genPrepFullUpdateFunctionBody = exports.genWriteFunctionBody = exports.genWriteFieldAccessors = exports.genClearSetClearFunctionBody = exports.genClearSetSetterFunctionBody = exports.genFieldSetDirty = void 0;
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const ClassSpec_1 = require("../../shared/ClassSpec");
const TypeDefinition_1 = require("../../shared/TypeDefinition");
const TypeValue_1 = require("../../shared/TypeValue");
const GenDataStoreShared_1 = require("../shared/GenDataStoreShared");
const GenSignalAccessorsShared_1 = require("../shared/GenSignalAccessorsShared");
const GenMessageAccessors_1 = require("./GenMessageAccessors");
const GenDataStore_1 = require("./GenDataStore");
const GenReadReconcilerDataStore_1 = require("./GenReadReconcilerDataStore");
const PythonCodeGenImpl_1 = require("./PythonCodeGenImpl");
const PythonCodeGenImpl = __importStar(require("./PythonCodeGenImpl"));
const PythonDatasetLibraryTypes_1 = require("./PythonDatasetLibraryTypes");
function genFieldSetDirty(params) {
    const changeBit = params.typeDef.getFieldBitMask(params.fieldName);
    const fieldSize = params.typeDef.getStateField(params.fieldName).getRuntimeByteCount(params.fieldVar, params.ctx.namespace, params.includes);
    return [
        `if (self._change_bits & ${changeBit}) == 0:`,
        `  self._change_bits |= ${changeBit}`,
        `  self._change_byte_count += ${fieldSize[0]}`,
        ...(fieldSize[1] === null ? [] : [
            // TODO if the field is set more than once, we will count the dynamic size multiple times
            `self._change_byte_count += ${fieldSize[1]}`,
        ]),
        `if self._collection is not None:`,
        `  if not self._has_notified_needs_write:`,
        `    self._collection.notify_object_needs_write(self.get_xrpa_id())`,
        `    self._has_notified_needs_write = True`,
        `  self._collection.set_dirty(self.get_xrpa_id(), ${changeBit})`,
    ];
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
        `${params.fieldType.declareLocalVar(params.ctx.namespace, params.includes, "clear_value")};`,
        `if ${params.fieldVar} != clear_value:`,
        ...(0, xrpa_utils_1.indent)(1, params.setterHooks?.[params.fieldName]?.preSet ?? []),
        `  ${params.fieldVar} = clear_value`,
        ...(0, xrpa_utils_1.indent)(1, params.setterHooks?.[params.fieldName]?.postSet ?? []),
        ...(0, xrpa_utils_1.indent)(1, params.needsSetDirty ? genFieldSetDirty(params) : []),
    ];
}
exports.genClearSetClearFunctionBody = genClearSetClearFunctionBody;
function genWriteFieldSetters(classSpec, params) {
    const fieldAccessorNameOverride = params.fieldAccessorNameOverrides[params.fieldName];
    const fieldVar = params.fieldToMemberVar(params.fieldName);
    const fieldType = params.fieldType;
    if ((0, TypeDefinition_1.typeIsClearSet)(fieldType)) {
        const overrideParams = (0, xrpa_utils_1.filterToStringArray)(fieldAccessorNameOverride, 2);
        const setterName = overrideParams?.[0] ?? `set_${(0, PythonCodeGenImpl_1.identifierName)(params.fieldName)}`;
        const clearName = overrideParams?.[1] ?? `clear_${(0, PythonCodeGenImpl_1.identifierName)(params.fieldName)}`;
        classSpec.methods.push({
            name: setterName,
            body: includes => genClearSetSetterFunctionBody({ ...params, includes, fieldVar, needsSetDirty: true }),
        });
        classSpec.methods.push({
            name: clearName,
            body: includes => genClearSetClearFunctionBody({ ...params, includes, fieldVar, needsSetDirty: true }),
        });
    }
    else {
        const setterName = (0, xrpa_utils_1.filterToString)(fieldAccessorNameOverride) ?? `set_${(0, PythonCodeGenImpl_1.identifierName)(params.fieldName)}`;
        classSpec.methods.push({
            name: setterName,
            parameters: [{
                    name: params.fieldName,
                    type: fieldType,
                }],
            body: includes => [
                `${fieldVar} = ${(0, PythonCodeGenImpl_1.identifierName)(params.fieldName)}`,
                ...genFieldSetDirty({ ...params, includes, fieldVar }),
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
        (0, PythonCodeGenImpl_1.genFieldGetter)(classSpec, {
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
    const fieldUpdateLines = [];
    const writeAccessor = params.reconcilerDef.type.getWriteAccessorType(params.ctx.namespace, params.includes);
    const typeFields = params.reconcilerDef.type.getStateFields();
    for (const fieldName in typeFields) {
        if (!params.reconcilerDef.isInboundField(fieldName)) {
            const fieldVar = params.fieldToMemberVar(fieldName);
            fieldUpdateLines.push(`if (self._change_bits & ${params.reconcilerDef.type.getFieldBitMask(fieldName)}) != 0:`, `  obj_accessor.set_${(0, PythonCodeGenImpl_1.identifierName)(fieldName)}(${fieldVar})`);
        }
    }
    if (!params.canCreate && !fieldUpdateLines.length) {
        // this is an inbound object (canCreate===false) but no fields are being updated, so there is nothing to do
        return [];
    }
    const outboundChangeBytes = params.reconcilerDef.getOutboundChangeByteCount({
        inNamespace: params.ctx.namespace,
        includes: params.includes,
        fieldToMemberVar: params.fieldToMemberVar,
    });
    return [
        ...(params.canCreate ? [
            `obj_accessor = None`,
            `if not self._create_written:`,
            `  self._change_bits = ${params.reconcilerDef.getOutboundChangeBits()}`,
            `  self._change_byte_count = ${outboundChangeBytes}`,
            `  obj_accessor = ${writeAccessor}.create(accessor, self.get_collection_id(), self.get_xrpa_id(), self._change_byte_count, self._create_timestamp)`,
            `  self._create_written = True`,
            `elif self._change_bits != 0:`,
            `  obj_accessor = ${writeAccessor}.update(accessor, self.get_collection_id(), self.get_xrpa_id(), self._change_bits, self._change_byte_count)`,
        ] : [
            `if self._change_bits == 0:`,
            `  return`,
            `obj_accessor = ${writeAccessor}.update(accessor, self.get_collection_id(), self.get_xrpa_id(), self._change_bits, self._change_byte_count)`,
        ]),
        `if obj_accessor is None or obj_accessor.is_null():`,
        `  return`,
        ...fieldUpdateLines,
        `self._change_bits = 0`,
        `self._change_byte_count = 0`,
        `self._has_notified_needs_write = False`,
    ];
}
exports.genWriteFunctionBody = genWriteFunctionBody;
function genPrepFullUpdateFunctionBody(params) {
    const outboundChangeBits = params.reconcilerDef.getOutboundChangeBits();
    if (!outboundChangeBits && !params.canCreate) {
        return ["return 0"];
    }
    const outboundChangeBytes = params.reconcilerDef.getOutboundChangeByteCount({
        inNamespace: params.ctx.namespace,
        includes: params.includes,
        fieldToMemberVar: params.fieldToMemberVar,
    });
    return [
        ...(params.canCreate ? [
            `self._create_written = False`,
        ] : []),
        `self._change_bits = ${outboundChangeBits}`,
        `self._change_byte_count = ${outboundChangeBytes}`,
        ...(params.canCreate ? [
            `return self._create_timestamp`,
        ] : [
            `return 1`,
        ]),
    ];
}
exports.genPrepFullUpdateFunctionBody = genPrepFullUpdateFunctionBody;
function defaultFieldToMemberVar(fieldName) {
    return "self." + (0, PythonCodeGenImpl_1.privateMember)(`local_${(0, PythonCodeGenImpl_1.identifierName)(fieldName)}`);
}
exports.defaultFieldToMemberVar = defaultFieldToMemberVar;
function genChangeHandlerMethods(classSpec, isInboundType) {
    const fieldsChangedHandlerType = (0, PythonCodeGenImpl_1.genEventHandlerType)([PythonCodeGenImpl_1.PRIMITIVE_INTRINSICS.uint64.typename], classSpec.includes);
    classSpec.methods.push({
        name: "handle_xrpa_fields_changed",
        parameters: [{
                name: "fields_changed",
                type: PythonCodeGenImpl_1.PRIMITIVE_INTRINSICS.uint64.typename,
            }],
        body: [(0, PythonCodeGenImpl_1.genEventHandlerCall)("self._xrpa_fields_changed_handler", ["fields_changed"], true)],
        isVirtual: true,
        visibility: "protected",
    });
    classSpec.methods.push({
        name: "on_xrpa_fields_changed",
        parameters: [{
                name: "handler",
                type: fieldsChangedHandlerType,
            }],
        body: [
            `self._xrpa_fields_changed_handler = handler`,
        ],
    });
    classSpec.members.push({
        name: "xrpa_fields_changed_handler",
        type: fieldsChangedHandlerType,
        initialValue: new TypeValue_1.CodeLiteralValue(PythonCodeGenImpl, "None"),
        visibility: "private",
    });
    if (isInboundType) {
        const deleteHandlerType = (0, PythonCodeGenImpl_1.genEventHandlerType)([], classSpec.includes);
        classSpec.methods.push({
            name: "handle_xrpa_delete",
            body: [(0, PythonCodeGenImpl_1.genEventHandlerCall)("self._xrpa_delete_handler", [], true)],
            isVirtual: true,
        });
        classSpec.methods.push({
            name: "on_xrpa_delete",
            parameters: [{
                    name: "handler",
                    type: deleteHandlerType,
                }],
            body: [
                `self._xrpa_delete_handler = handler`,
            ],
        });
        classSpec.members.push({
            name: "xrpa_delete_handler",
            type: deleteHandlerType,
            initialValue: new TypeValue_1.CodeLiteralValue(PythonCodeGenImpl, "None"),
            visibility: "private",
        });
    }
}
exports.genChangeHandlerMethods = genChangeHandlerMethods;
function genOutboundReconciledTypes(ctx, includesIn) {
    const ret = [];
    const headerFile = (0, PythonCodeGenImpl_1.getDataStoreHeaderName)(ctx.storeDef.apiname);
    for (const reconcilerDef of ctx.storeDef.getOutputReconcilers()) {
        const typeDef = reconcilerDef.type;
        if (typeDef.getLocalHeaderFile() !== headerFile) {
            continue;
        }
        const readAccessor = typeDef.getReadAccessorType(ctx.namespace, includesIn);
        const classSpec = new ClassSpec_1.ClassSpec({
            name: typeDef.getLocalType(ctx.namespace, null),
            superClass: typeDef.interfaceType ? typeDef.interfaceType.getLocalType(ctx.namespace, includesIn) : PythonDatasetLibraryTypes_1.DataStoreObject.getLocalType(ctx.namespace, includesIn),
            interfaceName: `${PythonDatasetLibraryTypes_1.IDataStoreObjectAccessor.getLocalType(ctx.namespace, includesIn)}[${readAccessor}]`,
            namespace: ctx.namespace,
            includes: includesIn,
        });
        genChangeHandlerMethods(classSpec, false);
        classSpec.constructors.push({
            parameters: [{
                    name: "id",
                    type: ctx.moduleDef.ObjectUuid,
                }],
            superClassInitializers: ["id", "None"],
            memberInitializers: [
                ["_create_timestamp", (0, PythonCodeGenImpl_1.genGetCurrentClockTime)(includesIn)],
            ],
            body: [],
        });
        genWriteFieldAccessors(classSpec, {
            ctx,
            reconcilerDef,
            fieldToMemberVar: defaultFieldToMemberVar,
            fieldAccessorNameOverrides: reconcilerDef.fieldAccessorNameOverrides,
            directionality: "outbound",
        });
        classSpec.methods.push({
            name: "write_ds_changes",
            parameters: [{
                    name: "accessor",
                    type: PythonDatasetLibraryTypes_1.TransportStreamAccessor,
                }],
            body: includes => genWriteFunctionBody({
                ctx,
                includes,
                reconcilerDef,
                fieldToMemberVar: defaultFieldToMemberVar,
                canCreate: true,
            }),
        });
        classSpec.methods.push({
            name: "prep_ds_full_update",
            returnType: PythonCodeGenImpl.PRIMITIVE_INTRINSICS.uint64.typename,
            body: includes => genPrepFullUpdateFunctionBody({
                ctx,
                includes,
                reconcilerDef,
                fieldToMemberVar: defaultFieldToMemberVar,
                canCreate: true,
            }),
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
            body: includes => (0, GenReadReconcilerDataStore_1.genProcessUpdateFunctionBody)(ctx, includes, typeDef, reconcilerDef),
        });
        genWriteFieldAccessors(classSpec, {
            ctx,
            reconcilerDef,
            fieldToMemberVar: defaultFieldToMemberVar,
            fieldAccessorNameOverrides: {},
            gettersOnly: true,
            directionality: "inbound",
        });
        (0, GenDataStoreShared_1.genFieldProperties)(classSpec, {
            codegen: PythonCodeGenImpl,
            reconcilerDef,
            fieldToMemberVar: defaultFieldToMemberVar,
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
        (0, GenDataStoreShared_1.genFieldProperties)(classSpec, {
            codegen: PythonCodeGenImpl,
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
