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
exports.genStandaloneBuck = exports.genStandaloneCpp = exports.genTransportDeinitializer = exports.genTransportInitializer = void 0;
const xrpa_file_utils_1 = require("@xrpa/xrpa-file-utils");
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const path_1 = __importDefault(require("path"));
const CppCodeGenImpl_1 = require("./CppCodeGenImpl");
const CppDatasetLibraryTypes_1 = require("./CppDatasetLibraryTypes");
const GenModuleClass_1 = require("./GenModuleClass");
function genMainStandalone(fileWriter, outdir) {
    const lines = [
        ...CppCodeGenImpl_1.HEADER,
        `#include "Standalone.h"`,
        ``,
        `int main(int argc, char** argv) {`,
        `  return RunStandalone(argc, argv);`,
        `}`,
        ``,
    ];
    fileWriter.writeFile(path_1.default.join(outdir, "MainStandalone.cpp"), lines);
}
function genStandaloneHeader(fileWriter, outdir) {
    const lines = [
        ...CppCodeGenImpl_1.HEADER,
        `#pragma once`,
        ``,
        `#ifdef BUILDING_MAIN_STANDALONE`,
        `#define DLLEXPORT __declspec(dllexport)`,
        `#else`,
        `#define DLLEXPORT __declspec(dllimport)`,
        `#endif`,
        ``,
        `extern "C" {`,
        `DLLEXPORT int RunStandalone(int argc, char** argv);`,
        `}`,
        ``,
    ];
    fileWriter.writeFile(path_1.default.join(outdir, "Standalone.h"), lines);
}
function genTransportInitializer(storeDef, namespace, includes) {
    includes.addFile({ filename: (0, CppCodeGenImpl_1.getTypesHeaderName)(storeDef.apiname) });
    const inboundTransportVar = (0, GenModuleClass_1.getInboundTransportVarName)(storeDef);
    const outboundTransportVar = (0, GenModuleClass_1.getOutboundTransportVarName)(storeDef);
    const inboundMemMarker = storeDef.isModuleProgramInterface ? "Input" : "Output";
    const outboundMemMarker = storeDef.isModuleProgramInterface ? "Output" : "Input";
    return [
        `{`,
        `  auto local${inboundTransportVar} = std::make_shared<${CppDatasetLibraryTypes_1.SharedMemoryTransportStream.getLocalType(namespace, includes)}>("${storeDef.dataset}${inboundMemMarker}", ${(0, CppCodeGenImpl_1.getTypesHeaderNamespace)(storeDef.apiname)}::GenTransportConfig());`,
        `  ${inboundTransportVar} = local${inboundTransportVar};`,
        ``,
        `  auto local${outboundTransportVar} = std::make_shared<${CppDatasetLibraryTypes_1.SharedMemoryTransportStream.getLocalType(namespace, includes)}>("${storeDef.dataset}${outboundMemMarker}", ${(0, CppCodeGenImpl_1.getTypesHeaderNamespace)(storeDef.apiname)}::GenTransportConfig());`,
        `  ${outboundTransportVar} = local${outboundTransportVar};`,
        `}`,
    ];
}
exports.genTransportInitializer = genTransportInitializer;
function genTransportDeinitializer(storeDef) {
    return [
        `${(0, GenModuleClass_1.getOutboundTransportVarName)(storeDef)}.reset();`,
        `${(0, GenModuleClass_1.getInboundTransportVarName)(storeDef)}.reset();`,
    ];
}
exports.genTransportDeinitializer = genTransportDeinitializer;
function genSettingsParsing(moduleDef) {
    const fields = moduleDef.getSettings().getAllFields();
    if ((0, xrpa_utils_1.objectIsEmpty)(fields)) {
        return [];
    }
    const lines = [`CLI::App app{"${moduleDef.name}"};`];
    for (const key in fields) {
        const desc = (fields[key].description ?? key).replace(/\n/g, "  ").replace(/"/g, "\\\"");
        lines.push(`app.add_option("--${key}", moduleData->settings.${key}, "${desc}");`);
    }
    lines.push(`try {`);
    lines.push(`  app.parse(Xrpa::processCommandLine(argc, argv));`);
    lines.push(`} catch(const CLI::ParseError &e) {`);
    lines.push(`  app.exit(e);`);
    lines.push(`}`);
    return lines;
}
function genStandaloneWrapper(fileWriter, outdir, moduleDef) {
    const moduleClassName = `${moduleDef.name}Module`;
    const namespace = "";
    const includes = new CppCodeGenImpl_1.CppIncludeAggregator([
        "<memory>",
        "<thread>",
        (0, GenModuleClass_1.getModuleHeaderName)(moduleDef),
    ], headerFile => {
        if (headerFile.startsWith(`"`)) {
            return `<lib/${headerFile.slice(1, -1)}>`;
        }
        return headerFile;
    });
    if (!(0, xrpa_utils_1.objectIsEmpty)(moduleDef.getSettings().getAllFields())) {
        includes.addFile({ filename: "<xrpa-runtime/external_utils/CommandLineUtils.h>" });
        includes.addFile({ filename: "<CLI/CLI.hpp>" });
    }
    const transportVars = [];
    for (const storeDef of moduleDef.getDataStores()) {
        transportVars.push((0, GenModuleClass_1.getInboundTransportVarName)(storeDef));
        transportVars.push((0, GenModuleClass_1.getOutboundTransportVarName)(storeDef));
    }
    const lines = [
        `void EntryPoint(${moduleClassName}* moduleData);`,
        ``,
        `int RunStandalone(int argc, char** argv) {`,
        ...(0, xrpa_utils_1.indent)(1, (0, GenModuleClass_1.genTransportDeclarations)(moduleDef, namespace, includes, true)),
        ...(0, xrpa_utils_1.indent)(1, moduleDef.getDataStores().map(storeDef => genTransportInitializer(storeDef, namespace, includes))),
        `  auto moduleData = std::make_unique<${moduleClassName}>(${transportVars.join(", ")});`,
        ...(0, xrpa_utils_1.indent)(1, genSettingsParsing(moduleDef)),
        ``,
        `  std::thread dataThread(EntryPoint, moduleData.get());`,
        `  std::getchar();`,
        `  moduleData->stop();`,
        `  dataThread.join();`,
        `  return 0;`,
        `}`,
        ``,
    ];
    lines.unshift(...CppCodeGenImpl_1.HEADER, `#include "Standalone.h"`, ``, ...includes.getIncludes(), ``);
    fileWriter.writeFile(path_1.default.join(outdir, "StandaloneWrapper.cpp"), lines);
}
function genStandaloneCpp(fileWriter, outdir, moduleDef) {
    genMainStandalone(fileWriter, outdir);
    genStandaloneHeader(fileWriter, outdir);
    genStandaloneWrapper(fileWriter, outdir, moduleDef);
}
exports.genStandaloneCpp = genStandaloneCpp;
function genStandaloneBuck(fileWriter, outdir, runtimeDir, buckTarget, moduleDef, oncall) {
    fileWriter.writeFile(path_1.default.join(outdir, "BUCK"), async () => {
        const buckRoot = await (0, xrpa_file_utils_1.buckRootDir)();
        const runtimeRelPath = path_1.default.relative(buckRoot, runtimeDir);
        const runtimeDepPath = `//${runtimeRelPath.replace(/\\/g, "/")}`;
        const deps = [
            `"${runtimeDepPath}:transport",`,
            `"${runtimeDepPath}:utils",`,
            `"${buckTarget}",`,
        ];
        if (!(0, xrpa_utils_1.objectIsEmpty)(moduleDef.getSettings().getAllFields())) {
            deps.push(`"${runtimeDepPath}:external_utils",`);
            deps.push(`"//third-party/cli11:cli11",`);
        }
        return [
            ...CppCodeGenImpl_1.BUCK_HEADER,
            `load("//arvr/tools/build_defs:oxx.bzl", "oxx_binary", "oxx_shared_library")`,
            ``,
            `oncall("${oncall}")`,
            ``,
            `oxx_shared_library(`,
            `    name = "${moduleDef.name}_standalone",`,
            `    srcs = ["StandaloneWrapper.cpp"],`,
            `    compatible_with = [`,
            `        "ovr_config//os:windows",`,
            `    ],`,
            `    link_style = "static",`,
            `    preprocessor_flags = ["-DBUILDING_MAIN_STANDALONE"],`,
            `    public_include_directories = ["standalone"],`,
            `    public_raw_headers = ["Standalone.h"],`,
            `    visibility = ["PUBLIC"],`,
            `    deps = [`,
            ...(0, xrpa_utils_1.indent)(4, deps.sort()),
            `    ],`,
            `)`,
            ``,
            `oxx_binary(`,
            `    name = "${moduleDef.name}",`,
            `    srcs = ["MainStandalone.cpp"],`,
            `    compatible_with = [`,
            `        "ovr_config//os:windows",`,
            `    ],`,
            `    link_style = "shared",`,
            `    visibility = ["PUBLIC"],`,
            `    deps = [`,
            `        ":${moduleDef.name}_standalone",`,
            `    ],`,
            `)`,
            ``,
        ];
    });
}
exports.genStandaloneBuck = genStandaloneBuck;
//# sourceMappingURL=GenStandaloneCpp.js.map
