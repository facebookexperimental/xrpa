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


import { appendAligned, indent } from "@xrpa/xrpa-utils";

import { EnumType } from "../../shared/EnumType";
import { IncludeAggregator } from "../../shared/Helpers";
import { StructType } from "../../shared/StructType";
import { TargetCodeGenImpl, TypeSpec } from "../../shared/TargetCodeGen";
import { StructSpec, StructTypeDefinition } from "../../shared/TypeDefinition";
import { getBlueprintTypesHeaderName } from "./GenBlueprintTypes";

const UMETA_ALIGNMENT = 20;

export class EnumTypeUe extends EnumType {
  constructor(
    codegen: TargetCodeGenImpl,
    enumName: string,
    apiname: string,
    enumValues: Record<string, number>,
  ) {
    super(
      codegen,
      enumName,
      apiname,
      enumValues,
      { typename: `E${apiname}${enumName}`, headerFile: getBlueprintTypesHeaderName(apiname) },
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public genLocalTypeDefinition(_inNamespace: string, _includes: IncludeAggregator|null): string[] | null {
    return null;
  }

  public genTargetSpecificTypeDefinition(inNamespace: string, includes: IncludeAggregator|null): string[] | null {
    includes?.addFile({ filename: "CoreMinimal.h" });
    return [
      `UENUM(BlueprintType)`,
      `enum class ${this.getLocalType(inNamespace, null)}: uint8 {`,
      ...indent(1, Object.keys(this.enumValues).map(
        v => appendAligned(`${v} = ${this.enumValues[v]}`, `UMETA(DisplayName="${v}"),`, UMETA_ALIGNMENT),
      )),
      `};`,
    ];
  }
}

export class StructTypeUe extends StructType {
  constructor(
    codegen: TargetCodeGenImpl,
    name: string,
    apiname: string,
    parentType: StructTypeDefinition | undefined,
    fields: StructSpec,
    localTypeOverride?: TypeSpec,
  ) {
    super(
      codegen,
      name,
      apiname,
      parentType,
      fields,
      localTypeOverride ?? { typename: `F${apiname}${name}`, headerFile: getBlueprintTypesHeaderName(apiname) },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public genLocalTypeDefinition(_inNamespace: string, _includes: IncludeAggregator|null): string[] | null {
    return null;
  }

  public genTargetSpecificTypeDefinition(inNamespace: string, includes: IncludeAggregator|null): string[] | null {
    includes?.addFile({ filename: "CoreMinimal.h" });

    const fieldDefs: string[] = [];
    const fields = this.getStateFields();
    for (const fieldName in fields) {
      const fieldSpec = fields[fieldName];
      const userDefault = fieldSpec.type.userDefaultToTypeValue(inNamespace, includes, fieldSpec.defaultValue);
      fieldDefs.push(
        ...this.codegen.genCommentLines(fieldSpec.description),
        `UPROPERTY(EditAnywhere, BlueprintReadWrite)`,
        `${fieldSpec.type.declareLocalVar(inNamespace, includes, fieldName, userDefault)};`,
        ``,
      );
    }

    return [
      `USTRUCT(BlueprintType)`,
      `struct ${this.getLocalType(inNamespace, null)} {`,
      `  GENERATED_BODY()`,
      ``,
      ...indent(1, fieldDefs),
      `};`,
    ];
  }
}
