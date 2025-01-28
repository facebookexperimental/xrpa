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
exports.genModuleClass = exports.genTransportDeclarations = exports.genOutboundTransportDeclaration = exports.genInboundTransportDeclaration = exports.getOutboundTransportVarName = exports.getInboundTransportVarName = exports.getModuleHeaderName = void 0;
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const path_1 = __importDefault(require("path"));
const CppCodeGenImpl_1 = require("./CppCodeGenImpl");
const CppDatasetLibraryTypes_1 = require("./CppDatasetLibraryTypes");
function getModuleHeaderName(moduleDef) {
    return `${moduleDef.name}Module.h`;
}
exports.getModuleHeaderName = getModuleHeaderName;
function getInboundTransportVarName(storeDef) {
    return `${storeDef.dataset}InboundTransport`;
}
exports.getInboundTransportVarName = getInboundTransportVarName;
function getOutboundTransportVarName(storeDef) {
    return `${storeDef.dataset}OutboundTransport`;
}
exports.getOutboundTransportVarName = getOutboundTransportVarName;
function genInboundTransportDeclaration(storeDef, namespace, includes, semicolonTerminate) {
    includes.addFile({
        filename: "<memory>",
        typename: "std::shared_ptr",
    });
    return `std::shared_ptr<${CppDatasetLibraryTypes_1.TransportStream.getLocalType(namespace, includes)}> ${getInboundTransportVarName(storeDef)}` + (semicolonTerminate ? ";" : "");
}
exports.genInboundTransportDeclaration = genInboundTransportDeclaration;
function genOutboundTransportDeclaration(storeDef, namespace, includes, semicolonTerminate) {
    includes.addFile({
        filename: "<memory>",
        typename: "std::shared_ptr",
    });
    return `std::shared_ptr<${CppDatasetLibraryTypes_1.TransportStream.getLocalType(namespace, includes)}> ${getOutboundTransportVarName(storeDef)}` + (semicolonTerminate ? ";" : "");
}
exports.genOutboundTransportDeclaration = genOutboundTransportDeclaration;
function genTransportDeclarations(moduleDef, namespace, includes, semicolonTerminate) {
    const lines = [];
    includes.addFile({
        filename: "<memory>",
        typename: "std::shared_ptr",
    });
    for (const storeDef of moduleDef.getDataStores()) {
        lines.push(genInboundTransportDeclaration(storeDef, namespace, includes, semicolonTerminate));
        lines.push(genOutboundTransportDeclaration(storeDef, namespace, includes, semicolonTerminate));
    }
    return lines;
}
exports.genTransportDeclarations = genTransportDeclarations;
function genDataStoreInits(moduleDef, namespace, includes) {
    return moduleDef.getDataStores().map(storeDef => {
        const dataStoreName = (0, CppCodeGenImpl_1.getDataStoreName)(storeDef.apiname);
        return `${(0, xrpa_utils_1.lowerFirst)(dataStoreName)} = std::make_shared<${(0, CppCodeGenImpl_1.getDataStoreClass)(storeDef.apiname, namespace, includes)}>(${getInboundTransportVarName(storeDef)}, ${getOutboundTransportVarName(storeDef)});`;
    });
}
function genDataStoreDecls(moduleDef, namespace, includes) {
    return moduleDef.getDataStores().map(storeDef => {
        const dataStoreName = (0, CppCodeGenImpl_1.getDataStoreName)(storeDef.apiname);
        return `std::shared_ptr<${(0, CppCodeGenImpl_1.getDataStoreClass)(storeDef.apiname, namespace, includes)}> ${(0, xrpa_utils_1.lowerFirst)(dataStoreName)};`;
    });
}
function genModuleSettings(namespace, includes, moduleDef) {
    const settings = moduleDef.getSettings();
    if ((0, xrpa_utils_1.objectIsEmpty)(settings.getAllFields())) {
        return [];
    }
    const defLines = settings.genLocalTypeDefinition(namespace, includes);
    if (!defLines) {
        return [];
    }
    return defLines.concat(`${settings.declareLocalVar(namespace, includes, "settings")};`);
}
function genModuleClass(fileWriter, libDir, moduleDef) {
    const namespace = "";
    const className = `${moduleDef.name}Module`;
    const headerName = getModuleHeaderName(moduleDef);
    const includes = new CppCodeGenImpl_1.CppIncludeAggregator([
        "<memory>",
    ]);
    const moduleSettings = genModuleSettings(namespace, includes, moduleDef);
    const lines = [
        `class ${className} : public ${CppDatasetLibraryTypes_1.XrpaModule.getLocalType(namespace, includes)} {`,
        ` public:`,
        `  ${className}(${genTransportDeclarations(moduleDef, namespace, includes, false).join(", ")}) {`,
        ...(0, xrpa_utils_1.indent)(2, genDataStoreInits(moduleDef, namespace, includes)),
        `  }`,
        ``,
        `  virtual ~${className}() override {`,
        `    shutdown();`,
        `  }`,
        ``,
        ...(0, xrpa_utils_1.indent)(1, genDataStoreDecls(moduleDef, namespace, includes)),
        ``,
        ...(0, xrpa_utils_1.indent)(1, moduleSettings),
        ``,
        `  virtual void shutdown() override {`,
        ...(0, xrpa_utils_1.indent)(2, moduleDef.getDataStores().map(storeDef => `${(0, xrpa_utils_1.lowerFirst)((0, CppCodeGenImpl_1.getDataStoreName)(storeDef.apiname))}->shutdown();`)),
        `  }`,
        ``,
        ` protected:`,
        `  virtual void tickInputs() override {`,
        ...(0, xrpa_utils_1.indent)(2, moduleDef.getDataStores().map(storeDef => `${(0, xrpa_utils_1.lowerFirst)((0, CppCodeGenImpl_1.getDataStoreName)(storeDef.apiname))}->tickInbound();`)),
        `  }`,
        ``,
        `  virtual void tickOutputs() override {`,
        ...(0, xrpa_utils_1.indent)(2, moduleDef.getDataStores().map(storeDef => `${(0, xrpa_utils_1.lowerFirst)((0, CppCodeGenImpl_1.getDataStoreName)(storeDef.apiname))}->tickOutbound();`)),
        `  }`,
        `};`,
        ``,
    ];
    lines.unshift(...CppCodeGenImpl_1.HEADER, `#pragma once`, ``, ...includes.getIncludes(headerName), ``);
    fileWriter.writeFile(path_1.default.join(libDir, headerName), lines);
}
exports.genModuleClass = genModuleClass;
//# sourceMappingURL=GenModuleClass.js.map
