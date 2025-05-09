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
import { CollectionNameAndType, CollectionTypeDefinition, InterfaceTypeDefinition, StructSpec, StructTypeDefinition, TypeMetaType } from "./TypeDefinition";
export declare class InterfaceType extends StructWithAccessorType implements InterfaceTypeDefinition {
    private collections;
    constructor(codegen: TargetCodeGenImpl, interfaceName: string, apiname: string, objectUuidType: StructType, fields: StructSpec, parentType?: StructTypeDefinition | undefined);
    getMetaType(): TypeMetaType;
    getLocalTypePtr(inNamespace: string, includes: IncludeAggregator | null): string;
    registerCollection(collection: CollectionTypeDefinition): void;
    getCompatibleTypeList(inNamespace: string, includes: IncludeAggregator | null): CollectionNameAndType[];
    protected genStaticAccessorFields(classSpec: ClassSpec): void;
}

