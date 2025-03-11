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


import { ClassSpec, ClassVisibility } from "./ClassSpec";
import { IncludeAggregator } from "./Helpers";
import { TypeSpec } from "./TargetCodeGen";
import { TypeValue } from "./TypeValue";
export type UserDefaultValue = string | number | boolean | Array<number> | undefined;
export type DSTypeSpec = Omit<TypeSpec, "fieldMap">;
export type TypeMap = Record<string, TypeSpec>;
export interface ArrayTypeSpec {
    typename: string;
    headerFile?: string;
    setSize: string | null;
    removeAll: string;
    addItem: string;
}
export declare enum TypeMetaType {
    GET_SET = 0,
    CLEAR_SET = 1,
    TYPE_REFERENCE = 2,
    STRUCT = 3,
    MESSAGE_DATA = 4,
    SIGNAL_DATA = 5,
    INTERFACE = 6,
    COLLECTION = 7
}
export interface TypeSize {
    staticSize: number;
    dynamicSizeEstimate: number;
}
export interface TypeDefinition {
    getName(): string;
    getMetaType(): TypeMetaType;
    getTypeSize(): TypeSize;
    getRuntimeByteCount(varName: string, inNamespace: string, includes: IncludeAggregator | null): [number, string | null];
    getHashData(): Record<string, unknown>;
    getInternalType(inNamespace: string, includes: IncludeAggregator | null): string;
    getInternalDefaultValue(inNamespace: string, includes: IncludeAggregator | null, isSetter?: boolean, defaultOverride?: UserDefaultValue | TypeValue): TypeValue;
    getLocalType(inNamespace: string, includes: IncludeAggregator | null): string;
    getLocalHeaderFile(): string | undefined;
    userDefaultToTypeValue(inNamespace: string, includes: IncludeAggregator | null, userDefault: UserDefaultValue): TypeValue | undefined;
    convertValueFromLocal(inNamespace: string, includes: IncludeAggregator | null, value: string | TypeValue): TypeValue;
    convertValueToLocal(inNamespace: string, includes: IncludeAggregator | null, value: string | TypeValue): TypeValue;
    getLocalDefaultValue(inNamespace: string, includes: IncludeAggregator | null, isSetter?: boolean, defaultOverride?: UserDefaultValue | TypeValue): TypeValue;
    genTypeDefinition(includes: IncludeAggregator | null): string[] | null;
    genLocalTypeDefinition(inNamespace: string, includes: IncludeAggregator | null): string[] | null;
    genTargetSpecificTypeDefinition(inNamespace: string, includes: IncludeAggregator | null): string[] | null;
    declareLocalVar(inNamespace: string, includes: IncludeAggregator | null, varName: string, defaultOverride?: UserDefaultValue | TypeValue): string;
    declareLocalParam(inNamespace: string, includes: IncludeAggregator | null, paramName: string): string;
    declareLocalReturnType(inNamespace: string, includes: IncludeAggregator | null, canBeRef: boolean): string;
    resetLocalVarToDefault(inNamespace: string, includes: IncludeAggregator | null, varName: string, isSetter?: boolean, defaultOverride?: UserDefaultValue): string[];
}
export interface FieldTypeSpec {
    type: TypeDefinition;
    description?: string;
    defaultValue?: UserDefaultValue;
}
export type StructSpec = Record<string, FieldTypeSpec>;
export interface StructTypeDefinition extends TypeDefinition {
    getApiName(): string;
    getAllFields(): StructSpec;
    getStateFields(): StructSpec;
    getFieldsOfType<T extends TypeDefinition>(typeFilter: (typeDef: TypeDefinition | undefined) => typeDef is T): Record<string, T>;
    getFieldBitMask(fieldName: string): number;
    getFieldIndex(fieldName: string): number;
    getStateField(fieldName: string): TypeDefinition;
    declareLocalFieldClassMember(classSpec: ClassSpec, fieldName: string, memberName: string, includeComments: boolean, decorations: string[], visibility?: ClassVisibility): void;
    resetLocalFieldVarToDefault(inNamespace: string, includes: IncludeAggregator | null, fieldName: string, varName: string, isSetter?: boolean): string[];
}
export interface StructWithAccessorTypeDefinition extends StructTypeDefinition {
    getReadAccessorType(inNamespace: string, includes: IncludeAggregator | null): string;
    getWriteAccessorType(inNamespace: string, includes: IncludeAggregator | null): string;
    genReadAccessorDefinition(inNamespace: string, includes: IncludeAggregator | null): ClassSpec | null;
    genWriteAccessorDefinition(inNamespace: string, includes: IncludeAggregator | null): ClassSpec | null;
}
export interface MessageDataTypeDefinition extends StructWithAccessorTypeDefinition {
    getMetaType(): TypeMetaType.MESSAGE_DATA;
    hasFields(): boolean;
    getExpectedRatePerSecond(): number;
}
export interface SignalDataTypeDefinition extends TypeDefinition {
    getMetaType(): TypeMetaType.SIGNAL_DATA;
    getExpectedBytesPerSecond(): number;
}
export interface CollectionNameAndType {
    collectionName: string;
    typeName: string;
}
export interface InterfaceTypeDefinition extends StructWithAccessorTypeDefinition {
    getLocalTypePtr(inNamespace: string, includes: IncludeAggregator | null): string;
    getCompatibleTypeList(inNamespace: string, includes: IncludeAggregator | null): CollectionNameAndType[];
    registerCollection(collection: CollectionTypeDefinition): void;
    isBarePtr(): boolean;
    setToBarePtr(localType?: TypeSpec): void;
    getPtrType(): string;
}
export interface CollectionTypeDefinition extends InterfaceTypeDefinition {
    readonly maxCount: number;
    readonly interfaceType: InterfaceTypeDefinition | undefined;
    getCollectionId(): number;
}
export interface ReferenceTypeDefinition extends TypeDefinition {
    readonly toType: InterfaceTypeDefinition;
    getReferencedTypeList(inNamespace: string, includes: IncludeAggregator | null): CollectionNameAndType[];
    getReferencedSuperType(inNamespace: string, includes: IncludeAggregator | null): string;
}
export declare function typeIsClearSet(typeDef: TypeDefinition): boolean;
export declare function typeIsStruct(typeDef: TypeDefinition | undefined): typeDef is StructTypeDefinition;
export declare function typeIsStructWithAccessor(typeDef: TypeDefinition | undefined): typeDef is StructWithAccessorTypeDefinition;
export declare function typeIsMessageData(typeDef: TypeDefinition | undefined): typeDef is MessageDataTypeDefinition;
export declare function typeIsSignalData(typeDef: TypeDefinition | undefined): typeDef is SignalDataTypeDefinition;
export declare function typeIsInterface(typeDef: TypeDefinition | undefined): typeDef is InterfaceTypeDefinition;
export declare function typeIsCollection(typeDef: TypeDefinition | undefined): typeDef is CollectionTypeDefinition;
export declare function typeIsReference(typeDef: TypeDefinition | undefined): typeDef is ReferenceTypeDefinition;
export declare function typeIsEnum(typeDef: TypeDefinition | undefined): boolean;
export declare function typeIsStateData(typeDef: TypeDefinition | undefined): boolean;

