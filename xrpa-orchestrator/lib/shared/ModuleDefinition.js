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
exports.ModuleDefinition = exports.isUserFieldTypeSpec = exports.isTypeDefinition = void 0;
const assert_1 = __importDefault(require("assert"));
const BuiltinTypes_1 = require("./BuiltinTypes");
const CollectionType_1 = require("./CollectionType");
const DataStore_1 = require("./DataStore");
const EnumType_1 = require("./EnumType");
const FixedArrayType_1 = require("./FixedArrayType");
const FixedStringType_1 = require("./FixedStringType");
const InterfaceType_1 = require("./InterfaceType");
const MessageDataType_1 = require("./MessageDataType");
const ReferenceType_1 = require("./ReferenceType");
const StructType_1 = require("./StructType");
function isTypeDefinition(val) {
    return typeof val === "object" && val !== null && typeof val.getMetaType === "function";
}
exports.isTypeDefinition = isTypeDefinition;
function isUserFieldTypeSpec(val) {
    return typeof val === "object" && val !== null && typeof val.type === "string";
}
exports.isUserFieldTypeSpec = isUserFieldTypeSpec;
class ModuleDefinition {
    constructor(codegen, name, datamap, guidGen) {
        this.codegen = codegen;
        this.name = name;
        this.datamap = datamap;
        this.guidGen = guidGen;
        this.datastores = [];
        this.settingsType = null;
        this.settingsSpec = {};
        this.primitiveTypes = (0, BuiltinTypes_1.genPrimitiveTypes)(codegen, datamap.typeMap);
        this.DSIdentifier = this.createDSIdentifier();
    }
    getTypeMap() {
        return this.datamap.typeMap;
    }
    getLocalCoordinateSystem() {
        return this.datamap.coordinateSystem;
    }
    addDataStore(params) {
        const datastore = new DataStore_1.DataStoreDefinition(this, params.dataset, params.typeMap ?? {}, params.apiname);
        this.datastores.push(datastore);
        if (params.datamodel) {
            params.datamodel(datastore.datamodel);
        }
        return datastore;
    }
    getDataStores() {
        return this.datastores;
    }
    addSetting(name, setting) {
        (0, assert_1.default)(this.settingsSpec[name] === undefined, `Setting "${name}" already exists`);
        (0, assert_1.default)(!this.settingsType, "addSetting called too late");
        this.settingsSpec[name] = this.convertUserTypeSpec(setting);
    }
    convertUserTypeSpec(typeSpec) {
        if (typeof typeSpec === "string") {
            return {
                type: this.getPrimitiveTypeDefinition(typeSpec),
            };
        }
        else if (isTypeDefinition(typeSpec)) {
            return {
                type: typeSpec,
            };
        }
        else if (isUserFieldTypeSpec(typeSpec)) {
            return {
                type: this.getPrimitiveTypeDefinition(typeSpec.type),
                defaultValue: typeSpec.defaultValue,
                description: typeSpec.description,
            };
        }
        else {
            return typeSpec;
        }
    }
    getSettings() {
        if (!this.settingsType) {
            this.settingsType = this.createStruct(`${this.name}Settings`, "", this.settingsSpec, undefined);
        }
        return this.settingsType;
    }
    BooleanField(defaultValue, description) {
        return {
            type: this.getPrimitiveTypeDefinition(BuiltinTypes_1.BuiltinType.Boolean),
            defaultValue,
            description,
        };
    }
    ScalarField(defaultValue, description) {
        return {
            type: this.getPrimitiveTypeDefinition(BuiltinTypes_1.BuiltinType.Scalar),
            defaultValue,
            description,
        };
    }
    CountField(defaultValue, description) {
        return {
            type: this.getPrimitiveTypeDefinition(BuiltinTypes_1.BuiltinType.Count),
            defaultValue,
            description,
        };
    }
    BitFieldField(defaultValue, description) {
        return {
            type: this.getPrimitiveTypeDefinition(BuiltinTypes_1.BuiltinType.BitField),
            defaultValue,
            description,
        };
    }
    StringField(defaultValue, description) {
        return {
            type: this.getPrimitiveTypeDefinition(BuiltinTypes_1.BuiltinType.String),
            defaultValue,
            description,
        };
    }
    getPrimitiveTypeDefinition(typeName) {
        const ret = this.primitiveTypes[typeName];
        (0, assert_1.default)(ret !== undefined, `No type definition found for primitive type ${typeName}.`);
        return ret;
    }
    getBuiltinTypeDefinition(typeName, apiname, datamodel) {
        const ret = this.primitiveTypes[typeName] ?? (0, BuiltinTypes_1.getSemanticType)(this.codegen, typeName, apiname, datamodel);
        (0, assert_1.default)(ret !== undefined, `No builtin type found for ${typeName}.`);
        return ret;
    }
    createEnum(name, apiname, enumValues, localTypeOverride) {
        return new EnumType_1.EnumType(this.codegen, name, apiname, enumValues, localTypeOverride);
    }
    createReference(toType) {
        return new ReferenceType_1.ReferenceType(this.codegen, toType, this.DSIdentifier);
    }
    createStruct(name, apiname, fields, localTypeOverride) {
        return new StructType_1.StructType(this.codegen, name, apiname, undefined, fields, localTypeOverride);
    }
    createMessageStruct(name, apiname, fields) {
        return new MessageDataType_1.MessageDataType(this.codegen, name, apiname, fields);
    }
    createInterface(name, apiname, fields) {
        return new InterfaceType_1.InterfaceType(this.codegen, name, apiname, fields);
    }
    createCollection(name, apiname, fields, interfaceType, maxCount, dsType) {
        return new CollectionType_1.CollectionType(this.codegen, name, apiname, fields, dsType, maxCount, interfaceType);
    }
    createFixedArray(name, apiname, innerType, arraySize) {
        return new FixedArrayType_1.FixedArrayType(this.codegen, name, apiname, innerType, arraySize, this.datamap.localArrayType);
    }
    createFixedString(name, apiname, maxBytes) {
        return new FixedStringType_1.FixedStringType(this.codegen, name, apiname, maxBytes, this.datamap.typeMap);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setCollectionAsInbound(type, reconciledTo, _indexes) {
        const collection = type;
        const namespace = this.codegen.nsExtract(collection.datasetType.typename);
        collection.localType = reconciledTo ?? {
            typename: this.codegen.nsJoin(namespace, `Reconciled${type.getName()}`),
            headerFile: this.codegen.getDataStoreHeaderName(collection.apiname),
        };
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setCollectionAsOutbound(type, _componentProps) {
        const collection = type;
        const namespace = this.codegen.nsExtract(collection.datasetType.typename);
        collection.localType = {
            typename: this.codegen.nsJoin(namespace, `Outbound${type.getName()}`),
            headerFile: this.codegen.getDataStoreHeaderName(collection.apiname),
        };
    }
}
exports.ModuleDefinition = ModuleDefinition;
//# sourceMappingURL=ModuleDefinition.js.map
