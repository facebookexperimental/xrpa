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
import { FileWriter } from "@xrpa/xrpa-file-utils";

import { BuiltinType } from "../../shared/BuiltinTypes";
import { DataMapDefinition } from "../../shared/DataMap";
import { getRuntimeSrcPath } from "../../shared/Helpers";
import { ModuleDefinition } from "../../shared/ModuleDefinition";
import { StructType } from "../../shared/StructType";
import { GuidGenSpec } from "../../shared/TargetCodeGen";
import { StructTypeDefinition } from "../../shared/TypeDefinition";
import { GenDataStoreContext } from "../shared/GenDataStoreShared";
import * as PythonCodeGenImpl from "./PythonCodeGenImpl";
import { injectGeneratedTag } from "./PythonCodeGenImpl";
import { genDataflowProgram } from "./GenDataflowProgram";
import { genDataStore } from "./GenDataStore";
import { genProgramInterfacesClass } from "./GenProgramInterfacesClass";
import { genTypesDefinitions } from "./GenTypesDefinitions";

export class PythonModuleDefinition extends ModuleDefinition {
  public readonly libDir: string;
  public readonly runtimeDir: string;

  constructor(
    name: string,
    datamap: DataMapDefinition,
    readonly genOutputDir: string,
    guidGen?: GuidGenSpec,
  ) {
    super(PythonCodeGenImpl, name, datamap, guidGen ?? {
      includes: [{
        namespace: "uuid",
      }],
      code: "uuid.uuid4()",
    });

    this.libDir = path.join(this.genOutputDir, "xrpa");
    this.runtimeDir = path.join(this.genOutputDir, "xrpa_runtime");
  }

  protected createObjectUuid(): StructTypeDefinition {
    const ObjectUuid = this.createStruct("Identifier", "", {
      ID0: { type: this.getPrimitiveTypeDefinition(BuiltinType.BitField) },
      ID1: { type: this.getPrimitiveTypeDefinition(BuiltinType.BitField) },
    }, { typename: "xrpa_runtime.utils.xrpa_types.ObjectUuid", headerFile: "xrpa_runtime.utils.xrpa_types" });
    (ObjectUuid as StructType).datasetType = { typename: "xrpa_runtime.utils.xrpa_types.ObjectUuid", headerFile: "xrpa_runtime.utils.xrpa_types" };
    return ObjectUuid;
  }

  public doCodeGen(): FileWriter {
    const fileWriter = this.createFileWriter();

    fileWriter.copyFolderContents(
      getRuntimeSrcPath("python"),
      this.runtimeDir,
      (srcRelPath, fileExt, fileData) => {
        if (srcRelPath.endsWith("BUCK")) {
          return null;
        }
        if (fileExt === ".py") {
          return injectGeneratedTag(fileData);
        }
        return fileData;
      },
    );

    fileWriter.writeFile(path.join(this.libDir, "__init__.py"), PythonCodeGenImpl.HEADER);

    genProgramInterfacesClass(fileWriter, this.libDir, this);

    for (const storeDef of this.getDataStores()) {
      // generate DS types
      genTypesDefinitions(fileWriter, this.libDir, storeDef);

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
          namespace: "xrpa",
          moduleDef: this,
        },
        fileWriter,
        this.libDir,
        dataflowPrograms[name],
      );
    }

    return fileWriter;
  }
}
