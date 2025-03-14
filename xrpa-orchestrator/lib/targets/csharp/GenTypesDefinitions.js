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
exports.genTypesDefinitions = void 0;
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const path_1 = __importDefault(require("path"));
const CsharpCodeGenImpl_1 = require("./CsharpCodeGenImpl");
const CsharpDatasetLibraryTypes_1 = require("./CsharpDatasetLibraryTypes");
function genTransportConfig(apiname, datamodel, namespace, includes, hashInit) {
    return [
        `public static ${CsharpDatasetLibraryTypes_1.TransportConfig.getLocalType(namespace, includes)} GenTransportConfig() {`,
        `  ${CsharpDatasetLibraryTypes_1.TransportConfig.getLocalType(namespace, includes)} config = new();`,
        `  config.SchemaHash = new ${CsharpDatasetLibraryTypes_1.HashValue.getLocalType(namespace, includes)}(${hashInit});`,
        `  config.ChangelogByteCount = ${datamodel.calcChangelogSize()};`,
        `  return config;`,
        `}`,
    ];
}
function genTypeDefinitions(namespace, datamodel, includes) {
    const ret = [];
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
function genTypesDefinitions(fileWriter, outdir, def) {
    const includes = new CsharpCodeGenImpl_1.CsIncludeAggregator([
        "System.Runtime.InteropServices",
    ]);
    const headerName = (0, CsharpCodeGenImpl_1.getTypesHeaderName)(def.apiname);
    const namespace = (0, CsharpCodeGenImpl_1.getTypesHeaderNamespace)(def.apiname);
    const schemaHash = def.datamodel.getHash();
    const hashInit = schemaHash.values.map(str => "0x" + str).join(", ");
    const lines = [
        `namespace ${namespace} {`,
        ``,
        `public class ${namespace}Config {`,
        ...(0, xrpa_utils_1.indent)(1, genTransportConfig(def.apiname, def.datamodel, namespace, includes, hashInit)),
        `}`,
        ``,
        ...genTypeDefinitions(namespace, def.datamodel, includes),
        `} // namespace ${namespace}`,
        ``,
    ];
    lines.unshift(...CsharpCodeGenImpl_1.HEADER, ``, ...includes.getNamespaceImports(namespace), ``);
    fileWriter.writeFile(path_1.default.join(outdir, headerName), lines);
}
exports.genTypesDefinitions = genTypesDefinitions;
//# sourceMappingURL=GenTypesDefinitions.js.map
