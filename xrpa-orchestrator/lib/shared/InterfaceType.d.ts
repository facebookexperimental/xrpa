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
import { StructWithAccessorType } from "./StructWithAccessorType";
import { TargetCodeGenImpl, TypeSpec } from "./TargetCodeGen";
import { CollectionTypeDefinition, InterfaceTypeDefinition, StructSpec, StructTypeDefinition, TypeMetaType } from "./TypeDefinition";
export declare class InterfaceType extends StructWithAccessorType implements InterfaceTypeDefinition {
    private collections;
    private ptrType;
    constructor(codegen: TargetCodeGenImpl, interfaceName: string, apiname: string, fields: StructSpec, parentType?: StructTypeDefinition | undefined);
    getMetaType(): TypeMetaType;
    getLocalTypePtr(inNamespace: string, includes: IncludeAggregator | null): string;
    registerCollection(collection: CollectionTypeDefinition): void;
    getCompatibleTypeList(inNamespace: string, includes: IncludeAggregator | null): string[];
    isBarePtr(): boolean;
    setToBarePtr(localType?: TypeSpec): void;
    getPtrType(): string;
    getChangedBit(inNamespace: string, includes: IncludeAggregator | null, fieldName: string): string;
    protected genReadWriteValueFunctions(classSpec: ClassSpec): void;
    protected genStaticAccessorFields(classSpec: ClassSpec): void;
}

