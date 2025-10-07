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


import { ClassSpec } from "./ClassSpec";
import { IncludeAggregator } from "./Helpers";
import { StructType } from "./StructType";
import { StructWithAccessorType } from "./StructWithAccessorType";
import { TargetCodeGenImpl } from "./TargetCodeGen";
import {
  CollectionNameAndType,
  CollectionTypeDefinition,
  InterfaceTypeDefinition,
  StructSpec,
  StructTypeDefinition,
  TypeMetaType,
} from "./TypeDefinition";

export class InterfaceType extends StructWithAccessorType implements InterfaceTypeDefinition {
  private collections: CollectionTypeDefinition[] = [];

  constructor(
    codegen: TargetCodeGenImpl,
    interfaceName: string,
    apiname: string,
    objectUuidType: StructType,
    fields: StructSpec,
    parentType: StructTypeDefinition | undefined = undefined,
  ) {
    super(codegen, interfaceName, apiname, objectUuidType, parentType, fields);

    if (this.getMetaType() === TypeMetaType.INTERFACE) {
      this.localType.headerFile = codegen.getDataStoreHeaderName(apiname);
    } else {
      this.localType.headerFile = undefined;
    }
  }

  public getMetaType(): TypeMetaType {
    return TypeMetaType.INTERFACE;
  }

  public getLocalTypePtr(inNamespace: string, includes: IncludeAggregator | null): string {
    const localType = this.getLocalType(inNamespace, includes);
    return this.codegen.genSharedPointer(localType, includes);
  }

  public registerCollection(collection: CollectionTypeDefinition): void {
    this.collections.push(collection);
  }

  public getCompatibleTypeList(inNamespace: string, includes: IncludeAggregator | null): CollectionNameAndType[] {
    return this.collections.map(typeDef => {
      return {
        collectionName: typeDef.getName(),
        typeName: typeDef.getLocalType(inNamespace, includes),
      };
    }).sort((a, b) => a.collectionName.localeCompare(b.collectionName));
  }

  protected genStaticAccessorFields(classSpec: ClassSpec): void {
    const lines = super.genStaticAccessorFields(classSpec);

    const fields = this.getStateFields();
    for (const name in fields) {
      this.codegen.genFieldChangedCheck(classSpec, { parentType: this, fieldName: name });
    }

    return lines;
  }
}
