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

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bindProgramInterfaceToModule = exports.convertDataTypeToUserTypeSpec = exports.getTypeName = void 0;
const assert_1 = __importDefault(require("assert"));
const Coordinates_1 = require("./Coordinates");
const GameEngine_1 = require("./GameEngine");
const InterfaceTypes_1 = require("./InterfaceTypes");
const ProgramInterface_1 = require("./ProgramInterface");
const RuntimeEnvironment_1 = require("./RuntimeEnvironment");
const XrpaLanguage_1 = require("./XrpaLanguage");
const DataflowProgramDefinition_1 = require("./shared/DataflowProgramDefinition");
const TypeDefinition_1 = require("./shared/TypeDefinition");
function getInverseDirectionStructFields(fieldsStruct, compareDirectionality) {
    return Object.keys(fieldsStruct.fields).filter(name => {
        const field = fieldsStruct.fields[name];
        const fieldDirectionality = (0, ProgramInterface_1.getDirectionality)(field) ?? compareDirectionality;
        return fieldDirectionality !== compareDirectionality;
    });
}
function getInverseDirectionFields(collection, collectionDirectionality) {
    const ret = [];
    if (collection.interfaceType) {
        ret.push(...getInverseDirectionStructFields(collection.interfaceType.fieldsStruct, collectionDirectionality));
    }
    ret.push(...getInverseDirectionStructFields(collection.fieldsStruct, collectionDirectionality));
    return ret;
}
function getTypeName(dataType) {
    return (0, XrpaLanguage_1.isNamedDataType)(dataType) ? dataType.name : dataType.typename;
}
exports.getTypeName = getTypeName;
function getInterfaceType(datamodel, dataType) {
    (0, assert_1.default)(dataType.name, "Unnamed type found, internal error");
    let targetType = datamodel.getType(dataType.name);
    if (!targetType && (0, InterfaceTypes_1.isInterfaceDataType)(dataType)) {
        targetType = datamodel.addInterface({
            name: dataType.name,
            fields: convertStructFieldsToUserSpec(dataType.fieldsStruct.fields, datamodel),
        });
    }
    (0, assert_1.default)(targetType, `Target type ${dataType.name} not found in datamodel`);
    (0, assert_1.default)((0, TypeDefinition_1.typeIsInterface)(targetType), `Target type ${dataType.name} is not an interface`);
    return targetType;
}
function convertDataTypeToUserTypeSpec(dataType, datamodel) {
    if (datamodel) {
        if ((0, InterfaceTypes_1.isFixedArrayDataType)(dataType)) {
            return {
                type: datamodel.addFixedArray(getTypeName(dataType.innerType), dataType.arraySize),
                description: (0, InterfaceTypes_1.getFieldDescription)(dataType),
                defaultValue: (0, InterfaceTypes_1.getFieldDefaultValue)(dataType),
            };
        }
        if ((0, InterfaceTypes_1.isFixedStringDataType)(dataType)) {
            return {
                type: datamodel.addFixedString(dataType.maxBytes),
                description: (0, InterfaceTypes_1.getFieldDescription)(dataType),
                defaultValue: (0, InterfaceTypes_1.getFieldDefaultValue)(dataType),
            };
        }
        if ((0, InterfaceTypes_1.isReferenceDataType)(dataType)) {
            return {
                type: datamodel.addReference(getInterfaceType(datamodel, dataType.targetType)),
                description: (0, InterfaceTypes_1.getFieldDescription)(dataType),
                defaultValue: (0, InterfaceTypes_1.getFieldDefaultValue)(dataType),
            };
        }
    }
    return {
        type: getTypeName(dataType),
        description: (0, InterfaceTypes_1.getFieldDescription)(dataType),
        defaultValue: (0, InterfaceTypes_1.getFieldDefaultValue)(dataType),
    };
}
exports.convertDataTypeToUserTypeSpec = convertDataTypeToUserTypeSpec;
function convertStructFieldsToUserSpec(fields, datamodel) {
    const structSpec = {};
    for (const name in fields) {
        const field = fields[name];
        structSpec[name] = convertDataTypeToUserTypeSpec(field, datamodel);
    }
    return structSpec;
}
function convertProgramInterfaceToDataModel(programInterface, datamodel) {
    datamodel.setName(programInterface.interfaceName);
    datamodel.setStoredCoordinateSystem((0, Coordinates_1.getCoordinateSystem)(programInterface));
    for (const name in programInterface.namedTypes) {
        const type = programInterface.namedTypes[name];
        if ((0, InterfaceTypes_1.isEnumDataType)(type)) {
            datamodel.addEnum(name, type.enumValues);
        }
        else if ((0, InterfaceTypes_1.isStructDataType)(type)) {
            datamodel.addStruct(name, convertStructFieldsToUserSpec(type.fields, datamodel));
        }
        else if ((0, InterfaceTypes_1.isMessageDataType)(type)) {
            datamodel.addMessageStruct(name, convertStructFieldsToUserSpec(type.fieldsStruct.fields, datamodel));
        }
        else if ((0, InterfaceTypes_1.isCollectionDataType)(type)) {
            datamodel.addCollection({
                name,
                fields: convertStructFieldsToUserSpec(type.fieldsStruct.fields, datamodel),
                interfaceType: type.interfaceType ? getInterfaceType(datamodel, type.interfaceType) : undefined,
                maxCount: type.maxCount,
            });
        }
    }
}
function getStructFieldIndexConfigs(ctx, fields, directionality) {
    const ret = [];
    for (const name in fields) {
        const field = fields[name];
        if ((0, InterfaceTypes_1.isFieldPrimaryKey)(field) && directionality === "inbound") {
            ret.push({
                indexFieldName: name,
                boundClassName: (0, GameEngine_1.getGameEngineConfig)(ctx) ? "" : undefined,
            });
        }
        else if ((0, InterfaceTypes_1.isFieldIndexKey)(field)) {
            ret.push({
                indexFieldName: name,
            });
        }
    }
    return ret;
}
function getIndexConfigs(ctx, collection, directionality) {
    const ret = [];
    if (collection.interfaceType) {
        ret.push(...getStructFieldIndexConfigs(ctx, collection.interfaceType.fieldsStruct.fields, directionality));
    }
    ret.push(...getStructFieldIndexConfigs(ctx, collection.fieldsStruct.fields, directionality));
    return ret;
}
function bindProgramInterfaceToModule(ctx, moduleDef, programInterface, isExternalInterface) {
    programInterface = (0, ProgramInterface_1.propagatePropertiesToInterface)(programInterface, ctx.properties);
    if ((0, DataflowProgramDefinition_1.isDataflowProgramDefinition)(programInterface)) {
        moduleDef.addDataflowProgram(programInterface);
        return;
    }
    if (isExternalInterface) {
        programInterface = (0, ProgramInterface_1.reverseProgramDirectionality)(programInterface);
    }
    const dataStore = moduleDef.addDataStore({
        dataset: programInterface.interfaceName,
        isModuleProgramInterface: !isExternalInterface,
        typeMap: (0, RuntimeEnvironment_1.getInterfaceTypeMap)(ctx, programInterface),
        datamodel: datamodel => convertProgramInterfaceToDataModel(programInterface, datamodel),
    });
    for (const key in programInterface.parameters) {
        const param = programInterface.parameters[key];
        const directionality = (0, ProgramInterface_1.getDirectionality)(param.dataType);
        (0, assert_1.default)(directionality !== undefined, `Parameter "${key}" is missing directionality`);
        const collection = param.dataType;
        (0, assert_1.default)((0, InterfaceTypes_1.isCollectionDataType)(collection), `Native program parameter "${key}" is not a collection`);
        const useGenericReconciledType = (0, InterfaceTypes_1.getUseGenericImplementation)(collection);
        if (directionality === "inbound") {
            dataStore.addInputReconciler({
                type: collection.name,
                outboundFields: getInverseDirectionFields(collection, directionality),
                reconciledTo: undefined,
                indexes: getIndexConfigs(ctx, collection, directionality),
                fieldAccessorNameOverrides: undefined,
                componentProps: (0, GameEngine_1.generateComponentProperties)(ctx, collection),
                useGenericReconciledType,
            });
        }
        else {
            dataStore.addOutputReconciler({
                type: collection.name,
                inboundFields: getInverseDirectionFields(collection, directionality),
                indexes: getIndexConfigs(ctx, collection, directionality),
                fieldAccessorNameOverrides: undefined,
                componentProps: (0, GameEngine_1.generateComponentProperties)(ctx, collection),
                useGenericReconciledType,
            });
        }
    }
}
exports.bindProgramInterfaceToModule = bindProgramInterfaceToModule;
//# sourceMappingURL=ProgramInterfaceConverter.js.map
