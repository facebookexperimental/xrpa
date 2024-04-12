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

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.genSyntheticObject = void 0;
const path_1 = __importDefault(require("path"));
const GenSyntheticObjectShared_1 = require("../shared/GenSyntheticObjectShared");
const CppCodeGenImpl_1 = require("./CppCodeGenImpl");
const CppCodeGenImpl = __importStar(require("./CppCodeGenImpl"));
function genSyntheticObject(ctx, fileWriter, outdir, syntheticObjectName, objectDef) {
    const filename = `${syntheticObjectName}.h`;
    const classSpec = (0, GenSyntheticObjectShared_1.genSyntheticObjectClassSpec)(ctx, CppCodeGenImpl, syntheticObjectName, objectDef, new CppCodeGenImpl_1.CppIncludeAggregator());
    const lines = [
        `namespace ${ctx.namespace} {`,
        ``,
        ...(0, CppCodeGenImpl_1.genClassDefinition)(classSpec),
        ``,
        `} // namespace ${ctx.namespace}`,
        ``,
    ];
    lines.unshift(...CppCodeGenImpl_1.HEADER, `#pragma once`, ``, ...(classSpec.includes?.getIncludes(filename) ?? []), ``);
    fileWriter.writeFile(path_1.default.join(outdir, filename), lines);
}
exports.genSyntheticObject = genSyntheticObject;
//# sourceMappingURL=GenSyntheticObject.js.map
