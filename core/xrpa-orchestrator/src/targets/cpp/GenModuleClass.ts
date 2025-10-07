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
import { indent, lowerFirst, objectIsEmpty } from "@xrpa/xrpa-utils";
import path from "path";

import { DataStoreDefinition } from "../../shared/DataStore";
import { IncludeAggregator } from "../../shared/Helpers";
import { ModuleDefinition } from "../../shared/ModuleDefinition";
import { CppIncludeAggregator, getDataStoreClass, getDataStoreName, HEADER } from "./CppCodeGenImpl";
import { TransportStream, XrpaModule } from "./CppDatasetLibraryTypes";

export function getModuleHeaderName(moduleDef: ModuleDefinition): string {
  return `${moduleDef.name}Module.h`;
}

export function getInboundTransportVarName(storeDef: DataStoreDefinition) {
  return `${storeDef.dataset}InboundTransport`;
}

export function getOutboundTransportVarName(storeDef: DataStoreDefinition) {
  return `${storeDef.dataset}OutboundTransport`;
}

export function genInboundTransportDeclaration(storeDef: DataStoreDefinition, namespace: string, includes: IncludeAggregator, semicolonTerminate: boolean): string {
  includes.addFile({
    filename: "<memory>",
    typename: "std::shared_ptr",
  });
  return `std::shared_ptr<${TransportStream.getLocalType(namespace, includes)}> ${getInboundTransportVarName(storeDef)}` + (semicolonTerminate ? ";" : "");
}

export function genOutboundTransportDeclaration(storeDef: DataStoreDefinition, namespace: string, includes: IncludeAggregator, semicolonTerminate: boolean): string {
  includes.addFile({
    filename: "<memory>",
    typename: "std::shared_ptr",
  });
  return `std::shared_ptr<${TransportStream.getLocalType(namespace, includes)}> ${getOutboundTransportVarName(storeDef)}` + (semicolonTerminate ? ";" : "");
}

export function genTransportDeclarations(moduleDef: ModuleDefinition, namespace: string, includes: IncludeAggregator, semicolonTerminate: boolean): string[] {
  const lines: string[] = [];
  includes.addFile({
    filename: "<memory>",
    typename: "std::shared_ptr",
  });
  for (const storeDef of moduleDef.getDataStores()) {
    lines.push(genInboundTransportDeclaration(storeDef, namespace, includes, semicolonTerminate));
    lines.push(genOutboundTransportDeclaration(storeDef, namespace, includes, semicolonTerminate));
  }
  return lines;
}

function genDataStoreInits(moduleDef: ModuleDefinition, namespace: string, includes: IncludeAggregator): string[] {
  return moduleDef.getDataStores().map(storeDef => {
    const dataStoreName = getDataStoreName(storeDef.apiname);
    return `${lowerFirst(dataStoreName)} = std::make_shared<${getDataStoreClass(storeDef.apiname, namespace, includes)}>(${getInboundTransportVarName(storeDef)}, ${getOutboundTransportVarName(storeDef)});`;
  });
}

function genDataStoreDecls(moduleDef: ModuleDefinition, namespace: string, includes: IncludeAggregator): string[] {
  return moduleDef.getDataStores().map(storeDef => {
    const dataStoreName = getDataStoreName(storeDef.apiname);
    return `std::shared_ptr<${getDataStoreClass(storeDef.apiname, namespace, includes)}> ${lowerFirst(dataStoreName)};`;
  });
}

function genModuleSettings(namespace: string, includes: IncludeAggregator, moduleDef: ModuleDefinition): string[] {
  const settings = moduleDef.getSettings();
  if (objectIsEmpty(settings.getAllFields())) {
    return [];
  }
  const defLines = settings.genLocalTypeDefinition(namespace, includes);
  if (!defLines) {
    return [];
  }
  return defLines.concat(
    `${settings.declareLocalVar(namespace, includes, "settings")};`,
  );
}

export function genModuleClass(fileWriter: FileWriter, libDir: string, moduleDef: ModuleDefinition) {
  const namespace = "";

  const className = `${moduleDef.name}Module`;
  const headerName = getModuleHeaderName(moduleDef);

  const includes = new CppIncludeAggregator([
    "<memory>",
  ]);

  const moduleSettings = genModuleSettings(namespace, includes, moduleDef);

  const lines = [
    `class ${className} : public ${XrpaModule.getLocalType(namespace, includes)} {`,
    ` public:`,
    `  ${className}(${genTransportDeclarations(moduleDef, namespace, includes, false).join(", ")}) {`,
    ...indent(2, genDataStoreInits(moduleDef, namespace, includes)),
    `  }`,
    ``,
    `  virtual ~${className}() override {`,
    `    shutdown();`,
    `  }`,
    ``,
    ...indent(1, genDataStoreDecls(moduleDef, namespace, includes)),
    ``,
    ...indent(1, moduleSettings),
    ``,
    `  virtual void shutdown() override {`,
    ...indent(2, moduleDef.getDataStores().map(storeDef => `${lowerFirst(getDataStoreName(storeDef.apiname))}->shutdown();`)),
    `  }`,
    ``,
    ` protected:`,
    `  virtual void tickInputs() override {`,
    ...indent(2, moduleDef.getDataStores().map(storeDef => `${lowerFirst(getDataStoreName(storeDef.apiname))}->tickInbound();`)),
    `  }`,
    ``,
    `  virtual void tickOutputs() override {`,
    ...indent(2, moduleDef.getDataStores().map(storeDef => `${lowerFirst(getDataStoreName(storeDef.apiname))}->tickOutbound();`)),
    `  }`,
    `};`,
    ``,
  ];

  lines.unshift(
    ...HEADER,
    `#pragma once`,
    ``,
    ...includes.getIncludes(headerName),
    ``,
  );

  fileWriter.writeFile(path.join(libDir, headerName), lines);
}
