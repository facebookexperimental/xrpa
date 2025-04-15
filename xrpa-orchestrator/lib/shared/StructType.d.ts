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
import { StructSpec, StructTypeDefinition, TypeDefinition, TypeMetaType, TypeSize, UserDefaultValue } from "./TypeDefinition";
import { TypeValue } from "./TypeValue";
import { ClassSpec, ClassVisibility } from "./ClassSpec";
export interface FieldTransforms {
    fieldsFromLocal: Record<string, TypeValue>;
    fieldsToLocal: Record<string, TypeValue>;
}
export declare class StructType extends PrimitiveType implements StructTypeDefinition {
    readonly apiname: string;
    readonly parentType: StructTypeDefinition | undefined;
    readonly fields: StructSpec;
    readonly localTypeOverride?: TypeSpec | undefined;
    readonly properties: Record<string, unknown>;
    constructor(codegen: TargetCodeGenImpl, name: string, apiname: string, parentType: StructTypeDefinition | undefined, fields: StructSpec, localTypeOverride?: TypeSpec | undefined, properties?: Record<string, unknown>);
    getMetaType(): TypeMetaType;
    getHashData(): Record<string, unknown>;
    getTypeSize(): TypeSize;
    getApiName(): string;
    getAllFields(): StructSpec;
    getStateFields(): StructSpec;
    getFieldsOfType<T extends TypeDefinition>(typeFilter: (typeDef: TypeDefinition | undefined) => typeDef is T): Record<string, T>;
    getFieldIndex(fieldName: string): number;
    getFieldBitMask(fieldName: string): number;
    getStateField(fieldName: string): TypeDefinition;
    userDefaultToTypeValue(inNamespace: string, includes: IncludeAggregator | null, userDefault: UserDefaultValue): TypeValue | undefined;
    declareLocalFieldClassMember(classSpec: ClassSpec, fieldName: string, memberName: string, includeComments: boolean, decorations: string[], visibility?: ClassVisibility): void;
    resetLocalFieldVarToDefault(inNamespace: string, includes: IncludeAggregator | null, fieldName: string, varName: string, isSetter?: boolean): string[];
    private getFieldTypes;
    protected getFieldTransforms(inNamespace: string, includes: IncludeAggregator | null): FieldTransforms;
    protected genReadWriteValueFunctions(classSpec: ClassSpec): void;
    genTypeDefinition(includes: IncludeAggregator | null): string[] | null;
    genLocalTypeDefinition(inNamespace: string, includes: IncludeAggregator | null): string[] | null;
    convertValueFromLocal(inNamespace: string, includes: IncludeAggregator | null, value: string | TypeValue): TypeValue;
    convertValueToLocal(inNamespace: string, includes: IncludeAggregator | null, value: string | TypeValue): TypeValue;
    getDatasetDefaultFieldValues(inNamespace: string, includes: IncludeAggregator | null, isSetter?: boolean): TypeValue;
    getInternalDefaultValue(inNamespace: string, includes: IncludeAggregator | null, isSetter?: boolean, defaultOverride?: UserDefaultValue | TypeValue): TypeValue;
}

