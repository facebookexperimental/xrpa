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
exports.genTypesHeader = exports.getDataStoreSchemaHashName = void 0;
const path_1 = __importDefault(require("path"));
const CppCodeGenImpl_1 = require("./CppCodeGenImpl");
const CppDatasetLibraryTypes_1 = require("./CppDatasetLibraryTypes");
function getDataStoreSchemaHashName(apiname) {
    return `${apiname.toUpperCase()}_SCHEMA_HASH`;
}
exports.getDataStoreSchemaHashName = getDataStoreSchemaHashName;
function genDatasetConfig(apiname, datamodel, namespace, includes) {
    let maxObjectCount = 0;
    let maxObjectSize = 0;
    for (const typeDef of datamodel.getCollections()) {
        maxObjectCount += typeDef.maxCount;
        maxObjectSize += typeDef.maxCount * typeDef.getTypeSize();
    }
    return [
        `static inline ${CppDatasetLibraryTypes_1.DatasetConfig.getLocalType(namespace, includes)} GenDatasetConfig() {`,
        `  ${CppDatasetLibraryTypes_1.DatasetConfig.getLocalType(namespace, includes)} config;`,
        `  config.schemaHash = ${getDataStoreSchemaHashName(apiname)};`,
        `  config.maxObjectCount = ${maxObjectCount};`,
        `  config.memPoolSize = ${maxObjectSize};`,
        `  config.changelogPoolSize = ${maxObjectCount * 8 * 32};`,
        `  config.messagePoolSize = ${datamodel.calcMessagePoolSize()};`,
        `  return config;`,
        `}`,
    ];
}
function genTypeDefinitions(namespace, datamodel, includes) {
    const ret = [];
    // forward declare the read reconciler names so that UE headers can reference them
    // (since they cannot include the DataStore headers)
    for (const typeDef of datamodel.getCollections()) {
        ret.push(`class ${typeDef.getReadAccessorType(namespace, null)};`);
    }
    ret.push("");
    // define the local types first, so that the to/fromLocal functions can use them
    for (const typeDef of datamodel.getAllTypeDefinitions()) {
        const lines = typeDef.genLocalTypeDefinition(namespace, includes);
        if (lines) {
            ret.push(...lines, "");
        }
    }
    // define the dataset types last
    for (const typeDef of datamodel.getAllTypeDefinitions()) {
        const lines = typeDef.genTypeDefinition(includes);
        if (lines) {
            ret.push(...lines, "");
        }
    }
    return ret;
}
function genTypesHeader(fileWriter, outdir, def) {
    const includes = new CppCodeGenImpl_1.CppIncludeAggregator();
    const headerName = (0, CppCodeGenImpl_1.getTypesHeaderName)(def.apiname);
    const namespace = (0, CppCodeGenImpl_1.getDataStoreName)(def.apiname);
    const schemaHash = def.datamodel.getHash();
    const hashInit = schemaHash.values.map(str => "0x" + str).join(", ");
    const lines = [
        `namespace ${namespace} {`,
        ``,
        `constexpr ${CppDatasetLibraryTypes_1.DSHashValue.getLocalType(namespace, includes)} ${getDataStoreSchemaHashName(def.apiname)}(${hashInit});`,
        ``,
        ...genDatasetConfig(def.apiname, def.datamodel, namespace, includes),
        ``,
        ...genTypeDefinitions(namespace, def.datamodel, includes),
        `} // namespace ${namespace}`,
        ``,
    ];
    lines.unshift(...CppCodeGenImpl_1.HEADER, `#pragma once`, ``, ...includes.getIncludes(headerName), ``);
    fileWriter.writeFile(path_1.default.join(outdir, headerName), lines);
}
exports.genTypesHeader = genTypesHeader;
//# sourceMappingURL=GenTypesHeader.js.map
