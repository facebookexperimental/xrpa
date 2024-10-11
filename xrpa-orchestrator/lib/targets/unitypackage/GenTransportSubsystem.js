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
exports.genTransportSubsystem = exports.getOutboundDatasetVarName = exports.getInboundDatasetVarName = exports.getTransportSubsystemName = void 0;
const path_1 = __importDefault(require("path"));
const CsharpCodeGenImpl_1 = require("../csharp/CsharpCodeGenImpl");
const CsharpDatasetLibraryTypes_1 = require("../csharp/CsharpDatasetLibraryTypes");
const GenDataStoreSubsystem_1 = require("./GenDataStoreSubsystem");
const UnityHelpers_1 = require("./UnityHelpers");
function getTransportSubsystemName(storeDef) {
    return `${storeDef.apiname}TransportSubsystem`;
}
exports.getTransportSubsystemName = getTransportSubsystemName;
function getInboundDatasetVarName(storeDef) {
    return `${storeDef.dataset}InboundDataset`;
}
exports.getInboundDatasetVarName = getInboundDatasetVarName;
function getOutboundDatasetVarName(storeDef) {
    return `${storeDef.dataset}OutboundDataset`;
}
exports.getOutboundDatasetVarName = getOutboundDatasetVarName;
function genDatasetDeclaration(storeDef, namespace, includes) {
    return [
        `public ${CsharpDatasetLibraryTypes_1.DatasetInterface.declareLocalVar(namespace, includes, getInboundDatasetVarName(storeDef))};`,
        `public ${CsharpDatasetLibraryTypes_1.DatasetInterface.declareLocalVar(namespace, includes, getOutboundDatasetVarName(storeDef))};`,
    ];
}
function genDatasetInitializer(storeDef, namespace, includes) {
    includes.addFile({ filename: (0, CsharpCodeGenImpl_1.getTypesHeaderName)(storeDef.apiname) });
    const inboundDatasetVar = getInboundDatasetVarName(storeDef);
    const outboundDatasetVar = getOutboundDatasetVarName(storeDef);
    const inboundMemMarker = storeDef.isModuleProgramInterface ? "Input" : "Output";
    const outboundMemMarker = storeDef.isModuleProgramInterface ? "Output" : "Input";
    return [
        `{`,
        `  var local${inboundDatasetVar} = new ${CsharpDatasetLibraryTypes_1.SharedDataset.getLocalType(namespace, includes)}("${storeDef.dataset}${inboundMemMarker}", ${(0, CsharpCodeGenImpl_1.getDataStoreName)(storeDef.apiname)}.${(0, CsharpCodeGenImpl_1.getDataStoreName)(storeDef.apiname)}Config.GenDatasetConfig());`,
        `  local${inboundDatasetVar}.Initialize();`,
        `  ${inboundDatasetVar} = local${inboundDatasetVar};`,
        ``,
        `  var local${outboundDatasetVar} = new ${CsharpDatasetLibraryTypes_1.SharedDataset.getLocalType(namespace, includes)}("${storeDef.dataset}${outboundMemMarker}", ${(0, CsharpCodeGenImpl_1.getDataStoreName)(storeDef.apiname)}.${(0, CsharpCodeGenImpl_1.getDataStoreName)(storeDef.apiname)}Config.GenDatasetConfig());`,
        `  local${outboundDatasetVar}.Initialize();`,
        `  ${outboundDatasetVar} = local${outboundDatasetVar};`,
        `}`,
    ];
}
function genDatasetDeinitializer(storeDef) {
    return [
        `${(0, GenDataStoreSubsystem_1.getDataStoreSubsystemName)(storeDef)}.MaybeInstance?.Shutdown();`,
        `${getOutboundDatasetVarName(storeDef)}?.Dispose();`,
        `${getOutboundDatasetVarName(storeDef)} = null;`,
        `${getInboundDatasetVarName(storeDef)}?.Dispose();`,
        `${getInboundDatasetVarName(storeDef)} = null;`,
    ];
}
function genTransportSubsystem(fileWriter, outDir, storeDef) {
    const className = getTransportSubsystemName(storeDef);
    const namespace = "";
    const includes = new CsharpCodeGenImpl_1.CsIncludeAggregator(["UnityEngine"]);
    const lines = (0, UnityHelpers_1.genUnitySingleton)(className, genDatasetInitializer(storeDef, namespace, includes), genDatasetDeinitializer(storeDef), genDatasetDeclaration(storeDef, namespace, includes));
    lines.unshift(...CsharpCodeGenImpl_1.HEADER, ...includes.getNamespaceImports(), ``);
    fileWriter.writeFile(path_1.default.join(outDir, `${className}.cs`), lines);
}
exports.genTransportSubsystem = genTransportSubsystem;
//# sourceMappingURL=GenTransportSubsystem.js.map
