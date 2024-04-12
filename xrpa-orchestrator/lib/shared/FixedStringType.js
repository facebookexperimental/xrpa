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
exports.FixedStringType = void 0;
const BuiltinTypes_1 = require("./BuiltinTypes");
const PrimitiveType_1 = require("./PrimitiveType");
const TypeValue_1 = require("./TypeValue");
class FixedStringType extends PrimitiveType_1.PrimitiveType {
    constructor(codegen, name, _apiname, maxBytes, typeMap) {
        super(codegen, name, codegen.PRIMITIVE_INTRINSICS.string, typeMap[BuiltinTypes_1.BuiltinType.String] ?? codegen.PRIMITIVE_INTRINSICS.string, maxBytes + 4, // uint byte count + UTF8 byte buffer
        false, new TypeValue_1.PrimitiveValue(codegen, codegen.PRIMITIVE_INTRINSICS.string.typename, ""));
        this.maxBytes = maxBytes;
    }
    getInternalMaxBytes() {
        return this.maxBytes;
    }
}
exports.FixedStringType = FixedStringType;
//# sourceMappingURL=FixedStringType.js.map
