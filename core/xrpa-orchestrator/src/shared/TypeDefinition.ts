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
  typename: string; // fully qualified
  headerFile?: string;
  setSize: string | null;
  removeAll: string;
  addItem: string;
}

export enum TypeMetaType {
  GET_SET,
  CLEAR_SET,
  TYPE_REFERENCE,
  STRUCT,
  MESSAGE_DATA,
  SIGNAL_DATA,
  INTERFACE,
  COLLECTION,
}

export interface TypeSize {
  staticSize: number;
  dynamicSizeEstimate: number;
}

export interface TypeDefinition {
  getName(): string;
  getMetaType(): TypeMetaType;

  getTypeSize(): TypeSize;
  getRuntimeByteCount(varName: string, inNamespace: string, includes: IncludeAggregator|null): [number, string|null];
  getHashData(): Record<string, unknown>;

  getInternalType(inNamespace: string, includes: IncludeAggregator|null): string;
  getInternalDefaultValue(inNamespace: string, includes: IncludeAggregator|null, isSetter?: boolean, defaultOverride?: UserDefaultValue|TypeValue): TypeValue;

  getLocalType(inNamespace: string, includes: IncludeAggregator|null): string;
  getLocalHeaderFile(): string | undefined;

  userDefaultToTypeValue(inNamespace: string, includes: IncludeAggregator|null, userDefault: UserDefaultValue): TypeValue|undefined;

  convertValueFromLocal(inNamespace: string, includes: IncludeAggregator|null, value: string|TypeValue): TypeValue;
  convertValueToLocal(inNamespace: string, includes: IncludeAggregator|null, value: string|TypeValue): TypeValue;

  getLocalDefaultValue(inNamespace: string, includes: IncludeAggregator|null, isSetter?: boolean, defaultOverride?: UserDefaultValue|TypeValue): TypeValue;

  genTypeDefinition(includes: IncludeAggregator|null): string[] | null;
  genLocalTypeDefinition(inNamespace: string, includes: IncludeAggregator|null): string[] | null;
  genTargetSpecificTypeDefinition(inNamespace: string, includes: IncludeAggregator|null): string[] | null;

  // for member and local variable declarations
  // will initialize the value to default if needed
  // clear/set types will initialize to the clear value
  declareLocalVar(inNamespace: string, includes: IncludeAggregator|null, varName: string, defaultOverride?: UserDefaultValue|TypeValue): string;

  // will constref if needed
  // does not initialize the value, as it is a function parameter
  // paramName may be empty
  declareLocalParam(inNamespace: string, includes: IncludeAggregator|null, paramName: string): string;

  // for declaring function return types
  // canBeRef=true will use constref if needed
  declareLocalReturnType(inNamespace: string, includes: IncludeAggregator|null, canBeRef: boolean): string;

  // will generate (possibly) multiple lines of code to assign a variable back to its default value
  // isSetter=true will use the SET default value for clear/set types
  resetLocalVarToDefault(inNamespace: string, includes: IncludeAggregator|null, varName: string, isSetter?: boolean, defaultOverride?: UserDefaultValue): string[];
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
  getFieldsOfType<T extends TypeDefinition>(typeFilter: (typeDef: TypeDefinition|undefined) => typeDef is T): Record<string, T>;
  getFieldBitMask(fieldName: string): number;
  getFieldIndex(fieldName: string): number;
  getStateField(fieldName: string): TypeDefinition;

  // for member and local variable declarations
  // will initialize the value if needed
  // clear/set types will initialize to the clear value
  // will pull default value from the StructSpec, if provided
  declareLocalFieldClassMember(classSpec: ClassSpec, fieldName: string, memberName: string, includeComments: boolean, decorations: string[], visibility?: ClassVisibility): void;

  // will generate (possibly) multiple lines of code to assign a variable back to its default value
  // will pull default value from the StructSpec, if provided
  // isSetter=true will use the SET default value for clear/set types
  resetLocalFieldVarToDefault(inNamespace: string, includes: IncludeAggregator|null, fieldName: string, varName: string, isSetter?: boolean): string[];
}

export interface StructWithAccessorTypeDefinition extends StructTypeDefinition {
  getReadAccessorType(inNamespace: string, includes: IncludeAggregator|null): string;
  getWriteAccessorType(inNamespace: string, includes: IncludeAggregator|null): string;

  genReadAccessorDefinition(inNamespace: string, includes: IncludeAggregator|null): ClassSpec | null;
  genWriteAccessorDefinition(inNamespace: string, includes: IncludeAggregator|null): ClassSpec | null;
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
  getLocalTypePtr(inNamespace: string, includes: IncludeAggregator|null): string;
  getCompatibleTypeList(inNamespace: string, includes: IncludeAggregator|null): CollectionNameAndType[];
  registerCollection(collection: CollectionTypeDefinition): void;
}

export interface CollectionTypeDefinition extends InterfaceTypeDefinition {
  readonly maxCount: number;
  readonly interfaceType: InterfaceTypeDefinition | undefined;

  getCollectionId(): number;
}

export interface ReferenceTypeDefinition extends TypeDefinition {
  readonly toType: InterfaceTypeDefinition;
  getReferencedTypeList(inNamespace: string, includes: IncludeAggregator|null): CollectionNameAndType[];
  getReferencedSuperType(inNamespace: string, includes: IncludeAggregator|null): string;
}

export function typeIsClearSet(typeDef: TypeDefinition) {
  const mt = typeDef.getMetaType();
  return mt === TypeMetaType.CLEAR_SET;
}

export function typeIsStruct(typeDef: TypeDefinition|undefined): typeDef is StructTypeDefinition {
  const mt = typeDef?.getMetaType();
  return mt === TypeMetaType.STRUCT || mt === TypeMetaType.MESSAGE_DATA || mt === TypeMetaType.INTERFACE || mt === TypeMetaType.COLLECTION;
}

export function typeIsStructWithAccessor(typeDef: TypeDefinition|undefined): typeDef is StructWithAccessorTypeDefinition {
  const mt = typeDef?.getMetaType();
  return mt === TypeMetaType.MESSAGE_DATA || mt === TypeMetaType.INTERFACE || mt === TypeMetaType.COLLECTION;
}

export function typeIsMessageData(typeDef: TypeDefinition|undefined): typeDef is MessageDataTypeDefinition {
  const mt = typeDef?.getMetaType();
  return mt === TypeMetaType.MESSAGE_DATA;
}

export function typeIsSignalData(typeDef: TypeDefinition|undefined): typeDef is SignalDataTypeDefinition {
  const mt = typeDef?.getMetaType();
  return mt === TypeMetaType.SIGNAL_DATA;
}

export function typeIsInterface(typeDef: TypeDefinition|undefined): typeDef is InterfaceTypeDefinition {
  const mt = typeDef?.getMetaType();
  return mt === TypeMetaType.INTERFACE || mt === TypeMetaType.COLLECTION;
}

export function typeIsCollection(typeDef: TypeDefinition|undefined): typeDef is CollectionTypeDefinition {
  const mt = typeDef?.getMetaType();
  return mt === TypeMetaType.COLLECTION;
}

export function typeIsReference(typeDef: TypeDefinition|undefined): typeDef is ReferenceTypeDefinition {
  const mt = typeDef?.getMetaType();
  return mt === TypeMetaType.TYPE_REFERENCE;
}

export function typeIsEnum(typeDef: TypeDefinition|undefined): boolean {
  return Boolean(typeDef && typeof typeDef === "object" && (typeDef as unknown as Record<string, unknown>).enumValues);
}

export function typeIsStateData(typeDef: TypeDefinition|undefined): boolean {
  return !typeIsMessageData(typeDef) && !typeIsSignalData(typeDef);
}
