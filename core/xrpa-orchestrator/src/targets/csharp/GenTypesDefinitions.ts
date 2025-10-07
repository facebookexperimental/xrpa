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
import { indent } from "@xrpa/xrpa-utils";
import path from "path";

import { DataModelDefinition } from "../../shared/DataModel";
import { DataStoreDefinition } from "../../shared/DataStore";
import { IncludeAggregator } from "../../shared/Helpers";
import { CsIncludeAggregator, getTypesHeaderName, getTypesHeaderNamespace, HEADER } from "./CsharpCodeGenImpl";
import { HashValue, TransportConfig } from "./CsharpDatasetLibraryTypes";

function genTransportConfig(
  apiname: string,
  datamodel: DataModelDefinition,
  namespace: string,
  includes: IncludeAggregator,
  hashInit: string,
): string[] {
  return [
    `public static ${TransportConfig.getLocalType(namespace, includes)} GenTransportConfig() {`,
    `  ${TransportConfig.getLocalType(namespace, includes)} config = new();`,
    `  config.SchemaHash = new ${HashValue.getLocalType(namespace, includes)}(${hashInit});`,
    `  config.ChangelogByteCount = ${datamodel.calcChangelogSize()};`,
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

  // define the local types first, so that the to/fromLocal functions can use them
  for (const typeDef of datamodel.getAllTypeDefinitions()) {
    const lines = typeDef.genLocalTypeDefinition(namespace, includes);
    if (lines) {
      ret.push(...lines, "");
    }
  }

  // define the dataset types last
  for (const typeDef of datamodel.getAllTypeDefinitions()) {
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
  const includes = new CsIncludeAggregator([
    "System.Runtime.InteropServices",
  ]);

  const headerName = getTypesHeaderName(def.apiname);
  const namespace = getTypesHeaderNamespace(def.apiname);

  const schemaHash = def.datamodel.getHash();
  const hashInit = schemaHash.values.map(str => "0x" + str).join(", ");

  const lines = [
    `namespace ${namespace} {`,
    ``,
    `public class ${namespace}Config {`,
    ...indent(1, genTransportConfig(def.apiname, def.datamodel, namespace, includes, hashInit)),
    `}`,
    ``,
    ...genTypeDefinitions(namespace, def.datamodel, includes),
    `} // namespace ${namespace}`,
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
