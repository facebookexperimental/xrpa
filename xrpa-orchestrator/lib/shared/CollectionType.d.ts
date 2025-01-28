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
import { CollectionNameAndType, CollectionTypeDefinition, InterfaceTypeDefinition, StructSpec, TypeMetaType } from "./TypeDefinition";
export declare class CollectionType extends InterfaceType implements CollectionTypeDefinition {
    readonly collectionId: number;
    readonly maxCount: number;
    readonly interfaceType: InterfaceTypeDefinition | undefined;
    constructor(codegen: TargetCodeGenImpl, collectionName: string, apiname: string, objectUuidType: StructType, fields: StructSpec, collectionId: number, maxCount: number, interfaceType: InterfaceTypeDefinition | undefined);
    getMetaType(): TypeMetaType;
    getHashData(): Record<string, unknown>;
    getAllFields(): StructSpec;
    getCompatibleTypeList(inNamespace: string, includes: IncludeAggregator | null): CollectionNameAndType[];
    getCollectionId(): number;
}

