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


import { indent } from "@xrpa/xrpa-utils";

import { IncludeAggregator } from "./Helpers";
import { StructType } from "./StructType";
import { TargetCodeGenImpl, TypeSpec } from "./TargetCodeGen";
import {
  ArrayTypeSpec,
  StructSpec,
  TypeDefinition,
  UserDefaultValue,
} from "./TypeDefinition";

export class FixedArrayType extends StructType {
  constructor(
    codegen: TargetCodeGenImpl,
    name: string,
    apiname: string,
    readonly innerType: TypeDefinition,
    readonly arraySize: number,
    readonly localArrayType: ArrayTypeSpec | undefined,
  ) {
    const fields: StructSpec = {};
    const fieldMap: Record<string, string> = {};
    for (let i = 0; i < arraySize; ++i) {
      const valueName = `value${i}`;
      fields[valueName] = {
        type: innerType,
      };
      fieldMap[`[${i}]`] = valueName;
    }

    const localType: TypeSpec | undefined = localArrayType ? {
      typename: codegen.applyTemplateParams(localArrayType.typename, innerType.getLocalType("", null)),
      headerFile: localArrayType.headerFile,
      hasInitializerConstructor: true,
      fieldMap,
    } : undefined;

    super(
      codegen,
      name,
      apiname,
      undefined,
      fields,
      localType,
    );
  }

  public getHashData(): Record<string, unknown> {
    const hashData: Record<string, unknown> = {
      ...super.getHashData(),
      innerType: this.innerType.getName(),
      arraySize: this.arraySize,
    };
    delete hashData.fields;
    return hashData;
  }

  public getLocalType(inNamespace: string, includes: IncludeAggregator|null): string {
    if (!this.localArrayType) {
      return super.getLocalType(inNamespace, includes);
    }

    // need to recompute the typename so the inner type is qualified
    const typename = this.codegen.applyTemplateParams(this.localArrayType.typename, this.innerType.getLocalType(inNamespace, includes));
    includes?.addFile({
      filename: this.localType.headerFile,
      typename,
    });
    return this.codegen.nsQualify(typename, inNamespace);
  }

  public resetLocalVarToDefault(
    inNamespace: string,
    includes: IncludeAggregator|null,
    varName: string,
    isSetter?: boolean,
    defaultOverride?: UserDefaultValue,
  ): string[] {
    if (!this.localArrayType) {
      return super.resetLocalVarToDefault(inNamespace, includes, varName, isSetter, defaultOverride);
    }

    const lines: string[] = [];

    if (this.localArrayType.setSize) {
      lines.push(
        `${varName}.${this.localArrayType.setSize.slice(0, -1)}${this.arraySize});`,
        `for (int i = 0; i < ${this.arraySize}; ++i) {`,
        ...indent(1, this.innerType.resetLocalVarToDefault(inNamespace, includes, `${varName}[i]`, isSetter, defaultOverride)),
        `}`,
      );
    } else {
      const defaultValue = this.innerType.getLocalDefaultValue(inNamespace, includes, isSetter, defaultOverride);
      lines.push(
        `${varName}.${this.localArrayType.removeAll};`,
        `for (int i = 0; i < ${this.arraySize}; ++i) {`,
        `  ${varName}.${this.localArrayType.addItem.slice(0, -1)}${defaultValue});`,
        `}`,
      );
    }

    return lines;
  }
}
