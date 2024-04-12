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


import { TargetCodeGenImpl } from "./TargetCodeGen";
export interface TypeValue {
    toString(inNamespace: string): string;
}
export declare class PrimitiveValue implements TypeValue {
    readonly codegen: TargetCodeGenImpl;
    readonly typename: string;
    readonly value: string | boolean | number;
    constructor(codegen: TargetCodeGenImpl, typename: string, value: string | boolean | number);
    toString(): string;
}
export declare class EnumValue implements TypeValue {
    readonly codegen: TargetCodeGenImpl;
    readonly typename: string;
    readonly enumValue: string;
    readonly defaultNamespace: string;
    constructor(codegen: TargetCodeGenImpl, typename: string, enumValue: string, defaultNamespace: string);
    toString(inNamespace: string): string;
}
export declare class CodeLiteralValue implements TypeValue {
    readonly codegen: TargetCodeGenImpl;
    readonly code: string;
    constructor(codegen: TargetCodeGenImpl, code: string);
    toString(): string;
}
export declare class EmptyValue implements TypeValue {
    readonly codegen: TargetCodeGenImpl;
    readonly typename: string;
    readonly defaultNamespace: string;
    constructor(codegen: TargetCodeGenImpl, typename: string, defaultNamespace: string);
    toString(inNamespace: string): string;
}
export declare class StructValue implements TypeValue {
    readonly codegen: TargetCodeGenImpl;
    readonly typename: string;
    readonly hasInitializerConstructor: boolean;
    readonly fieldValues: [string, TypeValue][];
    readonly defaultNamespace: string;
    constructor(codegen: TargetCodeGenImpl, typename: string, hasInitializerConstructor: boolean, fieldValues: [string, TypeValue][], defaultNamespace: string);
    toString(inNamespace: string): string;
}
export declare function isTypeValue(val: unknown): val is TypeValue;
export declare function isSameTypeValue(a: TypeValue, b: TypeValue): boolean;

