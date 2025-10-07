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


import { TargetCodeGenImpl } from "./TargetCodeGen";

export interface TypeValue {
  toString(inNamespace: string): string;
}

export class PrimitiveValue implements TypeValue {
  constructor(
    readonly codegen: TargetCodeGenImpl,
    readonly typename: string,
    readonly value: string | boolean | number,
  ) { }

  public toString(): string {
    return this.codegen.genPrimitiveValue(this.typename, this.value);
  }
}

export class EnumValue implements TypeValue {
  constructor(
    readonly codegen: TargetCodeGenImpl,
    readonly typename: string,
    readonly enumValue: string,
    readonly defaultNamespace: string,
  ) { }

  public toString(inNamespace: string): string {
    inNamespace = inNamespace ?? this.defaultNamespace;
    return this.codegen.nsJoin(this.codegen.nsQualify(this.typename, inNamespace), this.enumValue);
  }
}

export class CodeLiteralValue implements TypeValue {
  constructor(
    readonly codegen: TargetCodeGenImpl,
    readonly code: string,
  ) { }

  public toString(): string {
    return this.code;
  }
}

export class EmptyValue implements TypeValue {
  constructor(
    readonly codegen: TargetCodeGenImpl,
    readonly typename: string,
    readonly defaultNamespace: string,
  ) { }

  public toString(inNamespace: string): string {
    if (!this.typename) {
      return "";
    }
    inNamespace = inNamespace ?? this.defaultNamespace;
    return this.codegen.genPrimitiveValue(this.codegen.nsQualify(this.typename, inNamespace), null);
  }
}

export class ConstructValue implements TypeValue {
  constructor(
    readonly codegen: TargetCodeGenImpl,
    readonly typename: string,
    readonly defaultNamespace: string,
  ) { }

  public toString(inNamespace: string): string {
    if (!this.typename) {
      return "";
    }
    inNamespace = inNamespace ?? this.defaultNamespace;
    return this.codegen.genPrimitiveValue(this.codegen.nsQualify(this.typename, inNamespace), null);
  }
}

export class StructValue implements TypeValue {
  constructor(
    readonly codegen: TargetCodeGenImpl,
    readonly typename: string,
    readonly hasInitializerConstructor: boolean,
    readonly fieldValues: [string, TypeValue][],
    readonly defaultNamespace: string,
  ) { }

  public toString(inNamespace: string): string {
    inNamespace = inNamespace ?? this.defaultNamespace;

    const values: [string, string][] = this.fieldValues.map(v => [v[0], v[1].toString(inNamespace)]);

    return this.codegen.genMultiValue(
      this.codegen.nsQualify(this.typename, inNamespace),
      this.hasInitializerConstructor,
      values,
    );
  }
}

export function isTypeValue(val: unknown): val is TypeValue {
  return (
    val instanceof PrimitiveValue ||
    val instanceof EnumValue ||
    val instanceof CodeLiteralValue ||
    val instanceof EmptyValue ||
    val instanceof ConstructValue ||
    val instanceof StructValue
  );
}

export function isSameTypeValue(a: TypeValue, b: TypeValue): boolean {
  if (a instanceof PrimitiveValue && b instanceof PrimitiveValue) {
    return a.typename === b.typename && a.value === b.value;
  }
  if (a instanceof EnumValue && b instanceof EnumValue) {
    return a.typename === b.typename && a.enumValue === b.enumValue;
  }
  if (a instanceof CodeLiteralValue && b instanceof CodeLiteralValue) {
    return a.code === b.code;
  }
  if (a instanceof EmptyValue && b instanceof EmptyValue) {
    return a.typename === b.typename;
  }
  if (a instanceof ConstructValue && b instanceof ConstructValue) {
    return a.typename === b.typename;
  }
  if (a instanceof StructValue && b instanceof StructValue) {
    if (a.typename !== b.typename) {
      return false;
    }
    if (a.fieldValues.length !== b.fieldValues.length) {
      return false;
    }
    for (let i = 0; i < a.fieldValues.length; i++) {
      if (a.fieldValues[i][0] !== b.fieldValues[i][0]) {
        return false;
      }
      if (!isSameTypeValue(a.fieldValues[i][1], b.fieldValues[i][1])) {
        return false;
      }
    }
    return true;
  }
  return false;
}
