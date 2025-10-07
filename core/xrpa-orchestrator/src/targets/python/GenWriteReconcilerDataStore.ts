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


import { filterToString, filterToStringArray, indent } from "@xrpa/xrpa-utils";

import { ClassSpec } from "../../shared/ClassSpec";
import { FieldAccessorNames, InputReconcilerDefinition, OutputReconcilerDefinition } from "../../shared/DataStore";
import { IncludeAggregator } from "../../shared/Helpers";
import { CollectionTypeDefinition, TypeDefinition, typeIsClearSet } from "../../shared/TypeDefinition";
import { CodeLiteralValue } from "../../shared/TypeValue";
import { GenDataStoreContext, genFieldProperties } from "../shared/GenDataStoreShared";
import { genSignalFieldAccessors } from "../shared/GenSignalAccessorsShared";
import { genMessageChannelDispatch, genMessageFieldAccessors } from "./GenMessageAccessors";
import { genMsgHandler } from "./GenDataStore";
import { genProcessUpdateFunctionBody } from "./GenReadReconcilerDataStore";
import { getDataStoreHeaderName, genFieldGetter, genGetCurrentClockTime, identifierName, PRIMITIVE_INTRINSICS, privateMember, genFieldChangedCheck, genEventHandlerType, genEventHandlerCall } from "./PythonCodeGenImpl";
import * as PythonCodeGenImpl from "./PythonCodeGenImpl";
import { DataStoreObject, IDataStoreObjectAccessor, TransportStreamAccessor } from "./PythonDatasetLibraryTypes";

export type FieldSetterHooks = Record<string, {
  preSet: string[];
  postSet: string[];
} | undefined>;

export function genFieldSetDirty(params: {
  ctx: GenDataStoreContext,
  includes: IncludeAggregator | null,
  typeDef: CollectionTypeDefinition,
  fieldName: string,
  fieldVar: string,
}): string[] {
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

export function genClearSetSetterFunctionBody(params: {
  ctx: GenDataStoreContext,
  includes: IncludeAggregator | null,
  fieldName: string,
  fieldType: TypeDefinition,
  fieldVar: string,
  typeDef: CollectionTypeDefinition,
  setterHooks: FieldSetterHooks,
  needsSetDirty: boolean,
}) {
  return [
    ...(params.setterHooks?.[params.fieldName]?.preSet ?? []),
    ...params.fieldType.resetLocalVarToDefault(params.ctx.namespace, params.includes, params.fieldVar, true),
    ...(params.setterHooks?.[params.fieldName]?.postSet ?? []),
    ...(params.needsSetDirty ? genFieldSetDirty(params) : []),
  ];
}

export function genClearSetClearFunctionBody(params: {
  ctx: GenDataStoreContext,
  includes: IncludeAggregator | null,
  fieldName: string,
  fieldType: TypeDefinition,
  fieldVar: string,
  typeDef: CollectionTypeDefinition,
  setterHooks: FieldSetterHooks,
  needsSetDirty: boolean,
}) {
  return [
    `${params.fieldType.declareLocalVar(params.ctx.namespace, params.includes, "clear_value")};`,
    `if ${params.fieldVar} != clear_value:`,
    ...indent(1, params.setterHooks?.[params.fieldName]?.preSet ?? []),
    `  ${params.fieldVar} = clear_value`,
    ...indent(1, params.setterHooks?.[params.fieldName]?.postSet ?? []),
    ...indent(1, params.needsSetDirty ? genFieldSetDirty(params) : []),
  ];
}

function genWriteFieldSetters(classSpec: ClassSpec, params: {
  ctx: GenDataStoreContext,
  fieldName: string,
  fieldType: TypeDefinition,
  fieldToMemberVar: (fieldName: string) => string,
  typeDef: CollectionTypeDefinition,
  fieldAccessorNameOverrides: FieldAccessorNames,
  setterHooks: FieldSetterHooks,
}): void {
  const fieldAccessorNameOverride = params.fieldAccessorNameOverrides[params.fieldName];
  const fieldVar = params.fieldToMemberVar(params.fieldName);
  const fieldType = params.fieldType;

  if (typeIsClearSet(fieldType)) {
    const overrideParams = filterToStringArray(fieldAccessorNameOverride, 2);
    const setterName = overrideParams?.[0] ?? `set_${identifierName(params.fieldName)}`;
    const clearName = overrideParams?.[1] ?? `clear_${identifierName(params.fieldName)}`;
    classSpec.methods.push({
      name: setterName,
      body: includes => genClearSetSetterFunctionBody({ ...params, includes, fieldVar, needsSetDirty: true }),
    });
    classSpec.methods.push({
      name: clearName,
      body: includes => genClearSetClearFunctionBody({ ...params, includes, fieldVar, needsSetDirty: true }),
    });
  } else {
    const setterName = filterToString(fieldAccessorNameOverride) ?? `set_${identifierName(params.fieldName)}`;
    classSpec.methods.push({
      name: setterName,
      parameters: [{
        name: params.fieldName,
        type: fieldType,
      }],
      body: includes => [
        `${fieldVar} = ${identifierName(params.fieldName)}`,
        ...genFieldSetDirty({ ...params, includes, fieldVar }),
      ],
    });
  }
}

export function genWriteFieldAccessors(classSpec: ClassSpec, params: {
  ctx: GenDataStoreContext,
  reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition,
  fieldToMemberVar: (fieldName: string) => string,
  fieldAccessorNameOverrides: FieldAccessorNames,
  directionality: "inbound" | "outbound",
  gettersOnly?: boolean,
  setterHooks?: FieldSetterHooks,
}): void {
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

    genFieldGetter(classSpec, {
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

export function genWriteFunctionBody(params: {
  ctx: GenDataStoreContext,
  includes: IncludeAggregator | null,
  reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition,
  fieldToMemberVar: (fieldName: string) => string,
  canCreate?: boolean,
}): string[] {
  const fieldUpdateLines: string[] = [];

  const writeAccessor = params.reconcilerDef.type.getWriteAccessorType(params.ctx.namespace, params.includes);

  const typeFields = params.reconcilerDef.type.getStateFields();
  for (const fieldName in typeFields) {
    if (!params.reconcilerDef.isInboundField(fieldName)) {
      const fieldVar = params.fieldToMemberVar(fieldName);
      fieldUpdateLines.push(
        `if (self._change_bits & ${params.reconcilerDef.type.getFieldBitMask(fieldName)}) != 0:`,
        `  obj_accessor.set_${identifierName(fieldName)}(${fieldVar})`,
      );
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

export function genPrepFullUpdateFunctionBody(params: {
  ctx: GenDataStoreContext,
  includes: IncludeAggregator | null,
  reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition,
  fieldToMemberVar: (fieldName: string) => string,
  canCreate?: boolean,
}): string[] {
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

export function defaultFieldToMemberVar(fieldName: string) {
  return "self." + privateMember(`local_${identifierName(fieldName)}`);
}

export function genChangeHandlerMethods(classSpec: ClassSpec, isInboundType: boolean) {
  const fieldsChangedHandlerType = genEventHandlerType([PRIMITIVE_INTRINSICS.uint64.typename], classSpec.includes);
  classSpec.methods.push({
    name: "handle_xrpa_fields_changed",
    parameters: [{
      name: "fields_changed",
      type: PRIMITIVE_INTRINSICS.uint64.typename,
    }],
    body: [genEventHandlerCall("self._xrpa_fields_changed_handler", ["fields_changed"], true)],
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
    initialValue: new CodeLiteralValue(PythonCodeGenImpl, "None"),
    visibility: "private",
  });

  if (isInboundType) {
    const deleteHandlerType = genEventHandlerType([], classSpec.includes);
    classSpec.methods.push({
      name: "handle_xrpa_delete",
      body: [genEventHandlerCall("self._xrpa_delete_handler", [], true)],
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
      initialValue: new CodeLiteralValue(PythonCodeGenImpl, "None"),
      visibility: "private",
    });
  }
}

export function genOutboundReconciledTypes(
  ctx: GenDataStoreContext,
  includesIn: IncludeAggregator | null,
): ClassSpec[] {
  const ret: ClassSpec[] = [];

  const headerFile = getDataStoreHeaderName(ctx.storeDef.apiname);

  for (const reconcilerDef of ctx.storeDef.getOutputReconcilers()) {
    const typeDef = reconcilerDef.type;
    if (typeDef.getLocalHeaderFile() !== headerFile) {
      continue;
    }

    const readAccessor = typeDef.getReadAccessorType(ctx.namespace, includesIn);

    const classSpec = new ClassSpec({
      name: typeDef.getLocalType(ctx.namespace, null),
      superClass: typeDef.interfaceType ? typeDef.interfaceType.getLocalType(ctx.namespace, includesIn) : DataStoreObject.getLocalType(ctx.namespace, includesIn),
      interfaceName: `${IDataStoreObjectAccessor.getLocalType(ctx.namespace, includesIn)}[${readAccessor}]`,
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
        ["_create_timestamp", genGetCurrentClockTime(includesIn)],
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
        type: TransportStreamAccessor,
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
        type: PRIMITIVE_INTRINSICS.uint64.typename,
      }],
      body: includes => genProcessUpdateFunctionBody(ctx, includes, typeDef, reconcilerDef),
    });

    genWriteFieldAccessors(classSpec, {
      ctx,
      reconcilerDef,
      fieldToMemberVar: defaultFieldToMemberVar,
      fieldAccessorNameOverrides: {},
      gettersOnly: true,
      directionality: "inbound",
    });

    genFieldProperties(classSpec, {
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
      genFieldChangedCheck(classSpec, { parentType: typeDef, fieldName: name });
    }

    genMessageFieldAccessors(classSpec, {
      reconcilerDef,
      genMsgHandler,
    });

    genSignalFieldAccessors(classSpec, {
      codegen: PythonCodeGenImpl,
      reconcilerDef,
      proxyObj: null,
    });

    genMessageChannelDispatch(classSpec, {
      reconcilerDef,
      genMsgHandler,
      msgDataToParams: () => ["message"],
    });

    genFieldProperties(classSpec, {
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
