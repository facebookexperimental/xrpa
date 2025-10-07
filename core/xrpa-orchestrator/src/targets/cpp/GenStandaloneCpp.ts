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


import { buckRootDir, normalizeBuckMode, FileWriter } from "@xrpa/xrpa-file-utils";
import { indent, objectIsEmpty, pushUnique } from "@xrpa/xrpa-utils";
import path from "path";

import { DataStoreDefinition } from "../../shared/DataStore";
import { IncludeAggregator } from "../../shared/Helpers";
import { ModuleDefinition } from "../../shared/ModuleDefinition";
import { BUCK_HEADER, CppIncludeAggregator, getTypesHeaderName, getTypesHeaderNamespace, HEADER } from "./CppCodeGenImpl";
import { SharedMemoryTransportStream } from "./CppDatasetLibraryTypes";
import { ModuleBuckConfig } from "./CppModuleDefinition";
import { genTransportDeclarations, getInboundTransportVarName, getModuleHeaderName, getOutboundTransportVarName } from "./GenModuleClass";

function genMainStandalone(fileWriter: FileWriter, outdir: string) {
  const lines = [
    ...HEADER,
    `#include "Standalone.h"`,
    ``,
    `int main(int argc, char** argv) {`,
    `  return RunStandalone(argc, argv);`,
    `}`,
    ``,
  ];

  fileWriter.writeFile(path.join(outdir, "MainStandalone.cpp"), lines);
}

function genStandaloneHeader(fileWriter: FileWriter, outdir: string) {
  const lines = [
    ...HEADER,
    `#pragma once`,
    ``,
    `#if defined(WIN32)`,
    `  #ifdef BUILDING_MAIN_STANDALONE`,
    `    #define DLLEXPORT __declspec(dllexport)`,
    `  #else`,
    `    #define DLLEXPORT __declspec(dllimport)`,
    `  #endif`,
    `#elif defined(__APPLE__)`,
    `  #ifdef BUILDING_MAIN_STANDALONE`,
    `    #define DLLEXPORT __attribute__((visibility("default")))`,
    `  #else`,
    `    #define DLLEXPORT __attribute__((visibility("default")))`,
    `  #endif`,
    `#else`,
    `  #define DLLEXPORT`,
    `#endif`,
    ``,
    `extern "C" {`,
    `DLLEXPORT int RunStandalone(int argc, char** argv);`,
    `}`,
    ``,
  ];

  fileWriter.writeFile(path.join(outdir, "Standalone.h"), lines);
}

export function genTransportInitializer(storeDef: DataStoreDefinition, namespace: string, includes: IncludeAggregator): string[] {
  includes.addFile({ filename: getTypesHeaderName(storeDef.apiname) });
  const inboundTransportVar = getInboundTransportVarName(storeDef);
  const outboundTransportVar = getOutboundTransportVarName(storeDef);
  const inboundMemMarker = storeDef.isModuleProgramInterface ? "Input" : "Output";
  const outboundMemMarker = storeDef.isModuleProgramInterface ? "Output" : "Input";
  return [
    `{`,
    `  auto local${inboundTransportVar} = std::make_shared<${SharedMemoryTransportStream.getLocalType(namespace, includes)}>("${storeDef.dataset}${inboundMemMarker}", ${getTypesHeaderNamespace(storeDef.apiname)}::GenTransportConfig());`,
    `  ${inboundTransportVar} = local${inboundTransportVar};`,
    ``,
    `  auto local${outboundTransportVar} = std::make_shared<${SharedMemoryTransportStream.getLocalType(namespace, includes)}>("${storeDef.dataset}${outboundMemMarker}", ${getTypesHeaderNamespace(storeDef.apiname)}::GenTransportConfig());`,
    `  ${outboundTransportVar} = local${outboundTransportVar};`,
    `}`,
  ];
}

export function genTransportDeinitializer(storeDef: DataStoreDefinition): string[] {
  return [
    `${getOutboundTransportVarName(storeDef)}.reset();`,
    `${getInboundTransportVarName(storeDef)}.reset();`,
  ];
}

function genSettingsParsing(moduleDef: ModuleDefinition): string[] {
  const fields = moduleDef.getSettings().getAllFields();
  if (objectIsEmpty(fields)) {
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

function genStandaloneWrapper(
  fileWriter: FileWriter,
  outdir: string,
  moduleDef: ModuleDefinition
) {
  const moduleClassName = `${moduleDef.name}Module`;
  const namespace = "";

  const includes = new CppIncludeAggregator([
    "<memory>",
    "<thread>",
    getModuleHeaderName(moduleDef),
  ], headerFile => {
    if (headerFile.startsWith(`"`)) {
      return `<lib/${headerFile.slice(1, -1)}>`;
    }
    return headerFile;
  });

  if (!objectIsEmpty(moduleDef.getSettings().getAllFields())) {
    includes.addFile({ filename: "<xrpa-runtime/external_utils/CommandLineUtils.h>" })
    includes.addFile({ filename: "<CLI/CLI.hpp>" });
  }

  const transportVars: string[] = [];
  for (const storeDef of moduleDef.getDataStores()) {
    transportVars.push(getInboundTransportVarName(storeDef));
    transportVars.push(getOutboundTransportVarName(storeDef));
  }

  const lines = [
    `void EntryPoint(${moduleClassName}* moduleData);`,
    ``,
    `int RunStandalone(int argc, char** argv) {`,
    ...indent(1, genTransportDeclarations(moduleDef, namespace, includes, true)),
    ...indent(1, moduleDef.getDataStores().map(storeDef => genTransportInitializer(storeDef, namespace, includes))),
    `  auto moduleData = std::make_unique<${moduleClassName}>(${transportVars.join(", ")});`,
    ...indent(1, genSettingsParsing(moduleDef)),
    ``,
    `  std::thread dataThread(EntryPoint, moduleData.get());`,
    `  std::getchar();`,
    `  moduleData->stop();`,
    `  dataThread.join();`,
    `  return 0;`,
    `}`,
    ``,
  ];

  lines.unshift(
    ...HEADER,
    `#include "Standalone.h"`,
    ``,
    ...includes.getIncludes(),
    ``,
  );

  fileWriter.writeFile(path.join(outdir, "StandaloneWrapper.cpp"), lines);
}

export function genStandaloneCpp(
  fileWriter: FileWriter,
  outdir: string,
  moduleDef: ModuleDefinition
) {
  genMainStandalone(fileWriter, outdir);
  genStandaloneHeader(fileWriter, outdir);
  genStandaloneWrapper(fileWriter, outdir, moduleDef);
}

export function genStandaloneBuck(
  fileWriter: FileWriter,
  outdir: string,
  runtimeDir: string,
  buckDef: ModuleBuckConfig,
  moduleDef: ModuleDefinition,
) {
  const ciLabels: string[] = [];
  const compatibleWith: string[] = [];
  if (buckDef.modes.windows) {
    const testMode = buckDef.modes.windows.release || buckDef.modes.windows.debug;
    compatibleWith.push(`"ovr_config//os:windows",`);
    if (testMode) {
      ciLabels.push(`ci.skip_test(ci.windows(ci.mode("${normalizeBuckMode(testMode)}"))),`);
    }
  }
  if (buckDef.modes.macos) {
    const testMode = buckDef.modes.macos.release || buckDef.modes.macos.debug;
    compatibleWith.push(`"ovr_config//os:macos",`);
    if (testMode) {
      ciLabels.push(`ci.skip_test(ci.mac(ci.mode("${normalizeBuckMode(testMode)}"))),`);
    }
  }

  fileWriter.writeFile(path.join(outdir, "BUCK"), async () => {
    const buckRoot = await buckRootDir();
    const runtimeRelPath = path.relative(buckRoot, runtimeDir);
    const runtimeDepPath = `//${runtimeRelPath.replace(/\\/g, "/")}`;

    const deps = [
      `"${runtimeDepPath}:transport",`,
      `"${runtimeDepPath}:utils",`,
      `"${buckDef.target}",`,
    ];

    if (!objectIsEmpty(moduleDef.getSettings().getAllFields())) {
      pushUnique(deps, `"${runtimeDepPath}:external_utils",`);
      pushUnique(deps, `"//third-party/cli11:cli11",`);
    }

    return [
      ...BUCK_HEADER,
      `load("//arvr/tools/build_defs:oxx.bzl", "oxx_binary", "oxx_shared_library")`,
      ...(ciLabels.length ? [`load("@fbsource//tools/target_determinator/macros:ci.bzl", "ci")`] : []),
      ``,
      `oncall("${buckDef.oncall}")`,
      ``,
      `oxx_shared_library(`,
      `    name = "${moduleDef.name}_standalone",`,
      `    srcs = ["StandaloneWrapper.cpp"],`,
      `    compatible_with = [`,
      ...indent(4, compatibleWith),
      `    ],`,
      `    link_style = "static",`,
      `    preprocessor_flags = ["-DBUILDING_MAIN_STANDALONE"],`,
      `    public_include_directories = ["standalone"],`,
      `    public_raw_headers = ["Standalone.h"],`,
      `    visibility = ["PUBLIC"],`,
      `    deps = [`,
      ...indent(4, deps.sort()),
      `    ],`,
      `)`,
      ``,
      `oxx_binary(`,
      `    name = "${moduleDef.name}",`,
      `    srcs = ["MainStandalone.cpp"],`,
      `    compatible_with = [`,
      ...indent(4, compatibleWith),
      `    ],`,
      `    link_style = "shared",`,
      `    visibility = ["PUBLIC"],`,
      `    deps = [`,
      `        ":${moduleDef.name}_standalone",`,
      `    ],`,
      ...(ciLabels.length ? [
        `    labels = ci.labels(`,
        ...indent(4, ciLabels),
        `    ),`,
      ] : []),
      `)`,
      ``,
    ];
  });
}
