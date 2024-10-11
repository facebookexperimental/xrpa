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

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.genDataStoreSubsystem = exports.getDataStoreSubsystemName = void 0;
const path_1 = __importDefault(require("path"));
const CppCodeGenImpl_1 = require("../cpp/CppCodeGenImpl");
const GenModuleClass_1 = require("../cpp/GenModuleClass");
const GenTransportSubsystem_1 = require("./GenTransportSubsystem");
function getDataStoreSubsystemName(storeDef) {
    return `${(0, CppCodeGenImpl_1.getDataStoreName)(storeDef.apiname)}Subsystem`;
}
exports.getDataStoreSubsystemName = getDataStoreSubsystemName;
function genDataStoreSubsystem(fileWriter, outSrcDir, storeDef, pluginName) {
    const name = getDataStoreSubsystemName(storeDef);
    const dataStoreName = (0, CppCodeGenImpl_1.getDataStoreName)(storeDef.apiname);
    const cppLines = [
        ...CppCodeGenImpl_1.HEADER,
        `#include "${name}.h"`,
        `#include "${(0, GenTransportSubsystem_1.getTransportSubsystemName)(storeDef)}.h"`,
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
        `  auto transportSubsystem = GEngine->GetEngineSubsystem<U${(0, GenTransportSubsystem_1.getTransportSubsystemName)(storeDef)}>();`,
        `  DataStore = std::make_shared<${dataStoreName}::${dataStoreName}>(transportSubsystem->${(0, GenModuleClass_1.getInboundDatasetVarName)(storeDef)}, transportSubsystem->${(0, GenModuleClass_1.getOutboundDatasetVarName)(storeDef)});`,
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
        ...CppCodeGenImpl_1.HEADER,
        `#pragma once`,
        ``,
        `#include "${(0, CppCodeGenImpl_1.getDataStoreHeaderName)(storeDef.apiname)}"`,
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
        `  std::shared_ptr<${dataStoreName}::${dataStoreName}> DataStore;`,
        `};`,
        ``,
    ];
    fileWriter.writeFile(path_1.default.join(outSrcDir, `${name}.cpp`), cppLines);
    fileWriter.writeFile(path_1.default.join(outSrcDir, `${name}.h`), headerLines);
}
exports.genDataStoreSubsystem = genDataStoreSubsystem;
//# sourceMappingURL=GenDataStoreSubsystem.js.map
