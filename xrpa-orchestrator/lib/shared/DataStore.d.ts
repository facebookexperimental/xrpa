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
import { ModuleDefinition } from "./ModuleDefinition";
import { XrpaSyntheticObject } from "./SyntheticObject";
import { TypeSpec } from "./TargetCodeGen";
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
}
export interface IndexedReconciledParams {
    fieldName: string;
    indexedTypeName: string;
}
declare class BaseReconcilerDefinition {
    readonly type: CollectionTypeDefinition;
    readonly inboundFields: Array<string> | null;
    readonly outboundFields: Array<string> | null;
    readonly fieldAccessorNameOverrides: FieldAccessorNames;
    readonly componentProps: ComponentProperties;
    constructor(type: CollectionTypeDefinition, inboundFields: Array<string> | null, outboundFields: Array<string> | null, fieldAccessorNameOverrides: FieldAccessorNames, componentProps: ComponentProperties);
    isInboundField(fieldName: string): boolean;
    isOutboundField(fieldName: string): boolean;
    getFieldSpec(fieldName: string): FieldTypeSpec;
    getFieldPropertyBinding(fieldName: string): PropertyBinding | undefined;
    isFieldBoundToIntrinsic(fieldName: string): boolean;
    isEphemeralField(fieldName: string): boolean;
    isClearSetField(fieldName: string): boolean;
    isSerializedField(fieldName: string, indexedFieldName: string | null): boolean;
    getInboundChangeBits(): number;
    getOutboundChangeBits(): number;
}
export declare class InputReconcilerDefinition extends BaseReconcilerDefinition {
    private useGenericReconciledType;
    readonly indexedReconciled?: IndexedReconciledParams | undefined;
    readonly inboundFields: null;
    constructor(type: CollectionTypeDefinition, outboundFields: Array<string>, fieldAccessorNameOverrides: FieldAccessorNames, componentProps: ComponentProperties, useGenericReconciledType?: boolean, indexedReconciled?: IndexedReconciledParams | undefined);
    shouldGenerateConcreteReconciledType(): boolean;
    getDataStoreAccessorName(): string;
}
export declare class OutputReconcilerDefinition extends BaseReconcilerDefinition {
    readonly outboundFields: null;
    constructor(type: CollectionTypeDefinition, inboundFields: Array<string>, fieldAccessorNameOverrides: FieldAccessorNames, componentProps: ComponentProperties);
    getDataStoreAccessorName(): string;
}
export declare class DataStoreDefinition {
    readonly moduleDef: ModuleDefinition;
    readonly dataset: string;
    readonly typeMap: TypeMap;
    private inputs;
    private outputs;
    private syntheticObjects;
    readonly apiname: string;
    readonly datamodel: DataModelDefinition;
    constructor(moduleDef: ModuleDefinition, dataset: string, typeMap: TypeMap, apiname?: string);
    addInputReconciler(params: {
        type: CollectionTypeDefinition | string;
        outboundFields?: Array<string>;
        reconciledTo?: TypeSpec;
        indexedReconciled?: IndexedReconciledParams;
        fieldAccessorNameOverrides?: FieldAccessorNames;
        componentProps?: ComponentProperties;
        useGenericReconciledType?: boolean;
    }): InputReconcilerDefinition;
    getInputReconcilers(): ReadonlyArray<InputReconcilerDefinition>;
    addOutputReconciler(params: {
        type: CollectionTypeDefinition | string;
        inboundFields?: Array<string>;
        fieldAccessorNameOverrides?: FieldAccessorNames;
        componentProps?: ComponentProperties;
    }): OutputReconcilerDefinition;
    getOutputReconcilers(): ReadonlyArray<OutputReconcilerDefinition>;
    addSyntheticObject(name: string, objectDef: XrpaSyntheticObject): void;
    getSyntheticObjects(): Record<string, XrpaSyntheticObject>;
}
export {};

