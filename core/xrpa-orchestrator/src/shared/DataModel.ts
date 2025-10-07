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


import { HashValue } from "@xrpa/xrpa-file-utils";
import assert from "assert";

import { BuiltinType, isBuiltinType } from "./BuiltinTypes";
import { CoordinateSystemDef, DEFAULT_COORDINATE_SYSTEM } from "./CoordinateTransformer";
import { DataStoreDefinition } from "./DataStore";
import { isTypeDefinition, isUserFieldTypeSpec, ModuleDefinition, UserTypeSpec } from "./ModuleDefinition";
import {
  CollectionTypeDefinition,
  FieldTypeSpec,
  InterfaceTypeDefinition,
  MessageDataTypeDefinition,
  StructSpec,
  StructTypeDefinition,
  TypeDefinition,
  typeIsCollection,
  typeIsInterface,
  typeIsMessageData,
  typeIsSignalData,
  typeIsStruct,
  TypeMap,
} from "./TypeDefinition";

function verify<T>(val: T | undefined): T {
  assert(val !== undefined);
  return val as T;
}

// largest is sizeof(CollectionUpdateChangeEventAccessor)
const CHANGE_EVENT_HEADER_SIZE = 36;

// sizeof(CollectionMessageChangeEventAccessor)
const MESSAGE_EVENT_HEADER_SIZE = 36;

// sizeof(SignalPacket)
const SIGNAL_PACKET_HEADER_SIZE = 16;


export type UserStructSpec = Record<string, UserTypeSpec>;

export class DataModelDefinition {
  private collectionCount = 0;
  private dataModelName = "";
  private typeDefinitions: Record<string, TypeDefinition> = {};
  public storedCoordinateSystem: CoordinateSystemDef = DEFAULT_COORDINATE_SYSTEM;
  public localCoordinateSystem: CoordinateSystemDef;
  public typeMap: TypeMap;

  constructor(
    readonly moduleDef: ModuleDefinition,
    readonly dataStore: DataStoreDefinition,
  ) {
    this.localCoordinateSystem = moduleDef.getLocalCoordinateSystem();
    this.typeMap = {
      ...moduleDef.getTypeMap(),
      ...dataStore.typeMap,
    };
  }

  public getCollectionCount(): number {
    return this.collectionCount;
  }

  public setName(name: string) {
    this.dataModelName = name;
  }

  public setStoredCoordinateSystem(storedCoordinateSystem: CoordinateSystemDef) {
    this.storedCoordinateSystem = storedCoordinateSystem;
  }

  public getType(name: string): TypeDefinition | undefined {
    if (name in this.typeDefinitions) {
      return this.typeDefinitions[name];
    }
    if (isBuiltinType(name)) {
      const ret = this.moduleDef.getBuiltinTypeDefinition(name, this.getApiName(), this);
      if (ret) {
        return this.addType(name, ret);
      }
    }
    return undefined;
  }

  private addType<T extends TypeDefinition>(name: string, typeDef: T): T {
    if (this.typeDefinitions[name] && this.typeDefinitions[name] !== typeDef) {
      throw new Error(`Duplicate types named "${name}" in datamodel "${this.dataModelName}"`);
    }
    this.typeDefinitions[name] = typeDef;
    return typeDef;
  }

  public getApiName() {
    return this.dataStore.apiname;
  }

  public TypeField(typename: string, description?: string): FieldTypeSpec {
    return {
      type: verify(this.getType(typename)),
      description,
    };
  }

  public BooleanField(defaultValue?: boolean, description?: string): FieldTypeSpec {
    return {
      type: verify(this.getType(BuiltinType.Boolean)),
      defaultValue,
      description,
    };
  }

  public ScalarField(defaultValue?: number, description?: string): FieldTypeSpec {
    return {
      type: verify(this.getType(BuiltinType.Scalar)),
      defaultValue,
      description,
    };
  }

  public CountField(defaultValue?: number, description?: string): FieldTypeSpec {
    return {
      type: verify(this.getType(BuiltinType.Count)),
      defaultValue,
      description,
    };
  }

  public AngleField(defaultValue?: number, description?: string): FieldTypeSpec {
    return {
      type: verify(this.getType(BuiltinType.Angle)),
      defaultValue,
      description,
    };
  }

  public DistanceField(defaultValue?: number, description?: string): FieldTypeSpec {
    return {
      type: verify(this.getType(BuiltinType.Distance)),
      defaultValue,
      description,
    };
  }

  public StringField(defaultValue?: string, description?: string): FieldTypeSpec {
    return {
      type: verify(this.getType(BuiltinType.String)),
      defaultValue,
      description,
    };
  }

  public SignalField(description?: string): FieldTypeSpec {
    return {
      type: verify(this.getType(BuiltinType.Signal)),
      description,
    };
  }

  public addEnum(
    name: string,
    enumValues: string[],
  ): TypeDefinition {
    const enumMap = enumValues.reduce((acc, val, idx) => {
      acc[val] = idx;
      return acc;
    }, {} as Record<string, number>);
    return this.addType(name, this.moduleDef.createEnum(name, this.getApiName(), enumMap, this.typeMap[name]));
  }

  public addReference(
    toType: InterfaceTypeDefinition,
  ): TypeDefinition {
    return this.moduleDef.createReference(toType);
  }

  public addStruct(
    name: string,
    fields: UserStructSpec,
    properties?: Record<string, unknown>,
  ): StructTypeDefinition {
    return this.addType(name, this.moduleDef.createStruct(
      name,
      this.getApiName(),
      this.convertUserStructSpec(fields),
      this.typeMap[name],
      properties,
    ));
  }

  public addMessageStruct(
    name: string,
    fields: UserStructSpec,
    expectedRatePerSecond: number,
  ): MessageDataTypeDefinition {
    return this.addType(name, this.moduleDef.createMessageStruct(
      name,
      this.getApiName(),
      this.convertUserStructSpec(fields),
      expectedRatePerSecond,
    ));
  }

  public addInterface(
    params: {
      name: string,
      fields?: UserStructSpec,
    },
  ): InterfaceTypeDefinition {
    return this.addType(params.name, this.moduleDef.createInterface(
      params.name,
      this.getApiName(),
      this.convertUserStructSpec(params.fields ?? {}),
    ));
  }

  public addCollection(
    params: {
      name: string,
      fields: UserStructSpec,
      interfaceType?: InterfaceTypeDefinition | undefined,
      maxCount: number,
    },
  ): CollectionTypeDefinition {
    return this.addType(params.name, this.moduleDef.createCollection(
      params.name,
      this.getApiName(),
      this.convertUserStructSpec(params.fields),
      params.interfaceType,
      params.maxCount,
      this.collectionCount++,
    ));
  }

  public addFixedArray(
    innerType: UserTypeSpec,
    arraySize: number,
  ) {
    const innerTypeSpec = this.convertUserTypeSpec(innerType);
    const innerTypeName = innerTypeSpec.type.getName();
    const name = `${innerTypeName}[${arraySize}]`;
    if (name in this.typeDefinitions) {
      return this.typeDefinitions[name];
    }
    return this.addType(name, this.moduleDef.createFixedArray(`${innerTypeName}_${arraySize}`, this.getApiName(), innerTypeSpec.type, arraySize));
  }

  public addByteArray(
    expectedSize: number,
  ) {
    const name = `ByteArray[${expectedSize}]`;
    if (name in this.typeDefinitions) {
      return this.typeDefinitions[name];
    }
    return this.addType(name, this.moduleDef.createByteArray(expectedSize));
  }

  private convertUserType(typeStr: string): TypeDefinition {
    const typeDef = this.getType(typeStr);
    if (typeDef) {
      return typeIsInterface(typeDef) ? this.moduleDef.createReference(typeDef) : typeDef;
    }

    const bracketIdx = typeStr.indexOf("[");
    if (bracketIdx > -1 && typeStr.endsWith("]")) {
      const innerTypeName = typeStr.slice(0, bracketIdx);
      const arraySize = parseInt(typeStr.slice(bracketIdx + 1, -1), 10);
      if (innerTypeName === "ByteArray") {
        return this.addByteArray(arraySize);
      } else {
        return this.addFixedArray(this.convertUserType(innerTypeName), arraySize);
      }
    }

    return this.moduleDef.getPrimitiveTypeDefinition(typeStr);
  }

  public convertUserTypeSpec(typeSpec: UserTypeSpec): FieldTypeSpec {
    if (typeof typeSpec === "string") {
      return {
        type: this.convertUserType(typeSpec),
      };
    } else if (isTypeDefinition(typeSpec)) {
      return {
        type: typeIsInterface(typeSpec) ? this.moduleDef.createReference(typeSpec) : typeSpec,
      };
    } else if (isUserFieldTypeSpec(typeSpec)) {
      return {
        type: this.convertUserType(typeSpec.type),
        defaultValue: typeSpec.defaultValue,
        description: typeSpec.description,
      };
    } else {
      return {
        type: typeIsInterface(typeSpec.type) ? this.moduleDef.createReference(typeSpec.type) : typeSpec.type,
        defaultValue: typeSpec.defaultValue,
        description: typeSpec.description,
      };
    }
  }

  private convertUserStructSpec(fields: UserStructSpec): StructSpec {
    return Object.keys(fields).reduce((fieldsOut, key) => {
      fieldsOut[key] = this.convertUserTypeSpec(fields[key]);
      return fieldsOut;
    }, {} as StructSpec);
  }

  public getHash(): HashValue {
    const lines: string[] = [];

    lines.push(JSON.stringify(this.storedCoordinateSystem));

    const typeNames = Object.keys(this.typeDefinitions).sort();
    for (const typeName of typeNames) {
      lines.push(JSON.stringify(this.typeDefinitions[typeName].getHashData()));
    }
    return new HashValue(lines.join("\n"));
  }

  public getAllTypeDefinitions(): TypeDefinition[] {
    return Object.values(this.typeDefinitions);
  }

  public getTypeDefinitionsForHeader(headerFile: string): TypeDefinition[] {
    const ret: TypeDefinition[] = [];
    for (const name in this.typeDefinitions) {
      const typeDef = this.typeDefinitions[name];
      if (typeDef.getLocalHeaderFile() === headerFile) {
        ret.push(typeDef);
      }
    }
    return ret;
  }

  public getInterfaces(): InterfaceTypeDefinition[] {
    const ret: InterfaceTypeDefinition[] = [];
    for (const name in this.typeDefinitions) {
      const typeDef = this.typeDefinitions[name];
      if (typeIsInterface(typeDef)) {
        ret.push(typeDef);
      }
    }
    return ret;
  }

  public getCollections(): CollectionTypeDefinition[] {
    const ret: CollectionTypeDefinition[] = [];
    for (const name in this.typeDefinitions) {
      const typeDef = this.typeDefinitions[name];
      if (typeIsCollection(typeDef)) {
        ret.push(typeDef);
      }
    }
    return ret;
  }

  // this is a heuristic, not a fully accurate number
  private getStructMessagePoolSize(typeDef: StructTypeDefinition): number {
    const fields = typeDef.getAllFields();
    let poolSize = 0;
    for (const fieldName in fields) {
      const fieldType = fields[fieldName].type;
      if (typeIsMessageData(fieldType)) {
        // want to hold 1/10th of a second worth of data
        const typeSize = fieldType.getTypeSize();
        poolSize += 0.1 * (typeSize.staticSize + typeSize.dynamicSizeEstimate + MESSAGE_EVENT_HEADER_SIZE) * fieldType.getExpectedRatePerSecond();
      } else if (typeIsSignalData(fieldType)) {
        // assume 100 packets per second, want to hold 1/10th of a second worth of data
        poolSize += 0.1 * (100 * (MESSAGE_EVENT_HEADER_SIZE + SIGNAL_PACKET_HEADER_SIZE) + fieldType.getExpectedBytesPerSecond());
      } else if (typeIsStruct(fieldType)) {
        poolSize += this.getStructMessagePoolSize(fieldType);
      }
    }
    return Math.ceil(poolSize);
  }

  public calcMessagePoolSize() {
    let poolSize = 0;
    for (const typeDef of this.getCollections()) {
      poolSize += typeDef.maxCount * this.getStructMessagePoolSize(typeDef);
    }
    return poolSize;
  }

  public calcChangelogSize() {
    let changelogByteCount = this.calcMessagePoolSize();
    for (const typeDef of this.getCollections()) {
      const typeSize = typeDef.getTypeSize();
      changelogByteCount += 2 * typeDef.maxCount * (typeSize.staticSize + typeSize.dynamicSizeEstimate + CHANGE_EVENT_HEADER_SIZE);
    }
    return changelogByteCount;
  }
}
