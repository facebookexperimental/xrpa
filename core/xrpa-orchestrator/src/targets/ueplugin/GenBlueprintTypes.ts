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


import { FileWriter } from "@xrpa/xrpa-file-utils";
import path from "path";

import { IncludeAggregator } from "../../shared/Helpers";
import { MessageDataTypeDefinition, typeIsMessageData } from "../../shared/TypeDefinition";
import { GenDataStoreContext } from "../shared/GenDataStoreShared";
import { CppIncludeAggregator, HEADER } from "../cpp/CppCodeGenImpl";

export function getBlueprintTypesHeaderName(apiname: string): string {
  return `${apiname}BlueprintTypes.h`;
}

export function getMessageDelegateName(msgType: MessageDataTypeDefinition | null, apiname: string) {
  if (!msgType || !msgType.hasFields()) {
    return `F${apiname}_MessageData_Delegate`;
  }
  return `F${apiname}_${msgType.getName()}_Delegate`;
}

function paramsCountName(num: number): string {
  switch (num) {
    case 0: return "ZeroParams";
    case 1: return "OneParam";
    case 2: return "TwoParams";
    case 3: return "ThreeParams";
    case 4: return "FourParams";
    case 5: return "FiveParams";
    case 6: return "SixParams";
  }
  throw new Error(`Unsupported number of message params: ${num}`);
}

function genMessageDelegateDeclaration(ctx: GenDataStoreContext, includes: IncludeAggregator, typeDef: MessageDataTypeDefinition | null) {
  const params = [
    `FDateTime, msgTimestamp`,
  ];
  if (typeDef) {
    const fields = typeDef.getStateFields();
    for (const key in fields) {
      const fieldType = fields[key].type;
      params.push(`${fieldType.declareLocalParam(ctx.namespace, includes, "")}, ${key}`);
    }
  }
  return `DECLARE_DYNAMIC_MULTICAST_DELEGATE_${paramsCountName(params.length)}(${getMessageDelegateName(typeDef, ctx.storeDef.apiname)}, ${params.join(", ")});`;
}

function genTargetSpecificTypes(ctx: GenDataStoreContext, includes: IncludeAggregator): string[] {
  const ret = [
    genMessageDelegateDeclaration(ctx, includes, null),
    "",
  ];

  for (const typeDef of ctx.storeDef.datamodel.getAllTypeDefinitions()) {
    if (typeIsMessageData(typeDef) && typeDef.hasFields()) {
      ret.push(
        genMessageDelegateDeclaration(ctx, includes, typeDef),
        "",
      );
    }
    const lines = typeDef.genTargetSpecificTypeDefinition(ctx.namespace, includes);
    if (lines) {
      ret.push(...lines, "");
    }
  }

  return ret;
}

export function genBlueprintTypes(
  fileWriter: FileWriter,
  outSrcDir: string,
  outHeaderDir: string,
  ctx: GenDataStoreContext,
) {
  const headerName = getBlueprintTypesHeaderName(ctx.storeDef.apiname);

  const cppLines = [
    ...HEADER,
    `#include "${headerName}"`,
    ``,
  ];

  const includes = new CppIncludeAggregator();

  const customTypeDefs = genTargetSpecificTypes(ctx, includes);

  const headerLines = [
    ...HEADER,
    `#pragma once`,
    ``,
    ...includes.getIncludes(headerName),
    ``,
    `#include "${headerName.slice(0, -2)}.generated.h"`,
    ``,
    ...customTypeDefs,
  ];

  fileWriter.writeFile(path.join(outSrcDir, `${headerName.slice(0, -2)}.cpp`), cppLines);
  fileWriter.writeFile(path.join(outHeaderDir, headerName), headerLines);
}
