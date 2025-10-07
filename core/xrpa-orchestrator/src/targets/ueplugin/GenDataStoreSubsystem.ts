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
import { getDataStoreClass, getDataStoreHeaderName, getDataStoreName, HEADER } from "../cpp/CppCodeGenImpl";
import { getInboundTransportVarName, getOutboundTransportVarName } from "../cpp/GenModuleClass";
import { getTransportSubsystemName } from "./GenTransportSubsystem";

export function getDataStoreSubsystemName(storeDef: DataStoreDefinition): string {
  return `${getDataStoreName(storeDef.apiname)}Subsystem`;
}

export function genDataStoreSubsystem(fileWriter: FileWriter, outSrcDir: string, storeDef: DataStoreDefinition, pluginName: string) {
  const name = getDataStoreSubsystemName(storeDef);
  const dataStoreClassName = getDataStoreClass(storeDef.apiname, "", null);

  const cppLines = [
    ...HEADER,
    `#include "${name}.h"`,
    `#include "${getTransportSubsystemName(storeDef)}.h"`,
    ``,
    `U${name}::U${name}() {}`,
    ``,
    `TStatId U${name}::GetStatId() const {`,
    `  RETURN_QUICK_DECLARE_CYCLE_STAT(U${name}, STATGROUP_Tickables);`,
    `}`,
    ``,
    `void U${name}::Initialize(FSubsystemCollectionBase& Collection) {`,
    `  Super::Initialize(Collection);`,
    ``,
    `  auto transportSubsystem = GEngine->GetEngineSubsystem<U${getTransportSubsystemName(storeDef)}>();`,
    `  DataStore = std::make_shared<${dataStoreClassName}>(transportSubsystem->${getInboundTransportVarName(storeDef)}, transportSubsystem->${getOutboundTransportVarName(storeDef)});`,
    `}`,
    ``,
    `void U${name}::Deinitialize() {`,
    `  if (DataStore) {`,
    `    DataStore->shutdown();`,
    `  }`,
    `  DataStore.reset();`,
    `  Super::Deinitialize();`,
    `}`,
    ``,
    `void U${name}::Tick(float DeltaTime) {`,
    // TODO figure out of there is a way to do early and late ticking in UE like in Unity
    `  DataStore->tickInbound();`,
    `  DataStore->tickOutbound();`,
    `}`,
    ``,
  ];

  const headerLines = [
    ...HEADER,
    `#pragma once`,
    ``,
    `#include "${getDataStoreHeaderName(storeDef.apiname)}"`,
    `#include "CoreMinimal.h"`,
    `#include "Subsystems/WorldSubsystem.h"`,
    ``,
    `#include "${name}.generated.h"`,
    ``,
    `UCLASS()`,
    `class ${pluginName.toUpperCase()}_API U${name} : public UTickableWorldSubsystem {`,
    `  GENERATED_BODY()`,
    ``,
    ` public:`,
    `  U${name}();`,
    ``,
    `  virtual TStatId GetStatId() const override;`,
    `  virtual void Initialize(FSubsystemCollectionBase& Collection) override;`,
    `  virtual void Deinitialize() override;`,
    `  virtual void Tick(float DeltaTime) override;`,
    ``,
    `  std::shared_ptr<${dataStoreClassName}> DataStore;`,
    `};`,
    ``,
  ];

  fileWriter.writeFile(path.join(outSrcDir, `${name}.cpp`), cppLines);
  fileWriter.writeFile(path.join(outSrcDir, `${name}.h`), headerLines);
}
