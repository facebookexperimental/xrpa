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

Object.defineProperty(exports, "__esModule", { value: true });
exports.StructType = void 0;
const Helpers_1 = require("./Helpers");
const CoordinateTransformer_1 = require("./CoordinateTransformer");
const PrimitiveType_1 = require("./PrimitiveType");
const TypeDefinition_1 = require("./TypeDefinition");
const TypeValue_1 = require("./TypeValue");
const ClassSpec_1 = require("./ClassSpec");
function calcStructSize(fields) {
    let size = 0;
    for (const key in fields) {
        size += fields[key].type.getTypeSize();
    }
    return size;
}
class StructType extends PrimitiveType_1.PrimitiveType {
    constructor(codegen, name, apiname, parentType, fields, localTypeOverride) {
        // This should be checked for higher up, this is just a last-minute verification.
        for (const key in fields) {
            if ((0, TypeDefinition_1.typeIsInterface)(fields[key].type)) {
                throw new Error(`Field "${key}" is an interface or collection, but should be a reference.`);
            }
        }
        const namespace = codegen.getDataStoreName(apiname);
        super(codegen, name, { typename: codegen.nsJoin(namespace, `DS${name}`), headerFile: codegen.getTypesHeaderName(apiname) }, localTypeOverride ?? { typename: codegen.nsJoin(namespace, name), headerFile: codegen.getTypesHeaderName(apiname) }, 0, // getTypeSize() is overridden
        false, new TypeValue_1.EmptyValue(codegen, codegen.nsJoin(namespace, `DS${name}`), ""));
        this.apiname = apiname;
        this.parentType = parentType;
        this.fields = fields;
        this.localTypeOverride = localTypeOverride;
    }
    getMetaType() {
        return TypeDefinition_1.TypeMetaType.STRUCT;
    }
    getHashData() {
        const fieldHashData = {};
        const fields = this.getAllFields();
        for (const key in fields) {
            fieldHashData[key] = fields[key].type.getName();
        }
        return {
            ...super.getHashData(),
            fields: fieldHashData,
        };
    }
    getTypeSize() {
        return calcStructSize(this.getStateFields());
    }
    getApiName() {
        return this.apiname;
    }
    getAllFields() {
        return this.fields;
    }
    getStateFields() {
        const fields = this.getAllFields();
        const stateFields = {};
        for (const key in fields) {
            if ((0, TypeDefinition_1.typeIsStateData)(fields[key].type)) {
                stateFields[key] = fields[key];
            }
        }
        return stateFields;
    }
    getFieldsOfType(typeFilter) {
        const fields = this.getAllFields();
        const ret = {};
        for (const key in fields) {
            const typeDef = fields[key].type;
            if (typeFilter(typeDef)) {
                ret[key] = typeDef;
            }
        }
        return ret;
    }
    getFieldBitMask(fieldName) {
        const fields = this.getStateFields();
        let fieldCount = 0;
        for (const name in fields) {
            if (fieldName === name) {
                return 1 << fieldCount;
            }
            fieldCount++;
        }
        return 0;
    }
    getFieldIndex(fieldName) {
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
    userDefaultToTypeValue(inNamespace, includes, userDefault) {
        const fields = this.getStateFields();
        const fieldNames = Object.keys(fields);
        if (Array.isArray(userDefault)) {
            const values = [];
            for (let i = 0; i < userDefault.length; i++) {
                values.push([fieldNames[i], new TypeValue_1.PrimitiveValue(this.codegen, fields[fieldNames[i]].type.getInternalType("", includes), userDefault[i])]);
            }
            return new TypeValue_1.StructValue(this.codegen, this.getInternalType(inNamespace, includes), false, values, inNamespace);
        }
        else if (userDefault !== undefined && fieldNames.length === 1) {
            const values = [
                [fieldNames[0], new TypeValue_1.PrimitiveValue(this.codegen, fields[fieldNames[0]].type.getInternalType("", includes), userDefault)],
            ];
            return new TypeValue_1.StructValue(this.codegen, this.getInternalType(inNamespace, includes), false, values, inNamespace);
        }
        return undefined;
    }
    declareLocalFieldClassMember(classSpec, fieldName, memberName, includeComments, decorations, visibility) {
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
    resetLocalFieldVarToDefault(inNamespace, includes, fieldName, varName, isSetter) {
        const fieldSpec = this.getStateFields()[fieldName];
        return fieldSpec.type.resetLocalVarToDefault(inNamespace, includes, varName, isSetter, fieldSpec.defaultValue);
    }
    getFieldOffsetDeclarations(classSpec) {
        const fields = this.getStateFields();
        let byteOffset = 0;
        for (const name in fields) {
            const fieldOffsetName = `${(0, Helpers_1.upperFirst)(name)}FieldOffset`;
            classSpec.members.push({
                type: this.codegen.PRIMITIVE_INTRINSICS.int32.typename,
                name: fieldOffsetName,
                initialValue: new TypeValue_1.PrimitiveValue(this.codegen, this.codegen.PRIMITIVE_INTRINSICS.int32.typename, byteOffset),
                isStatic: true,
                isConst: true,
            });
            byteOffset += fields[name].type.getTypeSize();
        }
    }
    getFieldTypes(inNamespace, includes) {
        const ret = {};
        const fields = this.getStateFields();
        for (const name in fields) {
            const fieldSpec = fields[name];
            const accessor = fieldSpec.type.getInternalType(inNamespace, includes);
            const accessorIsStruct = (0, TypeDefinition_1.typeIsStruct)(fieldSpec.type);
            const accessorMaxBytes = fieldSpec.type.getInternalMaxBytes();
            ret[name] = {
                typename: accessorIsStruct ? fieldSpec.type.getLocalType(inNamespace, includes) : accessor,
                accessor,
                accessorIsStruct,
                accessorMaxBytes,
                fieldOffsetName: `${(0, Helpers_1.upperFirst)(name)}FieldOffset`,
            };
        }
        return ret;
    }
    getFieldTransforms(inNamespace, includes) {
        const fieldsFromLocal = {};
        const fieldsToLocal = {};
        const fieldMappings = (0, CoordinateTransformer_1.getFieldMappings)(this.getStateFields(), this.localType.fieldMap);
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
    genReadWriteValueFunctions(classSpec) {
        this.codegen.genReadWriteValueFunctions(classSpec, {
            localType: this,
            localTypeHasInitializerConstructor: this.localType.hasInitializerConstructor ?? false,
            fieldTypes: this.getFieldTypes(classSpec.namespace, classSpec.includes),
            localValueParamName: "val",
            ...this.getFieldTransforms(classSpec.namespace, classSpec.includes),
        });
    }
    genTypeDefinition(includes) {
        if (this.getMetaType() === TypeDefinition_1.TypeMetaType.INTERFACE) {
            return null;
        }
        const inNamespace = this.codegen.nsExtract(this.datasetType.typename);
        const classSpec = new ClassSpec_1.ClassSpec({
            name: this.getInternalType(inNamespace, null),
            namespace: inNamespace,
            includes,
        });
        this.getFieldOffsetDeclarations(classSpec);
        this.genReadWriteValueFunctions(classSpec);
        return (0, Helpers_1.trimTrailingEmptyLines)(this.codegen.genClassDefinition(classSpec));
    }
    genLocalTypeDefinition(inNamespace, includes) {
        if (this.localTypeOverride) {
            return null;
        }
        const classSpec = new ClassSpec_1.ClassSpec({
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
            });
        }
        return (0, Helpers_1.trimTrailingEmptyLines)(this.codegen.genClassDefinition(classSpec));
    }
    convertValueFromLocal(inNamespace, includes, value) {
        if (typeof value === "string") {
            value = new TypeValue_1.CodeLiteralValue(this.codegen, value);
        }
        if (value instanceof TypeValue_1.StructValue) {
            const fieldMappings = (0, CoordinateTransformer_1.getFieldMappings)(this.getStateFields(), this.localType.fieldMap);
            const dsValues = [];
            const localFieldOrder = Object.values(fieldMappings.toLocal);
            for (const localFieldName in fieldMappings.fromLocal) {
                const dsFieldName = fieldMappings.fromLocal[localFieldName];
                const localIdx = localFieldOrder.indexOf(localFieldName);
                dsValues.push([
                    dsFieldName,
                    fieldMappings.fields[dsFieldName].type.convertValueFromLocal(inNamespace, includes, value.fieldValues[localIdx][1]),
                ]);
            }
            return new TypeValue_1.StructValue(this.codegen, this.localType.typename, this.localType.hasInitializerConstructor ?? false, dsValues, inNamespace);
        }
        return new TypeValue_1.CodeLiteralValue(this.codegen, value.toString(inNamespace));
    }
    convertValueToLocal(inNamespace, includes, value) {
        if (typeof value === "string") {
            value = new TypeValue_1.CodeLiteralValue(this.codegen, value);
        }
        if (value instanceof TypeValue_1.StructValue) {
            const fieldMappings = (0, CoordinateTransformer_1.getFieldMappings)(this.getStateFields(), this.localType.fieldMap);
            const localValues = [];
            const dsFieldOrder = Object.values(fieldMappings.fromLocal);
            for (const dsFieldName in fieldMappings.toLocal) {
                const dsIdx = dsFieldOrder.indexOf(dsFieldName);
                localValues.push([
                    fieldMappings.toLocal[dsFieldName],
                    fieldMappings.fields[dsFieldName].type.convertValueToLocal(inNamespace, includes, value.fieldValues[dsIdx][1]),
                ]);
            }
            return new TypeValue_1.StructValue(this.codegen, this.localType.typename, this.localType.hasInitializerConstructor ?? false, localValues, inNamespace);
        }
        if (value instanceof TypeValue_1.EmptyValue) {
            return new TypeValue_1.EmptyValue(this.codegen, this.localType.typename, value.defaultNamespace);
        }
        return new TypeValue_1.CodeLiteralValue(this.codegen, value.toString(inNamespace));
    }
    getDatasetDefaultFieldValues(inNamespace, includes, isSetter) {
        const fields = this.getStateFields();
        const values = [];
        for (const fieldName in fields) {
            const fieldSpec = fields[fieldName];
            values.push([
                fieldName,
                fieldSpec.type.getInternalDefaultValue(inNamespace, includes, isSetter, fieldSpec.defaultValue),
            ]);
        }
        return new TypeValue_1.StructValue(this.codegen, this.datasetType.typename, false, values, inNamespace);
    }
    getInternalDefaultValue(inNamespace, includes, isSetter, defaultOverride) {
        if (!(0, TypeValue_1.isTypeValue)(defaultOverride)) {
            const userDefault = this.userDefaultToTypeValue(inNamespace, includes, defaultOverride);
            if (userDefault) {
                return userDefault;
            }
        }
        if (defaultOverride instanceof TypeValue_1.StructValue || defaultOverride instanceof TypeValue_1.EmptyValue) {
            return defaultOverride;
        }
        return this.getDatasetDefaultFieldValues(inNamespace, includes, isSetter);
    }
}
exports.StructType = StructType;
//# sourceMappingURL=StructType.js.map
