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
exports.EnumType = void 0;
const PrimitiveType_1 = require("./PrimitiveType");
const TypeValue_1 = require("./TypeValue");
class EnumType extends PrimitiveType_1.PrimitiveType {
    constructor(codegen, enumName, apiname, enumValues, localTypeOverride) {
        const typename = codegen.nsJoin(codegen.getDataStoreName(apiname), enumName);
        super(codegen, enumName, codegen.PRIMITIVE_INTRINSICS.uint32, localTypeOverride ?? { typename, headerFile: codegen.getTypesHeaderName(apiname) }, 4, true, new TypeValue_1.EnumValue(codegen, typename, Object.keys(enumValues)[0], ""));
        this.enumName = enumName;
        this.enumValues = enumValues;
        this.localTypeOverride = localTypeOverride;
    }
    getHashData() {
        return {
            ...super.getHashData(),
            enumValues: this.enumValues,
        };
    }
    userDefaultToTypeValue(inNamespace, _includes, userDefault) {
        if (typeof userDefault === "string" && (userDefault in this.enumValues)) {
            return new TypeValue_1.EnumValue(this.codegen, this.datasetType.typename, userDefault, inNamespace);
        }
        return undefined;
    }
    genTypeDefinition() {
        if (this.localTypeOverride) {
            return null;
        }
        return this.codegen.genEnumDefinition(this.enumName, this.enumValues);
    }
    convertValueFromLocal(inNamespace, includes, value) {
        if (typeof value === "string") {
            value = new TypeValue_1.CodeLiteralValue(this.codegen, value);
        }
        if (value instanceof TypeValue_1.EmptyValue) {
            return new TypeValue_1.EmptyValue(this.codegen, this.datasetType.typename, value.defaultNamespace);
        }
        if (value instanceof TypeValue_1.EnumValue && value.typename === this.localType.typename) {
            let enumValue = value.enumValue;
            if (this.localTypeOverride?.fieldMap) {
                for (const dsEnumValue in this.localTypeOverride.fieldMap) {
                    if (this.localTypeOverride.fieldMap[dsEnumValue] === value.enumValue) {
                        enumValue = dsEnumValue;
                        break;
                    }
                }
            }
            return new TypeValue_1.EnumValue(this.codegen, this.datasetType.typename, enumValue, inNamespace);
        }
        return new TypeValue_1.CodeLiteralValue(this.codegen, this.codegen.genEnumDynamicConversion(this.getInternalType(inNamespace, includes), value));
    }
    convertValueToLocal(inNamespace, includes, value) {
        if (typeof value === "string") {
            value = new TypeValue_1.CodeLiteralValue(this.codegen, value);
        }
        if (value instanceof TypeValue_1.EmptyValue) {
            return new TypeValue_1.EmptyValue(this.codegen, this.localType.typename, value.defaultNamespace);
        }
        if (value instanceof TypeValue_1.EnumValue) {
            let enumValue = value.enumValue;
            if (this.localTypeOverride?.fieldMap) {
                enumValue = this.localTypeOverride.fieldMap[enumValue];
            }
            return new TypeValue_1.EnumValue(this.codegen, this.localType.typename, enumValue, inNamespace);
        }
        return new TypeValue_1.CodeLiteralValue(this.codegen, this.codegen.genEnumDynamicConversion(this.getLocalType(inNamespace, includes), value));
    }
}
exports.EnumType = EnumType;
//# sourceMappingURL=EnumType.js.map
