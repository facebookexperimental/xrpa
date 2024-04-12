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
import { StructType } from "./StructType";
import { TargetCodeGenImpl } from "./TargetCodeGen";
import { ArrayTypeSpec, TypeDefinition, UserDefaultValue } from "./TypeDefinition";
export declare class FixedArrayType extends StructType {
    readonly innerType: TypeDefinition;
    readonly arraySize: number;
    readonly localArrayType: ArrayTypeSpec | undefined;
    constructor(codegen: TargetCodeGenImpl, name: string, apiname: string, innerType: TypeDefinition, arraySize: number, localArrayType: ArrayTypeSpec | undefined);
    getHashData(): Record<string, unknown>;
    resetLocalVarToDefault(inNamespace: string, includes: IncludeAggregator | null, varName: string, isSetter?: boolean, defaultOverride?: UserDefaultValue): string[];
}

