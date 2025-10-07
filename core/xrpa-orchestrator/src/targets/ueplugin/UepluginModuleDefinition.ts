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
import { filterToString } from "@xrpa/xrpa-utils";
import assert from "assert";
import path from "path";

import { DataMapDefinition } from "../../shared/DataMap";
import { ComponentProperties, IndexConfiguration } from "../../shared/DataStore";
import { getRuntimeSrcPath } from "../../shared/Helpers";
import { TypeSpec } from "../../shared/TargetCodeGen";
import { CollectionTypeDefinition, StructSpec, StructTypeDefinition, TypeDefinition } from "../../shared/TypeDefinition";
import { injectGeneratedTag } from "../cpp/CppCodeGenImpl";
import { CppModuleDefinition } from "../cpp/CppModuleDefinition";
import { genDataflowProgram } from "../cpp/GenDataflowProgram";
import { genDataStore } from "../cpp/GenDataStore";
import { genTypesHeader } from "../cpp/GenTypesHeader";
import { GenDataStoreContext } from "../shared/GenDataStoreShared";
import { genBlueprintTypes } from "./GenBlueprintTypes";
import { genDataflowProgramSpawner } from "./GenDataflowProgramSpawner";
import { genDataStoreSubsystem } from "./GenDataStoreSubsystem";
import { genPlugin } from "./GenPlugin";
import { genIndexedSceneComponent } from "./GenIndexedSceneComponent";
import { genSceneComponent } from "./GenSceneComponent";
import { genTransportSubsystem } from "./GenTransportSubsystem";
import { getComponentClassName } from "./SceneComponentShared";
import { EnumTypeUe, StructTypeUe } from "./UeTypeDefinitions";

export interface PluginConfig {
  pluginName: string;
  deps: Array<[string, string]>;
}

export class UepluginModuleDefinition extends CppModuleDefinition {
  constructor(
    name: string,
    datamap: DataMapDefinition,
    readonly projectRoot: string,
    readonly pluginsConfig: Record<string, PluginConfig>,
  ) {
    super(name, datamap, "", undefined, {
      includes: [
        { filename: "Engine.h" },
      ],
      code: "FGuid::NewGuid()",
    });
  }

  public createEnum(
    name: string,
    apiname: string,
    enumValues: Record<string, number>,
    localTypeOverride: TypeSpec | undefined,
  ): TypeDefinition {
    assert(!localTypeOverride, `localTypeOverride must be undefined for UE enums`);
    return new EnumTypeUe(this.codegen, name, apiname, enumValues);
  }

  public createStruct(
    name: string,
    apiname: string,
    fields: StructSpec,
    localTypeOverride: TypeSpec | undefined,
  ): StructTypeDefinition {
    return new StructTypeUe(this.codegen, name, apiname, undefined, fields, localTypeOverride);
  }

  public setCollectionAsInbound(type: CollectionTypeDefinition, componentProps: ComponentProperties, indexes: Array<IndexConfiguration>|undefined): void {
    for (const index of (indexes ?? [])) {
      if (index.boundClassName === "") {
        index.boundClassName = getComponentClassName(null, type);
      }
    }
    super.setCollectionAsInbound(type, componentProps, indexes);
  }

  public doCodeGen(): FileWriter {
    const fileWriter = new FileWriter();

    const pluginsDir = path.join(this.projectRoot, "Plugins");

    for (const storeDef of this.getDataStores()) {
      const pluginConfig = this.pluginsConfig[storeDef.apiname];
      const pluginRootDir = path.join(pluginsDir, pluginConfig.pluginName);

      // generate plugin directory structure and files
      const data = genPlugin(fileWriter, pluginRootDir, pluginConfig.pluginName, pluginConfig.deps);

      // generate TransportSubsytem
      genTransportSubsystem(fileWriter, data.privateSrcDir, storeDef, pluginConfig.pluginName);

      // generate DS types using cpp codegen
      genTypesHeader(fileWriter, data.privateSrcDir, storeDef);

      // generate DataStore files using cpp codegen
      const ctx: GenDataStoreContext = {
        moduleDef: this,
        storeDef,
        namespace: this.codegen.getDataStoreHeaderNamespace(storeDef.apiname),
      };
      genDataStore(fileWriter, data.privateSrcDir, ctx);

      // generate DataStore subsystem files
      genDataStoreSubsystem(fileWriter, data.privateSrcDir, storeDef, pluginConfig.pluginName);

      // generate Blueprint-compatible versions of DS types, where needed
      ctx.namespace = "";
      genBlueprintTypes(fileWriter, data.privateSrcDir, data.publicSrcDir, ctx);

      // generate UE reconciler classes
      for (const accessor of storeDef.getOutputReconcilers()) {
        if (filterToString(accessor.componentProps.basetype)?.endsWith("Component")) {
          genSceneComponent(ctx, fileWriter, accessor, data.privateSrcDir, data.publicSrcDir, pluginConfig.pluginName);
        }
      }
      for (const accessor of storeDef.getInputReconcilers()) {
        if (accessor.hasIndexedBinding()) {
          genIndexedSceneComponent(ctx, fileWriter, accessor, data.privateSrcDir, data.publicSrcDir, pluginConfig.pluginName);
        }
      }

      // copy over the Xrpa runtime files
      fileWriter.copyFolderContents(
        getRuntimeSrcPath("cpp"),
        path.join(data.publicSrcDir, "xrpa-runtime"),
        (srcRelPath, fileExt, fileData) => {
          if (srcRelPath.startsWith("external_utils/")) {
            return null;
          }
          if (srcRelPath.endsWith("BUCK")) {
            return null;
          }
          if (fileExt === ".cpp" || fileExt === ".h") {
            return injectGeneratedTag(fileData);
          }
          return fileData;
        },
      );

      fileWriter.copyFolderContents(
        getRuntimeSrcPath("ue"),
        path.join(data.publicSrcDir, "xrpa-runtime"),
        (_srcRelPath, fileExt, fileData) => {
          if (fileExt === ".cpp" || fileExt === ".h") {
            return injectGeneratedTag(fileData);
          }
          return fileData;
        },
      );
      }

    // generate dataflow programs
    const dataflowPrograms = this.getDataflowPrograms();
    if (dataflowPrograms.length) {
      const srcDir = path.join(this.projectRoot, "Source", this.name);
      const privateSrcDir = path.join(srcDir, "Private", "XrpaDataflow");
      const publicSrcDir = path.join(srcDir, "Public", "XrpaDataflow");

      for (const dataflowDef of dataflowPrograms) {
        genDataflowProgram(
          {
            namespace: "XrpaDataflow",
            moduleDef: this,
          },
          fileWriter,
          publicSrcDir,
          dataflowDef,
        );

        genDataflowProgramSpawner(
          {
            namespace: "XrpaDataflow",
            moduleDef: this,
          },
          fileWriter,
          privateSrcDir,
          publicSrcDir,
          dataflowDef,
          this.name,
        );
      }
    }

    return fileWriter;
  }
}
