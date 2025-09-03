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
exports.genOnMessageAccessor = exports.genMessageHandlerType = exports.genMessageHandlerParams = exports.genMessageMethodParams = exports.getMessageParamNames = exports.getMessageParamName = void 0;
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const TypeValue_1 = require("../../shared/TypeValue");
function getMessageParamName(fieldName) {
    return fieldName;
}
exports.getMessageParamName = getMessageParamName;
function getMessageParamNames(fieldType) {
    const paramNames = {};
    const msgFields = fieldType.getStateFields();
    for (const key in msgFields) {
        paramNames[key] = getMessageParamName(key);
    }
    return paramNames;
}
exports.getMessageParamNames = getMessageParamNames;
function genMessageMethodParams(params) {
    const methodParams = [];
    const msgFields = params.fieldType.getStateFields();
    for (const key in msgFields) {
        const fieldType = msgFields[key].type;
        methodParams.push({
            name: getMessageParamName(key),
            type: fieldType,
        });
    }
    return methodParams;
}
exports.genMessageMethodParams = genMessageMethodParams;
function genMessageHandlerParams(params) {
    const handlerParams = [{
            name: "msgTimestamp",
            type: params.codegen.PRIMITIVE_INTRINSICS.uint64.typename,
        }];
    if (params.fieldType.hasFields()) {
        if (params.expandMessageFields) {
            const msgFields = params.fieldType.getStateFields();
            for (const key in msgFields) {
                const fieldType = msgFields[key].type;
                handlerParams.push({
                    name: getMessageParamName(key),
                    type: fieldType.declareLocalParam(params.namespace, params.includes, ""),
                });
            }
        }
        else {
            handlerParams.push({
                name: "message",
                type: params.fieldType.getReadAccessorType(params.namespace, params.includes),
            });
        }
    }
    return handlerParams;
}
exports.genMessageHandlerParams = genMessageHandlerParams;
function genMessageHandlerType(params) {
    const paramTypes = genMessageHandlerParams(params).map(param => param.type);
    return params.codegen.genEventHandlerType(paramTypes, params.includes);
}
exports.genMessageHandlerType = genMessageHandlerType;
function genOnMessageAccessor(classSpec, params) {
    const handlerType = genMessageHandlerType({
        codegen: params.codegen,
        namespace: classSpec.namespace,
        includes: classSpec.includes,
        fieldType: params.fieldType,
        expandMessageFields: params.expandMessageFields,
    });
    const msgHandler = params.genMsgHandler(params.fieldName);
    classSpec.methods.push({
        name: `on${(0, xrpa_utils_1.upperFirst)(params.fieldName)}`,
        parameters: [{
                name: "handler",
                type: handlerType,
            }],
        body: [
            `${params.codegen.genDeref("", msgHandler)} = handler` + params.codegen.STMT_TERM,
        ],
    });
    classSpec.members.push({
        name: msgHandler,
        type: handlerType,
        initialValue: new TypeValue_1.CodeLiteralValue(module.exports, params.codegen.getNullValue()),
        visibility: "private",
    });
}
exports.genOnMessageAccessor = genOnMessageAccessor;
//# sourceMappingURL=GenMessageAccessorsShared.js.map
