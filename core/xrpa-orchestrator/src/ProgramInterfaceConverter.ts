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


import assert from "assert";

import { getCoordinateSystem } from "./Coordinates";
import { generateComponentProperties, getGameEngineConfig } from "./GameEngine";
import {
  IS_IMAGE_TYPE,
  MESSAGE_RATE,
  XrpaCollectionType,
  XrpaInterfaceType,
  XrpaStructType,
  getFieldDefaultValue,
  getFieldDescription,
  isByteArrayDataType,
  isCollectionDataType,
  isEnumDataType,
  isFieldIndexKey,
  isFieldPrimaryKey,
  isFixedArrayDataType,
  isInterfaceDataType,
  isMessageDataType,
  isReferenceDataType,
  isStructDataType,
} from "./InterfaceTypes";
import { ProgramInterface, getDirectionality, propagatePropertiesToInterface, reverseProgramDirectionality } from "./ProgramInterface";
import { RuntimeEnvironmentContext, getInterfaceTypeMap } from "./RuntimeEnvironment";
import { evalProperty, isNamedDataType, XrpaDataType } from "./XrpaLanguage";

import { isDataflowProgramDefinition } from "./shared/DataflowProgramDefinition";
import { DataModelDefinition, UserStructSpec } from "./shared/DataModel";
import { IndexConfiguration } from "./shared/DataStore";
import { ModuleDefinition, UserTypeSpec } from "./shared/ModuleDefinition";
import { FieldTypeSpec, InterfaceTypeDefinition, typeIsInterface } from "./shared/TypeDefinition";

function getInverseDirectionStructFields(fieldsStruct: XrpaStructType, compareDirectionality: "inbound" | "outbound"): string[] {
  return Object.keys(fieldsStruct.fields).filter(name => {
    const field = fieldsStruct.fields[name];
    const fieldDirectionality = getDirectionality(field) ?? compareDirectionality;
    return fieldDirectionality !== compareDirectionality;
  });
}

function getInverseDirectionFields(collection: XrpaCollectionType, collectionDirectionality: "inbound" | "outbound"): string[] {
  const ret: string[] = [];
  if (collection.interfaceType) {
    ret.push(...getInverseDirectionStructFields(collection.interfaceType.fieldsStruct, collectionDirectionality));
  }
  ret.push(...getInverseDirectionStructFields(collection.fieldsStruct, collectionDirectionality));
  return ret;
}

export function getTypeName(dataType: XrpaDataType): string {
  return isNamedDataType(dataType) ? dataType.name : dataType.typename;
}

function getInterfaceType(datamodel: DataModelDefinition, dataType: XrpaInterfaceType | XrpaCollectionType): InterfaceTypeDefinition {
  assert(dataType.name, "Unnamed type found, internal error");
  let targetType = datamodel.getType(dataType.name);
  if (!targetType && isInterfaceDataType(dataType)) {
    targetType = datamodel.addInterface({
      name: dataType.name,
      fields: convertStructFieldsToUserSpec(dataType.fieldsStruct.fields, datamodel),
    });
  }
  assert(targetType, `Target type ${dataType.name} not found in datamodel`);
  assert(typeIsInterface(targetType), `Target type ${dataType.name} is not an interface`);
  return targetType;
}

function convertStructProperties(type: XrpaStructType): Record<string, unknown> {
  return {
    isImage: evalProperty(type.properties, IS_IMAGE_TYPE) ?? false,
  };
}

export function convertDataTypeToUserTypeSpec(dataType: XrpaDataType, datamodel: DataModelDefinition | null): UserTypeSpec | FieldTypeSpec {
  if (datamodel) {
    if (isFixedArrayDataType(dataType)) {
      const innerTypeName = getTypeName(dataType.innerType);
      if (!datamodel.getType(innerTypeName)) {
        if (isEnumDataType(dataType.innerType)) {
          datamodel.addEnum(innerTypeName, dataType.innerType.enumValues);
        } else if (isStructDataType(dataType.innerType)) {
          datamodel.addStruct(innerTypeName, convertStructFieldsToUserSpec(dataType.innerType.fields, datamodel), convertStructProperties(dataType.innerType));
        }
      }
      return {
        type: datamodel.addFixedArray(innerTypeName, dataType.arraySize),
        description: getFieldDescription(dataType),
        defaultValue: getFieldDefaultValue(dataType),
      };
    }
    if (isReferenceDataType(dataType)) {
      return {
        type: datamodel.addReference(getInterfaceType(datamodel, dataType.targetType)),
        description: getFieldDescription(dataType),
        defaultValue: getFieldDefaultValue(dataType),
      };
    }
    if (isByteArrayDataType(dataType)) {
      return {
        type: datamodel.addByteArray(dataType.expectedSize),
        description: getFieldDescription(dataType),
        defaultValue: getFieldDefaultValue(dataType),
      };
    }
  }

  return {
    type: getTypeName(dataType),
    description: getFieldDescription(dataType),
    defaultValue: getFieldDefaultValue(dataType),
  };
}

function convertStructFieldsToUserSpec(fields: Record<string, XrpaDataType>, datamodel: DataModelDefinition | null): UserStructSpec {
  const structSpec: Record<string, UserTypeSpec> = {};
  for (const name in fields) {
    const field = fields[name];
    structSpec[name] = convertDataTypeToUserTypeSpec(field, datamodel);
  }
  return structSpec;
}

function convertProgramInterfaceToDataModel(
  programInterface: ProgramInterface,
  datamodel: DataModelDefinition,
) {
  datamodel.setName(programInterface.interfaceName);
  datamodel.setStoredCoordinateSystem(getCoordinateSystem(programInterface));

  for (const name in programInterface.namedTypes) {
    const type = programInterface.namedTypes[name];
    if (isEnumDataType(type)) {
      datamodel.addEnum(name, type.enumValues);
    } else if (isStructDataType(type)) {
      datamodel.addStruct(name, convertStructFieldsToUserSpec(type.fields, datamodel), convertStructProperties(type));
    } else if (isMessageDataType(type)) {
      datamodel.addMessageStruct(name, convertStructFieldsToUserSpec(type.fieldsStruct.fields, datamodel), evalProperty(type.properties, MESSAGE_RATE) ?? 30);
    } else if (isCollectionDataType(type)) {
      datamodel.addCollection({
        name,
        fields: convertStructFieldsToUserSpec(type.fieldsStruct.fields, datamodel),
        interfaceType: type.interfaceType ? getInterfaceType(datamodel, type.interfaceType) : undefined,
        maxCount: type.maxCount,
      });
    }
  }
}

function getStructFieldIndexConfigs(ctx: RuntimeEnvironmentContext, fields: Record<string, XrpaDataType>, directionality: "inbound" | "outbound"): IndexConfiguration[] {
  const ret: IndexConfiguration[] = [];

  for (const name in fields) {
    const field = fields[name];
    if (isFieldPrimaryKey(field) && directionality === "inbound") {
      ret.push({
        indexFieldName: name,
        boundClassName: getGameEngineConfig(ctx) ? "" : undefined,
      });
    } else if (isFieldIndexKey(field)) {
      ret.push({
        indexFieldName: name,
      });
    }
  }

  return ret;
}

function getIndexConfigs(ctx: RuntimeEnvironmentContext, collection: XrpaCollectionType, directionality: "inbound" | "outbound"): IndexConfiguration[] {
  const ret: IndexConfiguration[] = [];

  if (collection.interfaceType) {
    ret.push(...getStructFieldIndexConfigs(ctx, collection.interfaceType.fieldsStruct.fields, directionality));
  }
  ret.push(...getStructFieldIndexConfigs(ctx, collection.fieldsStruct.fields, directionality));

  return ret;
}

export function bindProgramInterfaceToModule(
  ctx: RuntimeEnvironmentContext,
  moduleDef: ModuleDefinition,
  programInterface: ProgramInterface,
  isExternalInterface: boolean,
) {
  programInterface = propagatePropertiesToInterface(programInterface, ctx.properties);

  if (isDataflowProgramDefinition(programInterface)) {
    moduleDef.addDataflowProgram(programInterface);
    return;
  }

  if (isExternalInterface) {
    programInterface = reverseProgramDirectionality(programInterface);
  }

  const dataStore = moduleDef.addDataStore({
    dataset: programInterface.interfaceName,
    isModuleProgramInterface: !isExternalInterface,
    typeMap: getInterfaceTypeMap(ctx, programInterface),
    datamodel: datamodel => convertProgramInterfaceToDataModel(programInterface, datamodel),
  });

  for (const key in programInterface.parameters) {
    const param = programInterface.parameters[key];

    const directionality = getDirectionality(param.dataType);
    assert(directionality !== undefined, `Parameter "${key}" is missing directionality`);

    const collection = param.dataType;
    assert(isCollectionDataType(collection), `Native program parameter "${key}" is not a collection`);

    if (directionality === "inbound") {
      dataStore.addInputReconciler({
        type: collection.name,
        outboundFields: getInverseDirectionFields(collection, directionality),
        indexes: getIndexConfigs(ctx, collection, directionality),
        fieldAccessorNameOverrides: undefined, // TODO add support
        componentProps: generateComponentProperties(ctx, collection),
      });
    } else {
      dataStore.addOutputReconciler({
        type: collection.name,
        inboundFields: getInverseDirectionFields(collection, directionality),
        indexes: getIndexConfigs(ctx, collection, directionality),
        fieldAccessorNameOverrides: undefined, // TODO add support
        componentProps: generateComponentProperties(ctx, collection),
      });
    }
  }
}
