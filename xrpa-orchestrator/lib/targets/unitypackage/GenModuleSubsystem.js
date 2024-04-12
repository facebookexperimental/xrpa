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
exports.genModuleSubsystem = exports.getDatasetVarName = exports.getModuleSubsystemName = void 0;
const path_1 = __importDefault(require("path"));
const CsharpCodeGenImpl_1 = require("../csharp/CsharpCodeGenImpl");
const CsharpDatasetLibraryTypes_1 = require("../csharp/CsharpDatasetLibraryTypes");
const GenDataStoreSubsystem_1 = require("./GenDataStoreSubsystem");
const UnityHelpers_1 = require("./UnityHelpers");
function getModuleSubsystemName(moduleDef) {
    return `${moduleDef.name}ModuleSubsystem`;
}
exports.getModuleSubsystemName = getModuleSubsystemName;
function getDatasetVarName(moduleDef, storeDef) {
    return `${moduleDef.name}${storeDef.dataset}Dataset`;
}
exports.getDatasetVarName = getDatasetVarName;
function genDatasetDeclarations(moduleDef, namespace, includes) {
    const lines = [];
    for (const storeDef of moduleDef.getDataStores()) {
        lines.push(`public ${CsharpDatasetLibraryTypes_1.DatasetInterface.declareLocalVar(namespace, includes, getDatasetVarName(moduleDef, storeDef))};`);
    }
    return lines;
}
function genDatasetInitializers(moduleDef, namespace, includes) {
    const lines = [];
    for (const storeDef of moduleDef.getDataStores()) {
        const datasetVar = getDatasetVarName(moduleDef, storeDef);
        includes.addFile({ filename: (0, CsharpCodeGenImpl_1.getTypesHeaderName)(storeDef.apiname) });
        lines.push(`{`, `  var local${datasetVar} = new ${CsharpDatasetLibraryTypes_1.SharedDataset.getLocalType(namespace, includes)}("${storeDef.dataset}", ${(0, CsharpCodeGenImpl_1.getDataStoreName)(storeDef.apiname)}.${(0, CsharpCodeGenImpl_1.getDataStoreName)(storeDef.apiname)}Config.GenDatasetConfig());`, `  local${datasetVar}.Initialize();`, `  ${datasetVar} = local${datasetVar};`, `}`);
    }
    return lines;
}
function genDatasetDeinitializers(moduleDef) {
    const lines = [];
    for (const storeDef of moduleDef.getDataStores()) {
        lines.push(`${(0, GenDataStoreSubsystem_1.getDataStoreSubsystemName)(storeDef)}.MaybeInstance?.Shutdown();`, `${getDatasetVarName(moduleDef, storeDef)}?.Dispose();`, `${getDatasetVarName(moduleDef, storeDef)} = null;`);
    }
    return lines;
}
function genModuleSubsystem(fileWriter, outDir, moduleDef) {
    const className = getModuleSubsystemName(moduleDef);
    const namespace = "";
    const includes = new CsharpCodeGenImpl_1.CsIncludeAggregator(["UnityEngine"]);
    const lines = (0, UnityHelpers_1.genUnitySingleton)(className, genDatasetInitializers(moduleDef, namespace, includes), genDatasetDeinitializers(moduleDef), genDatasetDeclarations(moduleDef, namespace, includes));
    lines.unshift(...CsharpCodeGenImpl_1.HEADER, ...includes.getNamespaceImports(), ``);
    fileWriter.writeFile(path_1.default.join(outDir, `${className}.cs`), lines);
}
exports.genModuleSubsystem = genModuleSubsystem;
//# sourceMappingURL=GenModuleSubsystem.js.map
