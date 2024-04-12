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


import { BuiltinType } from "./BuiltinTypes";
import { CodeGen } from "./CodeGen";
import { CoordinateSystemDef } from "./CoordinateTransformer";
import { DataMapDefinition } from "./DataMap";
import { DataModelDefinition } from "./DataModel";
import { ComponentProperties, DataStoreDefinition, IndexedReconciledParams } from "./DataStore";
import { FileWriter } from "./FileWriter";
import { StructType } from "./StructType";
import { GuidGenSpec, TargetCodeGenImpl, TypeSpec } from "./TargetCodeGen";
import { CollectionTypeDefinition, FieldTypeSpec, InterfaceTypeDefinition, MessageDataTypeDefinition, StructSpec, StructTypeDefinition, TypeDefinition, TypeMap, UserDefaultValue } from "./TypeDefinition";
export interface UserFieldTypeSpec {
    type: string;
    description?: string;
    defaultValue?: UserDefaultValue;
}
export type UserTypeSpec = FieldTypeSpec | UserFieldTypeSpec | string | TypeDefinition;
export declare function isTypeDefinition(val: unknown): val is TypeDefinition;
export declare function isUserFieldTypeSpec(val: unknown): val is UserFieldTypeSpec;
export declare abstract class ModuleDefinition implements CodeGen {
    readonly codegen: TargetCodeGenImpl;
    readonly name: string;
    readonly datamap: DataMapDefinition;
    readonly guidGen: GuidGenSpec;
    private datastores;
    private settingsType;
    private settingsSpec;
    protected primitiveTypes: Record<string, TypeDefinition>;
    readonly DSIdentifier: StructType;
    constructor(codegen: TargetCodeGenImpl, name: string, datamap: DataMapDefinition, guidGen: GuidGenSpec);
    protected abstract createDSIdentifier(): StructTypeDefinition;
    getTypeMap(): TypeMap;
    getLocalCoordinateSystem(): CoordinateSystemDef;
    addDataStore(params: {
        dataset: string;
        typeMap?: TypeMap;
        apiname?: string;
        datamodel?: (datamodel: DataModelDefinition) => void;
    }): DataStoreDefinition;
    getDataStores(): ReadonlyArray<DataStoreDefinition>;
    addSetting(name: string, setting: UserTypeSpec): void;
    private convertUserTypeSpec;
    getSettings(): StructTypeDefinition;
    BooleanField(defaultValue?: boolean, description?: string): FieldTypeSpec;
    ScalarField(defaultValue?: number, description?: string): FieldTypeSpec;
    CountField(defaultValue?: number, description?: string): FieldTypeSpec;
    BitFieldField(defaultValue?: number, description?: string): FieldTypeSpec;
    StringField(defaultValue?: string, description?: string): FieldTypeSpec;
    getPrimitiveTypeDefinition(typeName: string): TypeDefinition;
    getBuiltinTypeDefinition(typeName: BuiltinType, apiname: string, datamodel: DataModelDefinition): TypeDefinition;
    createEnum(name: string, apiname: string, enumValues: Record<string, number>, localTypeOverride: TypeSpec | undefined): TypeDefinition;
    createReference(toType: InterfaceTypeDefinition): TypeDefinition;
    createStruct(name: string, apiname: string, fields: StructSpec, localTypeOverride: TypeSpec | undefined): StructTypeDefinition;
    createMessageStruct(name: string, apiname: string, fields: StructSpec): MessageDataTypeDefinition;
    createInterface(name: string, apiname: string, fields: StructSpec): InterfaceTypeDefinition;
    createCollection(name: string, apiname: string, fields: StructSpec, interfaceType: InterfaceTypeDefinition | undefined, maxCount: number, dsType: number): CollectionTypeDefinition;
    createFixedArray(name: string, apiname: string, innerType: TypeDefinition, arraySize: number): TypeDefinition;
    createFixedString(name: string, apiname: string, maxBytes: number): TypeDefinition;
    setCollectionAsInbound(type: CollectionTypeDefinition, reconciledTo: TypeSpec | undefined, _indexedReconciled: IndexedReconciledParams | undefined): void;
    setCollectionAsOutbound(type: CollectionTypeDefinition, _componentProps: ComponentProperties): void;
    abstract doCodeGen(): FileWriter;
}

