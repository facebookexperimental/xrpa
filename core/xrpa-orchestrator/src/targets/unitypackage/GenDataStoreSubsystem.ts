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
import { getDataStoreClass, getDataStoreName, HEADER } from "../csharp/CsharpCodeGenImpl";
import { getInboundTransportVarName, getOutboundTransportVarName, getTransportSubsystemName } from "./GenTransportSubsystem";
import { genUnitySingleton } from "./UnityHelpers";

export function getDataStoreSubsystemName(storeDef: DataStoreDefinition): string {
  return `${getDataStoreName(storeDef.apiname)}Subsystem`;
}

export function genDataStoreSubsystem(fileWriter: FileWriter, outSrcDir: string, storeDef: DataStoreDefinition) {
  const className = getDataStoreSubsystemName(storeDef);
  const dataStoreClassName = getDataStoreClass(storeDef.apiname, "", null);

  const lines = genUnitySingleton(className, [
    `var transportSubsystem = ${getTransportSubsystemName(storeDef)}.Instance;`,
    `DataStore = new ${dataStoreClassName}(transportSubsystem.${getInboundTransportVarName(storeDef)}, transportSubsystem.${getOutboundTransportVarName(storeDef)});`,
  ], [
    `DataStore?.Shutdown();`,
    `DataStore = null;`,
  ], [
    `void Update() {`,
    `  DataStore?.TickInbound();`,
    `}`,
    ``,
    `void LateUpdate() {`,
    `  DataStore?.TickOutbound();`,
    `}`,
    ``,
    `public void Shutdown() {`,
    `  OnDestroy();`,
    `}`,
    ``,
    `public ${dataStoreClassName} DataStore;`,
  ]);

  lines.unshift(
    ...HEADER,
    ``,
    `using UnityEngine;`,
    ``,
  );

  fileWriter.writeFile(path.join(outSrcDir, `${className}.cs`), lines);
}
