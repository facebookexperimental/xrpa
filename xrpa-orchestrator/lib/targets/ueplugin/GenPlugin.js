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
exports.genPlugin = void 0;
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const path_1 = __importDefault(require("path"));
const CppCodeGenImpl_1 = require("../cpp/CppCodeGenImpl");
const Icon128 = "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";
function writeUPlugin(fileWriter, pluginRoot, pluginName, pluginDeps) {
    const lines = [
        `{`,
        `  "FileVersion": 3,`,
        `  "Version": 1,`,
        `  "VersionName": "1.0",`,
        `  "FriendlyName": "${pluginName}",`,
        `  "Description": "",`,
        `  "Category": "Other",`,
        `  "CreatedBy": "Meta Platforms, Inc.",`,
        `  "CreatedByURL": "",`,
        `  "DocsURL": "",`,
        `  "MarketplaceURL": "",`,
        `  "SupportURL": "",`,
        `  "CanContainContent": true,`,
        `  "IsBetaVersion": false,`,
        `  "IsExperimentalVersion": false,`,
        `  "Installed": false,`,
        `  "Modules": [`,
        `    {`,
        `      "Name": "${pluginName}",`,
        `      "Type": "Runtime",`,
        `      "LoadingPhase": "Default"`,
        `    }`,
        `  ],`,
        `  "Plugins": [`,
        ...(0, xrpa_utils_1.indent)(2, (0, xrpa_utils_1.removeLastTrailingComma)(pluginDeps.filter(entry => entry[0] !== "").map(entry => `{ "Name": "${entry[0]}", "Enabled": true },`))),
        `  ]`,
        `}`,
    ];
    fileWriter.writeFile(path_1.default.join(pluginRoot, `${pluginName}.uplugin`), lines);
}
function writeBuildFile(fileWriter, pluginRoot, pluginName, pluginDeps) {
    const lines = [
        ...CppCodeGenImpl_1.HEADER,
        `using System.IO;`,
        `using UnrealBuildTool;`,
        ``,
        `public class ${pluginName} : ModuleRules`,
        `{`,
        `  public ${pluginName}(ReadOnlyTargetRules Target) : base(Target)`,
        `  {`,
        `    CppStandard = CppStandardVersion.Cpp17;`,
        `    PCHUsage = ModuleRules.PCHUsageMode.UseExplicitOrSharedPCHs;`,
        ``,
        `    PrivateIncludePaths.AddRange(`,
        `      new string[] {`,
        `      }`,
        `    );`,
        ``,
        `    PublicDependencyModuleNames.AddRange(`,
        `      new string[]`,
        `      {`,
        `        "Core",`,
        `        "Projects",`,
        `        "Engine",`,
        `        "CoreUObject",`,
        ...(0, xrpa_utils_1.indent)(4, pluginDeps.map(entry => `"${entry[1]}",`)),
        `      }`,
        `    );`,
        ``,
        `    PrivateDependencyModuleNames.AddRange(`,
        `      new string[]`,
        `      {`,
        `      }`,
        `    );`,
        ``,
        `    DynamicallyLoadedModuleNames.AddRange(`,
        `      new string[]`,
        `      {`,
        `      }`,
        `    );`,
        `  }`,
        `}`,
    ];
    fileWriter.writeFile(path_1.default.join(pluginRoot, "Source", pluginName, `${pluginName}.Build.cs`), lines);
}
function writePluginModuleCpp(fileWriter, outDir, pluginName) {
    const lines = [
        ...CppCodeGenImpl_1.HEADER,
        `#include "${pluginName}.h"`,
        `#include "Core.h"`,
        `#include "Interfaces/IPluginManager.h"`,
        `#include "Modules/ModuleManager.h"`,
        ``,
        `#define LOCTEXT_NAMESPACE "F${pluginName}Module"`,
        ``,
        `DEFINE_LOG_CATEGORY(${pluginName}Plugin);`,
        ``,
        `void F${pluginName}Module::StartupModule() {}`,
        ``,
        `void F${pluginName}Module::ShutdownModule() {}`,
        ``,
        `#undef LOCTEXT_NAMESPACE`,
        ``,
        `IMPLEMENT_MODULE(F${pluginName}Module, ${pluginName})`,
    ];
    fileWriter.writeFile(path_1.default.join(outDir, `${pluginName}.cpp`), lines);
}
function writePluginModuleHeader(fileWriter, outDir, pluginName) {
    const lines = [
        ...CppCodeGenImpl_1.HEADER,
        `#pragma once`,
        ``,
        `#include "Modules/ModuleManager.h"`,
        ``,
        `DECLARE_LOG_CATEGORY_EXTERN(${pluginName}Plugin, Log, All);`,
        ``,
        `class F${pluginName}Module : public IModuleInterface {`,
        ` public:`,
        `  /** IModuleInterface implementation */`,
        `  virtual void StartupModule() override;`,
        `  virtual void ShutdownModule() override;`,
        `};`,
    ];
    fileWriter.writeFile(path_1.default.join(outDir, `${pluginName}.h`), lines);
}
function genPlugin(fileWriter, pluginRoot, pluginName, pluginDeps = []) {
    const resourcesDir = path_1.default.join(pluginRoot, "Resources");
    const privateSrcDir = path_1.default.join(pluginRoot, "Source", pluginName, "Private");
    const publicSrcDir = path_1.default.join(pluginRoot, "Source", pluginName, "Public");
    fileWriter.writeFileBase64(path_1.default.join(resourcesDir, "Icon128.png"), Icon128);
    writeUPlugin(fileWriter, pluginRoot, pluginName, pluginDeps);
    writeBuildFile(fileWriter, pluginRoot, pluginName, pluginDeps);
    writePluginModuleCpp(fileWriter, privateSrcDir, pluginName);
    writePluginModuleHeader(fileWriter, publicSrcDir, pluginName);
    return {
        privateSrcDir,
        publicSrcDir,
    };
}
exports.genPlugin = genPlugin;
//# sourceMappingURL=GenPlugin.js.map
