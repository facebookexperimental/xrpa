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
import { TargetCodeGenImpl, TypeSpec } from "./TargetCodeGen";
import { UserDefaultValue } from "./TypeDefinition";
import {
  CodeLiteralValue,
  ConstructValue,
  EmptyValue,
  EnumValue,
  TypeValue,
} from "./TypeValue";

export class EnumType extends PrimitiveType {
  public readonly enumValues: Record<string, number>;

  constructor(
    codegen: TargetCodeGenImpl,
    readonly enumName: string,
    apiname: string,
    enumValues: Record<string, number>,
    readonly localTypeOverride?: TypeSpec,
  ) {
    const typename = codegen.nsJoin(codegen.getTypesHeaderNamespace(apiname), enumName);
    enumValues = codegen.sanitizeEnumNames(enumValues);
    super(
      codegen,
      enumName,
      codegen.PRIMITIVE_INTRINSICS.uint32,
      localTypeOverride ?? { typename, headerFile: codegen.getTypesHeaderName(apiname) },
      4,
      true,
      new EnumValue(codegen, typename, Object.keys(enumValues)[0], ""),
    );
    this.enumValues = enumValues;
  }

  public getHashData(): Record<string, unknown> {
    return {
      ...super.getHashData(),
      enumValues: this.enumValues,
    };
  }

  public userDefaultToTypeValue(inNamespace: string, _includes: IncludeAggregator | null, userDefault: UserDefaultValue): TypeValue | undefined {
    if (typeof userDefault === "string" && (userDefault in this.enumValues)) {
      return new EnumValue(this.codegen, this.datasetType.typename, userDefault, inNamespace);
    }
    return undefined;
  }

  public genTypeDefinition(includes: IncludeAggregator | null): string[] | null {
    if (this.localTypeOverride) {
      return null;
    }
    return this.codegen.genEnumDefinition(this.enumName, this.enumValues, includes);
  }

  public convertValueFromLocal(inNamespace: string, includes: IncludeAggregator | null, value: string | TypeValue): TypeValue {
    if (typeof value === "string") {
      value = new CodeLiteralValue(this.codegen, value);
    }
    if (value instanceof EmptyValue) {
      return new EmptyValue(this.codegen, this.datasetType.typename, value.defaultNamespace);
    }
    if (value instanceof ConstructValue) {
      return new ConstructValue(this.codegen, this.datasetType.typename, value.defaultNamespace);
    }
    if (value instanceof EnumValue && value.typename === this.localType.typename) {
      let enumValue = value.enumValue;
      if (this.localTypeOverride?.fieldMap) {
        for (const dsEnumValue in this.localTypeOverride.fieldMap) {
          if (this.localTypeOverride.fieldMap[dsEnumValue] === value.enumValue) {
            enumValue = dsEnumValue;
            break;
          }
        }
      }
      return new EnumValue(this.codegen, this.datasetType.typename, enumValue, inNamespace);
    }
    return new CodeLiteralValue(this.codegen, this.codegen.genEnumDynamicConversion(this.getInternalType(inNamespace, includes), value));
  }

  public convertValueToLocal(inNamespace: string, includes: IncludeAggregator | null, value: string | TypeValue): TypeValue {
    if (typeof value === "string") {
      value = new CodeLiteralValue(this.codegen, value);
    }
    if (value instanceof EmptyValue) {
      return new EmptyValue(this.codegen, this.localType.typename, value.defaultNamespace);
    }
    if (value instanceof ConstructValue) {
      return new ConstructValue(this.codegen, this.localType.typename, value.defaultNamespace);
    }
    if (value instanceof EnumValue) {
      let enumValue = value.enumValue;
      if (this.localTypeOverride?.fieldMap) {
        enumValue = this.localTypeOverride.fieldMap[enumValue];
      }
      return new EnumValue(this.codegen, this.localType.typename, enumValue, inNamespace);
    }
    return new CodeLiteralValue(this.codegen, this.codegen.genEnumDynamicConversion(this.getLocalType(inNamespace, includes), value));
  }
}
