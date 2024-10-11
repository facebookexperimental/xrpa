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
import { TargetCodeGenImpl, TypeSpec } from "./TargetCodeGen";
import { StructSpec, StructTypeDefinition, StructWithAccessorTypeDefinition } from "./TypeDefinition";
export declare class StructWithAccessorType extends StructType implements StructWithAccessorTypeDefinition {
    readonly dsIdentifierType: StructType;
    constructor(codegen: TargetCodeGenImpl, name: string, apiname: string, dsIdentifierType: StructType, parentType: StructTypeDefinition | undefined, fields: StructSpec, localTypeOverride?: TypeSpec);
    genLocalTypeDefinition(_inNamespace: string, _includes: IncludeAggregator | null): string[] | null;
    protected genReadWriteValueFunctions(_classSpec: ClassSpec): void;
    getReadAccessorType(inNamespace: string, includes: IncludeAggregator | null): string;
    getWriteAccessorType(inNamespace: string, includes: IncludeAggregator | null): string;
    genReadAccessorDefinition(inNamespace: string, includes: IncludeAggregator | null): ClassSpec | null;
    genWriteAccessorDefinition(inNamespace: string, includes: IncludeAggregator | null): ClassSpec | null;
    protected getDSType(): number;
    protected genStaticAccessorFields(classSpec: ClassSpec): void;
}

