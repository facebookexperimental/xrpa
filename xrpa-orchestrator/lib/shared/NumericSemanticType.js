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
exports.NumericSemanticType = void 0;
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const assert_1 = __importDefault(require("assert"));
const CoordinateTransformer_1 = require("./CoordinateTransformer");
const StructType_1 = require("./StructType");
const TypeValue_1 = require("./TypeValue");
class NumericSemanticType extends StructType_1.StructType {
    constructor(codegen, semanticType, localTypeOverride, fields, conversionData, coordTypeConfig) {
        super(codegen, semanticType, conversionData.apiname, undefined, fields, localTypeOverride);
        this.semanticType = semanticType;
        this.conversionData = conversionData;
        this.coordTypeConfig = coordTypeConfig;
        let elemType = null;
        for (const key in fields) {
            if (elemType === null) {
                elemType = fields[key].type;
            }
            else {
                (0, assert_1.default)(elemType === fields[key].type);
            }
        }
        (0, assert_1.default)(elemType !== null);
    }
    genLocalTypeDefinition(inNamespace, includes) {
        if (this.localTypeOverride) {
            return null;
        }
        return super.genLocalTypeDefinition(inNamespace, includes);
    }
    getFieldTransforms(inNamespace, includes) {
        if (!this.coordTypeConfig) {
            return super.getFieldTransforms(inNamespace, includes);
        }
        const fieldMappings = (0, CoordinateTransformer_1.getFieldMappings)(this.getStateFields(), this.localType.fieldMap);
        const localType = this.getLocalType(inNamespace, includes);
        const localFieldOrder = Object.keys(fieldMappings.toLocal);
        const dsType = this.getInternalType(inNamespace, includes);
        const dsFieldOrder = Object.values(fieldMappings.fromLocal);
        return {
            fieldsToLocal: (0, xrpa_utils_1.recordZip)(Object.values(fieldMappings.toLocal), (0, CoordinateTransformer_1.genSemanticConversion)({
                codegen: this.codegen,
                returnType: localType,
                returnFieldOrder: localFieldOrder,
                valName: "",
                valFieldOrder: dsFieldOrder,
                valFieldMapping: null,
                coordTypeConfig: this.coordTypeConfig,
                transform: this.conversionData.toLocalTransform,
            })),
            fieldsFromLocal: (0, xrpa_utils_1.recordZip)(Object.values(fieldMappings.fromLocal), (0, CoordinateTransformer_1.genSemanticConversion)({
                codegen: this.codegen,
                returnType: dsType,
                returnFieldOrder: dsFieldOrder,
                valName: "val",
                valFieldOrder: dsFieldOrder,
                valFieldMapping: fieldMappings.toLocal,
                coordTypeConfig: this.coordTypeConfig,
                transform: this.conversionData.fromLocalTransform,
            })),
        };
    }
    convertValueFromLocal(inNamespace, includes, value) {
        if (typeof value === "string") {
            value = new TypeValue_1.CodeLiteralValue(this.codegen, value);
        }
        return new TypeValue_1.CodeLiteralValue(this.codegen, value.toString(inNamespace));
    }
    convertValueToLocal(inNamespace, includes, value) {
        if (typeof value === "string") {
            value = new TypeValue_1.CodeLiteralValue(this.codegen, value);
        }
        if (this.coordTypeConfig && value instanceof TypeValue_1.StructValue) {
            const fieldMappings = (0, CoordinateTransformer_1.getFieldMappings)(this.getStateFields(), this.localType.fieldMap);
            const localType = this.getLocalType(inNamespace, includes);
            const localFieldOrder = Object.keys(fieldMappings.toLocal);
            const dsFieldOrder = Object.values(fieldMappings.fromLocal);
            const dsFieldValues = value.fieldValues.map(kv => kv[1]);
            const localFieldValues = (0, CoordinateTransformer_1.performSemanticConversion)({
                codegen: this.codegen,
                returnType: localType,
                returnFieldOrder: localFieldOrder,
                valElems: dsFieldValues,
                valFieldOrder: dsFieldOrder,
                coordTypeConfig: this.coordTypeConfig,
                transform: this.conversionData.toLocalTransform,
                inNamespace,
            });
            value = new TypeValue_1.StructValue(this.codegen, localType, this.localType.hasInitializerConstructor ?? false, (0, xrpa_utils_1.arrayZip)(Object.values(fieldMappings.toLocal), localFieldValues), inNamespace);
            if (value instanceof TypeValue_1.StructValue && value.fieldValues.length === 1 && value.fieldValues[0][1] instanceof TypeValue_1.PrimitiveValue && value.fieldValues[0][1].typename === this.localType.typename) {
                return value.fieldValues[0][1];
            }
            return value;
        }
        if (value instanceof TypeValue_1.EmptyValue) {
            return new TypeValue_1.EmptyValue(this.codegen, this.localType.typename, value.defaultNamespace);
        }
        return super.convertValueToLocal(inNamespace, includes, value);
    }
}
exports.NumericSemanticType = NumericSemanticType;
//# sourceMappingURL=NumericSemanticType.js.map
