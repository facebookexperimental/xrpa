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

import { BuiltinType } from "../../shared/BuiltinTypes";
import { DataMapDefinition } from "../../shared/DataMap";
import { ModuleDefinition } from "../../shared/ModuleDefinition";
import { StructType } from "../../shared/StructType";
import { GuidGenSpec } from "../../shared/TargetCodeGen";
import { StructTypeDefinition } from "../../shared/TypeDefinition";
import { GenDataStoreContext } from "../shared/GenDataStoreShared";
import * as CsharpCodeGenImpl from "./CsharpCodeGenImpl";
import { XRPA_NAMESPACE } from "./CsharpCodeGenImpl";
import { genDataflowProgram } from "./GenDataflowProgram";
import { genDataStore } from "./GenDataStore";
import { genTypesDefinitions } from "./GenTypesDefinitions";

export class CsharpModuleDefinition extends ModuleDefinition {
  constructor(
    datamap: DataMapDefinition,
    name: string,
    readonly outputDir: string,
    guidGen?: GuidGenSpec,
  ) {
    super(
      CsharpCodeGenImpl,
      name,
      datamap,
      guidGen ?? {
        includes: [
          { namespace: "System" },
        ],
        code: "System.Guid.NewGuid()",
      },
    );
  }

  protected createObjectUuid(): StructTypeDefinition {
    const ObjectUuid = this.createStruct("Identifier", "", {
      ID0: { type: this.getPrimitiveTypeDefinition(BuiltinType.BitField) },
      ID1: { type: this.getPrimitiveTypeDefinition(BuiltinType.BitField) },
    }, { typename: this.codegen.nsJoin(XRPA_NAMESPACE, "ObjectUuid") });
    (ObjectUuid as StructType).datasetType = { typename: this.codegen.nsJoin(XRPA_NAMESPACE, "ObjectUuid") };
    return ObjectUuid;
  }

  public doCodeGen(): FileWriter {
     const fileWriter = new FileWriter();

     for (const storeDef of this.getDataStores()) {
      // generate DS types
      genTypesDefinitions(fileWriter, this.outputDir, storeDef);

      // generate DataStore files
      const ctx: GenDataStoreContext = {
        moduleDef: this,
        storeDef,
        namespace: this.codegen.getDataStoreHeaderNamespace(storeDef.apiname),
      };
      genDataStore(fileWriter, this.outputDir, ctx);
    }

    const dataflowPrograms = this.getDataflowPrograms();
    for (const name in dataflowPrograms) {
      genDataflowProgram(
        {
          namespace: "XrpaDataflowPrograms",
          moduleDef: this,
        },
        fileWriter,
        this.outputDir,
        dataflowPrograms[name],
      );
    }

    return fileWriter;
  }
}
