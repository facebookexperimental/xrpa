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

import { DataStoreDefinition } from "../../shared/DataStore";
import { CppIncludeAggregator, HEADER } from "../cpp/CppCodeGenImpl";
import { genInboundTransportDeclaration, genOutboundTransportDeclaration } from "../cpp/GenModuleClass";
import { genTransportDeinitializer, genTransportInitializer } from "../cpp/GenStandaloneCpp";

export function getTransportSubsystemName(storeDef: DataStoreDefinition): string {
  return `${storeDef.apiname}TransportSubsystem`;
}

export function genTransportSubsystem(fileWriter: FileWriter, outSrcDir: string, storeDef: DataStoreDefinition, pluginName: string) {
  const name = getTransportSubsystemName(storeDef);
  const namespace = "";

  const cppIncludes = new CppIncludeAggregator();
  const cppLines = [
    `U${name}::U${name}() {}`,
    ``,
    `void U${name}::Initialize(FSubsystemCollectionBase& Collection) {`,
    `  Super::Initialize(Collection);`,
    ...indent(1, genTransportInitializer(storeDef, namespace, cppIncludes)),
    `}`,
    ``,
    `void U${name}::Deinitialize() {`,
    ...indent(1, genTransportDeinitializer(storeDef)),
    `  Super::Deinitialize();`,
    `}`,
    ``,
  ];
  cppLines.unshift(
    ...HEADER,
    `#include "${name}.h"`,
    ``,
    ...cppIncludes.getIncludes(),
    ``,
  );
  fileWriter.writeFile(path.join(outSrcDir, `${name}.cpp`), cppLines);

  const headerName = `${name}.h`;
  const headerIncludes = new CppIncludeAggregator([
    "CoreMinimal.h",
    "Subsystems/EngineSubsystem.h",
  ]);
  const headerLines = [
    `#include "${name}.generated.h"`,
    ``,
    `UCLASS()`,
    `class ${pluginName.toUpperCase()}_API U${name} : public UEngineSubsystem {`,
    `  GENERATED_BODY()`,
    ``,
    ` public:`,
    `  U${name}();`,
    ``,
    `  virtual void Initialize(FSubsystemCollectionBase& Collection) override;`,
    `  virtual void Deinitialize() override;`,
    ``,
    ...indent(1, genInboundTransportDeclaration(storeDef, namespace, headerIncludes, true)),
    ...indent(1, genOutboundTransportDeclaration(storeDef, namespace, headerIncludes, true)),
    `};`,
    ``,
  ];
  headerLines.unshift(
    ...HEADER,
    `#pragma once`,
    ``,
    ...headerIncludes.getIncludes(headerName),
  );

  fileWriter.writeFile(path.join(outSrcDir, headerName), headerLines);
}
