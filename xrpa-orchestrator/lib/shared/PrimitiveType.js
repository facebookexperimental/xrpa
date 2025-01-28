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
exports.PrimitiveType = void 0;
const TypeDefinition_1 = require("./TypeDefinition");
const TypeValue_1 = require("./TypeValue");
class PrimitiveType {
    constructor(codegen, name, datasetType, localType, byteCount, isPassthrough, defaultValue, setterDefaultValue = defaultValue) {
        this.codegen = codegen;
        this.name = name;
        this.datasetType = datasetType;
        this.localType = localType;
        this.byteCount = byteCount;
        this.isPassthrough = isPassthrough;
        this.defaultValue = defaultValue;
        this.setterDefaultValue = setterDefaultValue;
    }
    toString() {
        throw new Error("Bad stringify");
    }
    getName() {
        return this.name;
    }
    getMetaType() {
        return TypeDefinition_1.TypeMetaType.GET_SET;
    }
    getTypeSize() {
        return this.byteCount;
    }
    getHashData() {
        return {
            name: this.getName(),
            byteCount: this.getTypeSize(),
        };
    }
    getInternalMaxBytes() {
        return null;
    }
    getInternalType(inNamespace, includes) {
        includes?.addFile({
            filename: this.datasetType.headerFile,
            typename: this.datasetType.typename,
        });
        return this.codegen.nsQualify(this.datasetType.typename, inNamespace);
    }
    getLocalType(inNamespace, includes) {
        includes?.addFile({
            filename: this.localType.headerFile,
            typename: this.localType.typename,
        });
        return this.codegen.nsQualify(this.localType.typename, inNamespace);
    }
    getLocalHeaderFile() {
        return this.localType.headerFile;
    }
    userDefaultToTypeValue(_inNamespace, _includes, userDefault) {
        if (!Array.isArray(userDefault) && userDefault !== undefined) {
            return new TypeValue_1.PrimitiveValue(this.codegen, this.datasetType.typename, userDefault);
        }
        return undefined;
    }
    convertValueFromLocal(_inNamespace, _includes, value) {
        if (typeof value === "string") {
            value = new TypeValue_1.CodeLiteralValue(this.codegen, value);
        }
        if (this.localType.conversionOperator && !(value instanceof TypeValue_1.PrimitiveValue)) {
            value = new TypeValue_1.CodeLiteralValue(this.codegen, `${this.localType.conversionOperator}(${value})`);
        }
        return value;
    }
    convertValueToLocal(_inNamespace, _includes, value) {
        if (typeof value === "string") {
            value = new TypeValue_1.CodeLiteralValue(this.codegen, value);
        }
        if (this.localType.conversionOperator && !(value instanceof TypeValue_1.PrimitiveValue)) {
            value = new TypeValue_1.CodeLiteralValue(this.codegen, `${this.localType.conversionOperator}(${value})`);
        }
        return value;
    }
    getInternalDefaultValue(inNamespace, includes, isSetter, defaultOverride) {
        if ((0, TypeValue_1.isTypeValue)(defaultOverride)) {
            return defaultOverride;
        }
        return this.userDefaultToTypeValue(inNamespace, includes, defaultOverride) ?? (isSetter ? this.setterDefaultValue : this.defaultValue);
    }
    getLocalDefaultValue(inNamespace, includes, isSetter, defaultOverride) {
        return this.convertValueToLocal(inNamespace, includes, this.getInternalDefaultValue(inNamespace, includes, isSetter, defaultOverride));
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    genTypeDefinition(_includes) {
        return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    genLocalTypeDefinition(_inNamespace, _includes) {
        return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    genTargetSpecificTypeDefinition(_inNamespace, _includes) {
        return null;
    }
    declareLocalVar(inNamespace, includes, varName, defaultOverride) {
        return this.codegen.genDeclaration({
            typename: this.getLocalType("", includes),
            inNamespace,
            varName,
            initialValue: this.getLocalDefaultValue(inNamespace, includes, false, defaultOverride),
            includeTerminator: false,
        });
    }
    declareLocalParam(inNamespace, includes, paramName) {
        const paramType = this.codegen.constRef(this.getLocalType(inNamespace, includes), this.getTypeSize());
        if (!paramName) {
            return paramType;
        }
        return this.codegen.genDeclaration({
            typename: paramType,
            inNamespace: "",
            varName: paramName,
            initialValue: new TypeValue_1.EmptyValue(this.codegen, paramType, ""),
            includeTerminator: false,
        });
    }
    declareLocalReturnType(inNamespace, includes, canBeRef) {
        if (!canBeRef) {
            return this.getLocalType(inNamespace, includes);
        }
        return this.codegen.constRef(this.getLocalType(inNamespace, includes), this.getTypeSize());
    }
    resetLocalVarToDefault(inNamespace, includes, varName, isSetter, defaultOverride) {
        const defaultValue = this.getLocalDefaultValue(inNamespace, includes, isSetter, defaultOverride);
        const value = defaultValue.toString(inNamespace);
        if (value === "") {
            return [];
        }
        return [`${varName} = ${value};`];
    }
}
exports.PrimitiveType = PrimitiveType;
//# sourceMappingURL=PrimitiveType.js.map
