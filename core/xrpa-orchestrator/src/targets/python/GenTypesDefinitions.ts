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
import { PythonIncludeAggregator, getDataStoreName, getTypesHeaderName, getTypesHeaderNamespace, HEADER, nsJoin, nsQualify } from "./PythonCodeGenImpl";
import { HashValue, TransportConfig } from "./PythonDatasetLibraryTypes";
import { typeIsEnum } from "../../shared/TypeDefinition";

export function getDataStoreConfigName(apiname: string, inNamespace: string, includes: IncludeAggregator|null) {
  const fullName = nsJoin(getTypesHeaderNamespace(apiname), getDataStoreName(apiname) + "_config", "transport_config");
  includes?.addFile({ filename: getTypesHeaderName(apiname), namespace: getTypesHeaderNamespace(apiname) });
  return nsQualify(fullName, inNamespace);
}

function genTypeDefinitions(
  namespace: string,
  datamodel: DataModelDefinition,
  includes: IncludeAggregator,
): string[] {
  const ret: string[] = [];

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

  // define the local types first, so that the to/fromLocal functions can use them
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

export function genTypesDefinitions(
  fileWriter: FileWriter,
  outdir: string,
  def: DataStoreDefinition,
) {
  const includes = new PythonIncludeAggregator();

  const headerName = getTypesHeaderName(def.apiname);
  const dataStoreName = getDataStoreName(def.apiname);
  const namespace = getTypesHeaderNamespace(def.apiname);

  const schemaHash = def.datamodel.getHash();
  const hashInit = schemaHash.values.map(str => "0x" + str).join(", ");

  const lines = [
    `class ${dataStoreName}_config:`,
    `  transport_config = ${TransportConfig.getLocalType(namespace, includes)}(${HashValue.getLocalType(namespace, includes)}(${hashInit}), ${def.datamodel.calcChangelogSize()})`,
    ``,
    ...genTypeDefinitions(namespace, def.datamodel, includes),
    ``,
  ];

  lines.unshift(
    ...HEADER,
    ``,
    ...includes.getNamespaceImports(namespace),
    ``,
  );

  fileWriter.writeFile(path.join(outdir, headerName), lines);
}
