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


import { IncludeAggregator } from "./Helpers";
import { InterfaceType } from "./InterfaceType";
import { StructType } from "./StructType";
import { TargetCodeGenImpl } from "./TargetCodeGen";
import {
  CollectionNameAndType,
  CollectionTypeDefinition,
  InterfaceTypeDefinition,
  StructSpec,
  TypeMetaType,
} from "./TypeDefinition";

export class CollectionType extends InterfaceType implements CollectionTypeDefinition {
  constructor(
    codegen: TargetCodeGenImpl,
    collectionName: string,
    apiname: string,
    objectUuidType: StructType,
    fields: StructSpec,
    readonly collectionId: number,
    readonly maxCount: number,
    readonly interfaceType: InterfaceTypeDefinition | undefined,
  ) {
    super(codegen, collectionName, apiname, objectUuidType, fields, interfaceType);
    if (interfaceType) {
      interfaceType.registerCollection(this);
    }
  }

  public getMetaType(): TypeMetaType {
    return TypeMetaType.COLLECTION;
  }

  public getHashData(): Record<string, unknown> {
    return {
      ...super.getHashData(),
      collectionId: this.collectionId,
    };
  }

  public getAllFields(): StructSpec {
    return {
      ...(this.interfaceType?.getAllFields() ?? {}),
      ...super.getAllFields(),
    };
  }

  public getCompatibleTypeList(inNamespace: string, includes: IncludeAggregator|null): CollectionNameAndType[] {
    return [{
      collectionName: this.getName(),
      typeName: this.getLocalType(inNamespace, includes),
    }];
  }

  public getCollectionId(): number {
    return this.collectionId;
  }
}
