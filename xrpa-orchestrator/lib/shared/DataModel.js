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
exports.DataModelDefinition = void 0;
const xrpa_file_utils_1 = require("@xrpa/xrpa-file-utils");
const assert_1 = __importDefault(require("assert"));
const BuiltinTypes_1 = require("./BuiltinTypes");
const CoordinateTransformer_1 = require("./CoordinateTransformer");
const ModuleDefinition_1 = require("./ModuleDefinition");
const TypeDefinition_1 = require("./TypeDefinition");
function verify(val) {
    (0, assert_1.default)(val !== undefined);
    return val;
}
// largest is sizeof(CollectionUpdateChangeEventAccessor)
const CHANGE_EVENT_HEADER_SIZE = 36;
// sizeof(CollectionMessageChangeEventAccessor)
const MESSAGE_EVENT_HEADER_SIZE = 36;
// sizeof(SignalPacket)
const SIGNAL_PACKET_HEADER_SIZE = 16;
class DataModelDefinition {
    constructor(moduleDef, dataStore) {
        this.moduleDef = moduleDef;
        this.dataStore = dataStore;
        this.collectionCount = 0;
        this.dataModelName = "";
        this.typeDefinitions = {};
        this.storedCoordinateSystem = CoordinateTransformer_1.DEFAULT_COORDINATE_SYSTEM;
        this.localCoordinateSystem = moduleDef.getLocalCoordinateSystem();
        this.typeMap = {
            ...moduleDef.getTypeMap(),
            ...dataStore.typeMap,
        };
    }
    getCollectionCount() {
        return this.collectionCount;
    }
    setName(name) {
        this.dataModelName = name;
    }
    setStoredCoordinateSystem(storedCoordinateSystem) {
        this.storedCoordinateSystem = storedCoordinateSystem;
    }
    getType(name) {
        if (name in this.typeDefinitions) {
            return this.typeDefinitions[name];
        }
        if ((0, BuiltinTypes_1.isBuiltinType)(name)) {
            const ret = this.moduleDef.getBuiltinTypeDefinition(name, this.getApiName(), this);
            if (ret) {
                return this.addType(name, ret);
            }
        }
        return undefined;
    }
    addType(name, typeDef) {
        if (this.typeDefinitions[name] && this.typeDefinitions[name] !== typeDef) {
            throw new Error(`Duplicate types named "${name}" in datamodel "${this.dataModelName}"`);
        }
        this.typeDefinitions[name] = typeDef;
        return typeDef;
    }
    getApiName() {
        return this.dataStore.apiname;
    }
    TypeField(typename, description) {
        return {
            type: verify(this.getType(typename)),
            description,
        };
    }
    BooleanField(defaultValue, description) {
        return {
            type: verify(this.getType(BuiltinTypes_1.BuiltinType.Boolean)),
            defaultValue,
            description,
        };
    }
    ScalarField(defaultValue, description) {
        return {
            type: verify(this.getType(BuiltinTypes_1.BuiltinType.Scalar)),
            defaultValue,
            description,
        };
    }
    CountField(defaultValue, description) {
        return {
            type: verify(this.getType(BuiltinTypes_1.BuiltinType.Count)),
            defaultValue,
            description,
        };
    }
    AngleField(defaultValue, description) {
        return {
            type: verify(this.getType(BuiltinTypes_1.BuiltinType.Angle)),
            defaultValue,
            description,
        };
    }
    DistanceField(defaultValue, description) {
        return {
            type: verify(this.getType(BuiltinTypes_1.BuiltinType.Distance)),
            defaultValue,
            description,
        };
    }
    StringField(defaultValue, description) {
        return {
            type: verify(this.getType(BuiltinTypes_1.BuiltinType.String)),
            defaultValue,
            description,
        };
    }
    SignalField(description) {
        return {
            type: verify(this.getType(BuiltinTypes_1.BuiltinType.Signal)),
            description,
        };
    }
    addEnum(name, enumValues) {
        const enumMap = enumValues.reduce((acc, val, idx) => {
            acc[val] = idx;
            return acc;
        }, {});
        return this.addType(name, this.moduleDef.createEnum(name, this.getApiName(), enumMap, this.typeMap[name]));
    }
    addReference(toType) {
        return this.moduleDef.createReference(toType);
    }
    addStruct(name, fields, properties) {
        return this.addType(name, this.moduleDef.createStruct(name, this.getApiName(), this.convertUserStructSpec(fields), this.typeMap[name], properties));
    }
    addMessageStruct(name, fields, expectedRatePerSecond) {
        return this.addType(name, this.moduleDef.createMessageStruct(name, this.getApiName(), this.convertUserStructSpec(fields), expectedRatePerSecond));
    }
    addInterface(params) {
        return this.addType(params.name, this.moduleDef.createInterface(params.name, this.getApiName(), this.convertUserStructSpec(params.fields ?? {})));
    }
    addCollection(params) {
        return this.addType(params.name, this.moduleDef.createCollection(params.name, this.getApiName(), this.convertUserStructSpec(params.fields), params.interfaceType, params.maxCount, this.collectionCount++));
    }
    addFixedArray(innerType, arraySize) {
        const innerTypeSpec = this.convertUserTypeSpec(innerType);
        const innerTypeName = innerTypeSpec.type.getName();
        const name = `${innerTypeName}[${arraySize}]`;
        if (name in this.typeDefinitions) {
            return this.typeDefinitions[name];
        }
        return this.addType(name, this.moduleDef.createFixedArray(`${innerTypeName}_${arraySize}`, this.getApiName(), innerTypeSpec.type, arraySize));
    }
    addByteArray(expectedSize) {
        const name = `ByteArray[${expectedSize}]`;
        if (name in this.typeDefinitions) {
            return this.typeDefinitions[name];
        }
        return this.addType(name, this.moduleDef.createByteArray(expectedSize));
    }
    convertUserType(typeStr) {
        const typeDef = this.getType(typeStr);
        if (typeDef) {
            return (0, TypeDefinition_1.typeIsInterface)(typeDef) ? this.moduleDef.createReference(typeDef) : typeDef;
        }
        const bracketIdx = typeStr.indexOf("[");
        if (bracketIdx > -1 && typeStr.endsWith("]")) {
            const innerTypeName = typeStr.slice(0, bracketIdx);
            const arraySize = parseInt(typeStr.slice(bracketIdx + 1, -1), 10);
            if (innerTypeName === "ByteArray") {
                return this.addByteArray(arraySize);
            }
            else {
                return this.addFixedArray(this.convertUserType(innerTypeName), arraySize);
            }
        }
        return this.moduleDef.getPrimitiveTypeDefinition(typeStr);
    }
    convertUserTypeSpec(typeSpec) {
        if (typeof typeSpec === "string") {
            return {
                type: this.convertUserType(typeSpec),
            };
        }
        else if ((0, ModuleDefinition_1.isTypeDefinition)(typeSpec)) {
            return {
                type: (0, TypeDefinition_1.typeIsInterface)(typeSpec) ? this.moduleDef.createReference(typeSpec) : typeSpec,
            };
        }
        else if ((0, ModuleDefinition_1.isUserFieldTypeSpec)(typeSpec)) {
            return {
                type: this.convertUserType(typeSpec.type),
                defaultValue: typeSpec.defaultValue,
                description: typeSpec.description,
            };
        }
        else {
            return {
                type: (0, TypeDefinition_1.typeIsInterface)(typeSpec.type) ? this.moduleDef.createReference(typeSpec.type) : typeSpec.type,
                defaultValue: typeSpec.defaultValue,
                description: typeSpec.description,
            };
        }
    }
    convertUserStructSpec(fields) {
        return Object.keys(fields).reduce((fieldsOut, key) => {
            fieldsOut[key] = this.convertUserTypeSpec(fields[key]);
            return fieldsOut;
        }, {});
    }
    getHash() {
        const lines = [];
        lines.push(JSON.stringify(this.storedCoordinateSystem));
        const typeNames = Object.keys(this.typeDefinitions).sort();
        for (const typeName of typeNames) {
            lines.push(JSON.stringify(this.typeDefinitions[typeName].getHashData()));
        }
        return new xrpa_file_utils_1.HashValue(lines.join("\n"));
    }
    getAllTypeDefinitions() {
        return Object.values(this.typeDefinitions);
    }
    getTypeDefinitionsForHeader(headerFile) {
        const ret = [];
        for (const name in this.typeDefinitions) {
            const typeDef = this.typeDefinitions[name];
            if (typeDef.getLocalHeaderFile() === headerFile) {
                ret.push(typeDef);
            }
        }
        return ret;
    }
    getInterfaces() {
        const ret = [];
        for (const name in this.typeDefinitions) {
            const typeDef = this.typeDefinitions[name];
            if ((0, TypeDefinition_1.typeIsInterface)(typeDef)) {
                ret.push(typeDef);
            }
        }
        return ret;
    }
    getCollections() {
        const ret = [];
        for (const name in this.typeDefinitions) {
            const typeDef = this.typeDefinitions[name];
            if ((0, TypeDefinition_1.typeIsCollection)(typeDef)) {
                ret.push(typeDef);
            }
        }
        return ret;
    }
    // this is a heuristic, not a fully accurate number
    getStructMessagePoolSize(typeDef) {
        const fields = typeDef.getAllFields();
        let poolSize = 0;
        for (const fieldName in fields) {
            const fieldType = fields[fieldName].type;
            if ((0, TypeDefinition_1.typeIsMessageData)(fieldType)) {
                // want to hold 1/10th of a second worth of data
                const typeSize = fieldType.getTypeSize();
                poolSize += 0.1 * (typeSize.staticSize + typeSize.dynamicSizeEstimate + MESSAGE_EVENT_HEADER_SIZE) * fieldType.getExpectedRatePerSecond();
            }
            else if ((0, TypeDefinition_1.typeIsSignalData)(fieldType)) {
                // assume 100 packets per second, want to hold 1/10th of a second worth of data
                poolSize += 0.1 * (100 * (MESSAGE_EVENT_HEADER_SIZE + SIGNAL_PACKET_HEADER_SIZE) + fieldType.getExpectedBytesPerSecond());
            }
            else if ((0, TypeDefinition_1.typeIsStruct)(fieldType)) {
                poolSize += this.getStructMessagePoolSize(fieldType);
            }
        }
        return Math.ceil(poolSize);
    }
    calcMessagePoolSize() {
        let poolSize = 0;
        for (const typeDef of this.getCollections()) {
            poolSize += typeDef.maxCount * this.getStructMessagePoolSize(typeDef);
        }
        return poolSize;
    }
    calcChangelogSize() {
        let changelogByteCount = this.calcMessagePoolSize();
        for (const typeDef of this.getCollections()) {
            const typeSize = typeDef.getTypeSize();
            changelogByteCount += 2 * typeDef.maxCount * (typeSize.staticSize + typeSize.dynamicSizeEstimate + CHANGE_EVENT_HEADER_SIZE);
        }
        return changelogByteCount;
    }
}
exports.DataModelDefinition = DataModelDefinition;
//# sourceMappingURL=DataModel.js.map
