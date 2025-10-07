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
import { TargetCodeGenImpl, TypeSpec } from "./TargetCodeGen";
import {
  DSTypeSpec,
  TypeDefinition,
  typeIsStruct,
  TypeMetaType,
  TypeSize,
  UserDefaultValue,
} from "./TypeDefinition";
import {
  CodeLiteralValue,
  EmptyValue,
  isTypeValue,
  PrimitiveValue,
  TypeValue,
} from "./TypeValue";

export class PrimitiveType implements TypeDefinition {
  constructor(
    readonly codegen: TargetCodeGenImpl,
    readonly name: string,
    public datasetType: DSTypeSpec,
    public localType: TypeSpec,
    readonly byteCount: TypeSize | number,
    readonly isPassthrough: boolean,
    readonly defaultValue: TypeValue,
    readonly setterDefaultValue: TypeValue = defaultValue,
  ) {}

  public toString(): string {
    throw new Error("Bad stringify");
  }

  public getName(): string {
    return this.name;
  }

  public getMetaType(): TypeMetaType {
    return TypeMetaType.GET_SET;
  }

  public getTypeSize(): TypeSize {
    if (typeof this.byteCount === "number") {
      return {
        staticSize: this.byteCount,
        dynamicSizeEstimate: 0,
      };
    }
    return this.byteCount;
  }

  public getRuntimeByteCount(varName: string, inNamespace: string, includes: IncludeAggregator|null): [number, string|null] {
    const typeSize = this.getTypeSize();
    let dynSize: string|null = null;
    if (typeSize.dynamicSizeEstimate > 0) {
      dynSize = this.codegen.genDynSizeOfValue({
        accessor: this.getInternalType(inNamespace, includes),
        accessorIsStruct: typeIsStruct(this),
        inNamespace,
        includes,
        value: this.convertValueFromLocal(inNamespace, includes, varName),
      });
    }
    return [typeSize.staticSize, dynSize];
  }

  public getHashData(): Record<string, unknown> {
    const typeSize = this.getTypeSize();
    return {
      name: this.getName(),
      byteCount: typeSize.staticSize + typeSize.dynamicSizeEstimate,
    };
  }

  public getInternalType(inNamespace: string, includes: IncludeAggregator|null): string {
    includes?.addFile({
      filename: this.datasetType.headerFile,
      typename: this.datasetType.typename,
    });
    return this.codegen.nsQualify(this.datasetType.typename, inNamespace);
  }

  public getLocalType(inNamespace: string, includes: IncludeAggregator|null): string {
    includes?.addFile({
      filename: this.localType.headerFile,
      typename: this.localType.typename,
    });
    return this.codegen.nsQualify(this.localType.typename, inNamespace);
  }

  public getLocalHeaderFile(): string | undefined {
    return this.localType.headerFile;
  }

  public userDefaultToTypeValue(_inNamespace: string, _includes: IncludeAggregator|null, userDefault: UserDefaultValue): TypeValue|undefined {
    if (!Array.isArray(userDefault) && userDefault !== undefined) {
      return new PrimitiveValue(this.codegen, this.datasetType.typename, userDefault);
    }
    return undefined;
  }

  public convertValueFromLocal(_inNamespace: string, _includes: IncludeAggregator|null, value: string|TypeValue): TypeValue {
    if (typeof value === "string") {
      value = new CodeLiteralValue(this.codegen, value);
    }
    if (this.localType.conversionOperator && !(value instanceof PrimitiveValue)) {
      value = new CodeLiteralValue(this.codegen, `${this.localType.conversionOperator}(${value})`);
    }
    return value;
  }

  public convertValueToLocal(_inNamespace: string, _includes: IncludeAggregator|null, value: string|TypeValue): TypeValue {
    if (typeof value === "string") {
      value = new CodeLiteralValue(this.codegen, value);
    }
    if (this.localType.conversionOperator && !(value instanceof PrimitiveValue)) {
      value = new CodeLiteralValue(this.codegen, `${this.localType.conversionOperator}(${value})`);
    }
    return value;
  }

  public getInternalDefaultValue(inNamespace: string, includes: IncludeAggregator|null, isSetter?: boolean, defaultOverride?: UserDefaultValue|TypeValue): TypeValue {
    if (isTypeValue(defaultOverride)) {
      return defaultOverride;
    }
    return this.userDefaultToTypeValue(inNamespace, includes, defaultOverride) ?? (isSetter ? this.setterDefaultValue : this.defaultValue);
  }

  public getLocalDefaultValue(inNamespace: string, includes: IncludeAggregator|null, isSetter?: boolean, defaultOverride?: UserDefaultValue|TypeValue): TypeValue {
    return this.convertValueToLocal(inNamespace, includes, this.getInternalDefaultValue(inNamespace, includes, isSetter, defaultOverride));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public genTypeDefinition(_includes: IncludeAggregator|null): string[] | null {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public genLocalTypeDefinition(_inNamespace: string, _includes: IncludeAggregator|null): string[] | null {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public genTargetSpecificTypeDefinition(_inNamespace: string, _includes: IncludeAggregator|null): string[] | null {
    return null;
  }

  public declareLocalVar(inNamespace: string, includes: IncludeAggregator|null, varName: string, defaultOverride?: UserDefaultValue|TypeValue): string {
    return this.codegen.genDeclaration({
      typename: this.getLocalType("", includes),
      inNamespace,
      varName,
      initialValue: this.getLocalDefaultValue(inNamespace, includes, false, defaultOverride),
      includeTerminator: false,
    });
  }

  public declareLocalParam(inNamespace: string, includes: IncludeAggregator|null, paramName: string): string {
    const typeSize = this.getTypeSize();
    const paramType = this.codegen.constRef(this.getLocalType(inNamespace, includes), typeSize.staticSize + typeSize.dynamicSizeEstimate);
    if (!paramName) {
      return paramType;
    }
    return this.codegen.genDeclaration({
      typename: paramType,
      inNamespace: "",
      varName: paramName,
      initialValue: new EmptyValue(this.codegen, paramType, ""),
      includeTerminator: false,
    });
  }

  public declareLocalReturnType(inNamespace: string, includes: IncludeAggregator|null, canBeRef: boolean): string {
    if (!canBeRef) {
      return this.getLocalType(inNamespace, includes);
    }
    const typeSize = this.getTypeSize();
    return this.codegen.constRef(this.getLocalType(inNamespace, includes), typeSize.staticSize + typeSize.dynamicSizeEstimate);
  }

  public resetLocalVarToDefault(
    inNamespace: string,
    includes: IncludeAggregator|null,
    varName: string,
    isSetter?: boolean,
    defaultOverride?: UserDefaultValue,
  ): string[] {
    const defaultValue = this.getLocalDefaultValue(inNamespace, includes, isSetter, defaultOverride);
    const value = defaultValue.toString(inNamespace);
    if (value === "") {
      return [];
    }
    return [`${varName} = ${value};`];
  }
}
