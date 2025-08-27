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
exports.isSameTypeValue = exports.isTypeValue = exports.StructValue = exports.ConstructValue = exports.EmptyValue = exports.CodeLiteralValue = exports.EnumValue = exports.PrimitiveValue = void 0;
class PrimitiveValue {
    constructor(codegen, typename, value) {
        this.codegen = codegen;
        this.typename = typename;
        this.value = value;
    }
    toString() {
        return this.codegen.genPrimitiveValue(this.typename, this.value);
    }
}
exports.PrimitiveValue = PrimitiveValue;
class EnumValue {
    constructor(codegen, typename, enumValue, defaultNamespace) {
        this.codegen = codegen;
        this.typename = typename;
        this.enumValue = enumValue;
        this.defaultNamespace = defaultNamespace;
    }
    toString(inNamespace) {
        inNamespace = inNamespace ?? this.defaultNamespace;
        return this.codegen.nsJoin(this.codegen.nsQualify(this.typename, inNamespace), this.enumValue);
    }
}
exports.EnumValue = EnumValue;
class CodeLiteralValue {
    constructor(codegen, code) {
        this.codegen = codegen;
        this.code = code;
    }
    toString() {
        return this.code;
    }
}
exports.CodeLiteralValue = CodeLiteralValue;
class EmptyValue {
    constructor(codegen, typename, defaultNamespace) {
        this.codegen = codegen;
        this.typename = typename;
        this.defaultNamespace = defaultNamespace;
    }
    toString(inNamespace) {
        if (!this.typename) {
            return "";
        }
        inNamespace = inNamespace ?? this.defaultNamespace;
        return this.codegen.genPrimitiveValue(this.codegen.nsQualify(this.typename, inNamespace), null);
    }
}
exports.EmptyValue = EmptyValue;
class ConstructValue {
    constructor(codegen, typename, defaultNamespace) {
        this.codegen = codegen;
        this.typename = typename;
        this.defaultNamespace = defaultNamespace;
    }
    toString(inNamespace) {
        if (!this.typename) {
            return "";
        }
        inNamespace = inNamespace ?? this.defaultNamespace;
        return this.codegen.genPrimitiveValue(this.codegen.nsQualify(this.typename, inNamespace), null);
    }
}
exports.ConstructValue = ConstructValue;
class StructValue {
    constructor(codegen, typename, hasInitializerConstructor, fieldValues, defaultNamespace) {
        this.codegen = codegen;
        this.typename = typename;
        this.hasInitializerConstructor = hasInitializerConstructor;
        this.fieldValues = fieldValues;
        this.defaultNamespace = defaultNamespace;
    }
    toString(inNamespace) {
        inNamespace = inNamespace ?? this.defaultNamespace;
        const values = this.fieldValues.map(v => [v[0], v[1].toString(inNamespace)]);
        return this.codegen.genMultiValue(this.codegen.nsQualify(this.typename, inNamespace), this.hasInitializerConstructor, values);
    }
}
exports.StructValue = StructValue;
function isTypeValue(val) {
    return (val instanceof PrimitiveValue ||
        val instanceof EnumValue ||
        val instanceof CodeLiteralValue ||
        val instanceof EmptyValue ||
        val instanceof ConstructValue ||
        val instanceof StructValue);
}
exports.isTypeValue = isTypeValue;
function isSameTypeValue(a, b) {
    if (a instanceof PrimitiveValue && b instanceof PrimitiveValue) {
        return a.typename === b.typename && a.value === b.value;
    }
    if (a instanceof EnumValue && b instanceof EnumValue) {
        return a.typename === b.typename && a.enumValue === b.enumValue;
    }
    if (a instanceof CodeLiteralValue && b instanceof CodeLiteralValue) {
        return a.code === b.code;
    }
    if (a instanceof EmptyValue && b instanceof EmptyValue) {
        return a.typename === b.typename;
    }
    if (a instanceof ConstructValue && b instanceof ConstructValue) {
        return a.typename === b.typename;
    }
    if (a instanceof StructValue && b instanceof StructValue) {
        if (a.typename !== b.typename) {
            return false;
        }
        if (a.fieldValues.length !== b.fieldValues.length) {
            return false;
        }
        for (let i = 0; i < a.fieldValues.length; i++) {
            if (a.fieldValues[i][0] !== b.fieldValues[i][0]) {
                return false;
            }
            if (!isSameTypeValue(a.fieldValues[i][1], b.fieldValues[i][1])) {
                return false;
            }
        }
        return true;
    }
    return false;
}
exports.isSameTypeValue = isSameTypeValue;
//# sourceMappingURL=TypeValue.js.map
