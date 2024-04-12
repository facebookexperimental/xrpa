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


import { EnumType } from "../../shared/EnumType";
import { IncludeAggregator } from "../../shared/Helpers";
import { StructType } from "../../shared/StructType";
import { TargetCodeGenImpl, TypeSpec } from "../../shared/TargetCodeGen";
import { StructSpec, StructTypeDefinition } from "../../shared/TypeDefinition";
export declare class EnumTypeUe extends EnumType {
    constructor(codegen: TargetCodeGenImpl, enumName: string, apiname: string, enumValues: Record<string, number>);
    genLocalTypeDefinition(_inNamespace: string, _includes: IncludeAggregator | null): string[] | null;
    genTargetSpecificTypeDefinition(inNamespace: string, includes: IncludeAggregator | null): string[] | null;
}
export declare class StructTypeUe extends StructType {
    constructor(codegen: TargetCodeGenImpl, name: string, apiname: string, parentType: StructTypeDefinition | undefined, fields: StructSpec, localTypeOverride?: TypeSpec);
    genLocalTypeDefinition(_inNamespace: string, _includes: IncludeAggregator | null): string[] | null;
    genTargetSpecificTypeDefinition(inNamespace: string, includes: IncludeAggregator | null): string[] | null;
}

