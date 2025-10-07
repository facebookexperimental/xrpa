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


import { IncludeAggregator } from "./Helpers";
import { PrimitiveType } from "./PrimitiveType";
import { StructType } from "./StructType";
import { TargetCodeGenImpl } from "./TargetCodeGen";
import {
  CollectionNameAndType,
  InterfaceTypeDefinition,
  ReferenceTypeDefinition,
  TypeMetaType,
} from "./TypeDefinition";
import {
  CodeLiteralValue,
  PrimitiveValue,
  StructValue,
  TypeValue,
} from "./TypeValue";

export class ReferenceType extends PrimitiveType implements ReferenceTypeDefinition {
  constructor(
    codegen: TargetCodeGenImpl,
    readonly toType: InterfaceTypeDefinition,
    readonly objectUuidType: StructType,
  ) {
    const zero = new PrimitiveValue(codegen, codegen.PRIMITIVE_INTRINSICS.uint64.typename, 0);
    super(
      codegen,
      `Reference<${toType.getName()}>`,
      objectUuidType.datasetType,
      objectUuidType.localType,
      objectUuidType.getTypeSize(),
      true,
      new StructValue(codegen, objectUuidType.getInternalType("", null), false, [
        ["ID0", zero],
        ["ID1", zero],
      ], ""),
    );
  }

  public getMetaType(): TypeMetaType {
    return TypeMetaType.TYPE_REFERENCE;
  }

  public getReferencedTypeList(inNamespace: string, includes: IncludeAggregator|null): CollectionNameAndType[] {
    return this.toType.getCompatibleTypeList(inNamespace, includes);
  }

  public getReferencedSuperType(inNamespace: string, includes: IncludeAggregator|null): string {
    return this.toType.getLocalTypePtr(inNamespace, includes);
  }

  public convertValueFromLocal(inNamespace: string, includes: IncludeAggregator|null, value: string|TypeValue): TypeValue {
    if (typeof value === "string") {
      value = new CodeLiteralValue(
        this.codegen,
        this.codegen.genReferencePtrToID(value, this.objectUuidType.getLocalType(inNamespace, includes)),
      );
    }
    return value;
  }

  public convertValueToLocal(_inNamespace: string, _includes: IncludeAggregator|null, value: string|TypeValue): TypeValue {
    if (typeof value === "string") {
      value = new CodeLiteralValue(this.codegen, value);
    }
    return value;
  }
}
