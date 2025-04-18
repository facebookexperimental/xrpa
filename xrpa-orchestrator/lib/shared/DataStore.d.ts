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


import { DataModelDefinition } from "./DataModel";
import { IncludeAggregator } from "./Helpers";
import { ModuleDefinition } from "./ModuleDefinition";
import { CollectionTypeDefinition, FieldTypeSpec, TypeMap } from "./TypeDefinition";
export type FieldAccessorNameOverride = string | [string, string];
export type FieldAccessorNames = Record<string, FieldAccessorNameOverride>;
export type PropertyBinding = string | Record<string, string>;
export interface ComponentProperties {
    basetype?: string;
    idName?: string;
    id?: [number, number];
    internalOnly?: boolean;
    ephemeralProperties?: Array<string>;
    fieldToPropertyBindings?: Record<string, PropertyBinding>;
    generateSpawner?: boolean;
}
export interface IndexConfiguration {
    indexFieldName: string;
    boundClassName?: string;
}
declare class BaseReconcilerDefinition {
    readonly storeDef: DataStoreDefinition;
    readonly type: CollectionTypeDefinition;
    readonly inboundFields: Array<string> | null;
    readonly outboundFields: Array<string> | null;
    readonly fieldAccessorNameOverrides: FieldAccessorNames;
    readonly componentProps: ComponentProperties;
    readonly indexConfigs: Array<IndexConfiguration>;
    constructor(storeDef: DataStoreDefinition, type: CollectionTypeDefinition, inboundFields: Array<string> | null, outboundFields: Array<string> | null, fieldAccessorNameOverrides: FieldAccessorNames, componentProps: ComponentProperties, indexConfigs: Array<IndexConfiguration>);
    isInboundField(fieldName: string): boolean;
    isOutboundField(fieldName: string): boolean;
    getFieldSpec(fieldName: string): FieldTypeSpec;
    getFieldPropertyBinding(fieldName: string): PropertyBinding | undefined;
    isFieldBoundToIntrinsic(fieldName: string): boolean;
    isEphemeralField(fieldName: string): boolean;
    isClearSetField(fieldName: string): boolean;
    isIndexedField(fieldName: string): boolean;
    isIndexBoundField(fieldName: string): boolean;
    isSerializedField(fieldName: string): boolean;
    getInboundChangeBits(): number;
    getOutboundChangeBits(): number;
    getOutboundChangeByteCount(params: {
        inNamespace: string;
        includes: IncludeAggregator | null;
        fieldToMemberVar: (fieldName: string) => string;
    }): string;
    getIndexedBitMask(): number;
    hasIndexedBinding(): boolean;
}
export declare class InputReconcilerDefinition extends BaseReconcilerDefinition {
    readonly inboundFields: null;
    constructor(storeDef: DataStoreDefinition, type: CollectionTypeDefinition, outboundFields: Array<string>, fieldAccessorNameOverrides: FieldAccessorNames, componentProps: ComponentProperties, indexConfigs: Array<IndexConfiguration>);
}
export declare class OutputReconcilerDefinition extends BaseReconcilerDefinition {
    readonly outboundFields: null;
    constructor(storeDef: DataStoreDefinition, type: CollectionTypeDefinition, inboundFields: Array<string>, fieldAccessorNameOverrides: FieldAccessorNames, componentProps: ComponentProperties, indexConfigs: Array<IndexConfiguration>);
}
export declare class DataStoreDefinition {
    readonly moduleDef: ModuleDefinition;
    readonly dataset: string;
    readonly isModuleProgramInterface: boolean;
    readonly typeMap: TypeMap;
    private inputs;
    private outputs;
    readonly apiname: string;
    readonly datamodel: DataModelDefinition;
    constructor(moduleDef: ModuleDefinition, dataset: string, isModuleProgramInterface: boolean, typeMap: TypeMap, apiname?: string);
    addInputReconciler(params: {
        type: CollectionTypeDefinition | string;
        outboundFields?: Array<string>;
        indexes?: Array<IndexConfiguration>;
        fieldAccessorNameOverrides?: FieldAccessorNames;
        componentProps?: ComponentProperties;
    }): InputReconcilerDefinition;
    getInputReconcilers(): ReadonlyArray<InputReconcilerDefinition>;
    addOutputReconciler(params: {
        type: CollectionTypeDefinition | string;
        inboundFields?: Array<string>;
        indexes?: Array<IndexConfiguration>;
        fieldAccessorNameOverrides?: FieldAccessorNames;
        componentProps?: ComponentProperties;
    }): OutputReconcilerDefinition;
    getOutputReconcilers(): ReadonlyArray<OutputReconcilerDefinition>;
    getAllReconcilers(): ReadonlyArray<InputReconcilerDefinition | OutputReconcilerDefinition>;
}
export {};

