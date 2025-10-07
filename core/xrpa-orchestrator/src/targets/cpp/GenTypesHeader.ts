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

import { DataModelDefinition } from "../../shared/DataModel";
import { DataStoreDefinition } from "../../shared/DataStore";
import { IncludeAggregator } from "../../shared/Helpers";
import { typeIsEnum } from "../../shared/TypeDefinition";
import { CppIncludeAggregator, getTypesHeaderName, getTypesHeaderNamespace, HEADER } from "./CppCodeGenImpl";
import { HashValue, TransportConfig } from "./CppDatasetLibraryTypes";

function genTransportConfig(
  apiname: string,
  datamodel: DataModelDefinition,
  namespace: string,
  includes: IncludeAggregator,
  hashInit: string,
): string[] {
  return [
    `static inline ${TransportConfig.getLocalType(namespace, includes)} GenTransportConfig() {`,
    `  ${TransportConfig.getLocalType(namespace, includes)} config;`,
    `  config.schemaHash = ${HashValue.getLocalType(namespace, includes)}(${hashInit});`,
    `  config.changelogByteCount = ${datamodel.calcChangelogSize()};`,
    `  return config;`,
    `}`,
  ]
}

function genTypeDefinitions(
  namespace: string,
  datamodel: DataModelDefinition,
  includes: IncludeAggregator,
): string[] {
  const ret: string[] = [];

  // forward declare the read reconciler names so that UE headers can reference them
  // (since they cannot include the DataStore headers)
  for (const typeDef of datamodel.getCollections()) {
    ret.push(`class ${typeDef.getReadAccessorType(namespace, null)};`);
  }

  ret.push("");

  const typeDefs = datamodel.getAllTypeDefinitions();

  // define enums first
  for (const typeDef of typeDefs) {
    if (!typeIsEnum(typeDef)) {
      continue;
    }
    const lines = typeDef.genTypeDefinition(includes);
    if (lines) {
      ret.push(...lines, "");
    }
  }

  // define the local types next, so that the to/fromLocal functions can use them
  for (const typeDef of typeDefs) {
    const lines = typeDef.genLocalTypeDefinition(namespace, includes);
    if (lines) {
      ret.push(...lines, "");
    }
  }

  // define the dataset types last
  for (const typeDef of typeDefs) {
    if (typeIsEnum(typeDef)) {
      continue;
    }
    const lines = typeDef.genTypeDefinition(includes);
    if (lines) {
      ret.push(...lines, "");
    }
  }

  return ret;
}

export function genTypesHeader(
  fileWriter: FileWriter,
  outdir: string,
  def: DataStoreDefinition,
) {
  const includes = new CppIncludeAggregator();

  const headerName = getTypesHeaderName(def.apiname);
  const namespace = getTypesHeaderNamespace(def.apiname);

  const schemaHash = def.datamodel.getHash();
  const hashInit = schemaHash.values.map(str => "0x" + str).join(", ");

  const lines = [
    `namespace ${namespace} {`,
    ``,
    ...genTransportConfig(def.apiname, def.datamodel, namespace, includes, hashInit),
    ``,
    ...genTypeDefinitions(namespace, def.datamodel, includes),
    `} // namespace ${namespace}`,
    ``,
  ];

  lines.unshift(
    ...HEADER,
    `#pragma once`,
    ``,
    ...includes.getIncludes(headerName),
    ``,
  );

  fileWriter.writeFile(path.join(outdir, headerName), lines);
}
