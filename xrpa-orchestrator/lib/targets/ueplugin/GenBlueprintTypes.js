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
exports.genBlueprintTypes = exports.getMessageDelegateName = exports.getBlueprintTypesHeaderName = void 0;
const path_1 = __importDefault(require("path"));
const TypeDefinition_1 = require("../../shared/TypeDefinition");
const CppCodeGenImpl_1 = require("../cpp/CppCodeGenImpl");
const SceneComponentShared_1 = require("./SceneComponentShared");
function getBlueprintTypesHeaderName(apiname) {
    return `${apiname}BlueprintTypes.h`;
}
exports.getBlueprintTypesHeaderName = getBlueprintTypesHeaderName;
function getMessageDelegateName(msgType, apiname) {
    if (!msgType || !msgType.hasFields()) {
        return `F${apiname}_MessageData_Delegate`;
    }
    return `F${apiname}_${msgType.getName()}_Delegate`;
}
exports.getMessageDelegateName = getMessageDelegateName;
function paramsCountName(num) {
    switch (num) {
        case 0: return "ZeroParams";
        case 1: return "OneParam";
        case 2: return "TwoParams";
        case 3: return "ThreeParams";
        case 4: return "FourParams";
        case 5: return "FiveParams";
        case 6: return "SixParams";
    }
    throw new Error(`Unsupported number of message params: ${num}`);
}
function genMessageDelegateDeclaration(ctx, includes, typeDef) {
    const params = [
        `FDateTime, timestamp`,
    ];
    if (typeDef) {
        const fields = typeDef.getStateFields();
        for (const key in fields) {
            const fieldType = fields[key].type;
            if ((0, TypeDefinition_1.typeIsReference)(fieldType)) {
                params.push(`${(0, SceneComponentShared_1.getComponentClassName)(includes, fieldType.toType)}*, ${key}`);
            }
            else {
                params.push(`${fieldType.declareLocalParam(ctx.namespace, includes, "")}, ${key}`);
            }
        }
    }
    return `DECLARE_DYNAMIC_MULTICAST_DELEGATE_${paramsCountName(params.length)}(${getMessageDelegateName(typeDef, ctx.storeDef.apiname)}, ${params.join(", ")});`;
}
function genTargetSpecificTypes(ctx, includes) {
    const ret = [
        genMessageDelegateDeclaration(ctx, includes, null),
        "",
    ];
    for (const typeDef of ctx.storeDef.datamodel.getAllTypeDefinitions()) {
        if ((0, TypeDefinition_1.typeIsMessageData)(typeDef) && typeDef.hasFields()) {
            ret.push(genMessageDelegateDeclaration(ctx, includes, typeDef), "");
        }
        const lines = typeDef.genTargetSpecificTypeDefinition(ctx.namespace, includes);
        if (lines) {
            ret.push(...lines, "");
        }
    }
    return ret;
}
function genBlueprintTypes(fileWriter, outSrcDir, outHeaderDir, ctx) {
    const headerName = getBlueprintTypesHeaderName(ctx.storeDef.apiname);
    const cppLines = [
        ...CppCodeGenImpl_1.HEADER,
        `#include "${headerName}"`,
        ``,
    ];
    const includes = new CppCodeGenImpl_1.CppIncludeAggregator();
    const customTypeDefs = genTargetSpecificTypes(ctx, includes);
    const headerLines = [
        ...CppCodeGenImpl_1.HEADER,
        `#pragma once`,
        ``,
        ...includes.getIncludes(headerName),
        ``,
        `#include "${headerName.slice(0, -2)}.generated.h"`,
        ``,
        ...customTypeDefs,
    ];
    fileWriter.writeFile(path_1.default.join(outSrcDir, `${headerName.slice(0, -2)}.cpp`), cppLines);
    fileWriter.writeFile(path_1.default.join(outHeaderDir, headerName), headerLines);
}
exports.genBlueprintTypes = genBlueprintTypes;
//# sourceMappingURL=GenBlueprintTypes.js.map
