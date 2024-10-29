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
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const assert_1 = __importDefault(require("assert"));
const BuiltinTypes_1 = require("./BuiltinTypes");
const CoordinateTransformer_1 = require("./CoordinateTransformer");
const ModuleDefinition_1 = require("./ModuleDefinition");
const TypeDefinition_1 = require("./TypeDefinition");
function verify(val) {
    (0, assert_1.default)(val !== undefined);
    return val;
}
const FIXED_STRING = "FixedString";
const DSMessageSize = 28;
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
    addStruct(name, fields) {
        return this.addType(name, this.moduleDef.createStruct(name, this.getApiName(), this.convertUserStructSpec(fields), this.typeMap[name]));
    }
    addMessageStruct(name, fields) {
        return this.addType(name, this.moduleDef.createMessageStruct(name, this.getApiName(), this.convertUserStructSpec(fields)));
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
    addFixedString(maxBytes) {
        const name = `${FIXED_STRING}{${maxBytes}}`;
        if (name in this.typeDefinitions) {
            return this.typeDefinitions[name];
        }
        return this.addType(name, this.moduleDef.createFixedString(`${FIXED_STRING}_${maxBytes}`, this.getApiName(), maxBytes));
    }
    convertUserType(typeStr) {
        const typeDef = this.getType(typeStr);
        if (typeDef) {
            return (0, TypeDefinition_1.typeIsInterface)(typeDef) ? this.moduleDef.createReference(typeDef) : typeDef;
        }
        const bracketIdx = typeStr.indexOf("[");
        if (bracketIdx > -1 && typeStr.endsWith("]")) {
            const innerTypeName = typeStr.slice(0, bracketIdx);
            const innerType = this.convertUserType(innerTypeName);
            const arraySize = parseInt(typeStr.slice(bracketIdx + 1, -1), 10);
            return this.addFixedArray(innerType, arraySize);
        }
        if (typeStr.startsWith(`${FIXED_STRING}{`) && typeStr.endsWith("}")) {
            const maxBytes = parseInt(typeStr.slice(`${FIXED_STRING}{`.length, -1), 10);
            return this.addFixedString(maxBytes);
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
    convertMessagesStructSpec(parentName, messages) {
        return Object.keys(messages).reduce((messagesOut, msgName) => {
            const messageSpec = messages[msgName];
            messagesOut[msgName] = this.addMessageStruct(`${parentName}_${msgName}MessageData`, messageSpec === null ? {} : this.convertUserStructSpec(messageSpec));
            return messagesOut;
        }, {});
    }
    getHash() {
        const lines = [];
        lines.push(JSON.stringify(this.storedCoordinateSystem));
        const typeNames = Object.keys(this.typeDefinitions).sort();
        for (const typeName of typeNames) {
            lines.push(JSON.stringify(this.typeDefinitions[typeName].getHashData()));
        }
        return new xrpa_utils_1.HashValue(lines.join("\n"));
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
                poolSize += (fieldType.getTypeSize() + DSMessageSize) * 16;
            }
            else if ((0, TypeDefinition_1.typeIsSignalData)(fieldType)) {
                poolSize += (4800 /*samples*/ * 4 /*channels*/ * 4 /*bytesPerSample*/) + ((DSMessageSize + 16 /*header*/) * 20);
            }
            else if ((0, TypeDefinition_1.typeIsStruct)(fieldType)) {
                poolSize += this.getStructMessagePoolSize(fieldType);
            }
        }
        return poolSize;
    }
    calcMessagePoolSize() {
        let poolSize = 0;
        for (const typeDef of this.getCollections()) {
            poolSize += typeDef.maxCount * this.getStructMessagePoolSize(typeDef);
        }
        return poolSize;
    }
}
exports.DataModelDefinition = DataModelDefinition;
//# sourceMappingURL=DataModel.js.map
