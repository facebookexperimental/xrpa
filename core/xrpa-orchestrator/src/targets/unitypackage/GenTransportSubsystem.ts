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

import { DataStoreDefinition } from "../../shared/DataStore";
import { IncludeAggregator } from "../../shared/Helpers";
import { CsIncludeAggregator, getDataStoreName, getTypesHeaderName, getTypesHeaderNamespace, HEADER } from "../csharp/CsharpCodeGenImpl";
import { SharedMemoryTransportStream, TransportStream } from "../csharp/CsharpDatasetLibraryTypes";
import { getDataStoreSubsystemName } from "./GenDataStoreSubsystem";
import { genUnitySingleton } from "./UnityHelpers";

export function getTransportSubsystemName(storeDef: DataStoreDefinition): string {
  return `${storeDef.apiname}TransportSubsystem`;
}

export function getInboundTransportVarName(storeDef: DataStoreDefinition) {
  return `${storeDef.dataset}InboundTransport`;
}

export function getOutboundTransportVarName(storeDef: DataStoreDefinition) {
  return `${storeDef.dataset}OutboundTransport`;
}

function genTransportDeclaration(storeDef: DataStoreDefinition, namespace: string, includes: IncludeAggregator): string[] {
  return [
    `public ${TransportStream.declareLocalVar(namespace, includes, getInboundTransportVarName(storeDef))};`,
    `public ${TransportStream.declareLocalVar(namespace, includes, getOutboundTransportVarName(storeDef))};`,
  ];
}

function genTransportInitializer(storeDef: DataStoreDefinition, namespace: string, includes: IncludeAggregator): string[] {
  includes.addFile({ filename: getTypesHeaderName(storeDef.apiname )});
  const inboundTransportVar = getInboundTransportVarName(storeDef);
  const outboundTransportVar = getOutboundTransportVarName(storeDef);
  const inboundMemMarker = storeDef.isModuleProgramInterface ? "Input" : "Output";
  const outboundMemMarker = storeDef.isModuleProgramInterface ? "Output" : "Input";
  return [
    `{`,
    `  var local${inboundTransportVar} = new ${SharedMemoryTransportStream.getLocalType(namespace, includes)}("${storeDef.dataset}${inboundMemMarker}", ${getTypesHeaderNamespace(storeDef.apiname)}.${getDataStoreName(storeDef.apiname)}Config.GenTransportConfig());`,
    `  ${inboundTransportVar} = local${inboundTransportVar};`,
    ``,
    `  var local${outboundTransportVar} = new ${SharedMemoryTransportStream.getLocalType(namespace, includes)}("${storeDef.dataset}${outboundMemMarker}", ${getTypesHeaderNamespace(storeDef.apiname)}.${getDataStoreName(storeDef.apiname)}Config.GenTransportConfig());`,
    `  ${outboundTransportVar} = local${outboundTransportVar};`,
    `}`,
  ];
}

function genTransportDeinitializer(storeDef: DataStoreDefinition): string[] {
  return [
    `${getDataStoreSubsystemName(storeDef)}.MaybeInstance?.Shutdown();`,
    `${getOutboundTransportVarName(storeDef)}?.Dispose();`,
    `${getOutboundTransportVarName(storeDef)} = null;`,
    `${getInboundTransportVarName(storeDef)}?.Dispose();`,
    `${getInboundTransportVarName(storeDef)} = null;`,
  ];
}

export function genTransportSubsystem(fileWriter: FileWriter, outDir: string, storeDef: DataStoreDefinition) {
  const className = getTransportSubsystemName(storeDef);
  const namespace = "";

  const includes = new CsIncludeAggregator(["UnityEngine"]);
  const lines = genUnitySingleton(
    className,
    genTransportInitializer(storeDef, namespace, includes),
    genTransportDeinitializer(storeDef),
    genTransportDeclaration(storeDef, namespace, includes),
  );
  lines.unshift(
    ...HEADER,
    ...includes.getNamespaceImports(),
    ``,
  );

  fileWriter.writeFile(path.join(outDir, `${className}.cs`), lines);
}
