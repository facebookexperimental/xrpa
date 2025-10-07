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


import { trimTrailingEmptyLines } from "@xrpa/xrpa-utils";

import { getFieldMappings } from "./CoordinateTransformer";
import { IncludeAggregator } from "./Helpers";
import { PrimitiveType } from "./PrimitiveType";
import { FieldTypeAndAccessor, TargetCodeGenImpl, TypeSpec } from "./TargetCodeGen";
import {
  StructSpec,
  StructTypeDefinition,
  TypeDefinition,
  typeIsInterface,
  typeIsStateData,
  typeIsStruct,
  TypeMetaType,
  TypeSize,
  UserDefaultValue,
} from "./TypeDefinition";
import {
  CodeLiteralValue,
  ConstructValue,
  EmptyValue,
  isTypeValue,
  PrimitiveValue,
  StructValue,
  TypeValue,
} from "./TypeValue";
import { ClassSpec, ClassVisibility } from "./ClassSpec";

export interface FieldTransforms {
  fieldsFromLocal: Record<string, TypeValue>;
  fieldsToLocal: Record<string, TypeValue>;
}

function calcStructSize(fields: StructSpec): TypeSize {
  let staticSize = 0;
  let dynamicSizeEstimate = 0;
  for (const key in fields) {
    const typeSize = fields[key].type.getTypeSize();
    staticSize += typeSize.staticSize;
    dynamicSizeEstimate += typeSize.dynamicSizeEstimate;
  }
  return {
    staticSize,
    dynamicSizeEstimate,
  };
}

export class StructType extends PrimitiveType implements StructTypeDefinition {
  constructor(
    codegen: TargetCodeGenImpl,
    name: string,
    readonly apiname: string,
    readonly parentType: StructTypeDefinition | undefined,
    readonly fields: StructSpec,
    readonly localTypeOverride?: TypeSpec,
    readonly properties: Record<string, unknown> = {},
  ) {
    // This should be checked for higher up, this is just a last-minute verification.
    for (const key in fields) {
      if (typeIsInterface(fields[key].type)) {
        throw new Error(`Field "${key}" is an interface or collection, but should be a reference.`);
      }
    }

    super(
      codegen,
      name,
      { typename: codegen.nsJoin(codegen.getTypesHeaderNamespace(apiname), `DS${name}`), headerFile: codegen.getTypesHeaderName(apiname) },
      localTypeOverride ?? { typename: codegen.nsJoin(codegen.getTypesHeaderNamespace(apiname), name), headerFile: codegen.getTypesHeaderName(apiname) },
      0, // getTypeSize() is overridden
      false,
      new EmptyValue(codegen, codegen.nsJoin(codegen.getTypesHeaderNamespace(apiname), `DS${name}`), ""),
    );

    if (!localTypeOverride && this.getMetaType() !== TypeMetaType.STRUCT) {
      this.localType = { typename: codegen.nsJoin(codegen.getDataStoreHeaderNamespace(apiname), name), headerFile: codegen.getDataStoreHeaderName(apiname) };
    }
  }

  public getMetaType(): TypeMetaType {
    return TypeMetaType.STRUCT;
  }

  public getHashData(): Record<string, unknown> {
    const fieldHashData: Record<string, unknown> = {};
    const fields = this.getAllFields();
    for (const key in fields) {
      fieldHashData[key] = fields[key].type.getName();
    }

    return {
      ...super.getHashData(),
      fields: fieldHashData,
    };
  }

  public getTypeSize(): TypeSize {
    return calcStructSize(this.getStateFields());
  }

  public getApiName() {
    return this.apiname;
  }

  public getAllFields(): StructSpec {
    return this.fields;
  }

  public getStateFields(): StructSpec {
    const fields = this.getAllFields();
    const stateFields: StructSpec = {};
    for (const key in fields) {
      if (typeIsStateData(fields[key].type)) {
        stateFields[key] = fields[key];
      }
    }
    return stateFields;
  }

  public getFieldsOfType<T extends TypeDefinition>(typeFilter: (typeDef: TypeDefinition | undefined) => typeDef is T): Record<string, T> {
    const fields = this.getAllFields();
    const ret: Record<string, T> = {};
    for (const key in fields) {
      const typeDef = fields[key].type;
      if (typeFilter(typeDef)) {
        ret[key] = typeDef;
      }
    }
    return ret;
  }

  public getFieldIndex(fieldName: string): number {
    const fields = this.getAllFields();
    let fieldCount = 0;
    for (const name in fields) {
      if (fieldName === name) {
        return fieldCount;
      }
      fieldCount++;
    }
    return -1;
  }

  public getFieldBitMask(fieldName: string): number {
    const fields = this.getStateFields();
    let fieldCount = 0;
    for (const name in fields) {
      if (fieldName === name) {
        return 1 << fieldCount;
      }
      fieldCount++;
    }
    throw new Error(`Field ${fieldName} not found in ${this.getName()}`);
  }

  public getStateField(fieldName: string): TypeDefinition {
    const fields = this.getStateFields();
    if (!(fieldName in fields)) {
      throw new Error(`Field ${fieldName} not found in ${this.getName()}`);
    }
    return fields[fieldName].type;
  }

  public userDefaultToTypeValue(inNamespace: string, includes: IncludeAggregator | null, userDefault: UserDefaultValue): TypeValue | undefined {
    const fields = this.getStateFields();
    const fieldNames = Object.keys(fields);
    if (Array.isArray(userDefault)) {
      const values: [string, TypeValue][] = [];
      for (let i = 0; i < userDefault.length; i++) {
        values.push([fieldNames[i], new PrimitiveValue(
          this.codegen,
          fields[fieldNames[i]].type.getInternalType("", includes),
          userDefault[i],
        )]);
      }
      return new StructValue(
        this.codegen,
        this.getInternalType(inNamespace, includes),
        false,
        values,
        inNamespace,
      );
    } else if (userDefault !== undefined && fieldNames.length === 1) {
      const values: [string, TypeValue][] = [
        [fieldNames[0], new PrimitiveValue(
          this.codegen,
          fields[fieldNames[0]].type.getInternalType("", includes),
          userDefault,
        )],
      ];
      return new StructValue(
        this.codegen,
        this.getInternalType(inNamespace, includes),
        false,
        values,
        inNamespace,
      );
    }
    return undefined;
  }

  public declareLocalFieldClassMember(classSpec: ClassSpec, fieldName: string, memberName: string, includeComments: boolean, decorations: string[], visibility?: ClassVisibility): void {
    const fieldSpec = this.getStateFields()[fieldName];
    if (includeComments) {
      decorations = decorations.concat(this.codegen.genCommentLines(fieldSpec.description));
    }
    classSpec.members.push({
      name: memberName,
      type: fieldSpec.type.getLocalType(classSpec.namespace, classSpec.includes),
      initialValue: fieldSpec.type.getLocalDefaultValue(classSpec.namespace, classSpec.includes, undefined, fieldSpec.defaultValue),
      visibility,
      decorations,
    });
  }

  // will generate (possibly) multiple lines of code to assign a variable back to its default value
  // will pull default value from the StructSpec, if provided
  // isSetter=true will use the SET default value for clear/set types
  public resetLocalFieldVarToDefault(inNamespace: string, includes: IncludeAggregator | null, fieldName: string, varName: string, isSetter?: boolean): string[] {
    const fieldSpec = this.getStateFields()[fieldName];
    return fieldSpec.type.resetLocalVarToDefault(inNamespace, includes, varName, isSetter, fieldSpec.defaultValue);
  }

  private getFieldTypes(inNamespace: string, includes: IncludeAggregator | null): Record<string, FieldTypeAndAccessor> {
    const ret: Record<string, FieldTypeAndAccessor> = {};

    const fields = this.getStateFields();
    for (const name in fields) {
      const fieldSpec = fields[name];
      const accessor = fieldSpec.type.getInternalType(inNamespace, includes);
      const accessorIsStruct = typeIsStruct(fieldSpec.type);
      ret[name] = {
        typename: accessorIsStruct ? fieldSpec.type.getLocalType(inNamespace, includes) : accessor,
        accessor,
        accessorIsStruct,
        typeSize: fieldSpec.type.getTypeSize(),
      };
    }

    return ret;
  }

  protected getFieldTransforms(inNamespace: string, includes: IncludeAggregator | null): FieldTransforms {
    const fieldsFromLocal: Record<string, TypeValue> = {};
    const fieldsToLocal: Record<string, TypeValue> = {};

    const fieldMappings = getFieldMappings(this.getStateFields(), this.localType.fieldMap);
    for (const localFieldName in fieldMappings.fromLocal) {
      const dsFieldName = fieldMappings.fromLocal[localFieldName];
      const val = localFieldName[0] === "[" ? `val${localFieldName}` : `val.${localFieldName}`;
      fieldsFromLocal[dsFieldName] = fieldMappings.fields[dsFieldName].type.convertValueFromLocal(inNamespace, includes, val);
    }
    for (const dsFieldName in fieldMappings.toLocal) {
      const localFieldName = fieldMappings.toLocal[dsFieldName];
      fieldsToLocal[localFieldName] = fieldMappings.fields[dsFieldName].type.convertValueToLocal(inNamespace, includes, dsFieldName);
    }

    return { fieldsFromLocal, fieldsToLocal };
  }

  protected genReadWriteValueFunctions(classSpec: ClassSpec): void {
    this.codegen.genReadWriteValueFunctions(classSpec, {
      localType: this,
      localTypeHasInitializerConstructor: this.localType.hasInitializerConstructor ?? false,
      fieldTypes: this.getFieldTypes(classSpec.namespace, classSpec.includes),
      localValueParamName: "val",
      ...this.getFieldTransforms(classSpec.namespace, classSpec.includes),
    });
  }

  public genTypeDefinition(includes: IncludeAggregator | null): string[] | null {
    const inNamespace = this.codegen.nsExtract(this.datasetType.typename);

    const classSpec = new ClassSpec({
      name: this.getInternalType(inNamespace, null),
      namespace: inNamespace,
      includes,
    });

    this.genReadWriteValueFunctions(classSpec);

    return trimTrailingEmptyLines(this.codegen.genClassDefinition(classSpec));
  }

  public genLocalTypeDefinition(inNamespace: string, includes: IncludeAggregator | null): string[] | null {
    if (this.localTypeOverride) {
      return null;
    }

    const classSpec = new ClassSpec({
      name: this.getLocalType(inNamespace, null),
      namespace: inNamespace,
      includes,
    });

    const fields = this.getStateFields();
    for (const fieldName in fields) {
      const fieldSpec = fields[fieldName];
      classSpec.members.push({
        name: fieldName,
        type: fieldSpec.type.getLocalType(classSpec.namespace, classSpec.includes),
        decorations: this.codegen.genCommentLines(fieldSpec.description),
      })
    }

    return trimTrailingEmptyLines(this.codegen.genClassDefinition(classSpec));
  }

  public convertValueFromLocal(inNamespace: string, includes: IncludeAggregator | null, value: string | TypeValue): TypeValue {
    if (typeof value === "string") {
      value = new CodeLiteralValue(this.codegen, value);
    }
    if (value instanceof StructValue) {
      const fieldMappings = getFieldMappings(this.getStateFields(), this.localType.fieldMap);
      const dsValues: [string, TypeValue][] = [];
      const localFieldOrder = Object.values(fieldMappings.toLocal);
      for (const localFieldName in fieldMappings.fromLocal) {
        const dsFieldName = fieldMappings.fromLocal[localFieldName];
        const localIdx = localFieldOrder.indexOf(localFieldName);
        dsValues.push([
          dsFieldName,
          fieldMappings.fields[dsFieldName].type.convertValueFromLocal(inNamespace, includes, value.fieldValues[localIdx][1]),
        ]);
      }
      return new StructValue(this.codegen, this.localType.typename, this.localType.hasInitializerConstructor ?? false, dsValues, inNamespace);
    }
    return new CodeLiteralValue(this.codegen, value.toString(inNamespace));
  }

  public convertValueToLocal(inNamespace: string, includes: IncludeAggregator | null, value: string | TypeValue): TypeValue {
    if (typeof value === "string") {
      value = new CodeLiteralValue(this.codegen, value);
    }
    if (value instanceof StructValue) {
      const fieldMappings = getFieldMappings(this.getStateFields(), this.localType.fieldMap);
      const localValues: [string, TypeValue][] = [];
      const dsFieldOrder = Object.values(fieldMappings.fromLocal);
      for (const dsFieldName in fieldMappings.toLocal) {
        const dsIdx = dsFieldOrder.indexOf(dsFieldName);
        localValues.push([
          fieldMappings.toLocal[dsFieldName],
          fieldMappings.fields[dsFieldName].type.convertValueToLocal(inNamespace, includes, value.fieldValues[dsIdx][1]),
        ]);
      }
      return new StructValue(this.codegen, this.localType.typename, this.localType.hasInitializerConstructor ?? false, localValues, inNamespace);
    }
    if (value instanceof EmptyValue) {
      return new EmptyValue(this.codegen, this.localType.typename, value.defaultNamespace);
    }
    if (value instanceof ConstructValue) {
      return new ConstructValue(this.codegen, this.localType.typename, value.defaultNamespace);
    }
    return new CodeLiteralValue(this.codegen, value.toString(inNamespace));
  }

  public getDatasetDefaultFieldValues(inNamespace: string, includes: IncludeAggregator | null, isSetter?: boolean): TypeValue {
    const fields = this.getStateFields();
    const values: [string, TypeValue][] = [];
    for (const fieldName in fields) {
      const fieldSpec = fields[fieldName];
      values.push([
        fieldName,
        fieldSpec.type.getInternalDefaultValue(inNamespace, includes, isSetter, fieldSpec.defaultValue),
      ]);
    }
    return new StructValue(this.codegen, this.datasetType.typename, false, values, inNamespace);
  }

  public getInternalDefaultValue(inNamespace: string, includes: IncludeAggregator | null, isSetter?: boolean, defaultOverride?: UserDefaultValue | TypeValue): TypeValue {
    if (!isTypeValue(defaultOverride)) {
      const userDefault = this.userDefaultToTypeValue(inNamespace, includes, defaultOverride);
      if (userDefault) {
        return userDefault;
      }
    }
    if (defaultOverride instanceof StructValue || defaultOverride instanceof EmptyValue || defaultOverride instanceof ConstructValue) {
      return defaultOverride;
    }
    return this.getDatasetDefaultFieldValues(inNamespace, includes, isSetter);
  }
}
