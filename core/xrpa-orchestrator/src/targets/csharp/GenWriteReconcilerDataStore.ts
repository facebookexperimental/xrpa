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


import { filterToString, filterToStringArray, indent, upperFirst } from "@xrpa/xrpa-utils";

import { ClassSpec } from "../../shared/ClassSpec";
import { FieldAccessorNames, InputReconcilerDefinition, OutputReconcilerDefinition } from "../../shared/DataStore";
import { IncludeAggregator } from "../../shared/Helpers";
import { CollectionTypeDefinition, TypeDefinition, typeIsClearSet } from "../../shared/TypeDefinition";
import { getDataStoreHeaderName, genFieldGetter, genGetCurrentClockTime, PRIMITIVE_INTRINSICS, privateMember, genFieldChangedCheck, genEventHandlerType, genEventHandlerCall } from "./CsharpCodeGenImpl";
import * as CsharpCodeGenImpl from "./CsharpCodeGenImpl";
import { DataStoreObject, IDataStoreObjectAccessor, TransportStreamAccessor } from "./CsharpDatasetLibraryTypes";
import { GenDataStoreContext, genFieldProperties } from "../shared/GenDataStoreShared";
import { genSignalFieldAccessors } from "../shared/GenSignalAccessorsShared";
import { genMessageChannelDispatch, genMessageFieldAccessors } from "./GenMessageAccessors";
import { genMsgHandler } from "./GenDataStore";
import { genProcessUpdateFunctionBody } from "./GenReadReconcilerDataStore";
import { CodeLiteralValue } from "../../shared/TypeValue";

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
    `if ((_changeBits & ${changeBit}) == 0) {`,
    `  _changeBits |= ${changeBit};`,
    `  _changeByteCount += ${fieldSize[0]};`,
    `}`,
    ...(fieldSize[1] === null ? [] : [
      // TODO if the field is set more than once, we will count the dynamic size multiple times
      `_changeByteCount += ${fieldSize[1]};`,
    ]),
    `if (_collection != null) {`,
    `  if (!_hasNotifiedNeedsWrite)`,
    `  {`,
    `    _collection.NotifyObjectNeedsWrite(GetXrpaId());`,
    `    _hasNotifiedNeedsWrite = true;`,
    `  }`,
    `  _collection.SetDirty(GetXrpaId(), ${changeBit});`,
    `}`,
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
    `${params.fieldType.declareLocalVar(params.ctx.namespace, params.includes, "clearValue")};`,
    `if (${params.fieldVar} != clearValue) {`,
    ...indent(1, params.setterHooks?.[params.fieldName]?.preSet ?? []),
    `  ${params.fieldVar} = clearValue;`,
    ...indent(1, params.setterHooks?.[params.fieldName]?.postSet ?? []),
    ...indent(1, params.needsSetDirty ? genFieldSetDirty(params) : []),
    `}`,
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
  const pascalFieldName = upperFirst(params.fieldName);
  const fieldAccessorNameOverride = params.fieldAccessorNameOverrides[params.fieldName];
  const fieldVar = params.fieldToMemberVar(params.fieldName);
  const fieldType = params.fieldType;

  if (typeIsClearSet(fieldType)) {
    const overrideParams = filterToStringArray(fieldAccessorNameOverride, 2);
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
  } else {
    const setterName = filterToString(fieldAccessorNameOverride) ?? `Set${pascalFieldName}`;
    classSpec.methods.push({
      name: setterName,
      parameters: [{
        name: params.fieldName,
        type: fieldType,
      }],
      body: includes => [
        `${fieldVar} = ${params.fieldName};`,
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
    const pascalFieldName = upperFirst(fieldName);
    if (!params.reconcilerDef.isInboundField(fieldName)) {
      const fieldVar = params.fieldToMemberVar(fieldName);
      fieldUpdateLines.push(
        `if ((_changeBits & ${params.reconcilerDef.type.getFieldBitMask(fieldName)}) != 0) {`,
        `  objAccessor.Set${pascalFieldName}(${fieldVar});`,
        `}`,
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
      `${writeAccessor} objAccessor = new();`,
      `if (!_createWritten) {`,
      `  _changeBits = ${params.reconcilerDef.getOutboundChangeBits()};`,
      `  _changeByteCount = ${outboundChangeBytes};`,
      `  objAccessor = ${writeAccessor}.Create(accessor, GetCollectionId(), GetXrpaId(), _changeByteCount, _createTimestamp);`,
      `  _createWritten = true;`,
      `} else if (_changeBits != 0) {`,
      `  objAccessor = ${writeAccessor}.Update(accessor, GetCollectionId(), GetXrpaId(), _changeBits, _changeByteCount);`,
      `}`,
    ] : [
      `if (_changeBits == 0) {`,
      `  return;`,
      `}`,
      `var objAccessor = ${writeAccessor}.Update(accessor, GetCollectionId(), GetXrpaId(), _changeBits, _changeByteCount);`,
    ]),
    `if (objAccessor.IsNull()) {`,
    `  return;`,
    `}`,
    ...fieldUpdateLines,
    `_changeBits = 0;`,
    `_changeByteCount = 0;`,
    `_hasNotifiedNeedsWrite = false;`,
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
    return ["return 0;"];
  }

  const outboundChangeBytes = params.reconcilerDef.getOutboundChangeByteCount({
    inNamespace: params.ctx.namespace,
    includes: params.includes,
    fieldToMemberVar: params.fieldToMemberVar,
  });

  return [
    ...(params.canCreate ? [
      `_createWritten = false;`,
    ] : []),
    `_changeBits = ${outboundChangeBits};`,
    `_changeByteCount = ${outboundChangeBytes};`,
    ...(params.canCreate ? [
      `return _createTimestamp;`,
    ] : [
      `return 1;`,
    ]),
  ];
}

export function defaultFieldToMemberVar(fieldName: string) {
  return privateMember(`local${upperFirst(fieldName)}`);
}

export function genChangeHandlerMethods(classSpec: ClassSpec, isInboundType: boolean) {
  const fieldsChangedHandlerType = genEventHandlerType([PRIMITIVE_INTRINSICS.uint64.typename], classSpec.includes);
  classSpec.methods.push({
    name: "HandleXrpaFieldsChanged",
    parameters: [{
      name: "fieldsChanged",
      type: PRIMITIVE_INTRINSICS.uint64.typename,
    }],
    body: [genEventHandlerCall("_xrpaFieldsChangedHandler", ["fieldsChanged"], true)],
    isVirtual: true,
    visibility: "protected",
  });
  classSpec.methods.push({
    name: "OnXrpaFieldsChanged",
    parameters: [{
      name: "handler",
      type: fieldsChangedHandlerType,
    }],
    body: [
      `_xrpaFieldsChangedHandler = handler;`,
    ],
  });
  classSpec.members.push({
    name: "xrpaFieldsChangedHandler",
    type: fieldsChangedHandlerType,
    initialValue: new CodeLiteralValue(CsharpCodeGenImpl, "null"),
    visibility: "private",
  });

  if (isInboundType) {
    const deleteHandlerType = genEventHandlerType([], classSpec.includes);
    classSpec.methods.push({
      name: "handleXrpaDelete",
      body: [genEventHandlerCall("_xrpaDeleteHandler", [], true)],
      isVirtual: true,
    });
    classSpec.methods.push({
      name: "OnXrpaDelete",
      parameters: [{
        name: "handler",
        type: deleteHandlerType,
      }],
      body: [
        `_xrpaDeleteHandler = handler;`,
      ],
    });
    classSpec.members.push({
      name: "xrpaDeleteHandler",
      type: deleteHandlerType,
      initialValue: new CodeLiteralValue(CsharpCodeGenImpl, "null"),
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
      interfaceName: `${IDataStoreObjectAccessor.getLocalType(ctx.namespace, includesIn)}<${readAccessor}>`,
      namespace: ctx.namespace,
      includes: includesIn,
    });

    genChangeHandlerMethods(classSpec, false);

    classSpec.constructors.push({
      parameters: [{
        name: "id",
        type: ctx.moduleDef.ObjectUuid,
      }],
      superClassInitializers: ["id", "null"],
      memberInitializers: [
        ["_createTimestamp", genGetCurrentClockTime(classSpec.includes)],
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
      name: "WriteDSChanges",
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
      name: "PrepDSFullUpdate",
      returnType: CsharpCodeGenImpl.PRIMITIVE_INTRINSICS.uint64.typename,
      body: includes => genPrepFullUpdateFunctionBody({
        ctx,
        includes,
        reconcilerDef,
        fieldToMemberVar: defaultFieldToMemberVar,
        canCreate: true,
      }),
    });

    classSpec.methods.push({
      name: "ProcessDSUpdate",
      parameters: [{
        name: "value",
        type: readAccessor,
      }, {
        name: "fieldsChanged",
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
      codegen: CsharpCodeGenImpl,
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
      codegen: CsharpCodeGenImpl,
      reconcilerDef,
      proxyObj: null,
    });

    genMessageChannelDispatch(classSpec, {
      reconcilerDef,
      genMsgHandler,
      msgDataToParams: () => ["message"],
    });

    genFieldProperties(classSpec, {
      codegen: CsharpCodeGenImpl,
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
