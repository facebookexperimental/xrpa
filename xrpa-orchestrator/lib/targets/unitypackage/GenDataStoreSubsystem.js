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
const GenTransportSubsystem_1 = require("./GenTransportSubsystem");
const UnityHelpers_1 = require("./UnityHelpers");
function getDataStoreSubsystemName(storeDef) {
    return `${(0, CsharpCodeGenImpl_1.getDataStoreName)(storeDef.apiname)}Subsystem`;
}
exports.getDataStoreSubsystemName = getDataStoreSubsystemName;
function genDataStoreSubsystem(fileWriter, outSrcDir, storeDef) {
    const className = getDataStoreSubsystemName(storeDef);
    const dataStoreClassName = (0, CsharpCodeGenImpl_1.getDataStoreClass)(storeDef.apiname, "", null);
    const lines = (0, UnityHelpers_1.genUnitySingleton)(className, [
        `var transportSubsystem = ${(0, GenTransportSubsystem_1.getTransportSubsystemName)(storeDef)}.Instance;`,
        `DataStore = new ${dataStoreClassName}(transportSubsystem.${(0, GenTransportSubsystem_1.getInboundTransportVarName)(storeDef)}, transportSubsystem.${(0, GenTransportSubsystem_1.getOutboundTransportVarName)(storeDef)});`,
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
    lines.unshift(...CsharpCodeGenImpl_1.HEADER, ``, `using UnityEngine;`, ``);
    fileWriter.writeFile(path_1.default.join(outSrcDir, `${className}.cs`), lines);
}
exports.genDataStoreSubsystem = genDataStoreSubsystem;
//# sourceMappingURL=GenDataStoreSubsystem.js.map
