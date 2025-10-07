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


import { arrayZip, recordZip } from "@xrpa/xrpa-utils";
import assert from "assert";

import { IncludeAggregator } from "./Helpers";
import { BuiltinType, SemanticConversionData } from "./BuiltinTypes";
import { CoordTypeConfig, genSemanticConversion, getFieldMappings, performSemanticConversion } from "./CoordinateTransformer";
import { FieldTransforms, StructType } from "./StructType";
import { TargetCodeGenImpl, TypeSpec } from "./TargetCodeGen";
import { StructSpec, TypeDefinition } from "./TypeDefinition";
import {
  CodeLiteralValue,
  ConstructValue,
  EmptyValue,
  PrimitiveValue,
  StructValue,
  TypeValue,
} from "./TypeValue";

export class NumericSemanticType extends StructType {
  constructor(
    codegen: TargetCodeGenImpl,
    readonly semanticType: BuiltinType,
    localTypeOverride: TypeSpec | undefined,
    fields: StructSpec,
    readonly conversionData: SemanticConversionData,
    readonly coordTypeConfig: CoordTypeConfig | null,
  ) {
    super(
      codegen,
      semanticType,
      conversionData.apiname,
      undefined,
      fields,
      localTypeOverride,
    );

    let elemType: TypeDefinition | null = null;
    for (const key in fields) {
      if (elemType === null) {
        elemType = fields[key].type;
      } else {
        assert(elemType === fields[key].type);
      }
    }
    assert(elemType !== null);
  }

  public genLocalTypeDefinition(inNamespace: string, includes: IncludeAggregator | null): string[] | null {
    if (this.localTypeOverride) {
      return null;
    }
    return super.genLocalTypeDefinition(inNamespace, includes);
  }

  protected getFieldTransforms(inNamespace: string, includes: IncludeAggregator | null): FieldTransforms {
    if (!this.coordTypeConfig) {
      return super.getFieldTransforms(inNamespace, includes);
    }

    const fieldMappings = getFieldMappings(this.getStateFields(), this.localType.fieldMap);

    const localType = this.getLocalType(inNamespace, includes);
    const localFieldOrder = Object.keys(fieldMappings.toLocal);

    const dsType = this.getInternalType(inNamespace, includes);
    const dsFieldOrder = Object.values(fieldMappings.fromLocal);

    return {
      fieldsToLocal: recordZip(Object.values(fieldMappings.toLocal), genSemanticConversion({
        codegen: this.codegen,
        returnType: localType,
        returnFieldOrder: localFieldOrder,
        valName: "",
        valFieldOrder: dsFieldOrder,
        valFieldMapping: null,
        coordTypeConfig: this.coordTypeConfig,
        transform: this.conversionData.toLocalTransform,
      })),
      fieldsFromLocal: recordZip(Object.values(fieldMappings.fromLocal), genSemanticConversion({
        codegen: this.codegen,
        returnType: dsType,
        returnFieldOrder: dsFieldOrder,
        valName: "val",
        valFieldOrder: dsFieldOrder,
        valFieldMapping: fieldMappings.toLocal,
        coordTypeConfig: this.coordTypeConfig,
        transform: this.conversionData.fromLocalTransform,
      })),
    };
  }

  public convertValueFromLocal(inNamespace: string, includes: IncludeAggregator | null, value: string | TypeValue): TypeValue {
    if (typeof value === "string") {
      value = new CodeLiteralValue(this.codegen, value);
    }
    return new CodeLiteralValue(this.codegen, value.toString(inNamespace));
  }

  public convertValueToLocal(inNamespace: string, includes: IncludeAggregator | null, value: string | TypeValue): TypeValue {
    if (typeof value === "string") {
      value = new CodeLiteralValue(this.codegen, value);
    }
    if (this.coordTypeConfig && value instanceof StructValue) {
      const fieldMappings = getFieldMappings(this.getStateFields(), this.localType.fieldMap);

      const localType = this.getLocalType(inNamespace, includes);
      const localFieldOrder = Object.keys(fieldMappings.toLocal);

      const dsFieldOrder = Object.values(fieldMappings.fromLocal);
      const dsFieldValues = value.fieldValues.map(kv => kv[1]);

      const localFieldValues = performSemanticConversion({
        codegen: this.codegen,
        returnType: localType,
        returnFieldOrder: localFieldOrder,
        valElems: dsFieldValues,
        valFieldOrder: dsFieldOrder,
        coordTypeConfig: this.coordTypeConfig,
        transform: this.conversionData.toLocalTransform,
        inNamespace,
      });
      value = new StructValue(
        this.codegen,
        localType,
        this.localType.hasInitializerConstructor ?? false,
        arrayZip(Object.values(fieldMappings.toLocal), localFieldValues),
        inNamespace,
      );
      if (value instanceof StructValue && value.fieldValues.length === 1 && value.fieldValues[0][1] instanceof PrimitiveValue && value.fieldValues[0][1].typename === this.localType.typename) {
        return value.fieldValues[0][1];
      }
      return value;
    }
    if (value instanceof EmptyValue) {
      return new EmptyValue(this.codegen, this.localType.typename, value.defaultNamespace);
    }
    if (value instanceof ConstructValue) {
      return new ConstructValue(this.codegen, this.localType.typename, value.defaultNamespace);
    }
    return super.convertValueToLocal(inNamespace, includes, value);
  }
}
