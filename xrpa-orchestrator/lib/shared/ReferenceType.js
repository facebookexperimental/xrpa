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
exports.ReferenceType = void 0;
const PrimitiveType_1 = require("./PrimitiveType");
const TypeDefinition_1 = require("./TypeDefinition");
const TypeValue_1 = require("./TypeValue");
class ReferenceType extends PrimitiveType_1.PrimitiveType {
    constructor(codegen, toType, dsIdentifierType) {
        const zero = new TypeValue_1.PrimitiveValue(codegen, codegen.PRIMITIVE_INTRINSICS.uint64.typename, 0);
        super(codegen, `Reference<${toType.getName()}>`, dsIdentifierType.datasetType, dsIdentifierType.localType, dsIdentifierType.getTypeSize(), true, new TypeValue_1.StructValue(codegen, dsIdentifierType.getInternalType("", null), false, [
            ["ID0", zero],
            ["ID1", zero],
        ], ""));
        this.toType = toType;
        this.dsIdentifierType = dsIdentifierType;
    }
    getMetaType() {
        return TypeDefinition_1.TypeMetaType.TYPE_REFERENCE;
    }
    getReferencedTypeList(inNamespace, includes) {
        return this.toType.getCompatibleTypeList(inNamespace, includes);
    }
    getReferencedSuperType(inNamespace, includes) {
        return this.toType.getLocalTypePtr(inNamespace, includes);
    }
    convertValueFromLocal(inNamespace, includes, value) {
        if (typeof value === "string") {
            value = new TypeValue_1.CodeLiteralValue(this.codegen, this.codegen.genReferencePtrToID(value, this.toType.getPtrType(), this.dsIdentifierType.getLocalType(inNamespace, includes)));
        }
        return value;
    }
    convertValueToLocal(_inNamespace, _includes, value) {
        if (typeof value === "string") {
            value = new TypeValue_1.CodeLiteralValue(this.codegen, value);
        }
        return value;
    }
}
exports.ReferenceType = ReferenceType;
//# sourceMappingURL=ReferenceType.js.map
