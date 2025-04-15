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
exports.genTypesDefinitions = exports.getDataStoreConfigName = void 0;
const path_1 = __importDefault(require("path"));
const PythonCodeGenImpl_1 = require("./PythonCodeGenImpl");
const PythonDatasetLibraryTypes_1 = require("./PythonDatasetLibraryTypes");
const TypeDefinition_1 = require("../../shared/TypeDefinition");
function getDataStoreConfigName(apiname, inNamespace, includes) {
    const fullName = (0, PythonCodeGenImpl_1.nsJoin)((0, PythonCodeGenImpl_1.getTypesHeaderNamespace)(apiname), (0, PythonCodeGenImpl_1.getDataStoreName)(apiname) + "_config", "transport_config");
    includes?.addFile({ filename: (0, PythonCodeGenImpl_1.getTypesHeaderName)(apiname), namespace: (0, PythonCodeGenImpl_1.getTypesHeaderNamespace)(apiname) });
    return (0, PythonCodeGenImpl_1.nsQualify)(fullName, inNamespace);
}
exports.getDataStoreConfigName = getDataStoreConfigName;
function genTypeDefinitions(namespace, datamodel, includes) {
    const ret = [];
    const typeDefs = datamodel.getAllTypeDefinitions();
    // define enums first
    for (const typeDef of typeDefs) {
        if (!(0, TypeDefinition_1.typeIsEnum)(typeDef)) {
            continue;
        }
        const lines = typeDef.genTypeDefinition(includes);
        if (lines) {
            ret.push(...lines, "");
        }
    }
    // define the local types first, so that the to/fromLocal functions can use them
    for (const typeDef of typeDefs) {
        const lines = typeDef.genLocalTypeDefinition(namespace, includes);
        if (lines) {
            ret.push(...lines, "");
        }
    }
    // define the dataset types last
    for (const typeDef of typeDefs) {
        if ((0, TypeDefinition_1.typeIsEnum)(typeDef)) {
            continue;
        }
        const lines = typeDef.genTypeDefinition(includes);
        if (lines) {
            ret.push(...lines, "");
        }
    }
    return ret;
}
function genTypesDefinitions(fileWriter, outdir, def) {
    const includes = new PythonCodeGenImpl_1.PythonIncludeAggregator();
    const headerName = (0, PythonCodeGenImpl_1.getTypesHeaderName)(def.apiname);
    const dataStoreName = (0, PythonCodeGenImpl_1.getDataStoreName)(def.apiname);
    const namespace = (0, PythonCodeGenImpl_1.getTypesHeaderNamespace)(def.apiname);
    const schemaHash = def.datamodel.getHash();
    const hashInit = schemaHash.values.map(str => "0x" + str).join(", ");
    const lines = [
        `class ${dataStoreName}_config:`,
        `  transport_config = ${PythonDatasetLibraryTypes_1.TransportConfig.getLocalType(namespace, includes)}(${PythonDatasetLibraryTypes_1.HashValue.getLocalType(namespace, includes)}(${hashInit}), ${def.datamodel.calcChangelogSize()})`,
        ``,
        ...genTypeDefinitions(namespace, def.datamodel, includes),
        ``,
    ];
    lines.unshift(...PythonCodeGenImpl_1.HEADER, ``, ...includes.getNamespaceImports(namespace), ``);
    fileWriter.writeFile(path_1.default.join(outdir, headerName), lines);
}
exports.genTypesDefinitions = genTypesDefinitions;
//# sourceMappingURL=GenTypesDefinitions.js.map
