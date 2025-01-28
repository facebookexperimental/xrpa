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
import { PrimitiveType } from "./PrimitiveType";
import { StructType } from "./StructType";
import { TargetCodeGenImpl } from "./TargetCodeGen";
import { CollectionNameAndType, InterfaceTypeDefinition, ReferenceTypeDefinition, TypeMetaType } from "./TypeDefinition";
import { TypeValue } from "./TypeValue";
export declare class ReferenceType extends PrimitiveType implements ReferenceTypeDefinition {
    readonly toType: InterfaceTypeDefinition;
    readonly objectUuidType: StructType;
    constructor(codegen: TargetCodeGenImpl, toType: InterfaceTypeDefinition, objectUuidType: StructType);
    getMetaType(): TypeMetaType;
    getReferencedTypeList(inNamespace: string, includes: IncludeAggregator | null): CollectionNameAndType[];
    getReferencedSuperType(inNamespace: string, includes: IncludeAggregator | null): string;
    convertValueFromLocal(inNamespace: string, includes: IncludeAggregator | null, value: string | TypeValue): TypeValue;
    convertValueToLocal(_inNamespace: string, _includes: IncludeAggregator | null, value: string | TypeValue): TypeValue;
}

