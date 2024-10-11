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
exports.genModuleClass = exports.genDatasetDeclarations = exports.genOutboundDatasetDeclaration = exports.genInboundDatasetDeclaration = exports.getOutboundDatasetVarName = exports.getInboundDatasetVarName = exports.getModuleHeaderName = void 0;
const path_1 = __importDefault(require("path"));
const Helpers_1 = require("../../shared/Helpers");
const CppCodeGenImpl_1 = require("./CppCodeGenImpl");
const CppDatasetLibraryTypes_1 = require("./CppDatasetLibraryTypes");
function getModuleHeaderName(moduleDef) {
    return `${moduleDef.name}Module.h`;
}
exports.getModuleHeaderName = getModuleHeaderName;
function getInboundDatasetVarName(storeDef) {
    return `${storeDef.dataset}InboundDataset`;
}
exports.getInboundDatasetVarName = getInboundDatasetVarName;
function getOutboundDatasetVarName(storeDef) {
    return `${storeDef.dataset}OutboundDataset`;
}
exports.getOutboundDatasetVarName = getOutboundDatasetVarName;
function genInboundDatasetDeclaration(storeDef, namespace, includes, semicolonTerminate) {
    includes.addFile({
        filename: "<memory>",
        typename: "std::shared_ptr",
    });
    return `std::shared_ptr<${CppDatasetLibraryTypes_1.DatasetInterface.getLocalType(namespace, includes)}> ${getInboundDatasetVarName(storeDef)}` + (semicolonTerminate ? ";" : "");
}
exports.genInboundDatasetDeclaration = genInboundDatasetDeclaration;
function genOutboundDatasetDeclaration(storeDef, namespace, includes, semicolonTerminate) {
    includes.addFile({
        filename: "<memory>",
        typename: "std::shared_ptr",
    });
    return `std::shared_ptr<${CppDatasetLibraryTypes_1.DatasetInterface.getLocalType(namespace, includes)}> ${getOutboundDatasetVarName(storeDef)}` + (semicolonTerminate ? ";" : "");
}
exports.genOutboundDatasetDeclaration = genOutboundDatasetDeclaration;
function genDatasetDeclarations(moduleDef, namespace, includes, semicolonTerminate) {
    const lines = [];
    includes.addFile({
        filename: "<memory>",
        typename: "std::shared_ptr",
    });
    for (const storeDef of moduleDef.getDataStores()) {
        lines.push(genInboundDatasetDeclaration(storeDef, namespace, includes, semicolonTerminate));
        lines.push(genOutboundDatasetDeclaration(storeDef, namespace, includes, semicolonTerminate));
    }
    return lines;
}
exports.genDatasetDeclarations = genDatasetDeclarations;
function genDataStoreInits(moduleDef, includes) {
    return moduleDef.getDataStores().map(storeDef => {
        const dataStoreName = (0, CppCodeGenImpl_1.getDataStoreName)(storeDef.apiname);
        includes.addFile({
            filename: (0, CppCodeGenImpl_1.getDataStoreHeaderName)(storeDef.apiname),
            namespace: dataStoreName,
        });
        return `${(0, Helpers_1.lowerFirst)(dataStoreName)} = std::make_shared<${dataStoreName}::${dataStoreName}>(${getInboundDatasetVarName(storeDef)}, ${getOutboundDatasetVarName(storeDef)});`;
    });
}
function genDataStoreDecls(moduleDef) {
    return moduleDef.getDataStores().map(storeDef => {
        const dataStoreName = (0, CppCodeGenImpl_1.getDataStoreName)(storeDef.apiname);
        return `std::shared_ptr<${dataStoreName}::${dataStoreName}> ${(0, Helpers_1.lowerFirst)(dataStoreName)};`;
    });
}
function genModuleSettings(namespace, includes, moduleDef) {
    const settings = moduleDef.getSettings();
    if ((0, Helpers_1.objectIsEmpty)(settings.getAllFields())) {
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
        `class ${className} : public ${CppDatasetLibraryTypes_1.DatasetModule.getLocalType(namespace, includes)} {`,
        ` public:`,
        `  ${className}(${genDatasetDeclarations(moduleDef, namespace, includes, false).join(", ")}) {`,
        ...(0, Helpers_1.indent)(2, genDataStoreInits(moduleDef, includes)),
        `  }`,
        ``,
        ...(0, Helpers_1.indent)(1, genDataStoreDecls(moduleDef)),
        ``,
        ...(0, Helpers_1.indent)(1, moduleSettings),
        ``,
        `  virtual void tickInputs() override {`,
        ...(0, Helpers_1.indent)(2, moduleDef.getDataStores().map(storeDef => `${(0, Helpers_1.lowerFirst)((0, CppCodeGenImpl_1.getDataStoreName)(storeDef.apiname))}->tickInbound();`)),
        `  }`,
        ``,
        `  virtual void tickOutputs() override {`,
        ...(0, Helpers_1.indent)(2, moduleDef.getDataStores().map(storeDef => `${(0, Helpers_1.lowerFirst)((0, CppCodeGenImpl_1.getDataStoreName)(storeDef.apiname))}->tickOutbound();`)),
        `  }`,
        ``,
        `  virtual void shutdown() override {`,
        ...(0, Helpers_1.indent)(2, moduleDef.getDataStores().map(storeDef => `${(0, Helpers_1.lowerFirst)((0, CppCodeGenImpl_1.getDataStoreName)(storeDef.apiname))}->shutdown();`)),
        `  }`,
        `};`,
        ``,
    ];
    lines.unshift(...CppCodeGenImpl_1.HEADER, `#pragma once`, ``, ...includes.getIncludes(headerName), ``);
    fileWriter.writeFile(path_1.default.join(libDir, headerName), lines);
}
exports.genModuleClass = genModuleClass;
//# sourceMappingURL=GenModuleClass.js.map
