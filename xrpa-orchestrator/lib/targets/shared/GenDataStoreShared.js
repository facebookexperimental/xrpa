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
exports.genFieldProperties = exports.getOutboundCollectionClassName = exports.getInboundCollectionClassName = exports.fieldGetterFuncName = void 0;
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const TypeValue_1 = require("../../shared/TypeValue");
function fieldGetterFuncName(codegen, typeFields, fieldName) {
    return codegen.methodMember(`get${(0, xrpa_utils_1.upperFirst)(fieldName)}`);
}
exports.fieldGetterFuncName = fieldGetterFuncName;
function getInboundCollectionClassName(ctx, typeDef) {
    return `Inbound${typeDef.getReadAccessorType(ctx.namespace, null)}Collection`;
}
exports.getInboundCollectionClassName = getInboundCollectionClassName;
function getOutboundCollectionClassName(ctx, typeDef) {
    return `Outbound${typeDef.getReadAccessorType(ctx.namespace, null)}Collection`;
}
exports.getOutboundCollectionClassName = getOutboundCollectionClassName;
function genFieldProperties(classSpec, params) {
    const typeFields = params.reconcilerDef.type.getStateFields();
    for (const fieldName in typeFields) {
        if (params.directionality === "inbound" && !params.reconcilerDef.isInboundField(fieldName)) {
            continue;
        }
        if (params.directionality === "outbound" && !params.reconcilerDef.isOutboundField(fieldName)) {
            continue;
        }
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
            initialValue: new TypeValue_1.CodeLiteralValue(params.codegen, "0"),
            visibility: params.visibility,
        });
        classSpec.members.push({
            name: "changeByteCount",
            type: params.codegen.PRIMITIVE_INTRINSICS.int32.typename,
            initialValue: new TypeValue_1.CodeLiteralValue(params.codegen, "0"),
            visibility: params.visibility,
        });
        classSpec.members.push({
            name: "createWritten",
            type: params.codegen.PRIMITIVE_INTRINSICS.bool.typename,
            initialValue: new TypeValue_1.CodeLiteralValue(params.codegen, params.codegen.PRIMITIVE_INTRINSICS.FALSE),
            visibility: params.visibility,
        });
    }
    else if (params.canChange && params.reconcilerDef.getOutboundChangeBits() !== 0) {
        classSpec.members.push({
            name: "changeBits",
            type: params.codegen.PRIMITIVE_INTRINSICS.uint64.typename,
            initialValue: new TypeValue_1.CodeLiteralValue(params.codegen, "0"),
            visibility: params.visibility,
        });
        classSpec.members.push({
            name: "changeByteCount",
            type: params.codegen.PRIMITIVE_INTRINSICS.int32.typename,
            initialValue: new TypeValue_1.CodeLiteralValue(params.codegen, "0"),
            visibility: params.visibility,
        });
    }
}
exports.genFieldProperties = genFieldProperties;
//# sourceMappingURL=GenDataStoreShared.js.map
