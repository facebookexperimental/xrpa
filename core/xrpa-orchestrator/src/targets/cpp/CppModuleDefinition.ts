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


import path from "path";
import { buckRootDir, FileWriter } from "@xrpa/xrpa-file-utils";
import { indent, pushUnique } from "@xrpa/xrpa-utils";

import { BuiltinType } from "../../shared/BuiltinTypes";
import { DataMapDefinition } from "../../shared/DataMap";
import { getRuntimeSrcPath } from "../../shared/Helpers";
import { ModuleDefinition } from "../../shared/ModuleDefinition";
import { StructType } from "../../shared/StructType";
import { GuidGenSpec } from "../../shared/TargetCodeGen";
import { StructTypeDefinition } from "../../shared/TypeDefinition";
import { GenDataStoreContext } from "../shared/GenDataStoreShared";
import * as CppCodeGenImpl from "./CppCodeGenImpl";
import { XRPA_NAMESPACE, injectGeneratedTag, nsJoin } from "./CppCodeGenImpl";
import { genDataflowProgram } from "./GenDataflowProgram";
import { genDataStore } from "./GenDataStore";
import { genModuleClass } from "./GenModuleClass";
import { genTypesHeader } from "./GenTypesHeader";

export interface ModuleBuckTargetPlatformConfig {
  debug: string;
  release: string;
}

export interface ModuleBuckConfig {
  target: string;
  oncall: string;
  modes: {
    windows?: ModuleBuckTargetPlatformConfig;
    macos?: ModuleBuckTargetPlatformConfig;
  };
}

export class CppModuleDefinition extends ModuleDefinition {
  public readonly libDir: string;
  public readonly runtimeDir: string;
  private needsExternalUtils = false;

  constructor(
    name: string,
    datamap: DataMapDefinition,
    readonly genOutputDir: string,
    readonly buckDef?: ModuleBuckConfig,
    guidGen?: GuidGenSpec,
  ) {
    super(CppCodeGenImpl, name, datamap, guidGen ?? {
      includes: [{
        filename: "<xrpa-runtime/external_utils/UuidGen.h>",
      }],
      code: nsJoin(XRPA_NAMESPACE, "generateUuid()"),
    });

    this.libDir = path.join(this.genOutputDir, "lib");
    this.runtimeDir = path.join(this.genOutputDir, "xrpa-runtime");

    if (!guidGen) {
      this.needsExternalUtils = true;
    }
  }

  protected createObjectUuid(): StructTypeDefinition {
    const ObjectUuid = this.createStruct("Identifier", "", {
      id0: { type: this.getPrimitiveTypeDefinition(BuiltinType.BitField) },
      id1: { type: this.getPrimitiveTypeDefinition(BuiltinType.BitField) },
    }, { typename: this.codegen.nsJoin(XRPA_NAMESPACE, "ObjectUuid"), headerFile: "<xrpa-runtime/utils/XrpaTypes.h>" });
    (ObjectUuid as StructType).datasetType = { typename: this.codegen.nsJoin(XRPA_NAMESPACE, "ObjectUuid"), headerFile: "<xrpa-runtime/utils/XrpaTypes.h>" };
    return ObjectUuid;
  }

  public doCodeGen(): FileWriter {
    const fileWriter = new FileWriter();

    fileWriter.copyFolderContents(
      getRuntimeSrcPath("cpp"),
      this.runtimeDir,
      (_srcRelPath, fileExt, fileData) => {
        if (fileExt === ".cpp" || fileExt === ".h") {
          return injectGeneratedTag(fileData);
        }
        return fileData;
      },
    );

    // generate module class
    genModuleClass(fileWriter, this.libDir, this);

    if (this.buckDef) {
      // generate lib buck file
      this.genBuckFile(fileWriter, this, this.buckDef.oncall);
    }

    for (const storeDef of this.getDataStores()) {
      // generate DS types
      genTypesHeader(fileWriter, this.libDir, storeDef);

      // generate DataStore files
      const ctx: GenDataStoreContext = {
        moduleDef: this,
        storeDef,
        namespace: this.codegen.getDataStoreHeaderNamespace(storeDef.apiname),
      };
      genDataStore(fileWriter, this.libDir, ctx);
    }

    const dataflowPrograms = this.getDataflowPrograms();
    for (const name in dataflowPrograms) {
      genDataflowProgram(
        {
          namespace: "XrpaDataflowPrograms",
          moduleDef: this,
        },
        fileWriter,
        this.libDir,
        dataflowPrograms[name],
      );
    }

    return fileWriter;
  }

  private genBuckFile(fileWriter: FileWriter, moduleDef: ModuleDefinition, oncall: string) {
    fileWriter.writeFile(path.join(this.libDir, "BUCK"), async () => {
      const buckRoot = await buckRootDir();
      const runtimeRelPath = path.relative(buckRoot, this.runtimeDir);
      const runtimeDepPath = `//${runtimeRelPath.replace(/\\/g, "/")}`;

      if (this.needsExternalUtils) {
        pushUnique(this.datamap.typeBuckDeps, `${runtimeDepPath}:external_utils`);
      }

      const deps = (moduleDef.datamap.typeBuckDeps).map(s => `"${s}",`).concat([
        `"${runtimeDepPath}:reconciler",`,
        `"${runtimeDepPath}:transport",`,
        `"${runtimeDepPath}:utils",`,
      ]).sort();

      return [
        ...CppCodeGenImpl.BUCK_HEADER,
        `load("//arvr/tools/build_defs:oxx.bzl", "oxx_static_library")`,
        ``,
        `oncall("${oncall}")`,
        ``,
        `oxx_static_library(`,
        `    name = "${moduleDef.name}",`,
        `    srcs = glob(["*.cpp"]),`,
        `    public_include_directories = [".."],`,
        `    public_raw_headers = glob(["*.h"]),`,
        `    visibility = ["PUBLIC"],`,
        `    deps = [`,
        ...indent(4, deps),
        `    ],`,
        `)`,
        ``,
      ];
    });
  }
}
