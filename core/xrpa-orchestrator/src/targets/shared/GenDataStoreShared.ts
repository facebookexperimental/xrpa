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


import { upperFirst } from "@xrpa/xrpa-utils";

import { ClassSpec, ClassVisibility } from "../../shared/ClassSpec";
import { DataStoreDefinition, InputReconcilerDefinition, OutputReconcilerDefinition } from "../../shared/DataStore";
import { ModuleDefinition } from "../../shared/ModuleDefinition";
import { TargetCodeGenImpl } from "../../shared/TargetCodeGen";
import { CollectionTypeDefinition, StructSpec } from "../../shared/TypeDefinition";
import { CodeLiteralValue } from "../../shared/TypeValue";

export interface GenDataStoreContext {
  moduleDef: ModuleDefinition;
  storeDef: DataStoreDefinition;
  namespace: string;
}

export function fieldGetterFuncName(codegen: TargetCodeGenImpl, typeFields: StructSpec, fieldName: string): string {
  return codegen.methodMember(`get${upperFirst(fieldName)}`);
}

export function getInboundCollectionClassName(
  ctx: GenDataStoreContext,
  typeDef: CollectionTypeDefinition,
): string {
  return `Inbound${typeDef.getReadAccessorType(ctx.namespace, null)}Collection`;
}

export function getOutboundCollectionClassName(
  ctx: GenDataStoreContext,
  typeDef: CollectionTypeDefinition,
): string {
  return `Outbound${typeDef.getReadAccessorType(ctx.namespace, null)}Collection`;
}

export function genFieldProperties(classSpec: ClassSpec, params: {
  codegen: TargetCodeGenImpl,
  reconcilerDef: InputReconcilerDefinition|OutputReconcilerDefinition,
  fieldToMemberVar: (fieldName: string) => string,
  directionality: "inbound"|"outbound",
  canCreate?: boolean,
  canChange?: boolean,
  canSetDirty?: boolean,
  visibility?: ClassVisibility,
}): void {
  const typeFields = params.reconcilerDef.type.getStateFields();
  for (const fieldName in typeFields) {
    if (params.directionality === "inbound" && !params.reconcilerDef.isInboundField(fieldName)) {
      continue;
    }
    if (params.directionality === "outbound" && !params.reconcilerDef.isOutboundField(fieldName)) {
      continue;
    }
    params.reconcilerDef.type.declareLocalFieldClassMember(classSpec, fieldName, params.fieldToMemberVar(fieldName), true, [], params.visibility);
  }

  if (params.canCreate) {
    classSpec.members.push({
      name: "createTimestamp",
      type: params.codegen.PRIMITIVE_INTRINSICS.uint64.typename,
      visibility: params.visibility,
    });
    classSpec.members.push({
      name: "changeBits",
      type: params.codegen.PRIMITIVE_INTRINSICS.uint64.typename,
      initialValue: new CodeLiteralValue(params.codegen, "0"),
      visibility: params.visibility,
    });
    classSpec.members.push({
      name: "changeByteCount",
      type: params.codegen.PRIMITIVE_INTRINSICS.int32.typename,
      initialValue: new CodeLiteralValue(params.codegen, "0"),
      visibility: params.visibility,
    });
    classSpec.members.push({
      name: "createWritten",
      type: params.codegen.PRIMITIVE_INTRINSICS.bool.typename,
      initialValue: new CodeLiteralValue(params.codegen, params.codegen.PRIMITIVE_INTRINSICS.FALSE),
      visibility: params.visibility,
    });
  } else if (params.canChange && params.reconcilerDef.getOutboundChangeBits() !== 0) {
    classSpec.members.push({
      name: "changeBits",
      type: params.codegen.PRIMITIVE_INTRINSICS.uint64.typename,
      initialValue: new CodeLiteralValue(params.codegen, "0"),
      visibility: params.visibility,
    });
    classSpec.members.push({
      name: "changeByteCount",
      type: params.codegen.PRIMITIVE_INTRINSICS.int32.typename,
      initialValue: new CodeLiteralValue(params.codegen, "0"),
      visibility: params.visibility,
    });
  }
}
