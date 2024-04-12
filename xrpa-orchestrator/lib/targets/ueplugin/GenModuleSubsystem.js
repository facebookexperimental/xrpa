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
exports.genModuleSubsystem = exports.getModuleSubsystemName = void 0;
const path_1 = __importDefault(require("path"));
const Helpers_1 = require("../../shared/Helpers");
const CppCodeGenImpl_1 = require("../cpp/CppCodeGenImpl");
const GenModuleClass_1 = require("../cpp/GenModuleClass");
const GenStandaloneCpp_1 = require("../cpp/GenStandaloneCpp");
function getModuleSubsystemName(moduleDef) {
    return `${moduleDef.name}ModuleSubsystem`;
}
exports.getModuleSubsystemName = getModuleSubsystemName;
function genModuleSubsystem(fileWriter, outSrcDir, moduleDef) {
    const name = getModuleSubsystemName(moduleDef);
    const namespace = "";
    const cppIncludes = new CppCodeGenImpl_1.CppIncludeAggregator();
    const cppLines = [
        `U${name}::U${name}() {}`,
        ``,
        `void U${name}::Initialize(FSubsystemCollectionBase& Collection) {`,
        `  Super::Initialize(Collection);`,
        ...(0, Helpers_1.indent)(1, (0, GenStandaloneCpp_1.genDatasetInitializers)(moduleDef, namespace, cppIncludes)),
        `}`,
        ``,
        `void U${name}::Deinitialize() {`,
        ...(0, Helpers_1.indent)(1, (0, GenModuleClass_1.genDatasetDeinitializers)(moduleDef)),
        `  Super::Deinitialize();`,
        `}`,
        ``,
    ];
    cppLines.unshift(...CppCodeGenImpl_1.HEADER, `#include "${name}.h"`, ``, ...cppIncludes.getIncludes(), ``);
    fileWriter.writeFile(path_1.default.join(outSrcDir, `${name}.cpp`), cppLines);
    const headerName = `${name}.h`;
    const headerIncludes = new CppCodeGenImpl_1.CppIncludeAggregator([
        "CoreMinimal.h",
        "Subsystems/EngineSubsystem.h",
    ]);
    const headerLines = [
        `#include "${name}.generated.h"`,
        ``,
        `UCLASS()`,
        `class ${moduleDef.name.toUpperCase()}_API U${name} : public UEngineSubsystem {`,
        `  GENERATED_BODY()`,
        ``,
        ` public:`,
        `  U${name}();`,
        ``,
        `  virtual void Initialize(FSubsystemCollectionBase& Collection) override;`,
        `  virtual void Deinitialize() override;`,
        ``,
        ...(0, Helpers_1.indent)(1, (0, GenModuleClass_1.genDatasetDeclarations)(moduleDef, namespace, headerIncludes, true)),
        `};`,
        ``,
    ];
    headerLines.unshift(...CppCodeGenImpl_1.HEADER, `#pragma once`, ``, ...headerIncludes.getIncludes(headerName));
    fileWriter.writeFile(path_1.default.join(outSrcDir, headerName), headerLines);
}
exports.genModuleSubsystem = genModuleSubsystem;
//# sourceMappingURL=GenModuleSubsystem.js.map
