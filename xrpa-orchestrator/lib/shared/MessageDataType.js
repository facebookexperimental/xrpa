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
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const StructWithAccessorType_1 = require("./StructWithAccessorType");
const TypeDefinition_1 = require("./TypeDefinition");
class MessageDataType extends StructWithAccessorType_1.StructWithAccessorType {
    constructor(codegen, name, apiname, objectUuidType, fields, expectedRatePerSecond) {
        super(codegen, name, apiname, objectUuidType, undefined, fields);
        this.expectedRatePerSecond = expectedRatePerSecond;
    }
    getMetaType() {
        return TypeDefinition_1.TypeMetaType.MESSAGE_DATA;
    }
    hasFields() {
        return !(0, xrpa_utils_1.objectIsEmpty)(this.fields);
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
    getExpectedRatePerSecond() {
        return this.expectedRatePerSecond;
    }
}
exports.MessageDataType = MessageDataType;
//# sourceMappingURL=MessageDataType.js.map
