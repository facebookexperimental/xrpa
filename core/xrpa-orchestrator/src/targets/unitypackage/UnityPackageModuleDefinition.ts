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


import { FileWriter } from "@xrpa/xrpa-file-utils";
import { filterToString} from "@xrpa/xrpa-utils";
import path from "path";

import { DataMapDefinition } from "../../shared/DataMap";
import { ComponentProperties, IndexConfiguration } from "../../shared/DataStore";
import { getRuntimeSrcPath } from "../../shared/Helpers";
import { CollectionTypeDefinition } from "../../shared/TypeDefinition";
import { injectGeneratedTag } from "../csharp/CsharpCodeGenImpl";
import { CsharpModuleDefinition } from "../csharp/CsharpModuleDefinition";
import { genDataflowProgram } from "../csharp/GenDataflowProgram";
import { genDataStore } from "../csharp/GenDataStore";
import { genTypesDefinitions } from "../csharp/GenTypesDefinitions";
import { genDataflowProgramSpawner } from "./GenDataflowProgramSpawner";
import { genDataStoreSubsystem } from "./GenDataStoreSubsystem";
import { genIndexedMonoBehaviour, genSpawnedMonoBehaviour } from "./GenIndexedMonoBehaviour";
import { genMonoBehaviour } from "./GenMonoBehaviour";
import { genPackage, PackageInfo } from "./GenPackage";
import { genTransportSubsystem } from "./GenTransportSubsystem";
import { getComponentClassName } from "./MonoBehaviourShared";

export class UnityPackageModuleDefinition extends CsharpModuleDefinition {
  constructor(
    name: string,
    datamap: DataMapDefinition,
    readonly projectRoot: string,
    readonly packageInfos: Record<string, PackageInfo>,
  ) {
    super(
      datamap,
      name,
      "",
    );
  }

  public setCollectionAsInbound(type: CollectionTypeDefinition, componentProps: ComponentProperties, indexes: Array<IndexConfiguration>|undefined): void {
    for (const index of (indexes ?? [])) {
      if (index.boundClassName === "") {
        index.boundClassName = getComponentClassName(type);
      }
    }
    super.setCollectionAsInbound(type, componentProps, indexes);
  }

  public doCodeGen(): FileWriter {
    const fileWriter = new FileWriter();

    const packagesDir = path.join(this.projectRoot, "Packages");

    const runtimeDirs: Record<string, string> = {};
    for (const key in this.packageInfos) {
      const packageInfo = this.packageInfos[key];
      const packageRootDir = path.join(packagesDir, packageInfo.packageName);

      // generate package directory structure and files
      const { runtimeDir } = genPackage(fileWriter, packageRootDir, packageInfo);
      runtimeDirs[key] = runtimeDir;
    }

    for (const storeDef of this.getDataStores()) {
      const runtimeDir = runtimeDirs[storeDef.apiname];

      // generate TransportSubsystem
      genTransportSubsystem(fileWriter, runtimeDir, storeDef);

      // generate DS types using csharp codegen
      genTypesDefinitions(fileWriter, runtimeDir, storeDef);

      // generate DataStore files using csharp codegen
      const ctx = {
        moduleDef: this,
        storeDef,
        namespace: this.codegen.getDataStoreHeaderNamespace(storeDef.apiname),
      };
      genDataStore(fileWriter, runtimeDir, ctx);

      // generate DataStore subsystem files
      genDataStoreSubsystem(fileWriter, runtimeDir, storeDef);

      ctx.namespace = "";

      // generate Unity component classes
      for (const accessor of storeDef.getOutputReconcilers()) {
        if (filterToString(accessor.componentProps.basetype)) {
          genMonoBehaviour(ctx, fileWriter, accessor, runtimeDir);
        }
      }
      for (const accessor of storeDef.getInputReconcilers()) {
        if (accessor.componentProps.generateSpawner && filterToString(accessor.componentProps.basetype)) {
          genSpawnedMonoBehaviour(ctx, fileWriter, accessor, runtimeDir);
        } else if (accessor.hasIndexedBinding()) {
          genIndexedMonoBehaviour(ctx, fileWriter, accessor, runtimeDir);
        }
      }
    }

    // create the Xrpa runtime package
    fileWriter.copyFolderContents(
      getRuntimeSrcPath("cs"),
      path.join(packagesDir, "Xrpa"),
      (_srcRelPath, fileExt, fileData) => {
        if (fileExt === ".cs") {
          return injectGeneratedTag(fileData);
        }
        return fileData;
      },
    );

    // generate dataflow programs
    const dataflowPrograms = this.getDataflowPrograms();
    if (dataflowPrograms.length) {
      const dataflowRootDir = path.join(this.projectRoot, "Assets", "XrpaDataflow");

      for (const dataflowDef of dataflowPrograms) {
        genDataflowProgram(
          {
            namespace: "XrpaDataflow",
            moduleDef: this,
          },
          fileWriter,
          dataflowRootDir,
          dataflowDef,
        );

        genDataflowProgramSpawner(
          {
            namespace: "XrpaDataflow",
            moduleDef: this,
          },
          fileWriter,
          dataflowRootDir,
          dataflowDef,
        );
      }
    }

    return fileWriter;
  }
}
