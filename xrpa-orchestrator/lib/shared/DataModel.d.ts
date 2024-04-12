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


import { CoordinateSystemDef } from "./CoordinateTransformer";
import { DataStoreDefinition } from "./DataStore";
import { HashValue } from "./Helpers";
import { ModuleDefinition, UserTypeSpec } from "./ModuleDefinition";
import { CollectionTypeDefinition, FieldTypeSpec, InterfaceTypeDefinition, MessageDataTypeDefinition, StructTypeDefinition, TypeDefinition, TypeMap } from "./TypeDefinition";
export type UserStructSpec = Record<string, UserTypeSpec>;
export declare class DataModelDefinition {
    readonly moduleDef: ModuleDefinition;
    readonly dataStore: DataStoreDefinition;
    private collectionCount;
    private dataModelName;
    private typeDefinitions;
    storedCoordinateSystem: CoordinateSystemDef;
    localCoordinateSystem: CoordinateSystemDef;
    typeMap: TypeMap;
    constructor(moduleDef: ModuleDefinition, dataStore: DataStoreDefinition);
    getCollectionCount(): number;
    setName(name: string): void;
    setStoredCoordinateSystem(storedCoordinateSystem: CoordinateSystemDef): void;
    getType(name: string): TypeDefinition | undefined;
    private addType;
    getApiName(): string;
    TypeField(typename: string, description?: string): FieldTypeSpec;
    BooleanField(defaultValue?: boolean, description?: string): FieldTypeSpec;
    ScalarField(defaultValue?: number, description?: string): FieldTypeSpec;
    CountField(defaultValue?: number, description?: string): FieldTypeSpec;
    AngleField(defaultValue?: number, description?: string): FieldTypeSpec;
    DistanceField(defaultValue?: number, description?: string): FieldTypeSpec;
    StringField(defaultValue?: string, description?: string): FieldTypeSpec;
    SignalField(description?: string): FieldTypeSpec;
    addEnum(name: string, enumValues: string[]): TypeDefinition;
    addReference(toType: InterfaceTypeDefinition): TypeDefinition;
    addStruct(name: string, fields: UserStructSpec): StructTypeDefinition;
    addMessageStruct(name: string, fields: UserStructSpec): MessageDataTypeDefinition;
    addInterface(params: {
        name: string;
        fields?: UserStructSpec;
    }): InterfaceTypeDefinition;
    addCollection(params: {
        name: string;
        fields: UserStructSpec;
        interfaceType?: InterfaceTypeDefinition | undefined;
        maxCount: number;
    }): CollectionTypeDefinition;
    addFixedArray(innerType: UserTypeSpec, arraySize: number): TypeDefinition;
    addFixedString(maxBytes: number): TypeDefinition;
    private convertUserType;
    convertUserTypeSpec(typeSpec: UserTypeSpec): FieldTypeSpec;
    private convertUserStructSpec;
    convertMessagesStructSpec(parentName: string, messages: Record<string, UserStructSpec | null>): Record<string, MessageDataTypeDefinition>;
    getHash(): HashValue;
    getAllTypeDefinitions(): TypeDefinition[];
    getTypeDefinitionsForHeader(headerFile: string): TypeDefinition[];
    getInterfaces(): InterfaceTypeDefinition[];
    getCollections(): CollectionTypeDefinition[];
    private getStructMessagePoolSize;
    calcMessagePoolSize(): number;
}

