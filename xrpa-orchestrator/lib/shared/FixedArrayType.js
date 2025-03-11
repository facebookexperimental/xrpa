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
exports.FixedArrayType = void 0;
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const StructType_1 = require("./StructType");
class FixedArrayType extends StructType_1.StructType {
    constructor(codegen, name, apiname, innerType, arraySize, localArrayType) {
        const fields = {};
        const fieldMap = {};
        for (let i = 0; i < arraySize; ++i) {
            const valueName = `value${i}`;
            fields[valueName] = {
                type: innerType,
            };
            fieldMap[`[${i}]`] = valueName;
        }
        const localType = localArrayType ? {
            typename: codegen.applyTemplateParams(localArrayType.typename, innerType.getLocalType("", null)),
            headerFile: localArrayType.headerFile,
            hasInitializerConstructor: true,
            fieldMap,
        } : undefined;
        super(codegen, name, apiname, undefined, fields, localType);
        this.innerType = innerType;
        this.arraySize = arraySize;
        this.localArrayType = localArrayType;
    }
    getHashData() {
        const hashData = {
            ...super.getHashData(),
            innerType: this.innerType.getName(),
            arraySize: this.arraySize,
        };
        delete hashData.fields;
        return hashData;
    }
    resetLocalVarToDefault(inNamespace, includes, varName, isSetter, defaultOverride) {
        if (!this.localArrayType) {
            return super.resetLocalVarToDefault(inNamespace, includes, varName, isSetter, defaultOverride);
        }
        const lines = [];
        if (this.localArrayType.setSize) {
            lines.push(`${varName}.${this.localArrayType.setSize.slice(0, -1)}${this.arraySize});`, `for (int i = 0; i < ${this.arraySize}; ++i) {`, ...(0, xrpa_utils_1.indent)(1, this.innerType.resetLocalVarToDefault(inNamespace, includes, `${varName}[i]`, isSetter, defaultOverride)), `}`);
        }
        else {
            const defaultValue = this.innerType.getLocalDefaultValue(inNamespace, includes, isSetter, defaultOverride);
            lines.push(`${varName}.${this.localArrayType.removeAll};`, `for (int i = 0; i < ${this.arraySize}; ++i) {`, `  ${varName}.${this.localArrayType.addItem.slice(0, -1)}${defaultValue});`, `}`);
        }
        return lines;
    }
}
exports.FixedArrayType = FixedArrayType;
//# sourceMappingURL=FixedArrayType.js.map
