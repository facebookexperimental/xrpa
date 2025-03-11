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
import { TargetCodeGenImpl, TypeSpec } from "./TargetCodeGen";
import { DSTypeSpec, TypeDefinition, TypeMetaType, TypeSize, UserDefaultValue } from "./TypeDefinition";
import { TypeValue } from "./TypeValue";
export declare class PrimitiveType implements TypeDefinition {
    readonly codegen: TargetCodeGenImpl;
    readonly name: string;
    datasetType: DSTypeSpec;
    localType: TypeSpec;
    readonly byteCount: TypeSize | number;
    readonly isPassthrough: boolean;
    readonly defaultValue: TypeValue;
    readonly setterDefaultValue: TypeValue;
    constructor(codegen: TargetCodeGenImpl, name: string, datasetType: DSTypeSpec, localType: TypeSpec, byteCount: TypeSize | number, isPassthrough: boolean, defaultValue: TypeValue, setterDefaultValue?: TypeValue);
    toString(): string;
    getName(): string;
    getMetaType(): TypeMetaType;
    getTypeSize(): TypeSize;
    getRuntimeByteCount(varName: string, inNamespace: string, includes: IncludeAggregator | null): [number, string | null];
    getHashData(): Record<string, unknown>;
    getInternalType(inNamespace: string, includes: IncludeAggregator | null): string;
    getLocalType(inNamespace: string, includes: IncludeAggregator | null): string;
    getLocalHeaderFile(): string | undefined;
    userDefaultToTypeValue(_inNamespace: string, _includes: IncludeAggregator | null, userDefault: UserDefaultValue): TypeValue | undefined;
    convertValueFromLocal(_inNamespace: string, _includes: IncludeAggregator | null, value: string | TypeValue): TypeValue;
    convertValueToLocal(_inNamespace: string, _includes: IncludeAggregator | null, value: string | TypeValue): TypeValue;
    getInternalDefaultValue(inNamespace: string, includes: IncludeAggregator | null, isSetter?: boolean, defaultOverride?: UserDefaultValue | TypeValue): TypeValue;
    getLocalDefaultValue(inNamespace: string, includes: IncludeAggregator | null, isSetter?: boolean, defaultOverride?: UserDefaultValue | TypeValue): TypeValue;
    genTypeDefinition(_includes: IncludeAggregator | null): string[] | null;
    genLocalTypeDefinition(_inNamespace: string, _includes: IncludeAggregator | null): string[] | null;
    genTargetSpecificTypeDefinition(_inNamespace: string, _includes: IncludeAggregator | null): string[] | null;
    declareLocalVar(inNamespace: string, includes: IncludeAggregator | null, varName: string, defaultOverride?: UserDefaultValue | TypeValue): string;
    declareLocalParam(inNamespace: string, includes: IncludeAggregator | null, paramName: string): string;
    declareLocalReturnType(inNamespace: string, includes: IncludeAggregator | null, canBeRef: boolean): string;
    resetLocalVarToDefault(inNamespace: string, includes: IncludeAggregator | null, varName: string, isSetter?: boolean, defaultOverride?: UserDefaultValue): string[];
}

