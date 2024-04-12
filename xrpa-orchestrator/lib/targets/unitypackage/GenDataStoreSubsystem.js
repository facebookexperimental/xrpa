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
const CsharpCodeGenImpl_1 = require("../csharp/CsharpCodeGenImpl");
const GenModuleSubsystem_1 = require("./GenModuleSubsystem");
const UnityHelpers_1 = require("./UnityHelpers");
function getDataStoreSubsystemName(storeDef) {
    return `${(0, CsharpCodeGenImpl_1.getDataStoreName)(storeDef.apiname)}Subsystem`;
}
exports.getDataStoreSubsystemName = getDataStoreSubsystemName;
function genDataStoreSubsystem(fileWriter, outSrcDir, moduleDef, storeDef) {
    const className = getDataStoreSubsystemName(storeDef);
    const dataStoreName = (0, CsharpCodeGenImpl_1.getDataStoreName)(storeDef.apiname);
    const lines = (0, UnityHelpers_1.genUnitySingleton)(className, [
        `DataStore = new ${dataStoreName}.${dataStoreName}(${(0, GenModuleSubsystem_1.getModuleSubsystemName)(moduleDef)}.Instance.${(0, GenModuleSubsystem_1.getDatasetVarName)(moduleDef, storeDef)});`,
    ], [
        `DataStore?.Shutdown();`,
        `DataStore = null;`,
    ], [
        `void LateUpdate() {`,
        `  DataStore?.Tick();`,
        `}`,
        ``,
        `public void Shutdown() {`,
        `  OnDestroy();`,
        `}`,
        ``,
        `public ${dataStoreName}.${dataStoreName} DataStore;`,
    ]);
    lines.unshift(...CsharpCodeGenImpl_1.HEADER, ``, `using UnityEngine;`, ``);
    fileWriter.writeFile(path_1.default.join(outSrcDir, `${className}.cs`), lines);
}
exports.genDataStoreSubsystem = genDataStoreSubsystem;
//# sourceMappingURL=GenDataStoreSubsystem.js.map
