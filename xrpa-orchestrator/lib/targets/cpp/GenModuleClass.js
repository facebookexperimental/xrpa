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
exports.genModuleClass = exports.genDatasetDeinitializers = exports.genDatasetDeclarations = exports.getDatasetVarName = exports.getModuleHeaderName = void 0;
const path_1 = __importDefault(require("path"));
const Helpers_1 = require("../../shared/Helpers");
const CppCodeGenImpl_1 = require("./CppCodeGenImpl");
const CppDatasetLibraryTypes_1 = require("./CppDatasetLibraryTypes");
function getModuleHeaderName(moduleDef) {
    return `${moduleDef.name}Module.h`;
}
exports.getModuleHeaderName = getModuleHeaderName;
function getDatasetVarName(moduleDef, storeDef) {
    return `${moduleDef.name}${storeDef.dataset}Dataset`;
}
exports.getDatasetVarName = getDatasetVarName;
function genDatasetDeclarations(moduleDef, namespace, includes, semicolonTerminate) {
    const lines = [];
    includes.addFile({
        filename: "<memory>",
        typename: "std::shared_ptr",
    });
    for (const storeDef of moduleDef.getDataStores()) {
        lines.push(`std::shared_ptr<${CppDatasetLibraryTypes_1.DatasetInterface.getLocalType(namespace, includes)}> ${getDatasetVarName(moduleDef, storeDef)}` + (semicolonTerminate ? ";" : ""));
    }
    return lines;
}
exports.genDatasetDeclarations = genDatasetDeclarations;
function genDatasetDeinitializers(moduleDef) {
    const lines = [];
    for (const storeDef of moduleDef.getDataStores()) {
        lines.push(`${getDatasetVarName(moduleDef, storeDef)}.reset();`);
    }
    return lines;
}
exports.genDatasetDeinitializers = genDatasetDeinitializers;
function genDataStoreInits(moduleDef, includes) {
    return moduleDef.getDataStores().map(storeDef => {
        const dataStoreName = (0, CppCodeGenImpl_1.getDataStoreName)(storeDef.apiname);
        includes.addFile({
            filename: (0, CppCodeGenImpl_1.getDataStoreHeaderName)(storeDef.apiname),
            namespace: dataStoreName,
        });
        return `${(0, Helpers_1.lowerFirst)(dataStoreName)} = std::make_shared<${dataStoreName}::${dataStoreName}>(${getDatasetVarName(moduleDef, storeDef)});`;
    });
}
function genDataStoreDecls(moduleDef) {
    return moduleDef.getDataStores().map(storeDef => {
        const dataStoreName = (0, CppCodeGenImpl_1.getDataStoreName)(storeDef.apiname);
        return `std::shared_ptr<${dataStoreName}::${dataStoreName}> ${(0, Helpers_1.lowerFirst)(dataStoreName)};`;
    });
}
function genDataStoreTicks(moduleDef, outputsOnly) {
    return moduleDef.getDataStores().filter(storeDef => {
        const hasOnlyOutputs = storeDef.getInputReconcilers().length === 0;
        return outputsOnly === hasOnlyOutputs;
    }).map(storeDef => `${(0, Helpers_1.lowerFirst)((0, CppCodeGenImpl_1.getDataStoreName)(storeDef.apiname))}->tick();`);
}
function genDataStoreShutdowns(moduleDef) {
    return moduleDef.getDataStores().map(storeDef => `${(0, Helpers_1.lowerFirst)((0, CppCodeGenImpl_1.getDataStoreName)(storeDef.apiname))}->shutdown();`);
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
        `  explicit ${className}(${genDatasetDeclarations(moduleDef, namespace, includes, false).join(", ")}) {`,
        ...(0, Helpers_1.indent)(2, genDataStoreInits(moduleDef, includes)),
        `  }`,
        ``,
        ...(0, Helpers_1.indent)(1, genDataStoreDecls(moduleDef)),
        ``,
        ...(0, Helpers_1.indent)(1, moduleSettings),
        ``,
        `  virtual void tickInputs() override {`,
        ...(0, Helpers_1.indent)(2, genDataStoreTicks(moduleDef, false)),
        `  }`,
        ``,
        `  virtual void tickOutputs() override {`,
        ...(0, Helpers_1.indent)(2, genDataStoreTicks(moduleDef, true)),
        `  }`,
        ``,
        `  virtual void shutdown() override {`,
        ...(0, Helpers_1.indent)(2, genDataStoreShutdowns(moduleDef)),
        `  }`,
        `};`,
        ``,
    ];
    lines.unshift(...CppCodeGenImpl_1.HEADER, `#pragma once`, ``, ...includes.getIncludes(headerName), ``);
    fileWriter.writeFile(path_1.default.join(libDir, headerName), lines);
}
exports.genModuleClass = genModuleClass;
//# sourceMappingURL=GenModuleClass.js.map
