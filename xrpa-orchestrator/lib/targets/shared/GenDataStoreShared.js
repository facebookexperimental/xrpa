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
exports.genFieldProperties = void 0;
const TypeValue_1 = require("../../shared/TypeValue");
function genFieldProperties(classSpec, params) {
    let bitMask = 0;
    const typeFields = params.reconcilerDef.type.getStateFields();
    for (const fieldName in typeFields) {
        if (params.directionality === "inbound" && !params.reconcilerDef.isInboundField(fieldName)) {
            continue;
        }
        if (params.directionality === "outbound" && !params.reconcilerDef.isOutboundField(fieldName)) {
            continue;
        }
        bitMask |= params.reconcilerDef.type.getFieldBitMask(fieldName);
        params.reconcilerDef.type.declareLocalFieldClassMember(classSpec, fieldName, params.fieldToMemberVar(fieldName), true, [], params.visibility);
    }
    if (params.canCreate) {
        classSpec.members.push({
            name: "createTimestamp",
            type: params.codegen.PRIMITIVE_INTRINSICS.uint64.typename,
            visibility: params.visibility,
        });
        classSpec.members.push({
            name: "changeBits",
            type: params.codegen.PRIMITIVE_INTRINSICS.uint64.typename,
            initialValue: new TypeValue_1.CodeLiteralValue(params.codegen, `${bitMask}`),
            visibility: params.visibility,
        });
    }
    else if (params.canChange && bitMask !== 0) {
        classSpec.members.push({
            name: "changeBits",
            type: params.codegen.PRIMITIVE_INTRINSICS.uint64.typename,
            initialValue: new TypeValue_1.CodeLiteralValue(params.codegen, "0"),
            visibility: params.visibility,
        });
    }
}
exports.genFieldProperties = genFieldProperties;
//# sourceMappingURL=GenDataStoreShared.js.map
