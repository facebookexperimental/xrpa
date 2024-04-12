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
exports.MessageDataType = void 0;
const Helpers_1 = require("./Helpers");
const StructWithAccessorType_1 = require("./StructWithAccessorType");
const TypeDefinition_1 = require("./TypeDefinition");
class MessageDataType extends StructWithAccessorType_1.StructWithAccessorType {
    constructor(codegen, name, apiname, fields) {
        super(codegen, name, apiname, undefined, fields);
    }
    getMetaType() {
        return TypeDefinition_1.TypeMetaType.MESSAGE_DATA;
    }
    hasFields() {
        return !(0, Helpers_1.objectIsEmpty)(this.fields);
    }
    genReadAccessorDefinition(inNamespace, includes) {
        return this.hasFields() ? super.genReadAccessorDefinition(inNamespace, includes) : null;
    }
    genWriteAccessorDefinition(inNamespace, includes) {
        return this.hasFields() ? super.genWriteAccessorDefinition(inNamespace, includes) : null;
    }
    genTypeDefinition(includes) {
        return this.hasFields() ? super.genTypeDefinition(includes) : null;
    }
    genLocalTypeDefinition(inNamespace, includes) {
        return this.hasFields() ? super.genLocalTypeDefinition(inNamespace, includes) : null;
    }
}
exports.MessageDataType = MessageDataType;
//# sourceMappingURL=MessageDataType.js.map
