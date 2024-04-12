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
import { TargetCodeGenImpl, TypeSpec } from "./TargetCodeGen";
import { UserDefaultValue } from "./TypeDefinition";
import { TypeValue } from "./TypeValue";
export declare class EnumType extends PrimitiveType {
    readonly enumName: string;
    readonly enumValues: Record<string, number>;
    readonly localTypeOverride?: TypeSpec | undefined;
    constructor(codegen: TargetCodeGenImpl, enumName: string, apiname: string, enumValues: Record<string, number>, localTypeOverride?: TypeSpec | undefined);
    getHashData(): Record<string, unknown>;
    userDefaultToTypeValue(inNamespace: string, _includes: IncludeAggregator | null, userDefault: UserDefaultValue): TypeValue | undefined;
    genTypeDefinition(): string[] | null;
    convertValueFromLocal(inNamespace: string, includes: IncludeAggregator | null, value: string | TypeValue): TypeValue;
    convertValueToLocal(inNamespace: string, includes: IncludeAggregator | null, value: string | TypeValue): TypeValue;
}

