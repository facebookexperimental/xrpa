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


import { FileWriter } from "@xrpa/xrpa-file-utils";
import assert from "assert";

import { BuiltinType, ByteArrayType, genPrimitiveTypes, getSemanticType } from "./BuiltinTypes";
import { CodeGen } from "./CodeGen";
import { CollectionType } from "./CollectionType";
import { CoordinateSystemDef } from "./CoordinateTransformer";
import { DataflowProgramDefinition } from "./DataflowProgramDefinition";
import { DataMapDefinition } from "./DataMap";
import { DataModelDefinition } from "./DataModel";
import { ComponentProperties, DataStoreDefinition, IndexConfiguration } from "./DataStore";
import { EnumType } from "./EnumType";
import { FixedArrayType } from "./FixedArrayType";
import { InterfaceType } from "./InterfaceType";
import { MessageDataType } from "./MessageDataType";
import { ReferenceType } from "./ReferenceType";
import { StructType } from "./StructType";
import { GuidGenSpec, TargetCodeGenImpl, TypeSpec } from "./TargetCodeGen";
import { CollectionTypeDefinition, FieldTypeSpec, InterfaceTypeDefinition, MessageDataTypeDefinition, StructSpec, StructTypeDefinition, TypeDefinition, TypeMap, UserDefaultValue } from "./TypeDefinition";

export interface UserFieldTypeSpec {
  type: string;
  description?: string;
  defaultValue?: UserDefaultValue;
}

export type UserTypeSpec = FieldTypeSpec | UserFieldTypeSpec | string | TypeDefinition;

export function isTypeDefinition(val: unknown): val is TypeDefinition {
  return typeof val === "object" && val !== null && typeof (val as Record<string, unknown>).getMetaType === "function";
}

export function isUserFieldTypeSpec(val: unknown): val is UserFieldTypeSpec {
  return typeof val === "object" && val !== null && typeof (val as Record<string, unknown>).type === "string";
}

export abstract class ModuleDefinition implements CodeGen {
  private datastores: Array<DataStoreDefinition> = [];
  private settingsType: StructTypeDefinition | null = null;
  private settingsSpec: StructSpec = {};
  protected primitiveTypes: Record<string, TypeDefinition>;
  private dataflowPrograms: Record<string, DataflowProgramDefinition> = {};

  readonly ObjectUuid: StructType;
  private codeGenDeps: CodeGen[] = [];

  constructor(
    readonly codegen: TargetCodeGenImpl,
    readonly name: string,
    readonly datamap: DataMapDefinition,
    readonly guidGen: GuidGenSpec,
  ) {
    this.primitiveTypes = genPrimitiveTypes(codegen, datamap.typeMap);
    this.ObjectUuid = this.createObjectUuid() as StructType;
  }

  protected abstract createObjectUuid(): StructTypeDefinition;

  public getTypeMap(): TypeMap {
    return this.datamap.typeMap;
  }

  public getLocalCoordinateSystem(): CoordinateSystemDef {
    return this.datamap.coordinateSystem;
  }

  public addDataStore(
    params: {
      dataset: string;
      isModuleProgramInterface: boolean;
      typeMap?: TypeMap;
      apiname?: string;
      datamodel?: (datamodel: DataModelDefinition) => void;
    }) {
    const datastore = new DataStoreDefinition(this, params.dataset, params.isModuleProgramInterface, params.typeMap ?? {}, params.apiname);
    this.datastores.push(datastore);
    if (params.datamodel) {
      params.datamodel(datastore.datamodel);
    }
    return datastore;
  }

  public getDataStores(): ReadonlyArray<DataStoreDefinition> {
    return this.datastores;
  }

  public getDataStore(name: string): DataStoreDefinition {
    const ret = this.datastores.find((ds) => ds.apiname === name);
    assert(ret !== undefined, `Datastore "${name}" not found`);
    return ret;
  }

  public addSetting(name: string, setting: UserTypeSpec) {
    assert(this.settingsSpec[name] === undefined, `Setting "${name}" already exists`);
    assert(!this.settingsType, "addSetting called too late");
    this.settingsSpec[name] = this.convertUserTypeSpec(setting);
  }

  public convertUserTypeSpec(typeSpec: UserTypeSpec): FieldTypeSpec {
    if (typeof typeSpec === "string") {
      return {
        type: this.getBuiltinTypeDefinition(typeSpec as BuiltinType),
      };
    } else if (isTypeDefinition(typeSpec)) {
      return {
        type: typeSpec,
      };
    } else if (isUserFieldTypeSpec(typeSpec)) {
      return {
        type: this.getBuiltinTypeDefinition(typeSpec.type as BuiltinType),
        defaultValue: typeSpec.defaultValue,
        description: typeSpec.description,
      };
    } else {
      return typeSpec;
    }
  }

  public getSettings(): StructTypeDefinition {
    if (!this.settingsType) {
      this.settingsType = this.createStruct(`${this.name}Settings`, "", this.settingsSpec, undefined);
    }
    return this.settingsType;
  }

  public BooleanField(defaultValue?: boolean, description?: string): FieldTypeSpec {
    return {
      type: this.getPrimitiveTypeDefinition(BuiltinType.Boolean),
      defaultValue,
      description,
    };
  }

  public ScalarField(defaultValue?: number, description?: string): FieldTypeSpec {
    return {
      type: this.getPrimitiveTypeDefinition(BuiltinType.Scalar),
      defaultValue,
      description,
    };
  }

  public CountField(defaultValue?: number, description?: string): FieldTypeSpec {
    return {
      type: this.getPrimitiveTypeDefinition(BuiltinType.Count),
      defaultValue,
      description,
    };
  }

  public BitFieldField(defaultValue?: number, description?: string): FieldTypeSpec {
    return {
      type: this.getPrimitiveTypeDefinition(BuiltinType.BitField),
      defaultValue,
      description,
    };
  }

  public StringField(defaultValue?: string, description?: string): FieldTypeSpec {
    return {
      type: this.getPrimitiveTypeDefinition(BuiltinType.String),
      defaultValue,
      description,
    };
  }

  public getPrimitiveTypeDefinition(typeName: string): TypeDefinition {
    const ret = this.primitiveTypes[typeName] as TypeDefinition | undefined;
    assert(ret !== undefined, `No type definition found for primitive type ${typeName}.`);
    return ret;
  }

  public getBuiltinTypeDefinition(typeName: BuiltinType, apiname?: string, datamodel?: DataModelDefinition): TypeDefinition {
    let ret = (this.primitiveTypes[typeName] as TypeDefinition | undefined) ?? null;
    if (!ret) {
      ret = getSemanticType(
        this.codegen,
        typeName,
        apiname ?? "",
        datamodel ? datamodel.typeMap : this.datamap.typeMap,
        datamodel ? datamodel.localCoordinateSystem : this.datamap.coordinateSystem,
        datamodel ? datamodel.storedCoordinateSystem : this.datamap.coordinateSystem,
      );
    }
    assert(ret, `No builtin type found for ${typeName}.`);
    return ret;
  }

  public createEnum(
    name: string,
    apiname: string,
    enumValues: Record<string, number>,
    localTypeOverride: TypeSpec | undefined,
  ): TypeDefinition {
    return new EnumType(this.codegen, name, apiname, enumValues, localTypeOverride);
  }

  public createReference(
    toType: InterfaceTypeDefinition,
  ): TypeDefinition {
    return new ReferenceType(this.codegen, toType, this.ObjectUuid);
  }

  public createStruct(
    name: string,
    apiname: string,
    fields: StructSpec,
    localTypeOverride: TypeSpec | undefined,
    properties?: Record<string, unknown>,
  ): StructTypeDefinition {
    return new StructType(this.codegen, name, apiname, undefined, fields, localTypeOverride, properties);
  }

  public createMessageStruct(
    name: string,
    apiname: string,
    fields: StructSpec,
    expectedRatePerSecond: number,
  ): MessageDataTypeDefinition {
    return new MessageDataType(this.codegen, name, apiname, this.ObjectUuid, fields, expectedRatePerSecond);
  }

  public createInterface(
    name: string,
    apiname: string,
    fields: StructSpec,
  ): InterfaceTypeDefinition {
    return new InterfaceType(this.codegen, name, apiname, this.ObjectUuid, fields);
  }

  public createCollection(
    name: string,
    apiname: string,
    fields: StructSpec,
    interfaceType: InterfaceTypeDefinition | undefined,
    maxCount: number,
    collectionId: number,
  ): CollectionTypeDefinition {
    return new CollectionType(this.codegen, name, apiname, this.ObjectUuid, fields, collectionId, maxCount, interfaceType);
  }

  public createFixedArray(
    name: string,
    apiname: string,
    innerType: TypeDefinition,
    arraySize: number,
  ): TypeDefinition {
    return new FixedArrayType(this.codegen, name, apiname, innerType, arraySize, this.datamap.localArrayType);
  }

  public createByteArray(
    expectedSize: number,
  ): TypeDefinition {
    return new ByteArrayType(this.codegen, expectedSize);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public setCollectionAsInbound(type: CollectionTypeDefinition, _componentProps: ComponentProperties, _indexes: Array<IndexConfiguration> | undefined): void {
    const collection = type as CollectionType;
    collection.localType = {
      typename: this.codegen.nsJoin(this.codegen.getDataStoreHeaderNamespace(collection.apiname), `Reconciled${type.getName()}`),
      headerFile: this.codegen.getDataStoreHeaderName(collection.apiname),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public setCollectionAsOutbound(type: CollectionTypeDefinition, _componentProps: ComponentProperties): void {
    const collection = type as CollectionType;
    collection.localType = {
      typename: this.codegen.nsJoin(this.codegen.getDataStoreHeaderNamespace(collection.apiname), `Outbound${type.getName()}`),
      headerFile: this.codegen.getDataStoreHeaderName(collection.apiname),
    };
  }

  public addDataflowProgram(programDef: DataflowProgramDefinition): void {
    this.dataflowPrograms[programDef.interfaceName] = programDef;
  }

  public getDataflowPrograms(): Array<DataflowProgramDefinition> {
    return Object.values(this.dataflowPrograms);
  }

  public abstract doCodeGen(): FileWriter;

  public addCodeGenDependency(codeGen: CodeGen): void {
    this.codeGenDeps.push(codeGen);
  }

  protected createFileWriter(): FileWriter {
    const fileWriter = new FileWriter();
    for (const codeGen of this.codeGenDeps) {
      fileWriter.merge(codeGen.doCodeGen());
    }
    return fileWriter;
  }
}
