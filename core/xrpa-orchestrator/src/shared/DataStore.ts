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


import { assertIsKeyOf, filterToStringArray, isExcluded } from "@xrpa/xrpa-utils";

import { DataModelDefinition } from "./DataModel";
import { IncludeAggregator } from "./Helpers";
import { ModuleDefinition } from "./ModuleDefinition";
import { CollectionTypeDefinition, FieldTypeSpec, typeIsClearSet, typeIsCollection, TypeMap } from "./TypeDefinition";

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

class BaseReconcilerDefinition {
  constructor(
    readonly storeDef: DataStoreDefinition,
    readonly type: CollectionTypeDefinition,
    readonly inboundFields: Array<string> | null,
    readonly outboundFields: Array<string> | null,
    readonly fieldAccessorNameOverrides: FieldAccessorNames,
    readonly componentProps: ComponentProperties,
    readonly indexConfigs: Array<IndexConfiguration>,
  ) {
    const fields = this.type.getAllFields();

    for (const fieldName of (inboundFields ?? [])) {
      assertIsKeyOf(fieldName, fields);
    }

    for (const fieldName of (outboundFields ?? [])) {
      assertIsKeyOf(fieldName, fields);
    }

    for (const fieldName in fieldAccessorNameOverrides) {
      assertIsKeyOf(fieldName, fields);
    }
    if (componentProps.ephemeralProperties) {
      for (const fieldName of componentProps.ephemeralProperties) {
        assertIsKeyOf(fieldName, fields);
      }
    }
    if (componentProps.fieldToPropertyBindings) {
      for (const fieldName in componentProps.fieldToPropertyBindings) {
        assertIsKeyOf(fieldName, fields);
      }
    }
    for (const config of indexConfigs) {
      assertIsKeyOf(config.indexFieldName, fields);
    }
  }

  public isInboundField(fieldName: string): boolean {
    return isExcluded(fieldName, this.outboundFields, this.inboundFields);
  }

  public isOutboundField(fieldName: string): boolean {
    return isExcluded(fieldName, this.inboundFields, this.outboundFields);
  }

  public getFieldSpec(fieldName: string): FieldTypeSpec {
    return this.type.getAllFields()[fieldName];
  }

  public getFieldPropertyBinding(fieldName: string): PropertyBinding|undefined {
    return this.componentProps.fieldToPropertyBindings?.[fieldName];
  }

  public isFieldBoundToIntrinsic(fieldName: string): boolean {
    return Boolean(this.getFieldPropertyBinding(fieldName));
  }

  public isEphemeralField(fieldName: string): boolean {
    const isBoundToIntrinsic = this.isFieldBoundToIntrinsic(fieldName);
    return isBoundToIntrinsic || (filterToStringArray(this.componentProps.ephemeralProperties) ?? []).includes(fieldName);
  }

  public isClearSetField(fieldName: string): boolean {
    const isBoundToIntrinsic = this.isFieldBoundToIntrinsic(fieldName);
    return !isBoundToIntrinsic && typeIsClearSet(this.getFieldSpec(fieldName).type);
  }

  public isIndexedField(fieldName: string): boolean {
    return this.indexConfigs.find(config => config.indexFieldName === fieldName) !== undefined;
  }

  public isIndexBoundField(fieldName: string): boolean {
    return this.indexConfigs.find(config => config.boundClassName !== undefined && config.indexFieldName === fieldName) !== undefined;
  }

  public isSerializedField(fieldName: string): boolean {
    if (this.isInboundField(fieldName)) {
      return this.isIndexBoundField(fieldName);
    }
    return !this.isFieldBoundToIntrinsic(fieldName) && !this.isEphemeralField(fieldName) && !this.isClearSetField(fieldName);
  }

  public getInboundChangeBits() {
    let bitMask = 0;
    const fields = this.type.getStateFields();
    for (const fieldName in fields) {
      if (this.isInboundField(fieldName)) {
        bitMask |= this.type.getFieldBitMask(fieldName);
      }
    }
    return bitMask;
  }

  public getOutboundChangeBits() {
    let bitMask = 0;
    const fields = this.type.getStateFields();
    for (const fieldName in fields) {
      if (this.isOutboundField(fieldName)) {
        bitMask |= this.type.getFieldBitMask(fieldName);
      }
    }
    return bitMask;
  }

  public getOutboundChangeByteCount(params: {
    inNamespace: string;
    includes: IncludeAggregator|null;
    fieldToMemberVar: (fieldName: string) => string;
  }): string {
    const dynFieldSizes: string[] = [];
    let staticSize = 0;

    const fields = this.type.getStateFields();
    for (const fieldName in fields) {
      if (this.isOutboundField(fieldName)) {
        const byteCount = fields[fieldName].type.getRuntimeByteCount(params.fieldToMemberVar(fieldName), params.inNamespace, params.includes);
        staticSize += byteCount[0];
        if (byteCount[1] !== null) {
          dynFieldSizes.push(byteCount[1]);
        }
      }
    }

    dynFieldSizes.push(staticSize.toString());
    return dynFieldSizes.join(" + ");
  }

  public getIndexedBitMask() {
    const hasIndexedBinding = this.hasIndexedBinding();
    const indexedFields = new Set(this.indexConfigs.map(config => config.indexFieldName));
    let bitMask = 0;
    const fields = this.type.getStateFields();
    for (const fieldName in fields) {
      if (hasIndexedBinding || indexedFields.has(fieldName)) {
        bitMask |= this.type.getFieldBitMask(fieldName);
      }
    }
    return bitMask;
  }

  public hasIndexedBinding() {
    return this.indexConfigs.find(config => config.boundClassName !== undefined) !== undefined;
  }
}

export class InputReconcilerDefinition extends BaseReconcilerDefinition {
  readonly inboundFields = null;

  constructor(
    storeDef: DataStoreDefinition,
    type: CollectionTypeDefinition,
    outboundFields: Array<string>,
    fieldAccessorNameOverrides: FieldAccessorNames,
    componentProps: ComponentProperties,
    indexConfigs: Array<IndexConfiguration>,
  ) {
    super(storeDef, type, null, outboundFields, fieldAccessorNameOverrides, componentProps, indexConfigs);
  }
}

export class OutputReconcilerDefinition extends BaseReconcilerDefinition {
  readonly outboundFields = null;

  constructor(
    storeDef: DataStoreDefinition,
    type: CollectionTypeDefinition,
    inboundFields: Array<string>,
    fieldAccessorNameOverrides: FieldAccessorNames,
    componentProps: ComponentProperties,
    indexConfigs: Array<IndexConfiguration>,
  ) {
    super(storeDef, type, inboundFields, null, fieldAccessorNameOverrides, componentProps, indexConfigs);
  }
}

export class DataStoreDefinition {
  private inputs: Array<InputReconcilerDefinition> = [];
  private outputs: Array<OutputReconcilerDefinition> = [];

  public readonly apiname: string;
  public readonly datamodel: DataModelDefinition;

  constructor(
    readonly moduleDef: ModuleDefinition,
    readonly dataset: string,
    readonly isModuleProgramInterface: boolean,
    readonly typeMap: TypeMap,
    apiname?: string,
  ) {
    this.apiname = apiname ?? dataset;
    this.datamodel = new DataModelDefinition(moduleDef, this);
  }

  public addInputReconciler(
    params: {
      type: CollectionTypeDefinition | string,
      outboundFields?: Array<string>,
      indexes?: Array<IndexConfiguration>,
      fieldAccessorNameOverrides?: FieldAccessorNames,
      componentProps?: ComponentProperties,
    },
  ) {
    const type = typeof params.type === "string" ? this.datamodel.getType(params.type) : params.type;
    if (!type) {
      throw new Error(`Unknown type ${params.type}`);
    }
    if (!typeIsCollection(type)) {
      throw new Error(`Type ${params.type} is not a collection`);
    }
    const inputDef = new InputReconcilerDefinition(
      this,
      type,
      params.outboundFields ?? [],
      params.fieldAccessorNameOverrides ?? {},
      params.componentProps ?? {},
      params.indexes ?? [],
    );
    this.moduleDef.setCollectionAsInbound(type, inputDef.componentProps, inputDef.indexConfigs);
    this.inputs.push(inputDef);
    return inputDef;
  }

  public getInputReconcilers(): ReadonlyArray<InputReconcilerDefinition> {
    return this.inputs;
  }

  public addOutputReconciler(
    params: {
      type: CollectionTypeDefinition | string,
      inboundFields?: Array<string>,
      indexes?: Array<IndexConfiguration>,
      fieldAccessorNameOverrides?: FieldAccessorNames,
      componentProps?: ComponentProperties,
    },
  ) {
    const type = typeof params.type === "string" ? this.datamodel.getType(params.type) : params.type;
    if (!type) {
      throw new Error(`Unknown type ${params.type}`);
    }
    if (!typeIsCollection(type)) {
      throw new Error(`Type ${params.type} is not a collection`);
    }
    const outputDef = new OutputReconcilerDefinition(
      this,
      type,
      params.inboundFields ?? [],
      params.fieldAccessorNameOverrides ?? {},
      params.componentProps ?? {},
      params.indexes ?? [],
    );
    this.moduleDef.setCollectionAsOutbound(type, outputDef.componentProps);
    this.outputs.push(outputDef);
    return outputDef;
  }

  public getOutputReconcilers(): ReadonlyArray<OutputReconcilerDefinition> {
    return this.outputs;
  }

  public getAllReconcilers(): ReadonlyArray<InputReconcilerDefinition|OutputReconcilerDefinition> {
    return [...this.inputs, ...this.outputs];
  }
}
